"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiDeleteAuth, apiGetAuth, apiPatchAuth, apiPostAuth } from "../../../lib/api";

function safeMessage(error, fallback) {
  return error?.message || fallback;
}

export default function DashboardAccountPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [newPhone, setNewPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [otpHint, setOtpHint] = useState("");

  const [securityPassword, setSecurityPassword] = useState("");
  const [deactivateConfirm, setDeactivateConfirm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const [status, setStatus] = useState({ type: "", message: "" });
  const [busy, setBusy] = useState({
    profile: false,
    otpRequest: false,
    otpVerify: false,
    deactivate: false,
    delete: false,
  });

  const phoneVerified = Boolean(profile?.phoneVerified);
  const accountStatus = profile?.accountStatus || "active";

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("mirai_token") : null;
      if (!token) {
        router.replace(`/login?returnUrl=${encodeURIComponent("/dashboard/account")}`);
        return;
      }

      try {
        const me = await apiGetAuth("/api/v1/auth/me");
        if (cancelled) return;
        if (!me?.user) {
          router.replace(`/login?returnUrl=${encodeURIComponent("/dashboard/account")}`);
          return;
        }
        setProfile(me.user);
        setName(me.user.name || "");
        setEmail(me.user.email || "");
        setPhone(me.user.phone || "");
        setReady(true);
      } catch {
        if (!cancelled) router.replace(`/login?returnUrl=${encodeURIComponent("/dashboard/account")}`);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const hasProfileChanges = useMemo(() => {
    if (!profile) return false;
    return name.trim() !== (profile.name || "") || email.trim().toLowerCase() !== (profile.email || "").toLowerCase();
  }, [email, name, profile]);

  async function updateProfile(event) {
    event.preventDefault();
    if (!hasProfileChanges) return;
    setStatus({ type: "", message: "" });
    setBusy((prev) => ({ ...prev, profile: true }));
    try {
      const data = await apiPatchAuth("/api/v1/auth/profile", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
      });
      const updated = data?.user || {};
      setProfile(updated);
      setName(updated.name || "");
      setEmail(updated.email || "");
      setStatus({ type: "success", message: "Profile updated successfully." });
    } catch (error) {
      setStatus({ type: "error", message: safeMessage(error, "Could not update profile.") });
    } finally {
      setBusy((prev) => ({ ...prev, profile: false }));
    }
  }

  async function requestOtp(event) {
    event.preventDefault();
    setStatus({ type: "", message: "" });
    setBusy((prev) => ({ ...prev, otpRequest: true }));
    try {
      const res = await apiPostAuth("/api/v1/auth/phone/request-otp", { phone: newPhone.trim() });
      setOtpRequested(true);
      setOtpHint(res?.devOtp ? `Dev OTP: ${res.devOtp}` : "OTP sent to your number.");
      setStatus({ type: "success", message: res?.message || "OTP sent successfully." });
    } catch (error) {
      setStatus({ type: "error", message: safeMessage(error, "Could not send OTP.") });
    } finally {
      setBusy((prev) => ({ ...prev, otpRequest: false }));
    }
  }

  async function verifyOtp(event) {
    event.preventDefault();
    setStatus({ type: "", message: "" });
    setBusy((prev) => ({ ...prev, otpVerify: true }));
    try {
      const res = await apiPostAuth("/api/v1/auth/phone/verify-otp", {
        phone: newPhone.trim(),
        code: otpCode.trim(),
      });
      const user = res?.user;
      if (user) {
        setProfile(user);
        setPhone(user.phone || "");
      }
      setNewPhone("");
      setOtpCode("");
      setOtpRequested(false);
      setOtpHint("");
      setStatus({ type: "success", message: "Phone number verified and updated." });
    } catch (error) {
      setStatus({ type: "error", message: safeMessage(error, "Could not verify OTP.") });
    } finally {
      setBusy((prev) => ({ ...prev, otpVerify: false }));
    }
  }

  async function deactivateAccount(event) {
    event.preventDefault();
    if (deactivateConfirm !== "DEACTIVATE") {
      setStatus({ type: "error", message: 'Type "DEACTIVATE" to continue.' });
      return;
    }
    setStatus({ type: "", message: "" });
    setBusy((prev) => ({ ...prev, deactivate: true }));
    try {
      await apiPostAuth("/api/v1/auth/deactivate", { password: securityPassword });
      window.localStorage.removeItem("mirai_token");
      window.dispatchEvent(new Event("mirai-auth-changed"));
      router.replace("/login");
    } catch (error) {
      setStatus({ type: "error", message: safeMessage(error, "Could not deactivate account.") });
    } finally {
      setBusy((prev) => ({ ...prev, deactivate: false }));
    }
  }

  async function deleteAccount(event) {
    event.preventDefault();
    if (deleteConfirm !== "DELETE") {
      setStatus({ type: "error", message: 'Type "DELETE" to continue.' });
      return;
    }
    setStatus({ type: "", message: "" });
    setBusy((prev) => ({ ...prev, delete: true }));
    try {
      await apiDeleteAuth("/api/v1/auth/account", { password: securityPassword });
      window.localStorage.removeItem("mirai_token");
      window.dispatchEvent(new Event("mirai-auth-changed"));
      router.replace("/register");
    } catch (error) {
      setStatus({ type: "error", message: safeMessage(error, "Could not delete account.") });
    } finally {
      setBusy((prev) => ({ ...prev, delete: false }));
    }
  }

  if (!ready) {
    return <p className="text-sm text-slate-400">Loading account settings...</p>;
  }

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Account Settings</h1>
          <p className="mt-1 text-sm text-slate-400">Manage your profile, login credentials, and account controls.</p>
        </div>
        <Link href="/dashboard" className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900">
          Back to dashboard
        </Link>
      </div>

      <div className="rounded-xl border border-slate-800 bg-brandCard p-5">
        <h2 className="text-lg font-semibold text-white">Profile</h2>
        <p className="mt-1 text-xs text-slate-400">Status: {accountStatus === "active" ? "Active" : "Temporarily deactivated"}</p>
        <form onSubmit={updateProfile} className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm text-slate-300">
            Full name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-brandAccent"
            />
          </label>
          <label className="text-sm text-slate-300">
            Email address
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-brandAccent"
            />
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={!hasProfileChanges || busy.profile}
              className="rounded-lg bg-brandAccent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy.profile ? "Saving..." : "Save profile changes"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-slate-800 bg-brandCard p-5">
        <h2 className="text-lg font-semibold text-white">Phone Number</h2>
        <p className="mt-1 text-sm text-slate-300">
          Current: <span className="font-medium text-white">{phone || "Not added"}</span> {phoneVerified ? "(Verified)" : "(Not verified)"}
        </p>
        <form onSubmit={requestOtp} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="min-w-[240px] flex-1 text-sm text-slate-300">
            New mobile number
            <input
              type="text"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="+91XXXXXXXXXX"
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-brandAccent"
            />
          </label>
          <button
            type="submit"
            disabled={!newPhone.trim() || busy.otpRequest}
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {busy.otpRequest ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>

        {otpRequested ? (
          <form onSubmit={verifyOtp} className="mt-3 flex flex-wrap items-end gap-3">
            <label className="min-w-[220px] flex-1 text-sm text-slate-300">
              Enter OTP
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-brandAccent"
              />
            </label>
            <button
              type="submit"
              disabled={!otpCode.trim() || busy.otpVerify}
              className="rounded-lg bg-brandAccent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy.otpVerify ? "Verifying..." : "Verify and update"}
            </button>
          </form>
        ) : null}
        {otpHint ? <p className="mt-2 text-xs text-amber-300">{otpHint}</p> : null}
      </div>

      <div className="rounded-xl border border-rose-900/70 bg-rose-950/20 p-5">
        <h2 className="text-lg font-semibold text-rose-300">Danger Zone</h2>
        <p className="mt-1 text-xs text-rose-200/80">These actions impact access and cannot be undone easily.</p>

        <label className="mt-4 block text-sm text-slate-300">
          Confirm with password
          <input
            type="password"
            value={securityPassword}
            onChange={(e) => setSecurityPassword(e.target.value)}
            className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-rose-400"
          />
        </label>

        <form onSubmit={deactivateAccount} className="mt-4 rounded border border-rose-800/60 p-3">
          <p className="text-sm font-semibold text-white">Temporary deactivate account</p>
          <p className="mt-1 text-xs text-slate-300">Type DEACTIVATE and submit. You will be logged out immediately.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <input
              type="text"
              value={deactivateConfirm}
              onChange={(e) => setDeactivateConfirm(e.target.value)}
              placeholder='Type "DEACTIVATE"'
              className="min-w-[240px] flex-1 rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-rose-400"
            />
            <button
              type="submit"
              disabled={!securityPassword || busy.deactivate}
              className="rounded bg-rose-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy.deactivate ? "Deactivating..." : "Deactivate account"}
            </button>
          </div>
        </form>

        <form onSubmit={deleteAccount} className="mt-3 rounded border border-rose-800/60 p-3">
          <p className="text-sm font-semibold text-white">Delete account permanently</p>
          <p className="mt-1 text-xs text-slate-300">Type DELETE and submit. This permanently removes your account.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder='Type "DELETE"'
              className="min-w-[240px] flex-1 rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-rose-400"
            />
            <button
              type="submit"
              disabled={!securityPassword || busy.delete}
              className="rounded bg-rose-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy.delete ? "Deleting..." : "Delete permanently"}
            </button>
          </div>
        </form>
      </div>

      {status.message ? (
        <p className={`text-sm ${status.type === "success" ? "text-emerald-400" : "text-rose-400"}`}>{status.message}</p>
      ) : null}
    </section>
  );
}
