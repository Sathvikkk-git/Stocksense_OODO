import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Badge } from '../components/Badge';
import { Plus, SlidersHorizontal, CheckCircle2, AlertCircle } from 'lucide-react';

export const Adjustments: React.FC = () => {
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [locationId, setLocationId] = useState('');
  const [productId, setProductId] = useState('');
  const [physicalQty, setPhysicalQty] = useState(97);
  const [reason, setReason] = useState('Physical audit count reconciliation');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAdjustments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/adjustments');
      setAdjustments(res.data.data);
    } catch (err) {
      console.error('Failed to fetch adjustments', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuxData = async () => {
    try {
      const [prodRes, locRes] = await Promise.all([
        api.get('/products'),
        api.get('/warehouses/locations'),
      ]);
      setProducts(prodRes.data.data);
      setLocations(locRes.data.data);
      if (prodRes.data.data.length > 0) setProductId(prodRes.data.data[0].id);
      if (locRes.data.data.length > 0) setLocationId(locRes.data.data[0].id);
    } catch (err) {
      console.error('Failed to fetch metadata', err);
    }
  };

  useEffect(() => {
    fetchAuxData();
    fetchAdjustments();
  }, []);

  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/adjustments', {
        locationId,
        reason,
        items: [{ productId, physicalQty: Number(physicalQty) }],
      });
      setIsModalOpen(false);
      fetchAdjustments();
    } catch (err: any) {
      setError(err.message || 'Failed to create stock adjustment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleValidate = async (id: string) => {
    try {
      await api.post(`/adjustments/${id}/validate`);
      fetchAdjustments();
    } catch (err: any) {
      alert(err.message || 'Failed to validate stock adjustment');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Stock Adjustments</h1>
          <p className="text-sm text-gray-500">Reconcile physical inventory counts with system records</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-md"
        >
          <Plus className="w-4 h-4" /> Create Stock Adjustment
        </button>
      </div>

      {/* Adjustments Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
              <th className="py-3.5 px-6">Reference #</th>
              <th className="py-3.5 px-6">Location</th>
              <th className="py-3.5 px-6">Audit Details & Difference</th>
              <th className="py-3.5 px-6">Reason</th>
              <th className="py-3.5 px-6">Status</th>
              <th className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-500">
                  Loading stock adjustments...
                </td>
              </tr>
            ) : adjustments.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-500">
                  No stock adjustments recorded yet.
                </td>
              </tr>
            ) : (
              adjustments.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6 font-mono font-semibold text-gray-900">{a.referenceNumber}</td>
                  <td className="py-4 px-6 text-xs text-gray-600">
                    {a.location?.warehouse?.name} / <span className="font-semibold">{a.location?.name}</span>
                  </td>
                  <td className="py-4 px-6 text-xs space-y-1">
                    {a.items?.map((item: any) => (
                      <div key={item.id} className="font-medium text-gray-800">
                        • {item.product?.name}: System recorded <span className="font-semibold">{item.recordedQty}</span> ──► Counted <span className="font-semibold">{item.physicalQty}</span> (Diff:{' '}
                        <span className={item.quantityDiff >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                          {item.quantityDiff > 0 ? `+${item.quantityDiff}` : item.quantityDiff}
                        </span>)
                      </div>
                    ))}
                  </td>
                  <td className="py-4 px-6 text-xs text-gray-500">{a.reason}</td>
                  <td className="py-4 px-6">
                    <Badge status={a.status} />
                  </td>
                  <td className="py-4 px-6 text-right">
                    {a.status !== 'DONE' && (
                      <button
                        onClick={() => handleValidate(a.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs font-semibold shadow-sm ml-auto"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Reconcile Stock
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Create Adjustment */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
              Create Stock Adjustment
            </h2>
            {error && (
              <div className="bg-red-50 text-red-700 text-xs p-2.5 rounded flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
            <form onSubmit={handleCreateAdjustment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Target Location *</label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                >
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.warehouse?.code} — {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Select Product *</label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (SKU: {p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Actual Physical Count *</label>
                <input
                  type="number"
                  required
                  value={physicalQty}
                  onChange={(e) => setPhysicalQty(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Reason / Notes</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Damaged stock, audit count discrepancy..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
