"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [accountUrl, setAccountUrl] = useState<string | null>(null);
  const [bankAccountsEnabled, setBankAccountsEnabled] = useState(false);
  const [cardsEnabled, setCardsEnabled] = useState(false);
  const [prefillIdentity, setPrefillIdentity] = useState(false);

  // Track settings used for current URL to detect changes
  const [lastBankAccountsEnabled, setLastBankAccountsEnabled] = useState<boolean | null>(null);
  const [lastCardsEnabled, setLastCardsEnabled] = useState<boolean | null>(null);
  const [lastPrefillIdentity, setLastPrefillIdentity] = useState<boolean | null>(null);

  const handleGetMoney = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        bankAccounts: bankAccountsEnabled.toString(),
        cards: cardsEnabled.toString(),
        prefillIdentity: prefillIdentity.toString(),
      });
      const response = await fetch(`/api/money?${params}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      setAccountUrl(data.url);
      setAccountId(data.accountId);

      // Save the settings used for this URL generation
      setLastBankAccountsEnabled(bankAccountsEnabled);
      setLastCardsEnabled(cardsEnabled);
      setLastPrefillIdentity(prefillIdentity);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching money:", error);
      setLoading(false);
    }
  };

  // Check if settings have changed since last URL generation
  const settingsChanged = accountUrl !== null && (
    lastBankAccountsEnabled !== bankAccountsEnabled ||
    lastCardsEnabled !== cardsEnabled ||
    lastPrefillIdentity !== prefillIdentity
  );

  // Determine button text and action
  const getButtonConfig = () => {
    if (!accountUrl) {
      return { text: "Start Demo", action: handleGetMoney };
    }
    if (settingsChanged) {
      return { text: "Regenerate Link", action: handleGetMoney };
    }
    return { text: "Open Link", action: () => window.open(accountUrl, "_blank") };
  };

  const buttonConfig = getButtonConfig();

  return (
    <div className="grid place-items-center min-h-screen bg-black">
      <div className="flex flex-col items-center gap-8 w-full max-w-2xl px-4">
        <p className="text-white text-center text-lg max-w-xl">
          This is a Global Payouts demo page. Hit the button below to create a test recipient and collect details using the Stripe-hosted onboarding form
        </p>
        <button
          onClick={buttonConfig.action}
          disabled={loading}
          className="px-8 py-4 rounded-full text-2xl font-bold text-black
          bg-white
          hover:scale-105 transition-transform
          shadow-2xl shadow-white/10
          disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className={loading ? "animate-ping" : ""}>
            {loading ? "Loading..." : buttonConfig.text}
          </span>
        </button>

        {/* Debug Panel */}
        <div className="bg-zinc-900 p-6 rounded-lg w-full text-sm font-mono border border-zinc-800">
          <h2 className="text-white text-lg font-bold mb-4">Debug Settings</h2>

          {/* Configuration Section */}
          <div className="space-y-3 mb-6 pb-6 border-b border-zinc-700">
            <div className="text-zinc-400 font-bold text-xs uppercase mb-2">
              Capabilities
            </div>
            <label className="flex items-center gap-3 text-white cursor-pointer hover:text-zinc-300">
              <input
                type="checkbox"
                checked={bankAccountsEnabled}
                onChange={(e) => setBankAccountsEnabled(e.target.checked)}
                className="w-4 h-4 cursor-pointer"
              />
              <span>Bank Accounts</span>
            </label>
            <label className="flex items-center gap-3 text-white cursor-pointer hover:text-zinc-300">
              <input
                type="checkbox"
                checked={cardsEnabled}
                onChange={(e) => setCardsEnabled(e.target.checked)}
                className="w-4 h-4 cursor-pointer"
              />
              <span>Cards</span>
            </label>

            <div className="text-zinc-400 font-bold text-xs uppercase mb-2 mt-4">
              Identity
            </div>
            <label className="flex items-center gap-3 text-white cursor-pointer hover:text-zinc-300">
              <input
                type="checkbox"
                checked={prefillIdentity}
                onChange={(e) => setPrefillIdentity(e.target.checked)}
                className="w-4 h-4 cursor-pointer"
              />
              <span>Prefill Identity Information</span>
            </label>
          </div>

          {/* Log Section */}
          <div>
            <h3 className="text-white font-bold mb-2">Log</h3>
            <div className="space-y-2">
              {accountId && (
                <div className="text-green-400">
                  ✓ Account created: {accountId}
                </div>
              )}
              {accountUrl && (
                <div className="text-blue-400 space-y-1">
                  <div>ℹ️ Account link URL available</div>
                  <div className="text-blue-300 text-xs break-all pl-4">
                    {accountUrl}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
