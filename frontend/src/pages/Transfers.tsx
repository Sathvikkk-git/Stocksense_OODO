import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Badge } from '../components/Badge';
import { Plus, ArrowRightLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export const Transfers: React.FC = () => {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [srcLocId, setSrcLocId] = useState('');
  const [destLocId, setDestLocId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(5);
  const [error, setError] = useState('');
  const [validationAlert, setValidationAlert] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/transfers');
      setTransfers(res.data.data);
    } catch (err) {
      console.error('Failed to fetch transfers', err);
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
      if (locRes.data.data.length >= 2) {
        setSrcLocId(locRes.data.data[0].id);
        setDestLocId(locRes.data.data[1].id);
      }
    } catch (err) {
      console.error('Failed to fetch metadata', err);
    }
  };

  useEffect(() => {
    fetchAuxData();
    fetchTransfers();
  }, []);

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (srcLocId === destLocId) {
      setError('Source and destination locations must be different.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/transfers', {
        sourceLocationId: srcLocId,
        destinationLocationId: destLocId,
        items: [{ productId, quantity: Number(quantity) }],
      });
      setIsModalOpen(false);
      fetchTransfers();
    } catch (err: any) {
      setError(err.message || 'Failed to create internal transfer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleValidate = async (id: string) => {
    setValidationAlert(null);
    try {
      await api.post(`/transfers/${id}/validate`);
      fetchTransfers();
    } catch (err: any) {
      setValidationAlert({
        message: err.message,
        details: err.details,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Internal Location Transfers</h1>
          <p className="text-sm text-gray-500">Move inventory between warehouses, racks, and assembly floors</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-md"
        >
          <Plus className="w-4 h-4" /> Schedule Internal Transfer
        </button>
      </div>

      {/* Validation Alert */}
      {validationAlert && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm">
          <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>Transfer Failed — Insufficient Source Stock</span>
          </div>
          <p className="text-xs text-red-700 pl-7">{validationAlert.message}</p>
        </div>
      )}

      {/* Transfers Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
              <th className="py-3.5 px-6">Reference #</th>
              <th className="py-3.5 px-6">Source Location</th>
              <th className="py-3.5 px-6">Destination Location</th>
              <th className="py-3.5 px-6">Items & Quantity</th>
              <th className="py-3.5 px-6">Status</th>
              <th className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-500">
                  Loading transfers...
                </td>
              </tr>
            ) : transfers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-500">
                  No internal location transfers scheduled.
                </td>
              </tr>
            ) : (
              transfers.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6 font-mono font-semibold text-gray-900">{t.referenceNumber}</td>
                  <td className="py-4 px-6 text-xs text-gray-600">
                    {t.sourceLocation?.warehouse?.name} / <span className="font-semibold">{t.sourceLocation?.name}</span>
                  </td>
                  <td className="py-4 px-6 text-xs text-gray-600">
                    {t.destinationLocation?.warehouse?.name} / <span className="font-semibold">{t.destinationLocation?.name}</span>
                  </td>
                  <td className="py-4 px-6 text-xs space-y-1">
                    {t.items?.map((item: any) => (
                      <div key={item.id} className="font-medium text-gray-800">
                        • {item.product?.name} ({item.quantity} {item.product?.uom})
                      </div>
                    ))}
                  </td>
                  <td className="py-4 px-6">
                    <Badge status={t.status} />
                  </td>
                  <td className="py-4 px-6 text-right">
                    {t.status !== 'DONE' && (
                      <button
                        onClick={() => handleValidate(t.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-xs font-semibold shadow-sm ml-auto"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Execute Stock Transfer
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Create Transfer */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
              Schedule Internal Location Transfer
            </h2>
            {error && (
              <div className="bg-red-50 text-red-700 text-xs p-2.5 rounded flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
            <form onSubmit={handleCreateTransfer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Source Location *</label>
                <select
                  value={srcLocId}
                  onChange={(e) => setSrcLocId(e.target.value)}
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
                <label className="block text-xs font-semibold text-gray-700 mb-1">Destination Location *</label>
                <select
                  value={destLocId}
                  onChange={(e) => setDestLocId(e.target.value)}
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
                <label className="block text-xs font-semibold text-gray-700 mb-1">Transfer Quantity *</label>
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
                  {submitting ? 'Scheduling...' : 'Schedule Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
