import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import UserModel from '../models/User';
import { generateToken } from '../middleware/auth';
import { LoginCredentials, RegisterData } from '../types';
import Logger from '../services/Logger';

const router = express.Router();

// Register
router.post('/register', [
  body('username').isLength({ min: 3 }).trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('full_name').notEmpty().trim()
], async (req: Request<{}, {}, RegisterData>, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, full_name } = req.body;

    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    const existingUsername = await UserModel.findByUsername(username);
    if (existingUsername) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Create user
    const user = await UserModel.create({ username, email, password, full_name });
    const token = generateToken(user);

    await Logger.info('USER_REGISTER', {
      userId: user.id,
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      role: user.role
    }, {
      id: user.id,
      username: user.username
    }, {
      ip: req.ip,
      userAgent: req.get('user-agent') || ''
    });

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    await Logger.error('USER_REGISTER_ERROR', {
      error: error instanceof Error ? error.message : 'Unknown error',
      email: req.body.email,
      username: req.body.username
    }, undefined, {
      ip: req.ip,
      userAgent: req.get('user-agent') || ''
    });
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req: Request<{}, {}, LoginCredentials>, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Validate password
    const isValidPassword = await UserModel.validatePassword(password, user.password);
    if (!isValidPassword) {
      await Logger.warn('USER_LOGIN_FAILED', {
        email,
        reason: 'Invalid password'
      }, undefined, {
        ip: req.ip,
        userAgent: req.get('user-agent') || ''
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);

    await Logger.info('USER_LOGIN', {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    }, {
      id: user.id,
      username: user.username
    }, {
      ip: req.ip,
      userAgent: req.get('user-agent') || ''
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    
    await Logger.error('USER_LOGIN_ERROR', {
      error: error instanceof Error ? error.message : 'Unknown error',
      email: req.body.email
    }, undefined, {
      ip: req.ip,
      userAgent: req.get('user-agent') || ''
    });
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
