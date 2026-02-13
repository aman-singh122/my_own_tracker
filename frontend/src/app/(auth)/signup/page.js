"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { setAuthToken } from "@/lib/auth";

export default function SignupPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiRequest("/auth/signup", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setAuthToken(data.token);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app-shell min-h-screen flex items-center justify-center">
      <form onSubmit={onSubmit} className="panel w-full max-w-md p-6 space-y-4">
        <h1 className="text-2xl font-bold">Create Account</h1>
        <input
          className="input"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          className="input"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          className="input"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
          minLength={6}
        />
        {error ? <p className="text-red-400 text-sm">{error}</p> : null}
        <button disabled={loading} className="btn btn-primary w-full" type="submit">
          {loading ? "Creating..." : "Sign Up"}
        </button>
        <button type="button" onClick={() => router.push("/login")} className="btn btn-muted w-full">
          Go to Login
        </button>
      </form>
    </main>
  );
}
