@echo off
REM Student Discipline System - Setup Script for Windows
REM This script sets up the entire development environment

echo 🚀 Setting up Student Discipline System...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js v18 or higher.
    pause
    exit /b 1
)

echo ✅ Node.js detected

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Docker is not installed. Database setup will be skipped.
    echo    Please install Docker to run the PostgreSQL database.
    set SKIP_DOCKER=true
) else (
    echo ✅ Docker detected
)

REM Install dependencies
echo 📦 Installing dependencies...
call npm run install:all

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully

REM Setup database (if Docker is available)
if not "%SKIP_DOCKER%"=="true" (
    echo 🗄️  Starting database...
    cd database
    docker-compose up -d
    
    if %errorlevel% equ 0 (
        echo ✅ Database started successfully
        echo    PostgreSQL: localhost:5432
        echo    PgAdmin: http://localhost:5050 ^(admin@example.com / admin^)
    ) else (
        echo ⚠️  Failed to start database. You may need to start it manually.
    )
    cd ..
)

REM Check if environment file exists
if not exist "backend\.env" (
    echo ⚠️  Backend .env file not found. Copying from .env.example...
    copy "backend\.env.example" "backend\.env"
    echo ✅ Environment file created. Please update with your settings.
) else (
    echo ✅ Environment file exists
)

echo.
echo 🎉 Setup complete!
echo.
echo To start the development servers:
echo   npm run dev
echo.
echo URLs:
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:3001
echo   Database: localhost:5432
echo   PgAdmin:  http://localhost:5050
echo.
echo For more information, see requirements.txt
pause