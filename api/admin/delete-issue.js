import { supabase } from '../_lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }



  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const id = req.query.id;
    if (!id) return res.status(400).json({ error: 'Issue ID required' });

    const { error } = await supabase
      .from('issues')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting issue:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
