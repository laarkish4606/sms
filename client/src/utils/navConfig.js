import {
  LayoutDashboard,
  GraduationCap,
  Users,
  UserRound,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  Wallet,
  Library,
  Bus,
  BedDouble,
  MessageSquare,
  FileBarChart,
  Settings,
  Building2,
  Briefcase,
} from 'lucide-react';

export const ALL_ROLES = ['super_admin', 'school_admin', 'teacher', 'student', 'parent', 'accountant'];

// `section` groups items in the sidebar; order here defines display order,
// and section order follows first-appearance below.
export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ALL_ROLES, section: 'Overview' },
  { to: '/schools', label: 'Schools', icon: Building2, roles: ['super_admin'], section: 'Overview' },

  { to: '/students', label: 'Students', icon: GraduationCap, roles: ['school_admin', 'teacher', 'accountant'], section: 'People' },
  { to: '/teachers', label: 'Teachers', icon: Users, roles: ['school_admin', 'accountant'], section: 'People' },
  { to: '/parents', label: 'Parents', icon: UserRound, roles: ['school_admin'], section: 'People' },
  { to: '/staff', label: 'Staff Accounts', icon: Briefcase, roles: ['school_admin'], section: 'People' },

  { to: '/academics', label: 'Academics', icon: BookOpen, roles: ['school_admin', 'teacher'], section: 'Academics' },
  { to: '/attendance', label: 'Attendance', icon: CalendarCheck, roles: ['school_admin', 'teacher', 'student', 'parent'], section: 'Academics' },
  { to: '/exams', label: 'Examinations', icon: ClipboardList, roles: ['school_admin', 'teacher', 'student', 'parent'], section: 'Academics' },

  { to: '/fees', label: 'Fee Management', icon: Wallet, roles: ['school_admin', 'accountant', 'student', 'parent'], section: 'Finance' },

  { to: '/library', label: 'Library', icon: Library, roles: ['school_admin', 'teacher'], section: 'Facilities' },
  { to: '/transport', label: 'Transport', icon: Bus, roles: ['school_admin'], section: 'Facilities' },
  { to: '/hostel', label: 'Hostel', icon: BedDouble, roles: ['school_admin'], section: 'Facilities' },

  { to: '/communication', label: 'Communication', icon: MessageSquare, roles: ALL_ROLES, section: 'Insights' },
  { to: '/reports', label: 'Reports', icon: FileBarChart, roles: ['school_admin', 'teacher', 'accountant'], section: 'Insights' },

  { to: '/settings', label: 'Settings', icon: Settings, roles: ['school_admin'], section: 'System' },
];

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  school_admin: 'School Admin',
  teacher: 'Teacher',
  student: 'Student',
  parent: 'Parent',
  accountant: 'Accountant',
};
