import { Download, FileText } from 'lucide-react';
import { useListInvoicesQuery, receiptDownloadUrl, invoiceDownloadUrl } from '../../api/feesApi.js';
import { useListPaymentsForInvoiceQuery } from '../../api/feesApi.js';
import Spinner from '../../components/Spinner.jsx';
import downloadAuthenticatedFile from '../../utils/downloadFile.js';
import { INVOICE_STATUS_BADGE } from '../../utils/statusBadges.js';

export default function MyFees() {
  const { data, isLoading } = useListInvoicesQuery({ limit: 50 });
  const invoices = data?.data || [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Fee Status</h1>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner size={28} />
        </div>
      ) : !invoices.length ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No invoices found.</p>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => (
            <InvoiceCard key={inv._id} invoice={inv} />
          ))}
        </div>
      )}
    </div>
  );
}

function InvoiceCard({ invoice }) {
  const { data: paymentsData } = useListPaymentsForInvoiceQuery(invoice._id);

  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">{invoice.invoiceNumber}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Due {new Date(invoice.dueDate).toLocaleDateString()}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className={INVOICE_STATUS_BADGE[invoice.status]}>{invoice.status}</span>
          <button
            className="flex items-center gap-1 text-xs text-primary-600 hover:underline"
            onClick={() => downloadAuthenticatedFile(invoiceDownloadUrl(invoice._id), `${invoice.invoiceNumber}.pdf`)}
          >
            <FileText size={14} /> Invoice
          </button>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-1.5 text-sm sm:grid-cols-3">
        <p>
          <span className="text-gray-500">Total:</span> {invoice.totalAmount.toFixed(2)}
        </p>
        <p>
          <span className="text-gray-500">Paid:</span> {invoice.amountPaid.toFixed(2)}
        </p>
        <p>
          <span className="text-gray-500">Balance:</span> {(invoice.totalAmount - invoice.amountPaid).toFixed(2)}
        </p>
      </div>
      {Boolean(paymentsData?.data?.length) && (
        <ul className="mt-3 divide-y divide-gray-100 border-t border-gray-100 pt-2 dark:divide-gray-800 dark:border-gray-800">
          {paymentsData.data.map((p) => (
            <li key={p._id} className="flex flex-wrap items-center justify-between gap-2 py-1.5 text-sm">
              <span>
                {new Date(p.paidAt).toLocaleDateString()} — {p.amount.toFixed(2)}
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
      )}
    </div>
  );
}
