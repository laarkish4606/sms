import { useState } from 'react';
import toast from 'react-hot-toast';
import { useChangePasswordMutation } from '../../api/authApi.js';
import Spinner from '../../components/Spinner.jsx';

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await changePassword({ currentPassword, newPassword }).unwrap();
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to change password');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card max-w-md space-y-4 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Change Password</h2>
      <div>
        <label className="label" htmlFor="currentPassword">
          Current Password
        </label>
        <input
          id="currentPassword"
          type="password"
          required
          className="input"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
      </div>
      <div>
        <label className="label" htmlFor="newPassword">
          New Password
        </label>
        <input
          id="newPassword"
          type="password"
          required
          className="input"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </div>
      <button type="submit" className="btn-primary" disabled={isLoading}>
        {isLoading ? <Spinner size={16} className="text-white" /> : 'Update password'}
      </button>
    </form>
  );
}
