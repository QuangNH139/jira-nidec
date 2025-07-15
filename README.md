# Scrum Project Management Application

A full-stack web application for managing Scrum projects, built with React and Node.js.

## 🚀 Features

### ✅ Implemented
- **User Authentication**: JWT-based login/register system
- **Project Management**: Create, view, and manage projects
- **User Roles**: Admin, Developer, Viewer roles
- **Dashboard**: Overview of projects and statistics
- **Responsive Design**: Mobile-friendly interface

### 🔄 Coming Soon
- **Sprint Management**: Create and manage sprints
- **Issue/Task Management**: Create, assign, and track issues
- **Kanban Board**: Drag-and-drop task management
- **Comments System**: Issue discussions
- **Real-time Updates**: Live collaboration features

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend
- **React** - UI framework
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **React Hook Form** - Form management
- **React Hot Toast** - Notifications
- **Lucide React** - Icons

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn package manager

## 🚀 Quick Start

### 1. Setup & Install Dependencies

```bash
# Make setup script executable
chmod +x setup.sh

# Run setup script
./setup.sh
```

### 2. Start Backend Server

```bash
cd backend
npm run dev
```

The backend server will start on `http://localhost:5000`

### 3. Start Frontend Application

```bash
# In a new terminal
cd frontend
npm start
```

The frontend application will start on `http://localhost:3000`

## 🔐 Demo Accounts

The setup script creates demo accounts for testing:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.com | demo123 |
| Developer | dev@demo.com | demo123 |

## 📊 Database Schema

### Core Tables
- **users** - User accounts and profiles
- **projects** - Project information
- **project_members** - Project team members
- **sprints** - Sprint management
- **issues** - Tasks, bugs, stories
- **issue_statuses** - Custom workflow statuses
- **comments** - Issue discussions

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Projects
- `GET /api/projects` - Get user projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Users
- `GET /api/users` - Get all users
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/:id` - Update user

### Issues (Coming Soon)
- `GET /api/issues/project/:id` - Get project issues
- `POST /api/issues` - Create new issue
- `PUT /api/issues/:id` - Update issue
- `DELETE /api/issues/:id` - Delete issue

## 🎯 Project Structure

```
jira/
├── backend/
│   ├── database/          # Database connection and setup
│   ├── middleware/        # Express middleware
│   ├── models/           # Data models
│   ├── routes/           # API routes
│   ├── scripts/          # Database initialization
│   ├── .env              # Environment variables
│   ├── package.json      # Dependencies
│   └── server.js         # Entry point
│
├── frontend/
│   ├── public/           # Static files
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── context/      # React context
│   │   ├── hooks/        # Custom hooks
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   ├── utils/        # Utility functions
│   │   ├── App.js        # Main app component
│   │   └── index.js      # Entry point
│   ├── package.json      # Dependencies
│   └── tailwind.config.js # Tailwind configuration
│
├── setup.sh              # Setup script
└── README.md             # This file
```

## 🔄 Development Workflow

### Backend Development

```bash
cd backend

# Install dependencies
npm install

# Initialize database
npm run init-db

# Start development server
npm run dev

# Start production server
npm start
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   - Backend: Change `PORT` in `.env` file
   - Frontend: React will automatically suggest a different port

2. **Database connection issues**
   - Ensure the database file exists: `backend/database/scrum.db`
   - Run initialization script: `npm run init-db`

3. **CORS errors**
   - Ensure backend server is running on port 5000
   - Check proxy setting in frontend `package.json`

## 🚧 Future Enhancements

- [ ] Sprint management with planning and retrospectives
- [ ] Advanced Kanban board with drag-and-drop
- [ ] Time tracking and reporting
- [ ] File attachments for issues
- [ ] Email notifications
- [ ] Real-time collaboration with WebSockets
- [ ] Advanced search and filtering
- [ ] Burndown charts and analytics
- [ ] API documentation with Swagger
- [ ] Unit and integration tests
- [ ] Docker containerization
- [ ] CI/CD pipeline

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions, please create an issue in the repository.

---

**Happy coding!** 🎉
