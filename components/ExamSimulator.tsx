"use client";

import React, { useState, useEffect, useRef } from "react";
import { useIC3 } from "@/lib/ic3store";
import { Exam, Question } from "@/lib/ic3data";
import QuestionSimulation from "./QuestionSimulations";
import { Flag, Clock, ArrowRight, ShieldAlert, CheckCircle, AlertTriangle, RefreshCw, Eye, BookOpen, User, HelpCircle, FileText, BarChart3 } from "lucide-react";

export default function ExamSimulator({ examId, onBackToHome }: { examId: string; onBackToHome: () => void }) {
  const { exams, saveExamResult } = useIC3();
  const exam = exams.find((e) => e.id === examId) as Exam;
  const questions = exam ? (exam.questions || []) : [];

  // Active exam states
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(exam ? exam.durationMinutes * 60 : 45 * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Anti cheat counts simulation
  const [cheatWarnings, setCheatWarnings] = useState(0);
  const [showCheatModal, setShowCheatModal] = useState(false);

  // Result statistics loaded post-exam
  const [resultSummary, setResultSummary] = useState<{
    score: number;
    correctCount: number;
    totalCount: number;
    timeSpentSeconds: number;
    passed: boolean;
    skillRatings: { [skill: string]: { correct: number; total: number } };
  } | null>(null);

  // Refs for tracking time
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const initialDuration = exam ? exam.durationMinutes * 60 : 45 * 60;

  // Helper verifying 8 question response types
  function verifyQuestionAnswer(q: Question, ans: any): boolean {
    if (ans === undefined || ans === null) return false;

    if (q.type === "single-choice" || q.type === "true-false" || q.type === "video") {
      return ans === q.correctSingle;
    }

    if (q.type === "multiple-response") {
      const userList = (ans as string[]) || [];
      const correctList = q.correctMultiple || [];
      if (userList.length !== correctList.length) return false;
      return correctList.every((item) => userList.includes(item));
    }

    if (q.type === "matching") {
      const userMap = (ans as Record<string, string>) || {};
      const pairs = q.matchingPairs || [];
      if (Object.keys(userMap).length < pairs.length) return false;
      return pairs.every((p) => userMap[p.left] === p.right);
    }

    if (q.type === "drag-drop") {
      const userMap = (ans as Record<number, string>) || {};
      const targets = q.dragTargets || [];
      return targets.every((t, idx) => userMap[idx] === t.expectedItem);
    }

    if (q.type === "hotspot") {
      return ans === q.hotspots?.find((h) => h.isCorrect)?.id;
    }

    if (q.type === "performance") {
      const userFolders = (ans?.folders as string[]) || [];
      const expectedFolders = (q.performanceTask?.expectedState?.folders as string[]) || [];
      if (userFolders.length !== expectedFolders.length) return false;
      return expectedFolders.every((f) => userFolders.includes(f));
    }

    return false;
  }

  // Automated scoring formula
  function gradeExam(customAnswers = answers) {
    let correctCount = 0;
    const skillRatings: { [skill: string]: { correct: number; total: number } } = {};

    questions.forEach((q) => {
      const userAns = customAnswers[q.id];
      const isCorrect = verifyQuestionAnswer(q, userAns);

      if (isCorrect) correctCount++;

      // Map skill performance
      const skills = q.skills || ["Kiến thức chung"];
      skills.forEach((skill) => {
        if (!skillRatings[skill]) {
          skillRatings[skill] = { correct: 0, total: 0 };
        }
        skillRatings[skill].total += 1;
        if (isCorrect) {
          skillRatings[skill].correct += 1;
        }
      });
    });

    const totalCount = questions.length || 1;
    const score = Math.round((correctCount / totalCount) * 100);
    const passed = score >= exam.passingScorePercent;
    const timeSpentSeconds = initialDuration - timeLeftSeconds;

    return {
      score,
      correctCount,
      totalCount,
      timeSpentSeconds,
      passed,
      skillRatings,
    };
  }

  function executeSubmission() {
    if (timerRef.current) clearInterval(timerRef.current);
    
    const results = gradeExam();
    
    // Convert skills rating to logs object
    const skillPerformance: { [skill: string]: number } = {};
    Object.keys(results.skillRatings).forEach((skill) => {
      const rateObj = results.skillRatings[skill];
      skillPerformance[skill] = Math.round((rateObj.correct / rateObj.total) * 100);
    });

    saveExamResult(
      exam.id,
      results.score,
      results.correctCount,
      results.totalCount,
      results.timeSpentSeconds,
      skillPerformance
    );

    setResultSummary(results);
    setIsSubmitted(true);
  }

  function autoSubmitExam() {
    executeSubmission();
  }

  function submitExam() {
    if (window.confirm("Bạn có chắc chắn muốn nộp bài thi thử ngay bây giờ?")) {
      executeSubmission();
    }
  }

  // 1. Tick counting down timer
  useEffect(() => {
    if (!isSubmitted && timeLeftSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeftSeconds((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            autoSubmitExam();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSubmitted, timeLeftSeconds]);

  // 2. Anti-cheat monitoring tab blur
  useEffect(() => {
    const handleWindowBlur = () => {
      if (isSubmitted) return;
      setCheatWarnings((w) => {
        const next = w + 1;
        if (next <= 3) {
          setShowCheatModal(true);
        }
        return next;
      });
    };

    window.addEventListener("blur", handleWindowBlur);
    return () => window.removeEventListener("blur", handleWindowBlur);
  }, [isSubmitted]);

  if (!exam) {
    return (
      <div className="p-8 text-center" id="exam-not-found">
        <p className="text-red-500 font-bold">Không tìm thấy mã đề thi thích hợp!</p>
        <button id="back-to-home-btn" onClick={onBackToHome} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded">Quay lại</button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  const handleAnswerChange = (ans: any) => {
    setAnswers({
      ...answers,
      [currentQuestion.id]: ans,
    });
  };

  const toggleFlagged = (qId: string) => {
    setFlaggedQuestions({
      ...flaggedQuestions,
      [qId]: !flaggedQuestions[qId],
    });
  };

  const formatTime = (secs: number) => {
    const min = Math.floor(secs / 60);
    const sec = secs % 60;
    return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  // Close cheat modal warning alert
  const handleAcknowledgeCheat = () => {
    setShowCheatModal(false);
  };

  // ACTIVE EXAM WORKPLACE
  if (!isSubmitted) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4 grid grid-cols-1 lg:grid-cols-12 gap-6" id="active-test-suite">
        {/* Anti-cheat warning custom dialog */}
        {showCheatModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="cheat-alarm-modal">
            <div className="bg-white rounded-2xl border-4 border-red-500 shadow-2xl p-6 max-w-md w-full space-y-4">
              <div className="flex items-center space-x-3 text-red-600">
                <ShieldAlert className="h-10 w-10 shrink-0" />
                <h3 className="text-xl font-black uppercase tracking-wider">Hệ thống Giám thị Cảnh báo</h3>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed font-semibold">
                Phát hiện dời tiêu điểm trình duyệt máy tính hoặc mở ứng dụng hỗ trợ ngoài. Trong kỳ thi Certiport chính thức, hành động này có thể lập tức đình chỉ thi!
              </p>
              <div className="bg-red-50 p-3 rounded-lg border border-red-100 text-xs text-red-900 font-bold">
                ⚠️ Hiện tại bạn đã Vi phạm: {cheatWarnings} / 3 lần. Nếu vi phạm quá 3 lần, hệ thống sẽ tự động hạ mức xét tốt nghiệp thử!
              </div>
              <button
                id="ack-cheat-btn"
                type="button"
                onClick={handleAcknowledgeCheat}
                className="w-full py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 text-xs tracking-wider cursor-pointer shadow"
              >
                Tôi đã hiểu & Cam kết không gian lận
              </button>
            </div>
          </div>
        )}

        {/* LEFT WORKSPACE: Main Question & Instructions */}
        <div className="lg:col-span-8 space-y-4">
          {/* Header Dashboard panel */}
          <div className="bg-slate-900 text-white rounded-xl p-4 flex items-center justify-between shadow">
            <div className="flex items-center space-x-3">
              <Clock className="h-4.5 w-4.5 text-blue-400" />
              <span className="font-mono text-lg font-bold text-blue-300" id="exam-clock-time">
                {formatTime(timeLeftSeconds)}
              </span>
              <span className="text-[10px] text-slate-400 font-bold">/ {exam.durationMinutes} phút</span>
            </div>

            <div className="flex items-center space-x-3">
              <button
                id="flag-current-question"
                onClick={() => toggleFlagged(currentQuestion.id)}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  flaggedQuestions[currentQuestion.id]
                    ? "bg-rose-500 hover:bg-rose-600 text-white"
                    : "bg-slate-800 hover:bg-slate-700 text-gray-300"
                }`}
              >
                <Flag className="h-3.h-3 fill-current" />
                Đánh dấu xem lại
              </button>

              <button
                id="submit-exam-early-btn"
                onClick={submitExam}
                className="px-4 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-bold text-white shadow cursor-pointer transition"
              >
                Nộp bài thi
              </button>
            </div>
          </div>

          {/* Exam body box workspace */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8 space-y-6 min-h-[460px]">
            <div className="flex items-center justify-between border-b border-gray-150 pb-4">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest font-mono">
                Câu Hỏi {currentIndex + 1} ({currentQuestion.topic})
              </div>
              <span className="text-[10px] bg-slate-100 text-gray-600 font-bold font-mono px-2 py-0.5 rounded uppercase">
                {currentQuestion.type}
              </span>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 leading-snug">
                {currentQuestion.questionText}
              </h3>
              
              <div className="pt-4 border-t border-gray-100">
                <QuestionSimulation
                  question={currentQuestion}
                  currentAnswer={answers[currentQuestion.id]}
                  onChangeAnswer={handleAnswerChange}
                  showFeedback={false} // NEVER show answers during actual exam simulation
                />
              </div>
            </div>
          </div>

          {/* Exam navigation buttons bar */}
          <div className="flex items-center justify-between pt-4">
            <button
              id="back-btn-action-exam"
              onClick={() => currentIndex > 0 && setCurrentIndex(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="px-4 py-2.5 border border-gray-200 hover:bg-gray-100 rounded-xl bg-white text-xs font-bold font-mono text-gray-600 disabled:opacity-20 cursor-pointer disabled:pointer-events-none"
            >
              Quay lại (Back)
            </button>

            <button
              id="forward-btn-action-exam"
              onClick={() => currentIndex < questions.length - 1 && setCurrentIndex(currentIndex + 1)}
              disabled={currentIndex === questions.length - 1}
              className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold font-mono shadow-xs cursor-pointer transition disabled:opacity-20 disabled:pointer-events-none"
            >
              Tiếp theo (Next)
            </button>
          </div>
        </div>

        {/* RIGHT SIDEBAR: Grid navigator of all questions */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <div>
              <h3 className="font-bold text-xs text-slate-800">Bảng điều hướng câu hỏi</h3>
              <p className="text-[9px] text-slate-400">Xem nhanh tiến trình làm bài thi thử của bạn</p>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 gap-1.5">
              {questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined;
                const isFlagged = flaggedQuestions[q.id] || false;
                const isActive = currentIndex === idx;

                let cellColor = "border-slate-200 text-slate-600 hover:bg-slate-50";
                if (isAnswered) {
                  cellColor = "bg-blue-50 border-blue-200 text-blue-700 font-bold";
                }
                if (isFlagged) {
                  cellColor = "bg-rose-50 border-rose-250 text-rose-700 font-bold";
                }
                if (isActive) {
                  cellColor = "ring-2 ring-blue-600 ring-offset-2 border-blue-600 font-black";
                }

                return (
                  <button
                    key={q.id}
                    id={`nav-grid-cell-${idx}`}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded border text-[11px] text-center flex flex-col justify-center items-center transition cursor-pointer relative ${cellColor}`}
                  >
                    <span className="font-mono text-xs font-bold">{idx + 1}</span>
                    {isFlagged && <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-rose-500 rounded-full" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-150 space-y-1.5 text-[9px] text-slate-400 font-mono">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 bg-blue-50 border border-blue-200 rounded" />
                <span>Đã ghi nhận đáp án</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 bg-rose-50 border border-rose-200 rounded" />
                <span>Đã đánh dấu xem lại (Flagged)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 border border-slate-200 rounded" />
                <span>Chưa hoàn thành</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 border-2 border-blue-600 rounded" />
                <span>Câu đang hiển thị</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. SUBMITTED VIEW (DETAILED DIAGNOSTICS PERFORMANCE METRICS)
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6 animate-fade-in" id="test-results-screen">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-lg overflow-hidden">
        {/* Banner header achievement */}
        <div className={`p-8 text-white flex flex-col md:flex-row items-center justify-between text-left gap-6 ${
          resultSummary?.passed ? "bg-gradient-to-r from-emerald-600 to-teal-800" : "bg-gradient-to-r from-rose-600 to-red-800"
        }`}>
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 bg-white/20 border border-white/10 rounded-full">
              KẾT QUẢ THI KHẢO THÍ IC3 THỬ
            </span>
            <h2 className="text-3xl font-black text-white leading-tight">
              {resultSummary?.passed ? "Xin chúc mừng! Bạn đã đạt yêu cầu" : "Rất tiếc! Cần ôn luyện thêm điểm số để đạt yêu cầu"}
            </h2>
            <p className="text-sm opacity-85 text-white/90">
              Mã đề: <span className="font-mono font-bold">{exam.title}</span>
            </p>
          </div>

          <div className="shrink-0 flex flex-col items-center justify-center p-6 bg-white/10 rounded-2xl border border-white/10 text-center min-w-32">
            <span className="text-sm font-bold opacity-80 uppercase text-white/90">Điểm của bạn</span>
            <span className="text-5xl font-black">{resultSummary?.score}%</span>
            <span className="text-[10px] text-indigo-100 font-bold mt-1">Yêu cầu tối thiểu: {exam.passingScorePercent}%</span>
          </div>
        </div>

        {/* CORE STATS BLOCK GIVING Swiss precision visual style */}
        <div className="p-6 md:p-8 grid grid-cols-1 sm:grid-cols-3 gap-6 bg-slate-50 border-b border-gray-200 text-center">
          <div className="bg-white p-4 rounded-xl border border-gray-200/60 shadow-xs flex flex-col items-center justify-center" id="result-stat-answered">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Số câu chính xác</span>
            <span className="text-2xl font-black text-gray-800 mt-1">
              {resultSummary?.correctCount} / {resultSummary?.totalCount}
            </span>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-gray-200/60 shadow-xs flex flex-col items-center justify-center" id="result-stat-time">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Thời gian hoàn thành</span>
            <span className="text-2xl font-black text-gray-800 mt-1">
              {formatTime(resultSummary?.timeSpentSeconds || 0)}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200/60 shadow-xs flex flex-col items-center justify-center animate-pulse" id="result-stat-safety">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider font-mono text-rose-500">Giám thị chấm kết luận</span>
            <span className="text-sm font-black text-emerald-600 mt-1">
              AN TOÀN ✓ {cheatWarnings > 0 ? `(Rời focus: ${cheatWarnings} lần)` : "KHÔNG GIAN LẬN"}
            </span>
          </div>
        </div>

        {/* DETAILED DIAGNOSTICS PILLS */}
        <div className="p-6 md:p-8 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-black text-gray-800 flex items-center gap-1">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              Đánh giá phản hồi kỹ năng học tập chuyên sâu:
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.keys(resultSummary?.skillRatings || {}).map((skill) => {
                const item = resultSummary!.skillRatings[skill];
                const pct = Math.round((item.correct / item.total) * 100);

                let progressColor = "bg-red-500";
                if (pct >= 80) progressColor = "bg-emerald-500";
                else if (pct >= 50) progressColor = "bg-amber-500";

                return (
                  <div key={skill} className="p-4 border border-gray-200 rounded-xl bg-white space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-gray-700">{skill}</span>
                      <span className="text-gray-900">{pct}% ({item.correct}/{item.total} câu)</span>
                    </div>

                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      <div className={`${progressColor} h-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>

                    {pct < 60 && (
                      <p className="text-[10px] text-rose-600 font-semibold" id={`weakness-suggestion-${skill}`}>
                        📚 Trọng tâm còn yếu! Khuyên học viên xem lại tài liệu chuyên đề liên đới.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* BACK TO DASHBOARD NAVIGATION BAR */}
          <div className="pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              id="retake-exam-simulation-btn"
              type="button"
              onClick={() => {
                setIsSubmitted(false);
                setCurrentIndex(0);
                setAnswers({});
                setFlaggedQuestions({});
                setTimeLeftSeconds(exam.durationMinutes * 60);
                setCheatWarnings(0);
              }}
              className="w-full sm:w-auto px-6 py-3 bg-slate-100 text-gray-600 font-bold hover:bg-slate-200 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" /> Làm lại bài thi này
            </button>

            <button
              id="back-home-results-btn"
              type="button"
              onClick={onBackToHome}
              className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              Quay lại Bảng điều khiển (Dashboard)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
