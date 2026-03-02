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
    const id = req.query.id;
    if (!id) return res.status(400).json({ error: 'Issue ID required' });

    const { data: issue, error } = await supabase
      .from('issues')
      .select(`*, articles(*)`)
      .eq('id', id)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error;
    
    return res.status(200).json(issue || null);
  } catch (error) {
    console.error("Error fetching issue by id:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
