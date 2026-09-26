import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, Shield } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500 font-medium">Location Mode:</span>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          Global Enterprise Network
        </span>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3 pr-3 border-r border-gray-200">
            <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-700 font-semibold border border-slate-200">
              <UserIcon className="w-5 h-5 text-slate-600" />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-gray-900 leading-tight">{user.name}</div>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Shield className="w-3 h-3 text-blue-600 inline" /> {user.role}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};
