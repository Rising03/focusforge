# FocusForge

**Build Discipline. Forge Your Future.**

A production-grade discipline and daily focus web application for students to build consistency, track progress, and optimize their daily routines through AI-powered personalization. This app based on book Atomic Habit by James Clear and Deep Work by Kal Newport

## 🚀 Quick Start

### Prerequisites
- Node.js v18+ 
- Docker & Docker Compose
- Git

### Installation

#### Windows
```cmd
git clone https://github.com/yourusername/focusforge.git
cd focusforge
setup.bat
```

#### Linux/macOS
```bash
git clone https://github.com/yourusername/focusforge.git
cd focusforge
chmod +x setup.sh
./setup.sh
```

#### Manual Setup
```bash
npm run setup
```

### Start Development
```bash
npm run dev
```

Visit http://localhost:5173 to use the application.

## 🛠️ Technology Stack

### Frontend
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-Rolldown-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css&logoColor=white)

### Backend
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?logo=json-web-tokens&logoColor=white)

### AI & Testing
![Google Gemini](https://img.shields.io/badge/Google-Gemini-4285F4?logo=google&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-Testing-C21325?logo=jest&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)

## ✨ Features

### 🎯 Core Functionality
- **AI-Powered Daily Routines**: Personalized schedules based on your goals, energy patterns, and available time
- **Smart Habit Tracking**: Build consistency with intelligent habit stacking, streak tracking, and completion logging
- **Deep Work Sessions**: Distraction-free environment with attention training and focus quality monitoring
- **Evening Reviews**: Structured reflection and planning for continuous improvement

### 📊 Analytics & Insights
- **Progress Visualization**: Detailed insights into patterns, consistency scores, and behavioral trends
- **Activity Tracking**: Monitor time utilization, focus quality, and session durations
- **Personalization Metrics**: AI learns from your behavior to provide better recommendations

### 🤖 AI Integration
- **Natural Language Input**: Describe your day in plain English, AI creates your routine
- **Smart Suggestions**: Get personalized recommendations based on your patterns
- **Routine Optimization**: AI continuously improves your schedule based on completion data

### 🎨 User Experience
- **Mobile-Responsive Design**: Works seamlessly across all devices
- **PWA Support**: Install as a native app on any platform
- **Google OAuth**: Easy authentication with your Google account
- **Dark Mode**: Beautiful dark theme optimized for focus
- **Real-time Feedback**: Instant progress updates and visual feedback

### 🔒 Privacy & Security
- **Secure Authentication**: JWT tokens with refresh mechanism
- **Data Export**: Export your data anytime for mobile apps or external analysis
- **Local Storage**: Your data stays secure in your PostgreSQL database

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Build Tool**: Vite (Rolldown)
- **State Management**: React hooks and context
- **Testing**: Jest + React Testing Library + Property-based testing

### Backend (Node.js + TypeScript)
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with raw SQL queries
- **Authentication**: JWT + Google OAuth
- **AI Integration**: Google Gemini API
- **Testing**: Jest + Supertest + Property-based testing
- **Logging**: Winston

### Database
- **Primary**: PostgreSQL 15+
- **Admin**: PgAdmin 4 (optional)
- **Migrations**: SQL scripts

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Start frontend only
npm run dev:backend      # Start backend only

# Building
npm run build            # Build both frontend and backend
npm run build:frontend   # Build frontend only
npm run build:backend    # Build backend only

# Testing
npm run test             # Run all tests
npm run test:frontend    # Run frontend tests
npm run test:backend     # Run backend tests

# Setup & Verification
npm run install:all      # Install all dependencies
npm run verify          # Verify setup
npm run setup           # Install and verify
```

### Service URLs
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Database**: localhost:5432
- **PgAdmin**: http://localhost:5050 (admin@example.com / admin)

### Project Structure
```
focusforge/
├── frontend/           # React frontend application
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── services/   # API services
│   │   ├── types/      # TypeScript types
│   │   ├── hooks/      # Custom React hooks
│   │   └── __tests__/  # Frontend tests
│   ├── public/         # Static assets
│   └── package.json
├── backend/            # Node.js backend API
│   ├── src/
│   │   ├── controllers/# Route controllers
│   │   ├── services/   # Business logic
│   │   ├── types/      # TypeScript types
│   │   ├── middleware/ # Express middleware
│   │   ├── routes/     # API routes
│   │   └── __tests__/  # Backend tests
│   ├── .env           # Environment variables
│   └── package.json
├── database/          # Database configuration
│   ├── docker-compose.yml
│   ├── init.sql       # Database initialization
│   └── *.sql          # Migration scripts
├── .kiro/             # Kiro specifications
│   └── specs/         # Feature specifications
├── requirements.txt   # Setup documentation
├── setup.sh          # Linux/macOS setup script
├── setup.bat         # Windows setup script
├── verify-setup.js   # Setup verification
└── package.json      # Root package configuration
```

## 🧪 Testing

The project uses comprehensive testing including:

- **Unit Tests**: Component and function testing
- **Integration Tests**: API and user flow testing  
- **Property-Based Tests**: Correctness verification with random inputs
- **End-to-End Tests**: Complete user journey testing

### Running Tests
```bash
# All tests
npm run test

# Frontend tests only
npm run test:frontend

# Backend tests only  
npm run test:backend

# Watch mode
cd frontend && npm run test:watch
cd backend && npm run test:watch
```

## 🔧 Configuration

### Environment Variables (backend/.env)
```bash
# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/student_discipline
DB_HOST=localhost
DB_PORT=5432
DB_NAME=student_discipline
DB_USER=postgres
DB_PASSWORD=postgres

# Authentication
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# AI Integration (optional)
GEMINI_API_KEY=your-gemini-api-key

# Logging
LOG_LEVEL=info
```

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Docker Deployment
```bash
# Database only
cd database && docker-compose up -d

# Full stack (coming soon)
docker-compose up -d
```

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines
- ✅ Follow TypeScript strict mode
- ✅ Write tests for new features (unit + integration)
- ✅ Use conventional commit messages
- ✅ Ensure all tests pass: `npm run test`
- ✅ Update documentation as needed

### Code Style
- Use ESLint and Prettier configurations
- Follow the existing code structure
- Add JSDoc comments for complex functions
- Keep components small and focused

## 🐛 Bug Reports & Feature Requests

Found a bug or have a feature idea? Please open an issue on GitHub with:
- Clear description of the problem/feature
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Screenshots if applicable

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

**Port conflicts**: Ensure ports 3001, 5173, 5432, 5050 are available
```bash
# Check what's using a port (Windows)
netstat -ano | findstr :5173

# Check what's using a port (Linux/macOS)
lsof -i :5173
```

**Dependency conflicts**: Use legacy peer deps for frontend
```bash
cd frontend && npm install --legacy-peer-deps
```

**Docker issues**: Ensure Docker Desktop is running
```bash
docker --version
docker-compose --version
```

**Database connection**: Check if PostgreSQL container is running
```bash
docker ps
```

### Reset Installation
```bash
# Clean everything
rm -rf node_modules frontend/node_modules backend/node_modules
rm package-lock.json frontend/package-lock.json backend/package-lock.json

# Reinstall
npm run install:all
```

### Verify Setup
```bash
npm run verify
```

## 📞 Support

Need help? Here are your options:

1. **📖 Documentation**: Check the [requirements.txt](requirements.txt) and [DEPLOYMENT.md](DEPLOYMENT.md)
2. **🔍 Troubleshooting**: See the troubleshooting section above
3. **🐛 Bug Reports**: Open an issue on GitHub
4. **💬 Discussions**: Start a discussion for questions and ideas
5. **✅ Verification**: Run `npm run verify` to check your setup

## 🗺️ Roadmap

### Current Features (v1.0)
- ✅ AI-powered routine generation
- ✅ Habit tracking with streaks
- ✅ Deep work sessions
- ✅ Evening reviews
- ✅ Progress analytics
- ✅ Google OAuth
- ✅ PWA support

### Planned Features (v1.1+)
- 🔄 Mobile app (React Native)
- 🔄 Pomodoro timer integration
- 🔄 Team/study group features
- 🔄 Calendar integrations (Google Calendar, Outlook)
- 🔄 Spaced repetition for learning
- 🔄 Goal tracking with milestones
- 🔄 Social accountability features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ for students seeking to build discipline and achieve their goals
- Powered by Google Gemini AI for intelligent routine optimization
- Inspired by atomic habits, deep work, and productivity research

## ⭐ Star History

If you find FocusForge helpful, please consider giving it a star on GitHub! It helps others discover the project.

---

**Made with 💪 and ☕ by students, for students.**