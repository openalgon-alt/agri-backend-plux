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
    const { data: issues, error } = await supabase
      .from('issues')
      .select(`*, articles(*)`)
      .eq('status', 'Current')
      .order('year', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (error && error.code !== 'PGRST116') throw error;

    const issue = issues && issues.length > 0 ? issues[0] : null;
    return res.status(200).json(issue || null);
  } catch (error) {
    console.error("Error fetching current issue:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
