import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth';
import SprintModel from '../models/Sprint';
import ProjectModel from '../models/Project';
import Logger from '../services/Logger';

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
      await Logger.warn('SPRINT_CREATE_ACCESS_DENIED', {
        projectId: project_id,
        sprintName: name
      }, {
        id: req.user.id,
        username: req.user.username
      }, {
        ip: req.ip,
        userAgent: req.get('user-agent') || ''
      });
      return res.status(403).json({ error: 'Access denied' });
    }

    const sprint = await SprintModel.create({ name, goal, project_id, start_date, end_date });
    
    await Logger.info('SPRINT_CREATE', {
      sprintId: sprint.id,
      sprintName: sprint.name,
      projectId: project_id,
      goal,
      start_date,
      end_date
    }, {
      id: req.user.id,
      username: req.user.username
    }, {
      ip: req.ip,
      userAgent: req.get('user-agent') || ''
    });
    
    res.status(201).json({
      message: 'Sprint created successfully',
      sprint
    });
  } catch (error) {
    console.error('Create sprint error:', error);
    
    if (req.user) {
      await Logger.error('SPRINT_CREATE_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        projectId: req.body.project_id,
        sprintName: req.body.name
      }, {
        id: req.user.id,
        username: req.user.username
      }, {
        ip: req.ip,
        userAgent: req.get('user-agent') || ''
      });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update sprint
router.put('/:id', [
  authenticateToken,
  body('name').optional().notEmpty().trim(),
  body('goal').optional().trim(),
  body('start_date').optional().isDate(),
  body('end_date').optional().isDate(),
  body('status').optional().isIn(['planning', 'active', 'completed'])
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const sprintId = parseInt(req.params.id);
    const sprint = await SprintModel.findById(sprintId);
    
    if (!sprint) {
      return res.status(404).json({ error: 'Sprint not found' });
    }

    // Check if user is a member of the project
    const members = await ProjectModel.getMembers(sprint.project_id);
    const isMember = members.some(member => member.id === req.user!.id);
    
    if (!isMember) {
      await Logger.warn('SPRINT_UPDATE_ACCESS_DENIED', {
        sprintId,
        projectId: sprint.project_id
      }, {
        id: req.user.id,
        username: req.user.username
      }, {
        ip: req.ip,
        userAgent: req.get('user-agent') || ''
      });
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedSprint = await SprintModel.update(sprintId, req.body);
    
    await Logger.info('SPRINT_UPDATE', {
      sprintId,
      changes: req.body,
      previousData: {
        name: sprint.name,
        goal: sprint.goal,
        status: sprint.status
      }
    }, {
      id: req.user.id,
      username: req.user.username
    }, {
      ip: req.ip,
      userAgent: req.get('user-agent') || ''
    });
    
    res.json({
      message: 'Sprint updated successfully',
      sprint: updatedSprint
    });
  } catch (error) {
    console.error('Update sprint error:', error);
    
    if (req.user) {
      await Logger.error('SPRINT_UPDATE_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sprintId: req.params.id
      }, {
        id: req.user.id,
        username: req.user.username
      }, {
        ip: req.ip,
        userAgent: req.get('user-agent') || ''
      });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start sprint
router.post('/:id/start', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const sprintId = parseInt(req.params.id);
    const sprint = await SprintModel.findById(sprintId);
    
    if (!sprint) {
      return res.status(404).json({ error: 'Sprint not found' });
    }

    // Check if user is a member of the project
    const members = await ProjectModel.getMembers(sprint.project_id);
    const isMember = members.some(member => member.id === req.user!.id);
    
    if (!isMember) {
      await Logger.warn('SPRINT_START_ACCESS_DENIED', {
        sprintId,
        projectId: sprint.project_id
      }, {
        id: req.user.id,
        username: req.user.username
      }, {
        ip: req.ip,
        userAgent: req.get('user-agent') || ''
      });
      return res.status(403).json({ error: 'Access denied' });
    }

    const startedSprint = await SprintModel.start(sprintId);
    
    await Logger.info('SPRINT_START', {
      sprintId,
      sprintName: sprint.name,
      projectId: sprint.project_id
    }, {
      id: req.user.id,
      username: req.user.username
    }, {
      ip: req.ip,
      userAgent: req.get('user-agent') || ''
    });
    
    res.json({
      message: 'Sprint started successfully',
      sprint: startedSprint
    });
  } catch (error) {
    console.error('Start sprint error:', error);
    
    if (req.user) {
      await Logger.error('SPRINT_START_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sprintId: req.params.id
      }, {
        id: req.user.id,
        username: req.user.username
      }, {
        ip: req.ip,
        userAgent: req.get('user-agent') || ''
      });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Complete sprint
router.post('/:id/complete', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const sprintId = parseInt(req.params.id);
    const sprint = await SprintModel.findById(sprintId);
    
    if (!sprint) {
      return res.status(404).json({ error: 'Sprint not found' });
    }

    // Check if user is a member of the project
    const members = await ProjectModel.getMembers(sprint.project_id);
    const isMember = members.some(member => member.id === req.user!.id);
    
    if (!isMember) {
      await Logger.warn('SPRINT_COMPLETE_ACCESS_DENIED', {
        sprintId,
        projectId: sprint.project_id
      }, {
        id: req.user.id,
        username: req.user.username
      }, {
        ip: req.ip,
        userAgent: req.get('user-agent') || ''
      });
      return res.status(403).json({ error: 'Access denied' });
    }

    const completedSprint = await SprintModel.complete(sprintId);
    
    await Logger.info('SPRINT_COMPLETE', {
      sprintId,
      sprintName: sprint.name,
      projectId: sprint.project_id
    }, {
      id: req.user.id,
      username: req.user.username
    }, {
      ip: req.ip,
      userAgent: req.get('user-agent') || ''
    });
    
    res.json({
      message: 'Sprint completed successfully',
      sprint: completedSprint
    });
  } catch (error) {
    console.error('Complete sprint error:', error);
    
    if (req.user) {
      await Logger.error('SPRINT_COMPLETE_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sprintId: req.params.id
      }, {
        id: req.user.id,
        username: req.user.username
      }, {
        ip: req.ip,
        userAgent: req.get('user-agent') || ''
      });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete sprint
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const sprintId = parseInt(req.params.id);
    const sprint = await SprintModel.findById(sprintId);
    
    if (!sprint) {
      return res.status(404).json({ error: 'Sprint not found' });
    }

    // Check if user is a member of the project
    const members = await ProjectModel.getMembers(sprint.project_id);
    const isMember = members.some(member => member.id === req.user!.id);
    
    if (!isMember) {
      await Logger.warn('SPRINT_DELETE_ACCESS_DENIED', {
        sprintId,
        projectId: sprint.project_id
      }, {
        id: req.user.id,
        username: req.user.username
      }, {
        ip: req.ip,
        userAgent: req.get('user-agent') || ''
      });
      return res.status(403).json({ error: 'Access denied' });
    }

    const deleted = await SprintModel.delete(sprintId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Sprint not found' });
    }
    
    await Logger.info('SPRINT_DELETE', {
      sprintId,
      sprintName: sprint.name,
      projectId: sprint.project_id
    }, {
      id: req.user.id,
      username: req.user.username
    }, {
      ip: req.ip,
      userAgent: req.get('user-agent') || ''
    });
    
    res.json({ message: 'Sprint deleted successfully' });
  } catch (error) {
    console.error('Delete sprint error:', error);
    
    if (req.user) {
      await Logger.error('SPRINT_DELETE_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sprintId: req.params.id
      }, {
        id: req.user.id,
        username: req.user.username
      }, {
        ip: req.ip,
        userAgent: req.get('user-agent') || ''
      });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
