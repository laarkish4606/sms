import Spinner from './Spinner.jsx';
import Pagination from './Pagination.jsx';

/**
 * columns: [{ key, header, render?(row) }]
 */
export default function DataTable({ columns, rows, isLoading, isError, meta, onPageChange, emptyMessage = 'No records found' }) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-900/60">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {isLoading && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center">
                  <Spinner className="mx-auto" />
                </td>
              </tr>
            )}
            {!isLoading && isError && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-red-500">
                  Failed to load data. Please try again.
                </td>
              </tr>
            )}
            {!isLoading && !isError && rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            )}
            {!isLoading &&
              !isError &&
              rows.map((row) => (
                <tr key={row._id || row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  {columns.map((col) => (
                    <td key={col.key} className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {onPageChange && <Pagination meta={meta} onPageChange={onPageChange} />}
    </div>
  );
}
