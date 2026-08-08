"use client";

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch } from '@/redux/hooks';
import { loginSuccess } from '@/redux/slices/authSlice';
import { useRegisterMutation } from '@/redux/api/authApi';
import { toast } from 'react-hot-toast';
import { FiUser, FiLock, FiEye, FiEyeOff, FiArrowRight, FiMapPin, FiMail, FiPhone } from 'react-icons/fi';

const RegisterPageInner = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [focused, setFocused] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', location: '', password: '' });

    const router = useRouter();
    const searchParams = useSearchParams();
    const dispatch = useAppDispatch();
    const [register, { isLoading }] = useRegisterMutation();
    const redirectPath = searchParams.get('redirect');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            name: formData.name.trim(),
            firstName: formData.name.trim().split(' ')[0] || formData.name.trim(),
            lastName: formData.name.trim().split(' ').slice(1).join(' ') || '',
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            location: formData.location.trim(),
            password: formData.password,
        };
        try {
            const res = await register(payload).unwrap();
            const apiUser = res.data.user;
            const token = res.data.tokens.accessToken;
            const user = {
                id: apiUser._id || apiUser.id,
                name: apiUser.name || `${apiUser.firstName || ''} ${apiUser.lastName || ''}`.trim() || apiUser.email,
                email: apiUser.email,
                phone: apiUser.phone || '',
                role: apiUser.role || 'user',
                avatar: apiUser.avatar || '',
            };

            dispatch(loginSuccess({ user, token }));
            localStorage.setItem('token', token);
            toast.success('Account created! Welcome 🎉', {
                duration: 4000,
                style: { borderRadius: '10px', background: 'var(--color-primary)', color: '#fff' },
            });

            // ── Smart Redirect Logic ──
            if (redirectPath) {
                // If user came from a specific page, go back there
                router.push(redirectPath);
            } else if (user.role === 'admin') {
                // Admin goes to admin dashboard
                router.push('/dashboard/admin');
            } else {
                // New user — no orders yet, go to home page
                router.push('/');
            }
        } catch (err: any) {
            toast.error(err?.data?.message || 'Registration failed. Please try again.', { duration: 4000 });
        }
    };

    const inputStyle = (name: string): React.CSSProperties => ({
        width: '100%', padding: '14px 16px 14px 44px',
        border: `1.5px solid ${focused === name ? 'var(--color-primary)' : '#e5e7eb'}`,
        borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit',
        background: '#fff', outline: 'none', transition: 'border-color 0.2s ease',
        boxSizing: 'border-box', color: '#111',
    });

    const iconStyle: React.CSSProperties = {
        position: 'absolute', top: '50%', left: '14px', transform: 'translateY(-50%)', transition: 'color 0.2s',
    };

    return (
        <div style={{ background: '#fff', borderRadius: '20px', padding: '44px 40px', boxShadow: '0 4px 40px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0' }}>

            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 900, color: 'var(--color-primary)', margin: '0 0 6px', letterSpacing: '-0.5px' }}>Create Account</h1>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0, fontWeight: 500 }}>Join PremiuGlobal for a better trading experience</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

                {/* Full Name */}
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '7px' }}>Full Name</label>
                    <div style={{ position: 'relative' }}>
                        <div style={{ ...iconStyle, color: focused === 'name' ? 'var(--color-primary)' : '#9ca3af' }}><FiUser size={17} /></div>
                        <input type="text" name="name" required value={formData.name}
                            onChange={handleChange} onFocus={() => setFocused('name')} onBlur={() => setFocused(null)}
                            style={inputStyle('name')} placeholder="Enter your full name" autoComplete="name" />
                    </div>
                </div>

                {/* Email Address */}
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '7px' }}>Email Address</label>
                    <div style={{ position: 'relative' }}>
                        <div style={{ ...iconStyle, color: focused === 'email' ? 'var(--color-primary)' : '#9ca3af' }}><FiMail size={17} /></div>
                        <input type="email" name="email" required value={formData.email}
                            onChange={handleChange} onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                            style={inputStyle('email')} placeholder="name@example.com" autoComplete="email" />
                    </div>
                </div>

                {/* Phone Number */}
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '7px' }}>Phone Number</label>
                    <div style={{ position: 'relative' }}>
                        <div style={{ ...iconStyle, color: focused === 'phone' ? 'var(--color-primary)' : '#9ca3af' }}><FiPhone size={17} /></div>
                        <input type="tel" name="phone" required value={formData.phone}
                            onChange={handleChange} onFocus={() => setFocused('phone')} onBlur={() => setFocused(null)}
                            style={inputStyle('phone')} placeholder="01XXXXXXXXX" autoComplete="tel" />
                    </div>
                </div>

                {/* Location */}
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '7px' }}>Location</label>
                    <div style={{ position: 'relative' }}>
                        <div style={{ ...iconStyle, color: focused === 'loc' ? 'var(--color-primary)' : '#9ca3af' }}><FiMapPin size={17} /></div>
                        <input type="text" name="location" required value={formData.location}
                            onChange={handleChange} onFocus={() => setFocused('loc')} onBlur={() => setFocused(null)}
                            style={inputStyle('loc')} placeholder="e.g. Dhaka, Mirpur" autoComplete="address-level2" />
                    </div>
                </div>

                {/* Password */}
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '7px' }}>Password</label>
                    <div style={{ position: 'relative' }}>
                        <div style={{ ...iconStyle, color: focused === 'pw' ? 'var(--color-primary)' : '#9ca3af' }}><FiLock size={17} /></div>
                        <input type={showPassword ? 'text' : 'password'} name="password" required minLength={6}
                            value={formData.password} onChange={handleChange}
                            onFocus={() => setFocused('pw')} onBlur={() => setFocused(null)}
                            style={{ ...inputStyle('pw'), paddingRight: '44px' }}
                            placeholder="At least 6 characters" autoComplete="new-password" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                            style={{ position: 'absolute', top: '50%', right: '14px', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center', padding: 0 }}>
                            {showPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                        </button>
                    </div>
                </div>

                {/* Submit */}
                <button type="submit" disabled={isLoading}
                    style={{
                        width: '100%', padding: '15px', marginTop: '6px',
                        background: isLoading ? '#5a8a6e' : 'linear-gradient(135deg, var(--color-primary) 0%, #0d5229 100%)',
                        color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 800,
                        cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: '8px', transition: 'all 0.2s ease', letterSpacing: '0.3px', fontFamily: 'inherit',
                    }}
                    onMouseEnter={e => { if (!isLoading) (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}>
                    {isLoading ? (
                        <>
                            <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'authSpin 0.8s linear infinite' }} />
                            Creating Account...
                        </>
                    ) : (
                        <>Create Account <FiArrowRight size={17} /></>
                    )}
                </button>
            </form>

            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f3f4f6', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, fontWeight: 500 }}>
                    Already have an account?{' '}
                    <Link href={redirectPath ? `/login?redirect=${encodeURIComponent(redirectPath)}` : '/login'}
                        style={{ color: 'var(--color-primary)', fontWeight: 800, textDecoration: 'none' }}>
                        Sign In &rarr;
                    </Link>
                </p>
            </div>

            <style>{`@keyframes authSpin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

const RegisterPage = () => (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-primary)' }}>Loading...</div>}>
        <RegisterPageInner />
    </Suspense>
);

export default RegisterPage;
