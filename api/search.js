import { supabase } from './_lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }



  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const q = (req.query.q || '').trim();
    if (!q || q.length < 2) {
      return res.status(200).json([]);
    }

    const searchTerm = `%${q}%`;

    // Search issues by title or description
    const { data: issues } = await supabase
      .from('issues')
      .select('id, title, description, month, year, status')
      .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
      .limit(5);

    // Search articles by title or authors
    const { data: articles } = await supabase
      .from('articles')
      .select('id, title, authors, affiliation, issue_id')
      .or(`title.ilike.${searchTerm},authors.ilike.${searchTerm}`)
      .limit(10);

    const results = [];

    (issues || []).forEach(issue => {
      results.push({
        type: 'issue',
        id: issue.id,
        title: issue.title,
        description: `${issue.month} ${issue.year} • ${issue.status}`,
        url: issue.status === 'Current' ? '/current-issue' : `/issues/${issue.id}`
      });
    });

    (articles || []).forEach(article => {
      results.push({
        type: 'article',
        id: article.id,
        title: article.title,
        description: article.authors,
        url: `/issues/${article.issue_id}`
      });
    });

    return res.status(200).json(results);
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
