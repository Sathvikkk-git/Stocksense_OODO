import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  SlidersHorizontal,
  History,
  Building2,
  Tags,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { header: 'INVENTORY & PRODUCTS' },
    { label: 'Products', path: '/products', icon: Package },
    { label: 'Categories', path: '/categories', icon: Tags },
    { header: 'WAREHOUSE OPERATIONS' },
    { label: 'Receipts', path: '/receipts', icon: ArrowDownLeft },
    { label: 'Delivery Orders', path: '/deliveries', icon: ArrowUpRight },
    { label: 'Internal Transfers', path: '/transfers', icon: ArrowRightLeft },
    { label: 'Stock Adjustments', path: '/adjustments', icon: SlidersHorizontal },
    { label: 'Stock Ledger', path: '/ledger', icon: History },
    { header: 'CONFIGURATION' },
    { label: 'Warehouses & Locations', path: '/warehouses', icon: Building2 },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col min-h-screen border-r border-slate-800">
      {/* Brand Logo */}
      <div className="p-5 flex items-center gap-3 border-b border-slate-800 bg-slate-950">
        <div className="bg-blue-600 text-white p-2 rounded-lg font-bold flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Boxes className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-white text-lg tracking-tight">StockSense</h1>
          <p className="text-xs text-slate-400 font-medium">Inventory System</p>
        </div>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item, idx) => {
          if (item.header) {
            return (
              <div key={idx} className="pt-4 pb-1 px-3 text-[11px] font-semibold text-slate-500 tracking-wider uppercase">
                {item.header}
              </div>
            );
          }

          const Icon = item.icon!;
          return (
            <NavLink
              key={item.path}
              to={item.path!}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
        OODO Hackathon 2026 Edition
      </div>
    </aside>
  );
};
