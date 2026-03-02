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
    const { submission_id, question_id, answer, user_id } = req.body;

    if (!submission_id || !question_id || !answer || !user_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // We can insert/upsert into a test_answers table.
    // Ensure you have a 'test_answers' table with attempt_id and question_id.
    const { error: upsertError } = await supabase
      .from('test_answers')
      .upsert({
        attempt_id: submission_id,
        question_id: question_id,
        answer: answer
      }, { onConflict: 'attempt_id,question_id' });

    if (upsertError) {
        console.error("UPSERT ERROR", upsertError);
        // We'll swallow or return error
        return res.status(500).json({ error: upsertError.message });
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
