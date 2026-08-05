"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import {
    FiSearch, FiMail, FiEye, FiRefreshCw, FiUsers,
    FiUserCheck, FiUserX, FiCalendar, FiPhone,
    FiX, FiUserPlus, FiShield, FiEdit3,
} from 'react-icons/fi';
import {
    useGetAdminUsersQuery,
    useGetAdminUserStatsQuery,
    useUpdateUserMutation,
} from '@/redux/api/userApi';
import { useRegisterMutation } from '@/redux/api/authApi';
import toast from 'react-hot-toast';
import {
    PageShell, PageHeader, Card, CardHeader, Btn, IconBtn, Badge, SearchInput,
    TableWrap, Th, Td, Tr, EmptyState, Spinner, StatTile, StatGrid, Pagination,
    Modal, Field, inputStyle, T,
} from '@/components/admin/ui';

const PER_PAGE = 10;

const STATUS_COLOR: Record<string, string> = {
    active: '#10B981',
    pending: '#F59E0B',
    blocked: '#EF4444',
};

const AVATAR_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B', '#EF4444'];

function Avatar({ name, avatar }: { name: string; avatar?: string }) {
    const clean = (name || 'U').trim();
    const initials = clean.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const color = AVATAR_COLORS[clean.charCodeAt(0) % AVATAR_COLORS.length];

    if (avatar) {
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={avatar} alt="" style={{ width: '40px', height: '40px', borderRadius: '11px', objectFit: 'cover', border: `1px solid ${T.border}` }} />;
    }
    return (
        <div style={{
            width: '40px', height: '40px', borderRadius: '11px', flexShrink: 0,
            background: color, color: '#fff', fontSize: '13px', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            {initials}
        </div>
    );
}

export default function CustomersPage() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [roleFilter, setRoleFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [editingRole, setEditingRole] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [createForm, setCreateForm] = useState({
        firstName: '', lastName: '', email: '', phone: '', password: '', role: 'admin' as 'admin' | 'user',
    });

    const { data: usersData, isLoading, isFetching, refetch: refetchUsers } = useGetAdminUsersQuery({
        page, limit: PER_PAGE,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search || undefined,
    });

    const { data: statsData, isLoading: isStatsLoading, refetch: refetchStats } = useGetAdminUserStatsQuery(undefined);
    const [updateUser, { isLoading: isUpdatingUser }] = useUpdateUserMutation();
    const [registerUser, { isLoading: isCreating }] = useRegisterMutation();

    const customers = usersData?.data || [];
    const meta = usersData?.meta || { totalPages: 1, total: 0 };
    const stats = statsData?.data || { totalUsers: 0, activeUsers: 0, blockedUsers: 0, totalCustomers: 0 };

    const handleRefresh = () => { refetchUsers(); refetchStats(); };

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            await updateUser({ id: userId, role: newRole }).unwrap();
            toast.success(`Role updated to ${newRole}`);
            setEditingRole(null);
            refetchUsers();
        } catch (err: any) {
            toast.error(err?.data?.message || 'Failed to update role');
        }
    };

    const handleCreate = async () => {
        if (!createForm.firstName || !createForm.email || !createForm.password) {
            return toast.error('Name, email and password are required');
        }
        if (createForm.password.length < 6) {
            return toast.error('Password must be at least 6 characters');
        }
        try {
            // Register first (always creates a regular user), then promote if needed
            const { role, ...registerData } = createForm;
            const res = await registerUser({ ...registerData }).unwrap();
            const newUserId = res?.data?.user?._id;
            if (role === 'admin' && newUserId) {
                await updateUser({ id: newUserId, role: 'admin' }).unwrap();
            }
            toast.success(`${role === 'admin' ? 'Admin' : 'User'} account created`);
            setShowCreate(false);
            setCreateForm({ firstName: '', lastName: '', email: '', phone: '', password: '', role: 'admin' });
            refetchUsers();
            refetchStats();
        } catch (err: any) {
            toast.error(err?.data?.message || 'Failed to create account');
        }
    };

    const formatDate = (d: string) => d
        ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—';

    const selectStyle: React.CSSProperties = {
        padding: '10px 13px', borderRadius: '10px', border: '1px solid #d0d5dd',
        fontSize: '13px', color: '#344054', background: '#fff', outline: 'none', cursor: 'pointer',
    };

    return (
        <PageShell>
            <PageHeader
                title="Users & Admins"
                subtitle="Manage accounts, change roles and create admins"
                actions={
                    <>
                        <Btn icon={<FiRefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />} onClick={handleRefresh}>
                            Refresh
                        </Btn>
                        <Btn variant="primary" icon={<FiUserPlus size={15} />} onClick={() => setShowCreate(true)}>
                            Create User
                        </Btn>
                    </>
                }
            />

            <StatGrid>
                <StatTile icon={FiUsers} label="Total Users" value={isStatsLoading ? '…' : (stats.totalUsers || meta.total || 0)} color="#3B82F6" />
                <StatTile icon={FiUserCheck} label="Active" value={isStatsLoading ? '…' : (stats.activeUsers || 0)} color="#10B981" />
                <StatTile icon={FiUserX} label="Blocked" value={isStatsLoading ? '…' : (stats.blockedUsers || 0)} color="#EF4444" />
                <StatTile icon={FiShield} label="Customers" value={isStatsLoading ? '…' : (stats.totalCustomers || 0)} color="#8B5CF6" sub="Non-admin accounts" />
            </StatGrid>

            <Card padded={false}>
                <CardHeader
                    title="All Users"
                    subtitle={`${meta.total || 0} account${meta.total === 1 ? '' : 's'}`}
                    actions={
                        <>
                            <SearchInput
                                value={search}
                                onChange={(v) => { setSearch(v); setPage(1); }}
                                placeholder="Name, email or phone…"
                                icon={<FiSearch size={15} />}
                                width="270px"
                            />
                            <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} style={selectStyle}>
                                <option value="all">All roles</option>
                                <option value="user">Users</option>
                                <option value="admin">Admins</option>
                            </select>
                            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={selectStyle}>
                                <option value="all">All statuses</option>
                                <option value="active">Active</option>
                                <option value="pending">Pending</option>
                                <option value="blocked">Blocked</option>
                            </select>
                        </>
                    }
                />

                {isLoading ? (
                    <Spinner />
                ) : customers.length === 0 ? (
                    <EmptyState
                        icon={<FiUsers size={34} color="#d0d5dd" />}
                        title="No users found"
                        text="Try adjusting the search or filters."
                        height={260}
                    />
                ) : (
                    <>
                        <TableWrap>
                            <thead>
                                <tr>
                                    <Th>User</Th>
                                    <Th>Contact</Th>
                                    <Th>Role</Th>
                                    <Th>Status</Th>
                                    <Th>Joined</Th>
                                    <Th align="right">Actions</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.map((user: any) => (
                                    <Tr key={user._id}>
                                        <Td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <Avatar name={`${user.firstName || ''} ${user.lastName || ''}`} avatar={user.avatar} />
                                                <div style={{ minWidth: 0 }}>
                                                    <p style={{ margin: 0, fontWeight: 600, color: T.heading, fontSize: '13px' }}>
                                                        {user.firstName} {user.lastName}
                                                    </p>
                                                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: T.faint }}>
                                                        ID: {String(user._id).slice(-8).toUpperCase()}
                                                    </p>
                                                </div>
                                            </div>
                                        </Td>
                                        <Td>
                                            <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}>
                                                <FiMail size={13} color={T.faint} /> {user.email}
                                            </p>
                                            <p style={{ margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: T.faint }}>
                                                <FiPhone size={12} /> {user.phone || '—'}
                                            </p>
                                        </Td>
                                        <Td>
                                            {editingRole === user._id ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                                    <select
                                                        defaultValue={user.role}
                                                        onChange={e => handleRoleChange(user._id, e.target.value)}
                                                        disabled={isUpdatingUser}
                                                        style={{ ...selectStyle, padding: '6px 10px', fontSize: '12px' }}
                                                    >
                                                        <option value="user">User</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                    <IconBtn icon={<FiX size={13} />} onClick={() => setEditingRole(null)} title="Cancel" />
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Badge color={user.role === 'admin' ? '#8B5CF6' : T.muted}>
                                                        {user.role === 'admin' && <FiShield size={10} />} {user.role}
                                                    </Badge>
                                                    <IconBtn icon={<FiEdit3 size={12} />} onClick={() => setEditingRole(user._id)} title="Change role" />
                                                </div>
                                            )}
                                        </Td>
                                        <Td><Badge color={STATUS_COLOR[user.status] || T.muted}>{user.status}</Badge></Td>
                                        <Td style={{ color: T.muted, whiteSpace: 'nowrap' }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                <FiCalendar size={12} color={T.faint} /> {formatDate(user.createdAt)}
                                            </span>
                                        </Td>
                                        <Td align="right">
                                            <Link href={`/dashboard/admin/customers/${user._id}`}>
                                                <IconBtn icon={<FiEye size={14} />} color="#3B82F6" title="View" />
                                            </Link>
                                        </Td>
                                    </Tr>
                                ))}
                            </tbody>
                        </TableWrap>

                        <Pagination page={page} totalPages={meta.totalPages || 1} onChange={setPage} />
                    </>
                )}
            </Card>

            {/* Create account */}
            <Modal
                open={showCreate}
                onClose={() => setShowCreate(false)}
                title={`Create ${createForm.role === 'admin' ? 'Admin' : 'User'} Account`}
                footer={
                    <>
                        <Btn onClick={() => setShowCreate(false)}>Cancel</Btn>
                        <Btn variant="primary" icon={<FiUserPlus size={14} />} onClick={handleCreate} disabled={isCreating}>
                            {isCreating ? 'Creating…' : 'Create Account'}
                        </Btn>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        {(['admin', 'user'] as const).map(r => {
                            const on = createForm.role === r;
                            return (
                                <button key={r} type="button" onClick={() => setCreateForm({ ...createForm, role: r })}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        padding: '11px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                                        background: on ? 'var(--color-primary)' : '#fff',
                                        color: on ? 'var(--color-primary-foreground)' : T.body,
                                        border: `1px solid ${on ? 'transparent' : '#e4e7ec'}`,
                                    }}
                                >
                                    {r === 'admin' ? <FiShield size={15} /> : <FiUsers size={15} />}
                                    {r === 'admin' ? 'Admin' : 'User'}
                                </button>
                            );
                        })}
                    </div>

                    <p style={{ fontSize: '12.5px', color: T.faint, margin: 0 }}>
                        {createForm.role === 'admin'
                            ? 'This account will have full access to the admin panel.'
                            : 'A regular customer who can shop and place orders.'}
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <Field label="First name">
                            <input style={inputStyle} value={createForm.firstName}
                                onChange={e => setCreateForm({ ...createForm, firstName: e.target.value })} placeholder="First name" />
                        </Field>
                        <Field label="Last name">
                            <input style={inputStyle} value={createForm.lastName}
                                onChange={e => setCreateForm({ ...createForm, lastName: e.target.value })} placeholder="Last name" />
                        </Field>
                    </div>
                    <Field label="Email">
                        <input type="email" style={inputStyle} value={createForm.email}
                            onChange={e => setCreateForm({ ...createForm, email: e.target.value })} placeholder="name@example.com" />
                    </Field>
                    <Field label="Phone" hint="optional">
                        <input style={inputStyle} value={createForm.phone}
                            onChange={e => setCreateForm({ ...createForm, phone: e.target.value })} placeholder="01XXXXXXXXX" />
                    </Field>
                    <Field label="Password" hint="min 6 characters">
                        <input type="password" style={inputStyle} value={createForm.password}
                            onChange={e => setCreateForm({ ...createForm, password: e.target.value })} placeholder="••••••" />
                    </Field>
                </div>
            </Modal>
        </PageShell>
    );
}
