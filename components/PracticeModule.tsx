"use client";

import React, { useState } from "react";
import { useIC3 } from "@/lib/ic3store";
import { Question } from "@/lib/ic3data";
import QuestionSimulation from "./QuestionSimulations";
import { ArrowLeft, ArrowRight, ShieldCheck, Sparkles, BookOpen, RotateCcw, AlertTriangle, MessageSquare, Loader2 } from "lucide-react";

export default function PracticeModule({ onBackToHome }: { onBackToHome: () => void }) {
  const { questions, lessons } = useIC3();

  // Filters state
  const [selectedModule, setSelectedModule] = useState<"CF" | "KA" | "LO" | "ANY">("ANY");
  const [selectedDifficulty, setSelectedDifficulty] = useState<"easy" | "medium" | "hard" | "ANY">("ANY");
  const [hasStarted, setHasStarted] = useState(false);

  // Active session state
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [submittedQuestions, setSubmittedQuestions] = useState<Record<string, boolean>>({});

  // AI Explanation state
  const [aiExplanations, setAiExplanations] = useState<Record<string, string>>({});
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});
  const [aiErrors, setAiErrors] = useState<Record<string, string>>({});

  const startPractice = () => {
    let filtered = [...questions];
    if (selectedModule !== "ANY") {
      filtered = filtered.filter((q) => q.moduleId === selectedModule);
    }
    if (selectedDifficulty !== "ANY") {
      filtered = filtered.filter((q) => q.difficulty === selectedDifficulty);
    }

    if (filtered.length === 0) {
      alert("Không tìm thấy câu hỏi nào phù hợp với bộ lọc đã chọn!");
      return;
    }

    // Shuffle session questions for realistic practice
    filtered.sort(() => Math.random() - 0.5);
    setSessionQuestions(filtered);
    setCurrentIndex(0);
    setUserAnswers({});
    setSubmittedQuestions({});
    setAiExplanations({});
    setAiLoading({});
    setAiErrors({});
    setHasStarted(true);
  };

  const currentQuestion = sessionQuestions[currentIndex];

  const handleAnswerChange = (ans: any) => {
    if (!currentQuestion) return;
    setUserAnswers({
      ...userAnswers,
      [currentQuestion.id]: ans,
    });
  };

  const handleVerifyAnswer = () => {
    if (!currentQuestion) return;
    setSubmittedQuestions({
      ...submittedQuestions,
      [currentQuestion.id]: true,
    });
  };

  const handleNext = () => {
    if (currentIndex < sessionQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Fetch explanation from server side Gemini 
  const fetchGeminiExplanation = async (q: Question) => {
    if (aiExplanations[q.id]) return; // Already fetched

    setAiLoading({ ...aiLoading, [q.id]: true });
    setAiErrors({ ...aiErrors, [q.id]: "" });

    try {
      // Format correct answers representation
      let correctAnswers = "";
      if (q.type === "single-choice" || q.type === "true-false") {
        correctAnswers = q.correctSingle || "";
      } else if (q.type === "multiple-response") {
        correctAnswers = (q.correctMultiple || []).join(", ");
      } else if (q.type === "matching") {
        correctAnswers = (q.matchingPairs || []).map((p) => `${p.left} -> ${p.right}`).join("; ");
      } else if (q.type === "drag-drop") {
        correctAnswers = (q.dragTargets || []).map((t) => `${t.placeholder} = ${t.expectedItem}`).join("; ");
      } else if (q.type === "hotspot") {
        correctAnswers = q.hotspots?.find((h) => h.isCorrect)?.name || "Vùng tọa độ tiêu chuẩn";
      } else if (q.type === "performance") {
        correctAnswers = (q.performanceTask?.expectedState?.folders || []).join(", ");
      }

      const response = await fetch("/api/gemini/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionText: q.questionText,
          questionType: q.type,
          correctAnswers,
          explanationSeed: q.explanation,
        }),
      });

      const data = await response.json();
      if (response.ok && data.text) {
        setAiExplanations({ ...aiExplanations, [q.id]: data.text });
      } else {
        throw new Error(data.error || "Không nhận được phản hồi hợp lệ.");
      }
    } catch (err: any) {
      console.error(err);
      setAiErrors({
        ...aiErrors,
        [q.id]: "Không thể kết nối đến AI. Vui lòng bấm thử lại hoặc sử dụng nội dung giải thích cơ bản đi kèm bên dưới.",
      });
    } finally {
      setAiLoading({ ...aiLoading, [q.id]: false });
    }
  };

  if (!hasStarted) {
    return (
      <div className="max-w-2xl mx-auto py-6 px-4" id="practice-setup-view">
        <button
          id="practice-back-btn"
          onClick={onBackToHome}
          className="mb-4 inline-flex items-center text-xs font-bold text-slate-500 hover:text-blue-600 transition gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại trang chủ
        </button>

        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-5">
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Luyện Tập Theo Chuyên Đề & Kỹ Năng
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Chế độ luyện tập cho phép bạn thử sức không giới hạn thời gian, có thể kiểm tra kết quả ngay lập tức sau mỗi câu hỏi và tham khảo giải thích khoa học từ AI trợ giảng Gemini.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-150">
            {/* Module selection */}
            <div className="space-y-1.5" id="module-filter-select">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">Chọn phân hệ IC3:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="filter-mod-any"
                  onClick={() => setSelectedModule("ANY")}
                  className={`py-2 px-3 rounded border text-[11px] font-bold transition cursor-pointer ${
                    selectedModule === "ANY"
                      ? "border-blue-600 bg-blue-50/50 text-blue-900"
                      : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  Tất cả Module
                </button>
                <button
                  type="button"
                  id="filter-mod-cf"
                  onClick={() => setSelectedModule("CF")}
                  className={`py-2 px-3 rounded border text-[11px] font-bold transition cursor-pointer ${
                    selectedModule === "CF"
                      ? "border-blue-600 bg-blue-50/50 text-blue-900"
                      : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  CF (Cơ bản máy tính)
                </button>
                <button
                  type="button"
                  id="filter-mod-ka"
                  onClick={() => setSelectedModule("KA")}
                  className={`py-2 px-3 rounded border text-[11px] font-bold transition cursor-pointer ${
                    selectedModule === "KA"
                      ? "border-blue-600 bg-blue-50/50 text-blue-900"
                      : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  KA (Ứng dụng Văn phòng)
                </button>
                <button
                  type="button"
                  id="filter-mod-lo"
                  onClick={() => setSelectedModule("LO")}
                  className={`py-2 px-3 rounded border text-[11px] font-bold transition cursor-pointer ${
                    selectedModule === "LO"
                      ? "border-blue-600 bg-blue-50/50 text-blue-900"
                      : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  LO (Cuộc sống Trực tuyến)
                </button>
              </div>
            </div>

            {/* Difficulty selection */}
            <div className="space-y-1.5" id="difficulty-filter-select">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">Chọn mức độ khó:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="filter-diff-any"
                  onClick={() => setSelectedDifficulty("ANY")}
                  className={`py-2 px-3 rounded border text-[11px] font-bold transition cursor-pointer ${
                    selectedDifficulty === "ANY"
                      ? "border-blue-600 bg-blue-50/50 text-blue-900"
                      : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  Mọi cấp độ
                </button>
                <button
                  type="button"
                  id="filter-diff-easy"
                  onClick={() => setSelectedDifficulty("easy")}
                  className={`py-2 px-3 rounded border text-[11px] font-bold transition cursor-pointer ${
                    selectedDifficulty === "easy"
                      ? "border-green-600 bg-green-50/30 text-green-900"
                      : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  Dễ (Easy)
                </button>
                <button
                  type="button"
                  id="filter-diff-medium"
                  onClick={() => setSelectedDifficulty("medium")}
                  className={`py-2 px-3 rounded border text-[11px] font-bold transition cursor-pointer ${
                    selectedDifficulty === "medium"
                      ? "border-amber-600 bg-amber-50/30 text-amber-900"
                      : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  Trung bình (Medium)
                </button>
                <button
                  type="button"
                  id="filter-diff-hard"
                  onClick={() => setSelectedDifficulty("hard")}
                  className={`py-2 px-3 rounded border text-[11px] font-bold transition cursor-pointer ${
                    selectedDifficulty === "hard"
                      ? "border-red-656 bg-red-50/30 text-red-900 animate-none"
                      : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  Khó (Hard)
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-150">
            <button
              id="start-practice-session-btn"
              type="button"
              onClick={startPractice}
              className="w-full py-2.5 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 text-sm shadow-xs transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4" /> Bắt đầu luyện tập ngay
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isCurrentSubmitted = submittedQuestions[currentQuestion.id] || false;
  const currentAns = userAnswers[currentQuestion.id];

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 grid grid-cols-1 lg:grid-cols-12 gap-6" id="practice-learning-room">
      {/* LEFT: Question and simulation board */}
      <div className="lg:col-span-8 space-y-4">
        <div className="flex items-center justify-between">
          <button
            id="exit-practice-session"
            onClick={() => setHasStarted(false)}
            className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-blue-600 gap-1 cursor-pointer"
          >
            <ArrowLeft className="h-3 w-3" /> Thiết lập lại bộ lọc
          </button>

          <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold">
            Câu {currentIndex + 1} / {sessionQuestions.length}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 md:p-6 space-y-5">
          {/* Question Headers Metadata */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold uppercase px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-mono text-[9px]">
              {currentQuestion.topic}
            </span>
            <span
              className={`font-bold uppercase px-2 py-0.5 rounded font-mono text-[9px] ${
                currentQuestion.difficulty === "easy"
                  ? "bg-green-105 bg-green-50 text-green-700 border border-green-100"
                  : currentQuestion.difficulty === "medium"
                  ? "bg-amber-50 text-amber-700 border border-amber-100"
                  : "bg-red-50 text-red-700 border border-red-100"
              }`}
            >
              {currentQuestion.difficulty === "easy" ? "Dễ" : currentQuestion.difficulty === "medium" ? "Trung bình" : "Khó"}
            </span>
          </div>

          {/* Question Text */}
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-slate-800 leading-snug">
              {currentQuestion.questionText}
            </h3>
          </div>

          {/* Core Interactive Question simulator */}
          <div className="pt-4 border-t border-slate-100">
            <QuestionSimulation
              question={currentQuestion}
              currentAnswer={currentAns}
              onChangeAnswer={handleAnswerChange}
              showFeedback={isCurrentSubmitted}
            />
          </div>

          {/* Practice interactions panel */}
          <div className="pt-5 border-t border-slate-150 flex items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <button
                id="prev-question-btn"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-20 cursor-pointer disabled:pointer-events-none"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                id="next-question-btn"
                onClick={handleNext}
                disabled={currentIndex === sessionQuestions.length - 1}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-20 cursor-pointer disabled:pointer-events-none"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {isCurrentSubmitted ? (
                <button
                  id="gemini-ai-explain-btn"
                  type="button"
                  onClick={() => fetchGeminiExplanation(currentQuestion)}
                  className="px-3 py-1.5 bg-blue-50 border border-blue-250 border-blue-250 border-blue-200 rounded text-blue-700 hover:bg-blue-105 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Sparkles className="h-3.h-3.5 h-3.5 w-3.5 text-blue-600" />
                  Gemini AI Giải thích
                </button>
              ) : (
                <button
                  id="verify-practice-answer-btn"
                  type="button"
                  onClick={handleVerifyAnswer}
                  disabled={currentAns === undefined}
                  className="px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-750 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:bg-slate-200 disabled:pointer-events-none disabled:text-slate-400"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Kiểm tra đáp án
                </button>
              )}
            </div>
          </div>
        </div>

        {/* DEFAULT STATIC REFERENCE MATERIAL PANEL SHOWN POST-SUBMISSION */}
        {isCurrentSubmitted && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2" id="static-explanation-card">
            <h4 className="text-xs font-bold text-slate-800 border-b pb-1.5 flex items-center gap-1">
              📙 Giải thích đáp án cơ bản:
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed italic">
              {currentQuestion.explanation}
            </p>
            {currentQuestion.skills && (
              <div className="pt-2 flex flex-wrap gap-1 text-[9px] font-bold text-slate-500">
                Kỹ năng: {currentQuestion.skills.map(s => (
                  <span key={s} className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">{s}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT SIDEBAR: AI Assist & Gemini generated report panel */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col min-h-[400px]">
          {/* AI Banner */}
          <div className="bg-slate-900 p-4 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4.5 w-4.5 text-blue-400 fill-blue-400" />
              <div>
                <h3 className="font-bold text-xs">Phân tích chuyên sâu</h3>
                <p className="text-[10px] text-slate-400">AI Trợ giảng Gemini 3.5</p>
              </div>
            </div>
            <span className="text-[9px] bg-blue-600 border border-blue-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Server-Side
            </span>
          </div>

          <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
            {aiLoading[currentQuestion.id] ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 py-12" id="ai-fetching-loader">
                <Loader2 className="h-7 w-7 text-blue-600 animate-spin" />
                <div>
                  <p className="text-xs font-bold text-slate-700">Gemini đang nghiên cứu đáp án...</p>
                  <p className="text-[10px] text-slate-400">Đọc tư liệu học thuật Certiport và tạo giải thích sư phạm</p>
                </div>
              </div>
            ) : aiExplanations[currentQuestion.id] ? (
              <div className="text-left space-y-4 prose max-w-none text-xs leading-relaxed overflow-y-auto max-h-[420px] scrollbar-thin" id="ai-response-markdown">
                <div className="whitespace-pre-line text-slate-700 font-sans p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  {aiExplanations[currentQuestion.id]}
                </div>
              </div>
            ) : aiErrors[currentQuestion.id] ? (
              <div className="p-4 bg-red-50 border border-red-100 rounded-lg space-y-2 text-xs" id="ai-error-notice">
                <p className="font-bold text-red-800 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 shrink-0" /> Không tải được AI Giải thích
                </p>
                <p className="text-slate-600 text-[10px]">{aiErrors[currentQuestion.id]}</p>
                <button
                  id="retry-ai-btn"
                  type="button"
                  onClick={() => fetchGeminiExplanation(currentQuestion)}
                  className="px-3 py-1 bg-red-600 text-white rounded text-[10px] font-bold cursor-pointer"
                >
                  Thử lại
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 py-8 px-2 text-slate-400" id="ai-idle">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-base">🤖</div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-700">Chưa tải phân tích của hệ thống</p>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Hãy bấm nút <strong>&quot;Kiểm tra đáp án&quot;</strong> trước, sau đó bấm <strong>&quot;Gemini AI Giải thích&quot;</strong> để tải tài liệu ôn luyện chi tiết nhất của Trí tuệ Nhân tạo.
                  </p>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-150 flex items-center justify-between text-[9px] text-slate-400 font-mono">
              <span>Mô hình: gemini-3.5-flash</span>
              <span>An toàn 100%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
