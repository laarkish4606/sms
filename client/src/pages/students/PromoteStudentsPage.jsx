import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react';
import { useListAcademicYearsQuery } from '../../api/academicApi.js';
import { useGetPromotionPreviewQuery, useCommitPromotionMutation } from '../../api/studentsApi.js';
import Spinner from '../../components/Spinner.jsx';

const ACTIONS = [
  { value: 'promote', label: 'Promote' },
  { value: 'repeat', label: 'Repeat' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'graduate', label: 'Graduate' },
  { value: 'withdraw', label: 'Withdraw / Inactive' },
];

export default function PromoteStudentsPage() {
  const navigate = useNavigate();
  const { data: yearsData } = useListAcademicYearsQuery({ limit: 100 });
  const years = yearsData?.data || [];

  const [fromYear, setFromYear] = useState('');
  const [toYear, setToYear] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [decisions, setDecisions] = useState({}); // studentId -> { action, toClass, toSection }
  const [collapsed, setCollapsed] = useState({});
  const [result, setResult] = useState(null);

  const { data: previewData, isFetching } = useGetPromotionPreviewQuery(
    { fromAcademicYear: fromYear, toAcademicYear: toYear },
    { skip: !loaded || !fromYear || !toYear }
  );
  const [commitPromotion, { isLoading: committing }] = useCommitPromotionMutation();

  const preview = previewData?.data;

  const toClassByOrder = useMemo(() => {
    const map = new Map();
    (preview?.toClasses || []).forEach((c) => map.set(c.numericOrder, c));
    return map;
  }, [preview]);

  const toSectionsByClass = useMemo(() => {
    const map = new Map();
    (preview?.toSections || []).forEach((s) => {
      const key = s.class.toString();
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(s);
    });
    return map;
  }, [preview]);

  // Seed per-student decisions from the backend's suggestions once a preview loads.
  useEffect(() => {
    if (!preview) return;
    const initial = {};
    preview.classes.forEach((group) => {
      group.sections.forEach((section) => {
        section.students.forEach((s) => {
          initial[s._id] = {
            action: s.alreadyProcessed ? 'skip' : s.suggestedAction,
            toClass: s.suggestedNextClassId || '',
            toSection: s.suggestedNextSectionId || '',
          };
        });
      });
    });
    setDecisions(initial);
  }, [preview]);

  const setDecision = (studentId, patch) =>
    setDecisions((d) => ({ ...d, [studentId]: { ...d[studentId], ...patch } }));

  const applyToClass = (group, action) => {
    setDecisions((d) => {
      const next = { ...d };
      group.sections.forEach((section) => {
        section.students.forEach((s) => {
          if (s.alreadyProcessed) return;
          const repeatClass = toClassByOrder.get(s.currentClass.numericOrder);
          const targetClass = action === 'repeat' ? repeatClass : preview.toClasses.find((c) => c._id === s.suggestedNextClassId);
          const sections = toSectionsByClass.get(targetClass?._id?.toString()) || [];
          next[s._id] = {
            action,
            toClass: targetClass?._id || '',
            toSection: sections[0]?._id || '',
          };
        });
      });
      return next;
    });
  };

  const handleSubmit = async () => {
    const decisionList = Object.entries(decisions)
      .filter(([, d]) => d.action !== 'skip')
      .map(([studentId, d]) => ({
        studentId,
        action: d.action,
        ...(d.action === 'promote' || d.action === 'repeat' ? { toClass: d.toClass, toSection: d.toSection } : {}),
      }));
    if (!decisionList.length) {
      toast.error('No students selected for any action');
      return;
    }
    try {
      const res = await commitPromotion({ fromAcademicYear: fromYear, toAcademicYear: toYear, decisions: decisionList }).unwrap();
      setResult(res.data);
      toast.success(res.message);
    } catch (err) {
      toast.error(err?.data?.message || 'Promotion failed');
    }
  };

  const pendingCount = Object.values(decisions).filter((d) => d.action !== 'skip').length;

  return (
    <div className="space-y-4">
      <button
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        onClick={() => navigate('/students')}
      >
        <ArrowLeft size={14} /> Back to Students
      </button>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Promote Students</h1>

      <div className="card flex flex-wrap items-end gap-3 p-5">
        <div>
          <label className="label">From academic year</label>
          <select className="input" value={fromYear} onChange={(e) => { setFromYear(e.target.value); setLoaded(false); setResult(null); }}>
            <option value="">Select...</option>
            {years.map((y) => (
              <option key={y._id} value={y._id}>
                {y.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">To academic year</label>
          <select className="input" value={toYear} onChange={(e) => { setToYear(e.target.value); setLoaded(false); setResult(null); }}>
            <option value="">Select...</option>
            {years.map((y) => (
              <option key={y._id} value={y._id}>
                {y.name}
              </option>
            ))}
          </select>
        </div>
        <button
          className="btn-primary"
          disabled={!fromYear || !toYear || fromYear === toYear}
          onClick={() => setLoaded(true)}
        >
          Load Students
        </button>
        {fromYear && toYear && fromYear === toYear && (
          <p className="text-xs text-danger-600 dark:text-danger-400">From and To years must be different.</p>
        )}
      </div>

      {isFetching && (
        <div className="card flex justify-center p-10">
          <Spinner />
        </div>
      )}

      {preview && !result && (
        <>
          <div className="card flex flex-wrap items-center gap-3 p-4 text-sm">
            <span className="badge-neutral">Total students: {preview.summary.totalStudents}</span>
            {preview.summary.alreadyProcessed > 0 && (
              <span className="badge-warning">Already promoted this run: {preview.summary.alreadyProcessed}</span>
            )}
            <span className="badge-info">Selected for action: {pendingCount}</span>
          </div>

          {preview.classes.map((group) => (
            <div key={group.classId} className="card p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <button
                  className="flex items-center gap-1 font-semibold text-gray-800 dark:text-gray-200"
                  onClick={() => setCollapsed((c) => ({ ...c, [group.classId]: !c[group.classId] }))}
                >
                  {collapsed[group.classId] ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                  {group.className}
                </button>
                <div className="flex gap-2">
                  <button className="btn-secondary px-2 py-1 text-xs" onClick={() => applyToClass(group, 'promote')}>
                    Promote all
                  </button>
                  <button className="btn-secondary px-2 py-1 text-xs" onClick={() => applyToClass(group, 'repeat')}>
                    Repeat all
                  </button>
                </div>
              </div>

              {!collapsed[group.classId] &&
                group.sections.map((section) => (
                  <div key={section.sectionId || 'none'} className="mb-4 last:mb-0">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Section {section.sectionName}
                    </p>
                    <div className="space-y-2">
                      {section.students.map((s) => {
                        const decision = decisions[s._id] || {};
                        const needsTarget = decision.action === 'promote' || decision.action === 'repeat';
                        const targetSections = toSectionsByClass.get(decision.toClass?.toString()) || [];
                        return (
                          <div
                            key={s._id}
                            className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-100 p-2 text-sm dark:border-gray-800"
                          >
                            <span className="w-40 shrink-0 truncate">
                              {s.firstName} {s.lastName}
                            </span>
                            <span className="w-28 shrink-0 text-xs text-gray-400">{s.admissionNumber}</span>
                            {s.alreadyProcessed && <span className="badge-warning">Already processed</span>}
                            <select
                              className="input w-40 py-1"
                              value={decision.action || 'skip'}
                              onChange={(e) => setDecision(s._id, { action: e.target.value })}
                            >
                              <option value="skip">Skip</option>
                              {ACTIONS.map((a) => (
                                <option key={a.value} value={a.value}>
                                  {a.label}
                                </option>
                              ))}
                            </select>
                            {needsTarget && (
                              <>
                                <select
                                  className="input w-40 py-1"
                                  value={decision.toClass || ''}
                                  onChange={(e) => {
                                    const sections = toSectionsByClass.get(e.target.value) || [];
                                    setDecision(s._id, { toClass: e.target.value, toSection: sections[0]?._id || '' });
                                  }}
                                >
                                  <option value="">Target class...</option>
                                  {preview.toClasses.map((c) => (
                                    <option key={c._id} value={c._id}>
                                      {c.name}
                                    </option>
                                  ))}
                                </select>
                                <select
                                  className="input w-32 py-1"
                                  value={decision.toSection || ''}
                                  onChange={(e) => setDecision(s._id, { toSection: e.target.value })}
                                >
                                  <option value="">Section...</option>
                                  {targetSections.map((sec) => (
                                    <option key={sec._id} value={sec._id}>
                                      {sec.name}
                                    </option>
                                  ))}
                                </select>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          ))}

          <div className="flex justify-end">
            <button className="btn-primary" disabled={!pendingCount || committing} onClick={handleSubmit}>
              {committing ? <Spinner size={16} className="text-white" /> : `Confirm & Apply to ${pendingCount} student(s)`}
            </button>
          </div>
        </>
      )}

      {result && (
        <div className="card space-y-2 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Promotion Summary</h2>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="badge-neutral">Total: {result.total}</span>
            <span className="badge-success">Promoted: {result.promoted}</span>
            <span className="badge-info">Repeating: {result.repeating}</span>
            <span className="badge-warning">Transferred: {result.transferred}</span>
            <span className="badge-neutral">Graduated: {result.graduated}</span>
            <span className="badge-danger">Withdrawn: {result.withdrawn}</span>
            {result.skippedDuplicate > 0 && <span className="badge-warning">Already processed: {result.skippedDuplicate}</span>}
            {result.failed > 0 && <span className="badge-danger">Failed: {result.failed}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
