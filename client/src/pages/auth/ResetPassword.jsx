import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock, ShieldCheck } from 'lucide-react';
import { useResetPasswordMutation } from '../../api/authApi.js';
import Spinner from '../../components/Spinner.jsx';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      await resetPassword({ token, password }).unwrap();
      toast.success('Password reset successful. Please log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err?.data?.message || 'Reset failed. The link may have expired.');
    }
  };

  return (
    <div className="card p-6 sm:p-8">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-600/30">
          <ShieldCheck size={24} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reset Password</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Choose a new password for your account.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="label" htmlFor="password">
            New Password
          </label>
          <div className="relative">
            <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="password"
              type="password"
              required
              className="input pl-9"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="confirmPassword">
            Confirm Password
          </label>
          <div className="relative">
            <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="confirmPassword"
              type="password"
              required
              className="input pl-9"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>
        <button type="submit" className="btn-primary w-full" disabled={isLoading}>
          {isLoading ? <Spinner size={16} className="text-white" /> : 'Reset password'}
        </button>
      </form>
    </div>
  );
}
