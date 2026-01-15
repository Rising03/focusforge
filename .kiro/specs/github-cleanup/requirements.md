# GitHub Cleanup Specification

## Overview
Prepare the Student Discipline System project for GitHub upload by removing development artifacts, debug files, and sensitive information while maintaining essential project structure and documentation.

## User Story
As a developer, I want to clean up the project repository so that it's ready for public GitHub upload with only essential files, proper .gitignore configuration, and no sensitive information exposed.

## Current State Analysis
The project root contains approximately 200+ files including:
- **Debug/Test Files**: `test-*.js`, `debug-*.js`, `check-*.js`, `verify-*.js`
- **Status/Fix Documentation**: `*-FIX.md`, `*-COMPLETE.md`, `*-STATUS.md`, `ALL_*.md`
- **Development Scripts**: Various one-off testing and debugging scripts
- **Sensitive Files**: `backend/.env` (contains API keys and secrets)
- **Essential Files**: Core source code, package.json, setup scripts, README.md

## Acceptance Criteria

### 1. File Cleanup
- [ ] Remove all debug files (`debug-*.js`, `debug-*.ts`)
- [ ] Remove all test files (`test-*.js`, `test-*.ts`, `test-*.html`)
- [ ] Remove all status/fix markdown files (`*-FIX.md`, `*-COMPLETE.md`, `*-STATUS.md`, `ALL_*.md`)
- [ ] Remove development verification scripts (`verify-*.js`, `check-*.js`)
- [ ] Remove temporary HTML test files (`frontend/public/test-*.html`, `frontend/public/debug-*.html`)
- [ ] Keep essential documentation (`README.md`, `DEPLOYMENT.md`, setup guides)

### 2. .gitignore Configuration
- [ ] Create comprehensive .gitignore file if not exists
- [ ] Ensure `backend/.env` is ignored (contains sensitive API keys)
- [ ] Ignore `node_modules/` directories
- [ ] Ignore build outputs (`dist/`, `build/`)
- [ ] Ignore log files (`logs/`, `*.log`)
- [ ] Ignore IDE/editor files (`.vscode/`, `.idea/`)
- [ ] Ignore OS files (`.DS_Store`, `Thumbs.db`)

### 3. Sensitive Information Protection
- [ ] Verify `backend/.env` contains no placeholder values
- [ ] Ensure no API keys or secrets are in source code
- [ ] Check that `backend/.env.example` exists with placeholder values
- [ ] Verify database credentials are not hardcoded

### 4. Essential Files to Keep
- [ ] Core source code (`frontend/src/`, `backend/src/`)
- [ ] Configuration files (`package.json`, `tsconfig.json`, `vite.config.js`)
- [ ] Setup scripts (`setup.sh`, `setup.bat`, `verify-setup.js`)
- [ ] Docker configuration (`docker-compose.yml`, `Dockerfile.*`)
- [ ] Database schema (`database/init.sql`, migration files)
- [ ] Documentation (`README.md`, `DEPLOYMENT.md`, `requirements.txt`)
- [ ] Kiro specifications (`.kiro/specs/`, `.kiro/steering/`)

### 5. Project Structure Validation
- [ ] Verify all essential npm scripts still work
- [ ] Ensure development setup still functions
- [ ] Confirm production build process works
- [ ] Test that Docker containers start correctly

## Files to Remove (Examples)
```
Root level cleanup:
- test-*.js (all test scripts)
- debug-*.js (all debug scripts)
- check-*.js (database check scripts)
- verify-*.js (verification scripts except verify-setup.js)
- *-FIX.md (fix documentation)
- *-COMPLETE.md (completion status files)
- *-STATUS.md (status reports)
- ALL_*.md (summary files)
- BEFORE_AFTER_*.md (comparison files)
- QUICK_*.md (quick reference files)
- TEST_*.md (test documentation)

Frontend cleanup:
- frontend/public/test-*.html
- frontend/public/debug-*.html
- frontend/public/fix-*.html

Backend cleanup:
- backend/test-*.js
- backend/debug-*.js
- backend/check-*.js
- backend/diagnose-*.js
- backend/apply-*.js
- backend/force-*.js
```

## Files to Keep
```
Essential project files:
- README.md
- package.json, package-lock.json
- setup.sh, setup.bat
- verify-setup.js (main setup verification)
- docker-compose.yml
- Dockerfile.*, nginx.conf
- requirements.txt
- DEPLOYMENT.md

Source code:
- frontend/src/** (all source code)
- backend/src/** (all source code)
- database/init.sql
- database/*_migration.sql

Configuration:
- frontend/package.json, tsconfig.json, vite.config.js, tailwind.config.js
- backend/package.json, tsconfig.json, jest.config.js
- backend/.env.example (template)
- .kiro/** (specifications and steering)
```

## Implementation Plan

### Phase 1: Backup and Analysis
1. Create list of all files to be removed
2. Verify no essential functionality depends on files to be removed
3. Backup current state if needed

### Phase 2: File Removal
1. Remove debug and test files
2. Remove status and fix documentation
3. Remove temporary HTML files
4. Clean up development scripts

### Phase 3: .gitignore Setup
1. Create/update .gitignore file
2. Ensure sensitive files are properly ignored
3. Test git status to verify ignored files

### Phase 4: Validation
1. Test npm scripts functionality
2. Verify development setup works
3. Confirm production build process
4. Test Docker container startup

## Success Metrics
- Project root contains <50 files (down from 200+)
- All development artifacts removed
- .gitignore properly configured
- No sensitive information exposed
- All essential functionality preserved
- Clean, professional repository structure ready for GitHub

## Risk Mitigation
- Keep backup of current state before cleanup
- Test essential functionality after each cleanup phase
- Verify no breaking changes to core application
- Ensure setup and deployment processes still work

## Dependencies
- Requires understanding of which files are essential vs. development artifacts
- Need to verify no hardcoded references to files being removed
- Must ensure .env file security before GitHub upload