"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isOnboarded, setIsOnboarded] = useState(false);

  const handleGetMoney = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/money");
      const data = await response.json();
      window.open(data.url, "_blank");
      setAccountId(data.accountId); // Assuming the API returns an accountId
    } catch (error) {
      console.error("Error fetching money:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!accountId || isOnboarded) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch("/api/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accountId }),
        });
        const data = await response.json();

        if (data.isOnboarded) {
          setIsOnboarded(true);
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error("Error polling status:", error);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [accountId, isOnboarded]);

  return (
    <div className="grid place-items-center min-h-screen bg-slate-900">
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={handleGetMoney}
          disabled={loading}
          className="px-8 py-4 rounded-full text-2xl font-bold text-black
          bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300
          hover:scale-105 transition-transform
          shadow-lg shadow-amber-200/20
          disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Getting Money..." : "Get Money"}
        </button>

        {isOnboarded && (
          <div className="text-white text-xl bg-green-600 px-6 py-3 rounded-lg">
            🎉 Account successfully onboarded!
          </div>
        )}
      </div>
    </div>
  );
}
