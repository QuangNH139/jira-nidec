import db from '../database/connection';
import { Issue, CreateIssueData, UpdateIssueData, KanbanColumn } from '../types';

class IssueModel {
  static async create(issueData: CreateIssueData): Promise<Issue> {
    const { 
      title, description, type, priority, status_id, 
      assignee_id, reporter_id, project_id, sprint_id, story_points, start_date 
    } = issueData;
    
    const result = await db.run(
      `INSERT INTO issues (title, description, type, priority, status_id, assignee_id, reporter_id, project_id, sprint_id, story_points, start_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, type, priority, status_id, assignee_id, reporter_id, project_id, sprint_id, story_points, start_date]
    );
    
    const issue = await this.findById(result.id!);
    if (!issue) {
      throw new Error('Failed to create issue');
    }
    return issue;
  }

  static async findById(id: number): Promise<Issue | undefined> {
    return await db.get(`
      SELECT i.*, s.name as status_name, s.category as status_category, s.color as status_color,
             assignee.full_name as assignee_name, reporter.full_name as reporter_name,
             p.name as project_name
      FROM issues i
      JOIN issue_statuses s ON i.status_id = s.id
      JOIN projects p ON i.project_id = p.id
      LEFT JOIN users assignee ON i.assignee_id = assignee.id
      JOIN users reporter ON i.reporter_id = reporter.id
      WHERE i.id = ?
    `, [id]);
  }

  static async getByProject(projectId: number, sprintId?: number): Promise<Issue[]> {
    let query = `
      SELECT i.*, s.name as status_name, s.category as status_category, s.color as status_color,
             assignee.full_name as assignee_name, reporter.full_name as reporter_name,
             p.name as project_name
      FROM issues i
      JOIN issue_statuses s ON i.status_id = s.id
      JOIN projects p ON i.project_id = p.id
      LEFT JOIN users assignee ON i.assignee_id = assignee.id
      JOIN users reporter ON i.reporter_id = reporter.id
      WHERE i.project_id = ?
    `;
    
    const params: any[] = [projectId];
    
    if (sprintId !== undefined) {
      if (sprintId === null) {
        query += ' AND i.sprint_id IS NULL';
      } else {
        query += ' AND i.sprint_id = ?';
        params.push(sprintId);
      }
    }
    
    query += ' ORDER BY i.created_at DESC';
    
    return await db.query(query, params);
  }

  static async getByUser(userId: number): Promise<Issue[]> {
    return await db.query(`
      SELECT i.*, s.name as status_name, s.category as status_category, s.color as status_color,
             p.name as project_name, reporter.full_name as reporter_name
      FROM issues i
      JOIN issue_statuses s ON i.status_id = s.id
      JOIN projects p ON i.project_id = p.id
      JOIN users reporter ON i.reporter_id = reporter.id
      WHERE i.assignee_id = ?
      ORDER BY i.created_at DESC
    `, [userId]);
  }

  static async update(id: number, issueData: UpdateIssueData): Promise<Issue> {
    const fieldsToUpdate: string[] = [];
    const values: any[] = [];
    
    // Only update provided fields (including null values)
    if (issueData.title !== undefined) {
      fieldsToUpdate.push('title = ?');
      values.push(issueData.title);
    }
    if (issueData.description !== undefined) {
      fieldsToUpdate.push('description = ?');
      values.push(issueData.description);
    }
    if (issueData.type !== undefined) {
      fieldsToUpdate.push('type = ?');
      values.push(issueData.type);
    }
    if (issueData.priority !== undefined) {
      fieldsToUpdate.push('priority = ?');
      values.push(issueData.priority);
    }
    if (issueData.status_id !== undefined) {
      fieldsToUpdate.push('status_id = ?');
      values.push(issueData.status_id);
    }
    if (issueData.assignee_id !== undefined) {
      fieldsToUpdate.push('assignee_id = ?');
      values.push(issueData.assignee_id);
    }
    if (issueData.hasOwnProperty('sprint_id')) {
      fieldsToUpdate.push('sprint_id = ?');
      values.push(issueData.sprint_id);
    }
    if (issueData.story_points !== undefined) {
      fieldsToUpdate.push('story_points = ?');
      values.push(issueData.story_points);
    }
    if (issueData.start_date !== undefined) {
      fieldsToUpdate.push('start_date = ?');
      values.push(issueData.start_date);
    }
    if (issueData.before_image !== undefined) {
      fieldsToUpdate.push('before_image = ?');
      values.push(issueData.before_image);
    }
    if (issueData.after_image !== undefined) {
      fieldsToUpdate.push('after_image = ?');
      values.push(issueData.after_image);
    }
    
    if (fieldsToUpdate.length === 0) {
      throw new Error('No fields to update');
    }
    
    // Always update the updated_at timestamp
    fieldsToUpdate.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id); // Add id for WHERE clause
    
    const query = `UPDATE issues SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;
    
    await db.run(query, values);
    
    const issue = await this.findById(id);
    if (!issue) {
      throw new Error('Issue not found after update');
    }
    return issue;
  }

  static async updateStatus(id: number, statusId: number): Promise<Issue> {
    await db.run(
      'UPDATE issues SET status_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [statusId, id]
    );
    
    const issue = await this.findById(id);
    if (!issue) {
      throw new Error('Issue not found after status update');
    }
    return issue;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await db.run('DELETE FROM issues WHERE id = ?', [id]);
    return result.changes > 0;
  }

  static async addToSprint(issueId: number, sprintId: number): Promise<Issue> {
    await db.run(
      'UPDATE issues SET sprint_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [sprintId, issueId]
    );
    
    const issue = await this.findById(issueId);
    if (!issue) {
      throw new Error('Issue not found after adding to sprint');
    }
    return issue;
  }

  static async removeFromSprint(issueId: number): Promise<Issue> {
    await db.run(
      'UPDATE issues SET sprint_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [issueId]
    );
    
    const issue = await this.findById(issueId);
    if (!issue) {
      throw new Error('Issue not found after removing from sprint');
    }
    return issue;
  }

  static async getKanbanBoard(projectId: number, sprintId?: number): Promise<KanbanColumn[]> {
    // Get project statuses
    const statuses = await db.query(
      'SELECT * FROM issue_statuses WHERE project_id = ? ORDER BY position',
      [projectId]
    );

    const columns: KanbanColumn[] = [];

    for (const status of statuses) {
      const issues = await this.getByProject(projectId, sprintId);
      const statusIssues = issues.filter(issue => issue.status_id === status.id);

      columns.push({
        id: status.id,
        name: status.name,
        category: status.category,
        color: status.color,
        issues: statusIssues
      });
    }

    return columns;
  }

  static async getByDateRange(projectId: number, startDate: string, endDate: string): Promise<Issue[]> {
    return await db.query(`
      SELECT i.*, s.name as status_name, s.category as status_category, s.color as status_color,
             assignee.full_name as assignee_name, reporter.full_name as reporter_name,
             p.name as project_name
      FROM issues i
      JOIN issue_statuses s ON i.status_id = s.id
      JOIN projects p ON i.project_id = p.id
      LEFT JOIN users assignee ON i.assignee_id = assignee.id
      JOIN users reporter ON i.reporter_id = reporter.id
      WHERE i.project_id = ? 
        AND (
          (i.start_date IS NOT NULL AND i.start_date BETWEEN ? AND ?) OR
          (i.start_date IS NULL AND i.created_at BETWEEN ? AND ?)
        )
      ORDER BY COALESCE(i.start_date, DATE(i.created_at)) ASC
    `, [projectId, startDate, endDate, startDate + ' 00:00:00', endDate + ' 23:59:59']);
  }

  static async getProjectStats(projectId: number): Promise<any> {
    const issues = await this.getByProject(projectId);
    
    const totalIssues = issues.length;
    const completedIssues = issues.filter(issue => issue.status_category === 'done').length;
    const inProgressIssues = issues.filter(issue => issue.status_category === 'inprogress').length;
    const todoIssues = issues.filter(issue => issue.status_category === 'todo').length;
    
    const totalStoryPoints = issues.reduce((sum, issue) => sum + (issue.story_points || 0), 0);
    const completedStoryPoints = issues
      .filter(issue => issue.status_category === 'done')
      .reduce((sum, issue) => sum + (issue.story_points || 0), 0);

    return {
      totalIssues,
      completedIssues,
      inProgressIssues,
      todoIssues,
      totalStoryPoints,
      completedStoryPoints
    };
  }
}

export default IssueModel;
