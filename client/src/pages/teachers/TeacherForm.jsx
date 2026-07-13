import { useEffect, useState } from 'react';
import Spinner from '../../components/Spinner.jsx';

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phone: '',
  designation: '',
  department: '',
  qualification: '',
  experienceYears: 0,
  dob: '',
  gender: 'male',
  address: '',
};

export default function TeacherForm({ initialValues, onSubmit, isSubmitting }) {
  const [values, setValues] = useState(EMPTY_FORM);
  const isEdit = Boolean(initialValues);

  useEffect(() => {
    setValues(
      initialValues
        ? { ...EMPTY_FORM, ...initialValues, dob: initialValues.dob ? initialValues.dob.slice(0, 10) : '' }
        : EMPTY_FORM
    );
  }, [initialValues]);

  const handleChange = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...values, experienceYears: Number(values.experienceYears) || 0 };
    if (isEdit) {
      delete payload.email;
      delete payload.password;
    }
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">First name</label>
          <input className="input" required value={values.firstName} onChange={handleChange('firstName')} />
        </div>
        <div>
          <label className="label">Last name</label>
          <input className="input" required value={values.lastName} onChange={handleChange('lastName')} />
        </div>
      </div>

      {!isEdit && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" required value={values.email} onChange={handleChange('email')} />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" className="input" required value={values.password} onChange={handleChange('password')} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Designation</label>
          <input className="input" value={values.designation} onChange={handleChange('designation')} />
        </div>
        <div>
          <label className="label">Department</label>
          <input className="input" value={values.department} onChange={handleChange('department')} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="label">Qualification</label>
          <input className="input" value={values.qualification} onChange={handleChange('qualification')} />
        </div>
        <div>
          <label className="label">Experience (years)</label>
          <input type="number" min="0" className="input" value={values.experienceYears} onChange={handleChange('experienceYears')} />
        </div>
        <div>
          <label className="label">Gender</label>
          <select className="input" value={values.gender} onChange={handleChange('gender')}>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? <Spinner size={16} className="text-white" /> : isEdit ? 'Save changes' : 'Register teacher'}
        </button>
      </div>
    </form>
  );
}
