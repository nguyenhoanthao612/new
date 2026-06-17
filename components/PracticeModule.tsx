"use client";

import React, { useState, useEffect, useRef } from "react";
import { IC3_MODULES, IC3Question } from "../lib/ic3data";
import { useIC3 } from "../lib/ic3store";
import { 
  BookOpen, 
  Check, 
  X, 
  ArrowRight, 
  ArrowLeft,
  Home, 
  RefreshCw, 
  MessageSquare, 
  Clock, 
  Award, 
  Flame, 
  ShieldCheck, 
  AlertTriangle,
  Play,
  CheckCircle,
  HelpCircle,
  Trophy,
  Shield,
  Loader2,
  ArrowUp,
  ArrowDown,
  MapPin,
  RotateCw
} from "lucide-react";

interface PracticeModuleProps {
  onBackToHome: () => void;
}

interface SessionQuestion {
  originalQuestion: IC3Question;
  questionText: string;
  topic: string;
  explanation: string;
  shuffledOptions: string[];
  correctIndexInShuffled: number;
}

export default function PracticeModule({ onBackToHome }: PracticeModuleProps) {
  const { questions, saveExamResult } = useIC3();

  // 3 Primary Modes: "training" | "testing" | "race"
  const [activeTab, setActiveTab] = useState<"training" | "testing" | "race">("training");
  
  // Quick filter row
  const [quickFilter, setQuickFilter] = useState<"all" | "cf" | "ka" | "lo">("all");

  // Portal session configurations
  const [selectedModule, setSelectedModule] = useState<"cf" | "ka" | "lo" | null>(null);
  const [sessionMode, setSessionMode] = useState<"training" | "testing" | "race" | null>(null);
  const [sessionQuestions, setSessionQuestions] = useState<SessionQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Interaction answers
  const [chosenOptionIndex, setChosenOptionIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  // A. Training Mode States
  const [practiceScore, setPracticeScore] = useState({ correct: 0, total: 0 });

  // B. Testing Mode States
  const [isTestActive, setIsTestActive] = useState(false);
  const [testAnswers, setTestAnswers] = useState<Record<number, any>>({}); // index -> selectedOption index or custom answer state
  const [testTimeLeft, setTestTimeLeft] = useState(50 * 60); // 50 mins
  const [testResult, setTestResult] = useState<{
    correctCount: number;
    wrongCount: number;
    scoreVal: number;
    percentRate: number;
    moduleName: string;
    moduleId: "cf" | "ka" | "lo";
  } | null>(null);

  // C. Race Mode States
  const [raceRestartCount, setRaceRestartCount] = useState(0);
  const [raceStartTime, setRaceStartTime] = useState<number>(0);
  const [raceElapsedTime, setRaceElapsedTime] = useState<number>(0);
  const [raceCompleted, setRaceCompleted] = useState(false);
  const [showRaceFailedModal, setShowRaceFailedModal] = useState(false);

  // Shared state helpers
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showNoQuestionsModal, setShowNoQuestionsModal] = useState(false);
  const [showAnswersWarning, setShowAnswersWarning] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Get current active details
  const activeModuleInfo = selectedModule ? IC3_MODULES.find((m) => m.id === selectedModule) : null;
  const activeQuestion = (selectedModule && sessionQuestions.length > 0) ? sessionQuestions[currentQuestionIndex] : null;

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Timer loop for All Active Modes (Testing, Training, Race)
  useEffect(() => {
    const isSessionTimerActive = (isTestActive || (selectedModule && (sessionMode === "training" || sessionMode === "race"))) && !testResult && !raceCompleted && testTimeLeft > 0;
    if (isSessionTimerActive) {
      timerRef.current = setInterval(() => {
        setTestTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            handleCompleteSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTestActive, selectedModule, sessionMode, testResult, raceCompleted, testTimeLeft]);

  // Unified session starting handler
  const handleStartSession = (moduleId: "cf" | "ka" | "lo", mode: "training" | "testing" | "race") => {
    const rawList = questions.filter((q) => q.module === moduleId);
    if (rawList.length === 0) {
      setShowNoQuestionsModal(true);
      return;
    }

    // Prepare questions with shuffled options
    const preparedQuestions: SessionQuestion[] = rawList.map((q) => {
      // Generate randomized indices for option shuffling
      const pairs = q.options.map((opt, oIdx) => ({ opt, originalIdx: oIdx }));
      for (let i = pairs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
      }
      const shuffledOptions = pairs.map((p) => p.opt);
      const correctIndexInShuffled = pairs.findIndex((p) => p.originalIdx === q.correctIndex);

      return {
        originalQuestion: q,
        questionText: q.questionText,
        topic: q.topic,
        explanation: q.explanation,
        shuffledOptions,
        correctIndexInShuffled,
      };
    });

    // If "testing", also shuffle the questions order
    if (mode === "testing") {
      for (let i = preparedQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [preparedQuestions[i], preparedQuestions[j]] = [preparedQuestions[j], preparedQuestions[i]];
      }
    }

    // Set shared state definitions
    setSessionQuestions(preparedQuestions);
    setSelectedModule(moduleId);
    setSessionMode(mode);
    setCurrentQuestionIndex(0);
    setChosenOptionIndex(null);
    setIsAnswered(false);
    setTestAnswers({});
    setTestTimeLeft(50 * 60); // 50 mins
    setTestResult(null);

    // Initialize mode-specific properties
    if (mode === "training") {
      setPracticeScore({ correct: 0, total: 0 });
    } else if (mode === "testing") {
      setIsTestActive(true);
    } else if (mode === "race") {
      setRaceRestartCount(0);
      setRaceStartTime(Date.now());
      setRaceElapsedTime(0);
      setRaceCompleted(false);
      setShowRaceFailedModal(false);
    }
  };

  // Option select handlers - Temp selection for Training/Race
  const handleOptionClick = (idx: number) => {
    if (isAnswered) return;
    setChosenOptionIndex(idx);
  };

  // Submit active question in Training / Race mode
  const handleSubmitAnswer = () => {
    if (isAnswered || !activeQuestion) return;

    const q = activeQuestion.originalQuestion;
    let isCorrect = false;

    if (q.questionType === "Hotspot") {
      const userClicks = Array.isArray(testAnswers[currentQuestionIndex]) ? (testAnswers[currentQuestionIndex] as any[]) : [];
      const spots = q.hotspots || [];
      if (spots.length === 0) {
        isCorrect = true;
      } else {
        isCorrect = spots.every(spot => {
          return userClicks.some((click: any) => {
            const distance = Math.sqrt(Math.pow(click.x - spot.x, 2) + Math.pow(click.y - spot.y, 2));
            return distance <= spot.radius;
          });
        }) && userClicks.length === spots.length;
      }
    } else if (q.questionType === "Ordering / Sequence" || q.questionType === "Ordering") {
      const userSeq = Array.isArray(testAnswers[currentQuestionIndex]) ? (testAnswers[currentQuestionIndex] as string[]) : [];
      const correctSeq = q.options || q.correctSequence || [];
      isCorrect = userSeq.length === correctSeq.length && userSeq.every((val: string, index: number) => val === correctSeq[index]);
    } else {
      if (chosenOptionIndex === null) return;
      isCorrect = chosenOptionIndex === activeQuestion.correctIndexInShuffled;
      // Save choice to testAnswers index
      setTestAnswers((prev) => ({
        ...prev,
        [currentQuestionIndex]: chosenOptionIndex
      }));
    }

    setIsAnswered(true);

    if (sessionMode === "training") {
      if (isCorrect) {
        setPracticeScore((prev) => ({
          correct: prev.correct + 1,
          total: prev.total + 1
        }));
      } else {
        setPracticeScore((prev) => ({
          ...prev,
          total: prev.total + 1
        }));
      }
    } else if (sessionMode === "race") {
      if (!isCorrect) {
        // Trigger instant reset flow
        setShowRaceFailedModal(true);
      }
    }
  };

  // Option select handlers - Testing Mode
  const handleSelectTestingOption = (idx: number) => {
    setTestAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: idx
    }));
  };

  // Reset/Restart Race session on failure
  const handleResetRaceAfterFailure = () => {
    setShowRaceFailedModal(false);
    setRaceRestartCount((prev) => prev + 1);
    setCurrentQuestionIndex(0);
    setChosenOptionIndex(null);
    setIsAnswered(false);
    setTestAnswers({});
    setTestTimeLeft(50 * 60); // Reset timer fresh for the race attempt

    // Re-shuffle the options for the race questions to provide a dynamic challenge
    if (selectedModule) {
      const rawList = questions.filter((q) => q.module === selectedModule);
      const rePrepared: SessionQuestion[] = rawList.map((q) => {
        const pairs = q.options.map((opt, oIdx) => ({ opt, originalIdx: oIdx }));
        for (let i = pairs.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
        }
        const shuffledOptions = pairs.map((p) => p.opt);
        const correctIndexInShuffled = pairs.findIndex((p) => p.originalIdx === q.correctIndex);
        return {
          originalQuestion: q,
          questionText: q.questionText,
          topic: q.topic,
          explanation: q.explanation,
          shuffledOptions,
          correctIndexInShuffled,
        };
      });
      setSessionQuestions(rePrepared);
    }
  };

  // Restart training module back to start
  const handleRestartTrainingSession = () => {
    if (selectedModule) {
      handleStartSession(selectedModule, "training");
    }
  };

  // Next Question Handlers for Training Mode
  const handleNextPracticeQuestion = () => {
    if (currentQuestionIndex < sessionQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setChosenOptionIndex(null);
      setIsAnswered(false);
    } else {
      // Grade and display score results
      handleCompleteSession();
    }
  };

  // Next Question Handlers for Race Mode
  const handleNextRaceQuestion = () => {
    if (currentQuestionIndex < sessionQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setChosenOptionIndex(null);
      setIsAnswered(false);
    } else {
      // User won the race - transition to grade & scoreboard report
      setRaceElapsedTime(Math.round((Date.now() - raceStartTime) / 1000));
      handleCompleteSession();
    }
  };

  // Submit test/practices and gauge stats
  const handleCompleteSession = () => {
    if (!selectedModule) return;
    
    let correct = 0;
    sessionQuestions.forEach((sq, index) => {
      const q = sq.originalQuestion;
      if (q.questionType === "Hotspot") {
        const userClicks = Array.isArray(testAnswers[index]) ? (testAnswers[index] as any[]) : [];
        const spots = q.hotspots || [];
        if (spots.length === 0) {
          correct++;
        } else {
          const allHit = spots.every(spot => {
            return userClicks.some((click: any) => {
              const distance = Math.sqrt(Math.pow(click.x - spot.x, 2) + Math.pow(click.y - spot.y, 2));
              return distance <= spot.radius;
            });
          }) && userClicks.length === spots.length;
          if (allHit) correct++;
        }
      } else if (q.questionType === "Ordering / Sequence" || q.questionType === "Ordering") {
        const userSeq = Array.isArray(testAnswers[index]) ? (testAnswers[index] as string[]) : [];
        const correctSeq = q.options || q.correctSequence || [];
        const allCorrect = userSeq.length === correctSeq.length && userSeq.every((val: string, iIdx: number) => val === correctSeq[iIdx]);
        if (allCorrect) correct++;
      } else {
        if (testAnswers[index] === sq.correctIndexInShuffled) {
          correct++;
        }
      }
    });

    const total = sessionQuestions.length;
    const wrong = total - correct;
    const ratio = total > 0 ? correct / total : 0;
    const scoreVal = Math.round(ratio * 1000);
    const percentRate = Math.round(ratio * 100);

    const activeModInfo = IC3_MODULES.find((m) => m.id === selectedModule);

    // Save exam result standard database format 
    saveExamResult(selectedModule, correct, total, 50 * 60 - testTimeLeft);

    setTestResult({
      correctCount: correct,
      wrongCount: wrong,
      scoreVal,
      percentRate,
      moduleId: selectedModule,
      moduleName: activeModInfo?.name || "IC3 Module"
    });
    setIsTestActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // Confirm manual submission trigger
  const handleManualSubmitTest = () => {
    const unansweredCount = sessionQuestions.length - Object.keys(testAnswers).length;
    if (unansweredCount > 0) {
      setShowAnswersWarning(true);
    } else {
      setShowSubmitModal(true);
    }
  };

  // Leave session safely
  const handleExitSession = () => {
    setSelectedModule(null);
    setSessionMode(null);
    setIsTestActive(false);
    setTestResult(null);
    setRaceCompleted(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // Format digital stopwatch countdown timer
  const formatTime = (secs: number) => {
    const min = Math.floor(secs / 60);
    const sec = secs % 60;
    return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  // Styling maps
  const getLevelBadge = (modId: string) => {
    switch (modId) {
      case "cf":
        return (
          <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-700 border border-sky-200 font-extrabold text-[10px] px-2.5 py-1 rounded-md uppercase font-mono tracking-wider">
            CF (LV1)
          </span>
        );
      case "ka":
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 font-extrabold text-[10px] px-2.5 py-1 rounded-md uppercase font-mono tracking-wider">
            KA (LV2)
          </span>
        );
      case "lo":
        return (
          <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200 font-extrabold text-[10px] px-2.5 py-1 rounded-md uppercase font-mono tracking-wider">
            LO (LV3)
          </span>
        );
      default:
        return null;
    }
  };

  const getLevelStyles = (modId: string) => {
    switch (modId) {
      case "cf":
        return {
          border: "border-sky-100 hover:border-sky-400 hover:bg-sky-50/10",
          text: "text-sky-700",
          dots: "bg-sky-500",
          bg: "bg-sky-50/50"
        };
      case "ka":
        return {
          border: "border-amber-100 hover:border-amber-400 hover:bg-amber-50/10",
          text: "text-amber-700",
          dots: "bg-amber-500",
          bg: "bg-amber-50/50"
        };
      case "lo":
        return {
          border: "border-indigo-100 hover:border-indigo-400 hover:bg-indigo-50/10",
          text: "text-indigo-700",
          dots: "bg-indigo-500",
          bg: "bg-indigo-50/50"
        };
      default:
        return {
          border: "border-slate-100 hover:border-slate-300 hover:bg-slate-50/50",
          text: "text-slate-700",
          dots: "bg-slate-500",
          bg: "bg-slate-50/50"
        };
    }
  };

  return (
    <div className="space-y-6" id="practice-testing-portal">
      
      {/* Portal Main Waiting Lobby */}
      {!selectedModule && !testResult && !raceCompleted && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6" id="portal-header-lander">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-6">
            <div className="space-y-1.5 text-left">
              <span className="text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-700 tracking-widest font-mono font-extrabold px-3 py-1.5 rounded-full uppercase">
                Hệ thống ôn luyện phân hệ GS6
              </span>
              <h2 className="text-2xl md:text-3xl font-black font-display tracking-tight text-slate-900 mt-1.5">
                Cổng Học Tập & Luyện Tập Tự Do
              </h2>
              <p className="text-slate-500 text-xs max-w-xl font-medium leading-relaxed">
                Đập tan nỗi lo thi cử với 3 chế độ tối ưu hóa: Ôn luyện Training có giải thích, Mô phỏng Testing thời gian thực, và Thử thách Race hoàn hảo không tì vết.
              </p>
            </div>

            {/* Back to main student platform */}
            <button
              onClick={onBackToHome}
              className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-350 font-bold rounded-xl text-xs transition flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              Về Trang chủ
            </button>
          </div>

          {/* Trio Mode Custom Tab Selectors */}
          <div className="grid grid-cols-3 p-1.5 bg-slate-100 rounded-2xl max-w-xl mx-auto" id="trio-mode-tabs">
            <button
              onClick={() => setActiveTab("training")}
              className={`py-3.5 text-xs font-black rounded-xl transition flex flex-col md:flex-row items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "training" 
                  ? "bg-white text-slate-950 shadow-sm border border-slate-150" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Training</span>
            </button>
            <button
              onClick={() => setActiveTab("testing")}
              className={`py-3.5 text-xs font-black rounded-xl transition flex flex-col md:flex-row items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "testing" 
                  ? "bg-white text-slate-950 shadow-sm border border-slate-150" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Award className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Testing</span>
            </button>
            <button
              onClick={() => setActiveTab("race")}
              className={`py-3.5 text-xs font-black rounded-xl transition flex flex-col md:flex-row items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "race" 
                  ? "bg-white text-slate-950 shadow-sm border border-slate-150" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Flame className="w-4 h-4 text-rose-500 shrink-0 animate-pulse" />
              <span>Race</span>
            </button>
          </div>

          {/* Slogan details active */}
          <div className="text-center max-w-md mx-auto bg-slate-50 border border-slate-100 rounded-2xl p-4 animate-fade-in">
            {activeTab === "training" && (
              <div className="space-y-1">
                <span className="text-emerald-700 font-extrabold text-xs">Chế độ Training</span>
                <p className="text-slate-500 text-[11px] font-semibold leading-relaxed">
                  "Học tập có hướng dẫn và giải thích chi tiết."
                </p>
              </div>
            )}
            {activeTab === "testing" && (
              <div className="space-y-1">
                <span className="text-indigo-700 font-extrabold text-xs">Chế độ Testing</span>
                <p className="text-slate-500 text-[11px] font-semibold leading-relaxed">
                  "Mô phỏng bài thi IC3 thực tế."
                </p>
              </div>
            )}
            {activeTab === "race" && (
              <div className="space-y-1">
                <span className="text-rose-600 font-extrabold text-xs flex items-center justify-center gap-1">
                  <Flame className="w-3.5 h-3.5 fill-rose-100 text-rose-500" />
                  Chế độ Race (Bứt phá)
                </span>
                <p className="text-slate-500 text-[11px] font-semibold leading-relaxed">
                  "Chinh phục toàn bộ câu hỏi mà không được sai bất kỳ câu nào."
                </p>
              </div>
            )}
          </div>

          {/* Quick Level Filter row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-55 p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
            <span className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-slate-400 rotate-90" />
              Bộ lọc cấp độ nhanh:
            </span>
            
            <div className="flex flex-wrap gap-1.5 justify-center">
              <button
                onClick={() => setQuickFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  quickFilter === "all" ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900"
                }`}
              >
                Tất cả mảng
              </button>
              <button
                onClick={() => setQuickFilter("cf")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  quickFilter === "cf" ? "bg-sky-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-sky-50"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                CF (LV1)
              </button>
              <button
                onClick={() => setQuickFilter("ka")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  quickFilter === "ka" ? "bg-amber-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-amber-50"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                KA (LV2)
              </button>
              <button
                onClick={() => setQuickFilter("lo")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  quickFilter === "lo" ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                LO (LV3)
              </button>
            </div>
          </div>

          {/* Cards distribution grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in" id="selection-distribution-cards">
            {IC3_MODULES
              .filter((mod) => quickFilter === "all" || mod.id === quickFilter)
              .map((mod) => {
                const style = getLevelStyles(mod.id);
                const countOfQ = questions.filter(q => q.module === mod.id).length;
                
                return (
                  <div
                    key={mod.id}
                    className={`border rounded-2xl p-5 md:p-6 bg-white transition flex flex-col justify-between ${style.border}`}
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        {getLevelBadge(mod.id)}
                        <span className="text-[10px] text-slate-400 font-extrabold font-mono bg-slate-50 px-2 py-0.5 rounded">
                          {countOfQ} câu hỏi
                        </span>
                      </div>

                      <div className="space-y-1.5 text-left">
                        <h4 className="font-extrabold font-display text-slate-900 text-base leading-snug">
                          {mod.name.replace(/^[^-]+-\s*/, "")}
                        </h4>
                        <p className="text-slate-500 text-xs leading-relaxed min-h-[48px] line-clamp-3">
                          {mod.description}
                        </p>
                      </div>
                    </div>

                    <div className="pt-5 border-t border-slate-50 mt-4">
                      {activeTab === "training" && (
                        <div className="space-y-2">
                          <p className="text-[9px] text-emerald-600 font-semibold flex items-center justify-center gap-0.5">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            Đánh giá ngay, có giải đáp chi tiết
                          </p>
                          <button
                            id={`btn-training-trigger-${mod.id}`}
                            onClick={() => handleStartSession(mod.id, "training")}
                            className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-black border border-emerald-200 rounded-xl text-xs transition shadow-sm cursor-pointer"
                          >
                            Bắt đầu Training
                          </button>
                        </div>
                      )}

                      {activeTab === "testing" && (
                        <div className="space-y-2">
                          <p className="text-[9px] text-indigo-600 font-semibold flex items-center justify-center gap-0.5">
                            <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            Hồi giờ 50 phút - Giả lập chuẩn
                          </p>
                          <button
                            id={`btn-testing-trigger-${mod.id}`}
                            onClick={() => handleStartSession(mod.id, "testing")}
                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs transition shadow flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Play className="w-3 px-0.5 h-3 fill-white shrink-0" />
                            Luyện Đề Testing
                          </button>
                        </div>
                      )}

                      {activeTab === "race" && (
                        <div className="space-y-2">
                          <p className="text-[9px] text-rose-600 font-semibold flex items-center justify-center gap-0.5 animate-pulse">
                            <Flame className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            Sai một câu là loại trực tiếp!
                          </p>
                          <button
                            id={`btn-race-trigger-${mod.id}`}
                            onClick={() => handleStartSession(mod.id, "race")}
                            className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs transition shadow flex items-center justify-center gap-1 cursor-pointer"
                          >
                            Thử Thách Race
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ACTIVE TRAINING or RACE WORKSPACE */}
      {!isTestActive && selectedModule && activeQuestion && activeModuleInfo && !testResult && !raceCompleted && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 animate-fade-in" id="active-space-practice">
          
          {/* Header Progress panel */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="space-y-1 text-left">
              <div className="flex flex-wrap items-center gap-2">
                {getLevelBadge(selectedModule)}
                <span className={`text-[10px] font-black tracking-wider uppercase px-2.5 py-1 border rounded-md font-mono ${
                  sessionMode === "race" 
                    ? "text-rose-700 bg-rose-50 border-rose-200" 
                    : "text-emerald-700 bg-emerald-50 border-emerald-200"
                }`}>
                  {sessionMode === "race" ? "🔥 RACE MODE (KHÔNG ĐƯỢC PHÉP SAI)" : "🌱 TRAINING (HỌC ÔN TẬP)"}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mt-2">
                Tiến trình: Câu <span className="text-indigo-600 font-black">{currentQuestionIndex + 1}</span> / {sessionQuestions.length}
              </h3>
              
              {/* Responsive Progress Bar */}
              <div className="w-48 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/50 mt-1.5">
                <div 
                  className={`h-full transition-all duration-300 ${sessionMode === "race" ? "bg-rose-500" : "bg-emerald-600"}`}
                  style={{ width: `${((currentQuestionIndex + 1) / sessionQuestions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Header Countdown Timer & Assessment Tracker */}
            <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
              {/* Countdown timer */}
              <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-2 text-slate-800 shadow-sm font-mono">
                <Clock className="w-4 h-4 text-indigo-600 shrink-0 animate-pulse" />
                <div className="text-left leading-none">
                  <span className="text-[9px] text-slate-400 uppercase block font-sans tracking-tight">Thời gian còn lại</span>
                  <span className="text-sm font-black">{formatTime(testTimeLeft)}</span>
                </div>
              </div>

              {/* Assessment Tracker */}
              {sessionMode === "race" ? (
                <div className="bg-rose-50 border border-rose-100 px-4 py-2 rounded-xl text-xs font-semibold text-rose-800 space-y-0.5 animate-fade-in">
                  <span className="text-[9px] font-extrabold uppercase text-rose-400 block tracking-wider leading-none font-mono">Số lần đua lại</span>
                  <p className="text-xs font-black text-rose-600 flex items-center gap-1 font-mono leading-none">
                    <Flame className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    {raceRestartCount} lần vấp ngã
                  </p>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-xs font-semibold text-slate-650 space-y-0.5">
                  <span className="text-[9px] font-extrabold uppercase text-slate-400 block tracking-wider leading-none font-mono">Đánh giá tạm thời</span>
                  <p className="text-slate-850 text-slate-850 text-[11px] leading-none font-extrabold">
                    Đúng <strong className="text-emerald-600 font-extrabold text-xs">{practiceScore.correct}</strong>/{practiceScore.total} câu
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Core active question metadata */}
          <div className="bg-slate-50 border border-slate-100 rounded-2.5xl p-5 md:p-6 text-left" id="cur-practice-question">
            <span className="inline-flex justify-between items-center bg-white/70 border border-slate-200/60 px-2.5 py-1 rounded-md text-[10px] font-black text-slate-400 uppercase font-mono tracking-wider">
              Chủ đề: {activeQuestion.topic}
            </span>
            
            <p className="text-slate-800 font-extrabold text-base md:text-lg leading-relaxed mt-2.5">
              {activeQuestion.questionText}
            </p>
          </div>

          {/* Dynamic Options and Interactivity Block */}
          {(() => {
            const q = activeQuestion.originalQuestion;
            
            if (q.questionType === "Hotspot") {
              const userClicks = Array.isArray(testAnswers[currentQuestionIndex]) ? (testAnswers[currentQuestionIndex] as any[]) : [];
              const spots = q.hotspots || [];
              const maxClicks = spots.length || 1;
              const defaultImg = "https://picsum.photos/seed/ic3hotspot/800/400";
              const bgImg = q.imageUrl || defaultImg;

              return (
                <div className="space-y-4" id="practice-hotspot-block">
                  <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl text-xs text-indigo-900 font-medium">
                    🎯 <strong>Nhiệm vụ Hotspot:</strong> Click trực tiếp chọn <strong>{maxClicks}</strong> vị trí chính xác trên sơ đồ ảnh phần mềm bên dưới để trả lời.
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-50 border border-zinc-200/60 p-3 rounded-xl">
                    <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-indigo-600 shrink-0" />
                      <span>Đánh dấu tọa độ: {userClicks.length}/{maxClicks} điểm</span>
                    </div>

                    {!isAnswered && userClicks.length > 0 && (
                      <button
                        onClick={() => {
                          setTestAnswers(prev => ({
                            ...prev,
                            [currentQuestionIndex]: []
                          }));
                        }}
                        className="flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 border border-rose-200 hover:border-rose-300 bg-rose-50 px-2.5 py-1 rounded-lg transition"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Đặt lại điểm</span>
                      </button>
                    )}
                  </div>

                  <div className="relative border border-slate-200 rounded-2xl overflow-hidden shadow bg-slate-950 inline-block w-full max-w-[800px]">
                    <div
                      onClick={(e) => {
                        if (isAnswered) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const px = ((e.clientX - rect.left) / rect.width) * 100;
                        const py = ((e.clientY - rect.top) / rect.height) * 100;

                        let prevAnswers = testAnswers[currentQuestionIndex] || [];
                        if (!Array.isArray(prevAnswers)) {
                          prevAnswers = [];
                        }

                        let updated;
                        if (prevAnswers.length < maxClicks) {
                          updated = [...prevAnswers, { x: px, y: py }];
                        } else {
                          updated = [...prevAnswers.slice(1), { x: px, y: py }];
                        }

                        setTestAnswers(prev => ({
                          ...prev,
                          [currentQuestionIndex]: updated
                        }));
                      }}
                      className={`relative overflow-hidden select-none cursor-crosshair w-full ${isAnswered ? "pointer-events-none" : ""}`}
                      style={{ aspectRatio: "800/400" }}
                    >
                      {/* Interactive Image */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={bgImg}
                        alt="Hotspot interface diagram"
                        className="w-full h-full object-cover select-none pointer-events-none"
                      />

                      {/* Display User Clicked Target Rings */}
                      {userClicks.map((click: any, idx: number) => (
                        <div
                          key={idx}
                          className="absolute w-8 h-8 rounded-full border-4 border-rose-500 bg-rose-500/25 flex items-center justify-center -translate-x-1/2 -translate-y-1/2 shadow-lg z-20 animate-pulse"
                          style={{
                            left: `${click.x}%`,
                            top: `${click.y}%`,
                          }}
                        >
                          <div className="w-2.5 h-2.5 bg-rose-600 rounded-full flex items-center justify-center text-[8px] text-white font-bold leading-none font-sans">
                            {idx + 1}
                          </div>
                        </div>
                      ))}

                      {/* Visual Feedbacks for Hotspots Zones (Only exposed when isAnswered) */}
                      {isAnswered && spots.map((spot: any, idx: number) => {
                        return (
                          <div
                            key={idx}
                            className="absolute rounded-full border-3 border-emerald-500 bg-emerald-500/15 flex items-center justify-center -translate-x-1/2 -translate-y-1/2 z-10"
                            style={{
                              left: `${spot.x}%`,
                              top: `${spot.y}%`,
                              width: `${spot.radius * 2}%`,
                              height: `${spot.radius * 2}%`,
                            }}
                          >
                            <span className="bg-emerald-600 text-[10px] text-white px-1.5 py-0.5 rounded shadow whitespace-nowrap font-bold absolute bottom-full mb-1">
                              Vùng đúng {idx + 1} (R: {spot.radius}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            }

            if (q.questionType === "Ordering / Sequence" || q.questionType === "Ordering") {
              const currentList = testAnswers[currentQuestionIndex] || activeQuestion.shuffledOptions || [];
              const correctList = q.options || q.correctSequence || [];

              return (
                <div className="space-y-4 font-sans" id="practice-ordering-block">
                  <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl text-xs text-indigo-900 font-medium">
                    🔢 <strong>Yêu cầu Sắp xếp:</strong> Drag / Sử dụng các nút mũi tên điều hướng để hoán đổi vị trí các bước theo quy chuẩn thao tác đúng nhất.
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 text-left">
                    {currentList.map((item: string, idx: number) => {
                      const isMatching = isAnswered && correctList[idx] === item;
                      
                      let cardStyle = "bg-white border-slate-200 text-slate-700";
                      if (isAnswered) {
                        if (isMatching) {
                          cardStyle = "bg-emerald-50 border-emerald-300 text-emerald-950";
                        } else {
                          cardStyle = "bg-rose-50 border-rose-300 text-rose-950";
                        }
                      }

                      return (
                        <div
                          key={idx}
                          className={`flex items-center justify-between gap-4 p-3 border rounded-xl shadow-sm transition duration-150 ${cardStyle}`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Position Indicator Badge */}
                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold font-mono border shrink-0 ${
                              isAnswered
                                ? isMatching
                                  ? "bg-emerald-600 border-emerald-500 text-white"
                                  : "bg-rose-600 border-rose-500 text-white"
                                : "bg-indigo-600 border-indigo-500 text-white"
                            }`}>
                              {idx + 1}
                            </span>
                            <span className="text-xs sm:text-sm font-semibold">{item}</span>
                          </div>

                          {/* Arrow swapping buttons */}
                          {!isAnswered && (
                            <div className="flex items-center gap-1">
                              <button
                                disabled={idx === 0}
                                onClick={() => {
                                  if (isAnswered) return;
                                  const updated = [...currentList];
                                  const temp = updated[idx];
                                  updated[idx] = updated[idx - 1];
                                  updated[idx - 1] = temp;
                                  setTestAnswers(prev => ({
                                    ...prev,
                                    [currentQuestionIndex]: updated
                                  }));
                                }}
                                className="p-1 cursor-pointer bg-slate-50 border border-slate-200 rounded-md hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition disabled:opacity-30 disabled:pointer-events-none"
                                title="Di chuyển lên"
                              >
                                <ArrowUp className="w-4 h-4" />
                              </button>
                              <button
                                disabled={idx === currentList.length - 1}
                                onClick={() => {
                                  if (isAnswered) return;
                                  const updated = [...currentList];
                                  const temp = updated[idx];
                                  updated[idx] = updated[idx + 1];
                                  updated[idx + 1] = temp;
                                  setTestAnswers(prev => ({
                                    ...prev,
                                    [currentQuestionIndex]: updated
                                  }));
                                }}
                                className="p-1 cursor-pointer bg-slate-50 border border-slate-200 rounded-md hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition disabled:opacity-30 disabled:pointer-events-none"
                                title="Di chuyển xuống"
                              >
                                <ArrowDown className="w-4 h-4" />
                              </button>
                            </div>
                          )}

                          {isAnswered && (
                            <div className="flex items-center gap-2 text-xs font-bold">
                              {isMatching ? (
                                <span className="text-emerald-600 flex items-center gap-1 font-semibold bg-emerald-100/60 px-2 py-0.5 rounded-lg border border-emerald-200">
                                  <Check className="w-3.5 h-3.5" /> Đúng bước
                                </span>
                              ) : (
                                <span className="text-rose-600 underline text-[10px] break-all max-w-[200px]">
                                  Bản đúng: {correctList[idx]}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }

            // Normal Multiple Choice Option grid
            return (
              <div className="grid grid-cols-1 gap-3 text-left" id="prac-options-container">
                {activeQuestion.shuffledOptions.map((opt, idx) => {
                  const isCorrectOpt = idx === activeQuestion.correctIndexInShuffled;
                  const isChosen = idx === chosenOptionIndex;

                  let btnStyle = "border-slate-200 hover:bg-slate-50 bg-white text-slate-700";
                  let badgeStyle = "bg-slate-100 border-slate-200 text-slate-500 font-bold";

                  if (isAnswered) {
                    if (isCorrectOpt) {
                      btnStyle = "bg-emerald-50 border-emerald-400 text-emerald-950";
                      badgeStyle = "bg-emerald-600 border-emerald-500 text-white font-extrabold";
                    } else if (isChosen) {
                      btnStyle = "bg-rose-50 border-rose-400 text-rose-950 font-mono";
                      badgeStyle = "bg-rose-600 border-rose-500 text-white font-extrabold";
                    } else {
                      btnStyle = "opacity-40 bg-white border-slate-100 text-slate-350 cursor-not-allowed";
                      badgeStyle = "bg-slate-50 border-slate-100 text-slate-300 font-medium";
                    }
                  } else if (isChosen) {
                    btnStyle = "bg-indigo-50/70 border-indigo-400 text-indigo-950 font-semibold ring-1 ring-indigo-400";
                    badgeStyle = "bg-indigo-600 border-indigo-500 text-white font-extrabold";
                  }

                  return (
                    <button
                      key={idx}
                      id={`practice-module-opt-${idx}`}
                      disabled={isAnswered}
                      onClick={() => handleOptionClick(idx)}
                      className={`flex items-start text-left gap-4 p-4 border rounded-xl font-medium text-xs md:text-sm transition duration-150 cursor-pointer ${btnStyle}`}
                    >
                      <span className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-xs border shrink-0 font-mono ${badgeStyle}`}>
                        {isAnswered && isCorrectOpt ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : isAnswered && isChosen ? (
                          <X className="w-3.5 h-3.5" />
                        ) : (
                          String.fromCharCode(65 + idx)
                        )}
                      </span>
                      <span className={isAnswered && isCorrectOpt ? 'font-bold' : ''}>{opt}</span>
                    </button>
                  );
                })}
              </div>
            );
          })()}

          {/* Explanation panel upon answering */}
          {isAnswered && (
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 text-left space-y-2.5 animate-fade-in" id="practice-expl-card">
              <div className="flex items-center gap-1.5 font-extrabold text-indigo-900 text-xs">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <span>Giải thích chuẩn đề thi IC3</span>
              </div>
              <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-semibold">
                {activeQuestion.explanation}
              </p>
            </div>
          )}

          {/* Options actions footer */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-5">
            <button
              onClick={handleExitSession}
              className="px-4 py-2 hover:bg-slate-100 text-slate-500 font-bold border border-slate-200 hover:border-slate-300 rounded-xl text-xs transition cursor-pointer font-mono"
            >
              Thoát chặng ôn
            </button>

            <div className="flex items-center gap-2">
              {!isAnswered ? (
                <button
                  id="btn-prac-submit"
                  disabled={chosenOptionIndex === null}
                  onClick={handleSubmitAnswer}
                  className={`flex items-center gap-1.5 px-6 py-2.5 font-extrabold rounded-xl text-xs shadow transition cursor-pointer font-mono ${
                    chosenOptionIndex !== null
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                      : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none"
                  }`}
                >
                  <span>Xác nhận đáp án</span>
                  <Check className="w-4 h-4" />
                </button>
              ) : (
                <button
                  id="btn-prac-advance"
                  onClick={() => {
                    if (sessionMode === "race") {
                      handleNextRaceQuestion();
                    } else {
                      handleNextPracticeQuestion();
                    }
                  }}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs shadow transition animate-fade-in cursor-pointer font-mono"
                >
                  {currentQuestionIndex < sessionQuestions.length - 1 ? (
                    <>
                      <span>Câu tiếp theo</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>{sessionMode === "race" ? "Hoàn thành cuộc đua & chấm điểm" : "Hoàn thành ôn luyện & chấm điểm"}</span>
                      <Check className="w-4 h-4 text-white" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ACTIVE TESTING ZONE CONTAINER */}
      {isTestActive && selectedModule && !testResult && (
        <div className="bg-slate-900 text-white border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6 animate-fade-in animate-rise-up" id="active-space-testing">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5 text-left">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {getLevelBadge(selectedModule)}
                <span className="text-[10px] bg-red-500/15 text-red-400 border border-red-500/20 font-extrabold px-2.5 py-1 rounded tracking-wide font-mono uppercase">
                  SIM TESTING DEPLOYED • NO ANSWER DETAILS UNTIL SUBMIT
                </span>
              </div>
              <h3 className="text-base font-black text-slate-100 mt-1">
                Đề kiểm định giả lập: {activeModuleInfo?.name.split("(")[0].trim()}
              </h3>
            </div>

            {/* COUNTDOWN TIMER */}
            <div className="bg-slate-950 border border-slate-800 px-5 py-2.5 rounded-xl shrink-0 flex items-center gap-3 self-start sm:self-auto shadow-inner text-yellow-400 animate-slide-in">
              <Clock className="w-5 h-5 animate-pulse shrink-0" />
              <div className="text-left font-mono">
                <span className="text-[9px] text-zinc-500 uppercase block font-sans tracking-wider leading-none mb-0.5">Thời gian kiểm tra</span>
                <span className="text-xl font-black font-mono tracking-widest">{formatTime(testTimeLeft)}</span>
              </div>
            </div>
          </div>

          {/* QUESTION JUMP MAP */}
          <div className="space-y-2.5 text-left">
            <span className="text-[10px] uppercase text-zinc-400 font-extrabold tracking-wider font-mono">Bản đồ bộ đề thi</span>
            <div className="flex flex-wrap gap-1.5" id="testing-questions-jump-map">
              {sessionQuestions.map((_, idx) => {
                const isSelected = idx === currentQuestionIndex;
                const isAnsweredQ = testAnswers[idx] !== undefined;

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentQuestionIndex(idx);
                      setChosenOptionIndex(null);
                      setIsAnswered(false);
                    }}
                    className={`w-8 h-8 rounded-lg text-xs font-bold font-mono transition flex items-center justify-center cursor-pointer ${
                      isSelected 
                        ? "bg-indigo-600 text-white ring-2 ring-indigo-400 animate-pulse" 
                        : isAnsweredQ 
                          ? "bg-slate-800 text-green-400 border border-green-500/20" 
                          : "bg-slate-950 text-slate-450 border border-slate-800 hover:bg-slate-800"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ACTIVE QUESTION PANEL */}
          {sessionQuestions[currentQuestionIndex] && (
            <div className="bg-slate-950 border border-slate-850 rounded-2.5xl p-5 md:p-6 text-left" id="active-testing-q-card">
              <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider font-mono">
                CÂU HỎI {currentQuestionIndex + 1} TRÊN {sessionQuestions.length} • CHỦ ĐỀ SÁT HẠCH: {sessionQuestions[currentQuestionIndex].topic}
              </span>
              <p className="text-slate-100 font-extrabold text-base md:text-lg leading-relaxed mt-2.5">
                {sessionQuestions[currentQuestionIndex].questionText}
              </p>
            </div>
          )}

          {/* OPTIONS CONTAINER */}
          {sessionQuestions[currentQuestionIndex] && (() => {
            const sq = sessionQuestions[currentQuestionIndex];
            const q = sq.originalQuestion;

            if (q.questionType === "Hotspot") {
              const userClicks = Array.isArray(testAnswers[currentQuestionIndex]) ? (testAnswers[currentQuestionIndex] as any[]) : [];
              const spots = q.hotspots || [];
              const maxClicks = spots.length || 1;
              const defaultImg = "https://picsum.photos/seed/ic3hotspot/800/400";
              const bgImg = q.imageUrl || defaultImg;

              return (
                <div className="space-y-4 text-left font-sans" id="testing-hotspot-block">
                  <div className="bg-indigo-950/40 border border-indigo-900 p-3 rounded-xl text-xs text-indigo-200">
                    🎯 <strong>Nhiệm vụ Hotspot (Đo lường):</strong> Nhấp chuột trực tiếp lên sơ đồ giao diện phần mềm bên dưới để đánh dấu đủ <strong>{maxClicks}</strong> vị trí ứng với câu hỏi.
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/65 border border-slate-800 p-3 rounded-xl">
                    <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5 font-mono">
                      <MapPin className="h-4 w-4 text-indigo-400 shrink-0" />
                      <span>Đặc tả tọa độ: {userClicks.length}/{maxClicks} điểm</span>
                    </div>

                    {userClicks.length > 0 && (
                      <button
                        onClick={() => {
                          setTestAnswers(prev => {
                            const updated = { ...prev };
                            delete updated[currentQuestionIndex];
                            return updated;
                          });
                        }}
                        className="flex items-center gap-1 text-[11px] font-bold text-rose-400 hover:text-rose-300 border border-rose-950 bg-rose-950/20 px-2.5 py-1 rounded-lg transition"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Đặt lại điểm</span>
                      </button>
                    )}
                  </div>

                  <div className="relative border border-slate-800 rounded-2xl overflow-hidden shadow-2xl bg-slate-950 inline-block w-full max-w-[800px]">
                    <div
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const px = ((e.clientX - rect.left) / rect.width) * 100;
                        const py = ((e.clientY - rect.top) / rect.height) * 100;

                        let prevAnswers = testAnswers[currentQuestionIndex] || [];
                        if (!Array.isArray(prevAnswers)) {
                          prevAnswers = [];
                        }

                        let updated;
                        if (prevAnswers.length < maxClicks) {
                          updated = [...prevAnswers, { x: px, y: py }];
                        } else {
                          updated = [...prevAnswers.slice(1), { x: px, y: py }];
                        }

                        setTestAnswers(prev => ({
                          ...prev,
                          [currentQuestionIndex]: updated
                        }));
                      }}
                      className="relative overflow-hidden select-none cursor-crosshair w-full"
                      style={{ aspectRatio: "800/400" }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={bgImg}
                        alt="Testing hotspot background"
                        className="w-full h-full object-cover select-none pointer-events-none"
                      />

                      {/* User clicks */}
                      {userClicks.map((click: any, idx: number) => (
                        <div
                          key={idx}
                          className="absolute w-8 h-8 rounded-full border-4 border-rose-500 bg-rose-500/20 flex items-center justify-center -translate-x-1/2 -translate-y-1/2 shadow-lg"
                          style={{
                            left: `${click.x}%`,
                            top: `${click.y}%`,
                          }}
                        >
                          <div className="w-2.5 h-2.5 bg-rose-600 rounded-full flex items-center justify-center text-[8px] text-white font-bold font-sans">
                            {idx + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }

            if (q.questionType === "Ordering / Sequence" || q.questionType === "Ordering") {
              const currentList = testAnswers[currentQuestionIndex] || sq.shuffledOptions || [];

              return (
                <div className="space-y-4 text-left font-sans" id="testing-ordering-block">
                  <div className="bg-indigo-950/40 border border-indigo-900 p-3 rounded-xl text-xs text-indigo-200">
                    🔢 <strong>Quy trình sắp xếp:</strong> Hãy thực hiện bấm chọn các phím mũi tên kéo/hoán đổi để xếp các bước dưới đây theo đúng trình tự nghiệp vụ chuẩn.
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 text-left">
                    {currentList.map((item: string, idx: number) => {
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-4 p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-300"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold font-mono bg-indigo-950 border border-indigo-800 text-indigo-400 shrink-0">
                              {idx + 1}
                            </span>
                            <span className="text-xs sm:text-sm font-semibold">{item}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              disabled={idx === 0}
                              onClick={() => {
                                const updated = [...currentList];
                                const temp = updated[idx];
                                updated[idx] = updated[idx - 1];
                                updated[idx - 1] = temp;
                                setTestAnswers(prev => ({
                                  ...prev,
                                  [currentQuestionIndex]: updated
                                }));
                              }}
                              className="p-1 cursor-pointer bg-slate-950 border border-slate-800 rounded-md hover:bg-indigo-950 hover:text-indigo-400 transition disabled:opacity-20 disabled:pointer-events-none"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              disabled={idx === currentList.length - 1}
                              onClick={() => {
                                const updated = [...currentList];
                                const temp = updated[idx];
                                updated[idx] = updated[idx + 1];
                                updated[idx + 1] = temp;
                                setTestAnswers(prev => ({
                                  ...prev,
                                  [currentQuestionIndex]: updated
                                }));
                              }}
                              className="p-1 cursor-pointer bg-slate-950 border border-slate-800 rounded-md hover:bg-indigo-950 hover:text-indigo-400 transition disabled:opacity-20 disabled:pointer-events-none"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }

            // Normal A/B/C/D Multiple Choice list
            return (
              <div className="grid grid-cols-1 gap-3 text-left">
                {sq.shuffledOptions.map((opt, idx) => {
                  const isSelected = testAnswers[currentQuestionIndex] === idx;

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectTestingOption(idx)}
                      className={`flex items-start gap-4 p-4 rounded-xl text-left font-medium text-xs md:text-sm border transition duration-150 cursor-pointer ${
                        isSelected 
                          ? "bg-indigo-950/65 border-indigo-501 text-indigo-100 ring-1 ring-indigo-500" 
                          : "bg-slate-950/50 border-slate-800 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <span className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-xs font-mono shrink-0 border transition ${
                        isSelected 
                          ? "bg-indigo-600 border-indigo-400 text-white" 
                          : "bg-slate-901 border-slate-700 text-slate-400"
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
            );
          })()}

          {/* FOOTER ACTIONS */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-800 pt-5 gap-4">
            <button
              onClick={handleExitSession}
              className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 font-bold rounded-xl text-xs transition cursor-pointer self-start sm:self-auto font-mono"
            >
              Hủy đề thi thử
            </button>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition cursor-pointer font-mono"
              >
                Quay lại
              </button>

              <button
                disabled={currentQuestionIndex === sessionQuestions.length - 1}
                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 disabled:pointer-events-none text-white rounded-xl text-xs font-black transition cursor-pointer font-mono"
              >
                Tiếp theo
              </button>

              <button
                onClick={handleManualSubmitTest}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer uppercase tracking-wider font-mono ml-1.5"
              >
                <ShieldCheck className="w-4.5 h-4.5 shrink-0" />
                Nộp Đề Thi Thử
              </button>
            </div>
          </div>

        </div>
      )}

      {/* TESTING RESULTS REPORT */}
      {testResult && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-8 animate-sweep-up" id="testing-report-stage">
          
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold text-[10px] px-3 py-1.5 rounded-full uppercase tracking-widest font-mono">
              XÁC CHỨNG CHỨNG CHỈ IC3 THỬ LẬP TRÌNH
            </span>
            <h3 className="text-2xl font-black text-slate-900 font-display">
              Báo Cáo Thành Tích {testResult.moduleId.toUpperCase()}
            </h3>
            <p className="text-slate-500 text-xs font-semibold">
              Điểm thi thử được tính toán chuẩn theo tỉ lệ định giá của Certiport GS6 quốc tế.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="report-stats-grid">
            
            {/* Conversion prepare standard Certiport */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col justify-center items-center text-center shadow-lg relative overflow-hidden h-44">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-indigo-500/10 blur-xl rounded-full" />
              
              <span className="text-[10px] text-zinc-400 font-extrabold uppercase font-mono tracking-wider">Điểm Số Quy Đổi</span>
              <span className="text-5.5xl font-black font-mono leading-none my-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-400">
                {testResult.scoreVal}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">Thang chuẩn GS6 (1000)</span>
            </div>

            {/* Pass state */}
            <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl flex flex-col justify-center items-center text-center h-44">
              <span className="text-[10px] text-slate-450 font-extrabold uppercase font-mono tracking-wider">Trạng Thái Kiểm Định</span>
              
              <div className="my-2.5">
                {testResult.scoreVal >= 700 ? (
                  <div className="space-y-1 flex flex-col items-center">
                    <span className="px-3.5 py-1 bg-emerald-100 border border-emerald-200 text-emerald-850 text-xs font-black rounded-full uppercase tracking-wider block">
                      ĐẠT CHUẨN (PASSED)
                    </span>
                    <Trophy className="w-8 h-8 text-yellow-500 fill-yellow-400 mt-1" />
                  </div>
                ) : (
                  <div className="space-y-1 flex flex-col items-center">
                    <span className="px-3.5 py-1 bg-rose-105 bg-rose-100 border border-rose-200 text-rose-800 text-xs font-black rounded-full uppercase tracking-wider block">
                      CHƯA ĐẠT (FAILED)
                    </span>
                    <AlertTriangle className="w-8 h-8 text-rose-500 mt-1" />
                  </div>
                )}
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Ngưỡng vượt qua đạt chuẩn: 700+</span>
            </div>

            {/* Metrics Breakdown */}
            <div className="bg-slate-53 bg-slate-50 border border-slate-100 p-6 rounded-2xl flex flex-col justify-center text-left space-y-3 shrink-0 min-h-44">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase font-mono tracking-wider block text-center border-b border-slate-200/60 pb-1.5 font-sans">Thông Số Thống Kê</span>
              
              <div className="space-y-1.5 text-xs font-semibold text-slate-650">
                <div className="flex justify-between items-center">
                  <span>Số câu hỏi đúng:</span>
                  <strong className="text-emerald-600 font-bold">{testResult.correctCount} câu</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span>Số câu hỏi sai:</span>
                  <strong className="text-rose-600 font-bold">{testResult.wrongCount} câu</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span>Tỷ lệ chính xác:</span>
                  <strong className="text-indigo-600 font-black font-mono leading-none text-sm">{testResult.percentRate}%</strong>
                </div>
                {sessionMode === "race" && (
                  <div className="flex justify-between items-center border-t border-slate-150 pt-1.5 mt-1.5 text-rose-700 font-extrabold animate-pulse">
                    <span>Số lần vấp ngã:</span>
                    <span className="flex items-center gap-0.5 font-black text-rose-500 font-mono">
                      <Flame className="w-3.5 h-3.5" />
                      {raceRestartCount} lần
                    </span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Deep Explanation Report panel */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-left" id="report-details-summary">
            <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-200 pb-2.5 mb-3 flex items-center gap-1.5 font-mono">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              Báo cáo chi tiết đáp án & lý giải chuyên môn
            </h4>

            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
              {sessionQuestions.map((q, qIdx) => {
                const userAns = testAnswers[qIdx];
                const isUserCorrect = userAns === q.correctIndexInShuffled;

                return (
                  <div key={q.originalQuestion.id} className="p-3.5 rounded-xl border border-slate-150 bg-white shadow-sm space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 font-bold border-b border-slate-50 pb-1">
                      <span>CÂU HỎI {qIdx + 1}</span>
                      <span className={isUserCorrect ? "text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded font-extrabold" : "text-rose-700 bg-rose-50 px-2 py-0.2 rounded font-extrabold"}>
                        {isUserCorrect ? "CHÍNH XÁC" : "LỖI SAI"}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-800 leading-snug">{q.questionText}</p>
                    
                    <div className="text-[11px] text-slate-500 font-semibold space-y-1">
                      <p>Đáp án bạn chọn: <strong className={isUserCorrect ? "text-emerald-700" : "text-rose-650"}>{userAns !== undefined ? String.fromCharCode(65 + userAns) + ". " + q.shuffledOptions[userAns] : "Bỏ trống"}</strong></p>
                      {!isUserCorrect && (
                        <p>Đáp án đúng khuyến nghị: <strong className="text-emerald-700">{String.fromCharCode(65 + q.correctIndexInShuffled)}. {q.shuffledOptions[q.correctIndexInShuffled]}</strong></p>
                      )}
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded p-2.5 text-[10px] text-slate-600 font-medium tracking-wide">
                      <strong className="text-slate-700 font-black block mb-0.5 font-sans">Giải thích:</strong>
                      {q.explanation}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action layout */}
          <div className="flex items-center justify-center gap-4 border-t border-slate-100 pt-5">
            <button
              onClick={() => {
                setTestResult(null);
                setSelectedModule(null);
                setSessionMode(null);
              }}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-801 text-white font-extrabold rounded-xl text-xs transition uppercase shadow cursor-pointer font-mono"
            >
              Hoàn Tất Khảo Sát
            </button>

            {sessionMode !== "race" && (
              <button
                onClick={() => handleStartSession(testResult.moduleId, "testing")}
                className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Làm lại đề này
              </button>
            )}
          </div>

        </div>
      )}

      {/* RACE MODE COMPLETED (VICTORIOUS HERO INSIGHT) */}
      {raceCompleted && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-2xl space-y-8 animate-sweep-up text-center max-w-2xl mx-auto" id="race-completion-stage">
          
          <div className="space-y-3">
            <div className="inline-flex p-4 bg-rose-50 border border-rose-100 rounded-full text-rose-600 animate-bounce">
              <Trophy className="w-12 h-12 text-yellow-500 fill-yellow-400" />
            </div>
            
            <div className="space-y-1.5">
              <span className="bg-rose-100 border border-rose-200 text-rose-800 font-black text-[10px] px-3.5 py-1.5 rounded-full uppercase tracking-widest font-mono">
                CHINH PHỤC THÀNH CÔNG • RACE CHAMPION
              </span>
              <h2 className="text-3xl font-black text-slate-950 font-display">
                Bạn Đã Hoàn Thành Cuộc Đua!
              </h2>
              <p className="text-slate-500 text-xs md:text-sm max-w-md mx-auto font-medium">
                Tuyệt đỉnh kì tài! Vượt qua toàn bộ ngân hàng câu hỏi của phân hệ khóa thi mà không phạm chút sai sót nào.
              </p>
            </div>
          </div>

          {/* Huy hiệu Race Champion */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-250 p-5 rounded-2.5xl flex flex-col items-center gap-2.5 max-w-sm mx-auto shadow-sm border-amber-200">
            <div className="p-3.5 bg-amber-500 rounded-2xl shadow text-white relative animate-pulse">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm">Huy hiệu "Race Champion"</h4>
              <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider font-mono mt-0.5">Danh hiệu tự hào của IC3 Master</p>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
            <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl text-center">
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block pb-1.5 mb-1 border-b border-slate-100 font-mono">Tổng số câu hỏi</span>
              <strong className="text-2xl font-black text-slate-800 font-mono">{sessionQuestions.length}</strong>
            </div>
            <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl text-center">
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block pb-1.5 mb-1 border-b border-slate-100 font-mono">Số lần đua lại</span>
              <strong className="text-2xl font-black text-rose-600 font-mono">{raceRestartCount}</strong>
            </div>
            <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl text-center">
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block pb-1.5 mb-1 border-b border-slate-100 font-mono">Thời gian đua</span>
              <strong className="text-xl font-black text-indigo-650 text-indigo-600 font-mono leading-none block mt-1">
                {Math.floor(raceElapsedTime / 60) > 0 ? `${Math.floor(raceElapsedTime / 60)}p ` : ""}{raceElapsedTime % 60}s
              </strong>
            </div>
            <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl text-center">
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block pb-1.5 mb-1 border-b border-slate-100 font-mono">Tỷ lệ chính xác</span>
              <strong className="text-2xl font-black text-emerald-600 font-mono">100%</strong>
            </div>
          </div>

          {/* Footer controls */}
          <div className="flex items-center justify-center gap-4 pt-4 border-t border-slate-100">
            <button
              onClick={() => {
                setRaceCompleted(false);
                setSelectedModule(null);
                setSessionMode(null);
              }}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs transition uppercase shadow cursor-pointer font-mono"
            >
              Quay lại cổng chính
            </button>
            <button
              onClick={() => {
                setRaceCompleted(false);
                if (selectedModule) {
                  handleStartSession(selectedModule, "race");
                }
              }}
              className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer font-mono"
            >
              <RefreshCw className="w-3.5 h-3.5 shrink-0" />
              Đua lượt mới
            </button>
          </div>

        </div>
      )}

      {/* CONFIRMATION SUBMISSION MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6 text-left">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <ShieldCheck className="w-6 h-6 shrink-0" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-950">Xác Nhận Nộp Bài Thi</h3>
                <p className="text-[11px] text-slate-500">Hãy chắc chắn về quyết định nộp bài sớm của bạn.</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600 font-semibold bg-slate-50 p-4.5 rounded-2xl border border-slate-150">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span>Tổng số câu hỏi đề thi:</span>
                <span className="font-bold text-slate-900">{sessionQuestions.length} câu</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span>Số câu đã hoàn thành:</span>
                <span className="font-bold text-indigo-600">{Object.keys(testAnswers).length} câu</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Số câu bỏ trống chưa làm:</span>
                <span className="font-bold text-rose-500">{sessionQuestions.length - Object.keys(testAnswers).length} câu</span>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4.5 py-2.5 hover:bg-slate-100 text-slate-505 text-slate-500 font-bold border border-slate-200 rounded-xl text-xs transition cursor-pointer"
              >
                Tiếp tục làm bài
              </button>
              <button
                onClick={() => {
                  setShowSubmitModal(false);
                  handleCompleteSession();
                }}
                className="px-5.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition shadow-lg cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 shrink-0" />
                Nộp bài thi & Chấm điểm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WARNING BLANK QUESTIONS MODAL FOR TESTING */}
      {showAnswersWarning && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in" id="answers-warning-dialog">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6 text-left">
            <div className="flex items-center gap-3 border-b border-rose-100 pb-4">
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                <AlertTriangle className="w-6 h-6 shrink-0" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-950">Chưa Hoàn Tất Bài Thi</h3>
                <p className="text-[11px] text-rose-500 font-mono">WARNING: BLANK QUESTIONS DETECTED</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600 font-semibold bg-slate-50 p-4.5 rounded-2xl border border-slate-150">
              <p className="text-slate-550 text-slate-500 leading-relaxed">
                Bạn không thể nộp bài thi thử vì có câu hỏi bỏ trống chưa được hoàn thiện. Vui lòng kiểm tra lại.
              </p>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span>Tổng số câu hỏi:</span>
                <span className="font-bold text-slate-900">{sessionQuestions.length} câu</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span>Số câu đã làm:</span>
                <span className="font-semibold text-emerald-600">{Object.keys(testAnswers).length} câu</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-rose-550 text-rose-500">Số câu bỏ trống:</span>
                <span className="font-black text-rose-600 font-mono text-sm">{sessionQuestions.length - Object.keys(testAnswers).length} câu</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowAnswersWarning(false)}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs transition shadow-lg cursor-pointer flex items-center gap-1.5"
              >
                Tiếp tục làm bài
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM NO QUESTION ALERT DIALOG */}
      {showNoQuestionsModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6 text-left">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                <AlertTriangle className="w-6 h-6 shrink-0" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-950">Thông Báo Hệ Thống</h3>
                <p className="text-[11px] text-slate-500 font-mono">QUESTION BANK DATABASE NOTICE</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-semibold bg-slate-50 p-4 rounded-xl border">
              Hệ thống chưa nạp đủ dữ liệu câu hỏi cho phân hệ thi LV này. Xin hãy chọn phân hệ thi khác hoặc liên hệ quản trị viên để cập nhật ngân hàng câu hỏi.
            </p>

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setShowNoQuestionsModal(false)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs transition shadow cursor-pointer"
              >
                Đã hiểu (Đóng)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM RACE FAILED POPUP DIALOG */}
      {showRaceFailedModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-red-100 p-6 md:p-8 max-w-sm w-full shadow-2xl space-y-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 bg-red-50 text-red-600 rounded-full animate-bounce">
                <AlertTriangle className="w-10 h-10 shrink-0" />
              </div>
              <h3 className="text-xl font-black text-rose-950">Vấp Ngã Chặng Đua!</h3>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider font-mono">Bị loại khỏi chặng đua</p>
            </div>

            <p className="text-xs text-rose-800 leading-relaxed font-semibold bg-red-50/50 p-4.5 rounded-2xl border border-red-100">
              Bạn đã trả lời sai. Cuộc đua bắt đầu lại từ đầu!
            </p>

            <button
              onClick={handleResetRaceAfterFailure}
              className="w-full py-3 bg-rose-650 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs transition shadow-lg shadow-rose-105 flex items-center justify-center gap-1.5 cursor-pointer uppercase font-mono tracking-wider"
            >
              <RefreshCw className="w-4 h-4 shrink-0" />
              Bắt đầu lại chặng đua
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
