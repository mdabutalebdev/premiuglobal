"use client";

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false, loading: () => <div className="h-[300px] bg-gray-50 border border-gray-200 rounded-md animate-pulse" /> });
import 'react-quill-new/dist/quill.snow.css';
import Link from 'next/link';
import { SingleImageUploader, MultipleImageUploader } from '@/components/ui/ImageUploader';
import {
    FiArrowLeft, FiSave, FiImage, FiX, FiPlus, FiInfo,
    FiSettings, FiDollarSign, FiTag, FiShield, FiTruck,
    FiList, FiGlobe, FiTrash2, FiBox, FiCheckCircle,
    FiDroplet, FiFileText, FiPercent
} from 'react-icons/fi';
import {
    useCreateProductMutation,
    useUpdateProductMutation,
    useGetProductByIdQuery,
    useGetProductsQuery
} from '@/redux/api/productApi';
import { useGetCategoriesQuery } from '@/redux/api/categoryApi';
import { toast } from 'react-hot-toast';

// Shop sidebar "Product Flag" options — kept in sync with the backend enum
const PRODUCT_FLAGS = [
    { value: 'best-selling', label: 'Best Selling' },
    { value: 'new-arrival', label: 'New Arrival' },
    { value: 'featured', label: 'Featured' },
    { value: 'on-sale', label: 'On Sale' },
    { value: 'combo', label: 'Exclusive Combo Deals' },
];

// ── Toggle Switch Component ──────────────────────────────────
const Toggle = ({ label, name, checked, onChange, color = 'bg-emerald-500' }: any) => (
    <label className="flex items-center justify-between p-3.5 hover:bg-gray-50 rounded-md transition-all border border-gray-100 cursor-pointer group">
        <span className="text-sm font-semibold text-gray-600 group-hover:text-gray-900">{label}</span>
        <div className="relative">
            <input type="checkbox" name={name} className="sr-only" checked={checked} onChange={onChange} />
            <div className={`w-11 h-6 rounded-full transition-colors ${checked ? color : 'bg-gray-200'}`}></div>
            <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-all ${checked ? 'translate-x-5' : ''}`}></div>
        </div>
    </label>
);

// ── Input Component ──────────────────────────────────────────
const Input = ({ label, required, error, ...props }: any) => (
    <div className="space-y-1.5">
        <label className="text-sm font-semibold text-gray-700">{label} {required && <span className="text-red-400">*</span>}</label>
        <input className={`w-full px-4 py-2.5 bg-white border rounded-md outline-none focus:ring-1 transition-all text-sm ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-200 bg-red-50/30' : 'border-gray-200 focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/10'}`} {...props} />
        {error && <p className="text-xs text-red-500 font-medium flex items-center gap-1">⚠ {error}</p>}
    </div>
);

// ── Section Header Component ──────────────────────────────────
const SectionHeader = ({ icon, title, color = 'bg-blue-50 text-blue-600' }: any) => (
    <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
        <div className={`w-10 h-10 rounded-md flex items-center justify-center ${color}`}>{icon}</div>
        <h2 className="text-lg font-bold text-gray-800">{title}</h2>
    </div>
);

