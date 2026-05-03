const MODELS_REJECTING_EXPLICIT_TOOL_CHOICE = new Set([
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
]);

export function transformOpenRouterRequestBody(args: Record<string, unknown>) {
  if (
    typeof args.model === "string" &&
    MODELS_REJECTING_EXPLICIT_TOOL_CHOICE.has(args.model) &&
    args.tool_choice !== undefined
  ) {
    // OpenRouter's Nvidia Omni endpoint accepts `tools` but currently rejects
    // explicit `tool_choice`; omitting it preserves provider-default auto mode.
    const rest = { ...args };
    delete rest.tool_choice;
    return rest;
  }

  return args;
}
