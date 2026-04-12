import Link from "next/link";
import LeaderboardView from "@/components/LeaderboardView";
import PageHeader from "@/components/PageHeader";

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen arcade-cabinet">
      <PageHeader activePage="leaderboard" />
      <LeaderboardView
        wrapperClassName=""
        containerClassName="max-w-xl mx-auto px-2 sm:px-4 md:px-6 py-10"
        footerSlot={
          <div className="text-center mt-8">
            <Link
              href="/"
              className="arcade-btn inline-block px-6 py-3"
              style={{ fontSize: "clamp(7px, 1.5vw, 9px)" }}
            >
              EXPLORE THE MAP
            </Link>
          </div>
        }
      />
    </div>
  );
}
