import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export interface AutomationJobInput {
  tenantId?: string;
  userId?: string;
  jobType: string;
  automationType: 'classification' | 'routing' | 'qa' | 'extraction' | 'summarization';
  inputData: Record<string, unknown>;
  mlModelId?: string;
}

export async function createAutomationJob(input: AutomationJobInput) {
  return await prisma.aIAutomationJobs.create({
    data: {
      tenantId: input.tenantId,
      userId: input.userId,
      jobType: input.jobType,
      automationType: input.automationType,
      inputData: input.inputData,
      mlModelId: input.mlModelId,
      status: 'pending',
      retryCount: 0
    }
  });
}

export async function processAutomationJob(jobId: string) {
  const job = await prisma.aIAutomationJobs.findUnique({
    where: { id: jobId }
  });
  
  if (!job) {
    throw new Error('Job not found');
  }
  
  const startTime = Date.now();
  
  try {
    await prisma.aIAutomationJobs.update({
      where: { id: jobId },
      data: { status: 'processing', startedAt: new Date() }
    });
    
    let result: Record<string, unknown>;
    let confidenceScore = 0;
    
    switch (job.automationType) {
      case 'classification':
        const classificationResult = await classifyDocument(
          job.inputData as { content: string; fileType?: string }
        );
        result = classificationResult;
        confidenceScore = classificationResult.confidence;
        break;
        
      case 'routing':
        const routingResult = await routeDocument(
          job.inputData as { content: string; metadata?: Record<string, unknown> }
        );
        result = routingResult;
        confidenceScore = routingResult.confidence;
        break;
        
      case 'qa':
        const qaResult = await performQualityAssurance(
          job.inputData as { documentId: string; checkTypes?: string[] }
        );
        result = qaResult;
        confidenceScore = qaResult.qualityScore / 100;
        break;
        
      case 'extraction':
        const extractionResult = await extractInformation(
          job.inputData as { content: string; extractionType: string }
        );
        result = extractionResult;
        confidenceScore = extractionResult.confidence;
        break;
        
      case 'summarization':
        const summaryResult = await generateSummary(
          job.inputData as { content: string; maxLength?: number }
        );
        result = summaryResult;
        confidenceScore = 0.85;
        break;
        
      default:
        throw new Error(`Unknown automation type: ${job.automationType}`);
    }
    
    const executionTime = Date.now() - startTime;
    
    await prisma.aIAutomationJobs.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        outputData: result,
        confidenceScore,
        executionTime,
        completedAt: new Date()
      }
    });
    
    return { success: true, result, confidenceScore };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    await prisma.aIAutomationJobs.update({
      where: { id: jobId },
      data: {
        status: job.retryCount >= 3 ? 'failed' : 'pending',
        errorMessage,
        retryCount: { increment: 1 }
      }
    });
    
    return { success: false, error: errorMessage };
  }
}

async function classifyDocument(input: { content: string; fileType?: string }): Promise<{
  category: string;
  subcategory: string;
  confidence: number;
  tags: string[];
}> {
  // Use OpenAI for classification
  const prompt = `Classify the following document content into one of these categories:
  - Invoice
  - Contract
  - Resume/CV
  - Report
  - Receipt
  - Legal Document
  - Medical Document
  - Academic Paper
  - Marketing Material
  - Financial Document
  - Technical Document
  - Correspondence
  - Form
  - Presentation
  - Manual/Guide
  
  Document content (first 2000 chars): ${input.content.slice(0, 2000)}
  
  Respond in JSON format with: category, subcategory, confidence (0-1), and tags (array)`;
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });
    
    const result = JSON.parse(response.choices[0]?.message?.content ?? '{}');
    
    return {
      category: result.category ?? 'Other',
      subcategory: result.subcategory ?? '',
      confidence: result.confidence ?? 0.5,
      tags: result.tags ?? []
    };
  } catch {
    // Fallback to simple keyword matching
    return fallbackClassification(input.content);
  }
}

function fallbackClassification(content: string): {
  category: string;
  subcategory: string;
  confidence: number;
  tags: string[];
} {
  const text = content.toLowerCase();
  
  const categories: { [key: string]: { keywords: string[]; subcategories: { [key: string]: string[] } } } = {
    'Invoice': {
      keywords: ['invoice', 'bill', 'payment due', 'total amount', 'tax'],
      subcategories: {
        'Sales': ['sold to', 'product', 'service'],
        'Service': ['service provided', 'hours', 'consulting']
      }
    },
    'Contract': {
      keywords: ['agreement', 'contract', 'terms', 'parties', 'hereby'],
      subcategories: {
        'Employment': ['employment', 'salary', 'position'],
        'Service': ['service agreement', 'scope of work']
      }
    },
    'Resume': {
      keywords: ['experience', 'skills', 'education', 'contact', 'objective'],
      subcategories: {}
    }
  };
  
  let bestCategory = 'Other';
  let maxMatches = 0;
  
  for (const [category, data] of Object.entries(categories)) {
    const matches = data.keywords.filter(kw => text.includes(kw)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      bestCategory = category;
    }
  }
  
  return {
    category: bestCategory,
    subcategory: '',
    confidence: Math.min(0.7, 0.3 + maxMatches * 0.1),
    tags: []
  };
}

