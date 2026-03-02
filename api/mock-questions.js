import { supabase } from './_lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }



  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { testId } = req.query;

    if (!testId) {
       return res.status(400).json({ error: "Missing testId parameter" });
    }

    const { data: test, error: testError } = await supabase
      .from('mock_tests')
      .select('*')
      .eq('id', testId)
      .single();

    if (testError || !test) {
       return res.status(404).json({ error: "Test not found" });
    }

    const { data: questions, error: qError } = await supabase
      .from('mock_questions')
      .select('*')
      .eq('mock_test_id', testId);

    if (qError) {
       return res.status(500).json({ error: qError.message });
    }
    
    // Do not return correct_option_index here, frontend only needs the questions.
    // The correct index is validated on submit.
    const safeQuestions = questions.map(q => {
        const { correct_option_index, ...rest } = q;
        return rest;
    });

    return res.status(200).json({
      test,
      questions: safeQuestions
    });

  } catch (error) {
    console.error("Internal Server Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
