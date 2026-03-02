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
    console.log("RAW BODY RECEIVED:", req.body);
    const { id, mockTestId, question, options, correctOptionIndex, image, marks } = req.body;

    if (!mockTestId || !question || !options) {
        return res.status(400).json({ error: 'Missing required Question formatting details' });
    }

    if (!id && correctOptionIndex === undefined) {
        return res.status(400).json({ error: 'Correct answer index is required for new questions' });
    }

    const payload = {
        mock_test_id: mockTestId,
        question_text: question,
        options: options,
        image_url: image || null,
        marks: marks || 4,
    };

    if (correctOptionIndex !== undefined) {
        payload.correct_option_index = correctOptionIndex;
    }

    let result;
    if (id) {
        // Update existing question
        const { data, error } = await supabase
            .from('mock_questions')
            .update(payload)
            .eq('id', id)
            .select()
            .single();
            
        if (error) throw error;
        result = data;
    } else {
        // Create new question
        const { data, error } = await supabase
            .from('mock_questions')
            .insert(payload)
            .select()
            .single();
            
        if (error) throw error;
        result = data;
    }

    return res.status(200).json(result);

  } catch (err) {
    console.error("Save Mock Question Error:", err);
    return res.status(500).json({ error: err.message || 'Failed to save mock question' });
  }
}
