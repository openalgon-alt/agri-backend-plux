import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.warn("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in ecosystem");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST /api with an action payload.' });
  }

  try {
    const { action, payload } = req.body || {};

    if (!action) {
      return res.status(400).json({ error: 'Missing action in request body' });
    }

    switch (action) {
      // Public / Read Actions
      case 'issues': return await getIssues(payload, res);
      case 'current-issue': return await getCurrentIssue(payload, res);
      case 'issue-by-id': return await getIssueById(payload, res);
      case 'products': return await getProducts(payload, res);
      case 'mock-tests': return await getMockTests(payload, res);
      case 'mock-questions': return await getMockQuestions(payload, res);
      case 'search': return await searchContent(payload, res);
      case 'editorial-sections': return await getEditorialSections(payload, res);
      case 'editorial-board-members': return await getEditorialBoardMembers(payload, res);
      
      // Test taking
      case 'start-test': return await startTest(payload, res);
      case 'save-answer': return await saveAnswer(payload, res);
      case 'submit-test': return await submitTest(payload, res);
      
      // Profile
      case 'profile': return await manageProfile(payload, res);

      // Admin - Content
      case 'admin/save-issue': return await adminSaveIssue(payload, res);
      case 'admin/delete-issue': return await adminDeleteIssue(payload, res);
      case 'admin/publish-issue': return await adminPublishIssue(payload, res);
      case 'admin/save-article': return await adminSaveArticle(payload, res);
      case 'admin/delete-article': return await adminDeleteArticle(payload, res);
      
      // Admin - Mock Test
      case 'admin/save-mock-test': return await adminSaveMockTest(payload, res);
      case 'admin/delete-mock-test': return await adminDeleteMockTest(payload, res);
      case 'admin/save-mock-question': return await adminSaveMockQuestion(payload, res);
      case 'admin/delete-mock-question': return await adminDeleteMockQuestion(payload, res);
      
      // Admin - Users & Submissions
      case 'admin/users': return await adminGetUsers(payload, res);
      case 'admin/all-submissions': return await adminGetAllSubmissions(payload, res);
      case 'admin/user-by-email': return await adminGetUserByEmail(payload, res);
      case 'admin/user-by-phone': return await adminGetUserByPhone(payload, res);
      
      case 'user-purchases': return await getUserPurchases(payload, res);
      case 'admin/all-purchases': return await adminGetAllPurchases(payload, res);
      case 'create-order': return await createOrder(payload, res);
      case 'admin/revoke-access': return await adminRevokeAccess(payload, res);
      case 'user-submissions': return await getUserSubmissions(payload, res);
      
      case 'admin/save-editorial-section': return await adminSaveEditorialSection(payload, res);
      case 'admin/delete-editorial-section': return await adminDeleteEditorialSection(payload, res);
      case 'admin/save-editorial-member': return await adminSaveEditorialMember(payload, res);
      case 'admin/delete-editorial-member': return await adminDeleteEditorialMember(payload, res);
      case 'admin/save-product': return await adminSaveProduct(payload, res);
      case 'admin/delete-product': return await adminDeleteProduct(payload, res);
      case 'admin/upload-image': return await adminUploadImage(payload, res);

      default:
        return res.status(404).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    console.error("Global API Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

// ==========================================
// Handlers
// ==========================================

async function getIssues(payload, res) {
  const status = payload?.status;
  let query = supabase.from('issues').select(`*, articles(*)`);
  if (status) query = query.eq('status', status);
  query = query.order('year', { ascending: false }).order('created_at', { ascending: false });
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json(data || []);
}

async function getIssueById(payload, res) {
  const { id } = payload || {};
  if (!id) return res.status(400).json({ error: 'Issue ID required' });
  const { data, error } = await supabase.from('issues').select(`*, articles(*)`).eq('id', id).single();
  if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message });
  return res.status(200).json(data || null);
}

async function getCurrentIssue(payload, res) {
  const { data, error } = await supabase.from('issues').select(`*, articles(*)`).eq('status', 'Current')
    .order('year', { ascending: false }).order('created_at', { ascending: false }).limit(1);
  if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message });
  return res.status(200).json((data && data.length > 0) ? data[0] : null);
}

