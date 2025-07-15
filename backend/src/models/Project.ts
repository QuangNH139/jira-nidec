import db from '../database/connection';
import { Project, CreateProjectData, UpdateProjectData, ProjectMember, IssueStatus } from '../types';

class ProjectModel {
  static async deleteById(id: number, userId: number, userRole?: string): Promise<boolean> {
    // Check if user is admin or owner
    if (userRole === 'admin') {
      return await this.delete(id);
    }
    
    const project = await this.findById(id);
    if (!project || project.owner_id !== userId) {
      return false;
    }
    return await this.delete(id);
  }

  static async keyExists(key: string): Promise<boolean> {
    console.log('Checking if key exists:', key);
    const result = await db.get('SELECT 1 FROM projects WHERE key = ?', [key]);
    console.log('Key exists query result:', result);
    const exists = !!result;
    console.log('Key exists final result:', exists);
    return exists;
  }

  static async create(projectData: CreateProjectData): Promise<Project> {
    const { name, description, key, owner_id } = projectData;
    
    const result = await db.run(
      `INSERT INTO projects (name, description, key, owner_id) 
       VALUES (?, ?, ?, ?)`,
      [name, description, key, owner_id]
    );
    
    // Add owner as project member
    await db.run(
      `INSERT INTO project_members (project_id, user_id, role) 
       VALUES (?, ?, 'owner')`,
      [result.id, owner_id]
    );

    // Create default issue statuses
    await this.createDefaultStatuses(result.id!);
    
    const project = await this.findById(result.id!);
    if (!project) {
      throw new Error('Failed to create project');
    }
    return project;
  }

  static async createDefaultStatuses(projectId: number): Promise<void> {
    const defaultStatuses = [
      { name: 'To Do', category: 'todo', color: '#gray', position: 1 },
      { name: 'In Progress', category: 'inprogress', color: '#blue', position: 2 },
      { name: 'Done', category: 'done', color: '#green', position: 3 }
    ];

    for (const status of defaultStatuses) {
      await db.run(
        `INSERT INTO issue_statuses (name, category, color, position, project_id) 
         VALUES (?, ?, ?, ?, ?)`,
        [status.name, status.category, status.color, status.position, projectId]
      );
    }
  }

  static async findById(id: number): Promise<Project | undefined> {
    return await db.get(`
      SELECT p.*, u.full_name as owner_name 
      FROM projects p 
      JOIN users u ON p.owner_id = u.id 
      WHERE p.id = ?
    `, [id]);
  }

  static async getAll(): Promise<Project[]> {
    return await db.query(`
      SELECT p.*, u.full_name as owner_name 
      FROM projects p 
      JOIN users u ON p.owner_id = u.id
      ORDER BY p.created_at DESC
    `);
  }

  static async getUserProjects(userId: number, userRole?: string): Promise<Project[]> {
    // If user is admin, return all projects
    if (userRole === 'admin') {
      return await this.getAll();
    }
    
    return await db.query(`
      SELECT DISTINCT p.*, u.full_name as owner_name, pm.role as user_role
      FROM projects p 
      JOIN users u ON p.owner_id = u.id
      JOIN project_members pm ON p.id = pm.project_id
      WHERE pm.user_id = ?
      ORDER BY p.created_at DESC
    `, [userId]);
  }

  static async update(id: number, projectData: UpdateProjectData): Promise<Project> {
    const { name, description, key } = projectData;
    
    await db.run(
      `UPDATE projects SET name = ?, description = ?, key = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [name, description, key, id]
    );
    
    const project = await this.findById(id);
    if (!project) {
      throw new Error('Project not found after update');
    }
    return project;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await db.run('DELETE FROM projects WHERE id = ?', [id]);
    return result.changes > 0;
  }

  static async addMember(projectId: number, userId: number, role: string = 'member'): Promise<void> {
    await db.run(
      `INSERT OR REPLACE INTO project_members (project_id, user_id, role) 
       VALUES (?, ?, ?)`,
      [projectId, userId, role]
    );
  }

  static async removeMember(projectId: number, userId: number): Promise<boolean> {
    const result = await db.run(
      'DELETE FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, userId]
    );
    return result.changes > 0;
  }

  static async getMembers(projectId: number): Promise<ProjectMember[]> {
    return await db.query(`
      SELECT u.id, u.username, u.email, u.full_name, pm.role 
      FROM users u
      JOIN project_members pm ON u.id = pm.user_id
      WHERE pm.project_id = ?
    `, [projectId]);
  }

  static async getStatuses(projectId: number): Promise<IssueStatus[]> {
    return await db.query(
      'SELECT * FROM issue_statuses WHERE project_id = ? ORDER BY position',
      [projectId]
    );
  }
}

export default ProjectModel;
