import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export default function Forbidden() {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <ShieldAlert size={40} className="text-red-500" />
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Access Denied</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">You don't have permission to view this page.</p>
      <Link to="/" className="btn-primary mt-2">
        Go to Dashboard
      </Link>
    </div>
  );
}
