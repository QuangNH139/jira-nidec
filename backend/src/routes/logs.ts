import express, { Response } from 'express';
import { query, validationResult } from 'express-validator';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth';
import Logger from '../services/Logger';

const router = express.Router();

// Get current user's logs (for regular users)
router.get('/my-activities', [
  authenticateToken,
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('action').optional().isString(),
  query('projectId').optional().isInt()
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { limit, action, projectId } = req.query;
    const logs = await Logger.getLogsFromDatabase(
      limit ? parseInt(limit as string) : 50,
      req.user.id, // Only show this user's logs
      action as string
    );

    // Filter by projectId on the client side if needed
    const filteredLogs = projectId 
      ? logs.filter(log => log.details?.projectId === parseInt(projectId as string))
      : logs;

    res.json({
      logs: filteredLogs,
      total: filteredLogs.length,
      user: {
        id: req.user.id,
        username: req.user.username,
        full_name: req.user.full_name
      }
    });
  } catch (error) {
    console.error('Get user activities error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get logs from database (admin only)
router.get('/database', [
  authenticateToken,
  query('limit').optional().isInt({ min: 1, max: 1000 }),
  query('userId').optional().isInt(),
  query('action').optional().isString()
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Only admin can view logs
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { limit, userId, action } = req.query;
    const logs = await Logger.getLogsFromDatabase(
      limit ? parseInt(limit as string) : undefined,
      userId ? parseInt(userId as string) : undefined,
      action as string
    );

    await Logger.info('LOGS_VIEWED', {
      viewedBy: req.user.id,
      filters: { limit, userId, action },
      resultCount: logs.length
    }, {
      id: req.user.id,
      username: req.user.username
    }, {
      ip: req.ip,
      userAgent: req.get('user-agent') || ''
    });

    res.json({
      logs,
      total: logs.length
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get file logs (admin only)
router.get('/files', [
  authenticateToken,
  query('limit').optional().isInt({ min: 1, max: 1000 })
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Only admin can view logs
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { limit } = req.query;
    const logs = Logger.readLogs(limit ? parseInt(limit as string) : undefined);

    await Logger.info('FILE_LOGS_VIEWED', {
      viewedBy: req.user.id,
      limit,
      resultCount: logs.length
    }, {
      id: req.user.id,
      username: req.user.username
    }, {
      ip: req.ip,
      userAgent: req.get('user-agent') || ''
    });

    res.json({
      logs,
      total: logs.length
    });
  } catch (error) {
    console.error('Get file logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Rotate logs (admin only)
router.post('/rotate', [
  authenticateToken,
  query('daysToKeep').optional().isInt({ min: 1, max: 365 })
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Only admin can rotate logs
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { daysToKeep } = req.query;
    const days = daysToKeep ? parseInt(daysToKeep as string) : 30;

    await Logger.rotateLogs(days);

    res.json({
      message: 'Logs rotated successfully',
      daysKept: days
    });
  } catch (error) {
    console.error('Rotate logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
