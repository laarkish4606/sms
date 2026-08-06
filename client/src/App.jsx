import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import AuthBootstrap from './routes/AuthBootstrap.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import RoleRoute from './routes/RoleRoute.jsx';
import AuthLayout from './layouts/AuthLayout.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import Spinner from './components/Spinner.jsx';

// Every route below is its own chunk instead of one bundle with all ~30
// pages (charts, exports, etc.) — a teacher opening /attendance on a slow
// mobile connection only downloads the JS that page actually needs.
const Login = lazy(() => import('./pages/auth/Login.jsx'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword.jsx'));
const ChangePassword = lazy(() => import('./pages/auth/ChangePassword.jsx'));

const Dashboard = lazy(() => import('./pages/dashboard/Dashboard.jsx'));
const SchoolsPage = lazy(() => import('./pages/schools/SchoolsPage.jsx'));
const StudentsPage = lazy(() => import('./pages/students/StudentsPage.jsx'));
const StudentDetail = lazy(() => import('./pages/students/StudentDetail.jsx'));
const ImportStudentsPage = lazy(() => import('./pages/students/ImportStudentsPage.jsx'));
const BulkPhotoUploadPage = lazy(() => import('./pages/students/BulkPhotoUploadPage.jsx'));
const PromoteStudentsPage = lazy(() => import('./pages/students/PromoteStudentsPage.jsx'));
const TeachersPage = lazy(() => import('./pages/teachers/TeachersPage.jsx'));
const ParentsPage = lazy(() => import('./pages/parents/ParentsPage.jsx'));
const StaffPage = lazy(() => import('./pages/staff/StaffPage.jsx'));
const AcademicsPage = lazy(() => import('./pages/academics/AcademicsPage.jsx'));
const AttendancePage = lazy(() => import('./pages/attendance/AttendancePage.jsx'));
const ExamsPage = lazy(() => import('./pages/exams/ExamsPage.jsx'));
const EnterMarksPage = lazy(() => import('./pages/exams/EnterMarksPage.jsx'));
const ExamResultsPage = lazy(() => import('./pages/exams/ExamResultsPage.jsx'));
const ReportCardPage = lazy(() => import('./pages/exams/ReportCardPage.jsx'));
const ClassRankingPage = lazy(() => import('./pages/exams/ClassRankingPage.jsx'));
const FeesPage = lazy(() => import('./pages/fees/FeesPage.jsx'));
const LibraryPage = lazy(() => import('./pages/library/LibraryPage.jsx'));
const TransportPage = lazy(() => import('./pages/transport/TransportPage.jsx'));
const HostelPage = lazy(() => import('./pages/hostel/HostelPage.jsx'));
const CommunicationPage = lazy(() => import('./pages/communication/CommunicationPage.jsx'));
const ReportsPage = lazy(() => import('./pages/reports/ReportsPage.jsx'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage.jsx'));
const Forbidden = lazy(() => import('./pages/misc/Forbidden.jsx'));
const NotFound = lazy(() => import('./pages/misc/NotFound.jsx'));

// A small inline spinner while a route chunk loads — never a full-page
// takeover, since the dashboard shell (sidebar/navbar) is already painted.
function RouteFallback() {
  return (
    <div className="flex justify-center py-16">
      <Spinner size={24} />
    </div>
  );
}

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'text-sm !bg-white !text-gray-800 dark:!bg-gray-800 dark:!text-gray-100 shadow-lg',
          success: { iconTheme: { primary: '#059669', secondary: '#fff' } },
          error: { iconTheme: { primary: '#e11d48', secondary: '#fff' } },
        }}
      />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<AuthBootstrap />}>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/profile" element={<ChangePassword />} />

                <Route element={<RoleRoute roles={['super_admin']} />}>
                  <Route path="/schools" element={<SchoolsPage />} />
                </Route>

                <Route element={<RoleRoute roles={['school_admin', 'teacher', 'accountant']} />}>
                  <Route path="/students" element={<StudentsPage />} />
                </Route>
                <Route element={<RoleRoute roles={['school_admin', 'teacher', 'accountant', 'student', 'parent']} />}>
                  <Route path="/students/:id" element={<StudentDetail />} />
                </Route>
                <Route element={<RoleRoute roles={['school_admin']} />}>
                  <Route path="/students/import" element={<ImportStudentsPage />} />
                  <Route path="/students/photos/bulk" element={<BulkPhotoUploadPage />} />
                  <Route path="/students/promote" element={<PromoteStudentsPage />} />
                </Route>

                <Route element={<RoleRoute roles={['school_admin', 'accountant']} />}>
                  <Route path="/teachers" element={<TeachersPage />} />
                </Route>

                <Route element={<RoleRoute roles={['school_admin']} />}>
                  <Route path="/parents" element={<ParentsPage />} />
                  <Route path="/staff" element={<StaffPage />} />
                  <Route path="/transport" element={<TransportPage />} />
                  <Route path="/hostel" element={<HostelPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>

                <Route element={<RoleRoute roles={['school_admin', 'teacher']} />}>
                  <Route path="/academics" element={<AcademicsPage />} />
                  <Route path="/library" element={<LibraryPage />} />
                </Route>

                <Route element={<RoleRoute roles={['school_admin', 'teacher', 'student', 'parent']} />}>
                  <Route path="/attendance" element={<AttendancePage />} />
                </Route>

                <Route element={<RoleRoute roles={['school_admin', 'teacher', 'student', 'parent']} />}>
                  <Route path="/exams" element={<ExamsPage />} />
                  <Route path="/exams/:examId/report-card/:studentId" element={<ReportCardPage />} />
                </Route>
                <Route element={<RoleRoute roles={['school_admin', 'teacher']} />}>
                  <Route path="/exams/:examId/marks" element={<EnterMarksPage />} />
                  <Route path="/exams/:examId/results" element={<ExamResultsPage />} />
                  <Route path="/exams/ranking" element={<ClassRankingPage />} />
                </Route>

                <Route element={<RoleRoute roles={['school_admin', 'accountant', 'student', 'parent']} />}>
                  <Route path="/fees" element={<FeesPage />} />
                </Route>

                <Route element={<RoleRoute roles={['school_admin', 'teacher', 'student', 'parent', 'accountant', 'super_admin']} />}>
                  <Route path="/communication" element={<CommunicationPage />} />
                </Route>

                <Route element={<RoleRoute roles={['school_admin', 'teacher', 'accountant']} />}>
                  <Route path="/reports" element={<ReportsPage />} />
                </Route>

                <Route path="/403" element={<Forbidden />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
