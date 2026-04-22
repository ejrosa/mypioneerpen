// api/current-topics.js
//
// Returns 5 current global news themes relevant to ministry letter-writing.
// Claude uses web search to find real-world human situations (grief, hardship,
// anxiety, health, economic stress, etc.) that might inspire a thoughtful letter.
//
// The response is cached at Vercel's CDN edge for 24 hours, so the search
// runs at most once per day regardless of how many users visit. This keeps
// API costs minimal while keeping topics fresh.

const TOPICS_SYSTEM_PROMPT = `You are helping a letter-writing app suggest timely, relevant topics.

Search current global news to find 5 human-interest situations that might inspire someone to write a thoughtful personal letter to a neighbor or acquaintance. Focus on:
- Grief and loss (bereavement, tragedy, disaster)
- Health challenges (illness, mental health struggles, recovery)
- Economic hardship (job loss, financial stress, housing)
- Natural disasters or severe weather affecting communities
- Loneliness and isolation (elderly, displaced families, social disconnection)
- Family stress (caregiving, relationship strain, parenting challenges)
- Anxiety and uncertainty about the future

Do NOT include:
- Political events or controversies
- Celebrity news
- Sports results
- Religious or denominational news
- Anything sensational, violent, or disturbing

Return ONLY a valid JSON object. No preamble, no markdown, no explanation. Exactly this shape:
{
  "topics": [
    {
      "emoji": "single emoji that fits the theme",
      "title": "5 to 8 word theme title",
      "description": "One sentence about what is happening and why someone might want to reach out."
    }
  ],
  "date": "today's date in YYYY-MM-DD format"
}

Return exactly 5 topics. Keep titles concise and descriptions warm, not clinical.`;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1500,
        system: TOPICS_SYSTEM_PROMPT,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [
          {
            role: 'user',
            content: `Search the web for current global news stories about human situations — grief, hardship, health challenges, economic stress, natural disasters, loneliness — and return exactly 5 topics relevant to writing a thoughtful personal letter. Return only the JSON object as instructed.`
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

    // Claude may return multiple content blocks when using web search —
    // tool_use (search queries), tool_result (search results), and finally
    // a text block with the actual JSON answer. We want the last text block.
    const textBlocks = (data.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text);

    if (!textBlocks.length) {
      return res.status(500).json({ error: 'No response from model.' });
    }

    const rawText = textBlocks[textBlocks.length - 1];

    // Strip any accidental markdown fences before parsing
    const clean = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    const parsed = JSON.parse(clean);

    if (!parsed.topics || !Array.isArray(parsed.topics)) {
      return res.status(500).json({ error: 'Unexpected response shape.' });
    }

    // Cache at Vercel's CDN for 24 hours.
    // s-maxage = CDN cache duration (24h)
    // stale-while-revalidate = serve stale while fetching fresh (1h)
    // This means the search runs at most once per day globally.
    res.setHeader(
      'Cache-Control',
      's-maxage=86400, stale-while-revalidate=3600'
    );

    return res.status(200).json({
      topics: parsed.topics.slice(0, 5),
      date: parsed.date || new Date().toISOString().split('T')[0]
    });

  } catch (err) {
    console.error('current-topics handler error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
