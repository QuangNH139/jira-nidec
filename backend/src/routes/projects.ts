import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthenticatedRequest, authenticateToken, requireAdmin } from '../middleware/auth';
import ProjectModel from '../models/Project';

const router = express.Router();

// Get all projects for user
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const projects = await ProjectModel.getUserProjects(req.user.id, req.user.role);
    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get project by ID
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const projectId = parseInt(req.params.id);
    const project = await ProjectModel.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if user is admin or a member of the project
    if (req.user.role !== 'admin') {
      const members = await ProjectModel.getMembers(projectId);
      const isMember = members.some(member => member.id === req.user!.id);
      
      if (!isMember) {
        return res.status(403).json({ error: 'Access denied to this project' });
      }
    }

    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create project
router.post('/', [
  authenticateToken,
  body('name').notEmpty().trim(),
  body('key').notEmpty().trim().toUpperCase(),
  body('description').optional().trim()
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { name, description, key } = req.body;
    const owner_id = req.user.id;

    console.log('Creating project with key:', key);

    // Check if project key already exists
    let keyExists = false;
    try {
      keyExists = await ProjectModel.keyExists(key);
      console.log('Key exists check result:', keyExists);
    } catch (keyCheckError) {
      console.error('Error checking if key exists:', keyCheckError);
      // If we can't check, proceed but let the database constraint catch it
    }
    
    if (keyExists) {
      console.log('Key already exists, returning error');
      return res.status(400).json({ 
        error: 'Project key already exists. Please choose a different key.' 
      });
    }

    console.log('Proceeding to create project');
    const project = await ProjectModel.create({ name, description, key, owner_id });
    
    res.status(201).json({
      message: 'Project created successfully',
      project
    });
  } catch (error: any) {
    console.error('Create project error:', error);
    
    // Handle specific SQLite constraint errors as fallback
    if (error.code === 'SQLITE_CONSTRAINT') {
      if (error.message.includes('projects.key')) {
        return res.status(400).json({ 
          error: 'Project key already exists. Please choose a different key.' 
        });
      }
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get project members
router.get('/:id/members', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const projectId = parseInt(req.params.id);
    
    // Check if user is admin or a member of the project
    if (req.user.role !== 'admin') {
      const members = await ProjectModel.getMembers(projectId);
      const isMember = members.some(member => member.id === req.user!.id);
      
      if (!isMember) {
        return res.status(403).json({ error: 'Access denied to this project' });
      }
    }

    const members = await ProjectModel.getMembers(projectId);
    res.json(members);
  } catch (error) {
    console.error('Get project members error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get project statuses
router.get('/:id/statuses', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const projectId = parseInt(req.params.id);
    
    // Check if user is admin or a member of the project
    if (req.user.role !== 'admin') {
      const members = await ProjectModel.getMembers(projectId);
      const isMember = members.some(member => member.id === req.user!.id);
      
      if (!isMember) {
        return res.status(403).json({ error: 'Access denied to this project' });
      }
    }

    const statuses = await ProjectModel.getStatuses(projectId);
    res.json(statuses);
  } catch (error) {
    console.error('Get project statuses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// Delete project by ID
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const projectId = parseInt(req.params.id);
    const deleted = await ProjectModel.deleteById(projectId, req.user.id, req.user.role);
    if (!deleted) {
      return res.status(404).json({ error: 'Project not found or not authorized' });
    }
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update project
router.put('/:id', [
  authenticateToken,
  body('name').optional().notEmpty().trim(),
  body('key').optional().notEmpty().trim().toUpperCase(),
  body('description').optional().trim()
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const projectId = parseInt(req.params.id);
    const { name, description, key } = req.body;

    // Check if user is owner or has permission to edit
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if user is a member of the project
    const members = await ProjectModel.getMembers(projectId);
    const member = members.find(m => m.id === req.user!.id);
    
    if (!member || (member.role !== 'owner' && req.user.role !== 'admin')) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // If updating key, check if new key already exists (but not for the current project)
    if (key && key !== project.key) {
      const keyExists = await ProjectModel.keyExists(key);
      if (keyExists) {
        return res.status(400).json({ 
          error: 'Project key already exists. Please choose a different key.' 
        });
      }
    }

    const updatedProject = await ProjectModel.update(projectId, { name, description, key });
    
    res.json({
      message: 'Project updated successfully',
      project: updatedProject
    });
  } catch (error: any) {
    console.error('Update project error:', error);
    
    // Handle specific SQLite constraint errors as fallback
    if (error.code === 'SQLITE_CONSTRAINT') {
      if (error.message.includes('projects.key')) {
        return res.status(400).json({ 
          error: 'Project key already exists. Please choose a different key.' 
        });
      }
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add member to project
router.post('/:id/members', [
  authenticateToken,
  body('user_id').isInt(),
  body('role').optional().isIn(['owner', 'member', 'viewer'])
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const projectId = parseInt(req.params.id);
    const { user_id, role = 'member' } = req.body;

    // Check if current user has permission to add members
    const members = await ProjectModel.getMembers(projectId);
    const currentMember = members.find(m => m.id === req.user!.id);
    
    if (!currentMember || (currentMember.role !== 'owner' && req.user.role !== 'admin')) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await ProjectModel.addMember(projectId, user_id, role);
    
    res.json({ message: 'Member added successfully' });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove member from project
router.delete('/:id/members/:userId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const projectId = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);

    // Check if current user has permission to remove members
    const members = await ProjectModel.getMembers(projectId);
    const currentMember = members.find(m => m.id === req.user!.id);
    
    if (!currentMember || (currentMember.role !== 'owner' && req.user.role !== 'admin')) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Don't allow removing the owner
    const memberToRemove = members.find(m => m.id === userId);

    await ProjectModel.removeMember(projectId, userId);
    
    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
