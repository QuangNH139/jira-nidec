import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth';
import CommentModel from '../models/Comment';

const router = express.Router();

// Get comments by issue
router.get('/issue/:issueId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const comments = await CommentModel.getByIssue(parseInt(req.params.issueId));
    res.json(comments);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create comment
router.post('/', [
  authenticateToken,
  body('content').notEmpty().trim(),
  body('issue_id').isInt()
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { content, issue_id } = req.body;
    const author_id = req.user.id;

    const comment = await CommentModel.create({ content, issue_id, author_id });
    
    res.status(201).json({
      message: 'Comment created successfully',
      comment
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
