import "server-only";

import { z } from "zod";

const TAVILY_SEARCH_URL = "https://api.tavily.com/search";

const tavilyResultSchema = z.object({
  title: z.string().optional(),
  url: z.string().url(),
  content: z.string().optional(),
  score: z.number().optional(),
});

const tavilyResponseSchema = z.object({
  query: z.string(),
  answer: z.string().optional(),
  results: z.array(tavilyResultSchema),
});

export type TavilySearchResult = z.infer<typeof tavilyResultSchema>;

export async function searchWithTavily({
  query,
  maxResults = 5,
}: {
  query: string;
  maxResults?: number;
}) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error("TAVILY_API_KEY environment variable is required");
  }

  const response = await fetch(TAVILY_SEARCH_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      search_depth: "basic",
      topic: "general",
      include_answer: "basic",
      include_raw_content: false,
      max_results: Math.min(Math.max(maxResults, 1), 8),
    }),
  });

  if (!response.ok) {
    throw new Error(`Tavily search failed with status ${response.status}`);
  }

  const json = await response.json();
  return tavilyResponseSchema.parse(json);
}
