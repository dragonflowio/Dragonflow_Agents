import { describe, expect, it } from "vitest";
import { createGoogleProvider } from "./google.js";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

describe("createGoogleProvider", () => {
  it("posts to generateContent and parses text", async () => {
    let calledUrl = "";
    const provider = createGoogleProvider({
      apiKey: "ai-x",
      fetch: async (url) => {
        calledUrl = url as string;
        return jsonResponse({
          candidates: [{ content: { parts: [{ text: "hi there" }] } }],
          usageMetadata: { promptTokenCount: 2, candidatesTokenCount: 3 },
        });
      },
    });
    const out = await provider.generate({
      model: "gemini-2.0-flash-001",
      system: "be helpful",
      messages: [{ role: "user", content: "hi" }],
      max_tokens: 100,
    });
    expect(out.content).toBe("hi there");
    expect(out.usage).toEqual({ input_tokens: 2, output_tokens: 3 });
    expect(calledUrl).toContain("gemini-2.0-flash-001:generateContent");
    expect(calledUrl).toContain("key=ai-x");
  });

  it("forwards temperature in generationConfig when provided and omits it when undefined", async () => {
    const seenBodies: Array<Record<string, unknown>> = [];
    const provider = createGoogleProvider({
      apiKey: "k",
      fetch: async (_url, init) => {
        seenBodies.push(JSON.parse((init as RequestInit).body as string));
        return jsonResponse({
          candidates: [{ content: { parts: [{ text: "ok" }] } }],
          usageMetadata: { promptTokenCount: 0, candidatesTokenCount: 0 },
        });
      },
    });
    await provider.generate({
      model: "m",
      system: "",
      messages: [{ role: "user", content: "x" }],
      max_tokens: 10,
      temperature: 0.4,
    });
    await provider.generate({
      model: "m",
      system: "",
      messages: [{ role: "user", content: "x" }],
      max_tokens: 10,
    });
    const withGc = seenBodies[0]!.generationConfig as Record<string, unknown>;
    const withoutGc = seenBodies[1]!.generationConfig as Record<string, unknown>;
    expect(withGc.temperature).toBe(0.4);
    expect(withGc.maxOutputTokens).toBe(10);
    expect("temperature" in withoutGc).toBe(false);
    expect(withoutGc.maxOutputTokens).toBe(10);
  });

  it("extracts function calls", async () => {
    const provider = createGoogleProvider({
      apiKey: "k",
      fetch: async () =>
        jsonResponse({
          candidates: [
            {
              content: {
                parts: [
                  { functionCall: { name: "do_thing", args: { x: 1 } } },
                ],
              },
            },
          ],
          usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1 },
        }),
    });
    const out = await provider.generate({
      model: "m",
      system: "",
      messages: [{ role: "user", content: "hi" }],
      max_tokens: 1,
    });
    expect(out.toolCalls).toEqual([
      { id: "google-tool-0", name: "do_thing", arguments: { x: 1 } },
    ]);
  });
});
