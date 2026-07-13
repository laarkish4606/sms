import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
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

  if (sent) {
    return (
      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          If an account with that email exists, a reset link has been sent.
        </p>
        <Link to="/login" className="mt-4 inline-block text-sm text-primary-600 hover:underline">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Enter your account email and we'll send you a password reset link.
      </p>
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input id="email" type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <button type="submit" className="btn-primary w-full" disabled={isLoading}>
        {isLoading ? <Spinner size={16} className="text-white" /> : 'Send reset link'}
      </button>
      <Link to="/login" className="block text-center text-sm text-primary-600 hover:underline">
        Back to login
      </Link>
    </form>
  );
}
