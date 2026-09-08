import { prisma } from '../prisma';

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'delay' | 'notification' | 'pdf_operation';
  label: string;
  config: Record<string, any>;
  position?: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
}

export interface WorkflowDefinition {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export type WorkflowTriggerType = 
  | 'file_uploaded'
  | 'file_processed'
  | 'scheduled'
  | 'webhook'
  | 'api_call'
  | 'email_received'
  | 'user_action'
  | 'document_classified';

export interface WorkflowTrigger {
  type: WorkflowTriggerType;
  config: Record<string, any>;
}

export interface WorkflowRunContext {
  workflowRunId: string;
  userId: string;
  tenantId?: string;
  fileId?: string;
  inputData: Record<string, any>;
  variables: Record<string, any>;
  currentNodeId?: string;
}

export class WorkflowEngine {
  async createWorkflow(
    userId: string,
    tenantId: string | null,
    name: string,
    description: string | null,
    definition: WorkflowDefinition,
    triggers: WorkflowTrigger[]
  ) {
    return prisma.workflows.create({
      data: {
        userId,
        tenantId,
        name,
        description,
        definition,
        triggers,
        nodes: definition.nodes,
        edges: definition.edges,
        isActive: true,
      },
    });
  }

  async startWorkflowRun(
    workflowId: string,
    userId: string,
    tenantId: string | null,
    fileId: string | null,
    inputData: Record<string, any>
  ) {
    const workflowRun = await prisma.workflowRuns.create({
      data: {
        workflowId,
        userId,
        tenantId,
        fileId,
        inputData,
        status: 'running',
        currentNodeId: this.getStartNodeId(workflowId),
        progress: 0,
      },
    });

    // Start processing asynchronously
    this.processWorkflowRun(workflowRun.id);

    return workflowRun;
  }

  private async getStartNodeId(workflowId: string): Promise<string | null> {
    const workflow = await prisma.workflows.findUnique({
      where: { id: workflowId },
      select: { nodes: true },
    });

    if (!workflow || !workflow.nodes) return null;

    const nodes = workflow.nodes as WorkflowNode[];
    const triggerNode = nodes.find(n => n.type === 'trigger');
    return triggerNode?.id || null;
  }

  async processWorkflowRun(workflowRunId: string) {
    const run = await prisma.workflowRuns.findUnique({
      where: { id: workflowRunId },
      include: { workflow: true },
    });

    if (!run || !run.workflow) return;

    const definition = run.workflow.definition as WorkflowDefinition;
    const context: WorkflowRunContext = {
      workflowRunId: run.id,
      userId: run.userId,
      tenantId: run.tenantId || undefined,
      fileId: run.fileId || undefined,
      inputData: (run.inputData as Record<string, any>) || {},
      variables: {},
      currentNodeId: run.currentNodeId || undefined,
    };

    try {
      const nodeIds = this.getExecutionOrder(definition);
      const totalNodes = nodeIds.length;

      for (let i = 0; i < nodeIds.length; i++) {
        const nodeId = nodeIds[i];
        const node = definition.nodes.find(n => n.id === nodeId);
        
        if (!node) continue;

        // Update current node
        await prisma.workflowRuns.update({
          where: { id: workflowRunId },
          data: {
            currentNodeId: nodeId,
            progress: Math.round((i / totalNodes) * 100),
          },
        });

        // Execute node
        const result = await this.executeNode(node, context);
        
        // Store result in context
        context.variables[nodeId] = result;

        // Check for conditions on outgoing edges
        const outgoingEdges = definition.edges.filter(e => e.source === nodeId);
        
        for (const edge of outgoingEdges) {
          if (edge.condition && !this.evaluateCondition(edge.condition, context)) {
            // Skip this branch
            const skipIndex = nodeIds.indexOf(edge.target);
            if (skipIndex > i) {
              nodeIds.splice(skipIndex, 1);
            }
          }
        }

        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Mark as completed
      await prisma.workflowRuns.update({
        where: { id: workflowRunId },
        data: {
          status: 'completed',
          progress: 100,
          outputData: context.variables,
          completedAt: new Date(),
        },
      });

    } catch (error: any) {
      await prisma.workflowRuns.update({
        where: { id: workflowRunId },
        data: {
          status: 'failed',
          errorMessage: error.message,
        },
      });
    }
  }

  private getExecutionOrder(definition: WorkflowDefinition): string[] {
    const visited = new Set<string>();
    const order: string[] = [];

    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      
      // Find outgoing edges
      const outgoingEdges = definition.edges.filter(e => e.source === nodeId);
      
      for (const edge of outgoingEdges) {
        visit(edge.target);
      }
      
      order.push(nodeId);
    };

    // Start from trigger nodes
    const triggerNodes = definition.nodes.filter(n => n.type === 'trigger');
    for (const node of triggerNodes) {
      visit(node.id);
    }

    return order;
  }

  private async executeNode(node: WorkflowNode, context: WorkflowRunContext): Promise<any> {
    switch (node.type) {
      case 'trigger':
        return this.executeTriggerNode(node, context);
      case 'action':
        return this.executeActionNode(node, context);
      case 'condition':
        return this.executeConditionNode(node, context);
      case 'delay':
        return this.executeDelayNode(node, context);
      case 'notification':
        return this.executeNotificationNode(node, context);
      case 'pdf_operation':
        return this.executePdfOperationNode(node, context);
      default:
        return null;
    }
  }

