import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config(); // fallback to .env if .env.local not present
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage: storage });

// ---- API Handlers ----
import issuesHandler from './api/issues.js';
import currentIssueHandler from './api/current-issue.js';
import issueHandler from './api/issue.js';
import mockTestsHandler from './api/mock-tests.js';
import mockQuestionsHandler from './api/mock-questions.js';
import productsHandler from './api/products.js';
import editorialSectionsHandler from './api/editorial-sections.js';
import editorialBoardMembersHandler from './api/editorial-board-members.js';
import profileHandler from './api/profile.js';
import searchHandler from './api/search.js';
import startTestHandler from './api/start-test.js';
import saveAnswerHandler from './api/save-answer.js';
import submitTestHandler from './api/submit-test.js';

// ---- Admin Handlers ----
import usersHandler from './api/admin/users.js';
import allSubmissionsHandler from './api/admin/all-submissions.js';
import saveIssueHandler from './api/admin/save-issue.js';
import saveArticleHandler from './api/admin/save-article.js';
import deleteIssueHandler from './api/admin/delete-issue.js';
import deleteArticleHandler from './api/admin/delete-article.js';
import publishIssueHandler from './api/admin/publish-issue.js';
import saveMockTestHandler from './api/admin/save-mock-test.js';
import deleteMockTestHandler from './api/admin/delete-mock-test.js';
import saveMockQuestionHandler from './api/admin/save-mock-question.js';
import deleteMockQuestionHandler from './api/admin/delete-mock-question.js';
import uploadImageHandler from './api/admin/upload-image.js';

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Helper: wraps a Vercel-style handler for Express
function wrap(handler) {
  return (req, res) => handler(req, res);
}

// ---- Public Routes ----
app.all('/api/search', wrap(searchHandler));
app.all('/api/issues', wrap(issuesHandler));
app.all('/api/current-issue', wrap(currentIssueHandler));
app.all('/api/issue', wrap(issueHandler));
app.all('/api/mock-tests', wrap(mockTestsHandler));
app.all('/api/mock-questions', wrap(mockQuestionsHandler));
app.all('/api/products', wrap(productsHandler));
app.all('/api/editorial-sections', wrap(editorialSectionsHandler));
app.all('/api/editorial-board-members', wrap(editorialBoardMembersHandler));
app.all('/api/profile', wrap(profileHandler));
app.all('/api/start-test', wrap(startTestHandler));
app.all('/api/save-answer', wrap(saveAnswerHandler));
app.all('/api/submit-test', wrap(submitTestHandler));

// ---- Admin Routes ----
app.all('/api/admin/users', wrap(usersHandler));
app.all('/api/admin/all-submissions', wrap(allSubmissionsHandler));
app.all('/api/admin/save-issue', wrap(saveIssueHandler));
app.all('/api/admin/save-article', wrap(saveArticleHandler));
app.all('/api/admin/delete-issue', wrap(deleteIssueHandler));
app.all('/api/admin/delete-article', wrap(deleteArticleHandler));
app.all('/api/admin/publish-issue', wrap(publishIssueHandler));
app.all('/api/admin/save-mock-test', wrap(saveMockTestHandler));
app.all('/api/admin/delete-mock-test', wrap(deleteMockTestHandler));
app.all('/api/admin/save-mock-question', wrap(saveMockQuestionHandler));
app.all('/api/admin/delete-mock-question', wrap(deleteMockQuestionHandler));
app.post('/api/admin/upload-image', upload.single('file'), wrap(uploadImageHandler));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});
