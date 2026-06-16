"use client";

import React, { useState } from "react";
import { SAMPLE_QUESTIONS, IC3_MODULES } from "../lib/ic3data";
import { BookOpen, Check, X, ArrowRight, Home, RefreshCw, MessageSquare } from "lucide-react";

interface PracticeModuleProps {
  onBackToHome: () => void;
}

export default function PracticeModule({ onBackToHome }: PracticeModuleProps) {
  // Practice states
  const [selectedModule, setSelectedModule] = useState<"cf" | "ka" | "lo" | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [chosenOptionIndex, setChosenOptionIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const activeModuleInfo = selectedModule ? IC3_MODULES.find((m) => m.id === selectedModule) : null;
  const questionsList = selectedModule ? SAMPLE_QUESTIONS.filter((q) => q.module === selectedModule) : [];
  const activeQuestion = selectedModule ? questionsList[currentQuestionIndex] : null;

  const handleStartPractice = (moduleId: "cf" | "ka" | "lo") => {
    setSelectedModule(moduleId);
    setCurrentQuestionIndex(0);
    setChosenOptionIndex(null);
    setIsAnswered(false);
    setScore({ correct: 0, total: 0 });
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswered || !activeQuestion) return;
    setChosenOptionIndex(idx);
    setIsAnswered(true);

    const isCorrect = idx === activeQuestion.correctIndex;
    setScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questionsList.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setChosenOptionIndex(null);
      setIsAnswered(false);
    } else {
      // Reached the end of the question pool
      setIsAnswered(false);
    }
  };

  const handleExitPractice = () => {
    setSelectedModule(null);
  };

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-6 md:p-8 shadow-sm max-w-4xl mx-auto" id="practice-module-container">
      {/* Module Selection Panel */}
      {!selectedModule && (
        <div className="space-y-6" id="practice-selection">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-3xl font-extrabold font-display tracking-tight text-slate-900">
              Cổng Luyện Tập Tự Do
            </h2>
            <p className="text-slate-500 text-sm">
              Chọn một trong 3 phân môn bên dưới để làm các bài luyện tập với đáp án và lời giải thích chi tiết hiển thị trực quan ngay lập tức.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4" id="practice-module-grid">
            {IC3_MODULES.map((mod) => (
              <div
                key={mod.id}
                id={`practice-select-card-${mod.id}`}
                className="border border-slate-100 rounded-xl p-5 hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5 transition flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-800 text-sm mb-3">
                    {mod.id.toUpperCase()}
                  </div>
                  <h4 className="font-bold text-slate-900 font-display text-sm leading-tight">
                    {mod.name.split("(")[0].trim()}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 lines-3 leading-relaxed">
                    {mod.description}
                  </p>
                </div>

                <button
                  id={`btn-start-prac-${mod.id}`}
                  onClick={() => handleStartPractice(mod.id)}
                  className="w-full mt-5 py-2 hover:bg-blue-50 text-blue-600 font-bold border border-blue-200 hover:border-blue-400 rounded-lg text-xs transition"
                >
                  Luyện tập tức thì
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-4">
            <button
              id="practice-home-back"
              onClick={onBackToHome}
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs shadow transition"
            >
              <Home className="w-4 h-4" />
              Về Trang chủ
            </button>
          </div>
        </div>
      )}

      {/* Active Work Panel */}
      {selectedModule && activeQuestion && activeModuleInfo && (
        <div className="space-y-6" id="practice-active-stage">
          {/* Practice Header Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2.5 py-0.5 rounded-full">
                Luyện tập tự do • {activeModuleInfo.name.split("(")[0].trim()}
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-1">
                Câu hỏi {currentQuestionIndex + 1} trên {questionsList.length}
              </h3>
            </div>

            <div className="bg-slate-50 border border-slate-100 px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-600 self-start" id="practice-score">
              Điểm tập: <span className="font-extrabold text-blue-600 text-sm">{score.correct}</span> / {score.total} đúng
            </div>
          </div>

          {/* Core Question Card */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 md:p-6" id="practice-question">
            <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-600 block mb-1">
              Chủ đề: {activeQuestion.topic}
            </span>
            <p className="text-slate-800 font-medium text-base md:text-lg leading-relaxed">
              {activeQuestion.questionText}
            </p>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 gap-3" id="practice-options-list">
            {activeQuestion.options.map((opt, idx) => {
              const isCorrectOpt = idx === activeQuestion.correctIndex;
              const isChosen = idx === chosenOptionIndex;

              let btnStyle = "border-slate-200 hover:bg-slate-50 bg-white text-slate-700";
              let badgeStyle = "bg-slate-100 border-slate-200 text-slate-500";

              if (isAnswered) {
                if (isCorrectOpt) {
                  btnStyle = "bg-emerald-50 border-emerald-400 text-emerald-950";
                  badgeStyle = "bg-emerald-600 border-emerald-500 text-white";
                } else if (isChosen) {
                  btnStyle = "bg-rose-50 border-rose-400 text-rose-950";
                  badgeStyle = "bg-rose-600 border-rose-500 text-white";
                } else {
                  btnStyle = "opacity-50 bg-white border-slate-100 text-slate-400 cursor-not-allowed";
                  badgeStyle = "bg-slate-50 border-slate-100 text-slate-300";
                }
              }

              return (
                <button
                  key={idx}
                  id={`practice-opt-${idx}`}
                  disabled={isAnswered}
                  onClick={() => handleSelectOption(idx)}
                  className={`flex items-start text-left gap-4 p-4 border rounded-xl font-medium text-sm transition ${btnStyle}`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold border shrink-0 ${badgeStyle}`}>
                    {isAnswered && isCorrectOpt ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : isAnswered && isChosen ? (
                      <X className="w-3.5 h-3.5" />
                    ) : (
                      String.fromCharCode(65 + idx)
                    )}
                  </span>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>

          {/* Detailed explanation shown immediately after answering */}
          {isAnswered && (
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 animate-fade-in" id="practice-explanation-card">
              <div className="flex items-center gap-2 text-blue-800 font-bold text-sm mb-2" id="practice-expl-head">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span>Giải thích đáp án chọn</span>
              </div>
              <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                {activeQuestion.explanation}
              </p>
            </div>
          )}

          {/* Navigation controls */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-5">
            <button
              id="practice-exit-btn"
              onClick={handleExitPractice}
              className="px-4 py-2 hover:bg-slate-100 text-slate-600 font-semibold border border-slate-200 rounded-lg text-xs transition"
            >
              Thoát luyện tập
            </button>

            {isAnswered && (
              <button
                id="practice-next-btn"
                onClick={handleNextQuestion}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow transition animate-fade-in"
              >
                {currentQuestionIndex < questionsList.length - 1 ? (
                  <>
                    Câu tiếp theo
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Luyện lại từ đầu
                    <RefreshCw className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
