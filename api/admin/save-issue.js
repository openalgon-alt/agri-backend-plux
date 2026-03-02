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
    const issuePayload = req.body;
    
    // Convert ID null/undefined or missing to omit for insertion, else upsert
    const { id, ...saveData } = issuePayload;
    
    let dbResponse;
    if (id) {
       dbResponse = await supabase
        .from('issues')
        .update(saveData)
        .eq('id', id)
        .select()
        .single();
    } else {
       dbResponse = await supabase
        .from('issues')
        .insert([saveData])
        .select()
        .single();
    }

    if (dbResponse.error) throw dbResponse.error;
    
    return res.status(200).json(dbResponse.data);
  } catch (error) {
    console.error("Error saving issue:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
