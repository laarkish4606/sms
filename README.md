# School Management System

A full-stack, multi-role School Management System.

- **Frontend**: React 18 + Vite + Tailwind CSS + Redux Toolkit (RTK Query) + React Router
- **Backend**: Node.js + Express (MVC) + Mongoose/MongoDB
- **Auth**: JWT (access + refresh) + bcrypt + Role-Based Access Control
- **Docs**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) (system design, folder structure, DB schema) and [docs/API.md](docs/API.md) (full endpoint reference)

## Roles

Super Admin · School Admin · Teacher · Student · Parent · Accountant — see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#5-user-roles--access) for scope details.

## Modules

Dashboard & analytics, Student/Teacher/Parent management, Academics (years/classes/sections/subjects/timetable), Attendance, Examinations & report cards, Fee management (invoices/payments/receipts), Library, Transport, Hostel, Communication (notices/messaging), Reports (PDF/Excel export), Settings.

## Getting started

### Prerequisites

- Node.js 18+
- MongoDB, running as a **replica set** (even a single-node one) — the backend uses multi-document transactions when creating a school+admin, student+account, teacher+account, parent+account, and when recording fee payments. A standalone `mongod` will reject these.
  - Local single-node replica set: `mongod --replSet rs0 --dbpath <path>`, then once: `mongosh --eval "rs.initiate()"`
  - Or use a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster, which is a replica set by default.

### Backend

```bash
cd server
cp .env.example .env      # fill in MONGO_URI, JWT secrets, SMTP creds
npm install
npm run dev                # http://localhost:5000
```

### Frontend

```bash
cd client
cp .env.example .env      # VITE_API_URL defaults to /api/v1 (proxied to :5000 in dev)
npm install
npm run dev                # http://localhost:5173
```

### First-time setup

1. Register a `super_admin` directly in MongoDB (there's no public signup — schools are provisioned by a super admin):
   ```js
   // in mongosh, against your database
   db.users.insertOne({
     role: 'super_admin',
     firstName: 'Super', lastName: 'Admin',
     email: 'super@admin.com',
     // bcrypt hash of your chosen password (cost 12) — generate with:
     // node -e "console.log(require('bcryptjs').hashSync('YourPassword123', 12))"
     password: '<bcrypt-hash>',
     isActive: true,
   })
   ```
2. Log in as that super admin at `/login`, go to **Schools**, and create your first school — this also creates its `school_admin` account.
3. Log in as the school admin to create academic years, classes, sections, subjects, then start registering teachers, students, and parents.

## Security

Helmet, CORS allowlist, rate limiting (global + stricter on `/auth`), `express-mongo-sanitize` + custom XSS/operator-injection stripping, `express-validator` on all write routes, bcrypt (cost 12) password hashing, JWT access/refresh rotation with httpOnly refresh cookie, Multer MIME/size-limited uploads. See [docs/ARCHITECTURE.md §7](docs/ARCHITECTURE.md#7-security-measures).

## Repository layout

```
sms/
├── server/     # Express REST API (MVC)
├── client/     # React SPA
└── docs/       # Architecture & API documentation
```
