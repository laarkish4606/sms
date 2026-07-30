import { useState } from 'react';
import { useAppSelector } from '../../app/hooks.js';
import { selectCurrentUser } from '../../features/auth/authSlice.js';
import { useGetMyChildrenQuery, useGetChildAttendanceQuery } from '../../api/parentsApi.js';
import { useListStudentAttendanceQuery } from '../../api/attendanceApi.js';
import Spinner from '../../components/Spinner.jsx';
import { ATTENDANCE_STATUS_BADGE } from '../../utils/statusBadges.js';

export default function MyAttendance() {
  const user = useAppSelector(selectCurrentUser);
  const isParent = user?.role === 'parent';

  const { data: childrenData } = useGetMyChildrenQuery(undefined, { skip: !isParent });
  const [selectedChild, setSelectedChild] = useState('');
  const children = childrenData?.data || [];
  const activeChild = selectedChild || children[0]?._id;

  const { data: ownData, isLoading: loadingOwn } = useListStudentAttendanceQuery({}, { skip: isParent });
  const { data: childData, isLoading: loadingChild } = useGetChildAttendanceQuery(activeChild, { skip: !isParent || !activeChild });

  const records = isParent ? childData?.data : ownData?.data;
  const isLoading = isParent ? loadingChild : loadingOwn;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Attendance</h1>

      {isParent && children.length > 1 && (
        <select className="input max-w-xs" value={activeChild} onChange={(e) => setSelectedChild(e.target.value)}>
          {children.map((c) => (
            <option key={c._id} value={c._id}>
              {c.firstName} {c.lastName}
            </option>
          ))}
        </select>
      )}

      <div className="card p-4">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : !records?.length ? (
          <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">No attendance records yet.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {records.map((r) => (
              <div key={r._id} className="flex items-center justify-between py-2.5">
                <span className="text-sm text-gray-700 dark:text-gray-300">{new Date(r.date).toLocaleDateString()}</span>
                <span className={ATTENDANCE_STATUS_BADGE[r.status]}>{r.status.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
