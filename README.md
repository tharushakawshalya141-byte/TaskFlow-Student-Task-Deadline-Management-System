# Student Task & Deadline Management System (MERN)

A student-focused task manager built with MongoDB, Express, React, and Node.js.

## Features
- Register and log in with JWT authentication
- Create, view, edit, delete tasks
- Task status, priority, subject, notes, due date
- Dashboard statistics and overdue highlighting
- Search and filter tasks
- Responsive dashboard UI

## Requirements
- Node.js 18+
- MongoDB running locally or a MongoDB Atlas connection string

## Setup

### 1. Configure server
```bash
cd server
cp .env.example .env
# Edit .env and set MONGO_URI and JWT_SECRET
npm install
npm run dev
```
Server runs on `http://localhost:5000`.

### 2. Configure client (new terminal)
```bash
cd client
npm install
npm run dev
```
Client runs on `http://localhost:5173`.

## Demo flow
1. Register a student account.
2. Add tasks with a title, subject, priority, and deadline.
3. Change status as you progress.
4. Use search/status filters to find work.

## API
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/tasks`
- `POST /api/tasks`
- `GET /api/tasks/:id`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`

## Notes
- Passwords are hashed with bcrypt.
- Protected endpoints require `Authorization: Bearer <token>`.
- This is a starter academic project. Before production use, add stronger validation, rate limiting, logging, tests, and deployment configuration.
