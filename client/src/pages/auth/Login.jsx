import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
import { useLoginMutation } from '../../api/authApi.js';
import { useAppDispatch } from '../../app/hooks.js';
import { setCredentials } from '../../features/auth/authSlice.js';
import Spinner from '../../components/Spinner.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await login({ email, password }).unwrap();
      dispatch(setCredentials({ user: res.data.user, accessToken: res.data.accessToken }));
      toast.success('Welcome back!');
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      toast.error(err?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="card p-6 sm:p-8">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-600/30">
          <Lock size={24} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Welcome Back!</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Please sign in with your <span className="font-medium text-primary-600">school credentials</span>
        </p>
      </div>

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
              autoComplete="email"
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              className="input pl-9 pr-10"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            Remember me
          </label>
          <Link to="/forgot-password" className="font-medium text-primary-600 hover:underline">
            Forgot password?
          </Link>
        </div>

        <button type="submit" className="btn-primary w-full" disabled={isLoading}>
          {isLoading ? <Spinner size={16} className="text-white" /> : <ArrowRight size={16} />}
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-6 flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
        <ShieldCheck size={16} className="shrink-0 text-primary-600" />
        Your data is <span className="font-medium text-gray-700 dark:text-gray-300">safe and secure</span> with us.
      </div>
    </div>
  );
}
