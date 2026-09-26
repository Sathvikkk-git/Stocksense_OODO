import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Badge } from '../components/Badge';
import { Link } from 'react-router-dom';
import {
  Package,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  History,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/summary');
      setSummary(res.data.data);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const kpis = [
    {
      label: 'Products in Stock',
      value: summary?.totalProductsInStock || 0,
      subtext: `Total unique products: ${summary?.totalProducts || 0}`,
      icon: Package,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    {
      label: 'Low Stock Alerts',
      value: summary?.lowStockCount || 0,
      subtext: `Out of stock: ${summary?.outOfStockCount || 0}`,
      icon: AlertTriangle,
      color: 'bg-amber-50 text-amber-600 border-amber-200',
    },
    {
      label: 'Pending Receipts',
      value: summary?.pendingReceipts || 0,
      subtext: 'Incoming stock orders',
      icon: ArrowDownLeft,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
    {
      label: 'Pending Deliveries',
      value: summary?.pendingDeliveries || 0,
      subtext: 'Outgoing shipments',
      icon: ArrowUpRight,
      color: 'bg-purple-50 text-purple-600 border-purple-200',
    },
    {
      label: 'Internal Transfers',
      value: summary?.scheduledTransfers || 0,
      subtext: 'Location movements',
      icon: ArrowRightLeft,
      color: 'bg-cyan-50 text-cyan-600 border-cyan-200',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Inventory Dashboard</h1>
          <p className="text-sm text-gray-500">Real-time operational KPIs & stock activity snapshot</p>
        </div>
        <button
          onClick={fetchSummary}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-sm"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" /> Refresh Data
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{kpi.label}</span>
                <div className={`p-2 rounded-lg border ${kpi.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
              <p className="text-xs text-gray-500 mt-1">{kpi.subtext}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Activity Ledger Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-gray-900 text-base">Recent Stock Movements (Ledger)</h2>
          </div>
          <Link to="/ledger" className="text-xs font-semibold text-blue-600 hover:underline">
            View Complete Ledger ──►
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                <th className="py-3.5 px-6">Timestamp</th>
                <th className="py-3.5 px-6">Operation</th>
                <th className="py-3.5 px-6">Ref #</th>
                <th className="py-3.5 px-6">Product</th>
                <th className="py-3.5 px-6">Location</th>
                <th className="py-3.5 px-6 text-right">Change</th>
                <th className="py-3.5 px-6 text-right">New Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {summary?.recentMovements?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500 text-sm">
                    No stock movements recorded yet. Validate a receipt or transfer to see ledger entries.
                  </td>
                </tr>
              ) : (
                summary?.recentMovements?.map((m: any) => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3.5 px-6 text-xs text-gray-500">
                      {new Date(m.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6">
                      <Badge status={m.operationType} />
                    </td>
                    <td className="py-3.5 px-6 font-mono text-xs font-semibold text-gray-700">
                      {m.referenceNumber}
                    </td>
                    <td className="py-3.5 px-6 font-medium text-gray-900">
                      {m.product?.name}{' '}
                      <span className="text-xs text-gray-400 font-mono">({m.product?.sku})</span>
                    </td>
                    <td className="py-3.5 px-6 text-xs text-gray-600">
                      {m.location?.warehouse?.name} / {m.location?.name}
                    </td>
                    <td
                      className={`py-3.5 px-6 font-bold text-right ${
                        m.quantityChange > 0
                          ? 'text-emerald-600'
                          : m.quantityChange < 0
                          ? 'text-rose-600'
                          : 'text-gray-600'
                      }`}
                    >
                      {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange} {m.product?.uom}
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-gray-900 text-right">
                      {m.quantityAfter} {m.product?.uom}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
