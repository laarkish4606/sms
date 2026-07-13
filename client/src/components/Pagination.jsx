import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ meta, onPageChange }) {
  if (!meta || meta.pages <= 1) return null;
  const { page, pages, total } = meta;

  return (
    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-800">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Page {page} of {pages} ({total} total)
      </p>
      <div className="flex gap-2">
        <button
          className="btn-secondary px-2 py-1"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          className="btn-secondary px-2 py-1"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
