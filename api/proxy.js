export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'No url specified' });

  try {
    const fetchRes = await fetch(url);
    const data = await fetchRes.text();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
