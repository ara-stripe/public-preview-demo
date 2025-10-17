"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [accountUrl, setAccountUrl] = useState<string | null>(null);

  const handleGetMoney = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/money");
      const data = await response.json();
      setAccountUrl(data.url);
      setAccountId(data.accountId);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching money:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accountUrl) {
      window.open(accountUrl, "_blank");
    }
  }, [accountUrl]);

  return (
    <div className="grid place-items-center min-h-screen bg-gradient-to-br from-[#0866FF] via-[#0a7cff] to-[#0866FF]">
      <div className="flex flex-col items-center gap-8 w-full max-w-2xl">
        <button
          onClick={handleGetMoney}
          disabled={loading}
          className="px-8 py-4 rounded-full text-2xl font-bold text-[#1877F2]
          bg-white
          hover:scale-105 transition-transform
          shadow-2xl shadow-black/30
          disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className={loading ? "animate-ping" : ""}>
            {loading ? "Getting Paid..." : "Get Paid"}
          </span>
        </button>

        {/* Debug Panel */}
        <div className="bg-white/95 p-6 rounded-lg w-full text-sm font-mono shadow-xl">
          <h2 className="text-[#1877F2] text-lg font-bold mb-4">Debug Log</h2>
          <div className="space-y-2">
            {accountId && (
              <div className="text-green-600">
                ✓ Account created: {accountId}
              </div>
            )}
            {accountUrl && (
              <div className="text-[#0866FF] space-y-1">
                <div className="flex items-center gap-2">
                  ℹ️ Account link URL available
                  <button
                    onClick={() => window.open(accountUrl, "_blank")}
                    className="px-2 py-1 bg-[#1877F2] text-white rounded hover:bg-[#0866FF] text-xs"
                  >
                    Open URL
                  </button>
                </div>
                <div className="text-[#0866FF]/80 text-xs break-all pl-4">
                  {accountUrl}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
