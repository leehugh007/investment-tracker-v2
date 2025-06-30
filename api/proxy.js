export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');
  if (!url) {
    return new Response(JSON.stringify({ error: 'No url specified' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const fetchRes = await fetch(url);
    const data = await fetchRes.text();
    return new Response(data, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'fetch failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
