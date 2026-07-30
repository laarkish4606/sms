import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useGetStudentQuery, useUploadStudentPhotoMutation } from '../../api/studentsApi.js';
import Spinner from '../../components/Spinner.jsx';
import toast from 'react-hot-toast';
import compressImage from '../../utils/compressImage.js';

export default function StudentDetail() {
  const { id } = useParams();
  const { data, isLoading } = useGetStudentQuery(id);
  const [uploadPhoto, { isLoading: uploading }] = useUploadStudentPhotoMutation();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size={28} />
      </div>
    );
  }

  const student = data?.data;
  if (!student) return <p className="text-sm text-gray-500">Student not found.</p>;

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('photo', await compressImage(file));
    try {
      await uploadPhoto({ id, formData }).unwrap();
      toast.success('Photo updated');
    } catch (err) {
      toast.error(err?.data?.message || 'Upload failed');
    }
  };

  return (
    <div className="space-y-6">
      <Link to="/students" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600">
        <ArrowLeft size={16} /> Back to students
      </Link>

      <div className="card flex flex-col gap-6 p-6 sm:flex-row">
        <div className="flex flex-col items-center gap-3">
          <img
            src={student.photo || 'https://api.dicebear.com/7.x/initials/svg?seed=' + student.firstName}
            alt={student.firstName}
            className="h-28 w-28 rounded-full border border-gray-200 object-cover dark:border-gray-800"
          />
          <label className="btn-secondary cursor-pointer text-xs">
            {uploading ? <Spinner size={14} /> : 'Change photo'}
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </label>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          <Info label="Full name" value={`${student.firstName} ${student.lastName}`} />
          <Info label="Admission Number" value={student.admissionNumber} />
          <Info label="Class" value={student.class?.name} />
          <Info label="Section" value={student.section?.name} />
          <Info label="Gender" value={student.gender} />
          <Info label="Date of Birth" value={student.dob ? new Date(student.dob).toLocaleDateString() : '-'} />
          <Info label="Email" value={student.user?.email} />
          <Info label="Phone" value={student.user?.phone || '-'} />
          <Info label="Status" value={student.status} />
          <Info label="Address" value={student.address || '-'} />
        </div>
      </div>

      <div className="card p-6">
        <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Academic History</h2>
        {student.academicHistory?.length ? (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {student.academicHistory.map((h, i) => (
              <li key={i} className="py-2 text-sm text-gray-700 dark:text-gray-300">
                {h.academicYear?.name} — {h.class?.name} {h.section?.name} — <span className="font-medium">{h.result}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">No academic history recorded yet.</p>
        )}
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p className="text-sm text-gray-900 dark:text-gray-100">{value || '-'}</p>
    </div>
  );
}
