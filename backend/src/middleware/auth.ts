import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { User } from '../types';
import ProjectModel from '../models/Project';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err, user) => {
    if (err) {
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }
    req.user = user as User;
    next();
  });
};

export const generateToken = (user: Partial<User>): string => {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      email: user.email,
      role: user.role 
    },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  );
};

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
};

export const requireProjectAccess = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  // Admin has access to all projects
  if (req.user.role === 'admin') {
    next();
    return;
  }

  const projectId = parseInt(req.params.projectId || req.body.project_id);
  if (!projectId) {
    res.status(400).json({ error: 'Project ID required' });
    return;
  }

  try {
    const members = await ProjectModel.getMembers(projectId);
    const isMember = members.some(member => member.id === req.user!.id);
    
    if (!isMember) {
      res.status(403).json({ error: 'Access denied to this project' });
      return;
    }

    next();
  } catch (error) {
    console.error('Error checking project access:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
