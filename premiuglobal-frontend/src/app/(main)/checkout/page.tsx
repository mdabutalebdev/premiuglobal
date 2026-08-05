"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux';
import { clearCart, updateQuantity, removeFromCart } from '@/redux/slices/cartSlice';
import {
    toGaItem,
    trackBeginCheckout,
    trackAddPaymentInfo,
    trackPurchase,
    type GaItem,
} from '@/lib/analytics/gtag';
import { loginSuccess } from '@/redux/slices/authSlice';
import { useCreateOrderMutation, useGuestCheckoutMutation } from '@/redux/api/orderApi';
import { useValidateCouponMutation } from '@/redux/api/couponApi';
import { useGetSiteContentQuery } from '@/redux/api/siteContentApi';
import {
    FiCheck, FiCopy, FiTag, FiTrash2, FiMail, FiCheckCircle, FiChevronDown
} from 'react-icons/fi';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

const COUPON_STORAGE_KEY = 'freshfoodbazar_applied_coupon';

const ORANGE = '#F47B20';

/* Districts of Bangladesh — a select beats free text for delivery addresses. */
const DISTRICTS = [
    'Bagerhat', 'Bandarban', 'Barguna', 'Barishal', 'Bhola', 'Bogura', 'Brahmanbaria', 'Chandpur',
    'Chapainawabganj', 'Chattogram', 'Chuadanga', "Cox's Bazar", 'Cumilla', 'Dhaka', 'Dinajpur',
    'Faridpur', 'Feni', 'Gaibandha', 'Gazipur', 'Gopalganj', 'Habiganj', 'Jamalpur', 'Jashore',
    'Jhalokathi', 'Jhenaidah', 'Joypurhat', 'Khagrachhari', 'Khulna', 'Kishoreganj', 'Kurigram',
    'Kushtia', 'Lakshmipur', 'Lalmonirhat', 'Madaripur', 'Magura', 'Manikganj', 'Meherpur',
    'Moulvibazar', 'Munshiganj', 'Mymensingh', 'Naogaon', 'Narail', 'Narayanganj', 'Narsingdi',
    'Natore', 'Netrokona', 'Nilphamari', 'Noakhali', 'Pabna', 'Panchagarh', 'Patuakhali',
    'Pirojpur', 'Rajbari', 'Rajshahi', 'Rangamati', 'Rangpur', 'Satkhira', 'Shariatpur',
    'Sherpur', 'Sirajganj', 'Sunamganj', 'Sylhet', 'Tangail', 'Thakurgaon',
];

// â”€â”€â”€ Payment method metadata (numbers come dynamically from site settings) â”€â”€
const PAYMENT_META = [
    { id: 'bkash',  label: 'bKash',  color: '#E2136E' },
    { id: 'rocket', label: 'Rocket', color: '#8332AC' },
    { id: 'nagad',  label: 'Nagad',  color: '#F47920' },
    { id: 'cod',    label: 'Cash on Delivery', color: '#16a34a' },
];

const inputClass =
    "w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded text-sm text-gray-800 outline-none focus:border-gray-900 transition-colors placeholder:text-gray-400";

const labelClass =
    "block text-xs font-medium text-gray-600 mb-1.5";

