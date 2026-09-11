// src/pages/Products.tsx
import React, { useEffect, useState } from 'react';
import {
  Plus, Search, Edit, AlertTriangle,
  X, MapPin, Image as ImageIcon, UploadCloud, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { productsApi } from '../api/products.api';
import { useAuth } from '../context/AuthContext';
import { Pagination } from '../components/ui/Pagination';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import type { Product } from '../types';

export const Products: React.FC = () => {
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [deletingImage, setDeletingImage] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    unitPrice: 0,
    stock: 0,
    minStockAlert: 10,
    warehouseLocation: '',
  });

  const canEdit = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE';

  const fetchCategories = async () => {
    try {
      const cats = await productsApi.getCategories();
      setCategories(cats);
    } catch (e) {
      console.error('Could not fetch categories', e);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productsApi.list({
        search: search || undefined,
        category: categoryFilter || undefined,
        lowStock: lowStockOnly ? 'true' : undefined,
        page,
        limit,
      });
      setProducts(res.data);
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages);
        setTotal(res.pagination.total);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [search, categoryFilter, lowStockOnly, page]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setFormData({
      name: '',
      sku: '',
      category: categories[0] || 'General',
      unitPrice: 100,
      stock: 50,
      minStockAlert: 10,
      warehouseLocation: 'Bay A-1',
    });
    setModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setSelectedFile(null);
    setPreviewUrl(p.imageUrl || null);
    setFormData({
      name: p.name,
      sku: p.sku,
      category: p.category,
      unitPrice: Number(p.unitPrice),
      stock: p.stock,
      minStockAlert: p.minStockAlert,
      warehouseLocation: p.warehouseLocation || '',
    });
    setModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Product image must be 5 MB or smaller');
        return;
      }
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type.toLowerCase())) {
        toast.error('Only JPEG, PNG, WebP, and GIF images are supported');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleDeleteImage = async () => {
    if (!editingProduct) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }
    setDeletingImage(true);
    try {
      await productsApi.deleteImage(editingProduct.id);
      toast.success('Product image removed');
      setPreviewUrl(null);
      setSelectedFile(null);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove product image');
    } finally {
      setDeletingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingProduct) {
        await productsApi.update(editingProduct.id, {
          name: formData.name.trim(),
          category: formData.category.trim(),
          unitPrice: Number(formData.unitPrice),
          minStockAlert: Number(formData.minStockAlert),
          warehouseLocation: formData.warehouseLocation.trim() || undefined,
        });

        if (selectedFile) {
          try {
            await productsApi.uploadImage(editingProduct.id, selectedFile);
          } catch (imgErr: any) {
            toast.error(imgErr.response?.data?.message || 'Image upload failed');
          }
        }

        toast.success('Product updated');
      } else {
        const newProduct = await productsApi.create({
          name: formData.name.trim(),
          sku: formData.sku.trim().toUpperCase(),
          category: formData.category.trim(),
          unitPrice: Number(formData.unitPrice),
          stock: Number(formData.stock),
          minStockAlert: Number(formData.minStockAlert),
          warehouseLocation: formData.warehouseLocation.trim() || undefined,
        });

        if (selectedFile && newProduct?.id) {
          try {
            await productsApi.uploadImage(newProduct.id, selectedFile);
          } catch (imgErr: any) {
            console.error('Image upload failed after product creation', imgErr);
            toast.error('Product created, but image upload failed');
          }
        }

        toast.success('Product created');
        fetchCategories();
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Products & Catalog</h1>
          <p className="page-subtitle">Track SKUs, warehouse pricing, minimum stock thresholds, and stock levels</p>
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={16} />
            Add Product
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input"
              placeholder="Search product name or SKU..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ paddingLeft: 38 }}
            />
          </div>

          <div style={{ minWidth: 160 }}>
            <select
              className="input"
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', cursor: 'pointer', padding: '8px 12px', background: lowStockOnly ? 'rgba(239,68,68,0.15)' : 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => { setLowStockOnly(e.target.checked); setPage(1); }}
              style={{ accentColor: '#ef4444' }}
            />
            <span style={{ color: lowStockOnly ? '#f87171' : 'inherit', fontWeight: lowStockOnly ? 600 : 400 }}>
              Low Stock Only
            </span>
          </label>

          {(search || categoryFilter || lowStockOnly) && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setSearch(''); setCategoryFilter(''); setLowStockOnly(false); setPage(1); }}
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Table / Content */}
      <div className="card">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <Spinner size="lg" />
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            title="No products found"
            description={search || categoryFilter || lowStockOnly ? "Try adjusting your filters" : "Start by adding your first product SKU"}
            action={canEdit && !search && !categoryFilter && !lowStockOnly ? (
              <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
                <Plus size={14} /> Add Product
              </button>
            ) : undefined}
          />
        ) : (
          <>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product & SKU</th>
                    <th>Category</th>
                    <th>Unit Price</th>
                    <th>Stock Level</th>
                    <th>Min Alert</th>
                    <th>Warehouse Loc.</th>
                    {canEdit && <th style={{ textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const isLow = p.stock <= p.minStockAlert;
                    return (
                      <tr key={p.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div
                              style={{
                                width: 38,
                                height: 38,
                                borderRadius: 6,
                                overflow: 'hidden',
                                background: 'var(--bg-elevated)',
                                border: '1px solid var(--border-default)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              {p.imageUrl ? (
                                <img
                                  src={p.imageUrl}
                                  alt={p.name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e) => {
                                    (e.currentTarget as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <ImageIcon size={18} style={{ color: 'var(--text-muted)' }} />
                              )}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                              <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-accent)' }}>
                                {p.sku}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-block',
                            background: 'var(--bg-elevated)',
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: '0.8rem',
                            border: '1px solid var(--border-default)'
                          }}>
                            {p.category}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          ₹{Number(p.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                              fontWeight: 700,
                              fontSize: '0.95rem',
                              color: isLow ? '#f87171' : '#34d399',
                            }}>
                              {p.stock}
                            </span>
                            {isLow && (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                                background: 'rgba(239, 68, 68, 0.15)',
                                color: '#f87171',
                                fontSize: '0.7rem',
                                padding: '2px 6px',
                                borderRadius: 4,
                                fontWeight: 600,
                              }}>
                                <AlertTriangle size={11} /> LOW
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {p.minStockAlert} units
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            <MapPin size={13} color="var(--text-muted)" />
                            {p.warehouseLocation || '—'}
                          </div>
                        </td>
                        {canEdit && (
                          <td style={{ textAlign: 'right' }}>
                            <button
                              className="btn btn-ghost btn-sm btn-icon"
                              title="Edit Product"
                              onClick={() => openEditModal(p)}
                            >
                              <Edit size={15} />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={limit}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingProduct ? 'Edit Product' : 'Add New Product SKU'}</h2>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* S3 Product Image Upload Section */}
                <div>
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Product Image (Amazon S3)</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Optional · Max 5 MB</span>
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: 12,
                      border: '1px dashed var(--border-default)',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-elevated)',
                    }}
                  >
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 6,
                        overflow: 'hidden',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-default)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Product Preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <ImageIcon size={22} style={{ color: 'var(--text-muted)' }} />
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <label
                          className="btn btn-secondary btn-sm"
                          style={{ cursor: 'pointer', margin: 0, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        >
                          <UploadCloud size={14} />
                          {previewUrl ? 'Change Image' : 'Select Image'}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                          />
                        </label>

                        {(previewUrl || selectedFile) && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={handleDeleteImage}
                            disabled={deletingImage}
                            style={{ color: '#ef4444' }}
                          >
                            {deletingImage ? <Spinner size="sm" /> : <Trash2 size={14} />}
                            Remove
                          </button>
                        )}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 5 }}>
                        Formats: JPEG, PNG, WebP, GIF. Private bucket storage with controlled access.
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="form-label">Product Name *</label>
                  <input
                    type="text"
                    required
                    className="input"
                    placeholder="e.g. Copper Wire Spool 50m"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="form-label">SKU (Unique Code) *</label>
                    <input
                      type="text"
                      required
                      disabled={!!editingProduct}
                      className="input"
                      placeholder="e.g. ELEC-CW-050"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                      style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}
                    />
                    {editingProduct && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SKU cannot be changed</span>
                    )}
                  </div>
                  <div>
                    <label className="form-label">Category *</label>
                    <input
                      type="text"
                      required
                      className="input"
                      placeholder="e.g. Electrical, Hardware"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="form-label">Unit Price (₹) *</label>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      className="input"
                      value={formData.unitPrice}
                      onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Min Stock Alert Level *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      className="input"
                      value={formData.minStockAlert}
                      onChange={(e) => setFormData({ ...formData, minStockAlert: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {!editingProduct && (
                    <div>
                      <label className="form-label">Initial Opening Stock *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        className="input"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  )}
                  <div style={{ gridColumn: editingProduct ? '1 / -1' : undefined }}>
                    <label className="form-label">Warehouse Location / Shelf</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. Aisle 3, Rack B-2"
                      value={formData.warehouseLocation}
                      onChange={(e) => setFormData({ ...formData, warehouseLocation: e.target.value })}
                    />
                  </div>
                </div>

                {editingProduct && (
                  <div style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)'
                  }}>
                    💡 Current on-hand stock: <strong style={{ color: 'var(--text-primary)' }}>{formData.stock} units</strong>. To adjust or receive more stock, record an IN movement under the <strong>Inventory</strong> tab.
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <Spinner size="sm" /> : editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
