import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthenticatedRequest, authenticateToken, requireAdmin } from '../middleware/auth';
import UserModel from '../models/User';
import UserService from '../services/UserService';

const router = express.Router();

// Get all users
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await UserModel.getAll();
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', [
  authenticateToken,
  body('username').optional().isLength({ min: 3 }).trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('full_name').optional().notEmpty().trim(),
  body('avatar_url').optional().isURL().trim()
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { username, email, full_name, avatar_url } = req.body;

    // If no fields to update, return error
    if (!username && !email && !full_name && !avatar_url) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Check if username is already taken by another user
    if (username && username !== req.user.username) {
      const existingUser = await UserModel.findByUsername(username);
      if (existingUser && existingUser.id !== req.user.id) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }

    // Check if email is already taken by another user
    if (email && email !== req.user.email) {
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser && existingUser.id !== req.user.id) {
        return res.status(400).json({ error: 'Email already taken' });
      }
    }

    // Prepare update data with only provided fields
    const updateData: any = {};
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (full_name !== undefined) updateData.full_name = full_name;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

    // Update user profile
    const updatedUser = await UserModel.update(req.user.id, updateData);

    const { password, ...userWithoutPassword } = updatedUser;
    res.json({
      message: 'Profile updated successfully',
      user: userWithoutPassword
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by ID
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await UserModel.findById(parseInt(req.params.id));
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user (admin only)
router.put('/:id', [
  authenticateToken,
  requireAdmin,
  body('username').optional().isLength({ min: 3 }).trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('full_name').optional().notEmpty().trim(),
  body('role').optional().isIn(['admin', 'developer', 'scrum_master']),
  body('avatar_url').optional().isURL().trim()
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = parseInt(req.params.id);
    const { username, email, full_name, role, avatar_url } = req.body;

    // Check if user exists
    const existingUser = await UserModel.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If no fields to update, return error
    if (!username && !email && !full_name && !role && !avatar_url) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Check if username is already taken by another user
    if (username && username !== existingUser.username) {
      const userWithUsername = await UserModel.findByUsername(username);
      if (userWithUsername && userWithUsername.id !== userId) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }

    // Check if email is already taken by another user
    if (email && email !== existingUser.email) {
      const userWithEmail = await UserModel.findByEmail(email);
      if (userWithEmail && userWithEmail.id !== userId) {
        return res.status(400).json({ error: 'Email already taken' });
      }
    }

    // Prepare update data with only provided fields
    const updateData: any = {};
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (full_name !== undefined) updateData.full_name = full_name;
    if (role !== undefined) updateData.role = role;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

    // Update user
    const updatedUser = await UserModel.update(userId, updateData);

    const { password, ...userWithoutPassword } = updatedUser;
    res.json({
      message: 'User updated successfully',
      user: userWithoutPassword
    });
  } catch (error: any) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (admin only)
router.delete('/:id', [authenticateToken, requireAdmin], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Check if user exists
    const existingUser = await UserModel.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (req.user?.id === userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Delete user and unassign all their issues
    const deleted = await UserService.deleteUserAndUnassignIssues(userId);
    if (!deleted) {
      return res.status(500).json({ error: 'Failed to delete user' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
