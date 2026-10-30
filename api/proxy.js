// Forwards AI requests server-side so the browser never blocks them. Keys come from the user's browser and are not stored.
const ALLOWED = [
  'https://api.anthropic.com/', 'https://api.openai.com/', 'https://generativelanguage.googleapis.com/',
  'https://api.perplexity.ai/', 'https://openrouter.ai/api/', 'https://ollama.com/api/',
];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: { message: 'POST only' } });
  try {
    const { url = '', method, headers = {}, body = null } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    if (!ALLOWED.some(a => url.startsWith(a))) return res.status(400).json({ error: { message: 'host not allowed' } });
    // No key from the browser? Use the site's built-in Ollama key.
    const auth = headers.Authorization || headers.authorization || '';
    if (url.startsWith('https://ollama.com/') && (!auth || auth.trim() === 'Bearer')) {
      if (!process.env.OLLAMA_API_KEY) return res.status(500).json({ error: { message: 'the site has no built-in key yet' } });
      delete headers.authorization; headers.Authorization = 'Bearer ' + process.env.OLLAMA_API_KEY;
    }
    const r = await fetch(url, { method: method || (body ? 'POST' : 'GET'), headers, body: body || undefined });
    const text = await r.text();
    res.status(r.status).setHeader('Content-Type', 'application/json').send(text);
  } catch (e) {
    res.status(502).json({ error: { message: 'helper could not reach the AI: ' + e.message } });
  }
}
