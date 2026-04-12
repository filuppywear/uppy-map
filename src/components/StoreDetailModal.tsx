"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type MouseEvent, type TouchEvent } from "react";
import { formatCategoryLabel, hasStoreCoordinates, type Store } from "@/lib/types";
import { getStoreReviews, getMyReview, type Review } from "@/actions/reviews";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import ReviewForm from "./ReviewForm";
import ProposalForm from "./ProposalForm";

interface Props {
  store: Store | null;
  onClose: () => void;
  isSaved?: boolean;
  onToggleSave?: (storeId: number) => void;
}

type TabKey = "reviews" | "photos";

function ImageGallery({ images, name, storeId, onPhotoUploaded }: { images: string[]; name: string; storeId: number; onPhotoUploaded?: (url: string) => void }) {
  const [index, setIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const go = (dir: 1 | -1) => {
    if (images.length <= 1) return;
    setIndex((i) => {
      const next = i + dir;
      if (next < 0) return images.length - 1;
      if (next >= images.length) return 0;
      return next;
    });
  };

  const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0];
    touchStartX.current = t.clientX;
    touchStartY.current = t.clientY;
  };

  const onTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    const startX = touchStartX.current;
    const startY = touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    if (startX == null || startY == null) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    // Only trigger horizontal swipe if it clearly dominates vertical
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    go(dx < 0 ? 1 : -1);
  };

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { uploadStorePhoto } = await import("@/actions/photos");
      const fd = new FormData();
      fd.append("photo", file);
      const result = await uploadStorePhoto(storeId, fd);
      if (result.url) onPhotoUploaded?.(result.url);
    } catch {
      // silent — will show in console
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (images.length === 0) {
    return (
      <div
        className="relative aspect-[16/9] max-h-[35vh] sm:max-h-none flex flex-col items-center justify-center gap-3 cursor-pointer"
        style={{ background: "linear-gradient(135deg, rgba(45,35,35,0.9), rgba(45,35,35,0.5))" }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        {uploading ? (
          <div className="w-6 h-6 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />
        ) : (
          <>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.35, color: "#fff" }}>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <p className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: "rgba(255,255,255,0.42)" }}>
              Add a photo
            </p>
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] px-2 py-0.5" style={{ color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.15)" }}>
              Earn 3 points
            </span>
          </>
        )}
      </div>
    );
  }

  const hasMany = images.length > 1;

  return (
    <div
      className="relative aspect-[16/9] overflow-hidden max-h-[35vh] sm:max-h-none select-none"
      style={{ background: "#d8cfc6", touchAction: "pan-y" }}
      onTouchStart={hasMany ? onTouchStart : undefined}
      onTouchEnd={hasMany ? onTouchEnd : undefined}
    >
      <img src={images[index]} alt={name} className="h-full w-full object-cover" loading="eager" draggable={false} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/0 to-transparent pointer-events-none" />

      {hasMany && (
        <>
          <div
            className="absolute top-4 right-4 px-3 py-1.5 text-[11px] font-bold"
            style={{ background: "rgba(36,27,25,0.56)", color: "#fff" }}
          >
            {index + 1} / {images.length}
          </div>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); go(-1); }}
            aria-label="Previous image"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center"
            style={{ background: "rgba(36,27,25,0.42)", color: "#fff", border: "none" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); go(1); }}
            aria-label="Next image"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center"
            style={{ background: "rgba(36,27,25,0.42)", color: "#fff", border: "none" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          </button>

          {images.length <= 10 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setIndex(i); }}
                  aria-label={`Go to image ${i + 1}`}
                  className="flex items-center justify-center"
                  style={{ width: 28, height: 28, background: "transparent", border: "none", padding: 0, cursor: "pointer" }}
                >
                  <span style={{ display: "block", width: 10, height: 10, background: i === index ? "#fff" : "rgba(255,255,255,0.45)", transition: "background 0.15s" }} />
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function StoreDetailModal({ store, onClose, isSaved = false, onToggleSave }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("reviews");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [myReview, setMyReview] = useState<{ rating: number; comment: string | null } | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [proposalMode, setProposalMode] = useState<"edit" | "remove" | null>(null);
  const availableTabs = useMemo<TabKey[]>(
    () => (store?.images.length ? ["reviews", "photos"] : ["reviews"]),
    [store]
  );
  const currentTab = availableTabs.includes(activeTab) ? activeTab : "reviews";

  useEffect(() => {
    if (!store) return;

    let cancelled = false;

    void Promise.all([getStoreReviews(store.id), getMyReview(store.id)]).then(
      ([revs, mine]) => {
        if (cancelled) return;
        setReviews(revs);
        setMyReview(mine);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [store]);

  useEffect(() => {
    if (!store) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [store, onClose]);

  useBodyScrollLock(!!store);

  if (!store) return null;

  const rating = store.rating || 0;
  const location = [store.city, store.country].filter(Boolean).join(", ");
  const tags = store.tags ? store.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

  const handleDirections = () => {
    if (hasStoreCoordinates(store)) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`, "_blank");
    }
  };

  const handleShare = async () => {
    const url = window.location.origin + "/?store=" + store.id;
    if (navigator.share) {
      try { await navigator.share({ title: store.name, url }); return; } catch { /* fall through to clipboard */ }
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
    }
  };

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    event.preventDefault();
    event.stopPropagation();
    onClose();
  };

  const handleCloseClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end lg:items-center justify-center p-0 lg:p-6"
      style={{ background: "var(--overlay-dark)", backdropFilter: "blur(10px)" }}
      onClick={handleBackdropClick}
    >
      <div
        className="relative w-full lg:max-w-2xl max-h-[calc(100dvh-var(--sai-top))] lg:max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#2D2323", boxShadow: "0 28px 80px rgba(36,27,25,0.24)", overscrollBehavior: "contain" }}
      >
        {/* Top actions — heart + close */}
        <div className="absolute right-3 z-10 flex items-center gap-1.5" style={{ top: "calc(0.75rem + var(--sai-top))" }}>
          {onToggleSave && (
            <button type="button" onClick={() => onToggleSave(store.id)} className="header-btn p-3 min-w-[44px] min-h-[44px] flex items-center justify-center" style={{ color: isSaved ? "#fff" : "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
            </button>
          )}
          <button type="button" onClick={handleCloseClick} className="header-btn p-3 min-w-[44px] min-h-[44px] flex items-center justify-center" style={{ color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        {/* Gallery */}
        <ImageGallery key={store.id} images={store.images} name={store.name} storeId={store.id} />

        <div className="p-5 lg:p-6" style={{ paddingBottom: "calc(1.25rem + var(--sai-bottom))" }}>
          {/* Category badge */}
          {store.category && (
            <span className="inline-block px-2 py-0.5 font-bold uppercase mb-2" style={{ fontSize: "10px", letterSpacing: "0.1em", background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.5)" }}>
              {formatCategoryLabel(store.category)}
            </span>
          )}

          {/* Name */}
          <h2 className="text-lg font-black uppercase tracking-tight leading-tight pr-20 break-words" style={{ color: "#fff" }}>
            {store.name}
          </h2>

          {/* Location */}
          {location && (
            <div className="flex items-center gap-1 mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
              <span className="text-[11px]">{location}</span>
            </div>
          )}

          {/* Rating */}
          {rating > 0 && (
            <div className="flex items-center gap-1.5 mt-3">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={rating >= i ? "#fff" : "none"} stroke="#fff" strokeWidth="1.5">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ))}
              </div>
              <span className="text-[11px] font-bold" style={{ color: "rgba(255,255,255,0.6)" }}>{rating.toFixed(1)}</span>
            </div>
          )}

          {/* Actions — icon row */}
          <div className="flex items-center gap-3 mt-4">
            <button type="button" onClick={handleShare} className="action-icon p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center" style={{ color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer" }} title="Share">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
            </button>
            {hasStoreCoordinates(store) && (
              <button type="button" onClick={handleDirections} className="action-icon p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center" style={{ color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer" }} title="Directions">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
              </button>
            )}
            {store.website && (
              <a href={store.website.startsWith("http") ? store.website : `https://${store.website}`} target="_blank" rel="noopener noreferrer" className="action-icon p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center" style={{ color: "rgba(255,255,255,0.4)", background: "none", border: "none" }} title="Website">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
              </a>
            )}
            {store.instagram && (
              <a href={`https://instagram.com/${store.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="action-icon p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center" style={{ color: "rgba(255,255,255,0.4)", background: "none", border: "none" }} title="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
              </a>
            )}
          </div>

          {/* Description */}
          {store.description && (
            <p className="mt-5 text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
              {store.description}
            </p>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 font-bold uppercase" style={{ fontSize: "10px", letterSpacing: "0.08em", background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Divider */}
          <div className="mt-6 mb-5" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }} />

          {/* Community tabs */}
          <div className="flex gap-4 mb-5">
            {availableTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="font-bold uppercase pb-1 min-h-[44px] flex items-center"
                style={{
                  fontSize: "12px",
                  letterSpacing: "0.12em",
                  color: currentTab === tab ? "#fff" : "rgba(255,255,255,0.3)",
                  background: "none",
                  borderTop: "none",
                  borderLeft: "none",
                  borderRight: "none",
                  borderBottomWidth: "2px",
                  borderBottomStyle: "solid",
                  borderBottomColor: currentTab === tab ? "#fff" : "transparent",
                  cursor: "pointer",
                  transition: "color 0.15s",
                }}
              >
                {tab === "reviews" ? "reviews" : "photos"}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="min-h-[80px]">
            {currentTab === "reviews" && (
              <div>
                {showReviewForm ? (
                  <ReviewForm
                    storeId={store.id}
                    existingRating={myReview?.rating}
                    existingComment={myReview?.comment ?? undefined}
                    onDone={async () => {
                      setShowReviewForm(false);
                      const [revs, mine] = await Promise.all([
                        getStoreReviews(store.id),
                        getMyReview(store.id),
                      ]);
                      setReviews(revs);
                      setMyReview(mine);
                    }}
                  />
                ) : (
                  <>
                    <button type="button" onClick={() => setShowReviewForm(true)} className="action-icon mb-4 px-4 py-2 font-bold uppercase" style={{ fontSize: "10px", letterSpacing: "0.1em", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)", background: "transparent", cursor: "pointer" }}>
                      {myReview ? "Edit your review" : "Write a review"}
                    </button>
                    {reviews.length === 0 ? (
                      <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>No reviews yet. Be the first!</p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {reviews.map((r) => (
                          <div key={r.id} className="py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                            <div className="flex items-center gap-2 mb-1">
                              <div className="flex gap-0.5">
                                {[1,2,3,4,5].map((i) => (
                                  <svg key={i} width="10" height="10" viewBox="0 0 24 24" fill={r.rating >= i ? "#fff" : "none"} stroke="#fff" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                ))}
                              </div>
                              <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>{r.username || "Anonymous"}</span>
                            </div>
                            {r.comment && <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", lineHeight: "1.5" }}>{r.comment}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            {currentTab === "photos" && (
              <div className="grid grid-cols-2 gap-3">
                {store.images.map((image, index) => (
                  <div
                    key={`${store.id}-photo-${index}`}
                    className="overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  >
                    <img
                      src={image}
                      alt={`${store.name} photo ${index + 1}`}
                      className="h-40 w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Report + Suggest edit */}
          <div className="mt-6 pt-4 flex items-center gap-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <button type="button" onClick={() => setProposalMode("remove")} className="header-btn flex items-center gap-1.5 font-bold uppercase min-h-[44px]" style={{ fontSize: "10px", letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)", background: "none", border: "none", cursor: "pointer" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
              Report a problem
            </button>
            <button type="button" onClick={() => setProposalMode("edit")} className="header-btn flex items-center gap-1.5 font-bold uppercase min-h-[44px]" style={{ fontSize: "10px", letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)", background: "none", border: "none", cursor: "pointer" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
              Suggest an edit
            </button>
          </div>

          {/* Proposal modal */}
          {proposalMode && (
            <ProposalForm mode={proposalMode} store={store} onClose={() => setProposalMode(null)} onSuccess={() => setProposalMode(null)} />
          )}
        </div>
      </div>
    </div>
  );
}
