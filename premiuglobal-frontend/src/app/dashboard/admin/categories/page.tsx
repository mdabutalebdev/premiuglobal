"use client";

import React, { useState, useEffect } from 'react';
import {
    FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiSave, FiGrid, FiImage, FiSmile,
    FiArrowUp, FiArrowDown,
} from 'react-icons/fi';
import {
    useGetCategoriesQuery,
    useDeleteCategoryMutation,
    useCreateCategoryMutation,
    useUpdateCategoryMutation,
} from '@/redux/api/categoryApi';
import { SingleImageUploader } from '@/components/ui/ImageUploader';
import { toast } from 'react-hot-toast';

/* ─── Styles ─── */
const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: '7px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' };
const lbl: React.CSSProperties = { fontSize: '12px', fontWeight: 600, color: '#555', display: 'block', marginBottom: '5px' };
const iconBtn: React.CSSProperties = {
    width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', color: '#888',
};

/* Compact on/off badge for the storefront visibility flags, so an admin can see
   and change where a category appears without opening the edit modal. */
function FlagPill({ label, on, title, onClick }: { label: string; on: boolean; title: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            title={title}
            style={{
                padding: '3px 9px', borderRadius: '999px', cursor: 'pointer',
                fontSize: '10px', fontWeight: 700, letterSpacing: '0.2px',
                border: `1px solid ${on ? 'var(--color-primary)' : '#e5e7eb'}`,
                background: on ? 'var(--color-primary-lightest, #f0fdf4)' : '#fafafa',
                color: on ? 'var(--color-primary)' : '#aaa',
                textDecoration: on ? 'none' : 'line-through',
            }}
        >
            {label}
        </button>
    );
}

