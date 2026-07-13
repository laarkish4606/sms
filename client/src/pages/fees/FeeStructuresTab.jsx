import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import DataTable from '../../components/DataTable.jsx';
import Modal from '../../components/Modal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import { useListFeeStructuresQuery, useCreateFeeStructureMutation, useDeleteFeeStructureMutation } from '../../api/feesApi.js';
import { useListAcademicYearsQuery, useListClassesQuery } from '../../api/academicApi.js';
import FeeStructureForm from './FeeStructureForm.jsx';

export default function FeeStructuresTab() {
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const { data, isLoading, isError } = useListFeeStructuresQuery({ limit: 50 });
  const { data: yearsData } = useListAcademicYearsQuery({ limit: 100 });
  const { data: classesData } = useListClassesQuery({ limit: 100 });
  const [createStructure, { isLoading: creating }] = useCreateFeeStructureMutation();
  const [deleteStructure] = useDeleteFeeStructureMutation();

  const columns = [
    { key: 'class', header: 'Class', render: (r) => r.class?.name },
    { key: 'academicYear', header: 'Academic Year', render: (r) => r.academicYear?.name },
    { key: 'items', header: 'Items', render: (r) => r.items.map((i) => i.name).join(', ') },
    { key: 'totalAmount', header: 'Total', render: (r) => r.totalAmount.toFixed(2) },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <button className="text-gray-400 hover:text-red-600" onClick={() => setDeleting(r)}>
          <Trash2 size={16} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => setFormOpen(true)}>
          <Plus size={16} /> Add Fee Structure
        </button>
      </div>

      <DataTable columns={columns} rows={data?.data || []} isLoading={isLoading} isError={isError} />

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Add Fee Structure" size="lg">
        <FeeStructureForm
          isSubmitting={creating}
          academicYears={yearsData?.data || []}
          classes={classesData?.data || []}
          onSubmit={async (values) => {
            try {
              await createStructure(values).unwrap();
              toast.success('Fee structure created');
              setFormOpen(false);
            } catch (err) {
              toast.error(err?.data?.message || 'Failed to create fee structure');
            }
          }}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete fee structure"
        description="This action cannot be undone."
        onConfirm={async () => {
          try {
            await deleteStructure(deleting._id).unwrap();
            toast.success('Fee structure deleted');
          } catch (err) {
            toast.error(err?.data?.message || 'Failed to delete');
          }
        }}
      />
    </div>
  );
}
