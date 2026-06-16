"use client";

import React, { useState } from "react";
import { useIC3 } from "../lib/ic3store";
import { Mail, Lock, ShieldAlert, CheckCircle, ArrowLeft } from "lucide-react";

interface AuthViewsProps {
  flow: "login" | "register" | "forgot";
  onSwitchFlow: (flow: "login" | "register" | "forgot" | null) => void;
}

export default function AuthViews({ flow, onSwitchFlow }: AuthViewsProps) {
  const { loginWithEmail } = useIC3();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await loginWithEmail(email.trim(), password);
      onSwitchFlow(null); // Close auth overlay on success
    } catch (err: any) {
      console.error(err);
      const msg = String(err.message || err).toLowerCase();
      if (msg.includes("invalid-credential") || msg.includes("auth/invalid-credential")) {
        setError("Email hoặc mật khẩu không chính xác. Hãy kiểm tra thông tin đăng nhập.");
      } else if (msg.includes("quản trị viên")) {
        setError("Tài khoản của bạn không có đặc quyền Quản trị viên tối cao.");
      } else {
        setError(err.message || "Quá trình đăng nhập thất bại. Vui lòng liên hệ hỗ trợ.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 md:p-8 shadow-xl max-w-md w-full mx-auto space-y-6" id="auth-panel-container">
      {/* Back button */}
      <button
        onClick={() => onSwitchFlow(null)}
        className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-bold transition text-xs"
        id="btn-back-to-portal"
      >
        <ArrowLeft className="w-4 h-4" />
        Hủy & Quay lại Trang chủ
      </button>

      {/* Header text */}
      <div className="text-center">
        <h2 className="text-2xl font-extrabold font-display tracking-tight text-slate-900" id="auth-header-title">
          Đăng Nhập Quản Trị
        </h2>
        <p className="text-xs text-slate-500 mt-1" id="auth-header-subtext">
          Vui lòng nhập tài khoản Admin duy nhất của hệ thống IC3 Master.
        </p>
      </div>

      {/* Security alert context */}
      {error && (
        <div className="flex items-start gap-2 bg-rose-50 text-rose-700 p-3 rounded-lg text-xs border border-rose-100" id="auth-error-block">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Credential login form */}
      <form onSubmit={handleLogin} className="space-y-4" id="form-login">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Đại chỉ Email Quản trị
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="login-email"
              type="email"
              required
              placeholder="admin@ic3master.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600 focus:bg-white text-slate-800 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Mật khẩu chuyên biệt
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="login-password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600 focus:bg-white text-slate-800 transition"
            />
          </div>
        </div>

        <button
          type="submit"
          id="login-submit-btn"
          disabled={submitting}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          {submitting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Xác minh phiên bản...
            </>
          ) : (
            "Kết Nối Hệ Thống Quản Trị"
          )}
        </button>
      </form>
    </div>
  );
}
