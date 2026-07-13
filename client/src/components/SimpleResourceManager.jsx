import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import DataTable from './DataTable.jsx';
import Modal from './Modal.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';
import Spinner from './Spinner.jsx';

/**
 * Generic list+modal-form+delete manager for simple, flat CRUD resources
 * (AcademicYear, Subject, Vehicle, Hostel, ...). Mirrors the backend's
 * crudFactory so these small resources don't need a bespoke page each.
 *
 * fields: [{ name, label, type = 'text', required, options?: [{value,label}] }]
 * columns: DataTable columns (defaults to one column per field)
 */
export default function SimpleResourceManager({
  title,
  fields,
  columns,
  useList,
  useCreate,
  useUpdate,
  useDelete,
  listParams,
  extraActions,
  canManage = true,
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [values, setValues] = useState({});

  const { data, isLoading, isError } = useList(listParams);
  const [create, { isLoading: creating }] = useCreate();
  const [update, { isLoading: updating }] = useUpdate();
  const [remove] = useDelete();

  useEffect(() => {
    if (editing) {
      setValues(Object.fromEntries(fields.map((f) => [f.name, editing[f.name] ?? ''])));
    } else {
      setValues(Object.fromEntries(fields.map((f) => [f.name, f.default ?? ''])));
    }
  }, [editing, fields, formOpen]);

  const resolvedColumns = columns || [
    ...fields.map((f) => ({ key: f.name, header: f.label, render: (row) => row[f.name] })),
  ];

  const finalColumns = canManage
    ? [
        ...resolvedColumns,
        {
          key: 'actions',
          header: '',
          render: (row) => (
            <div className="flex items-center gap-2">
              {extraActions?.(row)}
              <button
                className="text-gray-400 hover:text-primary-600"
                onClick={() => {
                  setEditing(row);
                  setFormOpen(true);
                }}
              >
                <Pencil size={16} />
              </button>
              <button className="text-gray-400 hover:text-red-600" onClick={() => setDeleting(row)}>
                <Trash2 size={16} />
              </button>
            </div>
          ),
        },
      ]
    : resolvedColumns;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await update({ id: editing._id, ...values }).unwrap();
        toast.success(`${title} updated`);
      } else {
        await create(values).unwrap();
        toast.success(`${title} created`);
      }
      setFormOpen(false);
      setEditing(null);
    } catch (err) {
      toast.error(err?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <button
            className="btn-primary"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus size={16} /> Add {title}
          </button>
        </div>
      )}

      <DataTable columns={finalColumns} rows={data?.data || []} isLoading={isLoading} isError={isError} />

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? `Edit ${title}` : `Add ${title}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((f) => (
            <div key={f.name}>
              <label className="label">{f.label}</label>
              {f.type === 'select' ? (
                <select
                  className="input"
                  required={f.required}
                  value={values[f.name] ?? ''}
                  onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                >
                  <option value="">Select...</option>
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : f.type === 'textarea' ? (
                <textarea
                  className="input"
                  rows={2}
                  required={f.required}
                  value={values[f.name] ?? ''}
                  onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                />
              ) : (
                <input
                  type={f.type || 'text'}
                  className="input"
                  required={f.required}
                  value={values[f.name] ?? ''}
                  onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                />
              )}
            </div>
          ))}
          <div className="flex justify-end pt-2">
            <button type="submit" className="btn-primary" disabled={creating || updating}>
              {creating || updating ? <Spinner size={16} className="text-white" /> : 'Save'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title={`Delete ${title}`}
        description="This action cannot be undone."
        onConfirm={async () => {
          try {
            await remove(deleting._id).unwrap();
            toast.success(`${title} deleted`);
          } catch (err) {
            toast.error(err?.data?.message || 'Failed to delete');
          }
        }}
      />
    </div>
  );
}
