export interface WebSearchResult {
  title: string;
  url: string;
  summary: string;
  publishedDate?: string;
  author?: string;
}

interface ExaSearchResult {
  title?: string;
  url: string;
  text?: string;
  publishedDate?: string;
  author?: string;
}

interface ExaSearchResponse {
  results?: ExaSearchResult[];
}

export interface WebSearchToolOutput {
  query: string;
  count: number;
  results: WebSearchResult[];
  error?: string;
}

export async function webSearch(
  query: string,
  numResults: number = 5,
): Promise<WebSearchToolOutput> {
  const apiKey = process.env.EXA_API_KEY;

  if (!apiKey) {
    return {
      query,
      count: 0,
      results: [],
      error: 'EXA_API_KEY is not configured on the server.',
    };
  }

  try {
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        query,
        numResults,
        type: 'auto',
        contents: { text: true },
      }),
    });

    if (!response.ok) {
      return {
        query,
        count: 0,
        results: [],
        error: `Exa API error: ${response.status} ${response.statusText}`,
      };
    }

    const data = (await response.json()) as ExaSearchResponse;
    const results = (data.results ?? []).map(
      (item): WebSearchResult => ({
        title: item.title || 'Untitled',
        url: item.url,
        summary:
          item.text && item.text.length > 300
            ? `${item.text.slice(0, 300)}...`
            : item.text || '',
        publishedDate: item.publishedDate,
        author: item.author,
      }),
    );

    return {
      query,
      count: results.length,
      results,
    };
  } catch (err) {
    return {
      query,
      count: 0,
      results: [],
      error: `Web search failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
