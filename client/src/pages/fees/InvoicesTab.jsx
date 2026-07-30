import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Wallet, Download, FileText } from 'lucide-react';
import DataTable from '../../components/DataTable.jsx';
import Modal from '../../components/Modal.jsx';
import Spinner from '../../components/Spinner.jsx';
import {
  useListInvoicesQuery,
  useGenerateInvoicesMutation,
  useRecordPaymentMutation,
  useListPaymentsForInvoiceQuery,
  receiptDownloadUrl,
  invoiceDownloadUrl,
} from '../../api/feesApi.js';
import { useListAcademicYearsQuery, useListClassesQuery } from '../../api/academicApi.js';
import { useAppSelector } from '../../app/hooks.js';
import { selectCurrentUser } from '../../features/auth/authSlice.js';
import downloadAuthenticatedFile from '../../utils/downloadFile.js';
import { INVOICE_STATUS_BADGE } from '../../utils/statusBadges.js';

export default function InvoicesTab() {
  const user = useAppSelector(selectCurrentUser);
  const canManage = user?.role === 'school_admin' || user?.role === 'accountant';

  const [page, setPage] = useState(1);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [payingInvoiceId, setPayingInvoiceId] = useState(null);
  const [classFilter, setClassFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');

  const { data, isLoading, isError } = useListInvoicesQuery({
    page,
    limit: 10,
    class: classFilter || undefined,
    academicYear: yearFilter || undefined,
  });
  const payingInvoice = payingInvoiceId ? (data?.data || []).find((inv) => inv._id === payingInvoiceId) : null;
  const { data: yearsData } = useListAcademicYearsQuery({ limit: 100 });
  const { data: classesData } = useListClassesQuery({ limit: 100 });
  const [generateInvoices, { isLoading: generating }] = useGenerateInvoicesMutation();

  const [genValues, setGenValues] = useState({ class: '', academicYear: '', dueDate: '' });

  const columns = [
    { key: 'invoiceNumber', header: 'Invoice No' },
    { key: 'student', header: 'Student', render: (r) => `${r.student?.firstName} ${r.student?.lastName}` },
    { key: 'totalAmount', header: 'Total', render: (r) => r.totalAmount.toFixed(2) },
    { key: 'amountPaid', header: 'Paid', render: (r) => r.amountPaid.toFixed(2) },
    { key: 'dueDate', header: 'Due', render: (r) => new Date(r.dueDate).toLocaleDateString() },
    { key: 'status', header: 'Status', render: (r) => <span className={INVOICE_STATUS_BADGE[r.status]}>{r.status}</span> },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="flex items-center gap-3">
          <button
            className="text-gray-400 hover:text-primary-600"
            title="Download invoice"
            onClick={() => downloadAuthenticatedFile(invoiceDownloadUrl(r._id), `${r.invoiceNumber}.pdf`)}
          >
            <FileText size={16} />
          </button>
          {canManage && r.status !== 'paid' && r.status !== 'cancelled' && (
            <button className="text-gray-400 hover:text-primary-600" title="Record payment" onClick={() => setPayingInvoiceId(r._id)}>
              <Wallet size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-2">
          <select className="input sm:w-44" value={yearFilter} onChange={(e) => { setYearFilter(e.target.value); setPage(1); }}>
            <option value="">All years</option>
            {(yearsData?.data || []).map((y) => (
              <option key={y._id} value={y._id}>
                {y.name}
              </option>
            ))}
          </select>
          <select className="input sm:w-44" value={classFilter} onChange={(e) => { setClassFilter(e.target.value); setPage(1); }}>
            <option value="">All classes</option>
            {(classesData?.data || []).map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
          {(classFilter || yearFilter) && (
            <button className="btn-secondary" onClick={() => { setClassFilter(''); setYearFilter(''); setPage(1); }}>
              Clear filter
            </button>
          )}
        </div>
        {canManage && (
          <button className="btn-primary" onClick={() => setGenerateOpen(true)}>
            <Plus size={16} /> Generate Invoices
          </button>
        )}
      </div>

      <DataTable columns={columns} rows={data?.data || []} isLoading={isLoading} isError={isError} meta={data?.meta} onPageChange={setPage} />

      <Modal open={generateOpen} onClose={() => setGenerateOpen(false)} title="Generate Invoices for Class">
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const res = await generateInvoices(genValues).unwrap();
              toast.success(res.message);
              setGenerateOpen(false);
              // Narrow the list to exactly this batch — replaces whatever
              // class/year filter (or lack of one) was showing before.
              setClassFilter(genValues.class);
              setYearFilter(genValues.academicYear);
              setPage(1);
            } catch (err) {
              toast.error(err?.data?.message || 'Failed to generate invoices');
            }
          }}
        >
          <div>
            <label className="label">Class</label>
            <select className="input" required value={genValues.class} onChange={(e) => setGenValues((v) => ({ ...v, class: e.target.value }))}>
              <option value="">Select...</option>
              {(classesData?.data || []).map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Academic Year</label>
            <select
              className="input"
              required
              value={genValues.academicYear}
              onChange={(e) => setGenValues((v) => ({ ...v, academicYear: e.target.value }))}
            >
              <option value="">Select...</option>
              {(yearsData?.data || []).map((y) => (
                <option key={y._id} value={y._id}>
                  {y.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Due date</label>
            <input
              type="date"
              className="input"
              required
              value={genValues.dueDate}
              onChange={(e) => setGenValues((v) => ({ ...v, dueDate: e.target.value }))}
            />
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" className="btn-primary" disabled={generating}>
              {generating ? <Spinner size={16} className="text-white" /> : 'Generate'}
            </button>
          </div>
        </form>
      </Modal>

      <PaymentModal invoice={payingInvoice} onClose={() => setPayingInvoiceId(null)} />
    </div>
  );
}

function PaymentModal({ invoice, onClose }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [transactionRef, setTransactionRef] = useState('');
  const [recordPayment, { isLoading: saving }] = useRecordPaymentMutation();
  const { data: paymentsData } = useListPaymentsForInvoiceQuery(invoice?._id, { skip: !invoice });

  if (!invoice) return null;
  const balance = invoice.totalAmount - invoice.amountPaid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await recordPayment({ invoiceId: invoice._id, amount: Number(amount), method, transactionRef }).unwrap();
      toast.success('Payment recorded');
      setAmount('');
      setTransactionRef('');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to record payment');
    }
  };

  return (
    <Modal open={Boolean(invoice)} onClose={onClose} title={`Record Payment — ${invoice.invoiceNumber}`}>
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">Outstanding balance: {balance.toFixed(2)}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Amount</label>
            <input type="number" min="0.01" step="0.01" max={balance} className="input" required value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <label className="label">Method</label>
            <select className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="online">Online</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">Transaction reference (optional)</label>
          <input className="input" value={transactionRef} onChange={(e) => setTransactionRef(e.target.value)} />
        </div>
        <div className="flex justify-end pt-2">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? <Spinner size={16} className="text-white" /> : 'Record payment'}
          </button>
        </div>
      </form>

      {Boolean(paymentsData?.data?.length) && (
        <div className="mt-6 border-t border-gray-200 pt-4 dark:border-gray-800">
          <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Payment History</h3>
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {paymentsData.data.map((p) => (
              <li key={p._id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span>
                  {new Date(p.paidAt).toLocaleDateString()} — {p.amount.toFixed(2)} ({p.method})
                </span>
                <button
                  className="flex shrink-0 items-center gap-1 text-primary-600 hover:underline"
                  onClick={() => downloadAuthenticatedFile(receiptDownloadUrl(p._id), `${p.receiptNumber}.pdf`)}
                >
                  <Download size={14} /> Receipt
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  );
}
