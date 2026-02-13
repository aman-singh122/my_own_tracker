"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { setAuthToken } from "@/lib/auth";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiRequest("/auth/login", {
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
        <h1 className="text-2xl font-bold">Login</h1>
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
          {loading ? "Logging in..." : "Login"}
        </button>
        <button type="button" onClick={() => router.push("/signup")} className="btn btn-muted w-full">
          Create Account
        </button>
      </form>
    </main>
  );
}