/* ─── Default Icon Library (searchable) ─── */
const ICON_OPTIONS = [
    // Fashion & apparel
    { emoji: '👗', label: 'Fashion' }, { emoji: '👔', label: 'Men Clothing' }, { emoji: '👚', label: 'Women Clothing' },
    { emoji: '👕', label: 'T-Shirt' }, { emoji: '👖', label: 'Jeans' }, { emoji: '🧥', label: 'Jacket' },
    { emoji: '🧦', label: 'Socks' }, { emoji: '🧣', label: 'Scarf' }, { emoji: '🧤', label: 'Gloves' },
    { emoji: '👟', label: 'Shoes' }, { emoji: '👠', label: 'Heels' }, { emoji: '👜', label: 'Bags' },
    { emoji: '🎒', label: 'Backpack' }, { emoji: '👓', label: 'Glasses' }, { emoji: '🕶️', label: 'Sunglasses' },
    { emoji: '⌚', label: 'Watch' }, { emoji: '💍', label: 'Ring' }, { emoji: '💎', label: 'Jewelry' },
    { emoji: '👑', label: 'Premium' }, { emoji: '🧢', label: 'Cap' },
    // Electronics & tech
    { emoji: '📱', label: 'Mobile' }, { emoji: '💻', label: 'Laptop' }, { emoji: '🖥️', label: 'Computer' },
    { emoji: '⌨️', label: 'Keyboard' }, { emoji: '🖱️', label: 'Mouse' }, { emoji: '🎧', label: 'Headphones' },
    { emoji: '📷', label: 'Camera' }, { emoji: '📺', label: 'TV' }, { emoji: '🔌', label: 'Electrical' },
    { emoji: '⚡', label: 'Power' }, { emoji: '🔋', label: 'Battery' }, { emoji: '💡', label: 'Lighting' },
    { emoji: '🎮', label: 'Gaming' }, { emoji: '🖨️', label: 'Printer' },
    // Home & living
    { emoji: '🏠', label: 'Home' }, { emoji: '🛋️', label: 'Furniture' }, { emoji: '🛏️', label: 'Bedroom' },
    { emoji: '🪑', label: 'Chair' }, { emoji: '🚪', label: 'Doors' }, { emoji: '🧹', label: 'Cleaning' },
    { emoji: '🧺', label: 'Laundry' }, { emoji: '🍽️', label: 'Kitchenware' }, { emoji: '🛁', label: 'Bath' },
    { emoji: '🪟', label: 'Decor' }, { emoji: '🕯️', label: 'Candles' },
    // Industry & tools
    { emoji: '🔧', label: 'Industrial' }, { emoji: '🔨', label: 'Tools' }, { emoji: '🪛', label: 'Hardware' },
    { emoji: '⚙️', label: 'Machinery' }, { emoji: '🏭', label: 'Manufacturing' }, { emoji: '🏗️', label: 'Construction' },
    { emoji: '🧱', label: 'Building' }, { emoji: '🪚', label: 'Carpentry' }, { emoji: '⛏️', label: 'Mining' },
    // Automotive & transport
    { emoji: '🚗', label: 'Automotive' }, { emoji: '🏍️', label: 'Motorbike' }, { emoji: '🚲', label: 'Bicycle' },
    { emoji: '🚚', label: 'Transport' }, { emoji: '✈️', label: 'Aviation' }, { emoji: '🛞', label: 'Tyres' },
    // Beauty & health
    { emoji: '💄', label: 'Beauty' }, { emoji: '💅', label: 'Cosmetics' }, { emoji: '🧴', label: 'Skincare' },
    { emoji: '🧼', label: 'Hygiene' }, { emoji: '💊', label: 'Healthcare' }, { emoji: '🩺', label: 'Medical' },
    { emoji: '🦷', label: 'Dental' }, { emoji: '🧬', label: 'Wellness' },
    // Kids, sports & leisure
    { emoji: '👶', label: 'Kids & Baby' }, { emoji: '🧸', label: 'Toys' }, { emoji: '⚽', label: 'Sports' },
    { emoji: '🏏', label: 'Cricket' }, { emoji: '🏀', label: 'Basketball' }, { emoji: '🏋️', label: 'Fitness' },
    { emoji: '🎨', label: 'Art & Craft' }, { emoji: '🎵', label: 'Music' }, { emoji: '📚', label: 'Books' },
    { emoji: '✏️', label: 'Stationery' },
    // Food & agriculture
    { emoji: '🍎', label: 'Food' }, { emoji: '🥦', label: 'Vegetables' }, { emoji: '🍚', label: 'Grocery' },
    { emoji: '🥛', label: 'Dairy' }, { emoji: '☕', label: 'Beverages' }, { emoji: '🌾', label: 'Agriculture' },
    { emoji: '🌱', label: 'Plants' }, { emoji: '🐄', label: 'Livestock' }, { emoji: '🐟', label: 'Seafood' },
    // General / commerce
    { emoji: '🎁', label: 'Gifts' }, { emoji: '📦', label: 'Wholesale' }, { emoji: '🛒', label: 'Shopping' },
    { emoji: '🏷️', label: 'Offers' }, { emoji: '🌍', label: 'Global' }, { emoji: '💼', label: 'Office' },
    { emoji: '🔒', label: 'Security' }, { emoji: '🐾', label: 'Pets' },
];

const CategoriesPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const { data: categoriesData, isLoading, refetch } = useGetCategoriesQuery({});
    const [deleteCategory] = useDeleteCategoryMutation();
    const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
    const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();

    /* ─── Modal State ─── */
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ name: '', icon: '', image: '', description: '', parent: '', isActive: true, showInMenu: true, showInHome: true });
    const [iconMode, setIconMode] = useState<'emoji' | 'image'>('emoji');
    const [emojiSearch, setEmojiSearch] = useState('');

    const categories = categoriesData?.data || [];
    const isSaving = isCreating || isUpdating;

    // Top-level categories (no parent) — eligible to be a parent of a subcategory
    const parentOptions = categories.filter((c: any) => !c.parent);
    const parentId = (cat: any) => (cat.parent?._id || cat.parent || '');

    const openCreate = (presetParent = '') => {
        setEditingId(null);
        setForm({ name: '', icon: '', image: '', description: '', parent: presetParent, isActive: true, showInMenu: true, showInHome: true });
        setIconMode('emoji');
        setEmojiSearch('');
        setModalOpen(true);
    };

    const openEdit = (cat: any) => {
        setEditingId(cat._id);
        setForm({
            name: cat.name || '',
            icon: cat.icon || '',
            image: cat.image || '',
            description: cat.description || '',
            parent: parentId(cat),
            isActive: cat.isActive !== false,
            showInMenu: cat.showInMenu !== false,
            showInHome: cat.showInHome !== false,
        });
        setIconMode(cat.image ? 'image' : 'emoji');
        setEmojiSearch('');
        setModalOpen(true);
    };

    const closeModal = () => { setModalOpen(false); setEditingId(null); };

    const handleSave = async () => {
        if (!form.name.trim()) { toast.error('Category name is required'); return; }
        if (!form.icon && !form.image) { toast.error('Please pick an emoji icon or upload an icon image'); return; }
        try {
            const payload = { ...form, parent: form.parent || null };
            if (editingId) {
                await updateCategory({ id: editingId, data: payload }).unwrap();
                toast.success('Category updated');
            } else {
                await createCategory(payload).unwrap();
                toast.success('Category created');
            }
            closeModal();
        } catch (error: any) {
            toast.error(error?.data?.message || 'Something went wrong');
        }
    };

    /* One-click flip of the two visibility flags straight from the list.
       `=== false` gives the flipped value and treats a missing flag as "on". */
    const toggleFlag = async (cat: any, key: 'showInMenu' | 'showInHome') => {
        try {
            await updateCategory({ id: cat._id, data: { [key]: cat[key] === false } }).unwrap();
        } catch (error: any) {
            toast.error(error?.data?.message || 'Failed to update');
        }
    };

    /* Reorder within the same parent. The whole sibling row is rewritten with
       sequential `order` values — swapping two values would be a no-op while
       every category still sits at the default order of 0. */
    const moveCategory = async (cat: any, dir: -1 | 1) => {
        const siblings = categories.filter((c: any) => parentId(c) === parentId(cat));
        const from = siblings.findIndex((c: any) => c._id === cat._id);
        const to = from + dir;
        if (from < 0 || to < 0 || to >= siblings.length) return;
        const next = [...siblings];
        [next[from], next[to]] = [next[to], next[from]];
        try {
            await Promise.all(
                next.map((c: any, idx: number) => updateCategory({ id: c._id, data: { order: idx } }).unwrap())
            );
        } catch (error: any) {
            toast.error(error?.data?.message || 'Failed to reorder');
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            try {
                await deleteCategory(id).unwrap();
                toast.success('Category deleted');
            } catch (error: any) {
                toast.error(error?.data?.message || 'Failed to delete');
            }
        }
    };

    // Build an ordered, hierarchy-aware row list: each parent followed by its subcategories.
    // While searching, fall back to a flat name-filtered list.
    const childrenOf = (id: string) => categories.filter((c: any) => parentId(c) === id);
    const rows: { cat: any; isChild: boolean }[] = (() => {
        if (searchTerm.trim()) {
            return categories
                .filter((c: any) => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((c: any) => ({ cat: c, isChild: !!parentId(c) }));
        }
        const out: { cat: any; isChild: boolean }[] = [];
        parentOptions.forEach((p: any) => {
            out.push({ cat: p, isChild: false });
            childrenOf(p._id).forEach((c: any) => out.push({ cat: c, isChild: true }));
        });
        // Include any orphaned subcategories whose parent is missing/inactive
        categories.forEach((c: any) => {
            if (parentId(c) && !out.some((r) => r.cat._id === c._id)) {
                out.push({ cat: c, isChild: true });
            }
        });
        return out;
    })();

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#111', margin: 0 }}>Categories</h1>
                    <p style={{ fontSize: '12px', color: '#888', margin: '2px 0 0' }}>Manage product categories</p>
                </div>
                <button onClick={() => openCreate()} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', background: 'var(--color-primary)', color: '#fff',
                    border: 'none', borderRadius: '7px', fontSize: '12.5px', fontWeight: 700,
                    cursor: 'pointer',
                }}>
                    <FiPlus size={14} /> Add Category
                </button>
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: '14px' }}>
                <FiSearch size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#bbb' }} />
                <input
                    type="text"
                    placeholder="Search categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ ...inp, paddingLeft: '34px' }}
                />
            </div>

            {/* Categories List */}
            <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '10px', overflow: 'hidden' }}>
                {isLoading ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                        <div style={{ width: '28px', height: '28px', border: '3px solid #e5e7eb', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
                    </div>
                ) : rows.length > 0 ? (
                    <div>
                        {rows.map(({ cat, isChild }, i: number) => (
                            <div key={cat._id} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '12px 16px',
                                paddingLeft: isChild ? '40px' : '16px',
                                background: isChild ? '#fcfcfc' : '#fff',
                                borderBottom: i < rows.length - 1 ? '1px solid #f5f5f5' : 'none',
                                transition: 'background 0.15s',
                            }}
                                onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                                onMouseLeave={e => e.currentTarget.style.background = isChild ? '#fcfcfc' : '#fff'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {isChild && <span style={{ color: '#cbd5e1', fontSize: '15px', marginLeft: '-14px', marginRight: '-2px' }}>↳</span>}
                                    <div style={{
                                        width: isChild ? '30px' : '36px', height: isChild ? '30px' : '36px', borderRadius: '8px',
                                        background: '#f5f5f5', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', flexShrink: 0, fontSize: isChild ? '15px' : '18px',
                                        overflow: 'hidden',
                                    }}>
                                        {cat.image
                                            ? <img src={cat.image} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : cat.icon || <FiGrid size={16} color="#bbb" />}
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '13px', fontWeight: 700, color: '#111', margin: 0 }}>
                                            {cat.name}
                                            {!isChild && childrenOf(cat._id).length > 0 && (
                                                <span style={{ fontSize: '10px', fontWeight: 600, color: '#888', marginLeft: '6px' }}>
                                                    ({childrenOf(cat._id).length} sub)
                                                </span>
                                            )}
                                        </p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                                            <span style={{ fontSize: '10.5px', color: '#aaa', fontFamily: 'monospace' }}>{cat.slug}</span>
                                            {isChild && cat.parent?.name && (
                                                <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '999px', background: '#eff6ff', color: '#2563eb' }}>
                                                    Sub of {cat.parent.name}
                                                </span>
                                            )}
                                            <span style={{
                                                fontSize: '9px', fontWeight: 700,
                                                padding: '1px 6px', borderRadius: '999px',
                                                background: cat.isActive ? 'var(--color-primary-lightest)' : '#fef2f2',
                                                color: cat.isActive ? '#16a34a' : '#dc2626',
                                            }}>
                                                {cat.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                            <span style={{ fontSize: '10px', color: '#ccc' }}>{cat.productCount || 0} products</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {/* Where this category shows up on the storefront — click to flip */}
                                    <FlagPill
                                        label="Menu"
                                        on={cat.showInMenu !== false}
                                        title={cat.showInMenu !== false ? 'Showing in the header menu — click to hide' : 'Hidden from the header menu — click to show'}
                                        onClick={() => toggleFlag(cat, 'showInMenu')}
                                    />
                                    {!isChild && (
                                        <FlagPill
                                            label="Home"
                                            on={cat.showInHome !== false}
                                            title={cat.showInHome !== false ? 'Showing in the Featured Categories section — click to hide' : 'Hidden from the Featured Categories section — click to show'}
                                            onClick={() => toggleFlag(cat, 'showInHome')}
                                        />
                                    )}

                                    {/* Ordering only makes sense in the hierarchy view, not in search results */}
                                    {!searchTerm.trim() && (
                                        <div style={{ display: 'flex', gap: '2px', marginLeft: '4px' }}>
                                            <button onClick={() => moveCategory(cat, -1)} title="Move up" style={iconBtn}><FiArrowUp size={12} /></button>
                                            <button onClick={() => moveCategory(cat, 1)} title="Move down" style={iconBtn}><FiArrowDown size={12} /></button>
                                        </div>
                                    )}
                                    {!isChild && (
                                        <button onClick={() => openCreate(cat._id)} title="Add subcategory" style={{
                                            height: '30px', display: 'flex', alignItems: 'center', gap: '4px', padding: '0 9px',
                                            background: 'transparent', border: '1px solid #e5e7eb', borderRadius: '6px',
                                            cursor: 'pointer', color: 'var(--color-primary)', fontSize: '11px', fontWeight: 700, transition: 'all 0.15s',
                                        }}
                                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-primary-lightest)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                        >
                                            <FiPlus size={12} /> Sub
                                        </button>
                                    )}
                                    <button onClick={() => openEdit(cat)} style={{
                                        width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: 'transparent', border: '1px solid transparent', borderRadius: '6px',
                                        cursor: 'pointer', color: 'var(--color-primary)', transition: 'all 0.15s',
                                    }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-primary-lightest)'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
                                    >
                                        <FiEdit2 size={14} />
                                    </button>
                                    <button onClick={() => handleDelete(cat._id)} style={{
                                        width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: 'transparent', border: '1px solid transparent', borderRadius: '6px',
                                        cursor: 'pointer', color: '#dc2626', transition: 'all 0.15s',
                                    }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
                                    >
                                        <FiTrash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                        <FiGrid size={28} color="#ddd" style={{ margin: '0 auto 10px' }} />
                        <p style={{ fontSize: '13px', color: '#aaa', margin: '0 0 12px' }}>No categories found</p>
                        <button onClick={() => openCreate()} style={{
                            padding: '7px 16px', background: 'var(--color-primary)', color: '#fff',
                            border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                        }}>
                            <FiPlus size={12} style={{ marginRight: '4px', verticalAlign: '-2px' }} /> Create Category
                        </button>
                    </div>
                )}
            </div>

            {/* ═══ POPUP MODAL ═══ */}
            {modalOpen && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    {/* Backdrop */}
                    <div onClick={closeModal} style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
                    }} />

                    {/* Modal */}
                    <div style={{
                        position: 'relative', background: '#fff',
                        borderRadius: '12px', width: '500px', maxWidth: '95vw',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                        animation: 'fadeIn 0.2s ease-out',
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '16px 20px', borderBottom: '1px solid #f0f0f0',
                        }}>
                            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#111', margin: 0 }}>
                                {editingId ? 'Edit Category' : form.parent ? 'Add Subcategory' : 'Add Category'}
                            </h3>
                            <button onClick={closeModal} style={{
                                width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: '#f5f5f5', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#888',
                            }}>
                                <FiX size={14} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '70vh', overflowY: 'auto' }}>
                            {/* Name */}
                            <div>
                                <label style={lbl}>Category Name <span style={{ color: '#ef4444' }}>*</span></label>
                                <input
                                    type="text"
                                    placeholder="e.g. Electronics, Fashion"
                                    value={form.name}
                                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                    style={inp}
                                    autoFocus
                                />
                            </div>

                            {/* Parent Category (makes this a subcategory) */}
                            <div>
                                <label style={lbl}>Parent Category <span style={{ color: '#aaa', fontWeight: 400 }}>(optional — leave as "None" for a main category)</span></label>
                                <select
                                    value={form.parent}
                                    onChange={e => setForm(p => ({ ...p, parent: e.target.value }))}
                                    style={inp}
                                >
                                    <option value="">— None (Main Category) —</option>
                                    {parentOptions
                                        .filter((p: any) => p._id !== editingId)
                                        .map((p: any) => (
                                            <option key={p._id} value={p._id}>{p.icon ? `${p.icon} ` : ''}{p.name}</option>
                                        ))}
                                </select>
                                {form.parent && (
                                    <p style={{ fontSize: '11px', color: '#2563eb', margin: '5px 0 0', fontWeight: 500 }}>
                                        ↳ This will be a <b>subcategory</b> under "{parentOptions.find((p: any) => p._id === form.parent)?.name}"
                                    </p>
                                )}
                            </div>

                            {/* Icon / Image Picker */}
                            <div>
                                <label style={lbl}>Category Icon / Image <span style={{ color: '#ef4444' }}>*</span></label>

                                {/* Requirement note */}
                                <p style={{ fontSize: '11px', color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '7px', padding: '6px 10px', margin: '0 0 10px', fontWeight: 500 }}>
                                    📌 Pick an emoji icon, <b>or</b> upload an image. Uploaded images should be <b>square shape</b> (e.g. 128×128px).
                                </p>

                                {/* Mode toggle */}
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                    {([['emoji', 'Emoji Icon', <FiSmile key="s" size={14} />], ['image', 'Upload Image', <FiImage key="i" size={14} />]] as const).map(([mode, text, ic]) => (
                                        <button
                                            key={mode}
                                            type="button"
                                            onClick={() => setIconMode(mode)}
                                            style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                padding: '7px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                                                border: 'none',
                                                background: iconMode === mode ? 'var(--color-primary)' : '#f3f4f6',
                                                color: iconMode === mode ? '#fff' : '#555',
                                            }}
                                        >
                                            {ic} {text}
                                        </button>
                                    ))}
                                </div>

                                {/* Current selection preview */}
                                {(form.icon || form.image) && (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '12px',
                                        padding: '10px 14px', background: '#f8fffe',
                                        border: '1.5px solid var(--color-primary)', borderRadius: '8px', marginBottom: '12px',
                                    }}>
                                        {form.image ? (
                                            <img src={form.image} alt="icon" style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e5e7eb', background: '#fff' }} />
                                        ) : (
                                            <span style={{ fontSize: '34px', lineHeight: 1 }}>{form.icon}</span>
                                        )}
                                        <div>
                                            <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#111' }}>
                                                {form.image ? 'Uploaded image' : (ICON_OPTIONS.find(i => i.emoji === form.icon)?.label || 'Selected emoji')}
                                            </p>
                                            <p style={{ margin: 0, fontSize: '11px', color: '#888' }}>This is how the category will be shown</p>
                                        </div>
                                        <button
                                            onClick={() => setForm(p => ({ ...p, icon: '', image: '' }))}
                                            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: '16px', lineHeight: 1 }}
                                            title="Clear selection"
                                        >×</button>
                                    </div>
                                )}

                                {/* EMOJI MODE */}
                                {iconMode === 'emoji' && (
                                    <>
                                        <div style={{ position: 'relative', marginBottom: '8px' }}>
                                            <FiSearch size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#bbb' }} />
                                            <input
                                                type="text"
                                                placeholder="Search icons (e.g. mobile, food, tools)..."
                                                value={emojiSearch}
                                                onChange={e => setEmojiSearch(e.target.value)}
                                                style={{ ...inp, paddingLeft: '30px', fontSize: '12px' }}
                                            />
                                        </div>
                                        <div style={{
                                            display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px',
                                            padding: '12px', background: '#fafafa',
                                            border: `1.5px solid ${(!form.icon && !form.image) ? '#fca5a5' : '#e5e7eb'}`,
                                            borderRadius: '8px', maxHeight: '220px', overflowY: 'auto',
                                        }}>
                                            {ICON_OPTIONS
                                                .filter(opt => !emojiSearch.trim() || opt.label.toLowerCase().includes(emojiSearch.toLowerCase()) || opt.emoji === emojiSearch.trim())
                                                .map((opt) => (
                                                    <button
                                                        key={opt.emoji}
                                                        type="button"
                                                        title={opt.label}
                                                        onClick={() => setForm(p => ({ ...p, icon: opt.emoji, image: '' }))}
                                                        style={{
                                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px',
                                                            padding: '8px 4px', borderRadius: '8px', cursor: 'pointer',
                                                            border: form.icon === opt.emoji ? '2px solid var(--color-primary)' : '2px solid transparent',
                                                            background: form.icon === opt.emoji ? 'var(--color-primary-lightest, #f0fdf4)' : '#fff',
                                                            transition: 'all 0.15s',
                                                            boxShadow: form.icon === opt.emoji ? '0 0 0 1px var(--color-primary)' : '0 1px 3px rgba(0,0,0,0.06)',
                                                        }}
                                                        onMouseEnter={e => { if (form.icon !== opt.emoji) (e.currentTarget as HTMLElement).style.background = '#f3f4f6'; }}
                                                        onMouseLeave={e => { if (form.icon !== opt.emoji) (e.currentTarget as HTMLElement).style.background = '#fff'; }}
                                                    >
                                                        <span style={{ fontSize: '22px', lineHeight: 1 }}>{opt.emoji}</span>
                                                        <span style={{ fontSize: '8.5px', color: '#888', fontWeight: 500, textAlign: 'center', lineHeight: 1.2 }}>{opt.label}</span>
                                                    </button>
                                                ))}
                                        </div>
                                    </>
                                )}

                                {/* IMAGE MODE */}
                                {iconMode === 'image' && (
                                    <SingleImageUploader
                                        label="Icon Image (Square)"
                                        value={form.image}
                                        onChange={(url) => setForm(p => ({ ...p, image: url, icon: url ? '' : p.icon }))}
                                        accept="image/*"
                                        hint="Any image format • Square shape (e.g. 128×128px) • max 10MB"
                                    />
                                )}

                                {!form.icon && !form.image && (
                                    <p style={{ fontSize: '11px', color: '#ef4444', margin: '6px 0 0' }}>
                                        ⚠ Please pick an emoji or upload a square image to continue
                                    </p>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <label style={lbl}>Description <span style={{ color: '#aaa', fontWeight: 400 }}>(optional)</span></label>
                                <textarea
                                    placeholder="Short description..."
                                    rows={2}
                                    value={form.description}
                                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                    style={{ ...inp, resize: 'vertical' }}
                                />
                            </div>

                            {/* Toggles */}
                            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {[
                                    { key: 'isActive', label: 'Active', hint: 'Off hides it from the whole storefront' },
                                    { key: 'showInMenu', label: 'Show in header menu', hint: form.parent ? 'Appears in the parent’s dropdown' : 'Appears in the green nav bar' },
                                    // The Featured Categories section only renders main categories.
                                    ...(form.parent ? [] : [{ key: 'showInHome', label: 'Show in Featured Categories', hint: 'The category row on the home page' }]),
                                ].map((toggle) => (
                                    <label key={toggle.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: '12px' }}>
                                        <span style={{ fontSize: '12.5px', color: '#555', fontWeight: 500 }}>
                                            {toggle.label}
                                            <span style={{ display: 'block', fontSize: '10.5px', color: '#aaa', fontWeight: 400 }}>{toggle.hint}</span>
                                        </span>
                                        <div
                                            onClick={() => setForm(p => ({ ...p, [toggle.key]: !(p as any)[toggle.key] }))}
                                            style={{
                                                position: 'relative', width: '36px', height: '20px',
                                                borderRadius: '999px', cursor: 'pointer',
                                                background: (form as any)[toggle.key] ? 'var(--color-primary)' : '#ddd',
                                                transition: 'background 0.2s',
                                            }}
                                        >
                                            <div style={{
                                                position: 'absolute', top: '3px',
                                                left: (form as any)[toggle.key] ? '19px' : '3px',
                                                width: '14px', height: '14px', borderRadius: '50%',
                                                background: '#fff', transition: 'left 0.2s',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                                            }} />
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div style={{
                            display: 'flex', gap: '8px', padding: '14px 20px',
                            borderTop: '1px solid #f0f0f0',
                        }}>
                            <button onClick={closeModal} style={{
                                flex: 1, padding: '9px', background: '#f5f5f5', color: '#666',
                                border: 'none', borderRadius: '7px', fontSize: '12.5px', fontWeight: 600,
                                cursor: 'pointer',
                            }}>
                                Cancel
                            </button>
                            <button onClick={handleSave} disabled={isSaving} style={{
                                flex: 1, padding: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                background: isSaving ? '#888' : 'var(--color-primary)', color: '#fff',
                                border: 'none', borderRadius: '7px', fontSize: '12.5px', fontWeight: 700,
                                cursor: isSaving ? 'not-allowed' : 'pointer',
                            }}>
                                <FiSave size={13} />
                                {isSaving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoriesPage;
