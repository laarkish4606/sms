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

export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ALL_ROLES },
  { to: '/schools', label: 'Schools', icon: Building2, roles: ['super_admin'] },
  { to: '/students', label: 'Students', icon: GraduationCap, roles: ['school_admin', 'teacher', 'accountant'] },
  { to: '/teachers', label: 'Teachers', icon: Users, roles: ['school_admin', 'accountant'] },
  { to: '/parents', label: 'Parents', icon: UserRound, roles: ['school_admin'] },
  { to: '/staff', label: 'Staff Accounts', icon: Briefcase, roles: ['school_admin'] },
  { to: '/academics', label: 'Academics', icon: BookOpen, roles: ['school_admin', 'teacher'] },
  { to: '/attendance', label: 'Attendance', icon: CalendarCheck, roles: ['school_admin', 'teacher', 'student', 'parent'] },
  { to: '/exams', label: 'Examinations', icon: ClipboardList, roles: ['school_admin', 'teacher', 'student', 'parent'] },
  { to: '/fees', label: 'Fee Management', icon: Wallet, roles: ['school_admin', 'accountant', 'student', 'parent'] },
  { to: '/library', label: 'Library', icon: Library, roles: ['school_admin', 'teacher'] },
  { to: '/transport', label: 'Transport', icon: Bus, roles: ['school_admin'] },
  { to: '/hostel', label: 'Hostel', icon: BedDouble, roles: ['school_admin'] },
  { to: '/communication', label: 'Communication', icon: MessageSquare, roles: ALL_ROLES },
  { to: '/reports', label: 'Reports', icon: FileBarChart, roles: ['school_admin', 'teacher', 'accountant'] },
  { to: '/settings', label: 'Settings', icon: Settings, roles: ['school_admin'] },
];

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  school_admin: 'School Admin',
  teacher: 'Teacher',
  student: 'Student',
  parent: 'Parent',
  accountant: 'Accountant',
};
