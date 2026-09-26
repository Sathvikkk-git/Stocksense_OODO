import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Badge } from '../components/Badge';
import { Plus, Search, Filter, Package, AlertCircle, MapPin } from 'lucide-react';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [uom, setUom] = useState('pcs');
  const [description, setDescription] = useState('');
  const [minStockLevel, setMinStockLevel] = useState(10);
  const [initialStock, setInitialStock] = useState(0);
  const [locationId, setLocationId] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products', {
        params: {
          search,
          ...(selectedCat && { categoryId: selectedCat }),
          ...(selectedStatus && { status: selectedStatus }),
        },
      });
      setProducts(res.data.data);
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuxData = async () => {
    try {
      const [catRes, locRes] = await Promise.all([
        api.get('/products/categories'),
        api.get('/warehouses/locations'),
      ]);
      setCategories(catRes.data.data);
      setLocations(locRes.data.data);
      if (catRes.data.data.length > 0) setCategoryId(catRes.data.data[0].id);
      if (locRes.data.data.length > 0) setLocationId(locRes.data.data[0].id);
    } catch (err) {
      console.error('Failed to fetch metadata', err);
    }
  };

  useEffect(() => {
    fetchAuxData();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [search, selectedCat, selectedStatus]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await api.post('/products', {
        name,
        sku,
        categoryId,
        uom,
        description,
        minStockLevel: Number(minStockLevel),
        initialStock: Number(initialStock),
        locationId,
      });

      setIsModalOpen(false);
      // Reset form
      setName('');
      setSku('');
      setDescription('');
      setInitialStock(0);
      fetchProducts();
    } catch (err: any) {
      setError(err.message || 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Product Catalog</h1>
          <p className="text-sm text-gray-500">Manage SKUs, categories, reorder limits and location quantities</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-md shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" /> Add New Product
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by Product Name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Stock Statuses</option>
            <option value="NORMAL">In Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
              <th className="py-3.5 px-6">Product Details</th>
              <th className="py-3.5 px-6">Category</th>
              <th className="py-3.5 px-6">UOM</th>
              <th className="py-3.5 px-6">Reorder Threshold</th>
              <th className="py-3.5 px-6">Location Breakdown</th>
              <th className="py-3.5 px-6 text-right">Total Stock</th>
              <th className="py-3.5 px-6 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-500">
                  Loading product catalog...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-500">
                  No products found matching filters.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div className="font-semibold text-gray-900">{p.name}</div>
                    <div className="text-xs text-gray-400 font-mono">SKU: {p.sku}</div>
                  </td>
                  <td className="py-4 px-6 text-xs text-gray-600 font-medium">
                    {p.category?.name}
                  </td>
                  <td className="py-4 px-6 text-xs text-gray-500">{p.uom}</td>
                  <td className="py-4 px-6 text-xs text-gray-500">{p.minStockLevel} {p.uom}</td>
                  <td className="py-4 px-6 text-xs">
                    <div className="space-y-1">
                      {p.inventory?.length === 0 ? (
                        <span className="text-gray-400 italic">No assigned locations</span>
                      ) : (
                        p.inventory?.map((inv: any) => (
                          <div key={inv.id} className="flex items-center gap-1.5 text-gray-700">
                            <MapPin className="w-3 h-3 text-blue-500" />
                            <span>{inv.location?.warehouse?.code} / {inv.location?.name}:</span>
                            <span className="font-semibold">{inv.quantity}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 font-bold text-gray-900 text-right text-base">
                    {p.totalStock} {p.uom}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <Badge status={p.stockStatus} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Create Product */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
              Add New Product to Catalog
            </h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Stainless Steel Bolt M8"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">SKU / Code *</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="RM-BOLT-M8"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Unit of Measure (UOM)</label>
                  <input
                    type="text"
                    value={uom}
                    onChange={(e) => setUom(e.target.value)}
                    placeholder="pcs, kg, m, boxes"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Reorder Threshold Level</label>
                  <input
                    type="number"
                    value={minStockLevel}
                    onChange={(e) => setMinStockLevel(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Initial Stock (Optional)</label>
                  <input
                    type="number"
                    value={initialStock}
                    onChange={(e) => setInitialStock(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Initial Location</label>
                  <select
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                  >
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.warehouse?.code} / {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
