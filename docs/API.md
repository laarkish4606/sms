# REST API Reference

Base URL: `http://localhost:5000/api/v1`

All endpoints (except `/auth/login`, `/auth/refresh`, `/auth/forgot-password`, `/auth/reset-password/:token`) require:

```
Authorization: Bearer <accessToken>
```

Multi-school scoping: `school_admin`, `teacher`, `student`, `parent`, and `accountant` are automatically scoped to `req.user.school`. `super_admin` may pass `x-school-id: <schoolId>` to act within a specific school.

## Response envelope

Success:
```json
{ "success": true, "message": "...", "data": {}, "meta": { "page": 1, "limit": 10, "total": 42, "pages": 5 } }
```
Error:
```json
{ "success": false, "message": "...", "errors": [{ "field": "email", "message": "Invalid email" }] }
```

## List query parameters

Every list endpoint supports:
- `page`, `limit` — pagination (default `page=1`, `limit=10`, max `limit=100`)
- `sort` — comma-separated fields, prefix `-` for descending (default `-createdAt`)
- `search` — free-text search across the resource's indexed text fields
- `fields` — comma-separated projection
- any other query param is applied as an exact-match filter (e.g. `?class=<id>&status=active`)

---

## Auth — `/auth`

| Method | Path | Roles | Description |
|---|---|---|---|
| POST | `/login` | public | `{ email, password }` → `{ user, accessToken }` + sets refresh cookie |
| POST | `/refresh` | public (cookie) | Rotates tokens using the httpOnly refresh cookie |
| POST | `/logout` | any | Clears refresh cookie |
| POST | `/forgot-password` | public | `{ email }` → emails reset link |
| POST | `/reset-password/:token` | public | `{ password }` |
| GET | `/me` | any | Current user profile |
| PATCH | `/change-password` | any | `{ currentPassword, newPassword }` |

## Schools — `/schools` (super_admin only)

CRUD for schools. `POST /schools` also creates the first `school_admin` account atomically: `{ name, code, email, adminFirstName, adminLastName, adminEmail, adminPassword }`.

## Users — `/users`

| Method | Path | Roles | Description |
|---|---|---|---|
| POST | `/users/me/avatar` | any | Upload own avatar (multipart `avatar`) |
| GET | `/users/directory` | any | Lightweight in-school user list for messaging |
| GET/POST | `/users` | school_admin | List / create `accountant` or extra `school_admin` accounts |
| GET/PATCH | `/users/:id` | school_admin | View / update a staff account |
| PATCH | `/users/:id/status` | school_admin | `{ isActive }` |

## Students — `/students`

| Method | Path | Roles |
|---|---|---|
| GET/POST | `/students` | admin, teacher, accountant (GET) / admin (POST) |
| GET | `/students/me` | student (own profile) |
| GET | `/students/:id` | admin, teacher, accountant, and the student/parent who owns the record |
| PATCH/DELETE | `/students/:id` | school_admin |
| POST | `/students/:id/photo` | school_admin (multipart `photo`) |
| POST | `/students/promote` | school_admin — `{ studentIds[], toClass, toSection, toAcademicYear }` |

## Teachers — `/teachers`

Standard CRUD plus `POST /teachers/:id/photo`, `PATCH /teachers/:id/assign` (`{ subjects[], sections[], isClassTeacherOf }`), `GET /teachers/:id/attendance-summary`.

## Parents — `/parents`

CRUD plus `GET /parents/me/children`, `POST /parents/:id/children` (`{ studentId }`), `DELETE /parents/:id/children/:studentId`, and read views: `GET /parents/children/:studentId/attendance|grades|fees`.

## Academics

- `/academic-years` — CRUD + `PATCH /academic-years/:id/set-current`
- `/classes` — CRUD + `PATCH /classes/:id/assign-subject` (`{ subject, teacher }`)
- `/sections` — CRUD (filter with `?class=<id>`)
- `/subjects` — CRUD
- `/timetables` — `GET /timetables/section/:sectionId?academicYear=`, `GET /timetables/teacher/:teacherId`, `PUT /timetables` (upsert `{ class, section, academicYear, periods[] }`)

## Attendance — `/attendance`

| Method | Path | Description |
|---|---|---|
| POST | `/attendance/students` | `{ class, section, date, records: [{ student, status, remarks }] }` |
| GET | `/attendance/students` | List (auto-scoped for student/parent) |
| GET | `/attendance/students/report?section=&from=&to=` | Per-student summary |
| POST | `/attendance/teachers` | `{ date, records: [{ teacher, status, checkIn, checkOut }] }` |
| GET | `/attendance/teachers` | List |

## Examinations — `/exams`

CRUD, plus:
- `PATCH /exams/:id/publish`
- `POST /exams/:examId/marks` — `{ records: [{ student, subject, obtainedMarks, isAbsent }] }`
- `GET /exams/:examId/marks`
- `GET /exams/:examId/results-summary` — ranked class results
- `GET /exams/:examId/report-card/:studentId` — computed grade/GPA report card

## Fee Management — `/fees`

- `/fees/structures` — CRUD (`{ academicYear, class, items: [{ name, amount, frequency }] }`)
- `POST /fees/invoices/generate` — `{ class, academicYear, dueDate }` — bulk-generates invoices from the class fee structure
- `GET /fees/invoices`, `GET /fees/invoices/overdue`, `GET /fees/invoices/:id`
- `POST /fees/invoices/:invoiceId/payments` — `{ amount, method, transactionRef }`
- `GET /fees/invoices/:invoiceId/payments`
- `GET /fees/payments/:paymentId/receipt` — streams a PDF receipt

## Library — `/library`

- `/library/books` — CRUD
- `POST /library/issues` — `{ bookId, borrowerType: 'Student'|'Teacher', borrowerId, dueDate? }`
- `PATCH /library/issues/:id/return`
- `GET /library/issues`

## Transport — `/transport`

- `/transport/vehicles`, `/transport/routes` — CRUD
- `GET /transport/routes/:routeId/students`
- `PUT /transport/students/:studentId/allocation` — `{ routeId, pickupPoint }`
- `DELETE /transport/students/:studentId/allocation`

## Hostel — `/hostel`

- `/hostel/hostels`, `/hostel/rooms` — CRUD (creating a room auto-generates its beds from `capacity`)
- `POST /hostel/rooms/:roomId/allocate` — `{ studentId }`
- `PATCH /hostel/rooms/:roomId/beds/:bedId/vacate`

## Communication — `/communication`

- `/communication/notices` — CRUD (`{ title, content, audience, sendEmail }`)
- `POST /communication/messages` — `{ recipient, subject, body }`
- `GET /communication/messages/inbox`, `GET /communication/messages/sent`
- `PATCH /communication/messages/:id/read`

## Reports — `/reports`

- `GET /reports/attendance?section=&from=&to=` / `.../export/excel`
- `GET /reports/academic?exam=` / `.../export/excel`
- `GET /reports/financial?from=&to=` / `.../export/excel` / `.../export/pdf`

## Settings — `/settings` (school_admin)

- `GET /settings`
- `PATCH /settings/school-info`
- `PATCH /settings/system-config` — `{ currency, timezone, dateFormat, gradingScale }`
- `POST /settings/logo` (multipart `logo`)

## Dashboard — `/dashboard`

- `GET /dashboard/admin` (school_admin, accountant)
- `GET /dashboard/teacher` (teacher)
- `GET /dashboard/student` (student, parent)
