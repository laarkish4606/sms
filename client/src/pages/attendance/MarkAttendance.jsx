import { useState } from 'react';
import toast from 'react-hot-toast';
import { useListClassesQuery, useListSectionsQuery } from '../../api/academicApi.js';
import { useListStudentsQuery } from '../../api/studentsApi.js';
import { useMarkStudentAttendanceMutation } from '../../api/attendanceApi.js';
import Spinner from '../../components/Spinner.jsx';

const STATUS_OPTIONS = ['present', 'absent', 'late', 'half_day', 'excused'];

export default function MarkAttendance() {
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [statuses, setStatuses] = useState({});

  const { data: classesData } = useListClassesQuery({ limit: 100 });
  const { data: sectionsData } = useListSectionsQuery({ class: classId, limit: 100 }, { skip: !classId });
  const { data: studentsData, isLoading: loadingStudents } = useListStudentsQuery(
    { section: sectionId, limit: 100 },
    { skip: !sectionId }
  );
  const [markAttendance, { isLoading: saving }] = useMarkStudentAttendanceMutation();

  const students = studentsData?.data || [];

  const setStatus = (studentId, status) => setStatuses((s) => ({ ...s, [studentId]: status }));

  const handleSubmit = async () => {
    const records = students.map((s) => ({ student: s._id, status: statuses[s._id] || 'present' }));
    try {
      await markAttendance({ class: classId, section: sectionId, date, records }).unwrap();
      toast.success('Attendance recorded');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to record attendance');
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mark Attendance</h1>

      <div className="card grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
        <div>
          <label className="label">Class</label>
          <select className="input" value={classId} onChange={(e) => { setClassId(e.target.value); setSectionId(''); }}>
            <option value="">Select class</option>
            {(classesData?.data || []).map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Section</label>
          <select className="input" value={sectionId} onChange={(e) => setSectionId(e.target.value)} disabled={!classId}>
            <option value="">Select section</option>
            {(sectionsData?.data || []).map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Date</label>
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      {sectionId && (
        <div className="card p-4">
          {loadingStudents ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : students.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">No students in this section.</p>
          ) : (
            <>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {students.map((s) => (
                  <div key={s._id} className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-gray-800 dark:text-gray-200">
                      {s.firstName} {s.lastName} <span className="text-gray-400">({s.admissionNumber})</span>
                    </span>
                    <select
                      className="input w-40"
                      value={statuses[s._id] || 'present'}
                      onChange={(e) => setStatus(s._id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
                  {saving ? <Spinner size={16} className="text-white" /> : 'Save attendance'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
