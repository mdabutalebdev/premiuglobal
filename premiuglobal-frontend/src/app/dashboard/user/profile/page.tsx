"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { updateUser } from '@/redux/slices/authSlice';
import { useUpdateProfileMutation } from '@/redux/api/userApi';
import { useUploadAvatarMutation } from '@/redux/api/uploadApi';
import { FiUser, FiSave, FiCamera, FiMail, FiPhone, FiLock, FiCheck, FiAlertCircle, FiEye, FiEyeOff } from 'react-icons/fi';

export default function ProfilePage() {
    const { user } = useAppSelector((state) => state.auth);
    const dispatch = useAppDispatch();
    const [updateProfile, { isLoading }] = useUpdateProfileMutation();
    const [uploadImage, { isLoading: uploadingAvatar }] = useUploadAvatarMutation();
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const avatarUrl = (user as any)?.avatar as string | undefined;

    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
    });
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    // Show/hide toggle for each password field
    const [showPwd, setShowPwd] = useState({ current: false, next: false, confirm: false });

    useEffect(() => {
        if (user) {
            setForm({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
            });
        }
    }, [user]);

    // Upload a new profile picture, persist it, and reflect it in the store.
    const handleAvatarFile = async (file?: File) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) { setMessage({ type: 'error', text: 'Please choose an image file' }); return; }
        if (file.size > 10 * 1024 * 1024) { setMessage({ type: 'error', text: 'Image must be under 10MB' }); return; }
        try {
            const fd = new FormData();
            fd.append('image', file);
            const res = await uploadImage(fd).unwrap();
            const url = res?.data?.url;
            if (!url) throw new Error('No URL returned');
            await updateProfile({ avatar: url }).unwrap();
            dispatch(updateUser({ avatar: url } as any));
            setMessage({ type: 'success', text: 'Profile picture updated!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (err: any) {
            setMessage({ type: 'error', text: err?.data?.message || 'Failed to upload picture' });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateProfile(form).unwrap();
            dispatch(updateUser(form));
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (err: any) {
            setMessage({ type: 'error', text: err?.data?.message || 'Failed to update profile' });
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }
        if (passwordForm.newPassword.length < 6) {
            setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }
        try {
            await updateProfile({
                currentPassword: passwordForm.currentPassword,
                password: passwordForm.newPassword,
            }).unwrap();
            setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => setPasswordMessage(null), 3000);
        } catch (err: any) {
            setPasswordMessage({ type: 'error', text: err?.data?.message || 'Failed to change password' });
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
                <p className="text-sm text-gray-400 mt-1">Manage your personal information</p>
            </div>

            {/* Avatar Section */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center gap-5">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-[var(--filter-accent)] to-[#d96a12] flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-[var(--filter-accent)]/25">
                            {avatarUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={avatarUrl} alt={user?.name || 'Profile'} className="w-full h-full object-cover" />
                            ) : (
                                user?.name?.charAt(0) || 'U'
                            )}
                            {uploadingAvatar && (
                                <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                                    <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => avatarInputRef.current?.click()}
                            disabled={uploadingAvatar}
                            title="Change profile picture"
                            className="absolute -bottom-1 -right-1 w-8 h-8 bg-white border-2 border-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:text-[var(--filter-accent)] hover:border-[var(--filter-accent)] transition-all shadow-sm disabled:opacity-60"
                        >
                            <FiCamera size={14} />
                        </button>
                        <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => { handleAvatarFile(e.target.files?.[0]); e.target.value = ''; }}
                        />
                    </div>
                    <div>
                        <p className="text-lg font-bold text-gray-800">{user?.name || 'User'}</p>
                        <p className="text-sm text-gray-400">{user?.email}</p>
                        <p className="text-xs text-gray-300 mt-1">Role: {user?.role || 'user'}</p>
                    </div>
                </div>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h2 className="text-base font-bold text-gray-800 mb-5">Personal Information</h2>

                {message && (
                    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl mb-5 text-sm font-semibold ${
                        message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                        {message.type === 'success' ? <FiCheck size={16} /> : <FiAlertCircle size={16} />}
                        {message.text}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            <FiUser size={12} className="inline mr-1" /> Full Name
                        </label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--filter-accent)] focus:ring-2 focus:ring-[var(--filter-accent)]/15 outline-none text-sm transition-all"
                            placeholder="Your full name"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            <FiMail size={12} className="inline mr-1" /> Email
                        </label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--filter-accent)] focus:ring-2 focus:ring-[var(--filter-accent)]/15 outline-none text-sm transition-all"
                            placeholder="your@email.com"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            <FiPhone size={12} className="inline mr-1" /> Phone
                        </label>
                        <input
                            type="tel"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--filter-accent)] focus:ring-2 focus:ring-[var(--filter-accent)]/15 outline-none text-sm transition-all"
                            placeholder="+880 XXXX XXXXXX"
                        />
                    </div>
                </div>

                <div className="flex justify-end mt-6">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-2.5 bg-[var(--filter-accent)] text-white rounded-xl font-semibold text-sm hover:brightness-95 transition-all shadow-md shadow-[var(--filter-accent)]/25 disabled:opacity-50 flex items-center gap-2"
                    >
                        <FiSave size={16} />
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>

            {/* Change Password */}
            <form onSubmit={handlePasswordChange} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h2 className="text-base font-bold text-gray-800 mb-5">Change Password</h2>

                {passwordMessage && (
                    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl mb-5 text-sm font-semibold ${
                        passwordMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                        {passwordMessage.type === 'success' ? <FiCheck size={16} /> : <FiAlertCircle size={16} />}
                        {passwordMessage.text}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            <FiLock size={12} className="inline mr-1" /> Current Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPwd.current ? 'text' : 'password'}
                                value={passwordForm.currentPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 focus:border-[var(--filter-accent)] focus:ring-2 focus:ring-[var(--filter-accent)]/15 outline-none text-sm transition-all"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPwd((s) => ({ ...s, current: !s.current }))}
                                aria-label={showPwd.current ? 'Hide password' : 'Show password'}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[var(--filter-accent)] transition-colors"
                            >
                                {showPwd.current ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            <FiLock size={12} className="inline mr-1" /> New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPwd.next ? 'text' : 'password'}
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 focus:border-[var(--filter-accent)] focus:ring-2 focus:ring-[var(--filter-accent)]/15 outline-none text-sm transition-all"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPwd((s) => ({ ...s, next: !s.next }))}
                                aria-label={showPwd.next ? 'Hide password' : 'Show password'}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[var(--filter-accent)] transition-colors"
                            >
                                {showPwd.next ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            <FiLock size={12} className="inline mr-1" /> Confirm Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPwd.confirm ? 'text' : 'password'}
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 focus:border-[var(--filter-accent)] focus:ring-2 focus:ring-[var(--filter-accent)]/15 outline-none text-sm transition-all"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPwd((s) => ({ ...s, confirm: !s.confirm }))}
                                aria-label={showPwd.confirm ? 'Hide password' : 'Show password'}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[var(--filter-accent)] transition-colors"
                            >
                                {showPwd.confirm ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end mt-6">
                    <button
                        type="submit"
                        className="px-6 py-2.5 bg-[var(--filter-accent)] text-white rounded-xl font-semibold text-sm hover:brightness-95 transition-all shadow-md shadow-[var(--filter-accent)]/25 disabled:opacity-50 flex items-center gap-2"
                    >
                        <FiLock size={16} />
                        Change Password
                    </button>
                </div>
            </form>
        </div>
    );
}
