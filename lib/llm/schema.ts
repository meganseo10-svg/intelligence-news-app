import { z } from "zod";

export const NewsAnalysisSchema = z.object({
  language: z.object({
    original: z.string(),
    translated_to: z.literal("ko"),
  }),
  title_translated: z.string().min(1).max(200),
  summary_translated: z.string().min(1).max(800),
  category: z.string().min(1).max(50),
  relevance_score: z.number().min(0).max(1),
  importance_score: z.number().min(0).max(1),
  implications: z.object({
    sales_opportunity: z.string(),
    target_customer: z.string(),
    risk_signal: z.string(),
  }),
  tags: z.array(z.string()).min(0).max(10),
  recommended_action: z.string().max(200),
});

export type NewsAnalysis = z.infer<typeof NewsAnalysisSchema>;

export const KeywordSuggestionSchema = z.object({
  competitor: z.array(z.string()).length(3),
  industry: z.array(z.string()).length(3),
  product: z.array(z.string()).length(3),
  general: z.array(z.string()).length(3),
});

export type KeywordSuggestion = z.infer<typeof KeywordSuggestionSchema>;
