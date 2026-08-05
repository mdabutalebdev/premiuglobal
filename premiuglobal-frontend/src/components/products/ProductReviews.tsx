"use client";

import React, { useRef, useState } from 'react';
import { FiUploadCloud, FiX } from 'react-icons/fi';
import { useGetProductReviewsQuery, useSubmitProductReviewMutation } from '@/redux/api/reviewApi';
import toast from 'react-hot-toast';

const ACCENT = 'var(--filter-accent)';
const TEXT = '#222831';
const MAX_IMAGES = 3;

const Stars = ({ value, size = 12 }: { value: number; size?: number }) => (
    <span className="inline-flex" style={{ fontSize: size, lineHeight: 1 }}>
        {[1, 2, 3, 4, 5].map(i => (
            <span key={i} style={{ color: i <= Math.round(value) ? '#F48721' : '#d5d5d5' }}>★</span>
        ))}
    </span>
);

const formatDate = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('en-US', {
        month: 'long', day: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
    }).replace(',', '');
};

const initials = (name: string) => (name || 'A').trim().charAt(0).toUpperCase();

// `part` lets the page render the submit form and the reviews list in separate
// spots: 'submit' (rating summary + form), 'list' (approved reviews), or 'all'.
const ProductReviews: React.FC<{ productId: string; embedded?: boolean; part?: 'all' | 'submit' | 'list' }> = ({ productId, embedded = false, part = 'all' }) => {
    const { data } = useGetProductReviewsQuery({ productId, limit: 50, sort: '-createdAt' }, { skip: !productId });
    const [submitReview, { isLoading: isSubmitting }] = useSubmitProductReviewMutation();

    const reviews: any[] = data?.data || [];
    const summary = data?.meta?.summary || { total: 0, average: 0, counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, recommended: 0 };

    const [comment, setComment] = useState('');
    const [rating, setRating] = useState('');
    const [userName, setUserName] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const pct = (n: number) => (summary.total ? Math.round((n / summary.total) * 100) : 0);
    const recommendPct = summary.total ? (summary.recommended / summary.total) * 100 : 0;

    const uploadFiles = async (files: FileList | null) => {
        if (!files?.length) return;
        const room = MAX_IMAGES - images.length;
        if (room <= 0) {
            toast.error(`You can attach up to ${MAX_IMAGES} images`);
            return;
        }
        const form = new FormData();
        Array.from(files).slice(0, room).forEach(f => form.append('images', f));

        setUploading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/review-images`, {
                method: 'POST',
                body: form,
            });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.message || 'Upload failed');
            setImages(prev => [...prev, ...(json.data?.urls || [])].slice(0, MAX_IMAGES));
        } catch (err: any) {
            toast.error(err.message || 'Could not upload the image');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (!comment.trim()) return toast.error('Please write your review first');
        if (!rating) return toast.error('Please select a rating');
        try {
            await submitReview({
                product: productId,
                rating: Number(rating),
                comment: comment.trim(),
                userName: userName.trim() || 'Anonymous',
                images,
            }).unwrap();
            setComment(''); setRating(''); setUserName(''); setImages([]);
            toast.success('Thanks! Your review is awaiting approval.');
        } catch (err: any) {
            toast.error(err?.data?.message || 'Could not submit your review');
        }
    };

    const showSubmit = part === 'all' || part === 'submit';
    const showList = part === 'all' || part === 'list';

    return (
        <div className={embedded ? '' : 'mt-6 bg-white rounded-lg border border-gray-200 p-6 lg:p-8'}>
            {showSubmit && (
            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8 lg:gap-12">

                {/* ── Rating summary ── */}
                <div>
                    <div className="flex items-start gap-4">
                        <span className="text-[46px] leading-none font-bold" style={{ color: TEXT }}>
                            {summary.average.toFixed(1)}
                        </span>
                        <div className="pt-1">
                            <p className="text-[14px]" style={{ color: TEXT }}>Average Rating</p>
                            <div className="flex items-center gap-1.5 mt-1">
                                <Stars value={summary.average} />
                                <span className="text-[12px] text-gray-500">({summary.total} Reviews)</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-baseline gap-4 mt-4">
                        <span className="text-[22px] font-semibold" style={{ color: TEXT }}>
                            {recommendPct.toFixed(2)}%
                        </span>
                        <span className="text-[14px]" style={{ color: TEXT }}>
                            Recommended <span className="text-[12px] text-gray-500">({summary.recommended} of {summary.total})</span>
                        </span>
                    </div>

                    <div className="mt-5 space-y-2">
                        {[5, 4, 3, 2, 1].map(star => (
                            <div key={star} className="flex items-center gap-3">
                                <Stars value={star} size={11} />
                                <div className="flex-1 h-[7px] rounded-full bg-[#ececec] overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-[#9a9a9a]"
                                        style={{ width: `${pct(summary.counts?.[star] || 0)}%` }}
                                    />
                                </div>
                                <span className="w-9 text-right text-[12px] text-gray-500">
                                    {pct(summary.counts?.[star] || 0)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Submit form ── */}
                <div>
                    <div className="relative inline-block mb-5">
                        <h3 className="text-[20px] font-bold" style={{ color: TEXT }}>Submit Your Review</h3>
                        <span className="absolute left-0 -bottom-2 w-10 h-1" style={{ background: ACCENT }} />
                    </div>

                    <p className="text-[14px] text-gray-600 mb-5">
                        Your email address will not be published. Required fields are marked *
                    </p>

                    <label className="block text-[14px] mb-2" style={{ color: TEXT }}>
                        Write your opinion about the product
                    </label>
                    <textarea
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="Write Your Review Here..."
                        rows={5}
                        className="w-full border border-gray-200 rounded p-3 text-[14px] text-gray-700 outline-none focus:border-[var(--filter-accent)] resize-y"
                    />

                    {/* Images */}
                    <p className="text-[14px] mt-5 mb-2" style={{ color: TEXT }}>Upload Images (Optional)</p>
                    <div
                        onClick={() => fileRef.current?.click()}
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={e => { e.preventDefault(); setDragOver(false); uploadFiles(e.dataTransfer.files); }}
                        className="flex flex-col items-center justify-center text-center border border-dashed rounded-lg p-8 cursor-pointer transition-colors"
                        style={{
                            borderColor: 'var(--filter-accent)',
                            background: dragOver
                                ? 'color-mix(in srgb, var(--filter-accent) 12%, white)'
                                : 'color-mix(in srgb, var(--filter-accent) 5%, white)',
                        }}
                    >
                        <FiUploadCloud size={26} style={{ color: 'var(--filter-accent)' }} />
                        <p className="text-[15px] font-bold mt-2" style={{ color: TEXT }}>
                            {uploading ? 'Uploading…' : 'Drag & Drop Images Here'}
                        </p>
                        <p className="text-[14px] text-gray-500 mt-1">or click to browse files ( {MAX_IMAGES} max )</p>
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            hidden
                            onChange={e => { uploadFiles(e.target.files); e.target.value = ''; }}
                        />
                    </div>

                    {images.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {images.map(url => (
                                <div key={url} className="relative">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={url} alt="" className="w-16 h-16 object-cover rounded border border-gray-200" />
                                    <button
                                        onClick={() => setImages(prev => prev.filter(u => u !== url))}
                                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
                                        aria-label="Remove image"
                                    >
                                        <FiX size={11} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Rating + name + submit */}
                    <div className="flex flex-wrap items-end justify-between gap-4 mt-5">
                        <div className="flex flex-wrap gap-4">
                            <div>
                                <label className="block text-[14px] mb-1.5" style={{ color: TEXT }}>Your Rating:</label>
                                <select
                                    value={rating}
                                    onChange={e => setRating(e.target.value)}
                                    className="w-[220px] border border-gray-300 rounded px-3 py-2.5 text-[14px] text-gray-700 outline-none focus:border-[var(--filter-accent)] bg-white"
                                >
                                    <option value="">Select One</option>
                                    <option value="5">★★★★★ (5)</option>
                                    <option value="4">★★★★ (4)</option>
                                    <option value="3">★★★ (3)</option>
                                    <option value="2">★★ (2)</option>
                                    <option value="1">★ (1)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[14px] mb-1.5" style={{ color: TEXT }}>Your Name:</label>
                                <input
                                    value={userName}
                                    onChange={e => setUserName(e.target.value)}
                                    placeholder="Anonymous"
                                    className="w-[220px] border border-gray-300 rounded px-3 py-2.5 text-[14px] text-gray-700 outline-none focus:border-[var(--filter-accent)]"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || uploading}
                            className="bg-[#3a3a3a] hover:bg-black text-white text-[13px] font-bold tracking-wide uppercase px-8 py-3.5 transition-colors disabled:opacity-60"
                        >
                            {isSubmitting ? 'Submitting…' : 'Submit Review'}
                        </button>
                    </div>
                </div>
            </div>
            )}

            {showList && (
            <div className={showSubmit ? 'mt-10 pt-8 border-t border-gray-200' : ''}>
                {showSubmit && (
                    <h3 className="text-[18px] font-bold mb-6" style={{ color: TEXT }}>
                        Customer Reviews ({summary.total})
                    </h3>
                )}
                {reviews.length > 0 ? (
                    <div className="space-y-8">
                    {reviews.map(r => (
                        <div key={r._id} className="flex gap-5">
                            <div className="w-14 h-14 shrink-0 rounded-full bg-[#f0f0f0] flex items-center justify-center overflow-hidden">
                                {r.user?.avatar ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={r.user.avatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-[20px] font-bold text-gray-400">
                                        {initials(r.userName || r.user?.firstName)}
                                    </span>
                                )}
                            </div>
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-[16px] font-bold" style={{ color: ACCENT }}>
                                        {r.userName || [r.user?.firstName, r.user?.lastName].filter(Boolean).join(' ') || 'Anonymous'}
                                    </span>
                                    <span className="text-[13px] text-gray-500">{formatDate(r.createdAt)}</span>
                                </div>
                                <div className="mt-1"><Stars value={r.rating} size={13} /></div>
                                {r.comment && (
                                    <p className="mt-2 text-[15px] text-gray-700 leading-relaxed">{r.comment}</p>
                                )}
                                {Array.isArray(r.images) && r.images.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {r.images.map((url: string) => (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img key={url} src={url} alt="" className="w-20 h-20 object-cover rounded border border-gray-200" />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    </div>
                ) : (
                    <p className="text-[14px] text-gray-500">No reviews yet — be the first to review this product.</p>
                )}
            </div>
            )}
        </div>
    );
};

export default ProductReviews;
