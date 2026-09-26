import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Boxes, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.data.token, res.data.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/30">
            <Boxes className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Sign in to StockSense</h2>
          <p className="text-sm text-gray-500">OODO Hackathon Inventory Management System</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@stocksense.com"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm outline-none transition-all"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs text-blue-600 hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md shadow-blue-600/20 transition-all text-sm disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Demo Credentials Quick Selector */}
        <div className="pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center mb-2 font-medium">Quick Demo Credentials:</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleDemoFill('admin@stocksense.com')}
              className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded font-medium border border-slate-200"
            >
              Admin
            </button>
            <button
              onClick={() => handleDemoFill('manager@stocksense.com')}
              className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded font-medium border border-slate-200"
            >
              Manager
            </button>
            <button
              onClick={() => handleDemoFill('staff@stocksense.com')}
              className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded font-medium border border-slate-200"
            >
              Staff
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500">
          Don't have an account?{' '}
          <Link to="/signup" className="text-blue-600 font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};
