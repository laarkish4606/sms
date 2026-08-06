import { Wallet, AlertTriangle, Users, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useGetAccountantDashboardQuery } from '../../api/dashboardApi.js';
import { useAppSelector } from '../../app/hooks.js';
import { selectCurrentUser } from '../../features/auth/authSlice.js';
import StatCard from '../../components/StatCard.jsx';
import Spinner from '../../components/Spinner.jsx';
import DashboardHeader from '../../components/DashboardHeader.jsx';
import { INVOICE_STATUS_BADGE } from '../../utils/statusBadges.js';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function AccountantDashboard() {
  const user = useAppSelector(selectCurrentUser);
  const { data, isLoading } = useGetAccountantDashboardQuery();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size={28} />
      </div>
    );
  }

  const stats = data?.data;
  const chartData = (stats?.feeCollectionTrend || []).map((m) => ({
    name: MONTH_LABELS[m._id.month - 1],
    total: m.total,
  }));

  return (
    <div className="space-y-6">
      <DashboardHeader greeting={`Hello ${user?.firstName || ''}, here's the financial overview.`} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue This Month" value={(stats?.monthlyRevenue ?? 0).toFixed(2)} icon={Wallet} accent="green" />
        <StatCard label="Outstanding Payments" value={(stats?.outstandingPayments ?? 0).toFixed(2)} icon={AlertTriangle} accent="red" />
        <StatCard label="Students with Unpaid Fees" value={stats?.studentsWithUnpaidFeesCount ?? 0} icon={Users} accent="amber" />
        <StatCard
          label="Invoices Tracked"
          value={(stats?.invoiceSummary || []).reduce((sum, s) => sum + s.count, 0)}
          icon={TrendingUp}
          accent="primary"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Fee Collection Trend (last 6 months)</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="total" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Invoice Status Breakdown</h2>
          <div className="space-y-3">
            {(stats?.invoiceSummary || []).map((s) => (
              <div key={s._id} className="flex items-center justify-between text-sm">
                <span className={INVOICE_STATUS_BADGE[s._id] || 'badge-neutral'}>{s._id}</span>
                <span className="text-gray-600 dark:text-gray-400">
                  {s.count} inv. — {s.paid.toFixed(2)} / {s.total.toFixed(2)}
                </span>
              </div>
            ))}
            {!stats?.invoiceSummary?.length && <p className="text-sm text-gray-500 dark:text-gray-400">No invoices yet.</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Recent Transactions</h2>
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {(stats?.recentTransactions || []).map((p) => (
              <li key={p._id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-gray-800 dark:text-gray-200">
                  {p.student?.firstName} {p.student?.lastName}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {p.amount.toFixed(2)} — {new Date(p.paidAt).toLocaleDateString()}
                </span>
              </li>
            ))}
            {!stats?.recentTransactions?.length && <p className="py-4 text-sm text-gray-500 dark:text-gray-400">No transactions yet.</p>}
          </ul>
        </div>

        <div className="card p-5">
          <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Recent Notices</h2>
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {(stats?.recentNotices || []).map((n) => (
              <li key={n._id} className="py-2.5">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{n.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(n.publishDate).toLocaleDateString()}</p>
              </li>
            ))}
            {!stats?.recentNotices?.length && <p className="py-4 text-sm text-gray-500 dark:text-gray-400">No recent notices.</p>}
          </ul>
        </div>
      </div>
    </div>
  );
}
