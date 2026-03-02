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
    const status = req.query.status;
    const id = req.query.id;

    // If id is provided, fetch single issue by ID
    if (id) {
      const { data: issue, error } = await supabase
        .from('issues')
        .select(`*, articles(*)`)
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return res.status(200).json(issue || null);
    }

    // Otherwise fetch list with optional status filter
    let query = supabase.from('issues').select(`*, articles(*)`);
    
    if (status) query = query.eq('status', status);
    query = query.order('year', { ascending: false }).order('created_at', { ascending: false });

    const { data: issues, error } = await query;
    if (error) throw error;
    
    return res.status(200).json(issues || []);
  } catch (error) {
    console.error("Error fetching issues:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
