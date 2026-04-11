"use client";

import { useState } from "react";
import { submitReview } from "@/actions/reviews";

interface Props {
  storeId: number;
  existingRating?: number;
  existingComment?: string;
  onDone: () => void;
}

export default function ReviewForm({ storeId, existingRating, existingComment, onDone }: Props) {
  const [rating, setRating] = useState(existingRating ?? 0);
  const [comment, setComment] = useState(existingComment ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = async () => {
    if (rating < 1) { setError("Select a rating"); return; }
    setSubmitting(true);
    setError("");
    const result = await submitReview(storeId, rating, comment);
    setSubmitting(false);
    if ("error" in result) { setError(result.error ?? "Unknown error"); return; }
    onDone();
  };

  return (
    <div className="py-4">
      {/* Star selector */}
      <div className="flex gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onMouseEnter={() => setHoverRating(i)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(i)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", minWidth: "44px", minHeight: "44px" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill={(hoverRating || rating) >= i ? "#fff" : "none"} stroke="#fff" strokeWidth="1.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        ))}
        {rating > 0 && <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", alignSelf: "center", marginLeft: "8px" }}>{rating}/5</span>}
      </div>

      {/* Comment */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Write your review (optional)"
        rows={3}
        className="w-full px-3 py-2 outline-none resize-none mb-3"
        style={{ fontSize: "12px", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }}
      />

      {error && <p style={{ fontSize: "11px", color: "rgba(220,80,80,0.8)", marginBottom: "8px" }}>{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          style={{ fontSize: "10px", letterSpacing: "0.1em", background: "#fff", color: "#2D2323", border: "none", padding: "8px 20px", cursor: submitting ? "default" : "pointer", fontWeight: 700, opacity: submitting ? 0.6 : 1 }}
        >
          {submitting ? "Saving..." : existingRating ? "Update review" : "Submit review"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="action-icon"
          style={{ fontSize: "10px", letterSpacing: "0.1em", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.4)", background: "transparent", padding: "8px 16px", cursor: "pointer", fontWeight: 700 }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
