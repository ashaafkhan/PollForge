import Poll from '../models/Poll.js';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/complete';

export async function generateInsights(poll) {
  // Prepare aggregated data (simplified for demo)
  const data = {
    title: poll.title,
    totalResponses: poll.meta?.totalResponses || 0,
    questions: poll.questions.map((q) => ({
      text: q.text,
      options: q.options.map((o) => o.text),
    })),
  };

  const prompt = `You are an analytics assistant. Summarize the key findings for the poll titled "${data.title}" which received ${data.totalResponses} responses. Provide insights about popular options and any surprising patterns.`;

  const body = {
    model: 'claude-3-sonnet-20240229', // or appropriate model
    prompt,
    max_tokens_to_sample: 500,
    temperature: 0.5,
  };

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error: ${err}`);
  }

  const result = await response.json();
  return result.completion?.trim() || '';
}