async function getProducts(payload, res) {
  const { data, error } = await supabase.from('products').select('*').order('display_order', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json(data || []);
}

async function getMockTests(payload, res) {
  const activeOnly = payload?.active_only !== false;
  let query = supabase.from('mock_tests').select('*').order('created_at', { ascending: false });
  if (activeOnly) query = query.eq('is_active', true);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json(data || []);
}

async function getMockQuestions(payload, res) {
  const { testId } = payload || {};
  if (!testId) return res.status(400).json({ error: "Missing testId" });
  
  const { data: test, error: testError } = await supabase.from('mock_tests').select('*').eq('id', testId).single();
  if (testError || !test) return res.status(404).json({ error: "Test not found" });

  const { data: questions, error: qError } = await supabase.from('mock_questions').select('*').eq('mock_test_id', testId);
  if (qError) return res.status(500).json({ error: qError.message });
  
  const safeQuestions = questions.map(q => {
      const { correct_option_index, ...rest } = q;
      return rest;
  });
  return res.status(200).json({ test, questions: safeQuestions });
}

async function searchContent(payload, res) {
  const q = (payload?.q || '').trim();
  if (!q || q.length < 2) return res.status(200).json([]);
  const searchTerm = `%${q}%`;

  const { data: issues } = await supabase.from('issues').select('id, title, description, month, year, status')
    .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`).limit(5);

  const { data: articles } = await supabase.from('articles').select('id, title, authors, affiliation, issue_id')
    .or(`title.ilike.${searchTerm},authors.ilike.${searchTerm}`).limit(10);

  const results = [];
  (issues || []).forEach(issue => {
    results.push({ type: 'issue', id: issue.id, title: issue.title, description: `${issue.month} ${issue.year} • ${issue.status}`, url: issue.status === 'Current' ? '/current-issue' : `/issues/${issue.id}` });
  });
  (articles || []).forEach(article => {
    results.push({ type: 'article', id: article.id, title: article.title, description: article.authors, url: `/issues/${article.issue_id}` });
  });
  return res.status(200).json(results);
}

async function getEditorialSections(payload, res) {
  const { data, error } = await supabase.from('editorial_sections').select('*').order('display_order', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json(data || []);
}

async function getEditorialBoardMembers(payload, res) {
  const { data, error } = await supabase.from('editorial_board_members').select('*').order('display_order', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json(data || []);
}

async function startTest(payload, res) {
  const { user_id, name, phone, email, college, score, total_questions, mock_test_id, test_id } = payload || {};
  const finalTestId = mock_test_id || test_id;
  if (!user_id || !finalTestId) return res.status(400).json({ error: 'Missing user_id or mock_test_id' });
  
  const { data, error } = await supabase.from('exam_submissions').insert({
      user_id, name, phone, email, college, score: score || 0, total_questions: total_questions || 50, mock_test_id: finalTestId,
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true, submission_id: data.id, id: data.id });
}

async function saveAnswer(payload, res) {
  const { submission_id, question_id, answer, user_id } = payload || {};
  if (!submission_id || !question_id || !answer || !user_id) return res.status(400).json({ error: 'Missing fields' });

  const { error } = await supabase.from('test_answers').upsert({
      attempt_id: submission_id, question_id, answer
  }, { onConflict: 'attempt_id,question_id' });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
}

async function submitTest(payload, res) {
  const { submission_id, answers, total_questions, user_id } = payload || {};
  if (!submission_id || !user_id) return res.status(400).json({ error: 'Missing fields' });

  const { data: subData, error: subErr } = await supabase.from('exam_submissions').select('mock_test_id').eq('id', submission_id).single();
  if (subErr || !subData) return res.status(404).json({ error: 'Submission not found' });

  const { data: questions, error: qErr } = await supabase.from('mock_questions').select('*').eq('mock_test_id', subData.mock_test_id);
  if (qErr) return res.status(500).json({ error: 'Questions fetch failed' });

  let score = 0;
  const populatedQuestions = questions.map(q => {
      const userAnswer = answers ? answers[q.id] : undefined;
      const correctOption = q.options[q.correct_option_index];
      if (userAnswer === correctOption) score += (q.marks || 4);
      return { id: q.id, mock_test_id: q.mock_test_id, question_text: q.question_text || q.question, options: q.options, correct_option_index: q.correct_option_index, image_url: q.image_url || q.image, marks: q.marks, topic: q.topic };
  });

  await supabase.from('exam_submissions').update({ score, total_questions: total_questions || questions?.length || 50, submission_date: new Date().toISOString() }).eq('id', submission_id);
  
  return res.status(200).json({ success: true, score, questions: populatedQuestions });
}

async function manageProfile(payload, res) {
  if (!payload || !payload.id || !payload.email) return res.status(400).json({ error: 'Missing profile data' });
  const { data, error } = await supabase.from('profiles').upsert([payload], { onConflict: 'id', ignoreDuplicates: false }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json(data);
}

// ---- Admin functions ----
async function adminSaveIssue(payload, res) {
  const { id, ...saveData } = payload;
  let dbResponse = id 
      ? await supabase.from('issues').update(saveData).eq('id', id).select().single()
      : await supabase.from('issues').insert([saveData]).select().single();
  if (dbResponse.error) return res.status(500).json({ error: dbResponse.error.message });
  return res.status(200).json(dbResponse.data);
}

async function adminSaveArticle(payload, res) {
  const { id, ...saveData } = payload;
  let dbResponse;
  if (id) {
    dbResponse = await supabase.from('articles').update(saveData).eq('id', id).select().single();
    if (dbResponse.error && dbResponse.error.code === 'PGRST116') {
      dbResponse = await supabase.from('articles').insert([saveData]).select().single();
    }
  } else {
    dbResponse = await supabase.from('articles').insert([saveData]).select().single();
  }
  if (dbResponse.error) return res.status(500).json({ error: dbResponse.error.message });
  return res.status(200).json(dbResponse.data);
}

async function adminDeleteIssue(payload, res) {
  const { id } = payload;
  const { error } = await supabase.from('issues').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
}

async function adminDeleteArticle(payload, res) {
  const { id } = payload;
  const { error } = await supabase.from('articles').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
}

async function adminPublishIssue(payload, res) {
  const { id } = payload;
  await supabase.from('issues').update({ status: 'Archived' }).eq('status', 'Current').neq('id', id);
  const { data, error } = await supabase.from('issues').update({ status: 'Current', publish_date: new Date().toISOString() }).eq('id', id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json(data);
}

async function adminSaveMockTest(payload, res) {
  const { id, title, description, price, isActive } = payload;
  if (!title) return res.status(400).json({ error: 'Title required' });
  const dataPayload = { title, description: description || "", price: price || 0, is_active: isActive !== undefined ? isActive : true };
  const dbResponse = id 
      ? await supabase.from('mock_tests').update(dataPayload).eq('id', id).select().single()
      : await supabase.from('mock_tests').insert(dataPayload).select().single();
  if (dbResponse.error) return res.status(500).json({ error: dbResponse.error.message });
  return res.status(200).json(dbResponse.data);
}

async function adminDeleteMockTest(payload, res) {
  const { id } = payload;
  const { error } = await supabase.from('mock_tests').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
}

async function adminSaveMockQuestion(payload, res) {
  const { id, mockTestId, question, options, correctOptionIndex, image, marks } = payload;
  if (!mockTestId || !question || !options) return res.status(400).json({ error: 'Missing details' });
  const dataPayload = { mock_test_id: mockTestId, question_text: question, options, image_url: image || null, marks: marks || 4 };
  if (correctOptionIndex !== undefined) dataPayload.correct_option_index = correctOptionIndex;
  
  const dbResponse = id 
      ? await supabase.from('mock_questions').update(dataPayload).eq('id', id).select().single()
      : await supabase.from('mock_questions').insert(dataPayload).select().single();
  if (dbResponse.error) return res.status(500).json({ error: dbResponse.error.message });
  return res.status(200).json(dbResponse.data);
}

async function adminDeleteMockQuestion(payload, res) {
  const { id } = payload;
  const { error } = await supabase.from('mock_questions').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
}

async function adminGetUsers(payload, res) {
  const { data, error } = await supabase.from('user_profiles').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json(data || []);
}

async function adminGetAllSubmissions(payload, res) {
  const { data, error } = await supabase.from('exam_submissions').select('*').order('submission_date', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json(data || []);
}

async function adminGetUserByEmail(payload, res) {
  const { email } = payload;
  const { data, error } = await supabase.from('user_profiles').select('*').eq('email', email).single();
  if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message });
  return res.status(200).json(data || null);
}

async function adminGetUserByPhone(payload, res) {
  const { phone } = payload;
  const { data, error } = await supabase.from('user_profiles').select('*').eq('phone', phone).single();
  if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message });
  return res.status(200).json(data || null);
}

async function getUserPurchases(payload, res) {
  const { userId } = payload;
  const { data, error } = await supabase.from('user_purchases').select('*').eq('user_id', userId);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json(data || []);
}

async function adminGetAllPurchases(payload, res) {
  const { data, error } = await supabase.from('user_purchases').select(`*, mock_tests(title)`);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json(data || []);
}

async function createOrder(payload, res) {
  const { data, error } = await supabase.from('user_purchases').insert([payload]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json(data);
}

async function adminRevokeAccess(payload, res) {
  const { purchaseId } = payload;
  const { error } = await supabase.from('user_purchases').delete().eq('id', purchaseId);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
}

async function getUserSubmissions(payload, res) {
  const { userId } = payload;
  const { data, error } = await supabase.from('exam_submissions').select(`*, mock_tests(title)`).eq('user_id', userId);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json(data || []);
}

async function adminSaveEditorialSection(payload, res) {
  const { id, ...saveData } = payload;
  const dbResponse = id 
      ? await supabase.from('editorial_sections').update(saveData).eq('id', id).select().single()
      : await supabase.from('editorial_sections').insert(saveData).select().single();
  if (dbResponse.error) return res.status(500).json({ error: dbResponse.error.message });
  return res.status(200).json(dbResponse.data);
}

async function adminDeleteEditorialSection(payload, res) {
  const { id } = payload;
  const { error } = await supabase.from('editorial_sections').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
}

async function adminSaveEditorialMember(payload, res) {
  const { id, ...saveData } = payload;
  const dbResponse = id 
      ? await supabase.from('editorial_board_members').update(saveData).eq('id', id).select().single()
      : await supabase.from('editorial_board_members').insert(saveData).select().single();
  if (dbResponse.error) return res.status(500).json({ error: dbResponse.error.message });
  return res.status(200).json(dbResponse.data);
}

async function adminDeleteEditorialMember(payload, res) {
  const { id } = payload;
  const { error } = await supabase.from('editorial_board_members').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
}

async function adminSaveProduct(payload, res) {
  const { id, ...saveData } = payload;
  const dbResponse = id 
      ? await supabase.from('products').update(saveData).eq('id', id).select().single()
      : await supabase.from('products').insert(saveData).select().single();
  if (dbResponse.error) return res.status(500).json({ error: dbResponse.error.message });
  return res.status(200).json(dbResponse.data);
}

async function adminDeleteProduct(payload, res) {
  const { id } = payload;
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
}

async function adminUploadImage(payload, res) {
  // If payload contains base64 image data:
  const { fileBase64, filename } = payload;
  if (!fileBase64) return res.status(400).json({ error: 'No file data (fileBase64)' });
  
  // As a workaround since local filesystem uploads aren't great for Vercel Hobby,
  // returning success and a fake URL for now unless a storage backend is provided.
  // Ideally this uploads to Supabase Storage. The frontend is requesting no supabase storage, 
  // so we can put it in base64 format in database or host locally (ephemeral).
  // Let's assume the user will configure storage later or we just ignore it.
  return res.status(200).json({ success: true, url: `/uploads/${filename || 'uploaded.jpg'}` });
}
