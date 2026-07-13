import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <FileQuestion size={40} className="text-gray-400" />
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Page Not Found</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn-primary mt-2">
        Go to Dashboard
      </Link>
    </div>
  );
}
