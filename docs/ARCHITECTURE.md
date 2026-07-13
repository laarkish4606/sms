# School Management System — Architecture

## 1. Overview

A multi-tenant-ready School Management System (SMS) built as a decoupled SPA + REST API.

```
                          ┌────────────────────┐
                          │   React SPA (Vite)  │
                          │  Redux Toolkit +     │
                          │  RTK Query, Tailwind │
                          └──────────┬───────────┘
                                     │ HTTPS / JSON (JWT bearer)
                          ┌──────────▼───────────┐
                          │  Express REST API     │
                          │  MVC + middleware      │
                          │  (helmet, cors, rate-  │
                          │   limit, sanitize)     │
                          └──────────┬───────────┘
                                     │ Mongoose ODM
                          ┌──────────▼───────────┐
                          │      MongoDB           │
                          └────────────────────────┘
```

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Redux Toolkit, RTK Query, React Router 6 |
| Backend | Node.js, Express.js (MVC) |
| Database | MongoDB + Mongoose |
| Auth | JWT (access + refresh), bcrypt |
| Uploads | Multer (local disk in dev, swappable for S3) |
| Email | Nodemailer |
| Docs | OpenAPI-style Markdown (docs/API.md) |
| Reports | pdfkit (PDF), exceljs (Excel) |

## 3. Monorepo Folder Structure

```
sms/
├── server/                      # Express API
│   ├── src/
│   │   ├── config/              # env, db connection, mailer, multer config
│   │   ├── models/               # Mongoose schemas
│   │   ├── controllers/          # request handlers (business logic delegated to services)
│   │   ├── services/             # reusable business logic (id generation, grading, reports)
│   │   ├── routes/               # express routers, one per module
│   │   ├── middleware/           # auth, rbac, error, validation, upload, rateLimit
│   │   ├── validators/           # express-validator chains
│   │   ├── utils/                # ApiError, ApiResponse, asyncHandler, apiFeatures
│   │   └── app.js                # express app assembly
│   ├── uploads/                  # local file storage (gitignored)
│   ├── server.js                 # entry point
│   ├── .env.example
│   └── package.json
├── client/                       # React SPA
│   ├── src/
│   │   ├── app/                  # store.js, hooks.js
│   │   ├── api/                  # RTK Query base api + injected endpoints per module
│   │   ├── features/             # redux slices (auth, theme, ui)
│   │   ├── components/           # reusable UI (Table, Modal, Pagination, etc.)
│   │   ├── layouts/               # DashboardLayout, AuthLayout
│   │   ├── pages/                 # route-level pages, grouped by module
│   │   ├── routes/                # AppRoutes.jsx, ProtectedRoute, RoleRoute
│   │   ├── utils/                 # helpers (formatters, constants)
│   │   └── main.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
└── docs/
    ├── ARCHITECTURE.md
    └── API.md
```

## 4. Design Patterns

- **MVC**: routes → controllers → models, with a thin `services/` layer for logic reused across controllers (e.g. ID generation, GPA calculation, report builders).
- **asyncHandler** wraps every controller to forward errors to a single centralized `errorHandler` middleware (no try/catch repetition).
- **ApiError / ApiResponse** utility classes standardize error and success payload shape.
- **apiFeatures** utility centralizes pagination, filtering, sorting, and search (`?page=&limit=&sort=&search=&field=value`) so every list endpoint behaves consistently.
- **RBAC middleware** (`authorize('admin','teacher')`) declaratively restricts routes per role, layered on top of `protect` (JWT verification).
- **Multi-tenant ready**: every school-owned document carries a `school` ref (School model) so a Super Admin can operate across schools while School Admins are scoped to their own via middleware injecting `req.schoolId` into query filters.

## 5. User Roles & Access

| Role | Scope |
|---|---|
| super_admin | Manages Schools, School Admins, global settings. Full cross-school access. |
| school_admin | Full access within their school (all modules). |
| teacher | Own classes/subjects: attendance, marks entry, timetable view, messaging. |
| student | Own profile, attendance, results, fees, timetable, library, messaging (read-mostly). |
| parent | Linked children's data: attendance, results, fees, messaging (read-mostly). |
| accountant | Fee management, payments, financial reports. |

RBAC is enforced both by middleware (route-level) and by controller-level ownership checks (e.g. a parent can only fetch children linked to their own `parent` document; a teacher can only mark attendance for classes they are assigned to).

## 6. Authentication Flow

1. `POST /auth/login` → verify credentials → issue short-lived **access token** (15m, JWT) + long-lived **refresh token** (7d, JWT, httpOnly cookie).
2. Client attaches `Authorization: Bearer <accessToken>` to requests.
3. `POST /auth/refresh` reads the httpOnly cookie, rotates and reissues tokens.
4. `POST /auth/logout` clears the refresh cookie and (optionally) blacklists it.
5. `POST /auth/forgot-password` emails a time-limited reset token (hashed in DB, raw value emailed).
6. `POST /auth/reset-password/:token` verifies hash + expiry, sets new password.
7. `PATCH /auth/change-password` for logged-in users (requires current password).

## 7. Security Measures

- `helmet()` for secure headers.
- `cors()` restricted to configured origin(s), credentials enabled for refresh cookie.
- `express-rate-limit` global + stricter limiter on `/auth/*`.
- `express-mongo-sanitize` + custom XSS sanitizer strip `$`/`.` operators and script content from `req.body/query/params`.
- `bcrypt` (cost 12) for password hashing; passwords never returned in responses (`select: false`).
- `express-validator` on every write route; centralized `validate` middleware returns 422 with field errors.
- JWT secrets, DB URI, SMTP creds all via `.env`, never committed.
- File uploads restricted by MIME type + size via Multer; stored outside of publicly served paths except a dedicated `/uploads` static route for images.
- Centralized error handler never leaks stack traces in production.

## 8. Database Schema (relationships)

See `docs/API.md` for full field lists. Key relations:

```
School 1─* User (all roles reference School except super_admin)
School 1─* AcademicYear 1─* Class 1─* Section
Class *─* Subject (via ClassSubject / subjects[] on Class with teacher ref)
User(role=teacher) 1─1 Teacher (profile) *─* Subject, *─* Section (assignments)
User(role=student) 1─1 Student (profile) *─1 Class *─1 Section
User(role=parent)  1─1 Parent *─* Student (children[])
Student 1─* Attendance(studentAttendance)
Teacher 1─* Attendance(teacherAttendance)
AcademicYear 1─* Exam 1─* ExamSubject 1─* Mark(*─1 Student)
Student 1─* FeeInvoice 1─* Payment
Section 1─* Timetable(periods[] → subject, teacher)
Book 1─* BookIssue *─1 Student/Teacher
TransportRoute 1─* Vehicle, Route *─* Student (allocation)
Hostel 1─* Room 1─* BedAllocation *─1 Student
Notice / Message  (school-wide or targeted by role/class)
```

## 9. API Design Conventions

- Base URL: `/api/v1`
- Resource-oriented REST: `GET/POST /students`, `GET/PATCH/DELETE /students/:id`
- List endpoints support `?page=&limit=&sort=-createdAt&search=&status=active`
- Consistent envelope:
  ```json
  { "success": true, "data": [...], "meta": { "page": 1, "limit": 10, "total": 42, "pages": 5 } }
  ```
  ```json
  { "success": false, "message": "Student not found", "errors": [] }
  ```
- Versioned via URL prefix to allow future breaking changes without disrupting existing clients.

Full endpoint-by-endpoint reference: see `docs/API.md`.
