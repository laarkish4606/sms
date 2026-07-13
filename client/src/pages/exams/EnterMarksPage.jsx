import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { useGetExamQuery, useEnterMarksMutation } from '../../api/examsApi.js';
import { useListStudentsQuery } from '../../api/studentsApi.js';
import Spinner from '../../components/Spinner.jsx';

export default function EnterMarksPage() {
  const { examId } = useParams();
  const { data: examData, isLoading: loadingExam } = useGetExamQuery(examId);
  const exam = examData?.data;

  const [subjectId, setSubjectId] = useState('');
  const [marks, setMarks] = useState({});

  const { data: studentsData, isLoading: loadingStudents } = useListStudentsQuery(
    { class: exam?.class?._id, limit: 200 },
    { skip: !exam }
  );
  const [enterMarks, { isLoading: saving }] = useEnterMarksMutation();

  if (loadingExam) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size={28} />
      </div>
    );
  }
  if (!exam) return <p className="text-sm text-gray-500">Exam not found.</p>;

  const students = studentsData?.data || [];
  const activeSubject = subjectId || exam.subjects[0]?.subject._id;
  const subjectDef = exam.subjects.find((s) => s.subject._id === activeSubject);

  const handleSubmit = async () => {
    const records = students.map((s) => ({
      student: s._id,
      subject: activeSubject,
      obtainedMarks: Number(marks[s._id]) || 0,
    }));
    try {
      await enterMarks({ examId, records }).unwrap();
      toast.success('Marks saved');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to save marks');
    }
  };

  return (
    <div className="space-y-4">
      <Link to="/exams" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600">
        <ArrowLeft size={16} /> Back to exams
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{exam.name} — Enter Marks</h1>

      <div className="card p-4">
        <label className="label">Subject</label>
        <select className="input max-w-xs" value={activeSubject} onChange={(e) => setSubjectId(e.target.value)}>
          {exam.subjects.map((s) => (
            <option key={s.subject._id} value={s.subject._id}>
              {s.subject.name} (max {s.maxMarks})
            </option>
          ))}
        </select>
      </div>

      <div className="card p-4">
        {loadingStudents ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {students.map((s) => (
                <div key={s._id} className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-gray-800 dark:text-gray-200">
                    {s.firstName} {s.lastName} <span className="text-gray-400">({s.admissionNumber})</span>
                  </span>
                  <input
                    type="number"
                    min="0"
                    max={subjectDef?.maxMarks}
                    className="input w-28"
                    value={marks[s._id] ?? ''}
                    onChange={(e) => setMarks((m) => ({ ...m, [s._id]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
                {saving ? <Spinner size={16} className="text-white" /> : 'Save marks'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
