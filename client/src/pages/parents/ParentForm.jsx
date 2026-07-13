import { useEffect, useState } from 'react';
import Spinner from '../../components/Spinner.jsx';

const EMPTY_FORM = { firstName: '', lastName: '', email: '', password: '', phone: '', occupation: '', address: '' };

export default function ParentForm({ initialValues, onSubmit, isSubmitting }) {
  const [values, setValues] = useState(EMPTY_FORM);
  const isEdit = Boolean(initialValues);

  useEffect(() => {
    setValues(initialValues ? { ...EMPTY_FORM, ...initialValues } : EMPTY_FORM);
  }, [initialValues]);

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
          <label className="label">Phone</label>
          <input className="input" value={values.phone} onChange={handleChange('phone')} />
        </div>
        <div>
          <label className="label">Occupation</label>
          <input className="input" value={values.occupation} onChange={handleChange('occupation')} />
        </div>
      </div>

      <div>
        <label className="label">Address</label>
        <textarea className="input" rows={2} value={values.address} onChange={handleChange('address')} />
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? <Spinner size={16} className="text-white" /> : isEdit ? 'Save changes' : 'Register parent'}
        </button>
      </div>
    </form>
  );
}
