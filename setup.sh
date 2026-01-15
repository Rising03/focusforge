#!/bin/bash

# Student Discipline System - Setup Script
# This script sets up the entire development environment

echo "🚀 Setting up Student Discipline System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js v18 or higher."
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker is not installed. Database setup will be skipped."
    echo "   Please install Docker to run the PostgreSQL database."
    SKIP_DOCKER=true
else
    echo "✅ Docker detected"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm run install:all

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Setup database (if Docker is available)
if [ "$SKIP_DOCKER" != true ]; then
    echo "🗄️  Starting database..."
    cd database
    docker-compose up -d
    
    if [ $? -eq 0 ]; then
        echo "✅ Database started successfully"
        echo "   PostgreSQL: localhost:5432"
        echo "   PgAdmin: http://localhost:5050 (admin@example.com / admin)"
    else
        echo "⚠️  Failed to start database. You may need to start it manually."
    fi
    cd ..
fi

# Check if environment file exists
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Backend .env file not found. Copying from .env.example..."
    cp backend/.env.example backend/.env
    echo "✅ Environment file created. Please update with your settings."
else
    echo "✅ Environment file exists"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the development servers:"
echo "  npm run dev"
echo ""
echo "URLs:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3001"
echo "  Database: localhost:5432"
echo "  PgAdmin:  http://localhost:5050"
echo ""
echo "For more information, see requirements.txt"