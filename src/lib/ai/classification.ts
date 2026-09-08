import * as tf from '@tensorflow/tfjs';
import { prisma } from '../prisma';

export interface DocumentFeatures {
  textLength: number;
  wordCount: number;
  sentenceCount: number;
  avgWordLength: number;
  hasNumbers: boolean;
  hasDates: boolean;
  hasCurrency: boolean;
  hasEmail: boolean;
  hasUrl: boolean;
  paragraphCount: number;
  uppercaseRatio: number;
  digitRatio: number;
  punctuationRatio: number;
}

export interface ClassificationResult {
  category: string;
  confidence: number;
  tags: string[];
  subcategories: string[];
}

const DOCUMENT_CATEGORIES = [
  'invoice',
  'contract',
  'report',
  'resume',
  'letter',
  'presentation',
  'form',
  'manual',
  'proposal',
  'receipt',
  'legal',
  'medical',
  'academic',
  'marketing',
  'financial',
  'technical',
  'correspondence',
  'other'
];

export function extractFeatures(text: string): DocumentFeatures {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  const charCount = text.length;
  const uppercaseCount = (text.match(/[A-Z]/g) || []).length;
  const digitCount = (text.match(/\d/g) || []).length;
  const punctuationCount = (text.match(/[^\w\s]/g) || []).length;
  
  return {
    textLength: charCount,
    wordCount: words.length,
    sentenceCount: sentences.length,
    avgWordLength: words.length > 0 ? words.reduce((sum, w) => sum + w.length, 0) / words.length : 0,
    hasNumbers: /\d/.test(text),
    hasDates: /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}\b/i.test(text),
    hasCurrency: /[$€£¥]\s*\d+|\d+\s*(?:USD|EUR|GBP|dollars?|euros?)/i.test(text),
    hasEmail: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(text),
    hasUrl: /https?:\/\/[^\s]+|www\.[^\s]+/.test(text),
    paragraphCount: paragraphs.length,
    uppercaseRatio: charCount > 0 ? uppercaseCount / charCount : 0,
    digitRatio: charCount > 0 ? digitCount / charCount : 0,
    punctuationRatio: charCount > 0 ? punctuationCount / charCount : 0,
  };
}

export async function classifyDocument(
  documentId: string,
  text: string,
  userId?: string
): Promise<ClassificationResult> {
  const features = extractFeatures(text);
  
  // Rule-based classification with confidence scoring
  const categoryScores = calculateCategoryScores(features, text);
  
  // Get top category
  const sortedCategories = Object.entries(categoryScores)
    .sort((a, b) => b[1] - a[1]);
  
  const topCategory = sortedCategories[0];
  const confidence = topCategory[1];
  
  // Generate tags based on content analysis
  const tags = generateTags(features, text);
  
  // Identify subcategories
  const subcategories = identifySubcategories(topCategory[0], text);
  
  const result: ClassificationResult = {
    category: topCategory[0],
    confidence: Math.min(confidence, 0.99),
    tags,
    subcategories,
  };
  
  // Store classification result if file exists
  if (documentId) {
    await prisma.files.update({
      where: { id: documentId },
      data: {
        classification: result.category,
        tags: result.tags,
        metadata: {
          classificationConfidence: result.confidence,
          classificationFeatures: features,
          subcategories: result.subcategories,
        },
      },
    });
  }
  
  return result;
}

