import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import AuthBootstrap from './routes/AuthBootstrap.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import RoleRoute from './routes/RoleRoute.jsx';
import AuthLayout from './layouts/AuthLayout.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';

import Login from './pages/auth/Login.jsx';
import ForgotPassword from './pages/auth/ForgotPassword.jsx';
import ResetPassword from './pages/auth/ResetPassword.jsx';
import ChangePassword from './pages/auth/ChangePassword.jsx';

import Dashboard from './pages/dashboard/Dashboard.jsx';
import SchoolsPage from './pages/schools/SchoolsPage.jsx';
import StudentsPage from './pages/students/StudentsPage.jsx';
import StudentDetail from './pages/students/StudentDetail.jsx';
import TeachersPage from './pages/teachers/TeachersPage.jsx';
import ParentsPage from './pages/parents/ParentsPage.jsx';
import StaffPage from './pages/staff/StaffPage.jsx';
import AcademicsPage from './pages/academics/AcademicsPage.jsx';
import AttendancePage from './pages/attendance/AttendancePage.jsx';
import ExamsPage from './pages/exams/ExamsPage.jsx';
import EnterMarksPage from './pages/exams/EnterMarksPage.jsx';
import ExamResultsPage from './pages/exams/ExamResultsPage.jsx';
import ReportCardPage from './pages/exams/ReportCardPage.jsx';
import FeesPage from './pages/fees/FeesPage.jsx';
import LibraryPage from './pages/library/LibraryPage.jsx';
import TransportPage from './pages/transport/TransportPage.jsx';
import HostelPage from './pages/hostel/HostelPage.jsx';
import CommunicationPage from './pages/communication/CommunicationPage.jsx';
import ReportsPage from './pages/reports/ReportsPage.jsx';
import SettingsPage from './pages/settings/SettingsPage.jsx';
import Forbidden from './pages/misc/Forbidden.jsx';
import NotFound from './pages/misc/NotFound.jsx';

export default function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ className: 'text-sm' }} />
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
    </>
  );
}
