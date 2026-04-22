// api/current-topics.js
//
// Returns 5 human-interest topic themes relevant to ministry letter-writing.
// Uses Claude directly (no web search tool) for maximum reliability.
// Topics rotate based on the current month so they feel fresh without
// requiring a live web search on every request.
// Response is cached at Vercel's CDN edge for 24 hours.

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Include the current month so topics feel seasonally relevant
    const now = new Date();
    const month = now.toLocaleString('en-US', { month: 'long' });
    const year = now.getFullYear();

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 800,
        messages: [
          {
            role: 'user',
            content: `You are helping a ministry letter-writing app suggest timely topic themes for ${month} ${year}.

Generate 5 human-interest themes that are commonly happening in people's lives right now — situations where receiving a thoughtful personal letter would mean a lot. Think about what real people in your neighborhood might be going through.

Focus on universal human situations like:
- Grief and loss
- Health challenges or recovery
- Economic hardship or job stress
- Loneliness or isolation
- Family difficulties
- Anxiety about the future
- Natural disasters or community hardship
- Seasonal challenges (${month}-specific if relevant)

Return ONLY a valid JSON object — no preamble, no markdown fences, no explanation:
{
  "topics": [
    {
      "emoji": "single relevant emoji",
      "title": "Short 5-7 word theme title",
      "description": "One warm sentence about this situation and why someone might want to reach out."
    }
  ]
}

Return exactly 5 topics. Make them feel real and current, not generic.`
          }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Claude API error:', response.status, errText);
      return res.status(500).json({ error: 'Could not fetch topics.' });
    }

    const data = await response.json();

    const textBlocks = (data.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text);

    if (!textBlocks.length) {
      return res.status(500).json({ error: 'No response from model.' });
    }

    const rawText = textBlocks[textBlocks.length - 1];

    // Strip any accidental markdown fences
    const clean = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    const parsed = JSON.parse(clean);

    if (!parsed.topics || !Array.isArray(parsed.topics)) {
      return res.status(500).json({ error: 'Unexpected response shape.' });
    }

    // Cache for 24 hours at Vercel's CDN
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=3600');

    return res.status(200).json({
      topics: parsed.topics.slice(0, 5),
      date: now.toISOString().split('T')[0]
    });

  } catch (err) {
    console.error('current-topics handler error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
