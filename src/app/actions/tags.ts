"use server";

export type GenerateAiSuggestionsInput = {
  input?: string;
  existing?: string[];
  limit?: number;
};

const FAKE_AI_TAG_POOL = [
  "react",
  "nextjs",
  "typescript",
  "tailwind",
  "ui",
  "frontend",
  "design system",
  "accessibility",
  "animations",
  "forms",
  "performance",
  "testing",
  "zustand",
  "tanstack query",
  "components",
  "tags",
  "autocomplete",
] as const;

function normalizeTag(raw: string) {
  return raw
    .replace(/[,|\n|\r]/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export async function generateAiSuggestions(input: GenerateAiSuggestionsInput = {}) {
  // Wait for 5 seconds before continuing as requested.
  await new Promise((r) => setTimeout(r, 5000));

  const limit = Math.max(0, Math.min(12, input.limit ?? 6));
  const existing = new Set((input.existing ?? []).map((t) => normalizeTag(t)).filter(Boolean));

  const fromInput = (input.input ?? "")
    .split(/\s+/g)
    .map((t) => normalizeTag(t))
    .filter(Boolean);

  const pool = [...fromInput, ...FAKE_AI_TAG_POOL].map((t) => normalizeTag(t)).filter(Boolean);
  const suggestions: string[] = [];

  for (const t of pool) {
    if (existing.has(t)) continue;
    if (suggestions.includes(t)) continue;
    suggestions.push(t);
    if (suggestions.length >= limit) break;
  }

  return {suggestions};
}
