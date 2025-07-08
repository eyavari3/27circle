"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

export default function VerifyPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (code !== "123456") {
      setError("Invalid code. For V1 testing, the code is 123456.");
      setLoading(false);
      return;
    }
    // Fake: get phone from localStorage/session (in real app, store after profile step)
    const phone = window.localStorage.getItem("onboarding_phone");
    if (!phone) {
      setError("Phone number not found. Please restart onboarding.");
      setLoading(false);
      return;
    }
    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone,
      token: code,
      type: "sms",
    });
    if (verifyError) {
      setError(verifyError.message);
      setLoading(false);
      return;
    }
    setLoading(false);
    router.push("/onboarding/curiosity-1");
  };

  return (
    <main className="max-w-md mx-auto py-12">
      <h1 className="text-2xl font-bold mb-6">Verification</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Verification Code</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={code}
            onChange={e => setCode(e.target.value)}
            required
          />
          <div className="text-xs text-gray-500 mt-1">For V1 testing, the code is <span className="font-mono">123456</span>.</div>
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <button type="submit" className="w-full bg-primary text-white py-2 rounded" disabled={loading}>
          {loading ? "Verifying..." : "Verify code"}
        </button>
      </form>
    </main>
  );
} 