const MODELS_REJECTING_EXPLICIT_TOOL_CHOICE = new Set([
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
]);

export function transformOpenRouterRequestBody(args: Record<string, unknown>) {
  const body = routeNitroRequestsToFastestProvider(args);

  if (
    typeof body.model === "string" &&
    MODELS_REJECTING_EXPLICIT_TOOL_CHOICE.has(body.model) &&
    body.tool_choice !== undefined
  ) {
    // OpenRouter's Nvidia Omni endpoint accepts `tools` but currently rejects
    // explicit `tool_choice`; omitting it preserves provider-default auto mode.
    const rest = { ...body };
    delete rest.tool_choice;
    return rest;
  }

  return body;
}

function routeNitroRequestsToFastestProvider(args: Record<string, unknown>) {
  if (typeof args.model !== "string" || !args.model.endsWith(":nitro")) {
    return args;
  }

  const provider =
    args.provider && typeof args.provider === "object" && !Array.isArray(args.provider)
      ? (args.provider as Record<string, unknown>)
      : {};

  return {
    ...args,
    provider: {
      ...provider,
      sort: "throughput",
      allow_fallbacks: false,
    },
  };
}
