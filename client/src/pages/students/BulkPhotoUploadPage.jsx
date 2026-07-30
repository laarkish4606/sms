import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Upload, ImageOff } from 'lucide-react';
import { useMatchBulkPhotosMutation, useCommitBulkPhotosMutation } from '../../api/studentsApi.js';
import Spinner from '../../components/Spinner.jsx';
import compressImage from '../../utils/compressImage.js';

export default function BulkPhotoUploadPage() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [matchResult, setMatchResult] = useState(null);
  const [manualAssignments, setManualAssignments] = useState({}); // filename -> studentId
  const [overwrites, setOverwrites] = useState({}); // filename -> bool
  const [commitSummary, setCommitSummary] = useState(null);

  const [matchPhotos, { isLoading: matching }] = useMatchBulkPhotosMutation();
  const [commitPhotos, { isLoading: committing }] = useCommitBulkPhotosMutation();

  const previewUrls = useMemo(() => {
    const map = new Map();
    files.forEach((f) => map.set(f.name, URL.createObjectURL(f)));
    return map;
  }, [files]);

  const handleSelectFiles = (e) => {
    setFiles(Array.from(e.target.files || []));
    setMatchResult(null);
    setCommitSummary(null);
    setManualAssignments({});
    setOverwrites({});
  };

  const handleMatch = async () => {
    const formData = new FormData();
    // Compressed in parallel client-side — filenames (and therefore the
    // admission-number match) are preserved, only file size shrinks.
    const compressed = await Promise.all(files.map((f) => compressImage(f)));
    compressed.forEach((f) => formData.append('photos', f));
    try {
      const res = await matchPhotos(formData).unwrap();
      setMatchResult(res.data);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to upload photos');
    }
  };

  const handleCommit = async () => {
    const assignments = [
      ...matchResult.matched.map((m) => ({
        filename: m.filename,
        studentId: m.studentId,
        overwrite: Boolean(overwrites[m.filename]),
      })),
      ...matchResult.unmatched
        .filter((u) => manualAssignments[u.filename])
        .map((u) => ({ filename: u.filename, studentId: manualAssignments[u.filename], overwrite: true })),
    ];
    if (!assignments.length) return;

    try {
      const res = await commitPhotos({ batchId: matchResult.batchId, assignments }).unwrap();
      setCommitSummary(res.data);
      toast.success(res.message);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to save photos');
    }
  };

  return (
    <div className="space-y-4">
      <button
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        onClick={() => navigate('/students')}
      >
        <ArrowLeft size={14} /> Back to Students
      </button>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Bulk Student Photo Upload</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Name each photo after the student's admission number (e.g. <code>STU-2026-0001.jpg</code>) — matching is automatic.
      </p>

      <div className="card space-y-4 p-5">
        <div>
          <label className="label">Select photos (JPG, JPEG, PNG)</label>
          <input type="file" accept="image/jpeg,image/png" multiple className="input" onChange={handleSelectFiles} />
        </div>
        {files.length > 0 && (
          <button className="btn-primary" disabled={matching} onClick={handleMatch}>
            {matching ? <Spinner size={16} className="text-white" /> : <Upload size={16} />} Upload & Match {files.length} photo(s)
          </button>
        )}
      </div>

      {matchResult && (
        <>
          <div className="card space-y-3 p-5">
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="badge-neutral">Total: {matchResult.totalPhotos}</span>
              <span className="badge-success">Matched: {matchResult.matched.length}</span>
              <span className="badge-warning">Unmatched: {matchResult.unmatched.length}</span>
              <span className="badge-danger">Duplicate: {matchResult.duplicates.length}</span>
            </div>

            {matchResult.matched.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Matched</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {matchResult.matched.map((m) => (
                    <div key={m.filename} className="rounded-lg border border-gray-200 p-2 text-xs dark:border-gray-800">
                      <img src={previewUrls.get(m.filename)} alt={m.filename} className="mb-2 h-24 w-full rounded object-cover" />
                      <p className="truncate font-medium text-gray-800 dark:text-gray-200">{m.studentName}</p>
                      <p className="text-gray-500">{m.admissionNumber}</p>
                      {m.hasExistingPhoto && (
                        <label className="mt-1 flex items-center gap-1 text-warning-700 dark:text-warning-400">
                          <input
                            type="checkbox"
                            checked={Boolean(overwrites[m.filename])}
                            onChange={(e) => setOverwrites((o) => ({ ...o, [m.filename]: e.target.checked }))}
                          />
                          Overwrite existing photo
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {matchResult.unmatched.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Unmatched — assign manually</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {matchResult.unmatched.map((u) => (
                    <div key={u.filename} className="rounded-lg border border-gray-200 p-2 text-xs dark:border-gray-800">
                      <img src={previewUrls.get(u.filename)} alt={u.filename} className="mb-2 h-24 w-full rounded object-cover" />
                      <p className="mb-1 flex items-center gap-1 truncate text-gray-500">
                        <ImageOff size={12} /> {u.filename}
                      </p>
                      <select
                        className="input py-1 text-xs"
                        value={manualAssignments[u.filename] || ''}
                        onChange={(e) => setManualAssignments((a) => ({ ...a, [u.filename]: e.target.value }))}
                      >
                        <option value="">Select student...</option>
                        {matchResult.allStudents.map((s) => (
                          <option key={s._id} value={s._id}>
                            {s.admissionNumber} — {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {matchResult.duplicates.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Duplicates (skipped)</h3>
                <ul className="text-xs text-danger-600 dark:text-danger-400">
                  {matchResult.duplicates.map((d) => (
                    <li key={d.filename}>
                      {d.filename} — {d.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button className="btn-primary" disabled={committing} onClick={handleCommit}>
              {committing ? <Spinner size={16} className="text-white" /> : 'Confirm & Save Photos'}
            </button>
          </div>
        </>
      )}

      {commitSummary && (
        <div className="card space-y-2 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Upload Summary</h2>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="badge-neutral">Total: {commitSummary.total}</span>
            <span className="badge-success">Uploaded: {commitSummary.uploaded}</span>
            <span className="badge-warning">Skipped (existing photo): {commitSummary.skipped}</span>
            <span className="badge-danger">Failed: {commitSummary.failed.length}</span>
          </div>
          {commitSummary.failed.length > 0 && (
            <ul className="text-xs text-danger-600 dark:text-danger-400">
              {commitSummary.failed.map((f) => (
                <li key={f.filename}>
                  {f.filename}: {f.error}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
