import "server-only";

import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { transformOpenRouterRequestBody } from "./openrouterRequest";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_PDF_CONTEXT_MODEL = "google/gemini-3.1-flash-lite-preview";
const DEFAULT_NEMOTRON_MODEL = "nvidia/nemotron-3-super-120b-a12b:nitro";

let openRouterProvider: ReturnType<typeof createOpenAICompatible> | null = null;

function getOpenRouterApiKey() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is required");
  }
  return apiKey;
}

export function getOpenRouterProvider() {
  if (!openRouterProvider) {
    openRouterProvider = createOpenAICompatible({
      name: "openrouter",
      apiKey: getOpenRouterApiKey(),
      baseURL: OPENROUTER_BASE_URL,
      includeUsage: true,
      headers: {
        "HTTP-Referer": "https://openhealth.app",
        "X-Title": "OpenHealth",
      },
      transformRequestBody: transformOpenRouterRequestBody,
    });
  }

  return openRouterProvider;
}

export function getPdfContextModelId() {
  return process.env.PDF_CONTEXT_MODEL || DEFAULT_PDF_CONTEXT_MODEL;
}

export function getNemotronModelId() {
  return process.env.NEMOTRON_MODEL || DEFAULT_NEMOTRON_MODEL;
}
