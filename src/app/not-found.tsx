import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 p-6" style={{ background: "#2D2323" }}>
      <Image src="/branding/logo-white.svg" alt="Uppy" width={80} height={28} style={{ filter: "brightness(10)" }} />
      <h1 className="text-4xl font-bold" style={{ color: "#fff" }}>404</h1>
      <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>This page doesn&apos;t exist.</p>
      <Link href="/" className="text-sm font-bold uppercase tracking-[0.16em] px-6 py-3 mt-2" style={{ background: "#fff", color: "#2D2323", textDecoration: "none" }}>
        Back to map
      </Link>
    </div>
  );
}
