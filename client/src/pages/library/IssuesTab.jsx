import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Undo2 } from 'lucide-react';
import DataTable from '../../components/DataTable.jsx';
import Modal from '../../components/Modal.jsx';
import Spinner from '../../components/Spinner.jsx';
import { useListIssuesQuery, useIssueBookMutation, useReturnBookMutation, useListBooksQuery } from '../../api/libraryApi.js';
import { useListStudentsQuery } from '../../api/studentsApi.js';
import { useListTeachersQuery } from '../../api/teachersApi.js';

export default function IssuesTab() {
  const [formOpen, setFormOpen] = useState(false);
  const [values, setValues] = useState({ bookId: '', borrowerType: 'Student', borrowerId: '' });

  const { data, isLoading, isError } = useListIssuesQuery({ limit: 50 });
  const { data: booksData } = useListBooksQuery({ limit: 100 });
  const { data: studentsData } = useListStudentsQuery({ limit: 100 }, { skip: values.borrowerType !== 'Student' });
  const { data: teachersData } = useListTeachersQuery({ limit: 100 }, { skip: values.borrowerType !== 'Teacher' });
  const [issueBook, { isLoading: issuing }] = useIssueBookMutation();
  const [returnBook] = useReturnBookMutation();

  const borrowers = values.borrowerType === 'Student' ? studentsData?.data : teachersData?.data;

  const columns = [
    { key: 'book', header: 'Book', render: (r) => r.book?.title },
    { key: 'borrower', header: 'Borrower', render: (r) => `${r.borrower?.firstName} ${r.borrower?.lastName}` },
    { key: 'issueDate', header: 'Issued', render: (r) => new Date(r.issueDate).toLocaleDateString() },
    { key: 'dueDate', header: 'Due', render: (r) => new Date(r.dueDate).toLocaleDateString() },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <span className={r.status === 'returned' ? 'badge-success' : 'badge-warning'}>
          {r.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (r) =>
        r.status !== 'returned' && (
          <button
            className="flex items-center gap-1 text-gray-400 hover:text-primary-600"
            onClick={async () => {
              await returnBook(r._id).unwrap();
              toast.success('Book returned');
            }}
          >
            <Undo2 size={16} />
          </button>
        ),
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await issueBook(values).unwrap();
      toast.success('Book issued');
      setFormOpen(false);
      setValues({ bookId: '', borrowerType: 'Student', borrowerId: '' });
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to issue book');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => setFormOpen(true)}>
          <Plus size={16} /> Issue Book
        </button>
      </div>

      <DataTable columns={columns} rows={data?.data || []} isLoading={isLoading} isError={isError} />

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Issue Book">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Book</label>
            <select className="input" required value={values.bookId} onChange={(e) => setValues((v) => ({ ...v, bookId: e.target.value }))}>
              <option value="">Select book...</option>
              {(booksData?.data || [])
                .filter((b) => b.availableCopies > 0)
                .map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.title} ({b.availableCopies} available)
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="label">Borrower type</label>
            <select
              className="input"
              value={values.borrowerType}
              onChange={(e) => setValues((v) => ({ ...v, borrowerType: e.target.value, borrowerId: '' }))}
            >
              <option value="Student">Student</option>
              <option value="Teacher">Teacher</option>
            </select>
          </div>
          <div>
            <label className="label">Borrower</label>
            <select className="input" required value={values.borrowerId} onChange={(e) => setValues((v) => ({ ...v, borrowerId: e.target.value }))}>
              <option value="">Select...</option>
              {(borrowers || []).map((b) => (
                <option key={b._id} value={b._id}>
                  {b.firstName} {b.lastName}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" className="btn-primary" disabled={issuing}>
              {issuing ? <Spinner size={16} className="text-white" /> : 'Issue'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
