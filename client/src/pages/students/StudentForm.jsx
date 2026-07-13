import { useEffect, useState } from 'react';
import Spinner from '../../components/Spinner.jsx';
import { useListSectionsQuery } from '../../api/academicApi.js';

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phone: '',
  dob: '',
  gender: 'male',
  class: '',
  section: '',
  rollNumber: '',
  address: '',
};

export default function StudentForm({ initialValues, onSubmit, isSubmitting, classes }) {
  const [values, setValues] = useState(EMPTY_FORM);
  const isEdit = Boolean(initialValues);

  useEffect(() => {
    if (initialValues) {
      setValues({
        ...EMPTY_FORM,
        ...initialValues,
        class: initialValues.class?._id || initialValues.class || '',
        section: initialValues.section?._id || initialValues.section || '',
        dob: initialValues.dob ? initialValues.dob.slice(0, 10) : '',
      });
    } else {
      setValues(EMPTY_FORM);
    }
  }, [initialValues]);

  const { data: sectionsData } = useListSectionsQuery({ class: values.class, limit: 100 }, { skip: !values.class });
  const sections = sectionsData?.data || [];

  const handleChange = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...values };
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
          <label className="label">Date of birth</label>
          <input type="date" className="input" required value={values.dob} onChange={handleChange('dob')} />
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="label">Class</label>
          <select
            className="input"
            required
            value={values.class}
            onChange={(e) => setValues((v) => ({ ...v, class: e.target.value, section: '' }))}
          >
            <option value="">Select class</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Section</label>
          <select className="input" required value={values.section} onChange={handleChange('section')} disabled={!values.class}>
            <option value="">Select section</option>
            {sections.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Roll number</label>
          <input className="input" value={values.rollNumber} onChange={handleChange('rollNumber')} />
        </div>
      </div>

      <div>
        <label className="label">Address</label>
        <textarea className="input" rows={2} value={values.address} onChange={handleChange('address')} />
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? <Spinner size={16} className="text-white" /> : isEdit ? 'Save changes' : 'Register student'}
        </button>
      </div>
    </form>
  );
}
