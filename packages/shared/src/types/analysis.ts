import type { AnalysisSource } from '../constants/analysis-source';

export type AnalysisResult = {
  id: string;
  dishName: string;
  calories: number;
  confidence: number;
  source: AnalysisSource;
  imageUrl: string;
  createdAt: string;
};

export type AnalysisListResponse = {
  items: AnalysisResult[];
  nextCursor: string | null;
};
