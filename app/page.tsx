"use client";
import { useState } from "react";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [accountUrl, setAccountUrl] = useState<string | null>(null);
  const [bankAccountsEnabled, setBankAccountsEnabled] = useState(true);
  const [cardsEnabled, setCardsEnabled] = useState(false);
  const [prefillIdentity, setPrefillIdentity] = useState(false);
  const [country, setCountry] = useState<"us" | "gb">("us");
  const [useQA, setUseQA] = useState(false);
  const [accountLinkPrefix, setAccountLinkPrefix] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGetMoney = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        bankAccounts: bankAccountsEnabled.toString(),
        cards: cardsEnabled.toString(),
        prefillIdentity: prefillIdentity.toString(),
        country: country,
        useQA: useQA.toString(),
        accountLinkPrefix: accountLinkPrefix,
      });
      const response = await fetch(`/api/money?${params}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      setAccountUrl(data.url);
      setAccountId(data.accountId);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching money:", error);
      setLoading(false);
    }
  };

  // Check if at least one capability is enabled
  const hasCapabilities = bankAccountsEnabled || cardsEnabled;

  // Copy URL to clipboard
  const copyToClipboard = async () => {
    if (accountUrl) {
      try {
        await navigator.clipboard.writeText(accountUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error("Failed to copy:", error);
      }
    }
  };

  return (
    <div className="grid place-items-center min-h-screen bg-black">
      <div className="flex flex-col items-center gap-8 w-full max-w-2xl px-4">
        <p className="text-white text-center text-lg max-w-xl">
          This is a Global Payouts demo page. Hit the button below to create a test recipient and collect details using the Stripe-hosted onboarding form
        </p>
        
        {!accountUrl ? (
          <button
            onClick={handleGetMoney}
            disabled={loading || !hasCapabilities}
            className="px-8 py-4 rounded-full text-2xl font-bold text-black
            bg-white
            hover:scale-105 transition-transform
            shadow-2xl shadow-white/10
            disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className={loading ? "animate-ping" : ""}>
              {loading ? "Loading..." : "Start Demo"}
            </span>
          </button>
        ) : (
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.open(accountUrl, "_blank")}
              disabled={loading}
              className="px-8 py-4 rounded-full text-2xl font-bold text-black
              bg-white
              hover:scale-105 transition-transform
              shadow-2xl shadow-white/10
              disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Open Link
            </button>
            <button
              onClick={handleGetMoney}
              disabled={loading || !hasCapabilities}
              className="px-8 py-4 rounded-full text-2xl font-bold text-black
              bg-white
              hover:scale-105 transition-transform
              shadow-2xl shadow-white/10
              disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Loading..." : "Regenerate Link"}
            </button>
          </div>
        )}

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

            {!hasCapabilities && (
              <p className="text-yellow-400 text-xs mt-2">
                ⚠️ At least one capability must be enabled
              </p>
            )}

            <div className="text-zinc-400 font-bold text-xs uppercase mb-2 mt-4">
              Identity
            </div>

            <label className="flex items-center gap-3 text-white cursor-pointer hover:text-zinc-300">
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value as "us" | "gb")}
                className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
              >
                <option value="us">United States</option>
                <option value="gb">United Kingdom</option>
              </select>
            </label>
            
            <label className="flex items-center gap-3 text-white cursor-pointer hover:text-zinc-300">
              <input
                type="checkbox"
                checked={prefillIdentity}
                onChange={(e) => setPrefillIdentity(e.target.checked)}
                className="w-4 h-4 cursor-pointer"
              />
              <span>Prefill Identity Information</span>
            </label>


            <div className="text-zinc-400 font-bold text-xs uppercase mb-2 mt-4">
              QA/Devbox
            </div>
            <label className="flex items-center gap-3 text-white cursor-pointer hover:text-zinc-300">
              <input
                type="checkbox"
                checked={useQA}
                onChange={(e) => setUseQA(e.target.checked)}
                className="w-4 h-4 cursor-pointer"
              />
              <span>Use QA</span>
            </label>

            {useQA && (
              <div className="ml-7 mt-2">
                <label className="flex flex-col gap-2">
                  <span className="flex items-center gap-3 text-white cursor-pointer hover:text-zinc-300">
                    Devbox account link prefix
                  </span>
                  <span className="text-zinc-400 text-xs font-bold uppercase">
                    USERNAME-DEVBOX_QUALIFIER
                  </span>
                  <input
                    type="text"
                    value={accountLinkPrefix}
                    onChange={(e) => setAccountLinkPrefix(e.target.value)}
                    placeholder="pkbr-0-mx3b"
                    className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </label>
              </div>
            )}
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
                  <div>ℹ️ Account link URL available {copied && <span className="text-green-400">(Copied!)</span>}</div>
                  <div 
                    onClick={copyToClipboard}
                    className="text-blue-300 text-xs break-all pl-4 cursor-pointer hover:text-blue-200 transition-colors"
                  >
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
