"use client";

import React, { useState } from "react";
import { useIC3 } from "../lib/ic3store";
import { IC3_MODULES } from "../lib/ic3data";
import { 
  Users, 
  FolderPlus, 
  CheckCircle, 
  TrendingUp, 
  Grid, 
  FileSpreadsheet, 
  PlusCircle, 
  Award,
  BookOpen
} from "lucide-react";

export default function TeacherConsole() {
  const { classrooms, examRecords, createClassroom } = useIC3();

  // Classroom creation states
  const [newClassName, setNewClassName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Classroom creation handler
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);
    if (!newClassName.trim()) return;

    setCreating(true);
    try {
      const classCode = await createClassroom(newClassName);
      setCreateSuccess(`Lớp học "${newClassName}" đã được khởi tạo thành công với mã mời: ${classCode}`);
      setNewClassName("");
    } catch (err: any) {
      console.error(err);
      setCreateError(err.message || "Không thể tạo lập lớp học mới.");
    } finally {
      setCreating(false);
    }
  };

  // Helper metric calculations
  const totalStudentsNum = classrooms.reduce((acc, curr) => acc + curr.studentIds.length, 0);
  const totalPassedCount = examRecords.filter(r => r.passed).length;
  const generalPassRate = examRecords.length > 0 ? Math.round((totalPassedCount / examRecords.length) * 100) : 0;

  return (
    <div className="space-y-8 animate-fade-in" id="teacher-console-stage">
      {/* Educator Intro Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 md:p-8 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6" id="teacher-header-banner">
        <div>
          <span className="bg-amber-600/20 text-amber-400 font-semibold text-xs px-2.5 py-1 rounded-full uppercase tracking-wider">
            Hội đồng Giảng dạy
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold font-display tracking-tight text-white mt-2">
            Bảng Điều Khiển Sư Phạm
          </h2>
          <p className="text-slate-400 text-xs md:text-sm mt-1 max-w-xl leading-relaxed">
            Nơi quản lý lớp học từ xa, theo dõi tiến độ làm đề thi thử chuẩn GS6 của học sinh và phân tích biểu đồ học tập nhanh chóng.
          </p>
        </div>

        {/* Quick analytics info */}
        <div className="grid grid-cols-3 gap-2 w-full md:w-auto shrink-0" id="teacher-quick-panels">
          <div className="bg-slate-800 p-3 rounded-lg border border-slate-700/50 text-center w-24">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Lớp học</span>
            <span className="text-lg font-black block text-amber-500 mt-0.5">{classrooms.length}</span>
          </div>
          <div className="bg-slate-800 p-3 rounded-lg border border-slate-700/50 text-center w-24">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Học sinh</span>
            <span className="text-lg font-black block text-blue-500 mt-0.5">{totalStudentsNum}</span>
          </div>
          <div className="bg-slate-800 p-3 rounded-lg border border-slate-700/50 text-center w-24">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Tỷ lệ đạt</span>
            <span className="text-lg font-black block text-emerald-500 mt-0.5">{generalPassRate}%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="teacher-console-grids">
        {/* Classrooms List Column */}
        <div className="lg:col-span-2 space-y-6" id="classes-list-hub">
          <div className="flex justify-between items-center bg-white border border-slate-100 p-5 rounded-xl shadow-sm" id="classroom-maker-card">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900 font-display">Khởi tạo lớp học mới</h3>
              <p className="text-xs text-slate-500 mt-0.5 max-w-md leading-relaxed">
                Sau khi tạo lớp học, hệ thống sẽ cấp mã mời 6 chữ số để bạn phân phát cho học sinh lớp mình liên kết.
              </p>

              {createError && (
                <div className="bg-rose-50 text-rose-700 text-xs p-2.5 rounded-lg border border-rose-100 mt-3" id="create-class-err">
                  {createError}
                </div>
              )}

              {createSuccess && (
                <div className="bg-emerald-50 text-emerald-700 text-xs p-2.5 rounded-lg border border-emerald-100 mt-3" id="create-class-succ">
                  {createSuccess}
                </div>
              )}

              <form onSubmit={handleCreateClass} className="flex gap-2 mt-4 max-w-lg" id="create-class-form">
                <input
                  id="class-name-input"
                  type="text"
                  required
                  placeholder="Nhập tên lớp học (Ví dụ: Tin Lớp 11A3)"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="flex-1 border border-slate-200 px-3 py-2 text-xs rounded-lg focus:outline-none focus:border-amber-600 text-slate-800 font-medium"
                />
                <button
                  type="submit"
                  id="class-create-submit"
                  disabled={creating}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 disabled:opacity-50"
                >
                  <PlusCircle className="w-4 h-4" />
                  {creating ? "Đang tạo..." : "Khởi tạo lớp"}
                </button>
              </form>
            </div>
          </div>

          <div className="space-y-4" id="classrooms-scroller">
            <h3 className="text-lg font-bold text-slate-900 font-display">Danh sách các Lớp học</h3>

            {classrooms.length === 0 ? (
              <div className="bg-white border border-slate-100 p-8 rounded-xl text-center text-slate-400 text-sm italic" id="empty-classes-view">
                Chưa có lớp học nào được tạo lập trong hệ thống của bạn.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="teacher-classes-grid">
                {classrooms.map((cls) => (
                  <div key={cls.id} className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4 hover:border-amber-200 transition" id={`teacher-class-${cls.id}`}>
                    <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                      <h4 className="font-bold text-slate-900 text-sm">{cls.name}</h4>
                      <span className="text-[10px] font-mono tracking-wider font-extrabold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-100">
                        {cls.code}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                      <div>
                        <span>Ngày tạo:</span>
                        <p className="font-medium text-slate-800">
                          {new Date(cls.createdAt).toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                      <div>
                        <span>Tổng số học sinh:</span>
                        <p className="font-bold text-blue-600 text-sm">
                          {cls.studentIds.length} học sinh
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Global Student Grades Column (takes 1 col) */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4 h-full" id="students-grades-hub">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileSpreadsheet className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-bold text-slate-900 font-display">Bảng điểm tổng hợp</h3>
          </div>

          {examRecords.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs italic" id="empty-grades-view">
              Chưa khớp ghi nhận kết quả điểm thi thử nào.
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[450px]" id="exams-records-list">
              {examRecords.slice(0, 15).map((rec) => {
                const modInfo = IC3_MODULES.find((m) => m.id === rec.module);
                return (
                  <div key={rec.id} className="border border-slate-100 rounded-lg p-3 bg-slate-50/50 hover:bg-slate-50 transition" id={`grade-card-${rec.id}`}>
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className="font-bold text-slate-800 text-xs">{rec.studentName}</p>
                        <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                          {modInfo?.name.split("(")[0].trim() || rec.module}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded leading-none ${rec.passed ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                        {rec.passed ? "Đạt" : "Trượt"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                      <span>{new Date(rec.createdAt).toLocaleDateString("vi-VN")}</span>
                      <span className="font-mono font-extrabold text-slate-800 text-xs">
                        {rec.score} / 1000
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
