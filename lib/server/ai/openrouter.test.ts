import { describe, expect, it } from "vitest";
import { transformOpenRouterRequestBody } from "./openrouterRequest";

describe("transformOpenRouterRequestBody", () => {
  it("omits tool_choice for Nemotron 3 Nano Omni requests", () => {
    const body = transformOpenRouterRequestBody({
      model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
      tools: [{ type: "function" }],
      tool_choice: "auto",
    });

    expect(body).toEqual({
      model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
      tools: [{ type: "function" }],
    });
  });

  it("preserves tool_choice for Nemotron 3 Super Nitro requests", () => {
    const body = transformOpenRouterRequestBody({
      model: "nvidia/nemotron-3-super-120b-a12b:nitro",
      tools: [{ type: "function" }],
      tool_choice: "auto",
    });

    expect(body).toEqual({
      model: "nvidia/nemotron-3-super-120b-a12b:nitro",
      tools: [{ type: "function" }],
      tool_choice: "auto",
      provider: {
        sort: "throughput",
        allow_fallbacks: false,
      },
    });
  });

  it("routes Nitro requests only to the fastest provider", () => {
    const body = transformOpenRouterRequestBody({
      model: "nvidia/nemotron-3-super-120b-a12b:nitro",
      provider: {
        require_parameters: true,
      },
    });

    expect(body).toEqual({
      model: "nvidia/nemotron-3-super-120b-a12b:nitro",
      provider: {
        require_parameters: true,
        sort: "throughput",
        allow_fallbacks: false,
      },
    });
  });
});
