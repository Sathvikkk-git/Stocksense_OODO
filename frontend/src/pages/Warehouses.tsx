import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Building2, MapPin, Plus, AlertCircle } from 'lucide-react';

export const Warehouses: React.FC = () => {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isWhModalOpen, setIsWhModalOpen] = useState(false);
  const [isLocModalOpen, setIsLocModalOpen] = useState(false);

  // Warehouse Form
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');

  // Location Form
  const [targetWhId, setTargetWhId] = useState('');
  const [locCode, setLocCode] = useState('');
  const [locName, setLocName] = useState('');
  const [locType, setLocType] = useState('RACK');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/warehouses');
      setWarehouses(res.data.data);
      if (res.data.data.length > 0) setTargetWhId(res.data.data[0].id);
    } catch (err) {
      console.error('Failed to fetch warehouses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/warehouses', { code, name, address });
      setIsWhModalOpen(false);
      setCode('');
      setName('');
      setAddress('');
      fetchWarehouses();
    } catch (err: any) {
      setError(err.message || 'Failed to create warehouse');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/warehouses/locations', {
        warehouseId: targetWhId,
        code: locCode,
        name: locName,
        type: locType,
      });
      setIsLocModalOpen(false);
      setLocCode('');
      setLocName('');
      fetchWarehouses();
    } catch (err: any) {
      setError(err.message || 'Failed to create location');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Warehouses & Locations</h1>
          <p className="text-sm text-gray-500">Multi-warehouse network topology and location hierarchy</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsLocModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-sm"
          >
            <Plus className="w-4 h-4 text-gray-500" /> Add Location
          </button>
          <button
            onClick={() => setIsWhModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md"
          >
            <Plus className="w-4 h-4" /> Add Warehouse
          </button>
        </div>
      </div>

      {/* Warehouses Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading warehouses...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {warehouses.map((wh) => (
            <div key={wh.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-gray-100 bg-slate-50 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <h2 className="font-bold text-gray-900 text-base">{wh.name}</h2>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{wh.address || 'Primary facility'}</p>
                </div>
                <span className="font-mono text-xs font-bold px-2 py-1 bg-blue-100 text-blue-800 rounded">
                  {wh.code}
                </span>
              </div>

              <div className="p-5 flex-1 space-y-3">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Locations inside warehouse ({wh.locations?.length || 0}):
                </div>
                {wh.locations?.length === 0 ? (
                  <div className="text-xs text-gray-400 italic py-2">No locations created yet</div>
                ) : (
                  <div className="space-y-2">
                    {wh.locations?.map((loc: any) => (
                      <div key={loc.id} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100 text-xs">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <div className="font-semibold text-gray-800">{loc.name}</div>
                            <div className="text-[10px] text-gray-400 font-mono">Code: {loc.code}</div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-[10px] rounded font-semibold uppercase">
                          {loc.type}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create Warehouse */}
      {isWhModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
              Add New Warehouse Facility
            </h2>
            {error && (
              <div className="bg-red-50 text-red-700 text-xs p-2.5 rounded flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
            <form onSubmit={handleCreateWarehouse} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Warehouse Code *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="WH-02"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Warehouse Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="East Coast Regional Hub"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Address / Location</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="45 Industrial Way"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsWhModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Warehouse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Location */}
      {isLocModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
              Add Location to Warehouse
            </h2>
            {error && (
              <div className="bg-red-50 text-red-700 text-xs p-2.5 rounded flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
            <form onSubmit={handleCreateLocation} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Select Warehouse *</label>
                <select
                  value={targetWhId}
                  onChange={(e) => setTargetWhId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                >
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name} ({wh.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Location Code *</label>
                <input
                  type="text"
                  required
                  value={locCode}
                  onChange={(e) => setLocCode(e.target.value)}
                  placeholder="RACK-C1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Location Name *</label>
                <input
                  type="text"
                  required
                  value={locName}
                  onChange={(e) => setLocName(e.target.value)}
                  placeholder="Rack C - Shelf 1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Storage Type</label>
                <select
                  value={locType}
                  onChange={(e) => setLocType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                >
                  <option value="RACK">Rack</option>
                  <option value="SHELF">Shelf</option>
                  <option value="PALLET">Pallet Staging</option>
                  <option value="FLOOR">Floor Assembly</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsLocModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
