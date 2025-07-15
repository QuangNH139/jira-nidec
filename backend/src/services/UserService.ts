import db from '../database/connection';

class UserService {
  static async deleteUserAndUnassignIssues(userId: number): Promise<boolean> {
    // First, unassign all issues assigned to this user
    await db.run(
      'UPDATE issues SET assignee_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE assignee_id = ?',
      [userId]
    );
    
    // Then delete the user
    const result = await db.run('DELETE FROM users WHERE id = ?', [userId]);
    return result.changes > 0;
  }
}

export default UserService;
