import express, { Request, Response } from 'express';
import { body, validationResult, query } from 'express-validator';
import xlsx from 'xlsx';
import { AuthenticatedRequest, authenticateToken, requireProjectAccess } from '../middleware/auth';
import IssueModel from '../models/Issue';
import ProjectModel from '../models/Project';

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
    
    res.status(201).json({
      message: 'Issue created successfully',
      issue
    });
  } catch (error) {
    console.error('Create issue error:', error);
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
      assignee_id, sprint_id, story_points, start_date 
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
      assignee_id, sprint_id, story_points, start_date 
    });
    
    res.json({
      message: 'Issue updated successfully',
      issue
    });
  } catch (error) {
    console.error('Update issue error:', error);
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

    // Prepare data for Excel
    const excelData = issues.map(issue => ({
      'ID': issue.id,
      'Title': issue.title,
      'Description': issue.description || '',
      'Type': issue.type,
      'Priority': issue.priority,
      'Status': issue.status_name,
      'Assignee': issue.assignee_name || 'Unassigned',
      'Reporter': issue.reporter_name || '',
      'Story Points': issue.story_points || '',
      'Start Date': issue.start_date || '',
      'Created At': new Date(issue.created_at).toLocaleDateString(),
      'Updated At': new Date(issue.updated_at).toLocaleDateString()
    }));

    // Create workbook
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(excelData);

    // Set column widths
    const columnWidths = [
      { wch: 5 },  // ID
      { wch: 30 }, // Title
      { wch: 40 }, // Description
      { wch: 10 }, // Type
      { wch: 10 }, // Priority
      { wch: 15 }, // Status
      { wch: 20 }, // Assignee
      { wch: 20 }, // Reporter
      { wch: 12 }, // Story Points
      { wch: 12 }, // Start Date
      { wch: 12 }, // Created At
      { wch: 12 }  // Updated At
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Issues');

    // Generate Excel buffer
    const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers
    const filename = `${project.name}_Issues_${startDate}_to_${endDate}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    // Send file
    res.send(excelBuffer);
  } catch (error) {
    console.error('Export issues error:', error);
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
        return res.status(403).json({ error: 'Access denied. You can only delete issues you created, are assigned to, or are a project member.' });
      }
    }

    const deleted = await IssueModel.delete(issueId);
    if (!deleted) {
      return res.status(500).json({ error: 'Failed to delete issue' });
    }
    
    res.json({ message: 'Issue deleted successfully' });
  } catch (error) {
    console.error('Delete issue error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
