"use client";
import { useState } from "react";
import Image from "next/image";

export default function Home() {
  const [loading, setLoading] = useState(false);

  const handleGetMoney = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/money");
      const data = await response.json();
      window.open(data.url, "_blank");
    } catch (error) {
      console.error("Error fetching money:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid place-items-center min-h-screen bg-slate-900">
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
    </div>
  );
}
