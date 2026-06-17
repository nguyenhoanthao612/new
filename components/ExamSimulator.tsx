"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useIC3 } from "../lib/ic3store";
import { SAMPLE_QUESTIONS, IC3_MODULES } from "../lib/ic3data";
import { Timer, ArrowLeft, ArrowRight, CheckCircle2, XCircle, AlertTriangle, RefreshCw } from "lucide-react";

interface ExamSimulatorProps {
  module: "cf" | "ka" | "lo";
  onClose: () => void;
}

export default function ExamSimulator({ module, onClose }: ExamSimulatorProps) {
  const { saveExamResult } = useIC3();

  const moduleInfo = IC3_MODULES.find((m) => m.id === module)!;
  const questions = SAMPLE_QUESTIONS.filter((q) => q.module === module);

  // States
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [timeRemaining, setTimeRemaining] = useState(moduleInfo.timeLimit * 60); // in seconds
  const [examStatus, setExamStatus] = useState<"ready" | "testing" | "completed">("ready");
  const [score, setScore] = useState<{ correct: number; total: number; score1000: number; passed: boolean } | null>(null);

  const currentQuestion = questions[currentQuestionIndex];

  // Auto-submit Callback
  const submitExam = useCallback(async () => {
    let correctCount = 0;
    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        correctCount += 1;
      }
    });

    const totalCount = questions.length;
    const score1000 = Math.round((correctCount / totalCount) * 1000);
    const passed = score1000 >= 700;

    const timeSpent = moduleInfo.timeLimit * 60 - timeRemaining;

    setScore({
      correct: correctCount,
      total: totalCount,
      score1000,
      passed,
    });

    setExamStatus("completed");

    try {
      await saveExamResult(module, correctCount, totalCount, timeSpent);
    } catch (e) {
      console.error("Lỗi khi lưu kết quả thi:", e);
    }
  }, [questions, selectedAnswers, module, saveExamResult, moduleInfo.timeLimit, timeRemaining]);

  // Handle countdown timer
  useEffect(() => {
    if (examStatus !== "testing") return;

    if (timeRemaining <= 0) {
      submitExam();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, examStatus, submitExam]);

  const handleStartExam = () => {
    setTimeRemaining(moduleInfo.timeLimit * 60);
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setExamStatus("testing");
    setScore(null);
  };

  // Format time (MM:SS)
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleSelectOption = (optionIndex: number) => {
    if (examStatus !== "testing") return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionIndex
    }));
  };

  return (
    <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-xl p-6 md:p-8 shadow-md" id="exam-simulator-stage">
      {/* Intro Frame / Pre-Exam State */}
      {examStatus === "ready" && (
        <div className="text-center py-8 space-y-6 max-w-xl mx-auto" id="stage-ready">
          <h2 className="text-3xl font-extrabold font-display tracking-tight text-white">
            Chuẩn bị thi thử IC3
          </h2>
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-5 text-left text-slate-300 space-y-3">
            <p className="font-semibold text-white">Chi tiết phòng thi:</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-400">Phân môn:</span>
                <p className="font-medium text-white">{moduleInfo.name}</p>
              </div>
              <div>
                <span className="text-slate-400">Số lượng câu hỏi:</span>
                <p className="font-medium text-white">{questions.length} câu trắc nghiệm</p>
              </div>
              <div>
                <span className="text-slate-400">Thời gian làm bài:</span>
                <p className="font-medium text-white">{moduleInfo.timeLimit} phút</p>
              </div>
              <div>
                <span className="text-slate-400">Điểm tối thiểu đạt:</span>
                <p className="font-medium text-emerald-400">700 / 1000 điểm</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-amber-300 bg-amber-500/10 border border-amber-500/20 px-4 py-3 rounded-lg text-sm text-center">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>Màn hình sẽ hiển thị bộ đếm giờ. Vui lòng không tải lại trang khi đang thi.</span>
          </div>

          <div className="flex gap-4 justify-center pt-2">
            <button
              id="back-btn"
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg transition"
            >
              Quay lại danh mục
            </button>
            <button
              id="start-exam-btn"
              onClick={handleStartExam}
              className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md transition"
            >
              Bắt đầu Thi thử
            </button>
          </div>
        </div>
      )}

      {/* Active Testing State */}
      {examStatus === "testing" && (
        <div className="space-y-6" id="stage-testing">
          {/* Header Progress and Timer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase text-blue-400 tracking-wider">
                Đang thi thử • {moduleInfo.name}
              </p>
              <h3 className="text-lg font-bold text-white mt-0.5">
                Câu hỏi {currentQuestionIndex + 1} / {questions.length}
              </h3>
            </div>

            <div className="flex items-center gap-3 bg-slate-800/80 border border-slate-700 px-4 py-2 rounded-lg" id="timer-box">
              <Timer className="w-5 h-5 text-emerald-400" />
              <div className="text-right">
                <span className="text-xs text-slate-400 font-mono block">Thời gian còn lại</span>
                <span className="text-lg font-bold font-mono text-emerald-400">
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Nav Circle Bar */}
          <div className="flex flex-wrap gap-2 py-1 max-h-24 overflow-y-auto bg-slate-950/40 border border-slate-800/80 p-3 rounded-lg" id="quick-nav-panel">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                id={`quick-nav-${idx}`}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`w-9 h-9 rounded-lg text-xs font-semibold transition ${currentQuestionIndex === idx ? "bg-blue-600 text-white border border-blue-500 scale-110" : selectedAnswers[q.id] !== undefined ? "bg-slate-700 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {/* Question Text Card */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-6" id="active-question-card">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block mb-2">
              Chủ đề: {currentQuestion.topic}
            </span>
            <h4 className="text-lg md:text-xl font-medium text-white leading-relaxed">
              {currentQuestion.questionText}
            </h4>
          </div>

          {/* Options List */}
          <div className="grid grid-cols-1 gap-3" id="testing-options-grid">
            {currentQuestion.options.map((opt, idx) => {
              const isChecked = selectedAnswers[currentQuestion.id] === idx;
              return (
                <button
                  key={idx}
                  id={`option-btn-${idx}`}
                  onClick={() => handleSelectOption(idx)}
                  className={`flex items-start text-left gap-4 p-4 border rounded-xl transition ${isChecked ? "bg-blue-600/10 border-blue-500 text-white" : "bg-slate-800/30 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"}`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border shrink-0 ${isChecked ? "bg-blue-600 border-blue-500 text-white" : "bg-slate-800 border-slate-700 text-slate-400"}`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-sm font-medium pt-0.5">{opt}</span>
                </button>
              );
            })}
          </div>

          {/* Bottom Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              id="prev-question-btn"
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold transition disabled:opacity-30 disabled:pointer-events-none"
            >
              <ArrowLeft className="w-4 h-4" />
              Câu trước
            </button>

            {currentQuestionIndex === questions.length - 1 ? (
              <button
                id="submit-exam-trigger"
                onClick={submitExam}
                className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-bold rounded-lg shadow transition animate-fade-in"
              >
                Nộp bài thi
              </button>
            ) : (
              <div aria-hidden="true" className="w-24 sm:w-28" />
            )}

            <button
              id="next-question-btn"
              disabled={currentQuestionIndex === questions.length - 1}
              onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold transition disabled:opacity-30 disabled:pointer-events-none"
            >
              Câu kế tiếp
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Post Exam Review and Detailed Performance Screen */}
      {examStatus === "completed" && score && (
        <div className="space-y-6" id="stage-completed">
          {/* Result Header Card */}
          <div className={`text-center py-6 px-4 border rounded-xl ${score.passed ? "bg-emerald-950/20 border-emerald-800 text-emerald-100" : "bg-rose-950/20 border-rose-800 text-rose-100"}`} id="exam-score-panel">
            <div className="flex justify-center mb-3">
              {score.passed ? (
                <CheckCircle2 className="w-16 h-16 text-emerald-400" />
              ) : (
                <XCircle className="w-16 h-16 text-rose-400" />
              )}
            </div>
            <h2 className="text-3xl font-black font-display text-white">
              {score.passed ? "ĐẠT CHỨNG CHỈ (PASSED)" : "CHƯA ĐẠT CHỨNG CHỈ"}
            </h2>
            <p className="text-sm mt-1 opacity-80">
              {score.passed ? "Chúc mừng bạn đã hoàn thiện bài kiểm tra xuất sắc!" : "Cố ý ôn tập kỹ hơn nội dung và rèn luyện tiếp nhé!"}
            </p>

            <div className="grid grid-cols-3 gap-2 mt-6 max-w-md mx-auto text-center">
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400 block">Điểm số chuẩn</span>
                <span className="text-2xl font-extrabold text-white">{score.score1000}</span>
                <span className="text-xs text-slate-500 block">trên 1000</span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400 block">Đúng / Tổng số</span>
                <span className="text-2xl font-extrabold text-white">{score.correct} / {score.total}</span>
                <span className="text-xs text-slate-500 block">câu hỏi</span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 font-semibold flex flex-col justify-center items-center">
                <span className="text-xs text-slate-400 block">Tỷ lệ chính xác</span>
                <span className="text-xl font-extrabold text-white">{Math.round((score.correct / score.total) * 100)}%</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-between items-center bg-slate-950/50 p-4 border border-slate-800 rounded-lg">
            <button
              id="back-home-or-dash"
              onClick={onClose}
              className="px-5 py-2 hover:bg-slate-800 text-slate-300 font-medium rounded-lg text-sm border border-slate-800"
            >
              Thoát phòng thi
            </button>
            <button
              id="exam-retrial"
              onClick={handleStartExam}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm shadow transition"
            >
              <RefreshCw className="w-4 h-4" />
              Thi lại bài này
            </button>
          </div>

          {/* Detailed Question Review List */}
          <div className="space-y-4" id="completed-review-section">
            <h3 className="text-xl font-bold text-white font-display border-b border-slate-800 pb-2">
              Xem lại từng câu của bài thi
            </h3>

            {questions.map((q, idx) => {
              const userAns = selectedAnswers[q.id];
              const isCorrect = userAns === q.correctIndex;
              return (
                <div key={q.id} className={`p-5 rounded-xl border ${isCorrect ? "bg-emerald-950/10 border-emerald-900/60" : userAns === undefined ? "bg-slate-900/40 border-slate-800" : "bg-rose-950/10 border-rose-900/60"}`}>
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <span className="text-xs font-bold px-2 py-0.5 bg-slate-800 text-indigo-300 rounded uppercase">
                      Câu {idx + 1}: {q.topic}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${isCorrect ? "bg-emerald-500/10 text-emerald-400" : userAns === undefined ? "bg-slate-800 text-slate-400" : "bg-rose-500/10 text-rose-400"}`}>
                      {isCorrect ? "Đúng" : userAns === undefined ? "Chưa trả lời" : "Sai"}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-white mb-3">{q.questionText}</p>

                  <div className="space-y-1.5 text-xs">
                    {q.options.map((opt, oIdx) => {
                      const isCorrectOpt = oIdx === q.correctIndex;
                      const isUserOpt = oIdx === userAns;
                      return (
                        <div
                          key={oIdx}
                          className={`flex items-center gap-2 p-2 rounded ${isCorrectOpt ? "bg-emerald-500/10 text-emerald-300 border border-emerald-900/30" : isUserOpt ? "bg-rose-500/10 text-rose-300 border border-rose-900/30" : "text-slate-400"}`}
                        >
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${isCorrectOpt ? "bg-emerald-500 text-white" : isUserOpt ? "bg-rose-500 text-white" : "bg-slate-800 text-slate-500"}`}>
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span>{opt}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation card */}
                  <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400 leading-relaxed bg-slate-950/20 p-3 rounded border border-slate-800/40">
                    <strong className="text-slate-300">Giải thích đáp án đúng:</strong> {q.explanation}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
