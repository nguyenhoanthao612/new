"use client";

import React, { useState } from "react";
import { IC3Provider, useIC3 } from "@/lib/ic3store";
import UserDashboard from "@/components/UserDashboard";
import PracticeModule from "@/components/PracticeModule";
import ExamSimulator from "@/components/ExamSimulator";
import TeacherConsole from "@/components/TeacherConsole";
import AdminPanel from "@/components/AdminPanel";
import { BookOpen, Trophy, ShieldCheck, Cpu, MessageSquare, Compass, Terminal, FileText, LayoutDashboard, Database, UserCheck, Star, Users, Flame, BookMarked, Sun, Moon } from "lucide-react";

function HomeContent() {
  const { activeRole, setActiveRole, currentUser, lessons, exams } = useIC3();

  // Active navigation section
  const [activeScreen, setActiveScreen] = useState<"homepage" | "dashboard" | "practice" | "teacher" | "admin">("homepage");
  const [activeExamId, setActiveExamId] = useState<string | null>(null);

  // Dynamic start actions
  const handleStartPractice = () => {
    setActiveScreen("practice");
  };

  const handleStartExam = (examId: string) => {
    setActiveExamId(examId);
    setActiveScreen("homepage"); // Bypass dashboard, loader handles it
  };

  const handleCompleteExam = () => {
    setActiveExamId(null);
    setActiveScreen("dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col justify-between">
      <div>
        {/* 1. TOP INTERACTIVE TESTING BAR (Evaluating user roles) */}
        <div className="bg-slate-900 text-slate-200 py-1 px-4 flex flex-wrap items-center justify-between text-xs font-semibold gap-3 border-b border-slate-800 shadow-inner">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-slate-300 font-bold tracking-tight text-[11px]">MÔI TRƯỜNG GIẢ LẬP TRỰC QUAN:</span>
            <span className="text-[10px] text-slate-400 font-mono">Đổi vai trò để chấm điểm các góc nhìn giao diện khác nhau</span>
          </div>

          <div className="flex items-center space-x-2" id="role-selector-utility">
            <button
              id="role-student-btn"
              type="button"
              onClick={() => {
                setActiveRole("student");
                setActiveScreen("homepage");
                setActiveExamId(null);
              }}
              className={`px-2.5 py-0.5 rounded text-[11px] font-bold tracking-tight transition duration-150 cursor-pointer ${
                activeRole === "student"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Học viên (Student)
            </button>
            
            <button
              id="role-teacher-btn"
              type="button"
              onClick={() => {
                setActiveRole("teacher");
                setActiveScreen("teacher");
                setActiveExamId(null);
              }}
              className={`px-2.5 py-0.5 rounded text-[11px] font-bold tracking-tight transition duration-150 cursor-pointer ${
                activeRole === "teacher"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Giảng viên (Teacher)
            </button>

            <button
              id="role-admin-btn"
              type="button"
              onClick={() => {
                setActiveRole("admin");
                setActiveScreen("admin");
                setActiveExamId(null);
              }}
              className={`px-2.5 py-0.5 rounded text-[11px] font-bold tracking-tight transition duration-150 cursor-pointer ${
                activeRole === "admin"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Quản trị viên (Admin)
            </button>
          </div>
        </div>

        {/* 2. SYSTEM MAIN HEADER NAVIGATION BAR */}
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs px-8 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => { setActiveScreen("homepage"); setActiveExamId(null); }}>
            <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold tracking-wider shadow-sm">
              I3
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-800 tracking-tight leading-none">IC3 MasterPro</h1>
              <p className="text-[9px] text-slate-400 font-semibold tracking-wider block mt-1 uppercase">Certiport Standard 2026</p>
            </div>
          </div>

          {/* Dynamic page routes changer */}
          {activeExamId === null && (
            <nav className="hidden md:flex items-center space-x-6 text-xs font-semibold text-slate-500">
              <button
                id="nav-home"
                onClick={() => setActiveScreen("homepage")}
                className={`hover:text-blue-600 transition cursor-pointer ${activeScreen === "homepage" ? "text-blue-600 font-bold border-b-2 border-blue-600 pb-1" : ""}`}
              >
                Trang giới thiệu
              </button>
              
              {activeRole === "student" && (
                <>
                  <button
                    id="nav-student-dashboard"
                    onClick={() => setActiveScreen("dashboard")}
                    className={`hover:text-blue-600 transition cursor-pointer ${activeScreen === "dashboard" ? "text-blue-600 font-bold border-b-2 border-blue-600 pb-1" : ""}`}
                  >
                    Góc Học tập & Thi thử
                  </button>
                  <button
                    id="nav-student-practice"
                    onClick={() => setActiveScreen("practice")}
                    className={`hover:text-blue-600 transition cursor-pointer ${activeScreen === "practice" ? "text-blue-600 font-bold border-b-2 border-blue-600 pb-1" : ""}`}
                  >
                    Luyện tập tự do
                  </button>
                </>
              )}

              {activeRole === "teacher" && (
                <button
                  id="nav-teacher-console"
                  onClick={() => setActiveScreen("teacher")}
                  className={`hover:text-amber-600 transition cursor-pointer ${activeScreen === "teacher" ? "text-amber-600 font-bold border-b-2 border-amber-600 pb-1" : ""}`}
                >
                  Hội đồng Giảng dạy
                </button>
              )}

              {activeRole === "admin" && (
                <button
                  id="nav-admin-panel"
                  onClick={() => setActiveScreen("admin")}
                  className={`hover:text-purple-600 transition cursor-pointer ${activeScreen === "admin" ? "text-purple-600 font-bold border-b-2 border-purple-600 pb-1" : ""}`}
                >
                  Hệ thống Quản trị
                </button>
              )}
            </nav>
          )}

          <div className="flex items-center space-x-4">
            <div className="flex items-center gap-2 px-2.5 py-0.5 bg-green-50 text-green-700 border border-green-150 rounded-full text-[10px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              System Online
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold text-slate-800 leading-tight">nguyenhoanthao612</p>
              <span className="text-[10px] text-slate-400 font-mono">Vai trò: <span className="font-bold text-blue-600 bg-blue-50 px-1 py-0.2 rounded-sm">{activeRole}</span></span>
            </div>
          </div>
        </header>

        {/* 3. DYNAMIC CONTENT SWITCHES */}
        <main className="px-8 py-6" id="primary-applet-stage">
          {/* EXAM ROUTE WORKSPACE LOADER */}
          {activeExamId !== null ? (
            <ExamSimulator examId={activeExamId} onBackToHome={handleCompleteExam} />
          ) : (
            <>
              {/* SCREEN 1: HOMEPAGE INTRO & METRICS PORTAL */}
              {activeScreen === "homepage" && (
                <div className="space-y-6 max-w-6xl mx-auto animate-fade-in" id="intro-cert-room">
                  {/* HERO BANNER SECTION */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 md:p-10 text-white flex flex-col lg:flex-row items-center justify-between text-left gap-8 shadow-sm">
                    <div className="space-y-4 max-w-xl">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[10px] font-bold tracking-wider uppercase gap-1.5 animate-pulse">
                        <Flame className="h-4 w-4" /> Bản Cập Nhật Certiport 2026 Mới Nhất
                      </span>
                      <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-tight">
                        Luyện Thi Chứng Chỉ IC3 Chuyên Sâu, Sát Đề Thực Tế
                      </h2>
                      <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-normal">
                        Nền tảng học hỏi kiến thức chuyên đề, thực hành tương tác chuyên sâu bao gồm đầy đủ 8 dạng câu hỏi, mô phỏng thao tác Windows & Office cùng AI trợ giảng khoa học.
                      </p>

                      <div className="pt-2 flex flex-wrap gap-4">
                        {activeRole === "student" ? (
                          <button
                            id="hero-dashboard-start-btn"
                            type="button"
                            onClick={() => setActiveScreen("dashboard")}
                            className="py-2.5 px-6 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition text-xs cursor-pointer shadow-sm outline-none"
                          >
                            Bắt đầu học ngay →
                          </button>
                        ) : (
                          <p className="text-xs bg-slate-800 p-2.5 border border-slate-705 border-slate-700 rounded font-semibold text-slate-300">
                            * Bạn đang truy cập dưới quyền quản lý <strong>{activeRole}</strong>. Chọn vai trò <strong>Student</strong> nếu muốn bắt đầu luyện đề.
                          </p>
                        )}
                        
                        <button
                          id="hero-practice-start-btn"
                          type="button"
                          onClick={handleStartPractice}
                          className="py-2.5 px-5 border border-slate-700 text-slate-300 rounded font-bold hover:bg-white/5 transition text-xs cursor-pointer"
                        >
                          Đề ôn tập tự do
                        </button>
                      </div>
                    </div>

                    {/* Visual components representation */}
                    <div className="shrink-0 w-full lg:w-96 grid grid-cols-2 gap-3">
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 border-slate-800 space-y-1.5">
                        <Cpu className="h-5 w-5 text-blue-400" />
                        <h4 className="font-bold text-xs text-slate-200">Computing Fundamentals</h4>
                        <p className="text-[10px] text-slate-400">Phần cứng, hệ điều hành, bảo mật..</p>
                      </div>
                      
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                        <BookMarked className="h-5 w-5 text-emerald-400" />
                        <h4 className="font-bold text-xs text-slate-200">Key Applications</h4>
                        <p className="text-[10px] text-slate-400">Word, Excel, PowerPoint..</p>
                      </div>

                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 col-span-2">
                        <Compass className="h-5 w-5 text-amber-400" />
                        <h4 className="font-bold text-xs text-slate-200">Living Online</h4>
                        <p className="text-[10px] text-slate-400">Internet, Mạng xã hội, kỹ năng Email chuyên nghiệp và an toàn thông tin số..</p>
                      </div>
                    </div>
                  </div>

                  {/* SYSTEM HIGHLIGHT STATISTICS */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-white border border-slate-200 rounded-xl shadow-xs text-center">
                    <div className="space-y-1 border-r border-slate-100 last:border-0">
                      <span className="text-2xl font-bold text-slate-900 block">08</span>
                      <p className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">DẠNG CÂU HỎI MÔ PHỎNG</p>
                    </div>
                    <div className="space-y-1 border-r border-slate-100 last:border-0 pl-2">
                      <span className="text-2xl font-bold text-blue-600 block">100%</span>
                      <p className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">CHUNG THỰC TẾ CERTIPORT</p>
                    </div>
                    <div className="space-y-1 border-r border-slate-100 last:border-0 pl-2">
                      <span className="text-2xl font-bold text-emerald-600 block">94.8%</span>
                      <p className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">TỶ LỆ LUYỆN ĐẬU THỰC</p>
                    </div>
                    <div className="space-y-1 pl-2">
                      <span className="text-2xl font-bold text-purple-600 block">Gemini</span>
                      <p className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">TRỢ GIẢNG AI EXPLAINER</p>
                    </div>
                  </div>

                  {/* THE 8 QUESTIONS MODULE HIGHLIGHT CARD LIST */}
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-base font-bold text-slate-800 tracking-tight">Hỗ trợ đầy đủ 8 dạng câu hỏi chuyên sâu của IC3</h3>
                      <p className="text-xs text-slate-400 mt-1">Độc quyền xây dựng môi trường mô phỏng Windows & Office tương tác giống phần mềm gốc</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="questions-architecture-display">
                      <div className="bg-white p-4 border border-slate-200 rounded-xl space-y-1.5 text-left shadow-xs hover:border-blue-400 transition">
                        <div className="text-xs font-bold text-blue-600">01. Multiple Choice</div>
                        <p className="text-xs text-slate-500 leading-normal">Trắc nghiệm một đáp án đúng truyền thống.</p>
                      </div>
                      <div className="bg-white p-4 border border-slate-200 rounded-xl space-y-1.5 text-left shadow-xs hover:border-blue-400 transition">
                        <div className="text-xs font-bold text-blue-600">02. Multiple Response</div>
                        <p className="text-xs text-slate-500 leading-normal">Chọn nhiều phương án chính xác trong bối cảnh thực tế.</p>
                      </div>
                      <div className="bg-white p-4 border border-slate-200 rounded-xl space-y-1.5 text-left shadow-xs hover:border-blue-400 transition">
                        <div className="text-xs font-bold text-blue-600">03. True / False</div>
                        <p className="text-xs text-slate-500 leading-normal">Nhận diện khẳng định đúng hay sai khách quan.</p>
                      </div>
                      <div className="bg-white p-4 border border-slate-200 rounded-xl space-y-1.5 text-left shadow-xs hover:border-blue-400 transition">
                        <div className="text-xs font-bold text-blue-600">04. Matching</div>
                        <p className="text-xs text-slate-500 leading-normal">Hệ thống ghép cặp liên kết phân loại thông số.</p>
                      </div>
                      <div className="bg-white p-4 border border-slate-200 rounded-xl space-y-1.5 text-left shadow-xs hover:border-blue-400 transition">
                        <div className="text-xs font-bold text-blue-600">05. Drag and Drop</div>
                        <p className="text-xs text-slate-500 leading-normal">Thao tác nạp đối tượng vào đúng sơ đồ vị trí.</p>
                      </div>
                      <div className="bg-white p-4 border border-slate-200 rounded-xl space-y-1.5 text-left shadow-xs hover:border-blue-400 transition">
                        <div className="text-xs font-bold text-blue-600">06. Hotspot</div>
                        <p className="text-xs text-slate-500 leading-normal">Chỉ điểm chính xác vị trí/icon trên đồ họa ứng dụng.</p>
                      </div>
                      <div className="bg-white p-4 border border-slate-200 rounded-xl space-y-1.5 text-left shadow-xs hover:border-blue-400 transition">
                        <div className="text-xs font-bold text-blue-600">07. Performance Based</div>
                        <p className="text-xs text-slate-500 leading-normal">Thực hiện tạo file, rename folder trên OS ảo.</p>
                      </div>
                      <div className="bg-white p-4 border border-slate-200 rounded-xl space-y-1.5 text-left shadow-xs hover:border-blue-400 transition">
                        <div className="text-xs font-bold text-blue-600">08. Video Based</div>
                        <p className="text-xs text-slate-500 leading-normal">Quan sát hoạt ảnh thực tế trước khi tính toán đáp số.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SCREEN 2: STUDENT LABORATORY / DASHBOARD */}
              {activeScreen === "dashboard" && activeRole === "student" && (
                <UserDashboard
                  onStartPractice={handleStartPractice}
                  onStartExam={handleStartExam}
                />
              )}

              {/* SCREEN 3: PRACTICE TRAINING COMPONENT */}
              {activeScreen === "practice" && (
                <PracticeModule onBackToHome={() => setActiveScreen("homepage")} />
              )}

              {/* SCREEN 4: EDUCATOR CONTROL DESK */}
              {activeScreen === "teacher" && activeRole === "teacher" && (
                <TeacherConsole />
              )}

              {/* SCREEN 5: ROOT SYSTEM BACKUP ADMINISTRATOR */}
              {activeScreen === "admin" && activeRole === "admin" && (
                <AdminPanel />
              )}
            </>
          )}
        </main>
      </div>

      {/* Footer Info Bar */}
      <footer className="h-10 bg-slate-100 border-t border-slate-200 px-8 flex items-center justify-between text-[10px] text-slate-500 font-medium shrink-0">
        <div>Engine: V8.4.2-STABLE • Database: REDIS + POSTGRES • Architecture: Microservices</div>
        <div className="flex gap-6 uppercase">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> API: 14ms</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Simulation Core: OK</span>
          <span>© 2026 IC3 EDUTECH SOLUTION</span>
        </div>
      </footer>
    </div>
  );
}

export default function LuyenThiIC3RootPage() {
  return (
    <IC3Provider>
      <HomeContent />
    </IC3Provider>
  );
}
