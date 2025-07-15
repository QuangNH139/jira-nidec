import db from '../database/connection';
import { Comment, CreateCommentData, UpdateCommentData } from '../types';

class CommentModel {
  static async create(commentData: CreateCommentData): Promise<Comment> {
    const { content, issue_id, author_id } = commentData;
    
    const result = await db.run(
      `INSERT INTO comments (content, issue_id, author_id) VALUES (?, ?, ?)`,
      [content, issue_id, author_id]
    );
    
    const comment = await this.findById(result.id!);
    if (!comment) {
      throw new Error('Failed to create comment');
    }
    return comment;
  }

  static async findById(id: number): Promise<Comment | undefined> {
    return await db.get(`
      SELECT c.*, u.full_name as author_name
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.id = ?
    `, [id]);
  }

  static async getByIssue(issueId: number): Promise<Comment[]> {
    return await db.query(`
      SELECT c.*, u.full_name as author_name
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.issue_id = ?
      ORDER BY c.created_at ASC
    `, [issueId]);
  }

  static async update(id: number, commentData: UpdateCommentData): Promise<Comment> {
    const { content } = commentData;
    
    await db.run(
      'UPDATE comments SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [content, id]
    );
    
    const comment = await this.findById(id);
    if (!comment) {
      throw new Error('Comment not found after update');
    }
    return comment;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await db.run('DELETE FROM comments WHERE id = ?', [id]);
    return result.changes > 0;
  }
}

export default CommentModel;
