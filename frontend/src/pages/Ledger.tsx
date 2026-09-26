import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Badge } from '../components/Badge';
import { History, Search, Filter } from 'lucide-react';

export const Ledger: React.FC = () => {
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [operationType, setOperationType] = useState('');

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ledger', {
        params: {
          search,
          ...(operationType && { operationType }),
        },
      });
      setLedger(res.data.data);
    } catch (err) {
      console.error('Failed to fetch ledger entries', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [search, operationType]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Stock Ledger & Move History</h1>
          <p className="text-sm text-gray-500">Immutable chronological audit log of all physical inventory changes</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by Reference #, Product Name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <select
          value={operationType}
          onChange={(e) => setOperationType(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-auto"
        >
          <option value="">All Operation Types</option>
          <option value="RECEIPT">RECEIPT (+ Stock)</option>
          <option value="DELIVERY">DELIVERY (- Stock)</option>
          <option value="TRANSFER">TRANSFER (Location Move)</option>
          <option value="ADJUSTMENT">ADJUSTMENT (Audit Diff)</option>
        </select>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
              <th className="py-3.5 px-6">Timestamp</th>
              <th className="py-3.5 px-6">Operation</th>
              <th className="py-3.5 px-6">Ref #</th>
              <th className="py-3.5 px-6">Product & SKU</th>
              <th className="py-3.5 px-6">Warehouse / Location</th>
              <th className="py-3.5 px-6 text-right">Qty Before</th>
              <th className="py-3.5 px-6 text-right">Change</th>
              <th className="py-3.5 px-6 text-right">Qty After</th>
              <th className="py-3.5 px-6">User</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {loading ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-gray-500">
                  Loading stock ledger logs...
                </td>
              </tr>
            ) : ledger.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-gray-500">
                  No stock ledger entries found matching filters.
                </td>
              </tr>
            ) : (
              ledger.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6 text-xs text-gray-500">
                    {new Date(m.createdAt).toLocaleString()}
                  </td>
                  <td className="py-4 px-6">
                    <Badge status={m.operationType} />
                  </td>
                  <td className="py-4 px-6 font-mono text-xs font-semibold text-gray-800">
                    {m.referenceNumber}
                  </td>
                  <td className="py-4 px-6 font-medium text-gray-900">
                    {m.product?.name}{' '}
                    <span className="text-xs text-gray-400 font-mono">({m.product?.sku})</span>
                  </td>
                  <td className="py-4 px-6 text-xs text-gray-600">
                    {m.location?.warehouse?.name} / {m.location?.name}
                  </td>
                  <td className="py-4 px-6 font-semibold text-gray-600 text-right">
                    {m.quantityBefore} {m.product?.uom}
                  </td>
                  <td
                    className={`py-4 px-6 font-bold text-right ${
                      m.quantityChange > 0
                        ? 'text-emerald-600'
                        : m.quantityChange < 0
                        ? 'text-rose-600'
                        : 'text-gray-600'
                    }`}
                  >
                    {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange} {m.product?.uom}
                  </td>
                  <td className="py-4 px-6 font-bold text-gray-900 text-right">
                    {m.quantityAfter} {m.product?.uom}
                  </td>
                  <td className="py-4 px-6 text-xs text-gray-500">{m.user?.name}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
