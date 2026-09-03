export type ParaphraseModeId =
  | 'Standard'
  | 'Fluency'
  | 'Formal / Academic'
  | 'Simple / Plain English'
  | 'Creative / Fluent Rewrite'
  | 'Formal → Casual'
  | 'Casual → Formal'
  | 'Shorten / Concise'
  | 'Expand'
  | 'Anti-Plagiarism / Deep Rewrite'
  | 'SEO-Aware'
  | 'Tone-Specific';

export interface ParaphraseModeConfig {
  id: ParaphraseModeId;
  label: string;
  shortTag: string;
  category: 'General' | 'Style & Tone' | 'Length' | 'Specialized';
  description: string;
  guidance: string;
  recommendedTemp: number;
  iconName: string;
  targetLengthNote: string;
}

export interface ParaphraseVariation {
  version: number;
  paraphrasedText: string;
  shortDescription?: string;
}

export interface ChangeSummary {
  keyReplacements?: Array<{ original: string; paraphrased: string }>;
  structuralShift?: string;
  toneAssessment?: string;
  readabilityImpact?: string;
}

export interface ParaphraseResponseData {
  variations: ParaphraseVariation[];
  summaryOfChanges?: ChangeSummary;
  detectedLanguage?: string;
  estimatedOriginalityScore?: number;
}

export interface ParaphraseHistoryItem {
  id: string;
  timestamp: number;
  originalText: string;
  paraphrasedText: string;
  mode: ParaphraseModeId;
  tone?: string;
  keywords?: string[];
  variationsCount: number;
  originalityScore?: number;
}

export interface TextMetrics {
  words: number;
  characters: number;
  sentences: number;
  readingTimeSeconds: number;
  fleschKincaidGrade?: number;
}

export interface DiffSegment {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
}
