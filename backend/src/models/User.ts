import db from '../database/connection';
import bcrypt from 'bcryptjs';
import { User, CreateUserData, UpdateUserData, ProjectMember } from '../types';

class UserModel {
  static async create(userData: CreateUserData): Promise<User> {
    const { username, email, password, full_name, role = 'developer' } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await db.run(
      `INSERT INTO users (username, email, password, full_name, role) 
       VALUES (?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, full_name, role]
    );
    
    const user = await this.findById(result.id!);
    if (!user) {
      throw new Error('Failed to create user');
    }
    return user;
  }

  static async findById(id: number): Promise<User | undefined> {
    return await db.get('SELECT * FROM users WHERE id = ?', [id]);
  }

  static async findByEmail(email: string): Promise<User | undefined> {
    return await db.get('SELECT * FROM users WHERE email = ?', [email]);
  }

  static async findByUsername(username: string): Promise<User | undefined> {
    return await db.get('SELECT * FROM users WHERE username = ?', [username]);
  }

  static async getAll(): Promise<Omit<User, 'password'>[]> {
    return await db.query('SELECT id, username, email, full_name, role, avatar_url, created_at FROM users');
  }

  static async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async update(id: number, userData: UpdateUserData): Promise<User> {
    // Build dynamic UPDATE query based on provided fields
    const fields: string[] = [];
    const values: any[] = [];
    
    if (userData.username !== undefined) {
      fields.push('username = ?');
      values.push(userData.username);
    }
    if (userData.email !== undefined) {
      fields.push('email = ?');
      values.push(userData.email);
    }
    if (userData.full_name !== undefined) {
      fields.push('full_name = ?');
      values.push(userData.full_name);
    }
    if (userData.role !== undefined) {
      fields.push('role = ?');
      values.push(userData.role);
    }
    if (userData.avatar_url !== undefined) {
      fields.push('avatar_url = ?');
      values.push(userData.avatar_url);
    }
    
    // Always update the updated_at timestamp
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    
    await db.run(query, values);
    
    const user = await this.findById(id);
    if (!user) {
      throw new Error('User not found after update');
    }
    return user;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await db.run('DELETE FROM users WHERE id = ?', [id]);
    return result.changes > 0;
  }

  static async getProjectMembers(projectId: number): Promise<ProjectMember[]> {
    return await db.query(`
      SELECT u.id, u.username, u.email, u.full_name, u.role as user_role, pm.role as project_role
      FROM users u
      JOIN project_members pm ON u.id = pm.user_id
      WHERE pm.project_id = ?
    `, [projectId]);
  }
}

export default UserModel;
