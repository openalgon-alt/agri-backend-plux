import { supabase } from './_lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }



  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const profileData = req.body;
    
    // We expect { id, email, full_name, phone, college, college_district, role, guardian_name, guardian_phone, last_login }
    if (!profileData || !profileData.id || !profileData.email) {
        return res.status(400).json({ error: 'Missing required profile data (id, email)' });
    }

    const { data, error } = await supabase
        .from('profiles')
        .upsert(
            [profileData],
            { onConflict: 'id', ignoreDuplicates: false }
        )
        .select()
        .single();
        
    if (error) {
        console.error("Error upserting profile:", error);
        return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("Internal Server Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
