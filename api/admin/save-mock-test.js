import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
    const { id, title, description, price, isActive } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Title is required' });
    }

    const payload = {
        title,
        description: description || "",
        price: price || 0,
        is_active: isActive !== undefined ? isActive : true,
    };

    let result;
    if (id) {
        // Update existing mock test
        const { data, error } = await supabase
            .from('mock_tests')
            .update(payload)
            .eq('id', id)
            .select()
            .single();
            
        if (error) throw error;
        result = data;
    } else {
        // Create new mock test
        const { data, error } = await supabase
            .from('mock_tests')
            .insert(payload)
            .select()
            .single();
            
        if (error) throw error;
        result = data;
    }

    return res.status(200).json(result);

  } catch (err) {
    console.error("Save Mock Test Error:", err);
    return res.status(500).json({ error: err.message || 'Failed to save mock test' });
  }
}
