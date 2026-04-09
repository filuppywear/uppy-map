"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getMyProposals, cancelProposal, type Proposal } from "@/actions/proposals";
import Image from "next/image";
import PageHeader from "@/components/PageHeader";

const STATUS_COLORS: Record<string, string> = {
  pending: "rgba(255,200,50,0.8)",
  approved: "rgba(100,220,100,0.8)",
  rejected: "rgba(220,80,80,0.8)",
  cancelled: "rgba(255,255,255,0.3)",
};

const TYPE_LABELS: Record<string, string> = {
  new_store: "New store",
  edit_store: "Edit",
  remove_store: "Removal",
};

export default function ProposalsPage() {
  const { isLoggedIn, loading: authLoading } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) return;
    void getMyProposals().then((data) => { setProposals(data); setLoading(false); });
  }, [isLoggedIn]);

  const handleCancel = async (id: string) => {
    const result = await cancelProposal(id);
    if ("success" in result) {
      setProposals((prev) => prev.map((p) => p.id === id ? { ...p, status: "cancelled" } : p));
    }
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: "#302020" }}><p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>Loading...</p></div>;
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6" style={{ background: "#302020" }}>
        <Image src="/branding/logo-white.svg" alt="Uppy" width={80} height={28} style={{ filter: "brightness(10)" }} />
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>Sign in to see your proposals.</p>
        <Link href="/" style={{ fontSize: "12px", background: "#fff", color: "#302020", textDecoration: "none", padding: "10px 24px", fontWeight: 700 }}>Go to map</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#302020" }}>
      <PageHeader activePage="map" />
      <div className="max-w-2xl mx-auto p-6 pt-8">
        <h1 className="font-bold uppercase mb-2" style={{ fontSize: "16px", letterSpacing: "0.08em", color: "#fff" }}>My Proposals</h1>
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }} className="mb-8">{proposals.length} total</p>

        {loading ? (
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>Loading...</p>
        ) : proposals.length === 0 ? (
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)" }} className="text-center py-12">No proposals yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {proposals.map((p) => (
              <div key={p.id} className="p-4" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold uppercase" style={{ fontSize: "9px", letterSpacing: "0.12em", color: STATUS_COLORS[p.status] }}>{p.status}</span>
                  <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)" }}>•</span>
                  <span className="font-bold uppercase" style={{ fontSize: "9px", letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)" }}>{TYPE_LABELS[p.type] || p.type}</span>
                </div>
                <div className="font-bold" style={{ fontSize: "13px", color: "#fff" }}>{p.name || `Store #${p.store_id}`}</div>
                {p.city && <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>{p.city}{p.country ? `, ${p.country}` : ""}</div>}
                {p.reason && <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>Reason: {p.reason}</div>}
                {p.reviewer_note && <div style={{ fontSize: "11px", color: "#A58277", marginTop: "4px" }}>Admin: {p.reviewer_note}</div>}
                <div className="flex items-center justify-between mt-3">
                  <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)" }}>{new Date(p.created_at).toLocaleDateString()}</span>
                  {p.status === "pending" && (
                    <button type="button" onClick={() => handleCancel(p.id)} className="header-btn font-bold uppercase" style={{ fontSize: "10px", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", background: "none", border: "1px solid rgba(255,255,255,0.15)", padding: "4px 12px", cursor: "pointer" }}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