const CheckoutPage = () => {
    const { items, totalPrice } = useAppSelector((state) => state.cart);
    const { user, isAuthenticated } = useAppSelector((state) => state.auth);
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [createOrder, { isLoading: isPlacingOrder }] = useCreateOrderMutation();
    const [guestCheckout, { isLoading: isGuestPlacing }] = useGuestCheckoutMutation();
    const { data: siteRes } = useGetSiteContentQuery({});

    const paymentCfg = siteRes?.data?.payment || {};
    const methods = PAYMENT_META
        .map(m => ({
            ...m,
            number: m.id === 'cod' ? '' : (paymentCfg[m.id]?.number || ''),
            accountType: m.id === 'cod' ? '' : (paymentCfg[m.id]?.accountType || 'Personal'),
            active: paymentCfg[m.id]?.active !== false,
        }))
        .filter(m => m.active);
    const paymentInstructions = paymentCfg.instructions || '';
    const availableIds = methods.map(m => m.id).join(',');

    const [formData, setFormData] = useState({
        fullName: '', email: '', phone: '', address: '', city: '', area: '', postalCode: '',
    });

    const [selectedPayment, setSelectedPayment] = useState('bkash');
    const [paymentDetails, setPaymentDetails] = useState({
        senderNumber: '', transactionId: '', paymentTime: '',
    });
    const [copied, setCopied] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [note, setNote] = useState('');
    const [agreed, setAgreed] = useState(true);
    const [couponOpen, setCouponOpen] = useState(false);
    const [billingSame, setBillingSame] = useState(true);
    // Separate billing details — only used when "Same as shipping" is unticked.
    const [billing, setBilling] = useState({
        billingFullName: '', billingPhone: '', billingEmail: '',
        billingAddress: '', billingCity: '', billingArea: '',
    });
    const handleBillingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setBilling(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if (errors[e.target.name]) setErrors(prev => { const n = { ...prev }; delete n[e.target.name]; return n; });
    };
    // Coupons used to live on the cart page; that page is gone, so entry moved here
    const [couponCode, setCouponCode] = useState('');
    const [couponError, setCouponError] = useState('');
    const [validateCoupon, { isLoading: isValidating }] = useValidateCouponMutation();
    const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; finalAmount: number } | null>(null);

    // Load coupon from cart page
    useEffect(() => {
        try {
            const saved = localStorage.getItem(COUPON_STORAGE_KEY);
            if (saved) setAppliedCoupon(JSON.parse(saved));
        } catch {}
    }, []);

    useEffect(() => {
        if (isAuthenticated && user) {
            setFormData(prev => ({
                ...prev,
                fullName: user.name || prev.fullName,
                email: user.email || prev.email,
                phone: user.phone || prev.phone,
                address: user.address?.street || prev.address,
                city: user.address?.city || prev.city,
                area: user.address?.state || prev.area,
                postalCode: user.address?.zipCode || prev.postalCode,
            }));
        }
    }, [isAuthenticated, user]);

    useEffect(() => {
        // Straight home — /cart only bounces back here now
        if (items.length === 0) router.push('/');
    }, [items, router]);

    // GA4: begin_checkout â€” fires once when the page first has items.
    const beganCheckoutRef = useRef(false);
    useEffect(() => {
        if (!beganCheckoutRef.current && items.length > 0) {
            beganCheckoutRef.current = true;
            trackBeginCheckout(
                items.map((it) => toGaItem(it, { quantity: it.quantity })),
                appliedCoupon?.code,
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items]);

    // Keep selected payment valid if admin hides the current method
    useEffect(() => {
        if (methods.length && !methods.some(m => m.id === selectedPayment)) {
            setSelectedPayment(methods[0].id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [availableIds]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) setErrors(prev => { const n = { ...prev }; delete n[e.target.name]; return n; });
    };

    const handlePaymentDetailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPaymentDetails({ ...paymentDetails, [e.target.name]: e.target.value });
        if (errors[e.target.name]) setErrors(prev => { const n = { ...prev }; delete n[e.target.name]; return n; });
    };

    const validate = () => {
        const e: Record<string, string> = {};
        if (!formData.fullName.trim()) e.fullName = 'Full name is required';
        if (!formData.phone.trim()) e.phone = 'Phone number is required';
        else if (!/^01\d{9}$/.test(formData.phone.replace(/[\s-]/g, ''))) e.phone = 'Enter a valid 11-digit number';
        if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) e.email = 'Enter a valid email';
        if (!formData.address.trim()) e.address = 'Address is required';
        if (!formData.city.trim()) e.city = 'City is required';
        if (selectedPayment !== 'cod') {
            if (!paymentDetails.senderNumber.trim()) e.senderNumber = 'Sender number is required';
            if (!paymentDetails.transactionId.trim()) e.transactionId = 'Transaction ID is required';
            if (!paymentDetails.paymentTime.trim()) e.paymentTime = 'Payment time is required';
        }
        // Billing is only validated when it isn't the same as shipping.
        if (!billingSame) {
            if (!billing.billingFullName.trim()) e.billingFullName = 'Billing name is required';
            if (!billing.billingPhone.trim()) e.billingPhone = 'Billing phone is required';
            else if (!/^01\d{9}$/.test(billing.billingPhone.replace(/[\s-]/g, ''))) e.billingPhone = 'Enter a valid 11-digit number';
            if (billing.billingEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billing.billingEmail.trim())) e.billingEmail = 'Enter a valid email';
            if (!billing.billingAddress.trim()) e.billingAddress = 'Billing address is required';
            if (!billing.billingCity.trim()) e.billingCity = 'Please select a district';
        }
        return e;
    };

    const activeMethod = methods.find(m => m.id === selectedPayment) || methods[0]
        || { ...PAYMENT_META[0], number: '', accountType: 'Personal', active: true };

    const handleApplyCoupon = async () => {
        const code = couponCode.trim().toUpperCase();
        if (!code) return;
        setCouponError('');
        try {
            const result = await validateCoupon({ code, orderAmount: totalPrice }).unwrap();
            const couponData = {
                code,
                discount: result.data?.discount ?? 0,
                finalAmount: result.data?.finalAmount ?? totalPrice,
            };
            setAppliedCoupon(couponData);
            localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(couponData));
            toast.success('Coupon applied successfully!');
        } catch (err: any) {
            setCouponError(err?.data?.message || 'Invalid or expired coupon code');
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode('');
        setCouponError('');
        localStorage.removeItem(COUPON_STORAGE_KEY);
    };

    const copyNumber = () => {
        if (!activeMethod?.number) return;
        navigator.clipboard.writeText(activeMethod.number);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!agreed) {
            toast.error('Please accept the terms to place your order');
            return;
        }

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            toast.error('Please fix the highlighted fields');
            const firstField = Object.keys(validationErrors)[0];
            document.querySelector<HTMLElement>(`[name="${firstField}"]`)?.focus();
            return;
        }
        setErrors({});

        // GA4: snapshot the cart for analytics before it gets cleared on success.
        const gaItems: GaItem[] = items.map((it) => toGaItem(it, { quantity: it.quantity }));
        const gaValue = appliedCoupon ? appliedCoupon.finalAmount : totalPrice;
        trackAddPaymentInfo(gaItems, selectedPayment, appliedCoupon?.code);

        const orderPayload = {
            items: items.map(item => ({
                product: item.productId || item.id,
                quantity: item.quantity,
                color: item.color || undefined,
                size: item.size || undefined,
            })),
            shippingAddress: {
                fullName: formData.fullName,
                phone: formData.phone,
                email: formData.email,
                address: formData.address,
                area: formData.area,
                city: formData.city,
                postalCode: formData.postalCode,
            },
            paymentMethod: selectedPayment,
            paymentDetails: selectedPayment === 'cod' ? {} : {
                senderNumber: paymentDetails.senderNumber,
                transactionId: paymentDetails.transactionId,
                paymentTime: paymentDetails.paymentTime,
            },
            ...(note.trim() ? { note: note.trim() } : {}),
            ...(appliedCoupon ? { couponCode: appliedCoupon.code, discount: appliedCoupon.discount } : {}),
            ...(billingSame ? {} : {
                billingAddress: {
                    fullName: billing.billingFullName,
                    phone: billing.billingPhone,
                    email: billing.billingEmail,
                    address: billing.billingAddress,
                    area: billing.billingArea,
                    city: billing.billingCity,
                },
            }),
        };

        try {
            if (isAuthenticated) {
                const res = await createOrder(orderPayload).unwrap();
                dispatch(clearCart());
                localStorage.removeItem(COUPON_STORAGE_KEY);
                toast.success('Order placed successfully!', { duration: 5000 });
                const oid = res?.data?._id || res?.data?.order?._id || res?.data?.orderId || '';
                trackPurchase({ transactionId: oid || `FFB-${Date.now()}`, items: gaItems, value: gaValue, coupon: appliedCoupon?.code });
                router.push(`/checkout/success${oid ? `?order=${encodeURIComponent(oid)}` : ''}`);
            } else {
                const result = await guestCheckout(orderPayload).unwrap();
                dispatch(clearCart());
                localStorage.removeItem(COUPON_STORAGE_KEY);

                if (result.data?.accessToken && result.data?.user) {
                    const userData = result.data.user;
                    dispatch(loginSuccess({
                        user: {
                            id: userData._id,
                            name: `${userData.firstName} ${userData.lastName}`.trim(),
                            email: userData.email,
                            phone: userData.phone || '',
                            role: userData.role || 'user',
                        },
                        token: result.data.accessToken,
                    }));
                }

                toast.success('Order placed! Your account has been created.', { duration: 7000 });
                const oid = result?.data?._id || result?.data?.order?._id || result?.data?.orderId || '';
                trackPurchase({ transactionId: oid || `FFB-${Date.now()}`, items: gaItems, value: gaValue, coupon: appliedCoupon?.code });
                router.push(`/checkout/success${oid ? `?order=${encodeURIComponent(oid)}` : ''}`);
            }
        } catch (err: any) {
            const errorData = err?.data;
            if (errorData?.errorMessages?.length > 0) {
                errorData.errorMessages.forEach((er: any) => toast.error(er.message, { duration: 6000 }));
            } else {
                toast.error(errorData?.message || 'Failed to place order. Please try again.', { duration: 6000 });
            }
        }
    };

    const isSubmitting = isPlacingOrder || isGuestPlacing;

    const cls = (field: string) =>
        `${inputClass} ${errors[field] ? 'border-red-400 focus:border-red-500' : ''}`;
    const FieldError = ({ field }: { field: string }) =>
        errors[field] ? <p className="mt-1 text-xs text-red-500">{errors[field]}</p> : null;

    if (items.length === 0) return null;

    /* Section heading with the small orange bar the reference uses */
    const SectionTitle = ({ children }: { children: React.ReactNode }) => (
        <h2 className="flex items-center gap-2.5 text-[15px] font-semibold text-[#222831] px-5 py-4 border-b border-gray-100">
            <span className="w-[3px] h-[15px] rounded-sm" style={{ background: ORANGE }} />
            {children}
        </h2>
    );

    const cardCls = 'bg-white rounded-md border border-gray-200';

    return (
        <div className="bg-[var(--color-background)] min-h-screen pb-20">
            <div className="container mx-auto px-4 lg:px-8 pt-8 max-w-[1180px]">

                {/* Title + breadcrumb */}
                <div className="text-center mb-6">
                    <h1 className="text-[26px] font-bold text-[#222831]">Checkout</h1>
                    <p className="mt-1 text-[13px] text-gray-500">
                        <Link href="/" className="hover:text-[#222831]">Home</Link>
                        <span className="mx-1.5 text-gray-300">›</span>
                        <span style={{ color: ORANGE }}>Checkout</span>
                    </p>
                </div>

                {/* Login / register bar */}
                {!isAuthenticated && (
                    <div className={`${cardCls} px-5 py-3.5 mb-5 flex items-center justify-between gap-4 flex-wrap`}>
                        <p className="text-[13.5px] text-gray-600">
                            Have any account? please login or register
                            <span className="block text-[12px] text-gray-400 mt-0.5">
                                Or just order as a guest — we&apos;ll create an account for you automatically.
                            </span>
                        </p>
                        <div className="flex gap-2.5">
                            <Link href="/login?redirect=/checkout"
                                className="px-6 py-2 rounded text-[13px] font-semibold border transition-colors hover:bg-orange-50"
                                style={{ borderColor: ORANGE, color: ORANGE }}>
                                Login
                            </Link>
                            <Link href="/register?redirect=/checkout"
                                className="px-6 py-2 rounded text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                                style={{ background: ORANGE }}>
                                Register
                            </Link>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-5">

                        {/* ══ LEFT ══ */}
                        <div className="lg:col-span-7 space-y-5">

                            {/* ── Order review ── */}
                            <div className={cardCls}>
                                <SectionTitle>Order review</SectionTitle>
                                <div className="divide-y divide-gray-100">
                                    {items.map((item) => (
                                        <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                                            <div className="w-[58px] h-[58px] rounded border border-gray-200 overflow-hidden shrink-0 bg-gray-50">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={item.image} alt="" className="w-full h-full object-cover" />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className="text-[14px] text-[#222831] leading-snug line-clamp-2">{item.name}</p>
                                                {(item.color || item.size) && (
                                                    <p className="text-[11.5px] text-gray-400 mt-0.5">
                                                        {item.color && `Color: ${item.color}`}
                                                        {item.color && item.size && ' · '}
                                                        {item.size && `Size: ${item.size}`}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className="text-[12px] text-gray-500">Qty:</span>
                                                    <span className="inline-flex items-center border border-gray-300 rounded overflow-hidden">
                                                        <button type="button" aria-label="Decrease quantity"
                                                            onClick={() => item.quantity > 1
                                                                ? dispatch(updateQuantity({ id: item.id, quantity: item.quantity - 1 }))
                                                                : dispatch(removeFromCart(item.id))}
                                                            className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-50">−</button>
                                                        <span className="w-8 text-center text-[13px] font-semibold">{item.quantity}</span>
                                                        <button type="button" aria-label="Increase quantity"
                                                            onClick={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }))}
                                                            className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-50">+</button>
                                                    </span>
                                                    <span className="text-[14px] font-semibold" style={{ color: ORANGE }}>
                                                        ৳{(item.price * item.quantity).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>

                                            <button type="button" aria-label={`Remove ${item.name}`}
                                                onClick={() => dispatch(removeFromCart(item.id))}
                                                className="w-8 h-8 rounded flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors shrink-0">
                                                <FiTrash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ── Shipping address ── */}
                            <div className={cardCls}>
                                <SectionTitle>Shipping Address</SectionTitle>
                                <div className="px-5 py-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <input type="text" name="fullName" value={formData.fullName} onChange={handleChange}
                                            placeholder="Your Full Name *" className={cls('fullName')} />
                                        <FieldError field="fullName" />
                                    </div>

                                    <div>
                                        <div className={`flex items-stretch rounded overflow-hidden border ${errors.phone ? 'border-red-400' : 'border-gray-300'}`}>
                                            <span className="px-3 flex items-center bg-gray-50 border-r border-gray-300 text-[13px] text-gray-500">88</span>
                                            <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                                                placeholder="01XXXXXXXXX *"
                                                className="flex-1 px-3.5 py-2.5 text-sm text-gray-800 outline-none placeholder:text-gray-400" />
                                        </div>
                                        <FieldError field="phone" />
                                    </div>

                                    <div className="md:col-span-2 relative">
                                        <input type="email" name="email" value={formData.email} onChange={handleChange}
                                            placeholder="example@gmail.com (Optional)" className={cls('email')} />
                                        <FiMail size={15} className="absolute right-3.5 top-3 text-gray-400 pointer-events-none" />
                                        <FieldError field="email" />
                                    </div>

                                    <div className="md:col-span-2">
                                        <input type="text" name="address" value={formData.address} onChange={handleChange}
                                            placeholder="ex: House no. / building / street / area *" className={cls('address')} />
                                        <FieldError field="address" />
                                    </div>

                                    <div>
                                        <select name="city" value={formData.city}
                                            onChange={(e) => {
                                                setFormData({ ...formData, city: e.target.value });
                                                if (errors.city) setErrors(prev => { const n = { ...prev }; delete n.city; return n; });
                                            }}
                                            className={`${cls('city')} cursor-pointer ${!formData.city ? 'text-gray-400' : ''}`}>
                                            <option value="">Select District *</option>
                                            {DISTRICTS.map(d => <option key={d} value={d} className="text-gray-800">{d}</option>)}
                                        </select>
                                        <FieldError field="city" />
                                    </div>

                                    <div>
                                        <input type="text" name="area" value={formData.area} onChange={handleChange}
                                            placeholder="Thana / Area (Optional)" className={inputClass} />
                                    </div>
                                </div>
                            </div>

                            {/* ── Billing address ── */}
                            <div className={cardCls}>
                                <div className="flex items-center justify-between px-5 py-4">
                                    <h2 className="flex items-center gap-2.5 text-[15px] font-semibold text-[#222831]">
                                        <span className="w-[3px] h-[15px] rounded-sm" style={{ background: ORANGE }} />
                                        Billing Address
                                    </h2>
                                    <label className="flex items-center gap-2.5 text-[13px] text-gray-600 cursor-pointer">
                                        Same as shipping
                                        <input type="checkbox" checked={billingSame} onChange={e => setBillingSame(e.target.checked)}
                                            className="w-4 h-4 cursor-pointer" style={{ accentColor: ORANGE }} />
                                    </label>
                                </div>
                                {!billingSame && (
                                    <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <input type="text" name="billingFullName" value={billing.billingFullName} onChange={handleBillingChange}
                                                placeholder="Billing Name *" className={cls('billingFullName')} />
                                            <FieldError field="billingFullName" />
                                        </div>

                                        <div>
                                            <div className={`flex items-stretch rounded overflow-hidden border ${errors.billingPhone ? 'border-red-400' : 'border-gray-300'}`}>
                                                <span className="px-3 flex items-center bg-gray-50 border-r border-gray-300 text-[13px] text-gray-500">88</span>
                                                <input type="tel" name="billingPhone" value={billing.billingPhone} onChange={handleBillingChange}
                                                    placeholder="01XXXXXXXXX *"
                                                    className="flex-1 px-3.5 py-2.5 text-sm text-gray-800 outline-none placeholder:text-gray-400" />
                                            </div>
                                            <FieldError field="billingPhone" />
                                        </div>

                                        <div className="md:col-span-2 relative">
                                            <input type="email" name="billingEmail" value={billing.billingEmail} onChange={handleBillingChange}
                                                placeholder="example@gmail.com (Optional)" className={cls('billingEmail')} />
                                            <FiMail size={15} className="absolute right-3.5 top-3 text-gray-400 pointer-events-none" />
                                            <FieldError field="billingEmail" />
                                        </div>

                                        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <select disabled defaultValue="Bangladesh"
                                                className={`${inputClass} cursor-not-allowed bg-gray-50`}>
                                                <option value="Bangladesh">BANGLADESH</option>
                                            </select>
                                            <div>
                                                <select name="billingCity" value={billing.billingCity} onChange={handleBillingChange}
                                                    className={`${cls('billingCity')} cursor-pointer ${!billing.billingCity ? 'text-gray-400' : ''}`}>
                                                    <option value="">Select District *</option>
                                                    {DISTRICTS.map(d => <option key={d} value={d} className="text-gray-800">{d}</option>)}
                                                </select>
                                                <FieldError field="billingCity" />
                                            </div>
                                            <input type="text" name="billingArea" value={billing.billingArea} onChange={handleBillingChange}
                                                placeholder="Thana / Area (Optional)" className={inputClass} />
                                        </div>

                                        <div className="md:col-span-2">
                                            <input type="text" name="billingAddress" value={billing.billingAddress} onChange={handleBillingChange}
                                                placeholder="ex: House no. / building / street / area *" className={cls('billingAddress')} />
                                            <FieldError field="billingAddress" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ══ RIGHT ══ */}
                        <div className="lg:col-span-5 space-y-5">

                            {/* ── Payment method ── */}
                            <div className={cardCls}>
                                <SectionTitle>Payment method</SectionTitle>
                                <div className="px-5 py-5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {methods.map((method) => {
                                            const active = selectedPayment === method.id;
                                            return (
                                                <button key={method.id} type="button" onClick={() => setSelectedPayment(method.id)}
                                                    style={active ? { borderColor: ORANGE, background: '#FFF7ED' } : {}}
                                                    className={`flex items-center gap-2.5 px-3.5 py-3 rounded border text-[13px] font-medium transition-colors ${active ? 'text-[#222831]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                                                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: method.color }} />
                                                    <span className="flex-1 text-left">{method.label}</span>
                                                    {active && <FiCheckCircle size={16} style={{ color: ORANGE }} />}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {selectedPayment === 'cod' ? (
                                        <div className="mt-4 rounded border border-green-200 bg-green-50 px-4 py-3">
                                            <p className="text-[13px] font-semibold text-green-800">Pay when your order arrives</p>
                                            <p className="text-[12px] text-green-700 mt-0.5 leading-relaxed">
                                                No advance payment needed. Our delivery agent collects the full amount at your door.
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="mt-4 rounded border border-dashed border-gray-300 bg-gray-50 px-4 py-3 flex items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="text-[11.5px] text-gray-500">
                                                        Send Money ({activeMethod.accountType}) to this {activeMethod.label} number
                                                    </p>
                                                    {activeMethod.number ? (
                                                        <p className="text-[15px] font-semibold tracking-wide text-gray-900 mt-0.5">{activeMethod.number}</p>
                                                    ) : (
                                                        <p className="text-[13px] font-medium text-amber-600 mt-0.5">Number not set — please contact support</p>
                                                    )}
                                                </div>
                                                {activeMethod.number && (
                                                    <button type="button" onClick={copyNumber}
                                                        className="inline-flex items-center gap-1.5 text-[11.5px] font-medium px-3 py-1.5 rounded border border-gray-300 bg-white text-gray-600 hover:border-gray-400 transition-colors shrink-0">
                                                        {copied ? <><FiCheck size={13} /> Copied</> : <><FiCopy size={13} /> Copy</>}
                                                    </button>
                                                )}
                                            </div>

                                            {paymentInstructions && (
                                                <p className="mt-2.5 text-[11.5px] text-gray-500 leading-relaxed">{paymentInstructions}</p>
                                            )}

                                            <div className="mt-4 space-y-3">
                                                <div>
                                                    <label className={labelClass}>Your {activeMethod.label} Number <span className="text-red-500">*</span></label>
                                                    <input type="tel" name="senderNumber" value={paymentDetails.senderNumber}
                                                        onChange={handlePaymentDetailChange} placeholder="Number you sent money from" className={cls('senderNumber')} />
                                                    <FieldError field="senderNumber" />
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div>
                                                        <label className={labelClass}>Transaction ID <span className="text-red-500">*</span></label>
                                                        <input type="text" name="transactionId" value={paymentDetails.transactionId}
                                                            onChange={handlePaymentDetailChange} placeholder="e.g. 9A1B2C3D4E" className={cls('transactionId')} />
                                                        <FieldError field="transactionId" />
                                                    </div>
                                                    <div>
                                                        <label className={labelClass}>Payment Time <span className="text-red-500">*</span></label>
                                                        <input type="datetime-local" name="paymentTime" value={paymentDetails.paymentTime}
                                                            onChange={handlePaymentDetailChange} className={cls('paymentTime')} />
                                                        <FieldError field="paymentTime" />
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* ── Coupon ── */}
                            <div className={cardCls}>
                                <button type="button" onClick={() => setCouponOpen(o => !o)}
                                    className="w-full flex items-center justify-between px-5 py-4 text-[14px] text-[#222831]">
                                    Have any coupon or gift voucher?
                                    <FiChevronDown size={16} className={`text-gray-400 transition-transform ${couponOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {couponOpen && (
                                    <div className="px-5 pb-5 -mt-1">
                                        {appliedCoupon ? (
                                            <div className="flex items-center justify-between gap-3 rounded border border-green-200 bg-green-50 px-3.5 py-2.5">
                                                <span className="text-[13px] font-semibold text-green-700 flex items-center gap-1.5">
                                                    <FiTag size={13} /> {appliedCoupon.code} applied
                                                </span>
                                                <span className="flex items-center gap-3">
                                                    <span className="text-[13px] font-semibold text-green-700">
                                                        −৳{appliedCoupon.discount.toLocaleString()}
                                                    </span>
                                                    <button type="button" onClick={handleRemoveCoupon}
                                                        className="text-[12px] font-semibold text-red-500 hover:underline">
                                                        Remove
                                                    </button>
                                                </span>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={couponCode}
                                                        onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter') { e.preventDefault(); handleApplyCoupon(); }
                                                        }}
                                                        placeholder="Enter coupon code"
                                                        className={`${inputClass} ${couponError ? 'border-red-400' : ''}`}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleApplyCoupon}
                                                        disabled={isValidating || !couponCode.trim()}
                                                        className="px-5 rounded text-[13px] font-semibold text-white whitespace-nowrap disabled:opacity-50 transition-opacity hover:opacity-90"
                                                        style={{ background: ORANGE }}
                                                    >
                                                        {isValidating ? 'Checking…' : 'Apply'}
                                                    </button>
                                                </div>
                                                {couponError && <p className="mt-1.5 text-[12px] text-red-500">{couponError}</p>}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* ── Totals ── */}
                            <div className={`${cardCls} px-5 py-4 space-y-2.5`}>
                                <div className="flex justify-between text-[13.5px]">
                                    <span className="text-gray-500">Sub total</span>
                                    <span className="text-[#222831]">{totalPrice.toLocaleString()}.00 BDT</span>
                                </div>
                                {appliedCoupon && (
                                    <div className="flex justify-between text-[13.5px] text-green-600">
                                        <span className="flex items-center gap-1"><FiTag size={12} /> Coupon ({appliedCoupon.code})</span>
                                        <span className="font-medium">−{appliedCoupon.discount.toLocaleString()}.00 BDT</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-[13.5px]">
                                    <span className="text-gray-500">Delivery cost</span>
                                    <span className="text-gray-500 text-[12px] italic">To be confirmed</span>
                                </div>
                                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                                    <span className="text-[14px] font-semibold text-[#222831]">Total</span>
                                    <span className="text-[16px] font-bold text-[#222831]">
                                        {(appliedCoupon ? appliedCoupon.finalAmount : totalPrice).toLocaleString()}.00 BDT
                                    </span>
                                </div>
                            </div>

                            {/* ── Special notes ── */}
                            <div className={cardCls}>
                                <h2 className="flex items-center gap-2.5 text-[15px] font-semibold text-[#222831] px-5 pt-4">
                                    <span className="w-[3px] h-[15px] rounded-sm" style={{ background: ORANGE }} />
                                    Special notes <span className="text-[12px] font-normal text-gray-400">(Optional)</span>
                                </h2>
                                <div className="px-5 pb-5 pt-3">
                                    <textarea
                                        value={note}
                                        onChange={e => setNote(e.target.value.slice(0, 90))}
                                        rows={3}
                                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded text-sm text-gray-800 outline-none focus:border-gray-900 resize-none"
                                    />
                                    <p className="mt-1 text-[11.5px] text-gray-400">{note.length} / 90 characters</p>
                                </div>
                            </div>

                            {/* ── Terms + submit ── */}
                            <div className="space-y-4">
                                <label className="flex items-start gap-2.5 text-[12.5px] text-gray-600 cursor-pointer">
                                    <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                                        className="w-4 h-4 mt-0.5 shrink-0 cursor-pointer" style={{ accentColor: ORANGE }} />
                                    <span>
                                        I have read and agree to the{' '}
                                        <Link href="/terms" className="underline" style={{ color: ORANGE }}>Terms and Conditions</Link>,{' '}
                                        <Link href="/privacy" className="underline" style={{ color: ORANGE }}>Privacy Policy</Link> &amp;{' '}
                                        <Link href="/refund" className="underline" style={{ color: ORANGE }}>Refund and Return Policy</Link>.
                                    </span>
                                </label>

                                <button type="submit" disabled={isSubmitting}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded text-[14px] font-bold tracking-wide uppercase text-white transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                                    style={{ background: ORANGE }}>
                                    {isSubmitting ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Placing order…
                                        </>
                                    ) : 'Place Order'}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CheckoutPage;
