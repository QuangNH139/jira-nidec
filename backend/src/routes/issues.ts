import express, { Request, Response } from 'express';
import { body, validationResult, query } from 'express-validator';
import xlsx from 'xlsx';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { AuthenticatedRequest, authenticateToken, requireProjectAccess } from '../middleware/auth';
import IssueModel from '../models/Issue';
import ProjectModel from '../models/Project';
import Logger from '../services/Logger';

const router = express.Router();

// Get issues by user
router.get('/user/:userId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = parseInt(req.params.userId);
    
    // Users can only access their own issues unless they are admin
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const issues = await IssueModel.getByUser(userId);
    res.json(issues);
  } catch (error) {
    console.error('Get user issues error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get issues by project
router.get('/project/:projectId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const projectId = parseInt(req.params.projectId);
    
    // Check if user is admin or a member of the project
    if (req.user.role !== 'admin') {
      const members = await ProjectModel.getMembers(projectId);
      const isMember = members.some(member => member.id === req.user!.id);
      
      if (!isMember) {
        return res.status(403).json({ error: 'Access denied to this project' });
      }
    }

    const { sprint } = req.query;
    const sprintId = sprint ? parseInt(sprint as string) : undefined;
    const issues = await IssueModel.getByProject(projectId, sprintId);
    res.json(issues);
  } catch (error) {
    console.error('Get issues error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get kanban board
router.get('/project/:projectId/kanban', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const projectId = parseInt(req.params.projectId);
    
    // Check if user is admin or a member of the project
    if (req.user.role !== 'admin') {
      const members = await ProjectModel.getMembers(projectId);
      const isMember = members.some(member => member.id === req.user!.id);
      
      if (!isMember) {
        return res.status(403).json({ error: 'Access denied to this project' });
      }
    }

    const { sprint } = req.query;
    const sprintId = sprint ? parseInt(sprint as string) : undefined;
    const board = await IssueModel.getKanbanBoard(projectId, sprintId);
    res.json(board);
  } catch (error) {
    console.error('Get kanban board error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get issue by ID
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const issue = await IssueModel.findById(parseInt(req.params.id));
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    res.json(issue);
  } catch (error) {
    console.error('Get issue error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create issue
router.post('/', [
  authenticateToken,
  body('title').notEmpty().trim(),
  body('project_id').isInt(),
  body('status_id').isInt(),
  body('type').isIn(['task', 'story', 'bug', 'epic']),
  body('priority').isIn(['low', 'medium', 'high', 'critical']),
  body('description').optional().trim(),
  body('start_date').optional().isISO8601()
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { 
      title, description, type, priority, status_id, 
      assignee_id, project_id, sprint_id, story_points, start_date 
    } = req.body;

    // Check if user is admin or a member of the project
    if (req.user.role !== 'admin') {
      const members = await ProjectModel.getMembers(project_id);
      const isMember = members.some(member => member.id === req.user!.id);
      
      if (!isMember) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Validate assignee_id if provided
    if (assignee_id !== undefined && assignee_id !== null) {
      const members = await ProjectModel.getMembers(project_id);
      const isValidAssignee = members.some(member => member.id === assignee_id);
      
      if (!isValidAssignee) {
        return res.status(400).json({ error: 'Assignee must be a member of the project' });
      }
    }

    const reporter_id = req.user.id;

    const issue = await IssueModel.create({ 
      title, description, type, priority, status_id, 
      assignee_id, reporter_id, project_id, sprint_id, story_points, start_date 
    });
    
    await Logger.info('ISSUE_CREATE', {
      issueId: issue.id,
      title,
      type,
      priority,
      projectId: project_id,
      assigneeId: assignee_id,
      sprintId: sprint_id,
      storyPoints: story_points
    }, {
      id: req.user.id,
      username: req.user.username
    }, {
      ip: req.ip,
      userAgent: req.get('user-agent') || ''
    });
    
    res.status(201).json({
      message: 'Issue created successfully',
      issue
    });
  } catch (error) {
    console.error('Create issue error:', error);
    
    if (req.user) {
      await Logger.error('ISSUE_CREATE_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        title: req.body.title,
        projectId: req.body.project_id
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

// Update issue
router.put('/:id', [
  authenticateToken,
  body('title').optional().trim(),
  body('type').optional().isIn(['task', 'story', 'bug', 'epic']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('description').optional().trim(),
  body('start_date').optional().isISO8601()
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const issueId = parseInt(req.params.id);
    const existingIssue = await IssueModel.findById(issueId);
    
    if (!existingIssue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    // Check if user is admin or a member of the project
    if (req.user.role !== 'admin') {
      const members = await ProjectModel.getMembers(existingIssue.project_id);
      const isMember = members.some(member => member.id === req.user!.id);
      
      if (!isMember) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const { 
      title, description, type, priority, status_id, 
      assignee_id, sprint_id, story_points, start_date,
      before_image, after_image
    } = req.body;

    // Validate assignee_id if provided
    if (assignee_id !== undefined && assignee_id !== null) {
      const members = await ProjectModel.getMembers(existingIssue.project_id);
      const isValidAssignee = members.some(member => member.id === assignee_id);
      
      if (!isValidAssignee) {
        return res.status(400).json({ error: 'Assignee must be a member of the project' });
      }
    }

    const issue = await IssueModel.update(issueId, { 
      title, description, type, priority, status_id, 
      assignee_id, sprint_id, story_points, start_date,
      before_image, after_image
    });

    // Log detailed changes
    const changes: Record<string, any> = {};
    const previousData: Record<string, any> = {};

    if (title !== undefined && title !== existingIssue.title) {
      changes.title = title;
      previousData.title = existingIssue.title;
    }
    if (assignee_id !== undefined && assignee_id !== existingIssue.assignee_id) {
      changes.assignee_id = assignee_id;
      previousData.assignee_id = existingIssue.assignee_id;
      
      // Log assignment change separately
      await Logger.info('ISSUE_ASSIGN', {
        issueId,
        issueTitle: existingIssue.title,
        previousAssignee: existingIssue.assignee_id,
        newAssignee: assignee_id,
        projectId: existingIssue.project_id
      }, {
        id: req.user.id,
        username: req.user.username
      }, {
        ip: req.ip,
        userAgent: req.get('user-agent') || ''
      });
    }
    if (story_points !== undefined && story_points !== existingIssue.story_points) {
      changes.story_points = story_points;
      previousData.story_points = existingIssue.story_points;
      
      // Log story points change separately
      await Logger.info('ISSUE_STORY_POINTS_UPDATE', {
        issueId,
        issueTitle: existingIssue.title,
        previousPoints: existingIssue.story_points,
        newPoints: story_points,
        projectId: existingIssue.project_id
      }, {
        id: req.user.id,
        username: req.user.username
      }, {
        ip: req.ip,
        userAgent: req.get('user-agent') || ''
      });
    }
    if (sprint_id !== undefined && sprint_id !== existingIssue.sprint_id) {
      changes.sprint_id = sprint_id;
      previousData.sprint_id = existingIssue.sprint_id;
    }
    if (priority !== undefined && priority !== existingIssue.priority) {
      changes.priority = priority;
      previousData.priority = existingIssue.priority;
    }
    if (type !== undefined && type !== existingIssue.type) {
      changes.type = type;
      previousData.type = existingIssue.type;
    }

    // Log general update if there were changes
    if (Object.keys(changes).length > 0) {
      await Logger.info('ISSUE_UPDATE', {
        issueId,
        issueTitle: existingIssue.title,
        changes,
        previousData,
        projectId: existingIssue.project_id
      }, {
        id: req.user.id,
        username: req.user.username
      }, {
        ip: req.ip,
        userAgent: req.get('user-agent') || ''
      });
    }
    
    res.json({
      message: 'Issue updated successfully',
      issue
    });
  } catch (error) {
    console.error('Update issue error:', error);
    
    if (req.user) {
      await Logger.error('ISSUE_UPDATE_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        issueId: req.params.id
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

// Update issue status (for drag and drop)
router.patch('/:id/status', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const issueId = parseInt(req.params.id);
    const { status_id } = req.body;
    
    if (!status_id) {
      return res.status(400).json({ error: 'Status ID is required' });
    }

    const existingIssue = await IssueModel.findById(issueId);
    
    if (!existingIssue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    // Check if user is admin or a member of the project
    if (req.user.role !== 'admin') {
      const members = await ProjectModel.getMembers(existingIssue.project_id);
      const isMember = members.some(member => member.id === req.user!.id);
      
      if (!isMember) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const issue = await IssueModel.updateStatus(issueId, status_id);
    
    res.json({
      message: 'Issue status updated successfully',
      issue
    });
  } catch (error) {
    console.error('Update issue status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export issues to Excel by date range
router.get('/project/:projectId/export', [
  authenticateToken,
  query('startDate').isISO8601().withMessage('Start date must be in YYYY-MM-DD format'),
  query('endDate').isISO8601().withMessage('End date must be in YYYY-MM-DD format')
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const projectId = parseInt(req.params.projectId);
    const { startDate, endDate } = req.query as { startDate: string; endDate: string };

    // Check if user has access to this project
    if (req.user.role !== 'admin') {
      const members = await ProjectModel.getMembers(projectId);
      const isMember = members.some(member => member.id === req.user!.id);
      
      if (!isMember) {
        return res.status(403).json({ error: 'Access denied to this project' });
      }
    }

    // Get project info
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get issues in date range
    const issues = await IssueModel.getByDateRange(projectId, startDate, endDate);

    // Create workbook with ExcelJS for image support
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Issues');

    // Define columns
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Type', key: 'type', width: 12 },
      { header: 'Priority', key: 'priority', width: 12 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Assignee', key: 'assignee', width: 20 },
      { header: 'Reporter', key: 'reporter', width: 20 },
      { header: 'Story Points', key: 'storyPoints', width: 12 },
      { header: 'Start Date', key: 'startDate', width: 12 },
      { header: 'Before Image', key: 'beforeImage', width: 30 },
      { header: 'After Image', key: 'afterImage', width: 30 },
      { header: 'Created At', key: 'createdAt', width: 15 },
      { header: 'Updated At', key: 'updatedAt', width: 15 }
    ];

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add data rows
    for (let i = 0; i < issues.length; i++) {
      const issue = issues[i];
      const rowIndex = i + 2; // Start from row 2 (after header)
      
      // Set row height to accommodate images
      worksheet.getRow(rowIndex).height = 120;
      
      // Add basic issue data
      worksheet.addRow({
        id: issue.id,
        title: issue.title,
        description: issue.description || '',
        type: issue.type,
        priority: issue.priority,
        status: issue.status_name,
        assignee: issue.assignee_name || 'Unassigned',
        reporter: issue.reporter_name || '',
        storyPoints: issue.story_points || '',
        startDate: issue.start_date || '',
        beforeImage: '', // Will be replaced with actual image
        afterImage: '', // Will be replaced with actual image
        createdAt: new Date(issue.created_at).toLocaleDateString(),
        updatedAt: new Date(issue.updated_at).toLocaleDateString()
      });

      // Add before image if exists
      if (issue.before_image) {
        const beforeImagePath = path.join(__dirname, '../../uploads', issue.before_image);
        if (fs.existsSync(beforeImagePath)) {
          try {
            const beforeImageId = workbook.addImage({
              filename: beforeImagePath,
              extension: path.extname(issue.before_image).slice(1).toLowerCase() as any
            });
            
            worksheet.addImage(beforeImageId, {
              tl: { col: 10, row: rowIndex - 1 }, // Before Image column (K)
              ext: { width: 100, height: 100 }
            });
          } catch (error) {
            console.warn(`Failed to add before image for issue ${issue.id}:`, error);
            worksheet.getCell(rowIndex, 11).value = 'Image not found';
          }
        } else {
          worksheet.getCell(rowIndex, 11).value = 'Image file missing';
        }
      } else {
        worksheet.getCell(rowIndex, 11).value = 'No image';
      }

      // Add after image if exists
      if (issue.after_image) {
        const afterImagePath = path.join(__dirname, '../../uploads', issue.after_image);
        if (fs.existsSync(afterImagePath)) {
          try {
            const afterImageId = workbook.addImage({
              filename: afterImagePath,
              extension: path.extname(issue.after_image).slice(1).toLowerCase() as any
            });
            
            worksheet.addImage(afterImageId, {
              tl: { col: 11, row: rowIndex - 1 }, // After Image column (L)
              ext: { width: 100, height: 100 }
            });
          } catch (error) {
            console.warn(`Failed to add after image for issue ${issue.id}:`, error);
            worksheet.getCell(rowIndex, 12).value = 'Image not found';
          }
        } else {
          worksheet.getCell(rowIndex, 12).value = 'Image file missing';
        }
      } else {
        worksheet.getCell(rowIndex, 12).value = 'No image';
      }
    }

    // Generate Excel buffer
    const excelBuffer = await workbook.xlsx.writeBuffer();

    // Set response headers
    const filename = `${project.name}_Issues_${startDate}_to_${endDate}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    await Logger.info('EXCEL_EXPORT', {
      projectId,
      projectName: project.name,
      startDate,
      endDate,
      issueCount: issues.length,
      filename
    }, {
      id: req.user.id,
      username: req.user.username
    }, {
      ip: req.ip,
      userAgent: req.get('user-agent') || ''
    });

    // Send file
    res.send(Buffer.from(excelBuffer));
  } catch (error) {
    console.error('Export issues error:', error);
    
    if (req.user) {
      await Logger.error('EXCEL_EXPORT_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        projectId: req.params.projectId,
        startDate: req.query.startDate,
        endDate: req.query.endDate
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

// Delete issue
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const issueId = parseInt(req.params.id);
    
    // Check if issue exists
    const existingIssue = await IssueModel.findById(issueId);
    if (!existingIssue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    // Check if user has permission to delete this issue
    // Only admin, project members, issue reporter, or assignee can delete
    if (req.user.role !== 'admin') {
      const members = await ProjectModel.getMembers(existingIssue.project_id);
      const isMember = members.some(member => member.id === req.user!.id);
      const isReporter = existingIssue.reporter_id === req.user.id;
      const isAssignee = existingIssue.assignee_id === req.user.id;
      
      if (!isMember && !isReporter && !isAssignee) {
        await Logger.warn('ISSUE_DELETE_ACCESS_DENIED', {
          issueId,
          projectId: existingIssue.project_id,
          issueTitle: existingIssue.title
        }, {
          id: req.user.id,
          username: req.user.username
        }, {
          ip: req.ip,
          userAgent: req.get('user-agent') || ''
        });
        return res.status(403).json({ error: 'Access denied. You can only delete issues you created, are assigned to, or are a project member.' });
      }
    }

    const deleted = await IssueModel.delete(issueId);
    if (!deleted) {
      return res.status(500).json({ error: 'Failed to delete issue' });
    }
    
    await Logger.info('ISSUE_DELETE', {
      issueId,
      issueTitle: existingIssue.title,
      projectId: existingIssue.project_id,
      type: existingIssue.type,
      priority: existingIssue.priority
    }, {
      id: req.user.id,
      username: req.user.username
    }, {
      ip: req.ip,
      userAgent: req.get('user-agent') || ''
    });
    
    res.json({ message: 'Issue deleted successfully' });
  } catch (error) {
    console.error('Delete issue error:', error);
    
    if (req.user) {
      await Logger.error('ISSUE_DELETE_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        issueId: req.params.id
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
