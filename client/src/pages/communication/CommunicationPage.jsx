import { useState } from 'react';
import clsx from 'clsx';
import NoticesTab from './NoticesTab.jsx';
import MessagesTab from './MessagesTab.jsx';

const TABS = ['Notices', 'Messages'];

export default function CommunicationPage() {
  const [tab, setTab] = useState(TABS[0]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Communication</h1>

      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800">
        {TABS.map((t) => (
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

      {tab === 'Notices' && <NoticesTab />}
      {tab === 'Messages' && <MessagesTab />}
    </div>
  );
}
