import Spinner from './Spinner.jsx';
import Pagination from './Pagination.jsx';

/**
 * columns: [{ key, header, render?(row) }]
 *
 * Below the `sm` breakpoint, a dense multi-column table is unusable — this
 * renders each row as a stacked label/value card instead, and switches to
 * the classic table from `sm` up. The `actions` column (by convention, the
 * key every page uses for its row buttons) is pulled out of the stacked
 * fields and pinned to the bottom of each card.
 *
 * Row selection is opt-in: pass `selectable` + `selectedIds` (a Set) +
 * `onToggleRow`/`onToggleAll` to get a checkbox column. Omitting them keeps
 * every existing caller's behavior unchanged.
 */
export default function DataTable({
  columns,
  rows,
  isLoading,
  isError,
  meta,
  onPageChange,
  emptyMessage = 'No records found',
  selectable = false,
  selectedIds,
  onToggleRow,
  onToggleAll,
}) {
  if (isLoading) {
    return (
      <div className="card flex justify-center p-10">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return <div className="card p-10 text-center text-sm text-red-500">Failed to load data. Please try again.</div>;
  }

  if (!rows.length) {
    return <div className="card p-10 text-center text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</div>;
  }

  const fieldColumns = columns.filter((col) => col.key !== 'actions');
  const actionsColumn = columns.find((col) => col.key === 'actions');
  const rowId = (row) => row._id || row.id;
  const allSelected = selectable && rows.length > 0 && rows.every((row) => selectedIds?.has(rowId(row)));

  return (
    <div className="card overflow-hidden">
      <div className="divide-y divide-gray-100 dark:divide-gray-800 sm:hidden">
        {rows.map((row) => (
          <div key={rowId(row)} className="p-4">
            <div className="flex items-start gap-3">
              {selectable && (
                <input
                  type="checkbox"
                  className="mt-1 shrink-0"
                  checked={selectedIds?.has(rowId(row)) || false}
                  onChange={() => onToggleRow?.(rowId(row))}
                />
              )}
              <dl className="flex-1 space-y-1.5">
                {fieldColumns.map((col) => (
                  <div key={col.key} className="flex items-start justify-between gap-3">
                    <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                      {col.header}
                    </dt>
                    <dd className="text-right text-sm text-gray-700 dark:text-gray-300">
                      {col.render ? col.render(row) : row[col.key]}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            {actionsColumn && (
              <div className="mt-3 flex justify-end gap-3 border-t border-gray-100 pt-3 dark:border-gray-800">
                {actionsColumn.render(row)}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto sm:block">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-900/60">
            <tr>
              {selectable && (
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" checked={allSelected} onChange={() => onToggleAll?.(rows.map(rowId))} />
                </th>
              )}
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
            {rows.map((row) => (
              <tr key={rowId(row)} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                {selectable && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds?.has(rowId(row)) || false}
                      onChange={() => onToggleRow?.(rowId(row))}
                    />
                  </td>
                )}
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