const ProductFormInner = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const productId = searchParams.get('id');
    const isEditing = !!productId;

    const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
    const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
    const { data: productToEdit, isLoading: isFetching } = useGetProductByIdQuery(productId, { skip: !isEditing });
    const { data: categoriesData } = useGetCategoriesQuery({});
    // Brands already in use — offered as autocomplete so admins don't create
    // near-duplicates ("Palermo" vs "palermo ") that would split the shop filter.
    const { data: brandFacetData } = useGetProductsQuery({ limit: 1 });
    const existingBrands: string[] = (brandFacetData?.meta?.brands || []).map((b: any) => b.name);

    const [formData, setFormData] = useState<any>({
        // Basic
        name: '', slug: '', sku: '',
        description: '',
        productType: 'simple',
        // Pricing
        price: 0, originalPrice: 0, discount: 0,
        // Media
        thumbnail: '', images: [],
        // Organization
        category: '', subcategory: '', country: '', brand: '', flags: [],
        // Stock
        stock: 0,
        // Status
        status: 'active', visibility: 'visible',
        // Visual variants
        colors: [], colorHex: [], sizes: [],
        variants: [],
        // Tags & AI
        tags: [], aiLabels: [],
    });

    // ── Validation Errors State ──
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Clear specific field error when user types
    const clearError = (field: string) => {
        if (errors[field]) {
            setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
        }
    };

    // Populate form if editing
    useEffect(() => {
        if (isEditing && productToEdit?.data) {
            const prod = productToEdit.data;
            setFormData({
                ...formData,
                ...prod,
                category: prod.category?._id || prod.category || '',
                subcategory: prod.subcategory?._id || prod.subcategory || '',
                tags: prod.tags || [],
                colors: prod.colors || [],
                colorHex: prod.colorHex || [],
                sizes: prod.sizes || [],
                variants: prod.variants || [],
                aiLabels: prod.aiLabels || [],
                brand: prod.brand || '',
                flags: prod.flags || [],
                productType: prod.productType || 'simple',
                images: prod.images || [],
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditing, productToEdit]);

    // Auto-calculate discount
    useEffect(() => {
        if (formData.originalPrice > 0 && formData.price > 0 && formData.originalPrice > formData.price) {
            const disc = Math.round(((formData.originalPrice - formData.price) / formData.originalPrice) * 100);
            setFormData((prev: any) => ({ ...prev, discount: disc }));
        }
    }, [formData.price, formData.originalPrice]);

    // Auto-generate slug
    useEffect(() => {
        if (!isEditing && formData.name) {
            const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            setFormData((prev: any) => ({ ...prev, slug }));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.name, isEditing]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        clearError(name);

        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData((prev: any) => ({
                ...prev,
                [parent]: { ...prev[parent], [child]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value) }
            }));
        } else {
            setFormData((prev: any) => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
            }));
        }
    };

    // Array field handlers (comma-separated)
    const handleArrayChange = (name: string, value: string) => {
        const arr = value.split(',').map(s => s.trim()).filter(s => s !== '');
        setFormData((prev: any) => ({ ...prev, [name]: arr }));
    };

    // Images (newline-separated)
    const handleImagesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const urls = e.target.value.split('\n').map(u => u.trim()).filter(u => u !== '');
        setFormData((prev: any) => ({ ...prev, images: urls }));
    };

    // ── Validation ──
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Required fields
        if (!formData.name || formData.name.trim().length === 0) {
            newErrors.name = 'Product name is required';
        } else if (formData.name.trim().length < 3) {
            newErrors.name = 'Product name must be at least 3 characters';
        } else if (formData.name.length > 200) {
            newErrors.name = 'Product name cannot exceed 200 characters';
        }

        if (!formData.description || formData.description.replace(/<[^>]*>/g, '').trim().length === 0) {
            newErrors.description = 'Product description is required';
        }

        if (!formData.category) {
            newErrors.category = 'Please select a category';
        }

        if (!formData.price || formData.price <= 0) {
            newErrors.price = 'Selling price must be greater than 0';
        }

        if (formData.originalPrice && formData.originalPrice > 0 && formData.originalPrice < formData.price) {
            newErrors.originalPrice = 'Original price should be higher than selling price';
        }

        if (!formData.thumbnail || formData.thumbnail.trim().length === 0) {
            newErrors.thumbnail = 'Product thumbnail image is required';
        }

        if (formData.stock < 0) {
            newErrors.stock = 'Stock cannot be negative';
        }

        // Variant validation
        if (formData.productType !== 'simple' && formData.variants?.length > 0) {
            formData.variants.forEach((v: any, i: number) => {
                if (!v.price || v.price <= 0) {
                    newErrors[`variant_${i}_price`] = `Variant #${i + 1} (${v.color || ''} ${v.size || ''}) price is required`;
                }
                if (v.stock < 0) {
                    newErrors[`variant_${i}_stock`] = `Variant #${i + 1} stock cannot be negative`;
                }
            });
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            // Scroll to first error
            const firstErrorField = Object.keys(newErrors)[0];
            const el = document.querySelector(`[name="${firstErrorField}"], [data-field="${firstErrorField}"]`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please fix the errors below', {
                icon: '⚠️',
                style: { borderRadius: '8px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' },
            });
            return;
        }

        try {
            // Strip server-managed / virtual fields so PATCH never sends them back
            const {
                _id, __v, createdAt, updatedAt, discountedPrice, soldCount,
                rating, reviewCount, totalSold, viewCount, likeCount,
                commentCount, shareCount, wishlistCount, isDeleted,
                ...clean
            } = formData;
            const payload: any = { ...clean };
            if (!payload.subcategory) delete payload.subcategory;
            // Strip subdocument _id from variants (let Mongoose manage them)
            if (Array.isArray(payload.variants)) {
                payload.variants = payload.variants.map(({ _id, discount, ...v }: any) => v);
            }

            if (isEditing) {
                await updateProduct({ id: productId, data: payload }).unwrap();
                toast.success('Product updated successfully! ✅');
            } else {
                await createProduct(payload).unwrap();
                toast.success('Product created successfully! ✅');
            }
            router.push('/dashboard/admin/products');
        } catch (error: any) {
            // Map server-side validation errors back to their specific fields
            const serverErrs = error?.data?.errorMessages;
            if (Array.isArray(serverErrs) && serverErrs.length > 0) {
                const mapped: Record<string, string> = {};
                serverErrs.forEach((er: any) => { if (er?.path) mapped[er.path] = er.message; });
                if (Object.keys(mapped).length > 0) {
                    setErrors(prev => ({ ...prev, ...mapped }));
                    const firstField = Object.keys(mapped)[0];
                    document.querySelector(`[name="${firstField}"], [data-field="${firstField}"]`)
                        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
            toast.error(error?.data?.message || 'Something went wrong');
        }
    };

    if (isEditing && isFetching) return <div className="p-20 text-center text-[var(--color-text-primary)] font-bold animate-pulse">Loading product data...</div>;

    const categories = categoriesData?.data || [];
    // Top-level categories for the main dropdown; subcategories filtered by the chosen parent
    const topCategories = categories.filter((c: any) => !c.parent);
    const subCategories = categories.filter((c: any) => (c.parent?._id || c.parent) === formData.category);

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-32">
            {/* ══ ACTION BAR ═══════════════════════════════════════════ */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-md border border-gray-200 shadow-sm sticky top-0 z-40">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/admin/products" className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-md border border-gray-200 hover:bg-gray-100 text-gray-400 transition-all hover:text-gray-600">
                        <FiArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">{isEditing ? 'Edit Product' : 'Create New Product'}</h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className={`w-2 h-2 rounded-full ${formData.status === 'active' ? 'bg-green-500' : formData.status === 'draft' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                            <p className="text-xs text-gray-500 capitalize">{formData.status}</p>
                            {formData.discount > 0 && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">{formData.discount}% OFF</span>}
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <button onClick={() => router.push('/dashboard/admin/products')} className="flex-1 sm:flex-none px-6 py-2.5 border border-gray-200 rounded-md font-semibold text-gray-600 hover:bg-gray-50 transition-all text-sm">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} disabled={isCreating || isUpdating} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-2.5 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-md font-semibold hover:bg-[var(--color-primary-dark)] transition-all shadow-md disabled:opacity-50 text-sm">
                        <FiSave size={18} />
                        {isCreating || isUpdating ? 'Saving...' : (isEditing ? 'Update Product' : 'Publish Product')}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* ══ LEFT COLUMN (8 cols) ════════════════════════════ */}
                <div className="lg:col-span-8 space-y-6">

                    {/* ── Error Summary Banner ── */}
                    {Object.keys(errors).length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-4 space-y-2">
                            <p className="text-sm font-bold text-red-700 flex items-center gap-2">⚠ Please fix the following {Object.keys(errors).length} error(s):</p>
                            <ul className="list-disc list-inside space-y-1">
                                {Object.entries(errors).map(([key, msg]) => (
                                    <li key={key} className="text-xs text-red-600">{msg}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* ── 1. Basic Information ──────────────────────── */}
                    <div className="bg-white p-6 rounded-md border border-gray-200 shadow-sm space-y-5">
                        <SectionHeader icon={<FiInfo size={20} />} title="Basic Information" color="bg-blue-50 text-blue-600" />

                        <Input label="Product Name" name="name" required type="text" placeholder="e.g. 250L Piston Type Industrial Air Compressor" value={formData.name} onChange={handleChange} error={errors.name} />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Slug" name="slug" type="text" placeholder="auto-generated" value={formData.slug} onChange={handleChange} />
                            <Input label="SKU / Model" name="sku" type="text" placeholder="e.g. IND-1001" value={formData.sku} onChange={handleChange} />
                        </div>

                        <div className="space-y-1.5" data-field="description">
                            <label className="text-sm font-semibold text-gray-700">Product Description <span className="text-red-400">*</span></label>
                            <div className={`product-editor-wrapper ${errors.description ? 'ring-1 ring-red-400 rounded-md' : ''}`}>
                                <ReactQuill
                                    theme="snow"
                                    value={formData.description}
                                    onChange={(value: string) => { setFormData((prev: any) => ({ ...prev, description: value })); clearError('description'); }}
                                    placeholder="Write detailed product description..."
                                    modules={{
                                        toolbar: [
                                            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                                            [{ 'font': [] }],
                                            [{ 'size': ['small', false, 'large', 'huge'] }],
                                            ['bold', 'italic', 'underline', 'strike'],
                                            [{ 'color': [] }, { 'background': [] }],
                                            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                            [{ 'indent': '-1' }, { 'indent': '+1' }],
                                            [{ 'align': [] }],
                                            ['link', 'image', 'video'],
                                            ['blockquote', 'code-block'],
                                            ['clean'],
                                        ],
                                    }}
                                    style={{ minHeight: '300px' }}
                                />
                            </div>
                            {errors.description && <p className="text-xs text-red-500 font-medium">⚠ {errors.description}</p>}
                        </div>
                    </div>

                    {/* ── 2. Pricing & Inventory ────────────────────── */}
                    <div className="bg-white p-6 rounded-md border border-gray-200 shadow-sm space-y-5">
                        <SectionHeader icon={<FiDollarSign size={20} />} title="Pricing & Inventory" color="bg-green-50 text-green-600" />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5" data-field="price">
                                <label className="text-sm font-semibold text-gray-700">Selling Price <span className="text-red-400">*</span></label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">৳</span>
                                    <input type="number" name="price" placeholder="0" className={`w-full pl-8 pr-3 py-2.5 bg-white border rounded-md outline-none text-base font-bold ${errors.price ? 'border-red-400 bg-red-50/30' : 'border-gray-200 focus:border-[var(--color-primary)]'}`} value={formData.price} onChange={handleChange} />
                                </div>
                                {errors.price && <p className="text-xs text-red-500 font-medium">⚠ {errors.price}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Original Price</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">৳</span>
                                    <input type="number" name="originalPrice" placeholder="0" className="w-full pl-8 pr-3 py-2.5 bg-white border border-gray-200 rounded-md outline-none focus:border-[var(--color-primary)] text-base font-bold text-red-600" value={formData.originalPrice} onChange={handleChange} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1"><FiPercent size={14} /> Discount</label>
                                <input type="number" name="discount" placeholder="Auto" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-md outline-none text-base font-bold text-orange-600" value={formData.discount} readOnly />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input label="Current Stock" name="stock" type="number" placeholder="0" value={formData.stock} onChange={handleChange} />
                        </div>
                    </div>

                    {/* ── 3. Product Type & Variations ─ */}
                    <div className="bg-white p-6 rounded-md border border-gray-200 shadow-sm space-y-5">
                        <SectionHeader icon={<FiDroplet size={20} />} title="Product Type & Variations" color="bg-pink-50 text-pink-600" />

                        {/* ── Product Type Selector ── */}
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { value: 'simple', label: '🔲 Simple', desc: 'No color/size variant' },
                                { value: 'variable', label: '🔄 Variable', desc: 'Color + Size combos' },
                                { value: 'multi-color', label: '🎨 Multi Color', desc: 'Color only, no size' },
                            ].map((t) => (
                                <button key={t.value} type="button"
                                    onClick={() => setFormData((prev: any) => ({ ...prev, productType: t.value }))}
                                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                                        formData.productType === t.value
                                            ? 'border-[var(--color-primary)] bg-green-50 shadow-md'
                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                    }`}
                                >
                                    <p className="text-sm font-bold text-gray-800">{t.label}</p>
                                    <p className="text-[11px] text-gray-500 mt-0.5">{t.desc}</p>
                                </button>
                            ))}
                        </div>

                        {formData.productType === 'simple' && (
                            <p className="text-xs text-gray-400 bg-gray-50 p-3 rounded-md">✅ Simple product — নিচে কোন variant দেওয়ার দরকার নেই। Base price ও stock ব্যবহার হবে।</p>
                        )}

                        {formData.productType === 'multi-color' && (
                            <p className="text-xs text-blue-600 bg-blue-50 p-3 rounded-md font-medium">🎨 Multi-Color — শুধু কালার গুলো add করুন, প্রতিটা কালারের নাম ও hex দিন। সাইজ লাগবে না।</p>
                        )}

                        {formData.productType === 'variable' && (
                            <p className="text-xs text-gray-400 -mt-2">Color ও Size add করে <strong>Generate Variants</strong> ক্লিক করুন। প্রতিটার আলাদা price, stock, images দিতে পারবেন।</p>
                        )}

                        {/* ── Step 1: Colors (variable + multi-color) ── */}
                        {(formData.productType === 'variable' || formData.productType === 'multi-color') && (
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">🎨 Colors</label>
                            <div className="flex flex-wrap gap-2">
                                {formData.colors.map((c: string, i: number) => (
                                    <span key={i} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-semibold">
                                        <span className="w-5 h-5 rounded" style={{ background: formData.colorHex?.[i] || '#ccc', border: '1px solid #ddd' }} />
                                        {c}
                                        <button type="button" onClick={() => {
                                            setFormData((prev: any) => ({
                                                ...prev,
                                                colors: prev.colors.filter((_: any, j: number) => j !== i),
                                                colorHex: prev.colorHex.filter((_: any, j: number) => j !== i),
                                            }));
                                        }} className="text-red-400 hover:text-red-600 text-lg leading-none ml-1">×</button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2 items-center">
                                <input type="color" id="varColorHex" defaultValue="#000000" className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5 shrink-0" />
                                <input type="text" id="varColorName" placeholder="Color নাম (e.g. Sky Blue)" className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-md text-sm outline-none focus:border-[var(--color-primary)]"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const nameEl = document.getElementById('varColorName') as HTMLInputElement;
                                            const hexEl = document.getElementById('varColorHex') as HTMLInputElement;
                                            const name = nameEl.value.trim();
                                            if (!name) return;
                                            setFormData((prev: any) => ({
                                                ...prev,
                                                colors: [...prev.colors, name],
                                                colorHex: [...prev.colorHex, hexEl.value],
                                            }));
                                            nameEl.value = '';
                                        }
                                    }}
                                />
                                <button type="button" onClick={() => {
                                    const nameEl = document.getElementById('varColorName') as HTMLInputElement;
                                    const hexEl = document.getElementById('varColorHex') as HTMLInputElement;
                                    const name = nameEl.value.trim();
                                    if (!name) return;
                                    setFormData((prev: any) => ({
                                        ...prev,
                                        colors: [...prev.colors, name],
                                        colorHex: [...prev.colorHex, hexEl.value],
                                    }));
                                    nameEl.value = '';
                                }} className="px-4 py-2.5 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-md text-sm font-bold hover:bg-[var(--color-primary-dark)] shrink-0">+ Add</button>
                            </div>
                        </div>
                        )}

                        {/* ── Step 2: Sizes (variable only) ── */}
                        {formData.productType === 'variable' && (
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">📐 Sizes</label>
                            <div className="flex flex-wrap gap-2">
                                {formData.sizes.map((s: string, i: number) => (
                                    <span key={i} className="flex items-center gap-1.5 bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-bold">
                                        {s}
                                        <button type="button" onClick={() => {
                                            setFormData((prev: any) => ({ ...prev, sizes: prev.sizes.filter((_: any, j: number) => j !== i) }));
                                        }} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input type="text" id="varSizeName" placeholder="S, M, L, XL, XXL, Free Size..." className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-md text-sm outline-none focus:border-[var(--color-primary)]"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const el = document.getElementById('varSizeName') as HTMLInputElement;
                                            const val = el.value.trim();
                                            if (val && !formData.sizes.includes(val)) {
                                                setFormData((prev: any) => ({ ...prev, sizes: [...prev.sizes, val] }));
                                            }
                                            el.value = '';
                                        }
                                    }}
                                />
                                <button type="button" onClick={() => {
                                    const el = document.getElementById('varSizeName') as HTMLInputElement;
                                    const val = el.value.trim();
                                    if (val && !formData.sizes.includes(val)) {
                                        setFormData((prev: any) => ({ ...prev, sizes: [...prev.sizes, val] }));
                                    }
                                    el.value = '';
                                }} className="px-4 py-2.5 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-md text-sm font-bold hover:bg-[var(--color-primary-dark)] shrink-0">+ Add</button>
                            </div>
                        </div>
                        )}

                        {/* ── Step 3: Generate / Actions (variable only) ── */}
                        {formData.productType === 'variable' && (
                        <div className="flex gap-3 flex-wrap">
                            <button type="button" disabled={formData.colors.length === 0 && formData.sizes.length === 0} onClick={() => {
                                const existing = formData.variants || [];
                                const newVars: any[] = [];
                                const defPrice = formData.price || 0;
                                const defOrig = formData.originalPrice || 0;
                                if (formData.colors.length > 0 && formData.sizes.length > 0) {
                                    formData.colors.forEach((c: string, ci: number) => {
                                        formData.sizes.forEach((s: string) => {
                                            if (existing.some((v: any) => v.color === c && v.size === s)) return;
                                            newVars.push({ color: c, colorHex: formData.colorHex[ci] || '', size: s, description: formData.description || '', price: defPrice, originalPrice: defOrig, stock: 0, sku: '', images: [], note: '' });
                                        });
                                    });
                                } else if (formData.colors.length > 0) {
                                    formData.colors.forEach((c: string, ci: number) => {
                                        if (existing.some((v: any) => v.color === c && !v.size)) return;
                                        newVars.push({ color: c, colorHex: formData.colorHex[ci] || '', size: '', description: formData.description || '', price: defPrice, originalPrice: defOrig, stock: 0, sku: '', images: [], note: '' });
                                    });
                                } else if (formData.sizes.length > 0) {
                                    formData.sizes.forEach((s: string) => {
                                        if (existing.some((v: any) => v.size === s && !v.color)) return;
                                        newVars.push({ color: '', colorHex: '', size: s, description: formData.description || '', price: defPrice, originalPrice: defOrig, stock: 0, sku: '', images: [], note: '' });
                                    });
                                }
                                if (newVars.length > 0) setFormData((prev: any) => ({ ...prev, variants: [...(prev.variants || []), ...newVars] }));
                            }} className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-bold transition-all ${
                                (formData.colors.length === 0 && formData.sizes.length === 0) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-dark)] shadow-md'
                            }`}>
                                🔄 Generate Variants {formData.colors.length > 0 && formData.sizes.length > 0 && `(${formData.colors.length} × ${formData.sizes.length} = ${formData.colors.length * formData.sizes.length})`}
                            </button>
                            {(formData.variants?.length || 0) > 0 && (
                                <button type="button" onClick={() => { if (confirm('সব variant মুছে ফেলবেন?')) setFormData((prev: any) => ({ ...prev, variants: [] })); }} className="px-4 py-2.5 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm font-bold hover:bg-red-100">🗑 Clear All</button>
                            )}
                        </div>
                        )}

                        {/* ── Bulk Set ── */}
                        {(formData.variants?.length || 0) > 0 && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-3">
                                <p className="text-xs font-bold text-emerald-700">⚡ Bulk Set — সব variant এ একসাথে apply হবে</p>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase">Price (৳)</label>
                                        <input type="number" placeholder="All price" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm outline-none focus:border-emerald-400" min="0"
                                            onChange={e => { const v = Number(e.target.value); if (v > 0) setFormData((prev: any) => ({ ...prev, variants: prev.variants.map((vr: any) => ({ ...vr, price: v })) })); }} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase">MRP (৳)</label>
                                        <input type="number" placeholder="All MRP" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm outline-none focus:border-emerald-400" min="0"
                                            onChange={e => { const v = Number(e.target.value); if (v > 0) setFormData((prev: any) => ({ ...prev, variants: prev.variants.map((vr: any) => ({ ...vr, originalPrice: v })) })); }} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase">Stock</label>
                                        <input type="number" placeholder="All stock" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm outline-none focus:border-emerald-400" min="0"
                                            onChange={e => { const v = Number(e.target.value); if (v >= 0) setFormData((prev: any) => ({ ...prev, variants: prev.variants.map((vr: any) => ({ ...vr, stock: v })) })); }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Per-Color Images — upload once, auto-apply to all sizes ── */}
                        {(formData.variants?.length || 0) > 0 && formData.colors.length > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                                <p className="text-xs font-bold text-blue-700">📸 Per-Color Images — একবার upload করলে ওই কালারের সব size এ apply হবে</p>
                                {formData.colors.map((colorName: string, ci: number) => {
                                    // Get images from first variant of this color
                                    const firstVariantOfColor = (formData.variants || []).find((v: any) => v.color === colorName);
                                    const currentImages = firstVariantOfColor?.images || [];
                                    return (
                                        <div key={ci} className="bg-white rounded-lg p-3 border border-blue-100">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="w-5 h-5 rounded" style={{ background: formData.colorHex?.[ci] || '#ccc', border: '1px solid #ddd' }} />
                                                <span className="text-sm font-bold text-gray-700">{colorName}</span>
                                                <span className="text-[10px] text-gray-400">({(formData.variants || []).filter((v: any) => v.color === colorName).length} variants)</span>
                                            </div>
                                            <MultipleImageUploader
                                                label={`${colorName} Images`}
                                                values={currentImages}
                                                onChange={(urls: string[]) => {
                                                    // Apply images to ALL variants of this color
                                                    setFormData((prev: any) => ({
                                                        ...prev,
                                                        variants: prev.variants.map((vr: any) =>
                                                            vr.color === colorName ? { ...vr, images: urls } : vr
                                                        )
                                                    }));
                                                }}
                                                max={6}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* ── Variant Cards (price/stock only, no images) ── */}
                        {(formData.variants?.length || 0) > 0 && (
                            <p className="text-xs text-gray-400">{formData.variants.length} variant{formData.variants.length > 1 ? 's' : ''} — click করে price/stock edit করুন</p>
                        )}
                        {(formData.variants || []).map((v: any, i: number) => (
                            <details key={i} className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                                <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none hover:bg-gray-100 transition-all" style={{ listStyle: 'none' }}>
                                    {v.colorHex && <span className="w-5 h-5 rounded shrink-0 border border-gray-300" style={{ background: v.colorHex }} />}
                                    <span className="flex-1 text-sm font-semibold text-gray-800">{[v.color, v.size].filter(Boolean).join(' / ') || `Variant #${i + 1}`}</span>
                                    <span className="text-xs text-gray-400">৳{v.price || 0} • Stock: {v.stock || 0}{(v.images?.length || 0) > 0 ? ` • 📷${v.images.length}` : ''}</span>
                                    <button type="button" onClick={(e) => { e.preventDefault(); setFormData((prev: any) => ({ ...prev, variants: prev.variants.filter((_: any, j: number) => j !== i) })); }} className="px-2 py-1 bg-red-50 border border-red-200 text-red-500 rounded text-[10px] font-bold hover:bg-red-100">
                                        <FiTrash2 size={12} />
                                    </button>
                                </summary>
                                <div className="p-4 border-t border-gray-200 space-y-3">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase">Color</label>
                                            <input type="text" value={v.color || ''} readOnly className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-sm outline-none text-gray-500" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase">Size</label>
                                            <input type="text" value={v.size || ''} readOnly className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-sm outline-none text-gray-500" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase">Price (৳) *</label>
                                            <input type="number" value={v.price || 0} min="0" onChange={e => { const vars = [...formData.variants]; vars[i] = { ...vars[i], price: Number(e.target.value) }; setFormData((prev: any) => ({ ...prev, variants: vars })); }} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm outline-none focus:border-[var(--color-primary)] font-bold" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase">MRP (৳)</label>
                                            <input type="number" value={v.originalPrice || 0} min="0" onChange={e => { const vars = [...formData.variants]; vars[i] = { ...vars[i], originalPrice: Number(e.target.value) }; setFormData((prev: any) => ({ ...prev, variants: vars })); }} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm outline-none focus:border-[var(--color-primary)]" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase">Stock</label>
                                            <input type="number" value={v.stock || 0} min="0" onChange={e => { const vars = [...formData.variants]; vars[i] = { ...vars[i], stock: Number(e.target.value) }; setFormData((prev: any) => ({ ...prev, variants: vars })); }} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm outline-none focus:border-[var(--color-primary)]" />
                                        </div>
                                    </div>
                                    {v.originalPrice > 0 && v.price > 0 && v.originalPrice > v.price && (
                                        <p className="text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded inline-block">✅ Discount: {Math.round(((v.originalPrice - v.price) / v.originalPrice) * 100)}%</p>
                                    )}
                                    {/* ── Variant Description ── */}
                                    <div className="pt-3 border-t border-gray-100 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase">Description</label>
                                            <button type="button" onClick={() => { const vars = [...formData.variants]; vars[i] = { ...vars[i], description: formData.description || '' }; setFormData((prev: any) => ({ ...prev, variants: vars })); }} className="text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded">
                                                ↩ Use Main Description
                                            </button>
                                        </div>
                                        <div className="product-editor-wrapper">
                                            <ReactQuill
                                                theme="snow"
                                                value={v.description || ''}
                                                onChange={(val: string) => { const vars = [...formData.variants]; vars[i] = { ...vars[i], description: val }; setFormData((prev: any) => ({ ...prev, variants: vars })); }}
                                                placeholder="Variant-specific description..."
                                                modules={{
                                                    toolbar: [
                                                        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                                                        [{ 'font': [] }],
                                                        [{ 'size': ['small', false, 'large', 'huge'] }],
                                                        ['bold', 'italic', 'underline', 'strike'],
                                                        [{ 'color': [] }, { 'background': [] }],
                                                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                                        [{ 'indent': '-1' }, { 'indent': '+1' }],
                                                        [{ 'align': [] }],
                                                        ['link', 'image', 'video'],
                                                        ['blockquote', 'code-block'],
                                                        ['clean'],
                                                    ],
                                                }}
                                                style={{ minHeight: '200px' }}
                                            />
                                        </div>
                                        {v.description && v.description !== formData.description && (
                                            <p className="text-[10px] text-amber-600 font-medium">⚠ Custom description (different from main)</p>
                                        )}
                                    </div>
                                </div>
                            </details>
                        ))}

                    </div>


                </div>

                {/* ══ RIGHT COLUMN (4 cols) ════════════════════════ */}
                <div className="lg:col-span-4 space-y-6">

                    {/* ── Media Assets ──────────────────────────────── */}
                    <div className={`bg-white p-6 rounded-md border shadow-sm space-y-4 ${errors.thumbnail ? 'border-red-300 ring-1 ring-red-200' : 'border-gray-200'}`} data-field="thumbnail">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2"><FiImage className="text-blue-500" /> Media Assets</h3>
                        <SingleImageUploader
                            label="Product Thumbnail"
                            value={formData.thumbnail}
                            onChange={(url: string) => { setFormData((prev: any) => ({ ...prev, thumbnail: url })); clearError('thumbnail'); }}
                            required
                        />
                        {errors.thumbnail && <p className="text-xs text-red-500 font-medium">⚠ {errors.thumbnail}</p>}
                        <MultipleImageUploader
                            label="Gallery Images"
                            values={formData.images}
                            onChange={(urls: string[]) => setFormData((prev: any) => ({ ...prev, images: urls }))}
                            max={10}
                        />
                    </div>

                    {/* ── Category & Tags ───────────────────────────── */}
                    <div className="bg-white p-6 rounded-md border border-gray-200 shadow-sm space-y-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2"><FiTag className="text-indigo-500" /> Organization</h3>
                        <div className="space-y-1.5" data-field="category">
                            <label className="text-xs font-bold text-gray-400 uppercase">Category <span className="text-red-400">*</span></label>
                            <select
                                name="category"
                                required
                                className={`w-full px-4 py-2.5 bg-white border rounded-md text-sm font-semibold outline-none cursor-pointer ${errors.category ? 'border-red-400 bg-red-50/30' : 'border-gray-200 focus:border-indigo-400'}`}
                                value={formData.category}
                                onChange={(e) => { setFormData((prev: any) => ({ ...prev, category: e.target.value, subcategory: '' })); clearError('category'); }}
                            >
                                <option value="">Select Category</option>
                                {topCategories.map((cat: any) => (<option key={cat._id} value={cat._id}>{cat.icon ? `${cat.icon} ` : ''}{cat.name}</option>))}
                            </select>
                            {errors.category && <p className="text-xs text-red-500 font-medium">⚠ {errors.category}</p>}
                        </div>

                        {/* Subcategory — only shown when the chosen category has subcategories */}
                        {formData.category && subCategories.length > 0 && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-400 uppercase">Subcategory <span className="text-gray-300">(optional)</span></label>
                                <select
                                    name="subcategory"
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-md text-sm font-semibold outline-none cursor-pointer focus:border-indigo-400"
                                    value={formData.subcategory || ''}
                                    onChange={(e) => setFormData((prev: any) => ({ ...prev, subcategory: e.target.value }))}
                                >
                                    <option value="">— None —</option>
                                    {subCategories.map((sub: any) => (<option key={sub._id} value={sub._id}>{sub.icon ? `${sub.icon} ` : ''}{sub.name}</option>))}
                                </select>
                            </div>
                        )}
                        {/* Brand — feeds the shop sidebar "Brands" filter */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-400 uppercase">Brand <span className="text-gray-300">(shop filter)</span></label>
                            <input
                                type="text"
                                name="brand"
                                list="brand-suggestions"
                                placeholder="e.g. Palermo"
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-md text-sm outline-none focus:border-indigo-400"
                                value={formData.brand || ''}
                                onChange={handleChange}
                            />
                            <datalist id="brand-suggestions">
                                {existingBrands.map((b: string) => <option key={b} value={b} />)}
                            </datalist>
                        </div>

                        {/* Product flags — shop sidebar "Product Flag" filter + card badge */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase">Product Flag</label>
                            <div className="grid grid-cols-2 gap-1.5">
                                {PRODUCT_FLAGS.map(f => {
                                    const on = (formData.flags || []).includes(f.value);
                                    return (
                                        <button
                                            key={f.value}
                                            type="button"
                                            onClick={() => setFormData((prev: any) => ({
                                                ...prev,
                                                flags: on
                                                    ? (prev.flags || []).filter((x: string) => x !== f.value)
                                                    : [...(prev.flags || []), f.value],
                                            }))}
                                            className={`py-2 rounded-md text-[11px] font-bold uppercase transition-all ${on ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                        >
                                            {f.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase">Tags <span className="text-gray-300">(comma-separated)</span></label>
                            <input type="text" placeholder="e.g. air compressor, industrial, factory" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-md text-xs outline-none focus:border-indigo-400" value={formData.tags.join(', ')} onChange={(e) => handleArrayChange('tags', e.target.value)} />
                            {formData.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {formData.tags.slice(0, 8).map((t: string, i: number) => (
                                        <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold">{t}</span>
                                    ))}
                                    {formData.tags.length > 8 && <span className="text-[10px] text-gray-400">+{formData.tags.length - 8} more</span>}
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase">AI Labels <span className="text-gray-300">(for image search)</span></label>
                            <input type="text" placeholder="e.g. machinery, compressor" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-md text-xs outline-none focus:border-indigo-400" value={formData.aiLabels.join(', ')} onChange={(e) => handleArrayChange('aiLabels', e.target.value)} />
                        </div>
                    </div>

                    {/* ── Visibility & Promotion ────────────────────── */}
                    <div className="bg-white p-6 rounded-md border border-gray-200 shadow-sm space-y-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2"><FiSettings className="text-orange-500" /> Visibility & Status</h3>
                        <div className="pt-2">
                            <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Status</label>
                            <div className="grid grid-cols-3 gap-1.5">
                                {['active', 'draft', 'out-of-stock'].map(s => (
                                    <button key={s} type="button" onClick={() => setFormData((prev: any) => ({ ...prev, status: s }))}
                                        className={`py-2 rounded-md text-xs font-bold uppercase transition-all ${formData.status === s ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                                        {s === 'out-of-stock' ? 'Out' : s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

const ProductForm = () => (
    <Suspense fallback={<div className="p-20 text-center text-[var(--color-text-primary)] font-bold animate-pulse">Loading Product Form...</div>}>
        <ProductFormInner />
    </Suspense>
);

export default ProductForm;
