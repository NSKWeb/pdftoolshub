import OpenAI from 'openai';
import { prisma } from '../prisma';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type AIAnalysisType = 
  | 'summarize' 
  | 'extract_entities' 
  | 'classify' 
  | 'optimize' 
  | 'quality_check'
  | 'layout_suggestions'
  | 'content_analysis';

export interface AIAnalysisResult {
  summary?: string;
  entities?: Array<{ type: string; value: string; confidence: number }>;
  classification?: { category: string; confidence: number; tags: string[] };
  optimization?: Array<{ issue: string; suggestion: string; priority: 'high' | 'medium' | 'low' }>;
  quality?: { score: number; issues: string[]; recommendations: string[] };
  layout?: Array<{ type: string; suggestion: string; impact: string }>;
  content?: { sentiment: string; keyTopics: string[]; readabilityScore: number };
}

export async function analyzeDocument(
  userId: string,
  fileId: string,
  analysisType: AIAnalysisType,
  content: string,
  options?: { language?: string; detailLevel?: 'brief' | 'standard' | 'detailed' }
): Promise<AIAnalysisResult> {
  const startTime = Date.now();
  
  try {
    let prompt = buildAnalysisPrompt(analysisType, content, options);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert document analysis AI. Analyze the provided document content and return structured insights.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    const processingTime = Date.now() - startTime;
    const tokensUsed = completion.usage?.total_tokens || 0;

    await prisma.aiJobs.create({
      data: {
        userId,
        fileId,
        jobType: analysisType,
        aiModel: 'gpt-4-turbo-preview',
        status: 'completed',
        inputData: { content: content.substring(0, 1000), options },
        outputData: result,
        confidenceScore: result.confidence || 0.9,
        processingTime,
        tokensUsed,
        cost: (tokensUsed / 1000) * 0.03,
      },
    });

    return result;
  } catch (error: any) {
    await prisma.aiJobs.create({
      data: {
        userId,
        fileId,
        jobType: analysisType,
        aiModel: 'gpt-4-turbo-preview',
        status: 'failed',
        inputData: { content: content.substring(0, 1000), options },
        errorMessage: error.message,
        processingTime: Date.now() - startTime,
      },
    });
    throw error;
  }
}

function buildAnalysisPrompt(
  type: AIAnalysisType, 
  content: string, 
  options?: { language?: string; detailLevel?: 'brief' | 'standard' | 'detailed' }
): string {
  const detailLevel = options?.detailLevel || 'standard';
  
  const prompts: Record<AIAnalysisType, string> = {
    summarize: `Summarize the following document content. Provide a ${detailLevel} summary in ${options?.language || 'English'}.
    Return JSON format: { "summary": "...", "confidence": 0.95, "keyPoints": ["..."] }`,
    
    extract_entities: `Extract all named entities from the following document content.
    Return JSON format: { "entities": [{ "type": "person|organization|location|date|amount", "value": "...", "confidence": 0.95 }] }`,
    
    classify: `Classify the following document into the most appropriate category and suggest relevant tags.
    Return JSON format: { "classification": { "category": "...", "confidence": 0.95, "tags": ["..."] } }`,
    
    optimize: `Analyze the following document for optimization opportunities. Check for formatting issues, accessibility, compression potential, and structure improvements.
    Return JSON format: { "optimization": [{ "issue": "...", "suggestion": "...", "priority": "high|medium|low" }] }`,
    
    quality_check: `Perform a quality assessment on the following document content. Check for errors, inconsistencies, completeness, and professionalism.
    Return JSON format: { "quality": { "score": 0-100, "issues": ["..."], "recommendations": ["..."] } }`,
    
    layout_suggestions: `Analyze the document structure and provide layout and design suggestions for better readability and visual appeal.
    Return JSON format: { "layout": [{ "type": "typography|spacing|structure|visual", "suggestion": "...", "impact": "high|medium|low" }] }`,
    
    content_analysis: `Perform a comprehensive content analysis including sentiment, key topics, and readability assessment.
    Return JSON format: { "content": { "sentiment": "positive|negative|neutral", "keyTopics": ["..."], "readabilityScore": 0-100 } }`,
  };

  return `${prompts[type]}

Document content:
${content.substring(0, 8000)}`;
}

export async function generateDocumentMetadata(content: string): Promise<{
  title: string;
  description: string;
  keywords: string[];
  suggestedCategory: string;
}> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'Generate appropriate metadata for the provided document content.'
      },
      {
        role: 'user',
        content: `Generate metadata for this document:
${content.substring(0, 4000)}

Return JSON format: { "title": "...", "description": "...", "keywords": ["..."], "suggestedCategory": "..." }`
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  return JSON.parse(completion.choices[0].message.content || '{}');
}

export async function compareDocuments(doc1: string, doc2: string): Promise<{
  similarity: number;
  differences: string[];
  commonSections: string[];
}> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'Compare two documents and identify similarities and differences.'
      },
      {
        role: 'user',
        content: `Compare these two documents:

Document 1:
${doc1.substring(0, 3000)}

Document 2:
${doc2.substring(0, 3000)}

Return JSON format: { "similarity": 0-100, "differences": ["..."], "commonSections": ["..."] }`
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  return JSON.parse(completion.choices[0].message.content || '{}');
}

export async function answerDocumentQuestion(documentContent: string, question: string): Promise<{
  answer: string;
  confidence: number;
  sourceSection?: string;
}> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'Answer questions based on the provided document content. Be precise and cite relevant sections.'
      },
      {
        role: 'user',
        content: `Document content:
${documentContent.substring(0, 6000)}

Question: ${question}

Return JSON format: { "answer": "...", "confidence": 0-100, "sourceSection": "..." }`
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  return JSON.parse(completion.choices[0].message.content || '{}');
}
