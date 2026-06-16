"use client";

import React, { useState } from "react";
import { IC3Provider, useIC3 } from "../lib/ic3store";
import { IC3_MODULES } from "../lib/ic3data";
import AuthViews from "../components/AuthViews";
import PracticeModule from "../components/PracticeModule";
import ExamSimulator from "../components/ExamSimulator";
import Leaderboard from "../components/Leaderboard";
import ExamPrepList from "../components/ExamPrepList";
import AdminPanel from "../components/AdminPanel";
import { 
  Menu, 
  X, 
  Award, 
  BookOpen, 
  Trophy, 
  Play, 
  CheckCircle2, 
  ArrowRight, 
  LogOut, 
  ShieldCheck, 
  Lock
} from "lucide-react";

function HomeContent() {
  const { firebaseUser, activeRole, loading, logout } = useIC3();

  // Screen management flow states
  const [activeScreen, setActiveScreen] = useState<"homepage" | "practice" | "exam" | "leaderboard" | "admin">("homepage");
  const [authFlowState, setAuthFlowState] = useState<"login" | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active exam tracking
  const [activeExamModule, setActiveExamModule] = useState<"cf" | "ka" | "lo" | null>(null);

  // Overriding check for Admin session
  let resolvedScreen = activeScreen;
  if (firebaseUser && activeRole === "admin") {
    // If Admin is logged in, they can access the full admin dashboard or browse modules
    if (activeScreen !== "admin" && activeScreen !== "homepage" && activeScreen !== "practice" && activeScreen !== "exam" && activeScreen !== "leaderboard") {
      resolvedScreen = "admin";
    }
  } else {
    // Guest user has no access to admin
    if (activeScreen === "admin") {
      resolvedScreen = "homepage";
    }
  }

  const handleStartExam = (modId: "cf" | "ka" | "lo") => {
    setActiveExamModule(modId);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900" id="global-layout-root-container">
      {/* Sticky top header bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm" id="main-navigation-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Platform Identity */}
          <button 
            id="nav-logo"
            onClick={() => { setActiveScreen("homepage"); setAuthFlowState(null); setActiveExamModule(null); }}
            className="flex items-center gap-2.5 text-left bg-transparent border-none cursor-pointer"
          >
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-500/10 shrink-0">
              <Award className="w-5.5 h-5.5" />
            </div>
            <div>
              <span className="font-extrabold font-display text-sm block leading-none tracking-tight text-slate-900">IC3 MASTER</span>
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider font-mono">GS6 Prep Station</span>
            </div>
          </button>

          {/* Navigational Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600" id="desktop-links-nav">
            <button
              id="nav-link-intro"
              onClick={() => { setActiveScreen("homepage"); setAuthFlowState(null); setActiveExamModule(null); }}
              className={`hover:text-indigo-600 transition cursor-pointer py-1.5 ${resolvedScreen === "homepage" && !authFlowState ? "text-indigo-600 border-b-2 border-indigo-600 font-extrabold" : ""}`}
            >
              Trang giới thiệu
            </button>

            <button
              id="nav-link-practice"
              onClick={() => { setActiveScreen("practice"); setAuthFlowState(null); setActiveExamModule(null); }}
              className={`hover:text-indigo-600 transition cursor-pointer py-1.5 ${resolvedScreen === "practice" && !authFlowState ? "text-indigo-600 border-b-2 border-indigo-600 font-extrabold" : ""}`}
            >
              Luyện tập tự do
            </button>

            <button
              id="nav-link-exams"
              onClick={() => { setActiveScreen("exam"); setAuthFlowState(null); setActiveExamModule(null); }}
              className={`hover:text-indigo-600 transition cursor-pointer py-1.5 ${resolvedScreen === "exam" && !authFlowState ? "text-indigo-600 border-b-2 border-indigo-600 font-extrabold" : ""}`}
            >
              Thi thử IC3
            </button>

            <button
              id="nav-link-leaderboard"
              onClick={() => { setActiveScreen("leaderboard"); setAuthFlowState(null); setActiveExamModule(null); }}
              className={`hover:text-indigo-600 transition cursor-pointer py-1.5 ${resolvedScreen === "leaderboard" && !authFlowState ? "text-indigo-600 border-b-2 border-indigo-600 font-extrabold" : ""}`}
            >
              Bảng xếp hạng
            </button>

            {firebaseUser && activeRole === "admin" && (
              <button
                id="nav-link-admin"
                onClick={() => { setActiveScreen("admin"); setAuthFlowState(null); setActiveExamModule(null); }}
                className={`text-rose-600 hover:text-rose-700 transition cursor-pointer py-1.5 flex items-center gap-1 ${resolvedScreen === "admin" && !authFlowState ? "border-b-2 border-rose-600 font-extrabold" : ""}`}
              >
                <ShieldCheck className="w-4 h-4" />
                Quản trị hệ thống
              </button>
            )}
          </nav>

          {/* Admin Avatar & Logout Indicator */}
          <div className="hidden md:flex items-center gap-4 shrink-0" id="desktop-profile-section">
            {loading ? (
              <span className="text-xs text-slate-400 font-medium">...</span>
            ) : firebaseUser && activeRole === "admin" ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 p-1 px-2.5 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-[11px] shadow-sm">
                    A
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] font-black text-slate-800 block">ADMIN</span>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="p-2 cursor-pointer bg-slate-50 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-lg text-slate-600 transition"
                  title="Đăng xuất quản trị"
                  id="btn-admin-logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>

          {/* Mobile navigation menu button */}
          <div className="flex md:hidden" id="mobile-hamburger">
            <button
              id="mobile-hamb-trigger"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-600 hover:text-slate-900 focus:outline-none p-1.5"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Panel */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white p-4 space-y-3 shadow-inner" id="mobile-links-panel">
            <button
              id="m-nav-intro"
              onClick={() => { setActiveScreen("homepage"); setAuthFlowState(null); setActiveExamModule(null); setMobileMenuOpen(false); }}
              className="w-full text-left py-2 font-bold text-xs text-slate-700 block hover:text-indigo-600"
            >
              Trang giới thiệu
            </button>

            <button
              id="m-nav-practice"
              onClick={() => { setActiveScreen("practice"); setAuthFlowState(null); setActiveExamModule(null); setMobileMenuOpen(false); }}
              className="w-full text-left py-2 font-bold text-xs text-slate-700 block hover:text-indigo-600"
            >
              Luyện tập tự do
            </button>

            <button
              id="m-nav-exams"
              onClick={() => { setActiveScreen("exam"); setAuthFlowState(null); setActiveExamModule(null); setMobileMenuOpen(false); }}
              className="w-full text-left py-2 font-bold text-xs text-slate-700 block hover:text-indigo-600"
            >
              Thi thử IC3
            </button>

            <button
              id="m-nav-leaderboard"
              onClick={() => { setActiveScreen("leaderboard"); setAuthFlowState(null); setActiveExamModule(null); setMobileMenuOpen(false); }}
              className="w-full text-left py-2 font-bold text-xs text-slate-700 block hover:text-indigo-600"
            >
              Bảng xếp hạng
            </button>

            {firebaseUser && activeRole === "admin" && (
              <button
                id="m-nav-admin"
                onClick={() => { setActiveScreen("admin"); setAuthFlowState(null); setActiveExamModule(null); setMobileMenuOpen(false); }}
                className="w-full text-left py-2 font-bold text-xs text-rose-600 block flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                Quản trị hệ thống
              </button>
            )}

            {firebaseUser && activeRole === "admin" && (
              <button
                id="m-nav-logout"
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="w-full text-left py-2 text-xs font-bold text-slate-500 hover:text-rose-600 border-t border-slate-100"
              >
                Đăng xuất Admin
              </button>
            )}
          </div>
        )}
      </header>

      {/* Primary Application Stage */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8" id="core-application-body">
        
        {/* Loading overlay panel */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center" id="central-app-loader">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400">Đang đồng bộ dữ liệu chuẩn quốc tế...</p>
          </div>
        ) : authFlowState === "login" ? (
          <div className="py-6 animate-fade-in" id="auth-flow-overlay">
            <AuthViews flow="login" onSwitchFlow={(state) => setAuthFlowState(state ? "login" : null)} />
          </div>
        ) : activeExamModule ? (
          <div className="animate-fade-in" id="active-exam-room-layer">
            <ExamSimulator module={activeExamModule} onClose={() => setActiveExamModule(null)} />
          </div>
        ) : (
          <div className="animate-fade-in" id="standard-app-layer">
            
            {/* 1. HOMEPAGE INTRO LANDER */}
            {resolvedScreen === "homepage" && (
              <div className="space-y-12 max-w-5xl mx-auto" id="landing-stage">
                
                {/* Visual Lander Hero Banner */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12 text-white flex flex-col lg:flex-row items-center justify-between text-left gap-10 shadow-lg relative overflow-hidden" id="landing-hero-card">
                  
                  {/* Subtle decorative background gradient */}
                  <div className="absolute -right-24 -top-24 w-80 h-80 bg-indigo-600/10 blur-3xl rounded-full" />
                  
                  <div className="space-y-5 relative z-10" id="landing-hero-text">
                    <span className="bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 font-bold text-[10px] px-3 py-1.5 rounded-full uppercase tracking-wider font-mono">
                      Khởi động ôn luyện chứng chỉ quốc tế GS6
                    </span>
                    <h1 className="text-3xl md:text-5.5xl font-black font-display tracking-tight leading-none text-white">
                      Bứt Phá Kỹ Năng Số Với <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-sky-400">IC3 Master</span>
                    </h1>
                    <p className="text-slate-400 text-xs md:text-sm max-w-xl leading-relaxed">
                      Luyện thi chuẩn máy tính quốc tế GS6. Trải nghiệm trọn vẹn cả 3 học phần: Máy tính căn bản, Các ứng dụng chủ chốt, và Cuộc sống trực tuyến với phòng thi mô phỏng thật 100% tài nguyên miễn phí.
                    </p>

                    <div className="flex flex-wrap gap-3.5 pt-2" id="landing-hero-actions">
                      <button
                        id="hero-go-exams-btn"
                        onClick={() => setActiveScreen("exam")}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-1.5 cursor-pointer"
                      >
                        Thi Thử IC3 Ngay
                        <Play className="w-3 px-0.5 h-3 fill-white" />
                      </button>
                      
                      <button
                        id="hero-free-btn"
                        onClick={() => setActiveScreen("practice")}
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold border border-slate-700 rounded-xl text-xs transition cursor-pointer"
                      >
                        Luyện Tập Tự Do
                      </button>
                    </div>
                  </div>

                  {/* Right side live stats container */}
                  <div className="bg-slate-950/55 border border-slate-800 p-6 rounded-2xl w-full lg:w-80 shrink-0 shadow-2xl relative z-10" id="hero-aesthetic-badge">
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] text-zinc-400 font-extrabold font-mono tracking-wider uppercase">Cơ sở dữ liệu sẵn sàng</span>
                    </div>

                    <div className="space-y-4 text-xs font-semibold text-slate-300">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Mô phỏng 100% áp lực phòng thi thật</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Giải đáp chi tiết đáp án chi tiết</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Học thuật hoàn toàn miễn phí</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grid Modules of GS6 */}
                <div className="space-y-6" id="landing-modules-summary">
                  <div className="text-center space-y-1">
                    <h3 className="text-xl md:text-2xl font-black text-slate-900 font-display">
                      Cấu Trúc Ba Mảng Thi IC3 GS6
                    </h3>
                    <p className="text-xs text-slate-500">Mỗi phần thi được phân loại chính xác theo phân phối chương trình Certiport</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="cards-modules-lander">
                    {IC3_MODULES.map(mod => (
                      <div key={mod.id} className="bg-white border border-slate-100 p-6 rounded-2xl hover:shadow hover:border-indigo-100 transition duration-200 flex flex-col justify-between" id={`mod-desc-${mod.id}`}>
                        <div className="space-y-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-indigo-600 font-mono text-sm leading-none">
                            {mod.id.toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-slate-900 font-display text-sm leading-snug">{mod.name}</h4>
                            <p className="text-slate-500 text-xs leading-relaxed mt-1">{mod.description}</p>
                          </div>
                        </div>

                        <div className="border-t border-slate-50 mt-5 pt-3.5 flex justify-between items-center text-[11px] font-bold text-slate-400">
                          <span>Thời lượng: {mod.timeLimit} phút</span>
                          <span className="text-indigo-600 hover:underline inline-flex items-center gap-0.5 cursor-pointer" onClick={() => handleStartExam(mod.id)}>
                            Chi tiết
                            <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* 2. FREE PRACTICE ROUTE */}
            {resolvedScreen === "practice" && (
              <PracticeModule onBackToHome={() => setActiveScreen("homepage")} />
            )}

            {/* 3. EXAM SIM PREP ROUTE */}
            {resolvedScreen === "exam" && (
              <ExamPrepList 
                onStartExam={handleStartExam} 
                onBackToHome={() => setActiveScreen("homepage")} 
              />
            )}

            {/* 4. LEADERBOARD ROUTE */}
            {resolvedScreen === "leaderboard" && (
              <Leaderboard onBackToHome={() => setActiveScreen("homepage")} />
            )}

            {/* 5. ADMIN CONTROL PANEL */}
            {resolvedScreen === "admin" && firebaseUser && activeRole === "admin" && (
              <AdminPanel />
            )}

          </div>
        )}

      </main>

      {/* Persistent Page Footer */}
      <footer className="bg-white border-t border-slate-100 py-8 mt-12" id="global-layout-footer-container">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© 2026 IC3 Master Portal. Công nghệ luyện thi kỹ năng số tiêu chuẩn quốc tế GS6.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-slate-600">Điều khoản</a>
            <a href="#" className="hover:text-slate-600">Bảo mật</a>
            <span>•</span>
            <button 
              onClick={() => { setAuthFlowState("login"); setActiveScreen("homepage"); }}
              className="text-slate-500 hover:text-indigo-600 font-extrabold flex items-center gap-1 bg-transparent border-none cursor-pointer"
              id="footer-admin-login-link"
            >
              <Lock className="w-3.5 h-3.5" />
              Đăng nhập quản trị
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <IC3Provider>
      <HomeContent />
    </IC3Provider>
  );
}