function calculateCategoryScores(features: DocumentFeatures, text: string): Record<string, number> {
  const scores: Record<string, number> = {};
  const lowerText = text.toLowerCase();
  
  // Invoice indicators
  scores.invoice = 0;
  if (features.hasCurrency) scores.invoice += 0.3;
  if (/invoice|bill|payment due|total amount/.test(lowerText)) scores.invoice += 0.4;
  if (features.hasDates) scores.invoice += 0.15;
  if (/invoice\s*#|invoice\s*number/.test(lowerText)) scores.invoice += 0.15;
  
  // Contract indicators
  scores.contract = 0;
  if (/agreement|contract|terms and conditions|party|hereby|witnesseth/.test(lowerText)) scores.contract += 0.5;
  if (features.paragraphCount > 5) scores.contract += 0.2;
  if (features.sentenceCount > 20) scores.contract += 0.15;
  if (/signature|sign here|executed on/.test(lowerText)) scores.contract += 0.15;
  
  // Resume/CV indicators
  scores.resume = 0;
  if (/experience|education|skills|objective|references|curriculum vitae|cv/.test(lowerText)) scores.resume += 0.4;
  if (/@/.test(text) && /\d{3}/.test(text)) scores.resume += 0.2;
  if (features.textLength < 5000 && features.textLength > 500) scores.resume += 0.2;
  if (/work history|professional experience|contact/.test(lowerText)) scores.resume += 0.2;
  
  // Report indicators
  scores.report = 0;
  if (/executive summary|conclusion|methodology|findings|analysis|report/.test(lowerText)) scores.report += 0.4;
  if (features.paragraphCount > 10) scores.report += 0.2;
  if (/table of contents|introduction|appendix/.test(lowerText)) scores.report += 0.25;
  if (features.textLength > 2000) scores.report += 0.15;
  
  // Receipt indicators
  scores.receipt = 0;
  if (/receipt|thank you for your purchase|transaction|cashier/.test(lowerText)) scores.receipt += 0.5;
  if (features.textLength < 1500) scores.receipt += 0.2;
  if (features.hasCurrency) scores.receipt += 0.2;
  if (/item|qty|price|total/.test(lowerText)) scores.receipt += 0.1;
  
  // Legal indicators
  scores.legal = 0;
  if (/court|plaintiff|defendant|attorney|law|statute|regulation|pursuant|whereas/.test(lowerText)) scores.legal += 0.5;
  if (/case\s*#|docket|filing/.test(lowerText)) scores.legal += 0.25;
  if (features.sentenceCount > 30) scores.legal += 0.15;
  if (/hereto|herein|hereinafter|aforementioned/.test(lowerText)) scores.legal += 0.1;
  
  // Financial indicators
  scores.financial = 0;
  if (/balance sheet|income statement|cash flow|audit|financial|annual report|quarterly/.test(lowerText)) scores.financial += 0.5;
  if (features.hasCurrency && features.digitRatio > 0.1) scores.financial += 0.25;
  if (/revenue|expense|asset|liability|equity/.test(lowerText)) scores.financial += 0.25;
  
  // Academic indicators
  scores.academic = 0;
  if (/abstract|introduction|literature review|methodology|results|discussion|references/.test(lowerText)) scores.academic += 0.5;
  if (/university|professor|phd|research|journal/.test(lowerText)) scores.academic += 0.25;
  if (features.textLength > 3000 && features.paragraphCount > 15) scores.academic += 0.15;
  if (/doi:|issn:|isbn:/.test(lowerText)) scores.academic += 0.1;
  
  // Form indicators
  scores.form = 0;
  if (/form|application|fill out|field|required|optional/.test(lowerText)) scores.form += 0.4;
  if (/_+|:_+/.test(text)) scores.form += 0.3;
  if (/name:|address:|phone:|email:/.test(lowerText)) scores.form += 0.2;
  if (features.textLength < 3000) scores.form += 0.1;
  
  // Letter indicators
  scores.letter = 0;
  if (/dear|sincerely|yours truly|regards/.test(lowerText)) scores.letter += 0.4;
  if (features.paragraphCount >= 2 && features.paragraphCount <= 8) scores.letter += 0.25;
  if (features.textLength > 200 && features.textLength < 3000) scores.letter += 0.2;
  if (/to:|from:|date:|subject:/.test(lowerText)) scores.letter += 0.15;
  
  // Presentation indicators
  scores.presentation = 0;
  if (/slide|presentation|bullet|agenda|outline/.test(lowerText)) scores.presentation += 0.4;
  if (/•|\*|\-/.test(text) && features.textLength < 5000) scores.presentation += 0.3;
  if (/title slide|q&a|questions/.test(lowerText)) scores.presentation += 0.2;
  if (features.avgWordLength < 5) scores.presentation += 0.1;
  
  // Technical/Manual indicators
  scores.technical = 0;
  if (/manual|guide|documentation|api|function|class|method|code/.test(lowerText)) scores.technical += 0.4;
  if (/step \d|procedure|instruction|tutorial/.test(lowerText)) scores.technical += 0.3;
  if (features.textLength > 5000) scores.technical += 0.15;
  if (/version|release|update/.test(lowerText)) scores.technical += 0.15;
  
  // Medical indicators
  scores.medical = 0;
  if (/patient|diagnosis|treatment|prescription|medical|health|clinical/.test(lowerText)) scores.medical += 0.5;
  if (/symptoms|medication|dosage|allergies/.test(lowerText)) scores.medical += 0.25;
  if (/dr\.\s+|md|pharmd|r\.n\./.test(lowerText)) scores.medical += 0.15;
  if (/icd-|cpt code|medical record/.test(lowerText)) scores.medical += 0.1;
  
  // Marketing indicators
  scores.marketing = 0;
  if (/marketing|campaign|brand|advertising|promotion|social media/.test(lowerText)) scores.marketing += 0.4;
  if (/roi|conversion|engagement|click-through/.test(lowerText)) scores.marketing += 0.3;
  if (features.uppercaseRatio > 0.1) scores.marketing += 0.15;
  if (/call to action|cta|limited time/.test(lowerText)) scores.marketing += 0.15;
  
  // Correspondence indicators
  scores.correspondence = 0;
  if (/memo|memorandum|cc:|bcc:|thread|re:|fwd:/.test(lowerText)) scores.correspondence += 0.5;
  if (features.hasEmail && features.textLength < 2000) scores.correspondence += 0.3;
  if (/sent from my|original message/.test(lowerText)) scores.correspondence += 0.2;
  
  // Proposal indicators
  scores.proposal = 0;
  if (/proposal|scope of work|deliverables|timeline|budget|solution/.test(lowerText)) scores.proposal += 0.5;
  if (/client|vendor|partner|collaboration/.test(lowerText)) scores.proposal += 0.25;
  if (features.textLength > 1500 && features.paragraphCount > 5) scores.proposal += 0.15;
  if (/why us|our approach|next steps/.test(lowerText)) scores.proposal += 0.1;
  
  return scores;
}

function generateTags(features: DocumentFeatures, text: string): string[] {
  const tags: string[] = [];
  const lowerText = text.toLowerCase();
  
  // Content-based tags
  if (features.hasCurrency) tags.push('financial-data');
  if (features.hasDates) tags.push('dated');
  if (features.hasEmail) tags.push('contact-info');
  if (features.hasUrl) tags.push('web-references');
  if (features.hasNumbers) tags.push('numeric-data');
  
  // Format-based tags
  if (features.textLength < 1000) tags.push('short-document');
  if (features.textLength > 5000) tags.push('long-document');
  if (features.paragraphCount > 20) tags.push('multi-section');
  
  // Language and style tags
  if (features.uppercaseRatio > 0.15) tags.push('formal');
  if (features.punctuationRatio > 0.1) tags.push('detailed');
  if (features.avgWordLength > 6) tags.push('technical-language');
  
  // Domain-specific tags
  if (/confidential|private|proprietary/.test(lowerText)) tags.push('confidential');
  if (/draft|version|revision/.test(lowerText)) tags.push('work-in-progress');
  if (/approved|signed|final/.test(lowerText)) tags.push('finalized');
  if (/urgent|asap|priority/.test(lowerText)) tags.push('urgent');
  if (/template|sample|example/.test(lowerText)) tags.push('template');
  
  return tags.slice(0, 10); // Limit to 10 tags
}

function identifySubcategories(category: string, text: string): string[] {
  const subcategories: string[] = [];
  const lowerText = text.toLowerCase();
  
  switch (category) {
    case 'invoice':
      if (/subscription|recurring|monthly|annual/.test(lowerText)) subcategories.push('recurring');
      if (/purchase order|po#/.test(lowerText)) subcategories.push('purchase-order');
      if (/credit|refund/.test(lowerText)) subcategories.push('credit-memo');
      break;
    case 'contract':
      if (/employment|hire|salary/.test(lowerText)) subcategories.push('employment');
      if (/service|consulting/.test(lowerText)) subcategories.push('service');
      if (/nda|non-disclosure/.test(lowerText)) subcategories.push('nda');
      if (/sla|service level/.test(lowerText)) subcategories.push('sla');
      break;
    case 'resume':
      if (/software|developer|engineer/.test(lowerText)) subcategories.push('technical');
      if (/manager|director|executive/.test(lowerText)) subcategories.push('executive');
      if (/entry|junior|intern/.test(lowerText)) subcategories.push('entry-level');
      break;
    case 'report':
      if (/financial|quarterly|annual/.test(lowerText)) subcategories.push('financial');
      if (/sales|revenue|performance/.test(lowerText)) subcategories.push('sales');
      if (/project|status|progress/.test(lowerText)) subcategories.push('project');
      break;
  }
  
  return subcategories;
}

export async function findSimilarDocuments(
  tenantId: string | null,
  documentText: string,
  threshold: number = 0.7
): Promise<Array<{ id: string; similarity: number; title: string }>> {
  const documents = await prisma.documents.findMany({
    where: { tenantId, status: 'active' },
    select: { id: true, title: true, content: true },
  });
  
  const features = extractFeatures(documentText);
  
  const similarities = documents
    .map(doc => ({
      id: doc.id,
      title: doc.title,
      similarity: calculateSimilarity(features, doc.content || ''),
    }))
    .filter(doc => doc.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 10);
  
  return similarities;
}

function calculateSimilarity(features1: DocumentFeatures, text2: string): number {
  const features2 = extractFeatures(text2);
  
  // Simple cosine similarity on feature vectors
  const keys = Object.keys(features1) as (keyof DocumentFeatures)[];
  const vector1 = keys.map(k => Number(features1[k]) || 0);
  const vector2 = keys.map(k => Number(features2[k]) || 0);
  
  const dotProduct = vector1.reduce((sum, v, i) => sum + v * vector2[i], 0);
  const magnitude1 = Math.sqrt(vector1.reduce((sum, v) => sum + v * v, 0));
  const magnitude2 = Math.sqrt(vector2.reduce((sum, v) => sum + v * v, 0));
  
  if (magnitude1 === 0 || magnitude2 === 0) return 0;
  
  return dotProduct / (magnitude1 * magnitude2);
}
