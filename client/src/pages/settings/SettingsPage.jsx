import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useGetSettingsQuery, useUpdateSchoolInfoMutation, useUpdateSystemConfigMutation, useUploadSchoolLogoMutation } from '../../api/settingsApi.js';
import Spinner from '../../components/Spinner.jsx';
import ChangePassword from '../auth/ChangePassword.jsx';

export default function SettingsPage() {
  const { data, isLoading } = useGetSettingsQuery();
  const [updateSchoolInfo, { isLoading: savingInfo }] = useUpdateSchoolInfoMutation();
  const [updateSystemConfig, { isLoading: savingConfig }] = useUpdateSystemConfigMutation();
  const [uploadLogo, { isLoading: uploadingLogo }] = useUploadSchoolLogoMutation();

  const [info, setInfo] = useState({ name: '', email: '', phone: '', address: '', website: '' });
  const [config, setConfig] = useState({ currency: '', timezone: '', dateFormat: '', gradingScale: '' });

  useEffect(() => {
    if (data?.data) {
      const school = data.data;
      setInfo({ name: school.name || '', email: school.email || '', phone: school.phone || '', address: school.address || '', website: school.website || '' });
      setConfig({
        currency: school.settings?.currency || '',
        timezone: school.settings?.timezone || '',
        dateFormat: school.settings?.dateFormat || '',
        gradingScale: school.settings?.gradingScale || '',
      });
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size={28} />
      </div>
    );
  }

  const school = data?.data;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>

      <form
        className="card space-y-4 p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await updateSchoolInfo(info).unwrap();
            toast.success('School information updated');
          } catch (err) {
            toast.error(err?.data?.message || 'Failed to update');
          }
        }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">School Information</h2>
          <div className="flex items-center gap-3">
            {school?.logo && <img src={school.logo} alt="Logo" className="h-10 w-10 rounded-lg object-cover" />}
            <label className="btn-secondary cursor-pointer text-xs">
              {uploadingLogo ? <Spinner size={14} /> : 'Change logo'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const formData = new FormData();
                  formData.append('logo', file);
                  await uploadLogo(formData).unwrap();
                  toast.success('Logo updated');
                }}
              />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">School Name</label>
            <input className="input" value={info.name} onChange={(e) => setInfo((v) => ({ ...v, name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" value={info.email} onChange={(e) => setInfo((v) => ({ ...v, email: e.target.value }))} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={info.phone} onChange={(e) => setInfo((v) => ({ ...v, phone: e.target.value }))} />
          </div>
          <div>
            <label className="label">Website</label>
            <input className="input" value={info.website} onChange={(e) => setInfo((v) => ({ ...v, website: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className="label">Address</label>
          <textarea className="input" rows={2} value={info.address} onChange={(e) => setInfo((v) => ({ ...v, address: e.target.value }))} />
        </div>
        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={savingInfo}>
            {savingInfo ? <Spinner size={16} className="text-white" /> : 'Save'}
          </button>
        </div>
      </form>

      <form
        className="card space-y-4 p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await updateSystemConfig(config).unwrap();
            toast.success('System configuration updated');
          } catch (err) {
            toast.error(err?.data?.message || 'Failed to update');
          }
        }}
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">System Configuration</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Currency</label>
            <input className="input" value={config.currency} onChange={(e) => setConfig((v) => ({ ...v, currency: e.target.value }))} />
          </div>
          <div>
            <label className="label">Timezone</label>
            <input className="input" value={config.timezone} onChange={(e) => setConfig((v) => ({ ...v, timezone: e.target.value }))} />
          </div>
          <div>
            <label className="label">Date Format</label>
            <input className="input" value={config.dateFormat} onChange={(e) => setConfig((v) => ({ ...v, dateFormat: e.target.value }))} />
          </div>
          <div>
            <label className="label">Grading Scale</label>
            <input className="input" value={config.gradingScale} onChange={(e) => setConfig((v) => ({ ...v, gradingScale: e.target.value }))} />
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={savingConfig}>
            {savingConfig ? <Spinner size={16} className="text-white" /> : 'Save'}
          </button>
        </div>
      </form>

      <ChangePassword />
    </div>
  );
}
