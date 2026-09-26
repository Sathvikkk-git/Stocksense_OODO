import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Badge } from '../components/Badge';
import { Plus, ArrowUpRight, CheckCircle2, AlertCircle } from 'lucide-react';

export const Deliveries: React.FC = () => {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [locationId, setLocationId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(5);
  const [error, setError] = useState('');
  const [validationAlert, setValidationAlert] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const res = await api.get('/deliveries');
      setDeliveries(res.data.data);
    } catch (err) {
      console.error('Failed to fetch deliveries', err);
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
    fetchDeliveries();
  }, []);

  const handleCreateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/deliveries', {
        locationId,
        customerName: customerName || 'Standard Order',
        items: [{ productId, requestedQty: Number(quantity), deliveredQty: Number(quantity) }],
      });
      setIsModalOpen(false);
      fetchDeliveries();
    } catch (err: any) {
      setError(err.message || 'Failed to create delivery order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleValidate = async (id: string) => {
    setValidationAlert(null);
    try {
      await api.post(`/deliveries/${id}/validate`);
      fetchDeliveries();
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
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Delivery Orders</h1>
          <p className="text-sm text-gray-500">Pick, pack, and fulfill outgoing customer shipments</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-md"
        >
          <Plus className="w-4 h-4" /> Create Delivery Order
        </button>
      </div>

      {/* Insufficient Stock Validation Alert Banner */}
      {validationAlert && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm space-y-1">
          <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>Validation Blocked — Insufficient Stock</span>
          </div>
          <p className="text-xs text-red-700 pl-7">{validationAlert.message}</p>
          {validationAlert.details && (
            <div className="pl-7 text-xs font-mono text-red-900 pt-1">
              Requested: <span className="font-bold">{validationAlert.details.requested}</span> | Available at location:{' '}
              <span className="font-bold">{validationAlert.details.available}</span>
            </div>
          )}
        </div>
      )}

      {/* Deliveries Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
              <th className="py-3.5 px-6">Reference #</th>
              <th className="py-3.5 px-6">Source Location</th>
              <th className="py-3.5 px-6">Customer</th>
              <th className="py-3.5 px-6">Items & Quantities</th>
              <th className="py-3.5 px-6">Status</th>
              <th className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-500">
                  Loading delivery orders...
                </td>
              </tr>
            ) : deliveries.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-500">
                  No delivery orders recorded yet.
                </td>
              </tr>
            ) : (
              deliveries.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6 font-mono font-semibold text-gray-900">{d.referenceNumber}</td>
                  <td className="py-4 px-6 text-xs text-gray-600">
                    {d.location?.warehouse?.name} / <span className="font-semibold">{d.location?.name}</span>
                  </td>
                  <td className="py-4 px-6 text-xs text-gray-700 font-medium">{d.customerName || 'General'}</td>
                  <td className="py-4 px-6 text-xs space-y-1">
                    {d.items?.map((item: any) => (
                      <div key={item.id} className="font-medium text-gray-800">
                        • {item.product?.name} ({item.deliveredQty || item.requestedQty} {item.product?.uom})
                      </div>
                    ))}
                  </td>
                  <td className="py-4 px-6">
                    <Badge status={d.status} />
                  </td>
                  <td className="py-4 px-6 text-right">
                    {d.status !== 'DONE' && (
                      <button
                        onClick={() => handleValidate(d.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-semibold shadow-sm ml-auto"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Fulfill & Deduct Stock
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Create Delivery */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
              Create Outgoing Delivery Order
            </h2>
            {error && (
              <div className="bg-red-50 text-red-700 text-xs p-2.5 rounded flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
            <form onSubmit={handleCreateDelivery} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Source Location *</label>
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
                <label className="block text-xs font-semibold text-gray-700 mb-1">Customer / Destination</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Acme Assembly Corp"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                />
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
                <label className="block text-xs font-semibold text-gray-700 mb-1">Quantity Requested *</label>
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
                  {submitting ? 'Creating...' : 'Create Delivery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
