import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth';
import SprintModel from '../models/Sprint';
import ProjectModel from '../models/Project';

const router = express.Router();

// Get sprints by project
router.get('/project/:projectId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const sprints = await SprintModel.getByProject(parseInt(req.params.projectId));
    res.json(sprints);
  } catch (error) {
    console.error('Get sprints error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get active sprint for project
router.get('/project/:projectId/active', authenticateToken, async (req: Request, res: Response) => {
  try {
    const sprint = await SprintModel.getActiveSprint(parseInt(req.params.projectId));
    res.json(sprint);
  } catch (error) {
    console.error('Get active sprint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get sprint by ID
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const sprint = await SprintModel.findById(parseInt(req.params.id));
    if (!sprint) {
      return res.status(404).json({ error: 'Sprint not found' });
    }
    res.json(sprint);
  } catch (error) {
    console.error('Get sprint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create sprint
router.post('/', [
  authenticateToken,
  body('name').notEmpty().trim(),
  body('project_id').isInt(),
  body('goal').optional().trim(),
  body('start_date').optional().isDate(),
  body('end_date').optional().isDate()
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { name, goal, project_id, start_date, end_date } = req.body;

    // Check if user is a member of the project
    const members = await ProjectModel.getMembers(project_id);
    const isMember = members.some(member => member.id === req.user!.id);
    
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const sprint = await SprintModel.create({ name, goal, project_id, start_date, end_date });
    
    res.status(201).json({
      message: 'Sprint created successfully',
      sprint
    });
  } catch (error) {
    console.error('Create sprint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
