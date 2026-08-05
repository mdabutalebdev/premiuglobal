"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import {
    FiPlus, FiEdit2, FiTrash2, FiSearch, FiShoppingBag,
    FiBox, FiAlertTriangle, FiRefreshCw, FiStar,
} from 'react-icons/fi';
import { useGetProductsQuery, useDeleteProductMutation } from '@/redux/api/productApi';
import { toast } from 'react-hot-toast';
import {
    PageShell, PageHeader, Card, CardHeader, Btn, IconBtn, Badge, SearchInput,
    TableWrap, Th, Td, Tr, EmptyState, Spinner, StatTile, StatGrid, Pagination, T,
} from '@/components/admin/ui';

const PER_PAGE = 10;
const LOW_STOCK = 5;

const STATUS_COLOR: Record<string, string> = {
    active: '#10B981',
    draft: '#98A2B3',
    'out-of-stock': '#EF4444',
};

export default function AdminProductsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);

    const { data, isLoading, isFetching, refetch } = useGetProductsQuery({
        searchTerm: searchTerm || undefined,
        page,
        limit: PER_PAGE,
    });
    const [deleteProduct] = useDeleteProductMutation();

    const products = data?.data || [];
    const meta = data?.meta || {};
    const totalPages = meta.totalPages ?? meta.pages ?? 1;
    const total = meta.total ?? products.length;

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
        try {
            await deleteProduct(id).unwrap();
            toast.success('Product deleted');
        } catch (error: any) {
            toast.error(error?.data?.message || 'Failed to delete product');
        }
    };

    const money = (n: number) => `৳${(n || 0).toLocaleString()}`;

    // A variable product's stock is the sum of its variants
    const stockOf = (p: any) =>
        p.variants?.length ? p.variants.reduce((s: number, v: any) => s + (v.stock || 0), 0) : (p.stock || 0);

    const lowStock = products.filter((p: any) => stockOf(p) > 0 && stockOf(p) <= LOW_STOCK).length;
    const outOfStock = products.filter((p: any) => stockOf(p) === 0).length;
    const flagged = products.filter((p: any) => (p.flags || []).length > 0).length;

    return (
        <PageShell>
            <PageHeader
                title="Products"
                subtitle="Manage your catalogue, pricing and stock"
                actions={
                    <>
                        <Btn icon={<FiRefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />} onClick={() => refetch()}>
                            Refresh
                        </Btn>
                        <Link href="/dashboard/admin/products/new" style={{ textDecoration: 'none' }}>
                            <Btn variant="primary" icon={<FiPlus size={15} />}>Add Product</Btn>
                        </Link>
                    </>
                }
            />

            <StatGrid>
                <StatTile icon={FiShoppingBag} label="Total Products" value={total} color="#3B82F6" />
                <StatTile icon={FiBox} label="Low Stock" value={lowStock} color="#F59E0B" sub={`${LOW_STOCK} units or fewer`} />
                <StatTile icon={FiAlertTriangle} label="Out of Stock" value={outOfStock} color="#EF4444" />
                <StatTile icon={FiStar} label="Flagged" value={flagged} color="#8B5CF6" sub="Best selling, new arrival…" />
            </StatGrid>

            <Card padded={false}>
                <CardHeader
                    title="All Products"
                    subtitle={`${total} product${total === 1 ? '' : 's'} in the catalogue`}
                    actions={
                        <SearchInput
                            value={searchTerm}
                            onChange={(v) => { setSearchTerm(v); setPage(1); }}
                            placeholder="Search by name or SKU…"
                            icon={<FiSearch size={15} />}
                            width="300px"
                        />
                    }
                />

                {isLoading ? (
                    <Spinner />
                ) : products.length === 0 ? (
                    <EmptyState
                        icon={<FiShoppingBag size={34} color="#d0d5dd" />}
                        title={searchTerm ? 'No products match that search' : 'No products yet'}
                        text={searchTerm ? 'Try a different name or SKU.' : 'Add your first product to see it listed here.'}
                        action={!searchTerm && (
                            <Link href="/dashboard/admin/products/new" style={{ textDecoration: 'none' }}>
                                <Btn variant="primary" icon={<FiPlus size={15} />}>Add Product</Btn>
                            </Link>
                        )}
                        height={260}
                    />
                ) : (
                    <>
                        <TableWrap>
                            <thead>
                                <tr>
                                    <Th>Product</Th>
                                    <Th>Category</Th>
                                    <Th>Brand</Th>
                                    <Th align="right">Price</Th>
                                    <Th align="right">Stock</Th>
                                    <Th>Status</Th>
                                    <Th align="right">Actions</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product: any) => {
                                    const stock = stockOf(product);
                                    const stockColor = stock === 0 ? '#EF4444' : stock <= LOW_STOCK ? '#F59E0B' : '#10B981';
                                    return (
                                        <Tr key={product._id}>
                                            <Td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{
                                                        width: '42px', height: '42px', borderRadius: '10px', flexShrink: 0,
                                                        background: '#f6f6f6', border: `1px solid ${T.border}`, overflow: 'hidden',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    }}>
                                                        {product.thumbnail
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            ? <img src={product.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            : <FiShoppingBag size={17} color="#ccc" />}
                                                    </div>
                                                    <div style={{ minWidth: 0 }}>
                                                        <p style={{
                                                            margin: 0, fontWeight: 600, color: T.heading, fontSize: '13px',
                                                            maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                        }}>
                                                            {product.name}
                                                        </p>
                                                        <p style={{ margin: '2px 0 0', fontSize: '11px', color: T.faint }}>
                                                            SKU: {product.sku || '—'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </Td>
                                            <Td>
                                                {product.category?.name || <span style={{ color: T.faint }}>Uncategorised</span>}
                                                {product.subcategory?.name && (
                                                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: T.faint }}>{product.subcategory.name}</p>
                                                )}
                                            </Td>
                                            <Td>{product.brand || <span style={{ color: T.faint }}>—</span>}</Td>
                                            <Td align="right">
                                                <span style={{ fontWeight: 700, color: T.heading }}>{money(product.price)}</span>
                                                {product.originalPrice > product.price && (
                                                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: T.faint, textDecoration: 'line-through' }}>
                                                        {money(product.originalPrice)}
                                                    </p>
                                                )}
                                            </Td>
                                            <Td align="right">
                                                <Badge color={stockColor}>{stock} units</Badge>
                                            </Td>
                                            <Td>
                                                <Badge color={STATUS_COLOR[product.status] || T.muted}>{product.status}</Badge>
                                            </Td>
                                            <Td align="right">
                                                <div style={{ display: 'inline-flex', gap: '7px' }}>
                                                    <Link href={`/dashboard/admin/products/new?id=${product._id}`}>
                                                        <IconBtn icon={<FiEdit2 size={14} />} color="#3B82F6" title="Edit" />
                                                    </Link>
                                                    <IconBtn
                                                        icon={<FiTrash2 size={14} />}
                                                        color="#EF4444"
                                                        title="Delete"
                                                        onClick={() => handleDelete(product._id, product.name)}
                                                    />
                                                </div>
                                            </Td>
                                        </Tr>
                                    );
                                })}
                            </tbody>
                        </TableWrap>

                        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
                    </>
                )}
            </Card>
        </PageShell>
    );
}
