import fs from 'fs';
import path from 'path';
import db from '../database/connection';

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  action: string;
  userId?: number;
  userName?: string;
  details: Record<string, any>;
  ip?: string;
  userAgent?: string;
}

class Logger {
  private logDir: string;
  private logFile: string;

  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.logFile = path.join(this.logDir, 'application.log');
    this.ensureLogDirectory();
    this.ensureLogTable();
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private async ensureLogTable(): Promise<void> {
    try {
      await db.run(`
        CREATE TABLE IF NOT EXISTS action_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp TEXT NOT NULL,
          level TEXT NOT NULL,
          action TEXT NOT NULL,
          user_id INTEGER,
          user_name TEXT,
          details TEXT,
          ip_address TEXT,
          user_agent TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch (error) {
      console.error('Error creating logs table:', error);
    }
  }

  private formatLogEntry(entry: LogEntry): string {
    return JSON.stringify(entry) + '\n';
  }

  private writeLog(entry: LogEntry): void {
    const logEntry = this.formatLogEntry(entry);
    fs.appendFileSync(this.logFile, logEntry);
  }

  private async saveToDatabase(entry: LogEntry): Promise<void> {
    try {
      await db.run(`
        INSERT INTO action_logs (timestamp, level, action, user_id, user_name, details, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        entry.timestamp,
        entry.level,
        entry.action,
        entry.userId || null,
        entry.userName || null,
        JSON.stringify(entry.details),
        entry.ip || null,
        entry.userAgent || null
      ]);
    } catch (error) {
      console.error('Error saving log to database:', error);
    }
  }

  public async log(level: LogEntry['level'], action: string, details: Record<string, any>, user?: { id: number; username: string }, request?: { ip?: string; userAgent?: string }): Promise<void> {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      action,
      userId: user?.id,
      userName: user?.username,
      details,
      ip: request?.ip,
      userAgent: request?.userAgent,
    };

    this.writeLog(entry);

    // Save critical actions to database
    const criticalActions = [
      'USER_LOGIN', 'USER_LOGOUT', 'USER_REGISTER', 'USER_DELETE',
      'PROJECT_CREATE', 'PROJECT_UPDATE', 'PROJECT_DELETE',
      'ISSUE_CREATE', 'ISSUE_UPDATE', 'ISSUE_DELETE', 'ISSUE_ASSIGN', 'ISSUE_STORY_POINTS_UPDATE',
      'SPRINT_CREATE', 'SPRINT_UPDATE', 'SPRINT_DELETE', 'SPRINT_START', 'SPRINT_COMPLETE',
      'COMMENT_CREATE', 'COMMENT_UPDATE', 'COMMENT_DELETE',
      'EXCEL_EXPORT', 'BACKLOG_ACCESS', 'BOARD_ACCESS'
    ];

    if (criticalActions.includes(action)) {
      await this.saveToDatabase(entry);
    }

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${entry.timestamp}] ${level}: ${action}`, details);
    }
  }

  public async info(action: string, details: Record<string, any>, user?: { id: number; username: string }, request?: { ip?: string; userAgent?: string }): Promise<void> {
    await this.log('INFO', action, details, user, request);
  }

  public async warn(action: string, details: Record<string, any>, user?: { id: number; username: string }, request?: { ip?: string; userAgent?: string }): Promise<void> {
    await this.log('WARN', action, details, user, request);
  }

  public async error(action: string, details: Record<string, any>, user?: { id: number; username: string }, request?: { ip?: string; userAgent?: string }): Promise<void> {
    await this.log('ERROR', action, details, user, request);
  }

  public async debug(action: string, details: Record<string, any>, user?: { id: number; username: string }, request?: { ip?: string; userAgent?: string }): Promise<void> {
    await this.log('DEBUG', action, details, user, request);
  }

  // Method to read logs from database
  public async getLogsFromDatabase(limit?: number, userId?: number, action?: string, projectId?: number): Promise<LogEntry[]> {
    try {
      let query = 'SELECT * FROM action_logs';
      const params: any[] = [];
      const conditions: string[] = [];

      if (userId) {
        conditions.push('user_id = ?');
        params.push(userId);
      }

      if (action) {
        conditions.push('action = ?');
        params.push(action);
      }

      if (projectId) {
        conditions.push('JSON_EXTRACT(details, "$.projectId") = ?');
        params.push(projectId);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY created_at DESC';

      if (limit) {
        query += ' LIMIT ?';
        params.push(limit);
      }

      const rows = await db.query(query, params);
      
      return rows.map((row: any) => ({
        timestamp: row.timestamp,
        level: row.level,
        action: row.action,
        userId: row.user_id,
        userName: row.user_name,
        details: row.details ? JSON.parse(row.details) : {},
        ip: row.ip_address,
        userAgent: row.user_agent
      }));
    } catch (error) {
      console.error('Error reading logs from database:', error);
      return [];
    }
  }

  // Method to read logs (for admin purposes)
  public readLogs(limit?: number): LogEntry[] {
    try {
      if (!fs.existsSync(this.logFile)) {
        return [];
      }

      const logContent = fs.readFileSync(this.logFile, 'utf-8');
      const lines = logContent.trim().split('\n').filter(line => line.length > 0);
      
      const logs = lines.map(line => {
        try {
          return JSON.parse(line) as LogEntry;
        } catch {
          return null;
        }
      }).filter(Boolean) as LogEntry[];

      // Return most recent logs first
      const sortedLogs = logs.reverse();
      return limit ? sortedLogs.slice(0, limit) : sortedLogs;
    } catch (error) {
      console.error('Error reading logs:', error);
      return [];
    }
  }

  // Method to clear old logs (rotate logs)
  public async rotateLogs(daysToKeep: number = 30): Promise<void> {
    try {
      // Rotate file logs
      const logs = this.readLogs();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const recentLogs = logs.filter(log => new Date(log.timestamp) > cutoffDate);
      
      // Rewrite log file with only recent logs
      const logContent = recentLogs.reverse().map(log => this.formatLogEntry(log)).join('');
      fs.writeFileSync(this.logFile, logContent);

      // Rotate database logs
      await db.run('DELETE FROM action_logs WHERE created_at < datetime("now", "-" || ? || " days")', [daysToKeep]);

      await this.info('LOG_ROTATION', { 
        totalFileLogs: logs.length, 
        keptFileLogs: recentLogs.length, 
        daysKept: daysToKeep 
      });
    } catch (error) {
      console.error('Error rotating logs:', error);
    }
  }
}

export default new Logger();
