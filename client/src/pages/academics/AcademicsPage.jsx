import { useMemo, useState } from 'react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import SimpleResourceManager from '../../components/SimpleResourceManager.jsx';
import {
  useListAcademicYearsQuery,
  useCreateAcademicYearMutation,
  useUpdateAcademicYearMutation,
  useDeleteAcademicYearMutation,
  useSetCurrentAcademicYearMutation,
  useListClassesQuery,
  useCreateClassMutation,
  useUpdateClassMutation,
  useDeleteClassMutation,
  useListSectionsQuery,
  useCreateSectionMutation,
  useUpdateSectionMutation,
  useDeleteSectionMutation,
  useListSubjectsQuery,
  useCreateSubjectMutation,
  useUpdateSubjectMutation,
  useDeleteSubjectMutation,
} from '../../api/academicApi.js';
import { Star } from 'lucide-react';

const TABS = ['Academic Years', 'Classes', 'Sections', 'Subjects'];

export default function AcademicsPage() {
  const [tab, setTab] = useState(TABS[0]);
  const { data: yearsData } = useListAcademicYearsQuery({ limit: 100 });
  const { data: classesData } = useListClassesQuery({ limit: 100 });
  const [setCurrentYear] = useSetCurrentAcademicYearMutation();

  const yearOptions = useMemo(
    () => (yearsData?.data || []).map((y) => ({ value: y._id, label: y.name })),
    [yearsData]
  );
  const classOptions = useMemo(
    () => (classesData?.data || []).map((c) => ({ value: c._id, label: c.name })),
    [classesData]
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Academics</h1>

      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              'border-b-2 px-4 py-2 text-sm font-medium',
              tab === t
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Academic Years' && (
        <SimpleResourceManager
          title="Academic Year"
          fields={[
            { name: 'name', label: 'Name (e.g. 2025-2026)', required: true },
            { name: 'startDate', label: 'Start Date', type: 'date', required: true },
            { name: 'endDate', label: 'End Date', type: 'date', required: true },
          ]}
          columns={[
            { key: 'name', header: 'Name' },
            { key: 'startDate', header: 'Start', render: (r) => new Date(r.startDate).toLocaleDateString() },
            { key: 'endDate', header: 'End', render: (r) => new Date(r.endDate).toLocaleDateString() },
            {
              key: 'isCurrent',
              header: 'Current',
              render: (r) => (r.isCurrent ? <span className="badge bg-primary-100 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400">Current</span> : '-'),
            },
          ]}
          extraActions={(row) =>
            !row.isCurrent && (
              <button
                className="text-gray-400 hover:text-amber-500"
                title="Set as current"
                onClick={async () => {
                  await setCurrentYear(row._id).unwrap();
                  toast.success('Current academic year updated');
                }}
              >
                <Star size={16} />
              </button>
            )
          }
          useList={useListAcademicYearsQuery}
          useCreate={useCreateAcademicYearMutation}
          useUpdate={useUpdateAcademicYearMutation}
          useDelete={useDeleteAcademicYearMutation}
        />
      )}

      {tab === 'Classes' && (
        <SimpleResourceManager
          title="Class"
          fields={[
            { name: 'name', label: 'Name (e.g. Grade 10)', required: true },
            { name: 'academicYear', label: 'Academic Year', type: 'select', required: true, options: yearOptions },
            { name: 'numericOrder', label: 'Order (for sorting/promotion)', type: 'number', required: true },
          ]}
          columns={[
            { key: 'name', header: 'Name' },
            { key: 'academicYear', header: 'Academic Year', render: (r) => r.academicYear?.name },
            { key: 'numericOrder', header: 'Order' },
          ]}
          useList={useListClassesQuery}
          useCreate={useCreateClassMutation}
          useUpdate={useUpdateClassMutation}
          useDelete={useDeleteClassMutation}
        />
      )}

      {tab === 'Sections' && (
        <SimpleResourceManager
          title="Section"
          fields={[
            { name: 'name', label: 'Name (e.g. A)', required: true },
            { name: 'class', label: 'Class', type: 'select', required: true, options: classOptions },
            { name: 'room', label: 'Room' },
            { name: 'capacity', label: 'Capacity', type: 'number' },
          ]}
          columns={[
            { key: 'name', header: 'Name' },
            { key: 'class', header: 'Class', render: (r) => r.class?.name },
            { key: 'room', header: 'Room', render: (r) => r.room || '-' },
            { key: 'capacity', header: 'Capacity' },
          ]}
          useList={useListSectionsQuery}
          useCreate={useCreateSectionMutation}
          useUpdate={useUpdateSectionMutation}
          useDelete={useDeleteSectionMutation}
        />
      )}

      {tab === 'Subjects' && (
        <SimpleResourceManager
          title="Subject"
          fields={[
            { name: 'name', label: 'Name', required: true },
            { name: 'code', label: 'Code', required: true },
            {
              name: 'type',
              label: 'Type',
              type: 'select',
              options: [
                { value: 'theory', label: 'Theory' },
                { value: 'practical', label: 'Practical' },
                { value: 'both', label: 'Both' },
              ],
            },
          ]}
          useList={useListSubjectsQuery}
          useCreate={useCreateSubjectMutation}
          useUpdate={useUpdateSubjectMutation}
          useDelete={useDeleteSubjectMutation}
        />
      )}
    </div>
  );
}