async function routeDocument(input: { content: string; metadata?: Record<string, unknown> }): Promise<{
  routeTo: string;
  priority: 'low' | 'medium' | 'high';
  confidence: number;
  reason: string;
}> {
  // Get active routing rules
  const rules = await prisma.documentRoutingRules.findMany({
    where: { isActive: true },
    orderBy: { priority: 'desc' }
  });
  
  for (const rule of rules) {
    const conditions = rule.conditions as Record<string, unknown>;
    
    // Check if conditions match
    if (matchesConditions(input, conditions)) {
      // Update match count
      await prisma.documentRoutingRules.update({
        where: { id: rule.id },
        data: {
          matchCount: { increment: 1 },
          successRate: rule.matchCount > 0 
            ? (rule.successRate * rule.matchCount + 1) / (rule.matchCount + 1)
            : 1
        }
      });
      
      const actions = rule.actions as Record<string, unknown>;
      
      return {
        routeTo: actions.routeTo as string,
        priority: actions.priority as 'low' | 'medium' | 'high',
        confidence: 0.85,
        reason: `Matched rule: ${rule.name}`
      };
    }
  }
  
  return {
    routeTo: 'default',
    priority: 'medium',
    confidence: 0.5,
    reason: 'No matching rules found'
  };
}

function matchesConditions(
  input: { content: string; metadata?: Record<string, unknown> },
  conditions: Record<string, unknown>
): boolean {
  // Simple condition matching
  if (conditions.keywords) {
    const keywords = conditions.keywords as string[];
    const content = input.content.toLowerCase();
    if (!keywords.some(kw => content.includes(kw.toLowerCase()))) {
      return false;
    }
  }
  
  if (conditions.fileType && input.metadata?.fileType) {
    if (input.metadata.fileType !== conditions.fileType) {
      return false;
    }
  }
  
  return true;
}

async function performQualityAssurance(input: {
  documentId: string;
  checkTypes?: string[];
}): Promise<{
  qualityScore: number;
  issues: Array<{ type: string; severity: string; description: string }>;
  recommendations: string[];
}> {
  // Get document
  const document = await prisma.documents.findUnique({
    where: { id: input.documentId }
  });
  
  if (!document) {
    throw new Error('Document not found');
  }
  
  const issues: Array<{ type: string; severity: string; description: string }> = [];
  let qualityScore = 100;
  
  // Check content quality
  if (!document.content || document.content.length < 50) {
    issues.push({
      type: 'content',
      severity: 'high',
      description: 'Document content is too short or missing'
    });
    qualityScore -= 30;
  }
  
  // Check metadata
  if (!document.metadata || Object.keys(document.metadata).length === 0) {
    issues.push({
      type: 'metadata',
      severity: 'medium',
      description: 'Document metadata is missing'
    });
    qualityScore -= 15;
  }
  
  // Check classification
  if (!document.classification) {
    issues.push({
      type: 'classification',
      severity: 'low',
      description: 'Document is not classified'
    });
    qualityScore -= 10;
  }
  
  // Save QA record
  await prisma.aIQualityAssurance.create({
    data: {
      documentId: input.documentId,
      tenantId: document.tenantId ?? undefined,
      checkType: 'automated',
      qualityScore: Math.max(0, qualityScore),
      issues,
      recommendations: issues.map(i => `Fix ${i.type}: ${i.description}`)
    }
  });
  
  return {
    qualityScore: Math.max(0, qualityScore),
    issues,
    recommendations: issues.map(i => `Fix ${i.type}: ${i.description}`)
  };
}

async function extractInformation(input: {
  content: string;
  extractionType: string;
}): Promise<{
  extractedData: Record<string, unknown>;
  confidence: number;
}> {
  // Placeholder for information extraction
  return {
    extractedData: { type: input.extractionType },
    confidence: 0.75
  };
}

async function generateSummary(input: {
  content: string;
  maxLength?: number;
}): Promise<{
  summary: string;
  keyPoints: string[];
}> {
  const maxLength = input.maxLength ?? 200;
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{
        role: 'user',
        content: `Summarize the following text in ${maxLength} characters or less. Also extract 3-5 key points.
        
        Text: ${input.content.slice(0, 4000)}
        
        Respond in JSON format with: summary and keyPoints (array)`
      }],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });
    
    const result = JSON.parse(response.choices[0]?.message?.content ?? '{}');
    
    return {
      summary: result.summary ?? input.content.slice(0, maxLength),
      keyPoints: result.keyPoints ?? []
    };
  } catch {
    return {
      summary: input.content.slice(0, maxLength),
      keyPoints: []
    };
  }
}

export async function getPendingJobs(limit: number = 10) {
  return await prisma.aIAutomationJobs.findMany({
    where: { status: 'pending' },
    orderBy: { createdAt: 'asc' },
    take: limit
  });
}

export async function getJobStats(timeRange: '1h' | '24h' | '7d') {
  const hours = { '1h': 1, '24h': 24, '7d': 168 };
  const since = new Date(Date.now() - hours[timeRange] * 60 * 60 * 1000);
  
  const [total, completed, failed, avgExecutionTime] = await Promise.all([
    prisma.aIAutomationJobs.count({ where: { createdAt: { gte: since } } }),
    prisma.aIAutomationJobs.count({ where: { createdAt: { gte: since }, status: 'completed' } }),
    prisma.aIAutomationJobs.count({ where: { createdAt: { gte: since }, status: 'failed' } }),
    prisma.aIAutomationJobs.aggregate({
      where: {
        createdAt: { gte: since },
        status: 'completed'
      },
      _avg: { executionTime: true }
    })
  ]);
  
  return {
    total,
    completed,
    failed,
    successRate: total > 0 ? (completed / total) * 100 : 0,
    avgExecutionTime: Math.round(avgExecutionTime._avg.executionTime ?? 0)
  };
}
