"use client";

import React, { useState, useEffect } from 'react';
import { FiUser, FiLock, FiSave, FiCheckCircle, FiMail, FiPhone } from 'react-icons/fi';
import { useGetMeQuery, useUpdateProfileMutation } from '@/redux/api/userApi';
import { useUpdatePasswordMutation } from '@/redux/api/authApi';
import { toast } from 'react-hot-toast';

export default function AdminProfilePage() {
    const { data: meData, isLoading } = useGetMeQuery(undefined);
    const user = meData?.data;
    const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
    const [updatePassword, { isLoading: isChangingPw }] = useUpdatePasswordMutation();

    const [profile, setProfile] = useState({ firstName: '', lastName: '', phone: '' });
    const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [pwSuccess, setPwSuccess] = useState(false);
    const [profileSuccess, setProfileSuccess] = useState(false);

    useEffect(() => {
        if (user) {
            setProfile({ firstName: user.firstName || '', lastName: user.lastName || '', phone: user.phone || '' });
        }
    }, [user]);

    const handleProfileSave = async () => {
        if (!profile.firstName.trim()) { toast.error('First name is required'); return; }
        try {
            await updateProfile(profile).unwrap();
            setProfileSuccess(true);
            toast.success('Profile updated!');
            setTimeout(() => setProfileSuccess(false), 3000);
        } catch (err: any) {
            toast.error(err?.data?.message || 'Failed to update profile');
        }
    };

    const handlePasswordChange = async () => {
        if (!pw.currentPassword || !pw.newPassword) { toast.error('Fill in all password fields'); return; }
        if (pw.newPassword.length < 6) { toast.error('New password must be at least 6 characters'); return; }
        if (pw.newPassword !== pw.confirmPassword) { toast.error('Passwords do not match'); return; }
        try {
            await updatePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword }).unwrap();
            setPw({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setPwSuccess(true);
            toast.success('Password changed successfully!');
            setTimeout(() => setPwSuccess(false), 3000);
        } catch (err: any) {
            toast.error(err?.data?.message || 'Failed to change password');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full"></div>
            </div>
        );
    }

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '12px 14px', fontSize: '14px',
        border: '1.5px solid #e5e7eb', borderRadius: '8px', outline: 'none',
        transition: 'border-color 0.2s', boxSizing: 'border-box', fontFamily: 'inherit',
        background: '#fff',
    };

    const labelStyle: React.CSSProperties = {
        fontSize: '12px', fontWeight: 700, color: '#555',
        display: 'block', marginBottom: '6px', textTransform: 'uppercase',
        letterSpacing: '0.5px',
    };

    return (
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#1a1a1a', marginBottom: '24px' }}>
                My Profile
            </h1>

            {/* ── Profile Info Card ── */}
            <div style={{
                background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb',
                padding: '28px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '8px', background: '#f0fdf4',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <FiUser size={18} color="var(--color-primary)" />
                    </div>
                    <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Personal Information</h2>
                </div>

                {/* Email (read-only) */}
                <div style={{ marginBottom: '16px' }}>
                    <label style={labelStyle}>
                        <FiMail size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                        Email
                    </label>
                    <div style={{
                        ...inputStyle, background: '#f9fafb', color: '#888',
                        cursor: 'not-allowed', border: '1.5px solid #f3f4f6',
                    }}>
                        {user?.email || '—'}
                    </div>
                </div>

                {/* Name Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                    <div>
                        <label style={labelStyle}>First Name *</label>
                        <input
                            value={profile.firstName}
                            onChange={e => setProfile({ ...profile, firstName: e.target.value })}
                            style={inputStyle}
                            placeholder="First name"
                            onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Last Name</label>
                        <input
                            value={profile.lastName}
                            onChange={e => setProfile({ ...profile, lastName: e.target.value })}
                            style={inputStyle}
                            placeholder="Last name"
                            onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                        />
                    </div>
                </div>

                {/* Phone */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={labelStyle}>
                        <FiPhone size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                        Phone
                    </label>
                    <input
                        value={profile.phone}
                        onChange={e => setProfile({ ...profile, phone: e.target.value })}
                        style={inputStyle}
                        placeholder="01XXXXXXXXX"
                        onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                        onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                    />
                </div>

                <button
                    onClick={handleProfileSave}
                    disabled={isUpdating}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        padding: '11px 28px', background: 'var(--color-primary)', color: '#fff',
                        border: 'none', borderRadius: '8px', fontSize: '13px',
                        fontWeight: 700, cursor: 'pointer', letterSpacing: '0.5px',
                        opacity: isUpdating ? 0.7 : 1, transition: 'all 0.2s ease',
                    }}
                >
                    {profileSuccess ? <><FiCheckCircle size={15} /> Saved!</> : isUpdating ? 'Saving...' : <><FiSave size={15} /> Save Changes</>}
                </button>
            </div>

            {/* ── Change Password Card ── */}
            <div style={{
                background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb',
                padding: '28px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '8px', background: '#fef3c7',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <FiLock size={18} color="#92400e" />
                    </div>
                    <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Change Password</h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                    <div>
                        <label style={labelStyle}>Current Password *</label>
                        <input
                            type="password"
                            value={pw.currentPassword}
                            onChange={e => setPw({ ...pw, currentPassword: e.target.value })}
                            style={inputStyle}
                            placeholder="Enter current password"
                            onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>New Password *</label>
                        <input
                            type="password"
                            value={pw.newPassword}
                            onChange={e => setPw({ ...pw, newPassword: e.target.value })}
                            style={inputStyle}
                            placeholder="Enter new password (min 6 chars)"
                            onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Confirm New Password *</label>
                        <input
                            type="password"
                            value={pw.confirmPassword}
                            onChange={e => setPw({ ...pw, confirmPassword: e.target.value })}
                            style={inputStyle}
                            placeholder="Re-enter new password"
                            onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                        />
                        {pw.confirmPassword && pw.newPassword !== pw.confirmPassword && (
                            <p style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px', fontWeight: 600 }}>⚠ Passwords do not match</p>
                        )}
                    </div>
                </div>

                <button
                    onClick={handlePasswordChange}
                    disabled={isChangingPw}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        padding: '11px 28px', background: '#92400e', color: '#fff',
                        border: 'none', borderRadius: '8px', fontSize: '13px',
                        fontWeight: 700, cursor: 'pointer', letterSpacing: '0.5px',
                        opacity: isChangingPw ? 0.7 : 1, transition: 'all 0.2s ease',
                    }}
                >
                    {pwSuccess ? <><FiCheckCircle size={15} /> Changed!</> : isChangingPw ? 'Changing...' : <><FiLock size={15} /> Change Password</>}
                </button>
            </div>
        </div>
    );
}
