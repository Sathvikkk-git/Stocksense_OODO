import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Badge } from '../components/Badge';
import { Plus, ArrowDownLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export const Receipts: React.FC = () => {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [locationId, setLocationId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/receipts');
      setReceipts(res.data.data);
    } catch (err) {
      console.error('Failed to fetch receipts', err);
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
    fetchReceipts();
  }, []);

  const handleCreateReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/receipts', {
        locationId,
        items: [{ productId, expectedQty: Number(quantity), receivedQty: Number(quantity) }],
      });
      setIsModalOpen(false);
      fetchReceipts();
    } catch (err: any) {
      setError(err.message || 'Failed to create receipt');
    } finally {
      setSubmitting(false);
    }
  };

  const handleValidate = async (id: string) => {
    try {
      await api.post(`/receipts/${id}/validate`);
      fetchReceipts();
    } catch (err: any) {
      alert(err.message || 'Failed to validate receipt');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Incoming Receipts</h1>
          <p className="text-sm text-gray-500">Receive goods from suppliers and automatically increment stock</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-md"
        >
          <Plus className="w-4 h-4" /> Create Goods Receipt
        </button>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
              <th className="py-3.5 px-6">Reference #</th>
              <th className="py-3.5 px-6">Destination Location</th>
              <th className="py-3.5 px-6">Items & Quantities</th>
              <th className="py-3.5 px-6">Created By</th>
              <th className="py-3.5 px-6">Status</th>
              <th className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-500">
                  Loading receipts...
                </td>
              </tr>
            ) : receipts.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-500">
                  No goods receipts recorded yet.
                </td>
              </tr>
            ) : (
              receipts.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6 font-mono font-semibold text-gray-900">{r.referenceNumber}</td>
                  <td className="py-4 px-6 text-xs text-gray-600">
                    {r.location?.warehouse?.name} / <span className="font-semibold">{r.location?.name}</span>
                  </td>
                  <td className="py-4 px-6 text-xs space-y-1">
                    {r.items?.map((item: any) => (
                      <div key={item.id} className="font-medium text-gray-800">
                        • {item.product?.name} ({item.receivedQty || item.expectedQty} {item.product?.uom})
                      </div>
                    ))}
                  </td>
                  <td className="py-4 px-6 text-xs text-gray-500">{r.createdBy?.name}</td>
                  <td className="py-4 px-6">
                    <Badge status={r.status} />
                  </td>
                  <td className="py-4 px-6 text-right">
                    {r.status !== 'DONE' && (
                      <button
                        onClick={() => handleValidate(r.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-sm ml-auto"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Validate & Add Stock
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Create Receipt */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
              Create Incoming Goods Receipt
            </h2>
            {error && (
              <div className="bg-red-50 text-red-700 text-xs p-2.5 rounded flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
            <form onSubmit={handleCreateReceipt} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Destination Location *</label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                >
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.warehouse?.name} — {l.name} ({l.code})
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
                <label className="block text-xs font-semibold text-gray-700 mb-1">Quantity Received *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
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
                  {submitting ? 'Creating...' : 'Create Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
