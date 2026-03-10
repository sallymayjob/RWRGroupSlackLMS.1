/** LMS-054 Gemini service wrapper */

function createGeminiService({ transport, defaultModel = 'gemini-1.5-pro', timeoutMs = 15000 }) {
  async function generate({ prompt, model = defaultModel, metadata = {} }) {
    const payload = { model, prompt, metadata, timeoutMs };
    const response = await transport.generate(payload);
    return {
      text: response.text || '',
      json: response.json || null,
      usage: response.usage || {},
      model,
    };
  }

  return { generate };
}
