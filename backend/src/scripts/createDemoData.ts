import db from '../database/connection';
import bcrypt from 'bcryptjs';

async function createDemoData(): Promise<void> {
  try {
    console.log('🌱 Creating demo data...');
    
    // Create demo users
    const hashedPassword = await bcrypt.hash('demo123', 10);
    
    const adminResult = await db.run(
      `INSERT OR IGNORE INTO users (username, email, password, full_name, role) 
       VALUES (?, ?, ?, ?, ?)`,
      ['admin', 'admin@demo.com', hashedPassword, 'Admin User', 'admin']
    );
    
    const devResult = await db.run(
      `INSERT OR IGNORE INTO users (username, email, password, full_name, role) 
       VALUES (?, ?, ?, ?, ?)`,
      ['developer', 'dev@demo.com', hashedPassword, 'Developer User', 'developer']
    );
    
    console.log('✅ Demo users created!');
    console.log('📧 Admin: admin@demo.com | Password: demo123');
    console.log('📧 Developer: dev@demo.com | Password: demo123');
    
    // Create demo project
    const projectResult = await db.run(
      `INSERT OR IGNORE INTO projects (name, description, key, owner_id) 
       VALUES (?, ?, ?, ?)`,
      ['Demo Project', 'A sample project for demonstration', 'DEMO', 1]
    );
    
    // Add project members
    await db.run(
      `INSERT OR IGNORE INTO project_members (project_id, user_id, role) 
       VALUES (?, ?, ?)`,
      [1, 1, 'owner']
    );
    
    await db.run(
      `INSERT OR IGNORE INTO project_members (project_id, user_id, role) 
       VALUES (?, ?, ?)`,
      [1, 2, 'member']
    );
    
    // Create demo sprint
    await db.run(
      `INSERT OR IGNORE INTO sprints (name, goal, project_id, status) 
       VALUES (?, ?, ?, ?)`,
      ['Sprint 1', 'Demo sprint for testing features', 1, 'active']
    );
    
    // Create demo issues
    await db.run(
      `INSERT OR IGNORE INTO issues (title, description, type, priority, status_id, assignee_id, reporter_id, project_id, sprint_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['Setup project structure', 'Initialize the basic project structure and dependencies', 'task', 'high', 3, 1, 1, 1, 1]
    );
    
    await db.run(
      `INSERT OR IGNORE INTO issues (title, description, type, priority, status_id, assignee_id, reporter_id, project_id, sprint_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['Design user interface', 'Create wireframes and design mockups for the application', 'story', 'medium', 2, 2, 1, 1, 1]
    );
    
    await db.run(
      `INSERT OR IGNORE INTO issues (title, description, type, priority, status_id, assignee_id, reporter_id, project_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['Fix login bug', 'Users unable to login with correct credentials', 'bug', 'high', 1, 2, 1, 1]
    );
    
    console.log('✅ Demo project and data created!');
    console.log('✅ Setup complete!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating demo data:', error);
    process.exit(1);
  }
}

createDemoData();
