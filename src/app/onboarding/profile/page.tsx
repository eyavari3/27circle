"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

export default function ProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    gender: "",
    dob: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    // 1. Sign up user with phone
    const { /* data: signUpData, */ error: signUpError } = await supabase.auth.signInWithOtp({
      phone: form.phone,
    });
    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }
    // 2. Save profile to public.users
    const { error: profileError } = await supabase.from("users").insert([
      {
        phone: form.phone,
        full_name: form.fullName,
        gender: form.gender,
        dob: form.dob,
      },
    ]);
    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }
    setLoading(false);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('onboarding_phone', form.phone);
    }
    router.push("/onboarding/verify");
  };

  return (
    <main className="max-w-md mx-auto py-12">
      <h1 className="text-2xl font-bold mb-6">A Few Final Details</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Full Name</label>
          <input name="fullName" type="text" required className="w-full border rounded px-3 py-2" value={form.fullName} onChange={handleChange} />
        </div>
        <div>
          <label className="block mb-1">Gender</label>
          <select name="gender" required className="w-full border rounded px-3 py-2" value={form.gender} onChange={handleChange}>
            <option value="">Select...</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block mb-1">Date of Birth</label>
          <input name="dob" type="date" required className="w-full border rounded px-3 py-2" value={form.dob} onChange={handleChange} />
        </div>
        <div>
          <label className="block mb-1">Phone Number</label>
          <input name="phone" type="tel" required className="w-full border rounded px-3 py-2" value={form.phone} onChange={handleChange} />
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <button type="submit" className="w-full bg-primary text-white py-2 rounded" disabled={loading}>
          {loading ? "Submitting..." : "Complete My Journey"}
        </button>
      </form>
    </main>
  );
} 