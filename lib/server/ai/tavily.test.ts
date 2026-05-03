import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { searchWithTavily } from "./tavily";

describe("searchWithTavily", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("returns parsed Tavily results", async () => {
    vi.stubEnv("TAVILY_API_KEY", "tvly-test");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        query: "CPT 99284",
        answer: "Emergency department visit code.",
        results: [
          {
            title: "CPT 99284",
            url: "https://example.com/cpt-99284",
            content: "Emergency department visit.",
            score: 0.9,
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await searchWithTavily({
      query: "CPT 99284 definition",
      maxResults: 3,
    });

    expect(result.results).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.tavily.com/search",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer tvly-test",
        }),
      }),
    );
  });

  it("throws when Tavily returns an error", async () => {
    vi.stubEnv("TAVILY_API_KEY", "tvly-test");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
      }),
    );

    await expect(
      searchWithTavily({ query: "CPT 99284 definition" }),
    ).rejects.toThrow("429");
  });

  it("throws when the API key is missing", async () => {
    vi.stubEnv("TAVILY_API_KEY", "");

    await expect(
      searchWithTavily({ query: "CPT 99284 definition" }),
    ).rejects.toThrow("TAVILY_API_KEY");
  });
});
