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
    const { user_id, name, phone, email, college, score, total_questions, mock_test_id, test_id } = req.body;
    
    const finalTestId = mock_test_id || test_id;

    if (!user_id || !finalTestId) {
      return res.status(400).json({ error: 'Missing user_id or mock_test_id' });
    }

    // Instead of using test_attempts which restricts to 1 attempt, 
    // we'll insert into exam_submissions to initialize the session.
    // Or we just create a submission record directly.
    
    // We can just insert a new blank submission and get its ID.
    const { data: newSubmission, error: insertError } = await supabase
      .from('exam_submissions')
      .insert({
        user_id,
        name,
        phone,
        email,
        college,
        score: score || 0,
        total_questions: total_questions || 50,
        mock_test_id: finalTestId,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert Error start-test:", insertError);
      return res.status(500).json({ error: insertError.message });
    }

    return res.status(200).json({
      success: true,
      submission_id: newSubmission.id,
      id: newSubmission.id
    });

  } catch (err) {
    console.error("Catch Error start-test:", err);
    return res.status(500).json({ error: err.message });
  }
}