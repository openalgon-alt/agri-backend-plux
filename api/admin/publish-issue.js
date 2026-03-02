import { supabase } from '../_lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }



  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'Issue ID required' });

    // Step 1: Archive any existing 'Current' issue (except the one being published)
    const { error: archiveError } = await supabase
      .from('issues')
      .update({ status: 'Archived' })
      .eq('status', 'Current')
      .neq('id', id);

    if (archiveError) {
      console.error("Error archiving old current issue:", archiveError);
      // Non-fatal: proceed anyway
    }

    // Step 2: Promote the selected issue to 'Current'
    const { data, error } = await supabase
      .from('issues')
      .update({ status: 'Current', publish_date: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error publishing issue:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
