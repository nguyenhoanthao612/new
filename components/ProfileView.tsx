"use client";

import React, { useState } from "react";
import { useIC3, isUserAdmin } from "../lib/ic3store";
import { User, Mail, Shield, Calendar, RefreshCw, LogOut, ArrowLeft } from "lucide-react";

interface ProfileViewProps {
  onBackToHome: () => void;
}

export default function ProfileView({ onBackToHome }: ProfileViewProps) {
  const { firebaseUser, userProfile, activeRole, updateUserRole, logout } = useIC3();

  // Selected administrative role
  const [submitting, setSubmitting] = useState(false);

  const handleRoleChange = async (newRole: "student" | "teacher" | "admin") => {
    setSubmitting(true);
    try {
      await updateUserRole(newRole);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-6 md:p-8 shadow-sm max-w-2xl mx-auto space-y-6" id="profile-container">
      {/* Header section with profile avatar details */}
      <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100" id="profile-card-header">
        <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-md text-white font-black text-3xl">
          {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : "U"}
        </div>

        <div className="text-center sm:text-left space-y-1">
          <h2 className="text-2xl font-bold text-slate-900 font-display">
            {userProfile?.displayName || "Người dùng"}
          </h2>
          <p className="text-xs text-slate-400 font-mono">ID: {userProfile?.userId}</p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
            <span className={`inline-flex px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${activeRole === "student" ? "bg-blue-50 text-blue-700 border border-blue-100" : activeRole === "teacher" ? "bg-amber-50 text-amber-700 border border-amber-100" : "bg-purple-50 text-purple-700 border border-purple-100"}`}>
              Vai trò: {activeRole === "student" ? "Học sinh" : activeRole === "teacher" ? "Giáo viên" : "Hệ thống Quản trị"}
            </span>
          </div>
        </div>
      </div>

      {/* Account Info Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="profile-details">
        <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100/60 rounded-xl">
          <Mail className="w-5 h-5 text-indigo-600 shrink-0" />
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Địa chỉ Email</span>
            <p className="text-xs font-semibold text-slate-800">{userProfile?.email || "Chưa có cấu hình"}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100/60 rounded-xl">
          <Calendar className="w-5 h-5 text-indigo-600 shrink-0" />
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Ngày đăng ký</span>
            <p className="text-xs font-semibold text-slate-800">
              {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString("vi-VN") : "Hôm nay"}
            </p>
          </div>
        </div>
      </div>

      {/* Role Manager Toggle Panel */}
      <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 space-y-3" id="role-manager-stage">
        <div className="flex items-center gap-2 border-b border-slate-200/50 pb-2">
          <Shield className="w-4 h-4 text-purple-600" />
          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Chuyển đổi vai trò trải nghiệm</h4>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed">
          Hệ thống cho phép bạn tự chuyển đổi vai trò linh hoạt để trải nghiệm các phân hệ giao diện: **Góc Học sinh, Góc Giáo viên và Khối Quản trị chuyên sâu** mà không cần đăng ký tài khoản mới.
        </p>

        <div className={`grid ${isUserAdmin(firebaseUser) ? "grid-cols-3" : "grid-cols-2"} gap-2 pt-2`} id="toggle-roles-grid">
          <button
            id="role-toggle-student"
            disabled={submitting}
            onClick={() => handleRoleChange("student")}
            className={`py-2 px-3 text-xs font-bold border rounded-lg transition ${activeRole === "student" ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"}`}
          >
            Học sinh
          </button>
          <button
            id="role-toggle-teacher"
            disabled={submitting}
            onClick={() => handleRoleChange("teacher")}
            className={`py-2 px-3 text-xs font-bold border rounded-lg transition ${activeRole === "teacher" ? "bg-amber-600 text-white border-amber-600 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"}`}
          >
            Giáo viên
          </button>
          {isUserAdmin(firebaseUser) && (
            <button
              id="role-toggle-admin"
              disabled={submitting}
              onClick={() => handleRoleChange("admin")}
              className={`py-2 px-3 text-xs font-bold border rounded-lg transition ${activeRole === "admin" ? "bg-purple-600 text-white border-purple-600 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"}`}
            >
              Quản trị viên
            </button>
          )}
        </div>
      </div>

      {/* Profile actions footer */}
      <div className="flex justify-between items-center pt-4 border-t border-slate-100" id="profile-footer-actions">
        <button
          id="profile-back-home"
          onClick={onBackToHome}
          className="flex items-center gap-1.5 px-4 py-2 hover:bg-slate-100 text-slate-600 font-semibold border border-slate-200 rounded-lg text-xs transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Về Trang chủ
        </button>

        <button
          id="profile-logout-btn"
          onClick={logout}
          className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs shadow transition"
        >
          <LogOut className="w-4 h-4" />
          Đăng xuất tài khoản
        </button>
      </div>
    </div>
  );
}
