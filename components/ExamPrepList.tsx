"use client";

import React, { useState } from "react";
import { IC3_MODULES } from "../lib/ic3data";
import { useIC3 } from "../lib/ic3store";
import { Laptop, FileSpreadsheet, Globe2, AlertCircle, Play, ShieldAlert, Award, FileText } from "lucide-react";

interface ExamPrepListProps {
  onStartExam: (module: "cf" | "ka" | "lo") => void;
  onBackToHome: () => void;
}

export default function ExamPrepList({ onStartExam, onBackToHome }: ExamPrepListProps) {
  const { examRecords } = useIC3();

  const getModuleIcon = (id: string) => {
    switch (id) {
      case "cf":
        return <Laptop className="w-12 h-12 text-blue-600" />;
      case "ka":
        return <FileSpreadsheet className="w-12 h-12 text-amber-600" />;
      case "lo":
        return <Globe2 className="w-12 h-12 text-purple-600" />;
      default:
        return <Laptop className="w-12 h-12 text-slate-600" />;
    }
  };

  const getModuleStyle = (id: string) => {
    switch (id) {
      case "cf":
        return "hover:border-blue-300 bg-gradient-to-br from-white to-blue-50/10";
      case "ka":
        return "hover:border-amber-300 bg-gradient-to-br from-white to-amber-50/10";
      case "lo":
        return "hover:border-purple-300 bg-gradient-to-br from-white to-purple-50/10";
      default:
        return "hover:border-slate-300";
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto" id="examprep-root">
      
      {/* Intro section */}
      <div className="text-center max-w-2xl mx-auto space-y-3" id="examprep-text">
        <span className="bg-indigo-100 text-indigo-800 font-extrabold text-[10px] px-3 py-1.5 rounded-full uppercase tracking-widest font-mono">
          CHẾ ĐỘ MÔ PHỎNG PHÒNG THI THẬT
        </span>
        <h2 className="text-3xl font-black font-display tracking-tight text-slate-900">
          Hệ Thống Đề Thi Thử IC3 GS6
        </h2>
        <p className="text-slate-500 text-sm leading-relaxed">
          Chọn một trong ba học phần kiểm định để bắt đầu làm bài. Đề thi mô phỏng chính xác giao diện, giới hạn thời gian thực tế để giúp thí sinh tự tin 100% trước khi bước vào kỳ kiểm định chính thức.
        </p>
      </div>

      {/* Rules and Guidelines block */}
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl p-6 shadow-md flex flex-col md:flex-row gap-6 items-start md:items-center justify-between" id="rules-banner">
        <div className="space-y-2">
          <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            Nội Quy Phòng Thi Giả Lập:
          </h3>
          <ul className="text-xs text-slate-400 space-y-1 list-disc pl-5 leading-normal">
            <li>Mỗi bài thi bao gồm các câu hỏi trắc nghiệm và câu hỏi kết hợp trực quan.</li>
            <li>Thời gian làm bài quy định là <strong>50 phút</strong> tính giờ tự động.</li>
            <li>Điểm số đạt yêu cầu để nhận chứng chỉ là tối thiểu <strong>700 / 1000</strong>.</li>
            <li>Sau khi nộp bài, bạn có thể xem lại kết quả, đáp án và giải thích chi tiết tức thì.</li>
          </ul>
        </div>
        
        {onBackToHome && (
          <button
            onClick={onBackToHome}
            className="px-4 py-2 hover:bg-slate-800 text-xs font-bold border border-slate-700 rounded-lg text-slate-300 transition cursor-pointer self-start md:self-auto"
          >
            Về Trang chủ
          </button>
        )}
      </div>

      {/* Grid of 3 Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="examprep-modules-grid">
        {IC3_MODULES.map((mod) => {
          const modRecords = examRecords.filter((r) => r.module === mod.id);
          const bestScore = modRecords.length > 0 ? Math.max(...modRecords.map((r) => r.score)) : null;

          return (
            <div
              key={mod.id}
              className={`border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition duration-200 ${getModuleStyle(mod.id)}`}
              id={`exam-card-${mod.id}`}
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-slate-50 border border-slate-100/60 rounded-xl">
                    {getModuleIcon(mod.id)}
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-extrabold px-2 py-0.5 rounded font-mono uppercase">
                    GS6 BẢN CHUẨN
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-black text-slate-900 font-display text-base leading-snug">
                    {mod.name.split("(")[0].trim()}
                  </h4>
                  <p className="text-slate-500 text-xs lines-4 leading-relaxed">
                    {mod.description}
                  </p>
                </div>

                {/* Meta stats within card */}
                <div className="border-t border-b border-slate-100/70 py-2.5 my-3 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                  <div>
                    Thời gian: <strong className="text-slate-700">{mod.timeLimit} Phút</strong>
                  </div>
                  <div>
                    Điểm đạt: <strong className="text-emerald-600">700 / 1000</strong>
                  </div>
                </div>

                {bestScore !== null && (
                  <div className="bg-emerald-50/50 border border-emerald-100 p-2 rounded-xl text-center text-xs text-slate-600">
                    Kỷ lục của bạn: <strong className="text-emerald-700 font-bold block text-sm mt-0.5">{bestScore} / 1000</strong>
                  </div>
                )}
              </div>

              <button
                onClick={() => onStartExam(mod.id)}
                id={`btn-shoot-exam-${mod.id}`}
                className="w-full mt-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs shadow-md hover:shadow-lg transition flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                Vào Phòng Thi Ngay
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
