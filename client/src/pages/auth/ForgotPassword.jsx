import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, KeyRound } from 'lucide-react';
import { useForgotPasswordMutation } from '../../api/authApi.js';
import Spinner from '../../components/Spinner.jsx';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await forgotPassword({ email }).unwrap();
      setSent(true);
    } catch (err) {
      toast.error(err?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="card p-6 sm:p-8">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-600/30">
          <KeyRound size={24} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Forgot Password?</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Enter your account email and we'll send you a reset link.
        </p>
      </div>

      {sent ? (
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            If an account with that email exists, a reset link has been sent.
          </p>
          <Link to="/login" className="mt-4 inline-block text-sm font-medium text-primary-600 hover:underline">
            Back to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="email"
                type="email"
                required
                className="input pl-9"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={isLoading}>
            {isLoading ? <Spinner size={16} className="text-white" /> : 'Send reset link'}
          </button>
          <Link to="/login" className="block text-center text-sm font-medium text-primary-600 hover:underline">
            Back to login
          </Link>
        </form>
      )}
    </div>
  );
}
