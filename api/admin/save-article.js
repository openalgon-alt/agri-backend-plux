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
    const articlePayload = req.body;
    
    // Map the payload to DB columns (assuming from dataService.ts we need to map to DB snake_case)
    // Actually dataService.saveArticle sends: issue_id, title, authors, affiliation, pdf_url, abstract, keywords
    const { id, ...saveData } = articlePayload;
    
    let dbResponse;
    if (id) {
       dbResponse = await supabase
        .from('articles')
        .update(saveData)
        .eq('id', id)
        .select()
        .single();

      // PGRST116 = no rows found — article doesn't exist in DB yet (frontend-generated fake UUID)
      // Fall back to insert without the fake ID so DB generates a real UUID
      if (dbResponse.error && dbResponse.error.code === 'PGRST116') {
        dbResponse = await supabase
          .from('articles')
          .insert([saveData])
          .select()
          .single();
      }
    } else {
       dbResponse = await supabase
        .from('articles')
        .insert([saveData])
        .select()
        .single();
    }

    if (dbResponse.error) throw dbResponse.error;
    
    return res.status(200).json(dbResponse.data);
  } catch (error) {
    console.error("Error saving article:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
