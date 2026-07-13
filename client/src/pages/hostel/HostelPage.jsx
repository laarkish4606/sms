import { useState } from 'react';
import clsx from 'clsx';
import SimpleResourceManager from '../../components/SimpleResourceManager.jsx';
import {
  useListHostelsQuery,
  useCreateHostelMutation,
  useUpdateHostelMutation,
  useDeleteHostelMutation,
  useListRoomsQuery,
  useCreateRoomMutation,
  useUpdateRoomMutation,
  useDeleteRoomMutation,
} from '../../api/hostelApi.js';
import RoomAllocation from './RoomAllocation.jsx';

const TABS = ['Hostels', 'Rooms & Allocation'];

export default function HostelPage() {
  const [tab, setTab] = useState(TABS[0]);
  const { data: hostelsData } = useListHostelsQuery({ limit: 100 });
  const hostelOptions = (hostelsData?.data || []).map((h) => ({ value: h._id, label: h.name }));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Hostel</h1>

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

      {tab === 'Hostels' && (
        <SimpleResourceManager
          title="Hostel"
          fields={[
            { name: 'name', label: 'Name', required: true },
            {
              name: 'type',
              label: 'Type',
              type: 'select',
              options: [
                { value: 'boys', label: 'Boys' },
                { value: 'girls', label: 'Girls' },
                { value: 'mixed', label: 'Mixed' },
              ],
            },
            { name: 'address', label: 'Address', type: 'textarea' },
          ]}
          useList={useListHostelsQuery}
          useCreate={useCreateHostelMutation}
          useUpdate={useUpdateHostelMutation}
          useDelete={useDeleteHostelMutation}
        />
      )}

      {tab === 'Rooms & Allocation' && <RoomAllocation hostelOptions={hostelOptions} />}
    </div>
  );
}
