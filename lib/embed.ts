import OpenAI from "openai";
import { logApiUsage } from "@/lib/usage";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const MODEL = "text-embedding-3-small"; // 1536차원, 03_DATA_MODEL.sql vector(1536)와 일치
const MAX_CHARS = 8000;
const COST_PER_1M_TOKENS = 0.02; // USD

/** 단일 텍스트 임베딩 */
export async function createEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: MODEL,
    input: text.slice(0, MAX_CHARS),
  });
  await logApiUsage({
    source: "openai_embedding",
    tokenInput: response.usage.total_tokens,
    costUsd: (response.usage.total_tokens * COST_PER_1M_TOKENS) / 1_000_000,
    status: "ok",
  });
  return response.data[0].embedding;
}

/** 여러 텍스트 배치 임베딩 (1회 호출) */
export async function createEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const response = await openai.embeddings.create({
    model: MODEL,
    input: texts.map((t) => t.slice(0, MAX_CHARS)),
  });
  await logApiUsage({
    source: "openai_embedding",
    tokenInput: response.usage.total_tokens,
    costUsd: (response.usage.total_tokens * COST_PER_1M_TOKENS) / 1_000_000,
    status: "ok",
  });
  return response.data.map((d) => d.embedding);
}
