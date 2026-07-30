import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Download, Upload } from 'lucide-react';
import { useListAcademicYearsQuery } from '../../api/academicApi.js';
import {
  usePreviewStudentImportMutation,
  useCommitStudentImportMutation,
  studentImportTemplateUrl,
} from '../../api/studentsApi.js';
import downloadAuthenticatedFile from '../../utils/downloadFile.js';
import Spinner from '../../components/Spinner.jsx';

const STATUS_BADGE = {
  new: 'badge-success',
  update: 'badge-info',
  error: 'badge-danger',
  duplicate: 'badge-warning',
};

export default function ImportStudentsPage() {
  const navigate = useNavigate();
  const { data: yearsData } = useListAcademicYearsQuery({ limit: 100 });
  const years = yearsData?.data || [];

  const [academicYear, setAcademicYear] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [commitResult, setCommitResult] = useState(null);

  const [previewImport, { isLoading: previewing }] = usePreviewStudentImportMutation();
  const [commitImport, { isLoading: committing }] = useCommitStudentImportMutation();

  const handlePreview = async (e) => {
    e.preventDefault();
    if (!file || !academicYear) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await previewImport({ academicYear, formData }).unwrap();
      setPreview(res.data);
      setCommitResult(null);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to read the file');
    }
  };

  const handleCommit = async () => {
    const rows = preview.rows.filter((r) => r.status === 'new' || r.status === 'update');
    try {
      const res = await commitImport({ academicYear, rows }).unwrap();
      setCommitResult(res.data);
      toast.success(res.message);
    } catch (err) {
      toast.error(err?.data?.message || 'Import failed');
    }
  };

  const importableCount = preview ? preview.rows.filter((r) => r.status === 'new' || r.status === 'update').length : 0;

  return (
    <div className="space-y-4">
      <button
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        onClick={() => navigate('/students')}
      >
        <ArrowLeft size={14} /> Back to Students
      </button>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Import Students from Excel</h1>

      <div className="card space-y-4 p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="label">Academic year</label>
            <select className="input" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}>
              <option value="">Select academic year</option>
              {years.map((y) => (
                <option key={y._id} value={y._id}>
                  {y.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => downloadAuthenticatedFile(studentImportTemplateUrl(), 'student-import-template.xlsx')}
          >
            <Download size={16} /> Download Template
          </button>
        </div>

        <form onSubmit={handlePreview} className="flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <label className="label">Excel file (.xlsx or .xls)</label>
            <input
              type="file"
              accept=".xlsx,.xls"
              className="input"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={!file || !academicYear || previewing}>
            {previewing ? <Spinner size={16} className="text-white" /> : <Upload size={16} />} Preview
          </button>
        </form>
        {!academicYear && <p className="text-xs text-gray-500 dark:text-gray-400">Select an academic year before uploading.</p>}
      </div>

      {preview && (
        <div className="card space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="badge-neutral">Total: {preview.summary.total}</span>
              <span className="badge-success">New: {preview.summary.new}</span>
              <span className="badge-info">Update: {preview.summary.update}</span>
              <span className="badge-warning">Duplicate: {preview.summary.duplicate}</span>
              <span className="badge-danger">Error: {preview.summary.error}</span>
            </div>
            <button className="btn-primary" disabled={!importableCount || committing} onClick={handleCommit}>
              {committing ? <Spinner size={16} className="text-white" /> : `Import ${importableCount} valid row(s)`}
            </button>
          </div>

          <div className="max-h-[28rem] overflow-auto rounded-lg border border-gray-200 dark:border-gray-800">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900/60">
                <tr className="text-left text-xs uppercase text-gray-500">
                  <th className="px-3 py-2">Row</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Admission No</th>
                  <th className="px-3 py-2">Class / Section</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Issues</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {preview.rows.map((r) => (
                  <tr key={r.rowNumber}>
                    <td className="px-3 py-2 text-gray-500">{r.rowNumber}</td>
                    <td className="px-3 py-2">
                      {r.data.firstName} {r.data.lastName}
                    </td>
                    <td className="px-3 py-2">{r.data.admissionNumber || <span className="text-gray-400">auto</span>}</td>
                    <td className="px-3 py-2">
                      {r.data.class} / {r.data.section}
                    </td>
                    <td className="px-3 py-2">
                      <span className={STATUS_BADGE[r.status]}>{r.status}</span>
                    </td>
                    <td className="px-3 py-2 text-xs text-danger-600 dark:text-danger-400">{r.errors.join('; ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(preview.summary.error > 0 || preview.summary.duplicate > 0) && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Rows with errors or duplicates are skipped automatically. Fix them in the spreadsheet and re-upload if needed.
            </p>
          )}
        </div>
      )}

      {commitResult && (
        <div className="card space-y-4 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Import Summary</h2>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="badge-success">Created: {commitResult.summary.created}</span>
            <span className="badge-info">Updated: {commitResult.summary.updated}</span>
            <span className="badge-danger">Failed: {commitResult.summary.failed}</span>
          </div>

          {commitResult.results.created.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                New student credentials (share securely — shown only once)
              </h3>
              <div className="max-h-64 overflow-auto rounded-lg border border-gray-200 dark:border-gray-800">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900/60">
                    <tr className="text-left text-xs uppercase text-gray-500">
                      <th className="px-3 py-2">Admission No</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Password</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {commitResult.results.created.map((c) => (
                      <tr key={c.rowNumber}>
                        <td className="px-3 py-2">{c.admissionNumber}</td>
                        <td className="px-3 py-2">{c.email}</td>
                        <td className="px-3 py-2 font-mono">{c.password}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {commitResult.results.failed.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Failed rows</h3>
              <ul className="space-y-1 text-sm text-danger-600 dark:text-danger-400">
                {commitResult.results.failed.map((f) => (
                  <li key={f.rowNumber}>
                    Row {f.rowNumber}: {f.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
