import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Users, CheckCheck } from 'lucide-react';
import clsx from 'clsx';
import { useListClassesQuery, useListSectionsQuery } from '../../api/academicApi.js';
import { useListStudentsQuery } from '../../api/studentsApi.js';
import { useListStudentAttendanceQuery, useMarkStudentAttendanceMutation } from '../../api/attendanceApi.js';
import Spinner from '../../components/Spinner.jsx';

// Excused/half-day still exist in the data model for edge cases, but the
// four buttons below are what a teacher taps on a phone for the common case
// — a full status dropdown per row is too slow for one-hand daily use.
const STATUS_OPTIONS = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'late', label: 'Late' },
  { value: 'excused', label: 'Excused' },
];

const STATUS_COLORS = {
  present: 'bg-success-100 text-success-700 dark:bg-success-500/10 dark:text-success-400',
  absent: 'bg-danger-100 text-danger-700 dark:bg-danger-500/10 dark:text-danger-400',
  late: 'bg-warning-100 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400',
  half_day: 'bg-info-100 text-info-700 dark:bg-info-500/10 dark:text-info-400',
  excused: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const STATUS_ACTIVE_CLASSES = {
  present: 'bg-success-600 text-white',
  absent: 'bg-danger-600 text-white',
  late: 'bg-warning-600 text-white',
  excused: 'bg-gray-600 text-white',
};

export default function MarkAttendance() {
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loaded, setLoaded] = useState(false);
  const [statuses, setStatuses] = useState({});

  const { data: classesData } = useListClassesQuery({ limit: 100 });
  const { data: sectionsData } = useListSectionsQuery({ class: classId, limit: 100 }, { skip: !classId });

  // The roster and existing attendance are only fetched once the teacher
  // explicitly clicks "Load Students" — changing any filter beforehand
  // just adjusts the selection without firing a request.
  const canLoad = Boolean(classId && sectionId && date);
  const { data: studentsData, isFetching: loadingStudents } = useListStudentsQuery(
    { section: sectionId, limit: 100 },
    { skip: !loaded }
  );
  const { data: existingData, isFetching: loadingExisting } = useListStudentAttendanceQuery(
    { section: sectionId, date, limit: 100 },
    { skip: !loaded }
  );
  const [markAttendance, { isLoading: saving }] = useMarkStudentAttendanceMutation();

  const students = studentsData?.data || [];
  const isLoading = loadingStudents || loadingExisting;

  // Re-derive on-screen statuses from what's actually saved for this
  // section+date so switching dates can't leak one day's picks into
  // another and always reflects the saved truth.
  useEffect(() => {
    const existing = existingData?.data || [];
    const map = {};
    existing.forEach((record) => {
      const studentId = record.student?._id || record.student;
      map[studentId] = record.status;
    });
    setStatuses(map);
  }, [existingData]);

  const resetLoad = () => {
    setLoaded(false);
    setStatuses({});
  };

  const stats = useMemo(() => {
    const counts = { present: 0, absent: 0, late: 0, excused: 0, half_day: 0 };
    students.forEach((s) => {
      const status = statuses[s._id] || 'present';
      counts[status] = (counts[status] || 0) + 1;
    });
    const total = students.length;
    const percentage = total ? Math.round(((counts.present + counts.late + counts.half_day) / total) * 100) : 0;
    return { total, ...counts, percentage };
  }, [students, statuses]);

  const setStatus = (studentId, status) => setStatuses((s) => ({ ...s, [studentId]: status }));
  const markAllPresent = () => {
    const all = {};
    students.forEach((s) => { all[s._id] = 'present'; });
    setStatuses(all);
  };

  const handleSubmit = async () => {
    // One bulk request for the whole roster — not one call per student.
    const records = students.map((s) => ({ student: s._id, status: statuses[s._id] || 'present' }));
    try {
      await markAttendance({ class: classId, section: sectionId, date, records }).unwrap();
      toast.success('Attendance saved successfully');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to record attendance');
    }
  };

  return (
    <div className="space-y-4 pb-20">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mark Attendance</h1>

      <div className="card grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4">
        <div>
          <label className="label">Class</label>
          <select
            className="input"
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              setSectionId('');
              resetLoad();
            }}
          >
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
          <select
            className="input"
            value={sectionId}
            onChange={(e) => {
              setSectionId(e.target.value);
              resetLoad();
            }}
            disabled={!classId}
          >
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
          <input
            type="date"
            className="input"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              resetLoad();
            }}
          />
        </div>
        <div className="col-span-2 flex items-end sm:col-span-3 lg:col-span-1">
          <button className="btn-primary w-full" disabled={!canLoad} onClick={() => setLoaded(true)}>
            <Users size={16} /> Load Students
          </button>
        </div>
      </div>

      {!loaded && (
        <div className="card p-8 text-center text-sm text-gray-500 dark:text-gray-400">
          Select a class, section, and date, then click <strong>Load Students</strong> to mark or review attendance.
        </div>
      )}

      {loaded && (
        <div className="card p-4">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : students.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">No students in this section.</p>
          ) : (
            <>
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <StatTile label="Total" value={stats.total} />
                <StatTile label="Present" value={stats.present} className={STATUS_COLORS.present} />
                <StatTile label="Absent" value={stats.absent} className={STATUS_COLORS.absent} />
                <StatTile label="Late" value={stats.late} className={STATUS_COLORS.late} />
                <StatTile label="Excused" value={stats.excused} className={STATUS_COLORS.excused} />
                <StatTile label="Attendance %" value={`${stats.percentage}%`} />
              </div>

              {Boolean(existingData?.data?.length) && (
                <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                  Attendance was already recorded for this date — showing saved values. Adjust and save to update.
                </p>
              )}

              <button
                className="btn-secondary mb-3 w-full sm:w-auto"
                onClick={markAllPresent}
              >
                <CheckCheck size={16} /> Mark All Present
              </button>

              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {students.map((s) => {
                  const current = statuses[s._id] || 'present';
                  return (
                    <div key={s._id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-sm text-gray-800 dark:text-gray-200">
                        {s.firstName} {s.lastName} <span className="text-gray-400">({s.admissionNumber})</span>
                      </span>
                      <div className="grid grid-cols-4 gap-1.5 sm:flex sm:gap-2">
                        {STATUS_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setStatus(s._id, opt.value)}
                            className={clsx(
                              'rounded-lg px-2 py-2.5 text-xs font-medium transition-colors sm:px-3',
                              current === opt.value
                                ? STATUS_ACTIVE_CLASSES[opt.value]
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Sticky so the save action stays within thumb reach while
                  scrolling a long roster on a phone. */}
              <div className="sticky bottom-0 -mx-4 -mb-4 mt-4 border-t border-gray-200 bg-white/95 p-4 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
                <button className="btn-primary w-full sm:w-auto sm:float-right" onClick={handleSubmit} disabled={saving}>
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

function StatTile({ label, value, className }) {
  return (
    <div className="rounded-lg border border-gray-100 p-3 text-center dark:border-gray-800">
      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{value}</p>
      <p className={`mt-0.5 inline-block rounded px-1.5 text-[11px] font-medium ${className || 'text-gray-500 dark:text-gray-400'}`}>
        {label}
      </p>
    </div>
  );
}
