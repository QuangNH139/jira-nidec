import db from '../database/connection';
import { Sprint, CreateSprintData, UpdateSprintData, Issue } from '../types';

class SprintModel {
  static async create(sprintData: CreateSprintData): Promise<Sprint> {
    const { name, goal, project_id, start_date, end_date } = sprintData;
    
    const result = await db.run(
      `INSERT INTO sprints (name, goal, project_id, start_date, end_date) 
       VALUES (?, ?, ?, ?, ?)`,
      [name, goal, project_id, start_date, end_date]
    );
    
    const sprint = await this.findById(result.id!);
    if (!sprint) {
      throw new Error('Failed to create sprint');
    }
    return sprint;
  }

  static async findById(id: number): Promise<Sprint | undefined> {
    return await db.get('SELECT * FROM sprints WHERE id = ?', [id]);
  }

  static async getByProject(projectId: number): Promise<Sprint[]> {
    return await db.query(
      'SELECT * FROM sprints WHERE project_id = ? ORDER BY created_at DESC',
      [projectId]
    );
  }

  static async getActiveSprint(projectId: number): Promise<Sprint | undefined> {
    return await db.get(
      'SELECT * FROM sprints WHERE project_id = ? AND status = "active"',
      [projectId]
    );
  }

  static async update(id: number, sprintData: UpdateSprintData): Promise<Sprint> {
    const { name, goal, start_date, end_date, status } = sprintData;
    
    await db.run(
      `UPDATE sprints SET name = ?, goal = ?, start_date = ?, end_date = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [name, goal, start_date, end_date, status, id]
    );
    
    const sprint = await this.findById(id);
    if (!sprint) {
      throw new Error('Sprint not found after update');
    }
    return sprint;
  }

  static async start(id: number): Promise<Sprint> {
    // End any active sprints in the same project first
    const sprint = await this.findById(id);
    if (!sprint) {
      throw new Error('Sprint not found');
    }
    
    await db.run(
      'UPDATE sprints SET status = "completed" WHERE project_id = ? AND status = "active"',
      [sprint.project_id]
    );

    // Start this sprint
    await db.run(
      'UPDATE sprints SET status = "active", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );
    
    const updatedSprint = await this.findById(id);
    if (!updatedSprint) {
      throw new Error('Failed to start sprint');
    }
    return updatedSprint;
  }

  static async complete(id: number): Promise<Sprint> {
    await db.run(
      'UPDATE sprints SET status = "completed", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );
    
    const sprint = await this.findById(id);
    if (!sprint) {
      throw new Error('Sprint not found after completion');
    }
    return sprint;
  }

  static async delete(id: number): Promise<boolean> {
    // Remove sprint from issues first
    await db.run('UPDATE issues SET sprint_id = NULL WHERE sprint_id = ?', [id]);
    
    const result = await db.run('DELETE FROM sprints WHERE id = ?', [id]);
    return result.changes > 0;
  }

  static async getIssues(sprintId: number): Promise<Issue[]> {
    return await db.query(`
      SELECT i.*, s.name as status_name, s.category as status_category, s.color as status_color,
             assignee.full_name as assignee_name, reporter.full_name as reporter_name
      FROM issues i
      JOIN issue_statuses s ON i.status_id = s.id
      LEFT JOIN users assignee ON i.assignee_id = assignee.id
      JOIN users reporter ON i.reporter_id = reporter.id
      WHERE i.sprint_id = ?
      ORDER BY i.created_at DESC
    `, [sprintId]);
  }

  static async getSprintStats(sprintId: number): Promise<any> {
    const issues = await this.getIssues(sprintId);
    
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

export default SprintModel;
