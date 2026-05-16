import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/document', requireAuth, upload.single('document'), async (request, response) => {
  if (!request.file) return response.status(400).json({ message: 'Document is required' });

  response.json({
    filename: request.file.originalname,
    size: request.file.size,
    summary: 'Document queued for AI analysis. Connect a parser/vector store to enable extraction, embeddings, and retrieval-augmented answers.',
    actionItems: ['Extract text', 'Generate embeddings', 'Create summary', 'Attach results to conversation']
  });
});

export default router;
