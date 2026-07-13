import { useState } from 'react';
import clsx from 'clsx';
import { useAppSelector } from '../../app/hooks.js';
import { selectCurrentUser } from '../../features/auth/authSlice.js';
import FeeStructuresTab from './FeeStructuresTab.jsx';
import InvoicesTab from './InvoicesTab.jsx';
import MyFees from './MyFees.jsx';

export default function FeesPage() {
  const user = useAppSelector(selectCurrentUser);
  const [tab, setTab] = useState('Invoices');

  if (user?.role === 'student' || user?.role === 'parent') {
    return <MyFees />;
  }

  const tabs = user?.role === 'accountant' ? ['Invoices', 'Fee Structures'] : ['Invoices', 'Fee Structures'];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Fee Management</h1>

      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              'border-b-2 px-4 py-2 text-sm font-medium',
              tab === t ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Invoices' && <InvoicesTab />}
      {tab === 'Fee Structures' && <FeeStructuresTab />}
    </div>
  );
}
