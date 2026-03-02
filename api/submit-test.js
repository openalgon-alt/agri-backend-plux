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
    const { submission_id, answers, total_questions, user_id } = req.body;

    if (!submission_id || !user_id) {
      return res.status(400).json({ error: 'Missing submission_id or user_id' });
    }

    // 1. Get the submission to find mock_test_id
    const { data: submissionData, error: subErr } = await supabase
      .from('exam_submissions')
      .select('mock_test_id')
      .eq('id', submission_id)
      .single();

    if (subErr || !submissionData) {
        return res.status(404).json({ error: 'Submission not found' });
    }

    const testId = submissionData.mock_test_id;

    // 2. Fetch all questions for this test to calculate score
    const { data: questions, error: qError } = await supabase
        .from('mock_questions')
        .select('*')
        .eq('mock_test_id', testId);
    
    if (qError) {
        return res.status(500).json({ error: 'Failed to fetch questions' });
    }

    let score = 0;
    let populatedQuestions = [];

    // Calculate score
    if (questions) {
        populatedQuestions = questions.map(q => {
             const userAnswer = answers ? answers[q.id] : undefined;
             const correctOption = q.options[q.correct_option_index];
             
             if (userAnswer === correctOption) {
                 score += (q.marks || 4); // default 4 marks if not specified
             } else if (userAnswer) {
                 // negative marking could go here
             }

             return {
                 id: q.id,
                 mock_test_id: q.mock_test_id,
                 question_text: q.question_text || q.question,
                 options: q.options,
                 correct_option_index: q.correct_option_index,
                 image_url: q.image_url || q.image,
                 marks: q.marks,
                 topic: q.topic
             };
        });
    }

    // 4. Update the exam_submissions score
    const { error: updateError } = await supabase
        .from('exam_submissions')
        .update({
            score: score,
            total_questions: total_questions || questions?.length || 50,
            submission_date: new Date().toISOString()
        })
        .eq('id', submission_id);
    
    if (updateError) console.error("Error updating submission:", updateError);

    // Return the score and populated questions
    return res.status(200).json({ 
        success: true, 
        score: score,
        questions: populatedQuestions
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
