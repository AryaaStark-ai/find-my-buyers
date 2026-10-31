// Free web search with no key: Google News RSS (last 12 months) plus Bing results.
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
const unesc = s => String(s || '').replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&nbsp;/g, ' ');
const strip = s => unesc(String(s || '').replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();

async function gnews(q, gl, n = 10) {
  const u = 'https://news.google.com/rss/search?q=' + encodeURIComponent(q + ' when:1y') + `&hl=en-${gl}&gl=${gl}&ceid=${gl}:en`;
  const t = await (await fetch(u, { headers: { 'User-Agent': UA } })).text();
  return [...t.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, n).map(m => {
    const g = tag => (m[1].match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`)) || [, ''])[1];
    const title = strip(g('title')), src = strip(g('source')), date = g('pubDate').slice(5, 16);
    return { title, url: unesc(g('link')), content: `${src}, published ${date}. ${title}` };
  });
}

async function bing(q, gl, n = 6) {
  const t = await (await fetch('https://www.bing.com/search?q=' + encodeURIComponent(q) + (gl === 'US' ? '&setlang=en&cc=us' : `&cc=${gl.toLowerCase()}&setlang=en-${gl}&mkt=en-${gl}`), { headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' } })).text();
  const out = [];
  for (const blk of t.match(/<li class="b_algo"[\s\S]*?<\/li>/g) || []) {
    const m = blk.match(/<h2[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
    if (!m) continue;
    let url = unesc(m[1]);
    if (url.includes('bing.com/ck/a')) {
      const uu = new URL(url).searchParams.get('u') || '';
      if (uu.startsWith('a1')) { try { url = Buffer.from(uu.slice(2).replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString(); } catch (e) {} }
    }
    const sn = blk.match(/<p[^>]*>([\s\S]*?)<\/p>/);
    out.push({ title: strip(m[2]), url, content: sn ? strip(sn[1]) : '' });
    if (out.length >= n) break;
  }
  return out;
}

export default async function handler(req, res) {
  const q = String(req.query.q || '').slice(0, 200);
  if (!q) return res.status(400).json({ results: [] });
  const gl = /^[a-z]{2}$/i.test(req.query.gl || '') ? req.query.gl.toUpperCase() : 'US';
  if (req.query.kind === 'jobs') return res.status(200).json({ results: await bing(q + ' job opening', gl, 8).catch(() => []) });
  const [a, b] = await Promise.all([gnews(q, gl).catch(() => []), bing(q, gl).catch(() => [])]);
  res.status(200).json({ results: [...a, ...b] });
}