  private async executeTriggerNode(node: WorkflowNode, context: WorkflowRunContext): Promise<any> {
    // Trigger nodes just pass through the input data
    return context.inputData;
  }

  private async executeActionNode(node: WorkflowNode, context: WorkflowRunContext): Promise<any> {
    const { actionType, config } = node.config;

    switch (actionType) {
      case 'send_email':
        return this.actionSendEmail(config, context);
      case 'webhook_call':
        return this.actionWebhookCall(config, context);
      case 'update_metadata':
        return this.actionUpdateMetadata(config, context);
      case 'move_file':
        return this.actionMoveFile(config, context);
      case 'copy_file':
        return this.actionCopyFile(config, context);
      case 'delete_file':
        return this.actionDeleteFile(config, context);
      case 'create_task':
        return this.actionCreateTask(config, context);
      default:
        return { success: false, error: 'Unknown action type' };
    }
  }

  private async executeConditionNode(node: WorkflowNode, context: WorkflowRunContext): Promise<any> {
    const { condition } = node.config;
    const result = this.evaluateCondition(condition, context);
    return { condition, result, evaluatedAt: new Date() };
  }

  private async executeDelayNode(node: WorkflowNode, context: WorkflowRunContext): Promise<any> {
    const { duration, unit } = node.config;
    const delayMs = unit === 'minutes' ? duration * 60 * 1000 :
                    unit === 'hours' ? duration * 60 * 60 * 1000 :
                    unit === 'days' ? duration * 24 * 60 * 60 * 1000 :
                    duration * 1000;
    
    await new Promise(resolve => setTimeout(resolve, delayMs));
    return { delayed: true, duration, unit };
  }

  private async executeNotificationNode(node: WorkflowNode, context: WorkflowRunContext): Promise<any> {
    const { channel, message, recipients } = node.config;

    await prisma.notifications.create({
      data: {
        userId: context.userId,
        type: 'workflow',
        title: 'Workflow Notification',
        message: this.interpolateTemplate(message, context),
        data: { workflowRunId: context.workflowRunId, channel },
      },
    });

    return { notified: true, channel, recipients };
  }

  private async executePdfOperationNode(node: WorkflowNode, context: WorkflowRunContext): Promise<any> {
    const { operation, config: opConfig } = node.config;

    // This would integrate with existing PDF tools
    return {
      operation,
      config: opConfig,
      status: 'queued',
      fileId: context.fileId,
    };
  }

  private evaluateCondition(condition: string, context: WorkflowRunContext): boolean {
    try {
      // Simple condition evaluation - in production, use a proper expression parser
      const variables = { ...context.inputData, ...context.variables };
      
      // Replace variable placeholders
      let evaluatedCondition = condition;
      for (const [key, value] of Object.entries(variables)) {
        evaluatedCondition = evaluatedCondition.replace(
          new RegExp(`{{${key}}}`, 'g'),
          JSON.stringify(value)
        );
      }

      // Basic comparisons
      if (evaluatedCondition.includes('==')) {
        const [left, right] = evaluatedCondition.split('==').map(s => s.trim());
        return left === right;
      }
      if (evaluatedCondition.includes('!=')) {
        const [left, right] = evaluatedCondition.split('!=').map(s => s.trim());
        return left !== right;
      }
      if (evaluatedCondition.includes('>')) {
        const [left, right] = evaluatedCondition.split('>').map(s => parseFloat(s.trim()));
        return left > right;
      }
      if (evaluatedCondition.includes('<')) {
        const [left, right] = evaluatedCondition.split('<').map(s => parseFloat(s.trim()));
        return left < right;
      }

      // Contains check
      if (evaluatedCondition.includes('contains')) {
        const match = evaluatedCondition.match(/(.+)\s+contains\s+(.+)/i);
        if (match) {
          const [, haystack, needle] = match;
          return haystack.toLowerCase().includes(needle.toLowerCase());
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  private interpolateTemplate(template: string, context: WorkflowRunContext): string {
    let result = template;
    const variables = { ...context.inputData, ...context.variables };
    
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
    
    return result;
  }

  // Action implementations
  private async actionSendEmail(config: any, context: WorkflowRunContext) {
    // Integrate with email service (SendGrid, etc.)
    return { sent: true, to: config.to, subject: config.subject };
  }

  private async actionWebhookCall(config: any, context: WorkflowRunContext) {
    const { url, method = 'POST', headers = {} } = config;
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({
          workflowRunId: context.workflowRunId,
          data: context.variables,
        }),
      });

      return { 
        success: response.ok, 
        status: response.status,
        response: await response.text(),
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private async actionUpdateMetadata(config: any, context: WorkflowRunContext) {
    if (!context.fileId) return { success: false, error: 'No file ID' };

    await prisma.files.update({
      where: { id: context.fileId },
      data: {
        metadata: config.metadata,
        tags: config.tags,
      },
    });

    return { success: true, fileId: context.fileId };
  }

  private async actionMoveFile(config: any, context: WorkflowRunContext) {
    return { success: true, action: 'move', destination: config.destination };
  }

  private async actionCopyFile(config: any, context: WorkflowRunContext) {
    return { success: true, action: 'copy', destination: config.destination };
  }

  private async actionDeleteFile(config: any, context: WorkflowRunContext) {
    return { success: true, action: 'delete' };
  }

  private async actionCreateTask(config: any, context: WorkflowRunContext) {
    return { 
      success: true, 
      taskId: `task-${Date.now()}`,
      title: config.title,
      assignee: config.assignee,
    };
  }
}

export const workflowEngine = new WorkflowEngine();
