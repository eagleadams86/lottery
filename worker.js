const ALLOWED_ORIGIN = 'https://eagleadams86.github.io';

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return cors(null, 204);
    const origin = request.headers.get('Origin') || '';
    if (origin !== ALLOWED_ORIGIN) return new Response('Forbidden', { status: 403 });

    try {
      const [pb, mm] = await Promise.all([ scrape('powerball'), scrape('mega-millions') ]);
      return cors(JSON.stringify({ pb, mm }), 200);
    } catch(e) {
      return cors(JSON.stringify({ error: e.message }), 500);
    }
  }
};

async function scrape(slug) {
  try {
    const result = await fromUSAMega(slug);
    if (result && result.jackpot > 0) return result;
  } catch(e) {}
  try {
    const result = await fromLotteryUSA(slug);
    if (result && result.jackpot > 0) return result;
  } catch(e) {}
  return { jackpot: 0, cashValue: 0, nextDraw: '' };
}

async function fromUSAMega(slug) {
  const url = `https://www.usamega.com/${slug}/jackpot`;
  const r = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://www.usamega.com/',
    }
  });
  if (!r.ok) throw new Error('usamega ' + r.status);
  const html = await r.text();

  // Game name pattern handles "Powerball" and "Mega Millions" (with space)
  const namePattern = slug === 'powerball' ? 'Powerball' : 'Mega\\s+Millions';

  // Matches: "Powerball Jackpot for Wed, Jun 11, 2026 $258,000,000"
  // or:      "Mega Millions Jackpot for Fri, Jun 13, 2026 $413,000,000"
  const jMatch = html.match(new RegExp(namePattern + '\\s+Jackpot\\s+for\\s+([^<$]+?)\\s*\\$([\\d,]+)', 'i'));
  const cMatch = html.match(/Cash:\s*\$([0-9,]+)/i);

  // Also try standalone date patterns as fallback
  const dateFromJackpot = jMatch ? jMatch[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/,?\s*\d{4}/, '').trim() : '';
  const dateFromPage = html.match(/(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*,?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}/i);
  const nextDraw = dateFromJackpot || (dateFromPage ? dateFromPage[0].trim() : '');

  return {
    jackpot:   jMatch ? parseInt(jMatch[2].replace(/,/g, '')) : 0,
    cashValue: cMatch ? parseInt(cMatch[1].replace(/,/g, '')) : 0,
    nextDraw
  };
}

async function fromLotteryUSA(slug) {
  const path = slug === 'powerball' ? 'powerball' : 'mega-millions';
  const r = await fetch(`https://www.lotteryusa.com/${path}/`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      'Accept': 'text/html',
      'Accept-Language': 'en-US,en;q=0.9',
    }
  });
  if (!r.ok) throw new Error('lotteryusa ' + r.status);
  const html = await r.text();

  const jMatch = html.match(/\$\s*([\d,]+(?:\.\d+)?)\s*(Million|Billion)/i);
  const cMatch = html.match(/[Cc]ash\s*(?:[Vv]alue|[Oo]ption)[^\$]*\$\s*([\d,]+(?:\.\d+)?)\s*(Million|Billion)/i);
  const dMatch = html.match(/(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*,?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}/i);

  return {
    jackpot:   jMatch ? parseSuffix(jMatch[1], jMatch[2]) : 0,
    cashValue: cMatch ? parseSuffix(cMatch[1], cMatch[2]) : 0,
    nextDraw:  dMatch ? dMatch[0].trim() : ''
  };
}

function parseSuffix(num, suffix) {
  const n = parseFloat(String(num).replace(/,/g, ''));
  const s = (suffix || '').toLowerCase();
  if (s === 'billion') return Math.round(n * 1e9);
  if (s === 'million') return Math.round(n * 1e6);
  return Math.round(n);
}

function cors(body, status) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}