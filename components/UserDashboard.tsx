"use client";

import React, { useState } from "react";
import { useIC3 } from "@/lib/ic3store";
import { Lesson, Exam } from "@/lib/ic3data";
import { Check, BookOpen, Trophy, Clock, Brain, Compass, BookOpenCheck, Bookmark, ArrowRight, Star, ExternalLink, RefreshCw } from "lucide-react";

export default function UserDashboard({
  onStartPractice,
  onStartExam,
}: {
  onStartPractice: () => void;
  onStartExam: (examId: string) => void;
}) {
  const { currentUser, lessons, exams, toggleLessonCompleted } = useIC3();

  // Active student panels
  const [activeTab, setActiveTab] = useState<"overview" | "lessons" | "exams">("overview");
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  // Statistics calculation
  const totalLessons = lessons.length || 1;
  const completedCount = currentUser.completedLessons.length;
  const progressPercent = Math.round((completedCount / totalLessons) * 100);

  const totalExamsTaken = currentUser.examHistory.length;
  const passedExamsTaken = currentUser.examHistory.filter((item) => item.passed).length;

  // Calculate diagnostic skills from all historically completed exams
  const skillAggregates: Record<string, { totalScore: number; count: number }> = {};
  currentUser.examHistory.forEach((attempt) => {
    Object.keys(attempt.skillPerformance).forEach((skillName) => {
      const score = attempt.skillPerformance[skillName];
      if (!skillAggregates[skillName]) {
        skillAggregates[skillName] = { totalScore: 0, count: 0 };
      }
      skillAggregates[skillName].totalScore += score;
      skillAggregates[skillName].count += 1;
    });
  });

  const skillsList = Object.keys(skillAggregates).map((skillName) => {
    return {
      name: skillName,
      avgScore: Math.round(skillAggregates[skillName].totalScore / skillAggregates[skillName].count),
    };
  });

  // Render Lesson Content
  const handleOpenLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
  };

  return (
    <div className="space-y-6" id="student-dashboard-workbench">
      {/* QUICK STATS SHEET BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Progress Ring */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center space-x-4 shadow-sm" id="progress-indicator-card">
          <div className="relative h-12 w-12 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="24" cy="24" r="20" stroke="#f1f5f9" strokeWidth="3.5" fill="transparent" />
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="#2563eb"
                strokeWidth="3.5"
                fill="transparent"
                strokeDasharray={125.6}
                strokeDashoffset={125.6 - (125.6 * progressPercent) / 100}
                className="transition-all duration-500"
              />
            </svg>
            <span className="absolute font-mono text-[10px] font-extrabold text-blue-700">{progressPercent}%</span>
          </div>
          <div>
            <span className="text-slate-400 font-bold text-[9px] tracking-wider uppercase block leading-none mb-1">NĂNG LỰC LÝ THUYẾT</span>
            <span className="text-xs font-bold text-slate-800 leading-tight block">
              Đã học {completedCount} / {totalLessons} bài học
            </span>
          </div>
        </div>

        {/* Exams stats */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center space-x-4 shadow-sm" id="exam-stats-card">
          <div className="h-10 w-10 rounded bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <Trophy className="h-4 w-4" />
          </div>
          <div>
            <span className="text-slate-400 font-bold text-[9px] tracking-wider uppercase block font-mono leading-none mb-1">TỶ LỆ KHẢO THÍ ĐẬU</span>
            <span className="text-xs font-bold text-slate-800 leading-tight block">
              {passedExamsTaken} / {totalExamsTaken} đề thi đạt
            </span>
          </div>
        </div>

        {/* Time Study */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center space-x-4 shadow-sm" id="time-study-card">
          <div className="h-10 w-10 rounded bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shrink-0">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <span className="text-slate-400 font-bold text-[9px] tracking-wider uppercase block font-mono leading-none mb-1">VỒNG TRỌNG TÂM</span>
            <span className="text-xs font-bold text-emerald-700 leading-tight block">
              {progressPercent >= 80 ? "An toàn đi thi" : "Cần bồi dưỡng thêm"}
            </span>
          </div>
        </div>

        {/* Brain check */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center space-x-4 shadow-sm animate-pulse" id="brain-strength-card">
          <div className="h-10 w-10 rounded bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <Brain className="h-4 w-4" />
          </div>
          <div>
            <span className="text-slate-400 font-bold text-[9px] tracking-wider uppercase block font-mono leading-none mb-1">KHÓA HỌC HIỆN TẠI</span>
            <span className="text-xs font-bold text-slate-800 leading-tight block">Luyện Sát Đề Certiport 2026</span>
          </div>
        </div>
      </div>

      {/* INNER NAVIGATION SUB-TABS */}
      <div className="bg-white rounded-lg border border-slate-200 p-0.5 flex max-w-sm" id="dashboard-navbar-rooms">
        <button
          id="tab-overview-btn"
          onClick={() => {
            setActiveTab("overview");
            setSelectedLesson(null);
          }}
          className={`flex-1 py-1.5 rounded text-xs font-bold transition cursor-pointer ${
            activeTab === "overview" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Tiến trình chung
        </button>
        <button
          id="tab-lessons-btn"
          onClick={() => {
            setActiveTab("lessons");
            setSelectedLesson(null);
          }}
          className={`flex-1 py-1.5 rounded text-xs font-bold transition cursor-pointer ${
            activeTab === "lessons" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Tài liệu IC3
        </button>
        <button
          id="tab-exams-btn"
          onClick={() => {
            setActiveTab("exams");
            setSelectedLesson(null);
          }}
          className={`flex-1 py-1.5 rounded text-xs font-bold transition cursor-pointer ${
            activeTab === "exams" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Bộ Đề thi thử
        </button>
      </div>

      {/* PANEL 1: OVERVIEW PROGRESS */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard-tab-overview">
          {/* Diagnostic Strengths vs Weaknesses map */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-blue-600" />
                  Bản đồ Năng lực Kỹ thuật theo Chuyên đề IC3
                </h3>
                <p className="text-[10px] text-slate-400">Được lập bản phân tích thông qua lịch sử giải quyết đề thi thử của bạn</p>
              </div>

              {skillsList.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 border border-dashed rounded-xl bg-slate-50/50">
                  ⚠️ Chưa có đủ thông số khảo sát. Hãy hoàn thành ít nhất một <strong>Đề thi thử</strong> bên dưới để hệ thống lập bản đồ điểm mạnh điểm yếu!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {skillsList.map((skill) => {
                    const isStrong = skill.avgScore >= 80;
                    return (
                      <div
                        key={skill.name}
                        className={`p-3 border rounded-xl space-y-1.5 ${
                          isStrong ? "border-green-150 bg-green-50/10" : "border-rose-150 bg-rose-50/10"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-slate-700">{skill.name}</span>
                          <span className={isStrong ? "text-green-700" : "text-rose-700"}>{skill.avgScore}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${isStrong ? "bg-green-500" : "bg-rose-500"}`}
                            style={{ width: `${skill.avgScore}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 block font-mono">
                          Khuyên dùng: {isStrong ? "✓ Đã làm chủ kỹ năng" : "⚠️ Cần đọc lại tài liệu"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Historic Attempts */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
              <h3 className="font-bold text-slate-800 text-sm">Lịch sử Thi thử gần nhất</h3>
              {currentUser.examHistory.length === 0 ? (
                <p className="text-xs text-slate-400 p-4 border border-dashed rounded-lg text-center bg-slate-50/50">
                  Chưa ghi nhận lịch sử thi thử. Hãy chọn đề thi ở mục bên cạnh để bắt đầu rèn luyện!
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {currentUser.examHistory.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between gap-4 text-xs">
                      <div>
                        <p className="font-bold text-slate-800 leading-tight">{item.title}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">Ngày thi: {item.date}</p>
                      </div>

                      <div className="flex items-center space-x-3 shrink-0 text-right">
                        <div>
                          <p className={`font-black ${item.passed ? "text-emerald-600" : "text-rose-600"}`}>
                            {item.score}% điểm
                          </p>
                          <p className="text-[9px] text-slate-400">{item.passed ? "ĐẠT CHỈ TIÊU" : "CHƯA ĐẠT"}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick study start CTA */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-slate-900 p-5 text-white rounded-xl text-left border border-slate-800 space-y-4 shadow-xs">
              <Compass className="h-6 w-6 text-blue-400" />
              <div className="space-y-1">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">Học tập & Luyện Chuyên đề</h4>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Bạn có muốn lựa chọn nhanh theo từng chủ đề hoặc cấp độ để kiểm tra kiến thức của mình một cách tốc độ?
                </p>
              </div>
              <button
                id="quick-practice-start-btn"
                onClick={onStartPractice}
                type="button"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition text-xs cursor-pointer text-center block"
              >
                Mở phòng luyện tập tự do →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PANEL 2: INTEGRATED ACCORDION LESSON STUDY CENTER */}
      {activeTab === "lessons" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard-tab-lessons">
          {/* Lessons list sidebar */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
              <div>
                <h3 className="font-bold text-slate-800 text-xs">Chương trình Lý thuyết IC3</h3>
                <p className="text-[9px] text-slate-400">Chọn bài viết bên dưới để tiến hành bồi dưỡng bài đọc</p>
              </div>

              <div className="space-y-2">
                {lessons.map((lesson) => {
                  const isCompleted = currentUser.completedLessons.includes(lesson.id);
                  const isSelected = selectedLesson?.id === lesson.id;

                  return (
                    <button
                      key={lesson.id}
                      id={`lesson-selector-btn-${lesson.id}`}
                      type="button"
                      onClick={() => handleOpenLesson(lesson)}
                      className={`w-full p-2.5 rounded-lg border text-left flex items-start space-x-2.5 transition cursor-pointer ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/30"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div
                        className={`h-4.5 w-4.5 rounded-full border shrink-0 flex items-center justify-center mt-0.5 ${
                          isCompleted ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300"
                        }`}
                      >
                        {isCompleted && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                      </div>
 
                      <div className="space-y-1">
                        <p className="font-bold text-xs text-slate-800 leading-tight">{lesson.title}</p>
                        <div className="flex items-center gap-1 text-[9px] text-slate-400 font-mono">
                          <span className="bg-slate-100 rounded px-1 text-slate-500 uppercase">{lesson.moduleId}</span>
                          <span>●</span>
                          <span>{lesson.topic}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
 
          {/* Detailed Selected Lesson contents panel */}
          <div className="lg:col-span-8">
            {selectedLesson ? (
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4" id="lesson-read-canvas">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-150 pb-3 gap-3">
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-wider text-blue-600 bg-blue-50 border border-blue-200 rounded px-2 py-0.5">
                      {selectedLesson.moduleId} - {selectedLesson.topic}
                    </span>
                    <h2 className="text-base font-bold text-slate-900 mt-2 leading-tight">{selectedLesson.title}</h2>
                  </div>
 
                  <button
                    id="complete-lesson-checkbox-btn"
                    type="button"
                    onClick={() => toggleLessonCompleted(selectedLesson.id)}
                    className={`py-1.5 px-3 rounded text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      currentUser.completedLessons.includes(selectedLesson.id)
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    <BookOpenCheck className="h-4 w-4" />
                    {currentUser.completedLessons.includes(selectedLesson.id)
                      ? "✓ Đã hoàn thành học"
                      : "Đánh dấu Hoàn thành"}
                  </button>
                </div>
 
                {/* Lesson illustration picture */}
                {selectedLesson.imageUrl && (
                  <div className="relative rounded-lg overflow-hidden shadow-xs aspect-video max-h-56 w-full">
                    <img
                      src={selectedLesson.imageUrl}
                      alt={selectedLesson.title}
                      referrerPolicy="no-referrer"
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
 
                {/* Markdown text Content simulator rendered cleanly and elegantly */}
                <div className="prose max-w-none text-xs text-slate-600 leading-relaxed space-y-3 whitespace-pre-line border-t border-slate-100 pt-3" id="lesson-text-body">
                  {selectedLesson.content}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 space-y-3" id="lesson-unselected-box">
                <Bookmark className="h-10 w-10 text-slate-300 mx-auto" />
                <div>
                  <p className="text-sm font-bold text-slate-700">Chưa chọn nội dung học</p>
                  <p className="text-xs text-slate-405 text-slate-400">Hãy chọn một bài lý thuyết ở danh mục thanh điều hướng bên trái để theo dõi chi tiết tài liệu học tập!</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
 
      {/* PANEL 3: EXAMS SET CHANGER */}
      {activeTab === "exams" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="dashboard-tab-exams">
          {exams.map((exam) => {
            return (
              <div
                key={exam.id}
                id={`exam-card-${exam.id}`}
                className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between space-y-4 hover:border-blue-400 transition text-left"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold tracking-widest px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                      Module: {exam.moduleId}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {exam.durationMinutes} phút
                    </span>
                  </div>
 
                  <h3 className="font-bold text-slate-900 text-sm leading-snug">{exam.title}</h3>
                  <p className="text-xs text-slate-500 leading-normal line-clamp-3">{exam.description}</p>
                </div>
 
                <div className="pt-3 border-t border-slate-150 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">
                    Ngân hàng: <span className="font-bold text-slate-700 font-mono">{exam.questions?.length} câu hỏi</span>
                  </span>
                  
                  <button
                    id={`launch-exam-btn-${exam.id}`}
                    type="button"
                    onClick={() => onStartExam(exam.id)}
                    className="px-3.5 py-1.5 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 transition cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    Vào thi ngay <ArrowRight className="h-3.h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
