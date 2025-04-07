"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [accountUrl, setAccountUrl] = useState<string | null>(null);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [sendingPayment, setSendingPayment] = useState(false);

  const handleGetMoney = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/money");
      const data = await response.json();
      setAccountUrl(data.url);
      setAccountId(data.accountId);
    } catch (error) {
      console.error("Error fetching money:", error);
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
          setLoading(false);
          clearInterval(pollInterval);

          // Set payment loading state
          setSendingPayment(true);

          // Initiate payment
          const paymentResponse = await fetch("/api/payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accountId }),
          });
          const paymentData = await paymentResponse.json();

          if (paymentData.success) {
            setPaymentId(paymentData.paymentId);
          } else {
            setPaymentError(paymentData.error);
          }
          setSendingPayment(false);
        }
      } catch (error) {
        console.error("Error:", error);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [accountId, isOnboarded]);

  // Add new useEffect to watch accountUrl
  useEffect(() => {
    if (accountUrl) {
      window.open(accountUrl, "_blank");
    }
  }, [accountUrl]);

  return (
    <div className="grid place-items-center min-h-screen bg-slate-900">
      <div className="flex flex-col items-center gap-8 w-full max-w-2xl">
        <button
          onClick={handleGetMoney}
          disabled={loading}
          className="px-8 py-4 rounded-full text-2xl font-bold text-black
          bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300
          hover:scale-105 transition-transform
          shadow-lg shadow-amber-200/20
          disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className={loading ? "animate-ping" : ""}>
            {loading ? "Getting Money..." : "Get Money"}
          </span>
        </button>

        {/* Debug Panel */}
        <div className="bg-slate-800 p-6 rounded-lg w-full text-sm font-mono">
          <h2 className="text-white text-lg font-bold mb-4">Debug Log</h2>
          <div className="space-y-2">
            {accountId && (
              <div className="text-green-400">
                ✓ Account created: {accountId}
              </div>
            )}
            {accountUrl && (
              <div className="text-blue-400 space-y-1">
                <div className="flex items-center gap-2">
                  ℹ️ Account link URL available
                  <button
                    onClick={() => window.open(accountUrl, "_blank")}
                    className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                  >
                    Open URL
                  </button>
                </div>
                <div className="text-blue-300 text-xs break-all pl-4">
                  {accountUrl}
                </div>
              </div>
            )}
            {accountId && !isOnboarded && (
              <div className="animate-pulse text-yellow-400 flex items-center gap-2">
                <span className="">⟳</span>
                Waiting for account to be onboarded...
              </div>
            )}
            {isOnboarded && (
              <>
                <div className="text-green-400">
                  ✓ Account successfully onboarded!
                </div>
                {sendingPayment && (
                  <div className="animate-pulse text-yellow-400 flex items-center gap-2">
                    <span>⟳</span>
                    Sending outbound payment...
                  </div>
                )}
                {paymentId && (
                  <div className="text-green-400">
                    ✓ Payment sent! ID: {paymentId}
                  </div>
                )}
                {paymentError && (
                  <div className="text-red-400">
                    ✗ Payment failed: {paymentError}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
