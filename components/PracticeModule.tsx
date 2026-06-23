"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { IC3_MODULES, IC3Question } from "../lib/ic3data";
import { useIC3, isUserAdmin } from "../lib/ic3store";
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
  RotateCw,
  GripVertical,
  Eye
} from "lucide-react";

interface PracticeModuleProps {
  onBackToHome: () => void;
  onStartExam?: (module: "cf" | "ka" | "lo", testSetId: string) => void;
}

interface SessionQuestion {
  originalQuestion: IC3Question;
  questionText: string;
  topic: string;
  explanation: string;
  shuffledOptions: string[];
  correctIndexInShuffled: number;
}

export function shuffleArrayWithSeed<T>(array: T[], seedStr: string): T[] {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed += seedStr.charCodeAt(i);
  }
  
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    seed = (seed * 9301 + 49297) % 233280;
    const rnd = seed / 233280;
    const j = Math.floor(rnd * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function checkAnswerCorrectness(q: IC3Question, correctIndexInShuffled: number, userAns: any): boolean {
  const type = q.questionType;

  if (type === "Multiple Select") {
    const correctIndices = q.correctIndicesMulti || [];
    const userIndices = Array.isArray(userAns) ? userAns : [];
    const correctNum = correctIndices.map(Number);
    const userNum = userIndices.map(Number);
    return correctNum.length === userNum.length && correctNum.every(idx => userNum.includes(idx));
  }

  if (type === "True / False Single") {
    return (q.correctAnswerBool === true && userAns === "Đúng") || (q.correctAnswerBool === false && userAns === "Sai");
  }

  if (type === "True / False Multiple") {
    const statements = q.statements || [];
    const userTF = userAns || {};
    if (statements.length === 0) return true;
    return statements.every((stmt, idx) => userTF[idx] === stmt.answer);
  }

  if (type === "Matching") {
    const pairs = q.matchingPairs || [];
    const userMatch = userAns || {};
    if (pairs.length === 0) return true;
    return pairs.every((pair) => userMatch[pair.left] === pair.right);
  }

  if (type === "Fill In The Blank") {
    const correctBlanks = (q.correctAnswersBlank || []).map(s => String(s).trim().toLowerCase());
    const userBlank = String(userAns || "").trim().toLowerCase();
    return correctBlanks.length > 0 && correctBlanks.includes(userBlank);
  }

  if (type === "Drag And Drop") {
    const targets = q.dragTargets || [];
    const userDrag = userAns || {};
    if (targets.length === 0) return true;
    return targets.every((tgt, idx) => userDrag[idx] === tgt.expectedItem);
  }

  if (type === "Hotspot") {
    const userClicks = Array.isArray(userAns) ? userAns : [];
    const spots = q.hotspots || [];
    if (spots.length === 0) return true;
    return spots.every(spot => {
      return userClicks.some((click: any) => {
        const distance = Math.sqrt(Math.pow(click.x - spot.x, 2) + Math.pow(click.y - spot.y, 2));
        return distance <= spot.radius;
      });
    }) && userClicks.length === spots.length;
  }

  if (type === "Ordering / Sequence" || type === "Ordering") {
    const userSeq = Array.isArray(userAns) ? userAns : [];
    const correctSeq = q.options || q.correctSequence || [];
    return userSeq.length === correctSeq.length && userSeq.every((val: string, index: number) => val === correctSeq[index]);
  }

  return userAns === correctIndexInShuffled;
}

export function containsProfanity(text: string): boolean {
  if (!text) return false;
  const badWords = [
    "đm", "dm", "con cặc", "con cac", "vcl", "cl", "địt", "dit", "đệt", "lồn", "lon", "buồi", "buoi", "óc chó", "oc cho", 
    "chó đẻ", "cho de", "đù má", "du ma", "đụ má", "du me", "dume", "đụ", "mẹ mày", "me may", "mẹ m", "bitch", "fuck", 
    "shit", "asshole", "pussy", "dick", "ngu lồn", "ngu lon", "ngu chó", "ngu cho", "cặc", "cac", "dcm", "đcm", "đmm", "dmm",
    "vl", "cc", "loz"
  ];
  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "");

  const words = normalized.split(/\s+/);
  
  for (const badWord of badWords) {
    const cleanBadWord = badWord
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    if (normalized.includes(cleanBadWord)) {
      return true;
    }
    if (words.includes(cleanBadWord)) {
      return true;
    }
  }
  return false;
}

export default function PracticeModule({ onBackToHome, onStartExam }: PracticeModuleProps) {
  const { questions, saveExamResult, testSets, examRecords, firebaseUser, allowedStudents } = useIC3();

  // Student name and class states for both display, local storage and online submission
  const [studentName, setStudentName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [tempStudentName, setTempStudentName] = useState("");
  const [tempStudentClass, setTempStudentClass] = useState("");
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoModalError, setInfoModalError] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [pendingStartArgs, setPendingStartArgs] = useState<{
    moduleId: "cf" | "ka" | "lo";
    mode: "training" | "testing" | "race";
    testSetId?: string;
  } | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedName = localStorage.getItem("ic3_student_name") || "";
      const savedClass = localStorage.getItem("ic3_student_class") || "";
      setStudentName(savedName);
      setStudentClass(savedClass);
    }
  }, []);

  // Pre-fill selected Lớp and Học sinh name if they exist in the allowed roster
  useEffect(() => {
    if (allowedStudents && allowedStudents.length > 0 && studentName && studentClass) {
      if (!selectedClass && !selectedStudentId) {
        const found = allowedStudents.find(
          (s) =>
            s.fullName.trim().toLowerCase() === studentName.trim().toLowerCase() &&
            s.className.trim().toLowerCase() === studentClass.trim().toLowerCase()
        );
        if (found) {
          setSelectedClass(found.className);
          setSelectedStudentId(found.id);
        }
      }
    }
  }, [allowedStudents, studentName, studentClass, selectedClass, selectedStudentId]);

  // 3 Primary Modes: "training" | "testing" | "race"
  const [activeTab, setActiveTab] = useState<"training" | "testing" | "race">("training");
  
  // Quick filter row
  const [quickFilter, setQuickFilter] = useState<"all" | "cf" | "ka" | "lo">("all");

  // Portal session configurations
  const [selectedModule, setSelectedModule] = useState<"cf" | "ka" | "lo" | null>(null);
  const [selectedTestSetId, setSelectedTestSetId] = useState<string | null>(null);
  const [sessionMode, setSessionMode] = useState<"training" | "testing" | "race" | null>(null);
  const [sessionQuestions, setSessionQuestions] = useState<SessionQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // B. Testing Mode States
  const [isTestActive, setIsTestActive] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [testAnswers, setTestAnswers] = useState<Record<number, any>>({}); // index -> selectedOption index or custom answer state
  const [finalizedAnswers, setFinalizedAnswers] = useState<Record<number, boolean>>({});
  const [testTimeLeft, setTestTimeLeft] = useState(50 * 60); // 50 mins
  const [testResult, setTestResult] = useState<{
    correctCount: number;
    wrongCount: number;
    scoreVal: number;
    percentRate: number;
    moduleName: string;
    moduleId: "cf" | "ka" | "lo";
    testSetId?: string | null;
  } | null>(null);

  // Interaction answers
  const [chosenOptionIndex, setChosenOptionIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [activeDragItem, setActiveDragItem] = useState<string | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [selectedMatchingItem, setSelectedMatchingItem] = useState<string | null>(null);
  const [matchingDragOver, setMatchingDragOver] = useState<string | null>(null);

  const isQuestionIndexAnswered = (idx: number): boolean => {
    if (!sessionQuestions[idx]) return false;
    const activeQuestion = sessionQuestions[idx];
    const q = activeQuestion.originalQuestion;
    const type = q.questionType;
    const ans = testAnswers[idx];

    if (type === "Multiple Choice" || type === "Video Based" || !type) {
      return ans !== undefined;
    }
    if (type === "Multiple Select") {
      return Array.isArray(ans) && ans.length > 0;
    }
    if (type === "True / False Single") {
      return ans === "Đúng" || ans === "Sai";
    }
    if (type === "True / False Multiple") {
      const stmtList = q.statements || [];
      const userTF = ans || {};
      return stmtList.length > 0 && stmtList.every((_, sIdx) => userTF[sIdx] !== undefined);
    }
    if (type === "Matching") {
      const matchPairs = q.matchingPairs || [];
      const userMatch = ans || {};
      return matchPairs.length > 0 && matchPairs.every((pair) => userMatch[pair.left] !== undefined && userMatch[pair.left] !== "");
    }
    if (type === "Fill In The Blank") {
      return ans !== undefined && String(ans).trim() !== "";
    }
    if (type === "Drag And Drop") {
      const targets = q.dragTargets || [];
      const userDrag = ans || {};
      return targets.length > 0 && Object.keys(userDrag).length > 0;
    }
    if (type === "Hotspot") {
      const clicks = ans || [];
      return clicks.length > 0;
    }
    if (type === "Ordering / Sequence" || type === "Ordering") {
      return true; // Auto-enabled since they are pre-populated with shuffled items
    }
    return false;
  };

  const answeredQuestionsCount = useMemo(() => {
    let count = 0;
    for (let i = 0; i < sessionQuestions.length; i++) {
      if (isQuestionIndexAnswered(i)) {
        count++;
      }
    }
    return count;
  }, [sessionQuestions, testAnswers]);

  const hasAnsweredActiveQuestion = () => {
    if (!sessionQuestions[currentQuestionIndex]) return false;
    const activeQuestion = sessionQuestions[currentQuestionIndex];
    if (sessionMode !== "testing") {
      const q = activeQuestion.originalQuestion;
      const type = q.questionType;
      if (type === "Multiple Choice" || type === "Video Based" || !type) {
        return chosenOptionIndex !== null;
      }
    }
    return isQuestionIndexAnswered(currentQuestionIndex);
  };

  useEffect(() => {
    setChosenOptionIndex(null);
    setActiveDragItem(null);
    setSelectedMatchingItem(null);
    if (isReviewMode) {
      setIsAnswered(true);
    } else {
      setIsAnswered(sessionMode === "training" || sessionMode === "race" ? finalizedAnswers[currentQuestionIndex] === true : false);
    }
  }, [currentQuestionIndex, sessionMode, finalizedAnswers, isReviewMode]);

  // A. Training Mode States
  const [practiceScore, setPracticeScore] = useState({ correct: 0, total: 0 });

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

  // Stable shuffled options for matching and drag-and-drop based on activeQuestion ID
  const stableMatchingRights = useMemo(() => {
    if (!activeQuestion) return [];
    const q = activeQuestion.originalQuestion;
    if (q.questionType !== "Matching") return [];
    const pairs = q.matchingPairs || [];
    const rawRightTexts = Array.from(new Set(pairs.map((p: any) => p.right))) as string[];
    return shuffleArrayWithSeed(rawRightTexts, q.id || q.questionText || "");
  }, [activeQuestion]);

  const stableDragItems = useMemo(() => {
    if (!activeQuestion) return [];
    const q = activeQuestion.originalQuestion;
    const items = q.dragItems || [];
    return shuffleArrayWithSeed(items, q.id || q.questionText || "");
  }, [activeQuestion]);

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

  // Unified session starting handler (intercepts to gather student name and class)
  const handleStartSession = (moduleId: "cf" | "ka" | "lo", mode: "training" | "testing" | "race", testSetId?: string) => {
    const targetTestSetId = testSetId || `default_${moduleId}`;
    const rawList = questions.filter((q) => q.testSetId === targetTestSetId);
    if (rawList.length === 0) {
      setShowNoQuestionsModal(true);
      return;
    }

    // Skip the Candidate Info Modal if the logged in user is an Administrator
    if (firebaseUser && isUserAdmin(firebaseUser)) {
      setStudentName("Quản Trị Viên");
      setStudentClass("Admin");
      executeStartSession(moduleId, mode, testSetId);
      return;
    }

    setPendingStartArgs({ moduleId, mode, testSetId });
    setTempStudentName(studentName);
    setTempStudentClass(studentClass);
    setInfoModalError("");
    setShowInfoModal(true);
  };

  // Internal executor called once student finishes confirming/updating their name & class
  const executeStartSession = (moduleId: "cf" | "ka" | "lo", mode: "training" | "testing" | "race", testSetId?: string) => {
    const targetTestSetId = testSetId || `default_${moduleId}`;
    const rawList = questions.filter((q) => q.testSetId === targetTestSetId);
    if (rawList.length === 0) {
      setShowNoQuestionsModal(true);
      return;
    }

    // Prepare questions with shuffled options
    const preparedQuestions: SessionQuestion[] = rawList.map((q) => {
      // Generate randomized indices for option shuffling
      const optionsArray = Array.isArray(q.options) ? q.options : [];
      const pairs = optionsArray.map((opt, oIdx) => ({ opt, originalIdx: oIdx }));
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
    setSelectedTestSetId(testSetId || null);
    setSessionMode(mode);
    setIsReviewMode(false);
    setCurrentQuestionIndex(0);
    setChosenOptionIndex(null);
    setIsAnswered(false);
    setTestAnswers({});
    setFinalizedAnswers({});
    setTestTimeLeft(50 * 60); // 50 mins
    setTestResult(null);

    // Initialize mode-specific properties
    if (mode === "training") {
      setPracticeScore({ correct: 0, total: 0 });
    } else if (mode === "testing") {
      setIsTestActive(false);
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
    if (sessionMode === "testing") {
      setTestAnswers((prev) => ({
        ...prev,
        [currentQuestionIndex]: idx
      }));
    }
  };

  // Submit active question in Training / Race mode
  const handleSubmitAnswer = () => {
    if (isAnswered || !activeQuestion) return;

    const q = activeQuestion.originalQuestion;
    let userAnsObj = testAnswers[currentQuestionIndex];
    if (userAnsObj === undefined && (q.questionType === "Ordering / Sequence" || q.questionType === "Ordering")) {
      userAnsObj = activeQuestion.shuffledOptions || [];
      setTestAnswers((prev) => ({
        ...prev,
        [currentQuestionIndex]: userAnsObj
      }));
    }
    let isCorrect = false;

    // Use our beautiful unified dynamic correctness grader
    if (q.questionType && q.questionType !== "Multiple Choice" && q.questionType !== "Video Based") {
      isCorrect = checkAnswerCorrectness(q, activeQuestion.correctIndexInShuffled, userAnsObj);
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
    setFinalizedAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: true
    }));

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
    setFinalizedAnswers({});
    setTestTimeLeft(50 * 60); // Reset timer fresh for the race attempt

    // Re-shuffle the options for the race questions to provide a dynamic challenge
    if (selectedModule) {
      const targetTestSetId = selectedTestSetId || `default_${selectedModule}`;
      const rawList = questions.filter((q) => q.testSetId === targetTestSetId);
      const rePrepared: SessionQuestion[] = rawList.map((q) => {
        const optionsArray = Array.isArray(q.options) ? q.options : [];
        const pairs = optionsArray.map((opt, oIdx) => ({ opt, originalIdx: oIdx }));
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
      handleStartSession(selectedModule, "training", selectedTestSetId || undefined);
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
    
    // Auto-fill unsubmitted Ordering/Sequence answers with their default shuffled option lists
    const finalAnswersObj = { ...testAnswers };
    sessionQuestions.forEach((sq, index) => {
      const q = sq.originalQuestion;
      if (finalAnswersObj[index] === undefined && (q.questionType === "Ordering / Sequence" || q.questionType === "Ordering")) {
        finalAnswersObj[index] = sq.shuffledOptions || [];
      }
    });

    let correct = 0;
    sessionQuestions.forEach((sq, index) => {
      const q = sq.originalQuestion;
      const userAns = finalAnswersObj[index];
      const isCorrect = checkAnswerCorrectness(q, sq.correctIndexInShuffled, userAns);
      if (isCorrect) {
        correct++;
      }
    });

    // Save final answers obj to State so reviews render properly
    setTestAnswers(finalAnswersObj);

    const total = sessionQuestions.length;
    const wrong = total - correct;
    const ratio = total > 0 ? correct / total : 0;
    const scoreVal = Math.round(ratio * 1000);
    const percentRate = Math.round(ratio * 100);

    const activeModInfo = IC3_MODULES.find((m) => m.id === selectedModule);

    // Save exam result standard database format 
    saveExamResult(
      selectedModule, 
      correct, 
      total, 
      50 * 60 - testTimeLeft, 
      selectedTestSetId || `default_${selectedModule}`,
      selectedTestSetId 
        ? (testSets.find(t => t.id === selectedTestSetId)?.title || "Bài Ôn Tập") 
        : activeModInfo?.name,
      studentName,
      studentClass
    );

    setTestResult({
      correctCount: correct,
      wrongCount: wrong,
      scoreVal,
      percentRate,
      moduleId: selectedModule,
      moduleName: selectedTestSetId && selectedTestSetId !== `default_${selectedModule}`
        ? (testSets.find((t) => t.id === selectedTestSetId)?.title || activeModInfo?.name || "IC3 Module")
        : (activeModInfo?.name || "IC3 Module"),
      testSetId: selectedTestSetId
    });
    setIsTestActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // Confirm manual submission trigger
  const handleManualSubmitTest = () => {
    const unansweredCount = sessionQuestions.length - answeredQuestionsCount;
    if (unansweredCount > 0) {
      setShowAnswersWarning(true);
    } else {
      setShowSubmitModal(true);
    }
  };

  // Leave session safely
  const handleExitSession = () => {
    setSelectedModule(null);
    setSelectedTestSetId(null);
    setSessionMode(null);
    setIsTestActive(false);
    setIsReviewMode(false);
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

          {/* Cards distribution horizontal groups */}
          <div className="space-y-10 animate-fade-in" id="selection-distribution-groups">
            {IC3_MODULES
              .filter((mod) => quickFilter === "all" || mod.id === quickFilter)
              .map((mod) => {
                const style = getLevelStyles(mod.id);
                const countOfQ = questions.filter(q => q.module === mod.id).length;
                const levelCustomSets = (testSets || [])
                  .filter((ts) => ts.level === mod.id && !ts.id.startsWith("default_"))
                  .sort((a, b) => a.title.localeCompare(b.title, "vi", { numeric: true, sensitivity: "base" }));

                return (
                  <div key={mod.id} className="space-y-4 text-left border-b border-slate-100 pb-8 last:border-0 last:pb-0" id={`group-level-${mod.id}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${style.dots}`} />
                        <h3 className="text-base font-black text-slate-800 tracking-tight uppercase">
                          {mod.id === "cf" 
                            ? "CẤP ĐỘ 1: MÁY TÍNH CĂN BẢN (Computing Fundamentals - CF)" 
                            : mod.id === "ka" 
                            ? "CẤP ĐỘ 2: CÁC ỨNG DỤNG CHỦ CHỐT (Key Applications - KA)" 
                            : "CẤP ĐỘ 3: CUỘC SỐNG TRỰC TUYẾN (Living Online - LO)"}
                        </h3>
                      </div>
                      <span className="text-[11px] font-bold text-slate-400">
                        {levelCustomSets.length} bài ôn tập
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {/* Custom dynamic testSets from Firestore aligned inside the same group */}
                      {levelCustomSets.length === 0 ? (
                        <div className="col-span-full py-8 text-center bg-slate-50 border border-slate-150 rounded-2xl">
                          <p className="text-slate-400 text-xs italic">Chưa có đề ôn luyện nào cho cấp độ này.</p>
                        </div>
                      ) : (
                        levelCustomSets.map((ts) => {
                          const tsQuestionsCount = questions.filter((q) => q.testSetId === ts.id).length;
                          const testRecords = examRecords.filter((r) => r.testSetId === ts.id);
                          const bestScore = testRecords.length > 0 ? Math.max(...testRecords.map((r) => r.score)) : null;

                          return (
                            <div
                              key={ts.id}
                              className={`border rounded-2xl p-5 md:p-6 bg-white transition flex flex-col justify-between ${style.border}`}
                              id={`practice-test-card-${ts.id}`}
                            >
                              <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                  {getLevelBadge(mod.id)}
                                  {bestScore !== null && bestScore >= (ts.passingScore || 700) ? (
                                    <span className="text-[9px] bg-emerald-50 text-emerald-700 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-emerald-100">
                                      <Check className="w-3 h-3 text-emerald-500" />
                                      Đã Đạt ({bestScore}đ)
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 font-extrabold font-mono bg-slate-50 px-2 py-0.5 rounded">
                                      {tsQuestionsCount} câu hỏi
                                    </span>
                                  )}
                                </div>

                                <div className="space-y-1.5 text-left">
                                  <h4 className="font-extrabold font-display text-slate-900 text-sm leading-snug line-clamp-1">
                                    {ts.title}
                                  </h4>
                                  <p className="text-slate-500 text-xs leading-relaxed min-h-[48px] line-clamp-3">
                                    {ts.description || "Bài ôn tập bám sát thực tế giúp ôn luyện và khắc sâu kiến thức trọng tâm học phần."}
                                  </p>
                                </div>
                              </div>

                              <div className="pt-5 border-t border-slate-50 mt-4 font-sans">
                                {activeTab === "training" && (
                                  <div className="space-y-2">
                                    <p className="text-[9px] text-emerald-600 font-semibold flex items-center justify-center gap-0.5">
                                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                      Đánh giá ngay, có giải đáp chi tiết
                                    </p>
                                    <button
                                      onClick={() => handleStartSession(mod.id, "training", ts.id)}
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
                                      onClick={() => handleStartSession(mod.id, "testing", ts.id)}
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
                                      onClick={() => handleStartSession(mod.id, "race", ts.id)}
                                      className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs transition shadow flex items-center justify-center gap-1 cursor-pointer"
                                    >
                                      Thử Thách Race
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ACTIVE TRAINING, RACE OR REVIEW WORKSPACE */}
      {((!isTestActive && selectedModule && activeQuestion && activeModuleInfo && !testResult && !raceCompleted) || (isReviewMode && activeQuestion && activeModuleInfo)) && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 animate-fade-in" id="active-space-practice">
          
          {/* Header Progress panel */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="space-y-1 text-left">
              <div className="flex flex-wrap items-center gap-2">
                {selectedModule && getLevelBadge(selectedModule)}
                 <span className={`text-[10px] font-black tracking-wider uppercase px-2.5 py-1 border rounded-md font-mono ${
                  isReviewMode
                    ? "text-purple-700 bg-purple-50 border-purple-200"
                    : sessionMode === "race" 
                      ? "text-rose-700 bg-rose-50 border-rose-200" 
                      : sessionMode === "testing"
                        ? "text-indigo-700 bg-indigo-50 border-indigo-200"
                        : "text-emerald-700 bg-emerald-50 border-emerald-200"
                }`}>
                  {isReviewMode
                    ? "🔍 REVIEW (XEM LẠI ĐÁP ÁN ĐÃ THI)"
                    : sessionMode === "race" 
                      ? "🔥 RACE MODE (KHÔNG ĐƯỢC PHÉP SAI)" 
                      : sessionMode === "testing"
                        ? "📝 TESTING (MÔ PHỎNG ĐỀ THI)"
                        : "🌱 TRAINING (HỌC ÔN TẬP)"}
                </span>

                {isReviewMode && (
                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md border font-mono ${
                    (() => {
                      const qRaw = activeQuestion.originalQuestion;
                      const userAns = testAnswers[currentQuestionIndex];
                      const isCorrect = checkAnswerCorrectness(qRaw, activeQuestion.correctIndexInShuffled, userAns);
                      return isCorrect 
                        ? "text-emerald-700 bg-emerald-50 border-emerald-250 animate-pulse" 
                        : "text-rose-700 bg-rose-50 border-rose-250 animate-pulse";
                    })()
                  }`}>
                    {(() => {
                      const qRaw = activeQuestion.originalQuestion;
                      const userAns = testAnswers[currentQuestionIndex];
                      const isCorrect = checkAnswerCorrectness(qRaw, activeQuestion.correctIndexInShuffled, userAns);
                      return isCorrect ? "✓ CHÍNH XÁC" : "✗ BỊ SAI";
                    })()}
                  </span>
                )}
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mt-2">
                Tiến trình: Câu <span className="text-indigo-600 font-black">{currentQuestionIndex + 1}</span> / {sessionQuestions.length}
              </h3>
              
              {/* Responsive Progress Bar */}
              <div className="w-48 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/50 mt-1.5">
                <div 
                  className={`h-full transition-all duration-300 ${
                    sessionMode === "race" 
                      ? "bg-rose-500" 
                      : sessionMode === "testing"
                        ? "bg-indigo-600"
                        : "bg-emerald-600"
                  }`}
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
              ) : sessionMode === "testing" ? (
                <div className="bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-xl text-xs font-semibold text-indigo-800 space-y-0.5">
                  <span className="text-[9px] font-extrabold uppercase text-indigo-400 block tracking-wider leading-none font-mono">Đã hoàn thành</span>
                  <p className="text-indigo-950 font-black text-xs leading-none">
                    Đã chọn: <strong className="text-indigo-600 font-extrabold text-xs">{answeredQuestionsCount}</strong>/{sessionQuestions.length} câu
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

          {/* Question JUMP map for Testing / Practice */}
          {(sessionMode === "testing" || sessionMode === "training" || isReviewMode) && (
            <div className="space-y-2.5 text-left bg-slate-50 border border-slate-100 p-4.5 rounded-2xl animate-fade-in shadow-sm">
              <span className="text-[10px] uppercase text-slate-450 font-extrabold tracking-wider font-mono">Bản đồ câu hỏi bộ đề</span>
              <div className="flex flex-wrap gap-1.5" id="unified-questions-jump-map">
                {sessionQuestions.map((_, idx) => {
                  const isSelected = idx === currentQuestionIndex;
                  const isAnsweredQ = testAnswers[idx] !== undefined;
                  const qRaw = _.originalQuestion;
                  const isCorrectReview = isReviewMode && checkAnswerCorrectness(qRaw, _.correctIndexInShuffled, testAnswers[idx]);

                  return (
                    <button
                      key={idx}
                      id={`jump-btn-${idx}`}
                      onClick={() => {
                        setCurrentQuestionIndex(idx);
                        setChosenOptionIndex(null);
                        setIsAnswered(isReviewMode ? true : (sessionMode === "training" ? testAnswers[idx] !== undefined : false));
                      }}
                      className={`w-8 h-8 rounded-lg text-xs font-bold font-mono transition flex items-center justify-center cursor-pointer ${
                        isSelected 
                          ? "bg-indigo-600 text-white ring-2 ring-indigo-400" 
                          : isReviewMode
                            ? isCorrectReview
                              ? "bg-emerald-50 border border-emerald-350 text-emerald-800 font-extrabold"
                              : "bg-rose-50 border border-rose-350 text-rose-800 font-extrabold"
                            : isAnsweredQ 
                              ? "bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold" 
                              : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
            const isTesting = false;

            if (q.questionType === "Video Based" && q.videoUrl) {
              const videoIdMatch = q.videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/);
              const embedUrl = videoIdMatch ? `https://www.youtube.com/embed/${videoIdMatch[1]}` : null;

              return (
                <div className="space-y-4 text-left" id="practice-video-block">
                  <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block mb-2">Học liệu Video mô phỏng</span>
                    {embedUrl ? (
                      <div className="aspect-video w-full rounded-lg overflow-hidden bg-black shadow-inner">
                        <iframe
                          src={embedUrl}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <div className="aspect-video w-full rounded-lg bg-slate-950 flex flex-col items-center justify-center text-slate-500 text-xs">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="https://picsum.photos/seed/ic3video/800/400" alt="Video cover placeholders" className="opacity-25 w-full h-full object-cover rounded" />
                        <span className="absolute">Mô phỏng: {q.videoUrl}</span>
                      </div>
                    )}
                  </div>

                  {/* Options options selection */}
                  <div className="grid grid-cols-1 gap-3 text-left">
                    {activeQuestion.shuffledOptions.map((opt, idx) => {
                      const isCorrectOpt = idx === activeQuestion.correctIndexInShuffled;
                      const isChosen = (sessionMode === "testing" || isReviewMode || isAnswered)
                        ? testAnswers[currentQuestionIndex] === idx
                        : idx === chosenOptionIndex;

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
                </div>
              );
            }

            if (q.questionType === "Multiple Select") {
              const charOf = (i: number) => String.fromCharCode(65 + i);
              const userAnswersList = Array.isArray(testAnswers[currentQuestionIndex]) 
                ? (testAnswers[currentQuestionIndex] as number[]) 
                : [];
              const optionsCount = q.options && q.options.length > 0
                ? q.options.length
                : [q.optionA, q.optionB, q.optionC, q.optionD].filter(Boolean).length;
              const loopIndices = Array.from({ length: optionsCount }, (_, i) => i);

              return (
                <div className="space-y-3 text-left font-sans" id="practice-multiselect-block">
                  <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl text-xs text-indigo-900 font-medium">
                    ⚠️ <strong>Lựa chọn nhiều phương án:</strong> Nhấp chọn tất cả câu trả lời Đúng, sau đó bấm Xác nhận.
                  </div>

                  <div className="space-y-3">
                    {loopIndices.map((idx) => {
                      const optText = q[`option${charOf(idx)}` as any] || q.options?.[idx];
                      if (!optText) return null;

                      const isSelected = userAnswersList.includes(idx);
                      const correctIndices = q.correctIndicesMulti || [];
                      const isCorrectOption = correctIndices.includes(idx);

                      let itemStyle = "bg-white border-slate-200 text-slate-700 hover:bg-slate-50";
                      if (isAnswered) {
                        if (isCorrectOption) {
                          itemStyle = "bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold";
                        } else if (isSelected) {
                          itemStyle = "bg-rose-50 border-rose-400 text-rose-950";
                        } else {
                          itemStyle = "opacity-40 bg-zinc-50 border-zinc-100 text-zinc-350 cursor-not-allowed";
                        }
                      } else if (isSelected) {
                        itemStyle = "bg-indigo-50 border-indigo-400 text-indigo-950 ring-1 ring-indigo-400 font-semibold";
                      }

                      return (
                        <button
                          key={idx}
                          disabled={isAnswered}
                          onClick={() => {
                            let updated = [...userAnswersList];
                            if (updated.includes(idx)) {
                              updated = updated.filter(i => i !== idx);
                            } else {
                              updated = [...updated, idx].sort();
                            }
                            setTestAnswers(prev => ({ ...prev, [currentQuestionIndex]: updated }));
                          }}
                          className={`w-full flex items-center justify-between p-4 rounded-xl text-xs md:text-sm border transition duration-150 cursor-pointer ${itemStyle}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-5.5 h-5.5 rounded flex items-center justify-center text-xs font-mono shrink-0 border transition ${
                              isSelected 
                                ? "bg-indigo-600 border-indigo-500 text-white" 
                                : "bg-slate-50 border-slate-200 text-slate-500"
                            }`}>
                              {isSelected ? <Check className="w-3.5 h-3.5" /> : charOf(idx)}
                            </span>
                            <span className="text-left font-semibold">{optText}</span>
                          </div>
                          {isAnswered && isCorrectOption && (
                            <span className="text-[10px] text-emerald-700 font-black bg-emerald-100 px-2.5 py-0.5 rounded border border-emerald-200 shrink-0">ĐÁP ÁN ĐÚNG</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            }

            if (q.questionType === "True / False Single") {
              const options = ["Đúng", "Sai"];
              return (
                <div className="space-y-4 font-sans text-left" id="practice-tf-single-block">
                  <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl text-xs text-indigo-900 font-medium">
                    🔍 <strong>Kiểm định Đúng / Sai:</strong> Xác thực khẳng định trên là Đúng (True) hay Sai (False).
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {options.map((choice) => {
                      const isSelected = testAnswers[currentQuestionIndex] === choice;
                      const isCorrectChoice = (q.correctAnswerBool && choice === "Đúng") || (!q.correctAnswerBool && choice === "Sai");

                      let itemStyle = "bg-white border-slate-200 text-slate-700 hover:bg-slate-50";
                      if (isAnswered) {
                        if (isCorrectChoice) {
                          itemStyle = "bg-emerald-50 border-emerald-400 text-emerald-950 font-bold";
                        } else if (isSelected) {
                          itemStyle = "bg-rose-50 border-rose-400 text-rose-950 font-bold";
                        } else {
                          itemStyle = "opacity-45 bg-zinc-50 border-zinc-100 text-zinc-300 cursor-not-allowed";
                        }
                      } else if (isSelected) {
                        itemStyle = choice === "Đúng"
                          ? "border-2 border-emerald-600 bg-emerald-50 text-emerald-950 font-bold"
                          : "border-2 border-rose-600 bg-rose-50 text-rose-950 font-bold";
                      }

                      return (
                        <button
                          key={choice}
                          disabled={isAnswered}
                          onClick={() => {
                            setTestAnswers(prev => ({ ...prev, [currentQuestionIndex]: choice }));
                          }}
                          className={`p-6 rounded-2xl text-center text-sm md:text-base border transition font-bold cursor-pointer ${itemStyle}`}
                        >
                          {choice}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            }

            if (q.questionType === "True / False Multiple") {
              return (
                <div className="space-y-4 font-sans text-left" id="practice-tf-multiple-block">
                  <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl text-xs text-indigo-900 font-medium">
                    📋 <strong>Mảng kiểm định Đúng / Sai song song:</strong> Chọn Đúng hoặc Sai riêng rẽ cho từng khẳng định bên cạnh.
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl divide-y divide-slate-150 overflow-hidden text-xs md:text-sm">
                    {(q.statements || []).map((stmtItem: any, idx: number) => {
                      const userTFAnswers = (testAnswers[currentQuestionIndex] as Record<number, boolean>) || {};
                      const isSelectedTrue = userTFAnswers[idx] === true;
                      const isSelectedFalse = userTFAnswers[idx] === false;
                      
                      const isCorrectTrue = stmtItem.answer === true;
                      const isCorrectFalse = stmtItem.answer === false;

                      let trueBtnStyle = "border-slate-250 bg-slate-50 text-slate-600 hover:bg-slate-100";
                      if (isAnswered) {
                        if (isCorrectTrue) {
                          if (isSelectedTrue) {
                            trueBtnStyle = "bg-emerald-600 border-emerald-500 text-white font-extrabold";
                          } else {
                            trueBtnStyle = "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold";
                          }
                        } else {
                          if (isSelectedTrue) {
                            trueBtnStyle = "bg-rose-600 border-rose-500 text-white font-extrabold";
                          } else {
                            trueBtnStyle = "opacity-40 bg-zinc-50 border-zinc-100 text-zinc-350 cursor-not-allowed";
                          }
                        }
                      } else if (isSelectedTrue) {
                        trueBtnStyle = "bg-indigo-600 border-indigo-500 text-white font-extrabold ring-2 ring-indigo-400/20";
                      }

                      let falseBtnStyle = "border-slate-250 bg-slate-50 text-slate-600 hover:bg-slate-100";
                      if (isAnswered) {
                        if (isCorrectFalse) {
                          if (isSelectedFalse) {
                            falseBtnStyle = "bg-emerald-600 border-emerald-500 text-white font-extrabold";
                          } else {
                            falseBtnStyle = "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold";
                          }
                        } else {
                          if (isSelectedFalse) {
                            falseBtnStyle = "bg-rose-600 border-rose-500 text-white font-extrabold";
                          } else {
                            falseBtnStyle = "opacity-40 bg-zinc-50 border-zinc-100 text-zinc-350 cursor-not-allowed";
                          }
                        }
                      } else if (isSelectedFalse) {
                        falseBtnStyle = "bg-indigo-600 border-indigo-500 text-white font-extrabold ring-2 ring-indigo-400/20";
                      }

                      return (
                        <div key={idx} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
                          <div className="flex-1 font-semibold text-slate-800 leading-relaxed">
                            <span className="font-extrabold text-indigo-600 mr-2">{idx + 1}.</span>
                            {stmtItem.statement}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              disabled={isAnswered}
                              onClick={() => {
                                const updated = { ...userTFAnswers, [idx]: true };
                                setTestAnswers(prev => ({ ...prev, [currentQuestionIndex]: updated }));
                              }}
                              className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition duration-150 ${trueBtnStyle}`}
                            >
                              Đúng
                            </button>
                            <button
                              disabled={isAnswered}
                              onClick={() => {
                                const updated = { ...userTFAnswers, [idx]: false };
                                setTestAnswers(prev => ({ ...prev, [currentQuestionIndex]: updated }));
                              }}
                              className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition duration-150 ${falseBtnStyle}`}
                            >
                              Sai
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }

            if (q.questionType === "Matching") {
              const pairs = q.matchingPairs || [];
              const lefts = pairs.map((p: any) => p.left);
              const allRightTexts = stableMatchingRights;
              const userMatches = (testAnswers[currentQuestionIndex] as Record<string, string>) || {};
              const assignedRights = Object.values(userMatches);

              const handleSelection = (leftVal: string, rightVal: string) => {
                if (isAnswered) return;
                
                // Tìm xem vế phải này đã được gán cho một vế trái nào khác chưa
                let oldLeftVal: string | null = null;
                for (const [k, v] of Object.entries(userMatches)) {
                  if (v === rightVal && k !== leftVal) {
                    oldLeftVal = k;
                    break;
                  }
                }

                const updated = { ...userMatches };

                if (oldLeftVal) {
                  // Vế phải đã nằm ở một vị trí cũ (oldLeftVal)
                  // Kiểm tra xem vị trí hiện tại (leftVal) đã có sẵn vế phải nào khác chưa
                  const oldRightVal = userMatches[leftVal];
                  if (oldRightVal) {
                    // Đổi chỗ hai vế cho nhau hoàn toàn
                    updated[leftVal] = rightVal;
                    updated[oldLeftVal] = oldRightVal;
                  } else {
                    // Chuyển vế phải sang vị trí mới và xóa trống vị trí cũ
                    updated[leftVal] = rightVal;
                    delete updated[oldLeftVal];
                  }
                } else {
                  // Vế phải chưa được gán ở đâu cả (được kéo từ kho hoặc đang chọn mới)
                  updated[leftVal] = rightVal;
                }

                setTestAnswers((prev) => ({ ...prev, [currentQuestionIndex]: updated }));
                setSelectedMatchingItem(null);
              };

              const handleClear = (leftVal: string) => {
                if (isAnswered) return;
                const updated = { ...userMatches };
                delete updated[leftVal];
                setTestAnswers((prev) => ({ ...prev, [currentQuestionIndex]: updated }));
              };

              return (
                <div className="space-y-6 font-sans text-left" id="practice-matching-block">
                  <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl text-xs text-indigo-950 flex items-start gap-2.5">
                    <HelpCircle className="h-4.5 w-4.5 text-indigo-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold">✨ Cách thực hiện (Kéo thả hoặc Chạm ghép):</p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        <li>Cách 1: Kéo thẻ từ <strong>Kho đáp án cần ghép</strong> thả vào <strong>Thả vào đây</strong> bên trái.</li>
                        <li>Cách 2: Nhấn chọn một thẻ đáp án bên phải (thành màu xanh), sau đó nhấn vào ô cần ghép bên trái.</li>
                      </ul>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* LEFT COLUMN: Targets rows with drop zones */}
                    <div className="lg:col-span-7 space-y-3">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Cột ghép nối (Thả vào đây)</h4>
                      <div className="space-y-3">
                        {lefts.map((left: string, idx: number) => {
                          const matchedValue = userMatches[left] || "";
                          const targetPair = pairs.find((p: any) => p.left === left);
                          const correctRight = targetPair ? targetPair.right : "";
                          const isCorrectMatch = matchedValue === correctRight;
                          const isDragOver = matchingDragOver === left;

                          return (
                            <div
                              key={idx}
                              className={`p-4 border rounded-2xl transition-all duration-200 ${
                                isAnswered
                                  ? isCorrectMatch
                                    ? "bg-emerald-50/25 border-emerald-300"
                                    : "bg-rose-50/25 border-rose-350"
                                  : isDragOver
                                  ? "border-dashed border-indigo-500 bg-indigo-50/60 scale-[1.01] shadow-sm transform"
                                  : selectedMatchingItem
                                  ? "border-slate-355 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-400"
                                  : "border-slate-200 bg-white hover:bg-slate-50/50"
                              }`}
                              onDragOver={(e) => {
                                if (isAnswered) return;
                                e.preventDefault();
                                setMatchingDragOver(left);
                              }}
                              onDragLeave={() => {
                                if (isAnswered) return;
                                setMatchingDragOver(null);
                              }}
                              onDrop={(e) => {
                                if (isAnswered) return;
                                e.preventDefault();
                                setMatchingDragOver(null);
                                const rightVal = e.dataTransfer.getData("text/plain");
                                if (rightVal) handleSelection(left, rightVal);
                              }}
                              onClick={() => {
                                if (isAnswered) return;
                                if (selectedMatchingItem) {
                                  handleSelection(left, selectedMatchingItem);
                                }
                              }}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <span className="font-extrabold text-slate-800 text-sm sm:text-base flex-1">
                                  {left}
                                </span>

                                <div className="shrink-0">
                                  {matchedValue ? (
                                    <div
                                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs sm:text-sm font-semibold shadow-sm transition-all duration-200 ${
                                        isAnswered
                                          ? isCorrectMatch
                                            ? "bg-emerald-100 border-emerald-450 text-emerald-950 font-bold"
                                            : "bg-rose-100 border-rose-450 text-rose-950"
                                          : "bg-indigo-50 border-indigo-200 text-indigo-950 hover:bg-indigo-100/80 cursor-grab active:cursor-grabbing"
                                      }`}
                                      draggable={!isAnswered}
                                      onDragStart={(e) => {
                                        if (isAnswered) return;
                                        e.dataTransfer.setData("text/plain", matchedValue);
                                      }}
                                    >
                                      {!isAnswered && <GripVertical className="h-3.5 w-3.5 text-indigo-400 shrink-0" />}
                                      <span className="truncate max-w-[200px]">{matchedValue}</span>
                                      {!isAnswered && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleClear(left);
                                          }}
                                          className="p-1 hover:bg-indigo-200 text-indigo-500 hover:text-indigo-700 rounded-md transition"
                                          title="Gỡ liên kết"
                                        >
                                          <X className="h-3.5 w-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  ) : (
                                    <div
                                      className={`px-3 py-2.5 border-2 border-dashed rounded-xl flex items-center justify-center text-xs font-bold cursor-pointer transition ${
                                        selectedMatchingItem
                                          ? "border-indigo-500 bg-indigo-55/40 text-indigo-650 font-black animate-pulse"
                                          : "border-slate-300 bg-slate-50 text-slate-400 hover:bg-slate-100"
                                      }`}
                                      style={{ minHeight: "42px", minWidth: "160px" }}
                                    >
                                      {selectedMatchingItem ? "👉 Nhấp để ghim" : "Thả vế khớp tại đây"}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {isAnswered && (
                                <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-2.5 text-xs font-bold">
                                  {isCorrectMatch ? (
                                    <span className="text-emerald-700 flex items-center gap-1.5 bg-emerald-100/60 px-2 py-0.5 rounded-lg">
                                      <Check className="h-4 w-4" /> Chính xác
                                    </span>
                                  ) : (
                                    <span className="text-red-700 flex items-center gap-1.5 bg-red-100/60 px-2 py-1 rounded-lg">
                                      <X className="h-4 w-4" /> Sai vế ghép (Đáp án đúng: <strong className="underline decoration-indigo-500 decoration-2">{correctRight}</strong>)
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Answer card pool */}
                    <div className="lg:col-span-5 space-y-3 bg-slate-50 p-4 border border-slate-200 rounded-2xl">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Kho đáp án cần ghép</h4>
                        {selectedMatchingItem && (
                          <button
                            type="button"
                            onClick={() => setSelectedMatchingItem(null)}
                            className="text-[10px] font-black uppercase text-indigo-600 bg-white border border-indigo-200 px-2 py-1 rounded-lg hover:bg-indigo-50 transition shadow-sm cursor-pointer"
                          >
                            Hủy chọn
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap lg:flex-col gap-2.5">
                        {allRightTexts.map((txt) => {
                          const isSelected = selectedMatchingItem === txt;
                          const timesAssigned = assignedRights.filter((v: any) => v === txt).length;
                          const isAssigned = timesAssigned > 0;

                          return (
                            <div
                              key={txt}
                              draggable={!isAnswered}
                              onDragStart={(e) => {
                                if (isAnswered) return;
                                e.dataTransfer.setData("text/plain", txt);
                              }}
                              onClick={() => {
                                if (isAnswered) return;
                                setSelectedMatchingItem(isSelected ? null : txt);
                              }}
                              className={`px-3 py-3 text-xs font-bold rounded-xl border cursor-grab active:cursor-grabbing transition-all duration-150 flex items-center justify-between gap-3 select-none ${
                                isSelected
                                  ? "border-indigo-600 bg-indigo-600 text-white shadow-md scale-[1.02] ring-2 ring-indigo-300"
                                  : isAssigned
                                  ? "border-slate-200 bg-slate-100 text-slate-400 opacity-60 hover:bg-slate-150"
                                  : "border-slate-250 bg-white hover:bg-slate-50 text-slate-705 hover:border-slate-350 shadow-sm"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <GripVertical className={`h-4 w-4 shrink-0 cursor-grab ${isSelected ? "text-indigo-200" : "text-slate-400"}`} />
                                <span className="font-bold text-slate-700 text-sm select-none break-words leading-snug">{txt}</span>
                              </div>

                              {isAssigned && (
                                <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wider">
                                  Đã dùng ({timesAssigned})
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            if (q.questionType === "Fill In The Blank") {
              const currentInputVal = testAnswers[currentQuestionIndex] === undefined ? "" : testAnswers[currentQuestionIndex];
              return (
                <div className="space-y-4 font-sans text-left" id="practice-blank-block">
                  <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl text-xs text-indigo-900 font-medium">
                    ✍️ <strong>Điền vào ô trống:</strong> Nhập câu trả lời chính xác trực tiếp vào ô soạn thảo văn bản.
                  </div>

                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3.5">
                    <input
                      type="text"
                      disabled={isAnswered}
                      value={currentInputVal}
                      onChange={(e) => {
                        setTestAnswers(prev => ({ ...prev, [currentQuestionIndex]: e.target.value }));
                      }}
                      placeholder="Nhập câu trả lời chính xác của bạn tại đây..."
                      className="w-full p-3.5 border border-slate-200 bg-white text-slate-800 font-semibold rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />

                    {isAnswered && (
                      <div className="bg-white p-3.5 rounded-xl border border-slate-150 text-xs text-slate-600 leading-relaxed font-semibold">
                        🔑 <strong>Các khế ước chấp nhận:</strong> <span className="text-emerald-700">{(q.correctAnswersBlank || []).join(" hoặc ")}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            if (q.questionType === "Drag And Drop") {
              return (
                <div className="space-y-5 font-sans text-left" id="practice-dragdrop-block">
                  <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl text-xs text-indigo-900 font-medium">
                    🎯 <strong>Ghép thả nhãn (Drag & Drop):</strong> Click/Chọn một nhãn từ khay rồi click vào Hộp thả trống tương ứng thích hợp.
                  </div>

                  {/* Drag/Click items container */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wide">Nhãn thả sẵn sàng:</span>
                    <div className="flex flex-wrap gap-2.5 items-center mt-1">
                      {stableDragItems.map((itm: string) => {
                        const assignedTargets = Object.values((testAnswers[currentQuestionIndex] as Record<number, string>) || {});
                        const isAssigned = assignedTargets.includes(itm);
                        const isSelected = activeDragItem === itm;

                        return (
                          <button
                            key={itm}
                            disabled={isAnswered || isAssigned}
                            onClick={() => {
                              setActiveDragItem(activeDragItem === itm ? null : itm);
                            }}
                            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition duration-150 ${
                              isSelected
                                ? "bg-indigo-600 border-indigo-500 text-white shadow-md scale-105"
                                : isAssigned
                                ? "opacity-30 bg-slate-100 border-slate-100 text-slate-300 cursor-not-allowed"
                                : "bg-white border-slate-250 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {itm}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Target slots drop zones code */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(q.dragTargets || []).map((target: any, index: number) => {
                      const dragMatches = (testAnswers[currentQuestionIndex] as Record<number, string>) || {};
                      const placedVal = dragMatches[index];
                      const isCorrectTarget = placedVal === target.expectedItem;

                      return (
                        <div
                          key={index}
                          className={`p-4 rounded-xl border flex flex-col justify-between ${
                            isAnswered
                              ? isCorrectTarget
                                ? "border-emerald-400 bg-emerald-50 text-emerald-950"
                                : "border-rose-400 bg-rose-50 text-rose-950"
                              : "border-slate-200 bg-slate-50 hover:bg-slate-50/80 transition"
                          }`}
                        >
                          <div>
                            <span className="text-[10px] font-black text-slate-400 mb-1.5 block uppercase tracking-wide leading-none">{target.placeholder}</span>
                            
                            {/* Two optimization vectors: Drag-Click OR dynamic direct pick selection drop-down */}
                            {!isAnswered && (
                              <div className="mb-2">
                                <select
                                  value={placedVal || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const updated = { ...dragMatches };
                                    if (!val) {
                                      delete updated[index];
                                    } else {
                                      // Remove prior duplicate assignments
                                      Object.keys(updated).forEach((k) => {
                                        if (updated[Number(k)] === val) {
                                          delete updated[Number(k)];
                                        }
                                      });
                                      updated[index] = val;
                                    }
                                    setTestAnswers(prev => ({ ...prev, [currentQuestionIndex]: updated }));
                                  }}
                                  className="w-full text-xs font-bold text-slate-700 bg-white border border-slate-250 cursor-pointer p-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-150"
                                >
                                  <option value="">-- Click chọn nhanh thẻ --</option>
                                  {stableDragItems.map((itm: string) => (
                                    <option key={itm} value={itm}>{itm}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>

                          <div className="relative mt-1">
                            {placedVal ? (
                              <div className="flex items-center justify-between p-2.5 rounded-lg bg-indigo-50 border border-indigo-200 font-bold text-xs text-indigo-950">
                                <span className="font-semibold">{placedVal}</span>
                                {!isAnswered && (
                                  <button
                                    onClick={() => {
                                      const updated = { ...dragMatches };
                                      delete updated[index];
                                      setTestAnswers(prev => ({ ...prev, [currentQuestionIndex]: updated }));
                                    }}
                                    className="text-slate-400 hover:text-slate-650 p-0.5 rounded cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <button
                                disabled={isAnswered}
                                onClick={() => {
                                  if (!activeDragItem) return;
                                  const updated = { ...dragMatches };
                                  // Remove any existing duplicate target placement
                                  Object.keys(updated).forEach((k) => {
                                    if (updated[Number(k)] === activeDragItem) {
                                      delete updated[Number(k)];
                                    }
                                  });
                                  updated[index] = activeDragItem;
                                  setTestAnswers(prev => ({ ...prev, [currentQuestionIndex]: updated }));
                                  setActiveDragItem(null);
                                }}
                                className={`w-full py-3 border border-dashed rounded-lg flex items-center justify-center text-xs font-semibold cursor-pointer ${
                                  activeDragItem
                                    ? "border-indigo-400 bg-indigo-50 text-indigo-700 font-bold animate-pulse"
                                    : "border-slate-300 bg-white text-slate-400 hover:bg-slate-50"
                                }`}
                              >
                                {activeDragItem ? "Đặt nhãn đang chọn vào đây" : "[ Đặt bằng nút thẻ ở danh sách trên ]"}
                              </button>
                            )}
                          </div>
                          {isAnswered && (
                            <span className={`text-[10px] font-extrabold mt-2.5 block leading-none ${
                              isCorrectTarget ? "text-emerald-700" : "text-rose-700"
                            }`}>
                              {isCorrectTarget ? "✓ ĐÚNG CHUẨN" : `✕ ĐÁP ÁN ĐÚNG PHẢI LÀ: ${target.expectedItem}`}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }

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
                    🔢 <strong>Yêu cầu Sắp xếp:</strong> Hãy kéo thả (Drag and Drop) các thẻ hoặc chọn nút mũi tên để sắp đặt đúng thứ tự thao tác.
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 text-left">
                    {currentList.map((item: string, idx: number) => {
                      const isMatching = isAnswered && correctList[idx] === item;
                      
                      let cardStyle = "bg-white border-slate-200 text-slate-700 hover:border-slate-350 cursor-grab active:cursor-grabbing";
                      if (isAnswered) {
                        cardStyle = "bg-white text-slate-700 border-slate-200";
                        if (isMatching) {
                          cardStyle = "bg-emerald-50 border-emerald-300 text-emerald-950";
                        } else {
                          cardStyle = "bg-rose-50 border-rose-300 text-rose-950";
                        }
                      }

                      // Apply drag highlight styles
                      const isDragOver = dragOverIdx === idx;
                      const dynamicDragStyle = isDragOver && !isAnswered 
                        ? "border-dashed border-indigo-500 bg-indigo-50/70 scale-[1.015] shadow-md ring-2 ring-indigo-500/20" 
                        : "";

                      return (
                        <div
                          key={idx}
                          draggable={!isAnswered}
                          onDragStart={(e) => {
                            if (isAnswered) return;
                            e.dataTransfer.setData("text/plain", idx.toString());
                            e.dataTransfer.effectAllowed = "move";
                          }}
                          onDragOver={(e) => {
                            if (isAnswered) return;
                            e.preventDefault();
                            setDragOverIdx(idx);
                          }}
                          onDragLeave={() => {
                            setDragOverIdx(null);
                          }}
                          onDrop={(e) => {
                            if (isAnswered) return;
                            e.preventDefault();
                            setDragOverIdx(null);
                            const dragIdx = parseInt(e.dataTransfer.getData("text/plain"), 10);
                            if (isNaN(dragIdx) || dragIdx === idx) return;
                            const updated = [...currentList];
                            const itemToMove = updated[dragIdx];
                            updated.splice(dragIdx, 1);
                            updated.splice(idx, 0, itemToMove);
                            setTestAnswers(prev => ({
                              ...prev,
                              [currentQuestionIndex]: updated
                            }));
                          }}
                          className={`flex items-center justify-between gap-4 p-3 border rounded-xl shadow-sm transition-all duration-150 ${cardStyle} ${dynamicDragStyle}`}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            {!isAnswered && (
                              <GripVertical className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
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
                            <span className="text-xs sm:text-sm font-semibold select-none">{item}</span>
                          </div>

                          {/* Arrow swapping buttons */}
                          {!isAnswered && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                disabled={idx === 0}
                                onClick={(e) => {
                                  e.stopPropagation();
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
                                onClick={(e) => {
                                  e.stopPropagation();
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
                            <div className="flex items-center gap-2 text-xs font-bold shrink-0">
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
                  const isChosen = (sessionMode === "testing" || isReviewMode || isAnswered)
                    ? testAnswers[currentQuestionIndex] === idx
                    : idx === chosenOptionIndex;

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
          {isAnswered && (sessionMode !== "training" || isReviewMode) && (
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
            {isReviewMode ? (
              <button
                onClick={() => {
                  setIsReviewMode(false);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs transition uppercase shadow cursor-pointer font-mono flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Quay lại Báo cáo
              </button>
            ) : (
              <button
                onClick={handleExitSession}
                className="px-4 py-2 hover:bg-slate-100 text-slate-500 font-bold border border-slate-200 hover:border-slate-300 rounded-xl text-xs transition cursor-pointer font-mono"
              >
                {sessionMode === "testing" ? "Hủy đề thi thử" : "Thoát chặng ôn"}
              </button>
            )}

            <div className="flex items-center gap-2">
              {isReviewMode ? (
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentQuestionIndex === 0}
                    onClick={() => {
                      setCurrentQuestionIndex((prev) => prev - 1);
                    }}
                    className="px-4 py-2.5 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer font-mono"
                  >
                    Quay lại
                  </button>

                  <button
                    disabled={currentQuestionIndex === sessionQuestions.length - 1}
                    onClick={() => {
                      setCurrentQuestionIndex((prev) => prev + 1);
                    }}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 disabled:pointer-events-none text-white rounded-xl text-xs font-black transition cursor-pointer font-mono"
                  >
                    Tiếp theo
                  </button>
                </div>
              ) : sessionMode === "testing" ? (
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentQuestionIndex === 0}
                    onClick={() => {
                      setCurrentQuestionIndex((prev) => prev - 1);
                      setChosenOptionIndex(null);
                    }}
                    className="px-4 py-2.5 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer font-mono"
                  >
                    Quay lại
                  </button>

                  <button
                    disabled={currentQuestionIndex === sessionQuestions.length - 1}
                    onClick={() => {
                      setCurrentQuestionIndex((prev) => prev + 1);
                      setChosenOptionIndex(null);
                    }}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 disabled:pointer-events-none text-white rounded-xl text-xs font-black transition cursor-pointer font-mono"
                  >
                    Tiếp theo
                  </button>

                  {currentQuestionIndex === sessionQuestions.length - 1 && (
                    <button
                      onClick={handleManualSubmitTest}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer uppercase tracking-wider font-mono ml-1.5 animate-fade-in"
                    >
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      Nộp bài thi
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {!isAnswered ? (
                    <button
                      id="btn-prac-submit"
                      disabled={!hasAnsweredActiveQuestion()}
                      onClick={handleSubmitAnswer}
                      className={`flex items-center gap-1.5 px-6 py-2.5 font-extrabold rounded-xl text-xs shadow transition cursor-pointer font-mono ${
                        hasAnsweredActiveQuestion()
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
                </>
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
            const isTesting = true;

            if (q.questionType === "Video Based" && q.videoUrl) {
              const videoIdMatch = q.videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/);
              const embedUrl = videoIdMatch ? `https://www.youtube.com/embed/${videoIdMatch[1]}` : null;

              return (
                <div className="space-y-4 text-left" id="testing-video-block">
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-slate-300">
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2 font-mono">Học liệu chuyên ngành</span>
                    {embedUrl ? (
                      <div className="aspect-video w-full rounded-lg overflow-hidden bg-black shadow-inner">
                        <iframe
                          src={embedUrl}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <div className="aspect-video w-full rounded-lg bg-zinc-950 flex flex-col items-center justify-center text-slate-500 text-xs">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="https://picsum.photos/seed/ic3video/800/400" alt="Video cover placeholders" className="opacity-20 w-full h-full object-cover rounded" />
                        <span className="absolute">Video liên kết: {q.videoUrl}</span>
                      </div>
                    )}
                  </div>

                  {/* Options selection */}
                  <div className="grid grid-cols-1 gap-3 text-left">
                    {sq.shuffledOptions.map((opt, idx) => {
                      const isSelected = testAnswers[currentQuestionIndex] === idx;

                      return (
                        <button
                          key={idx}
                          id={`testing-video-opt-${idx}`}
                          onClick={() => {
                            setTestAnswers(prev => ({
                              ...prev,
                              [currentQuestionIndex]: idx
                            }));
                          }}
                          className={`flex items-start gap-4 p-4 rounded-xl text-left font-medium text-xs md:text-sm border transition duration-150 cursor-pointer ${
                            isSelected 
                              ? "bg-indigo-950/65 border-indigo-500 text-indigo-100 ring-1 ring-indigo-500" 
                              : "bg-slate-950/50 border-slate-800 text-slate-300 hover:bg-slate-800"
                          }`}
                        >
                          <span className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-xs font-mono shrink-0 border transition ${
                            isSelected 
                              ? "bg-indigo-600 border-indigo-400 text-white" 
                              : "bg-slate-900 border-slate-700 text-slate-400"
                          }`}>
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            }

            if (q.questionType === "Multiple Select") {
              const charOf = (i: number) => String.fromCharCode(65 + i);
              const userAnswersList = Array.isArray(testAnswers[currentQuestionIndex]) 
                ? (testAnswers[currentQuestionIndex] as number[]) 
                : [];
              const optionsCount = q.options && q.options.length > 0
                ? q.options.length
                : [q.optionA, q.optionB, q.optionC, q.optionD].filter(Boolean).length;
              const loopIndices = Array.from({ length: optionsCount }, (_, i) => i);

              return (
                <div className="space-y-4 text-left font-sans" id="testing-multiselect-block">
                  <div className="bg-indigo-950/40 border border-indigo-900 p-3 rounded-xl text-xs text-indigo-200">
                    ⚠️ <strong>Chọn nhiều đáp án tốt nhất:</strong> Nhấp chọn tất cả câu trả lời có tính chuẩn xác cao, bạn có thể chọn một hoặc nhiều mục.
                  </div>

                  <div className="space-y-3">
                    {loopIndices.map((idx) => {
                      const optText = q[`option${charOf(idx)}` as any] || q.options?.[idx];
                      if (!optText) return null;

                      const isSelected = userAnswersList.includes(idx);

                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            let updated = [...userAnswersList];
                            if (updated.includes(idx)) {
                              updated = updated.filter(i => i !== idx);
                            } else {
                              updated = [...updated, idx].sort();
                            }
                            setTestAnswers(prev => ({ ...prev, [currentQuestionIndex]: updated }));
                          }}
                          className={`w-full flex items-center gap-3 p-4 rounded-xl text-xs md:text-sm border transition duration-150 cursor-pointer ${
                            isSelected
                              ? "bg-indigo-950/65 border-indigo-500 text-indigo-100 ring-1 ring-indigo-500"
                              : "bg-slate-950/50 border-slate-800 text-slate-300 hover:bg-slate-800"
                          }`}
                        >
                          <span className={`w-5.5 h-5.5 rounded flex items-center justify-center text-xs font-mono shrink-0 border transition ${
                            isSelected 
                              ? "bg-indigo-600 border-indigo-400 text-white" 
                              : "bg-slate-900 border-slate-700 text-slate-500"
                          }`}>
                            {isSelected ? <Check className="w-3.5 h-3.5" /> : charOf(idx)}
                          </span>
                          <span className="text-left font-semibold text-slate-300">{optText}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            }

            if (q.questionType === "True / False Single") {
              const options = ["Đúng", "Sai"];
              return (
                <div className="space-y-4 font-sans text-left" id="testing-tf-single-block">
                  <div className="bg-indigo-950/40 border border-indigo-900 p-3 rounded-xl text-xs text-indigo-200">
                    🔍 <strong>Khẳng định đơn (True / False):</strong> Hãy bấm chọn Đúng hoặc Sai phù hợp với câu phát biểu trên.
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {options.map((choice) => {
                      const isSelected = testAnswers[currentQuestionIndex] === choice;

                      return (
                        <button
                          key={choice}
                          onClick={() => {
                            setTestAnswers(prev => ({ ...prev, [currentQuestionIndex]: choice }));
                          }}
                          className={`p-6 rounded-2xl text-center text-sm md:text-base border transition font-bold cursor-pointer ${
                            isSelected
                              ? choice === "Đúng"
                                ? "border-emerald-600 bg-emerald-950/50 text-emerald-300 font-bold ring-1 ring-emerald-500"
                                : "border-rose-600 bg-rose-950/50 text-rose-300 font-bold ring-1 ring-rose-500"
                              : "bg-slate-950/50 border-slate-800 text-slate-300 hover:bg-slate-800"
                          }`}
                        >
                          {choice}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            }

            if (q.questionType === "True / False Multiple") {
              return (
                <div className="space-y-4 font-sans text-left" id="testing-tf-multiple-block">
                  <div className="bg-indigo-950/40 border border-indigo-900 p-3 rounded-xl text-xs text-indigo-200">
                    📋 <strong>Khảo sát khẳng định song song:</strong> Chọn Đúng hoặc Sai tương thích cho từng dòng văn bản bên dưới.
                  </div>

                  <div className="bg-slate-950/40 border border-slate-800 rounded-2xl divide-y divide-slate-850 overflow-hidden text-xs md:text-sm">
                    {(q.statements || []).map((stmtItem: any, idx: number) => {
                      const userTFAnswers = (testAnswers[currentQuestionIndex] as Record<number, boolean>) || {};
                      const isSelectedTrue = userTFAnswers[idx] === true;
                      const isSelectedFalse = userTFAnswers[idx] === false;

                      return (
                        <div key={idx} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40">
                          <div className="flex-1 font-semibold text-slate-300 leading-relaxed">
                            <span className="font-extrabold text-indigo-400 mr-2">{idx + 1}.</span>
                            {stmtItem.statement}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const updated = { ...userTFAnswers, [idx]: true };
                                setTestAnswers(prev => ({ ...prev, [currentQuestionIndex]: updated }));
                              }}
                              className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition duration-150 ${
                                isSelectedTrue
                                  ? "bg-emerald-600 border-emerald-500 text-white"
                                  : "border-slate-850 bg-slate-950 text-slate-400 hover:bg-slate-800"
                              }`}
                            >
                              Đúng
                            </button>
                            <button
                              onClick={() => {
                                const updated = { ...userTFAnswers, [idx]: false };
                                setTestAnswers(prev => ({ ...prev, [currentQuestionIndex]: updated }));
                              }}
                              className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition duration-150 ${
                                isSelectedFalse
                                  ? "bg-rose-600 border-rose-500 text-white"
                                  : "border-slate-850 bg-slate-950 text-slate-400 hover:bg-slate-800"
                              }`}
                            >
                              Sai
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }

            if (q.questionType === "Matching") {
              const allRightTexts = stableMatchingRights;
              return (
                <div className="space-y-4 font-sans text-left" id="testing-matching-block">
                  <div className="bg-indigo-950/40 border border-indigo-900 p-3 rounded-xl text-xs text-indigo-200">
                    🖇️ <strong>Lập danh sách đối xứng:</strong> Nối cột từ khóa trái với thuật ngữ cột bên phải tương thích bằng menu thả lựa chọn.
                  </div>

                  <div className="bg-slate-950/40 border border-slate-800 rounded-2xl divide-y divide-slate-850 overflow-hidden">
                    {(q.matchingPairs || []).map((pair: any, idx: number) => {
                      const userMatches = (testAnswers[currentQuestionIndex] as Record<string, string>) || {};
                      const userMatchedVal = userMatches[pair.left] || "";

                      return (
                        <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/30">
                          <span className="font-extrabold text-slate-300 truncate flex-1">{pair.left}</span>
                          <div className="flex items-center gap-2.5">
                            <span className="text-slate-500 font-bold text-xs font-mono">Ghép với:</span>
                            <select
                              value={userMatchedVal}
                              onChange={(e) => {
                                const updated = { ...userMatches, [pair.left]: e.target.value };
                                setTestAnswers(prev => ({ ...prev, [currentQuestionIndex]: updated }));
                              }}
                              className="p-2 py-1.5 rounded-xl text-xs font-bold border bg-slate-950 border-slate-805 text-slate-300 focus:outline-none min-w-[200px] cursor-pointer"
                            >
                              <option value="">-- Chọn ghép nối --</option>
                              {allRightTexts.map((txt) => (
                                <option key={txt} value={txt}>{txt}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }

            if (q.questionType === "Fill In The Blank") {
              const currentInputVal = testAnswers[currentQuestionIndex] === undefined ? "" : testAnswers[currentQuestionIndex];
              return (
                <div className="space-y-4 font-sans text-left" id="testing-blank-block">
                  <div className="bg-indigo-950/40 border border-indigo-900 p-3 rounded-xl text-xs text-indigo-200">
                    ✍️ <strong>Soạn thảo ô khuyết:</strong> Nhập câu trả lời tối ưu của bạn trực tiếp vào hộp nhập văn bản dưới đây.
                  </div>

                  <div className="bg-slate-900/30 border border-slate-800 p-5 rounded-2xl">
                    <input
                      type="text"
                      value={currentInputVal}
                      onChange={(e) => {
                        setTestAnswers(prev => ({ ...prev, [currentQuestionIndex]: e.target.value }));
                      }}
                      placeholder="Nhập câu trả lời chính xác của bạn tại đây..."
                      className="w-full p-3.5 border border-slate-800 bg-slate-950 text-slate-200 font-semibold rounded-xl text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              );
            }

            if (q.questionType === "Drag And Drop") {
              return (
                <div className="space-y-5 font-sans text-left" id="testing-dragdrop-block">
                  <div className="bg-indigo-950/40 border border-indigo-900 p-3 rounded-xl text-xs text-indigo-200">
                    🎯 <strong>Ghép nhãn đa chiều (Drag & Drop):</strong> Click/chọn một nhãn từ khay rồi click vào Hộp thả trống tương ứng thích hợp.
                  </div>

                  {/* Drag items container */}
                  <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl flex flex-col gap-2">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wide font-mono">Danh mục thẻ sẵn có:</span>
                    <div className="flex flex-wrap gap-2.5 items-center mt-1">
                      {stableDragItems.map((itm: string) => {
                        const assignedTargets = Object.values((testAnswers[currentQuestionIndex] as Record<number, string>) || {});
                        const isAssigned = assignedTargets.includes(itm);
                        const isSelected = activeDragItem === itm;

                        return (
                          <button
                            key={itm}
                            disabled={isAssigned}
                            onClick={() => {
                              setActiveDragItem(activeDragItem === itm ? null : itm);
                            }}
                            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition duration-150 ${
                              isSelected
                                ? "bg-indigo-600 border-indigo-500 text-white shadow-md scale-105"
                                : isAssigned
                                ? "opacity-20 bg-slate-950 border-slate-900 text-slate-650 cursor-not-allowed"
                                : "bg-slate-950 border-slate-850 text-slate-300 hover:bg-slate-800"
                            }`}
                          >
                            {itm}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Target slots drop zones code */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(q.dragTargets || []).map((target: any, index: number) => {
                      const dragMatches = (testAnswers[currentQuestionIndex] as Record<number, string>) || {};
                      const placedVal = dragMatches[index];

                      return (
                        <div
                          key={index}
                          className="p-4 rounded-xl border border-slate-800 bg-slate-900/20 flex flex-col justify-between min-h-[120px]"
                        >
                          <div>
                            <span className="text-[10px] font-black text-slate-500 mb-1.5 block uppercase tracking-wide leading-none">{target.placeholder}</span>
                            
                            <div className="mb-2">
                              <select
                                value={placedVal || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const updated = { ...dragMatches };
                                  if (!val) {
                                    delete updated[index];
                                  } else {
                                    // Remove prior duplicate assignments
                                    Object.keys(updated).forEach((k) => {
                                      if (updated[Number(k)] === val) {
                                        delete updated[Number(k)];
                                      }
                                    });
                                    updated[index] = val;
                                  }
                                  setTestAnswers(prev => ({ ...prev, [currentQuestionIndex]: updated }));
                                }}
                                className="w-full text-xs font-bold text-slate-300 bg-slate-950 border border-slate-800 cursor-pointer p-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              >
                                <option value="" className="text-slate-500">-- Click chọn nhanh thẻ --</option>
                                {stableDragItems.map((itm: string) => (
                                  <option key={itm} value={itm} className="bg-slate-950 text-slate-300">{itm}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="relative mt-1">
                            {placedVal ? (
                              <div className="flex items-center justify-between p-2.5 rounded-lg bg-indigo-950/60 border border-indigo-900 font-bold text-xs text-indigo-200">
                                <span className="font-semibold">{placedVal}</span>
                                <button
                                  onClick={() => {
                                    const updated = { ...dragMatches };
                                    delete updated[index];
                                    setTestAnswers(prev => ({ ...prev, [currentQuestionIndex]: updated }));
                                  }}
                                  className="text-slate-400 hover:text-red-400 p-0.5 rounded cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  if (!activeDragItem) return;
                                  const updated = { ...dragMatches };
                                  // Remove any duplicate target values
                                  Object.keys(updated).forEach((k) => {
                                    if (updated[Number(k)] === activeDragItem) {
                                      delete updated[Number(k)];
                                    }
                                  });
                                  updated[index] = activeDragItem;
                                  setTestAnswers(prev => ({ ...prev, [currentQuestionIndex]: updated }));
                                  setActiveDragItem(null);
                                }}
                                className={`w-full py-2 border border-dashed rounded-lg flex items-center justify-center text-xs font-semibold cursor-pointer ${
                                  activeDragItem
                                    ? "border-indigo-500 bg-indigo-950/40 text-indigo-300 font-bold animate-pulse"
                                    : "border-slate-800 bg-slate-950 text-slate-500 hover:bg-slate-900"
                                }`}
                              >
                                {activeDragItem ? "Đặt nhãn đang chọn vào đây" : "[ Đặt bằng nút thẻ ở trên ]"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }

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
                      {/* Interactive Image */}
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
                    🔢 <strong>Quy trình sắp xếp:</strong> Hãy kéo thả các bước hoặc dùng nút mũi tên để xếp đúng vị trí.
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 text-left">
                    {currentList.map((item: string, idx: number) => {
                      const isDragOver = dragOverIdx === idx;
                      const dynamicDragStyle = isDragOver
                        ? "border-dashed border-indigo-500 bg-indigo-950/70 scale-[1.015] shadow-md ring-2 ring-indigo-500/30" 
                        : "bg-slate-900/60 border-slate-800 hover:border-slate-700";

                      return (
                        <div
                          key={idx}
                          draggable={true}
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", idx.toString());
                            e.dataTransfer.effectAllowed = "move";
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDragOverIdx(idx);
                          }}
                          onDragLeave={() => {
                            setDragOverIdx(null);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            setDragOverIdx(null);
                            const dragIdx = parseInt(e.dataTransfer.getData("text/plain"), 10);
                            if (isNaN(dragIdx) || dragIdx === idx) return;
                            const updated = [...currentList];
                            const itemToMove = updated[dragIdx];
                            updated.splice(dragIdx, 1);
                            updated.splice(idx, 0, itemToMove);
                            setTestAnswers(prev => ({
                              ...prev,
                              [currentQuestionIndex]: updated
                            }));
                          }}
                          className={`flex items-center justify-between gap-4 p-3 border rounded-xl text-slate-300 transition-all duration-150 cursor-grab active:cursor-grabbing ${dynamicDragStyle}`}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <GripVertical className="w-4 h-4 text-slate-500 shrink-0" />
                            <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold font-mono bg-indigo-950 border border-indigo-800 text-indigo-400 shrink-0">
                              {idx + 1}
                            </span>
                            <span className="text-xs sm:text-sm font-semibold select-none">{item}</span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              disabled={idx === 0}
                              onClick={(e) => {
                                e.stopPropagation();
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
                              onClick={(e) => {
                                e.stopPropagation();
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
                {sessionMode === "training" ? "Hoàn Thành Ôn Luyện" : "Nộp Đề Thi Thử"}
              </button>
            </div>
          </div>

        </div>
      )}

      {/* TESTING RESULTS REPORT */}
      {testResult && !isReviewMode && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-8 animate-sweep-up" id="testing-report-stage">
          
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold text-[10px] px-3 py-1.5 rounded-full uppercase tracking-widest font-mono">
              {sessionMode === "training" ? "BÁO CÁO KẾT QUẢ ÔN LUYỆN TRAINING" : "XÁC CHỨNG CHỨNG CHỈ IC3 THỬ LẬP TRÌNH"}
            </span>
            <h3 className="text-2xl font-black text-slate-900 font-display">
              {sessionMode === "training" ? "Kết Quả Học Tập" : "Báo Cáo Thành Tích"} {testResult.moduleId.toUpperCase()}
            </h3>
            <p className="text-slate-500 text-xs font-semibold">
              {sessionMode === "training" ? "Điểm ôn luyện được tính toán chi tiết dựa trên số câu trả lời chính xác của bạn." : "Điểm thi thử được tính toán chuẩn theo tỉ lệ định giá của Certiport GS6 quốc tế."}
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
              <span className="text-[10px] text-slate-450 font-extrabold uppercase font-mono tracking-wider">{sessionMode === "training" ? "Trạng Thái Ôn Tập" : "Trạng Thái Kiểm Định"}</span>
              
              <div className="my-2.5">
                {testResult.scoreVal >= 700 ? (
                  <div className="space-y-1 flex flex-col items-center">
                    <span className="px-3.5 py-1 bg-emerald-100 border border-emerald-200 text-emerald-850 text-xs font-black rounded-full uppercase tracking-wider block">
                      {sessionMode === "training" ? "HOÀN THÀNH TỐT" : "ĐẠT CHUẨN (PASSED)"}
                    </span>
                    <Trophy className="w-8 h-8 text-yellow-500 fill-yellow-400 mt-1" />
                  </div>
                ) : (
                  <div className="space-y-1 flex flex-col items-center">
                    <span className="px-3.5 py-1 bg-rose-100 border border-rose-200 text-rose-800 text-xs font-black rounded-full uppercase tracking-wider block">
                      {sessionMode === "training" ? "CẦN LÀM LẠI" : "CHƯA ĐẠT (FAILED)"}
                    </span>
                    <AlertTriangle className="w-8 h-8 text-rose-500 mt-1" />
                  </div>
                )}
              </div>
              <span className="text-[10px] text-slate-500 font-mono">{sessionMode === "training" ? "Mục tiêu đạt chuẩn: 700+" : "Ngưỡng vượt qua đạt chuẩn: 700+"}</span>
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
                const qRaw = q.originalQuestion;
                const userAns = testAnswers[qIdx];
                const isUserCorrect = checkAnswerCorrectness(qRaw, q.correctIndexInShuffled, userAns);

                let userAnsText = "Bỏ trống";
                let correctAnsText = "";

                if (qRaw.questionType === "Multiple Choice" || qRaw.questionType === "Video Based" || !qRaw.questionType) {
                  userAnsText = userAns !== undefined && q.shuffledOptions[userAns] !== undefined ? String.fromCharCode(65 + userAns) + ". " + q.shuffledOptions[userAns] : "Bỏ trống";
                  correctAnsText = String.fromCharCode(65 + q.correctIndexInShuffled) + ". " + q.shuffledOptions[q.correctIndexInShuffled];
                } else if (qRaw.questionType === "Multiple Select") {
                  const arr = Array.isArray(userAns) ? userAns : [];
                  userAnsText = arr.length > 0 ? arr.map(idx => String.fromCharCode(65 + idx) + ". " + (qRaw[`option${String.fromCharCode(65 + idx)}`] || q.shuffledOptions?.[idx] || "")).join(" | ") : "Bỏ trống";
                  const correctArr = qRaw.correctIndicesMulti || [];
                  correctAnsText = correctArr.map(idx => String.fromCharCode(65 + idx) + ". " + (qRaw[`option${String.fromCharCode(65 + idx)}`] || q.shuffledOptions?.[idx] || "")).join(" | ");
                } else if (qRaw.questionType === "True / False Single") {
                  userAnsText = userAns || "Bỏ trống";
                  correctAnsText = qRaw.correctAnswerBool ? "Đúng" : "Sai";
                } else if (qRaw.questionType === "True / False Multiple") {
                  const userTF = userAns || {};
                  const userPairs = (qRaw.statements || []).map((s, idx) => `${idx + 1}: ${userTF[idx] !== undefined ? (userTF[idx] ? "Đúng" : "Sai") : "[Trống]"}`);
                  userAnsText = userPairs.join(" | ");
                  const correctPairs = (qRaw.statements || []).map((s, idx) => `${idx + 1}: ${s.answer ? "Đúng" : "Sai"}`);
                  correctAnsText = correctPairs.join(" | ");
                } else if (qRaw.questionType === "Matching") {
                  const userMatch = userAns || {};
                  const userPairs = (qRaw.matchingPairs || []).map(p => `[${p.left} -> ${userMatch[p.left] || "[Trống]"}]`);
                  userAnsText = userPairs.join(" | ");
                  const correctPairs = (qRaw.matchingPairs || []).map(p => `[${p.left} -> ${p.right}]`);
                  correctAnsText = correctPairs.join(" | ");
                } else if (qRaw.questionType === "Fill In The Blank") {
                  userAnsText = userAns || "Bỏ trống";
                  correctAnsText = (qRaw.correctAnswersBlank || []).join(" hoặc ");
                } else if (qRaw.questionType === "Drag And Drop") {
                  const userDrag = userAns || {};
                  const userPairs = (qRaw.dragTargets || []).map((t, idx) => `[${t.placeholder} -> ${userDrag[idx] || "[Trống]"}]`);
                  userAnsText = userPairs.join(" | ");
                  const correctPairs = (qRaw.dragTargets || []).map((t, idx) => `[${t.placeholder} -> ${t.expectedItem}]`);
                  correctAnsText = correctPairs.join(" | ");
                } else if (qRaw.questionType === "Hotspot") {
                  const clicks = Array.isArray(userAns) ? userAns : [];
                  userAnsText = clicks.length > 0 ? clicks.map((c, i) => `Tọa độ ${i + 1}(x:${Math.round(c.x)}%, y:${Math.round(c.y)}%)`).join(" | ") : "Chưa nhấp chọn";
                  correctAnsText = `Đã bấm đúng tất cả ${(qRaw.hotspots || []).length} vùng đáp án.`;
                } else if (qRaw.questionType === "Ordering / Sequence" || qRaw.questionType === "Ordering") {
                  const arr = Array.isArray(userAns) ? userAns : [];
                  userAnsText = arr.length > 0 ? arr.map((val, i) => `${i + 1}. ${val}`).join(" -> ") : "Bỏ trống";
                  const correctArr = qRaw.options || qRaw.correctSequence || [];
                  correctAnsText = correctArr.map((val, i) => `${i + 1}. ${val}`).join(" -> ");
                }

                return (
                  <div key={qRaw.id} className="p-3.5 rounded-xl border border-slate-150 bg-white shadow-sm space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 font-bold border-b border-slate-50 pb-1">
                      <span>CÂU HỎI {qIdx + 1} • LOẠI: {qRaw.questionType || "Multiple Choice"}</span>
                      <span className={isUserCorrect ? "text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded font-extrabold" : "text-rose-700 bg-rose-50 px-2 py-0.2 rounded font-extrabold"}>
                        {isUserCorrect ? "CHÍNH XÁC" : "LỖI SAI"}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-800 leading-snug">{q.questionText}</p>
                    
                    <div className="text-[11px] text-slate-500 font-semibold space-y-1">
                      <p>Đáp án bạn chọn: <strong className={isUserCorrect ? "text-emerald-700" : "text-rose-650"}>{userAnsText}</strong></p>
                      {!isUserCorrect && (
                        <p>Đáp án đúng khuyến nghị: <strong className="text-emerald-700">{correctAnsText}</strong></p>
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
                setSelectedTestSetId(null);
                setSessionMode(null);
              }}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-801 text-white font-extrabold rounded-xl text-xs transition uppercase shadow cursor-pointer font-mono"
            >
              Hoàn Tất Khảo Sát
            </button>

            <button
              onClick={() => {
                setIsReviewMode(true);
                setCurrentQuestionIndex(0);
              }}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer font-mono uppercase"
            >
              <Eye className="w-3.5 h-3.5" />
              Xem lại đáp án
            </button>

            {sessionMode !== "race" && (
              <button
                onClick={() => handleStartSession(testResult.moduleId, sessionMode || "training", testResult.testSetId || undefined)}
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
                <h3 className="text-lg font-black text-slate-950">
                  {sessionMode === "training" ? "Hoàn Thành Ôn Luyện" : "Xác Nhận Nộp Bài Thi"}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {sessionMode === "training" ? "Hãy chắc chắn về quyết định hoàn thành bài ôn luyện này." : "Hãy chắc chắn về quyết định nộp bài thi sớm của bạn."}
                </p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600 font-semibold bg-slate-50 p-4.5 rounded-2xl border border-slate-150">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span>{sessionMode === "training" ? "Tổng số câu hỏi ôn luyện:" : "Tổng số câu hỏi đề thi:"}</span>
                <span className="font-bold text-slate-900">{sessionQuestions.length} câu</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span>Số câu đã hoàn thành:</span>
                <span className="font-bold text-indigo-600">{answeredQuestionsCount} câu</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Số câu bỏ trống chưa làm:</span>
                <span className="font-bold text-rose-500">{sessionQuestions.length - answeredQuestionsCount} câu</span>
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
                {sessionMode === "training" ? "Nộp bài & Chấm điểm" : "Nộp bài thi & Chấm điểm"}
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
                <h3 className="text-lg font-black text-slate-950">
                  {sessionMode === "training" ? "Chưa Hoàn Tất Câu Hỏi" : "Chưa Hoàn Tất Bài Thi"}
                </h3>
                <p className="text-[11px] text-rose-500 font-mono">WARNING: BLANK QUESTIONS DETECTED</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600 font-semibold bg-slate-50 p-4.5 rounded-2xl border border-slate-150">
              <p className="text-slate-550 text-slate-500 leading-relaxed">
                {sessionMode === "training"
                   ? "Bạn chưa hoàn thiện toàn bộ câu hỏi. Vui lòng kiểm tra lại trước khi hoàn thành bài ôn luyện."
                  : "Bạn không thể nộp bài thi thử vì có câu hỏi bỏ trống chưa được hoàn thiện. Vui lòng kiểm tra lại."}
              </p>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span>Tổng số câu hỏi:</span>
                <span className="font-bold text-slate-900">{sessionQuestions.length} câu</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span>Số câu đã làm:</span>
                <span className="font-semibold text-emerald-600">{answeredQuestionsCount} câu</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-rose-550 text-rose-500">Số câu bỏ trống:</span>
                <span className="font-black text-rose-600 font-mono text-sm">{sessionQuestions.length - answeredQuestionsCount} câu</span>
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

      {/* CANDIDATE INFO POPUP DIALOG */}
      {showInfoModal && (() => {
        const uniqueClasses = Array.from(new Set((allowedStudents || []).map((s) => s.className.trim())))
          .filter(Boolean)
          .sort();

        const filteredStudents = (allowedStudents || []).filter(
          (s) => s.className.trim() === selectedClass.trim()
        );

        const handleConfirmStudentAuth = () => {
          if (!selectedClass) {
            setInfoModalError("Vui lòng chọn Lớp học.");
            return;
          }
          if (!selectedStudentId) {
            setInfoModalError("Vui lòng chọn Họ và Tên của bạn.");
            return;
          }
          if (!studentPassword) {
            setInfoModalError("Vui lòng nhập mật khẩu vào thi.");
            return;
          }

          const matchedStudent = (allowedStudents || []).find((s) => s.id === selectedStudentId);
          if (!matchedStudent) {
            setInfoModalError("Không tìm thấy học sinh này trong hệ thống.");
            return;
          }

          if (matchedStudent.password !== studentPassword.trim()) {
            setInfoModalError("Mật khẩu không chính xác! Vui lòng thử lại.");
            return;
          }

          // Clear modal error and set active student name & class
          setStudentName(matchedStudent.fullName);
          setStudentClass(matchedStudent.className);
          if (typeof window !== "undefined") {
            localStorage.setItem("ic3_student_name", matchedStudent.fullName);
            localStorage.setItem("ic3_student_class", matchedStudent.className);
          }

          setShowInfoModal(false);
          setInfoModalError("");
          setStudentPassword(""); // clear standard state password

          if (pendingStartArgs) {
            executeStartSession(pendingStartArgs.moduleId, pendingStartArgs.mode, pendingStartArgs.testSetId);
            setPendingStartArgs(null);
          }
        };

        return (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 max-w-md w-full shadow-2xl space-y-5 text-left">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <ShieldCheck className="w-6 h-6 shrink-0" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-950">Thông Tin Khảo Thí</h3>
                  <p className="text-[11px] text-slate-500 font-mono">VERIFY CANDIDATE CREDENTIALS</p>
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Chào mừng bạn! Vui lòng chọn Lớp, tìm Họ và tên được kích hoạt bởi giáo viên/quản trị viên, và nhập mật khẩu của bạn để bắt đầu làm bài ôn luyện.
              </p>

              <div className="space-y-4 font-sans text-xs">
                {/* 1. LỚP DROPDOWN */}
                <div className="space-y-1.5">
                  <label className="block text-slate-700 font-bold">Lớp học <span className="text-rose-500">*</span></label>
                  <select
                    value={selectedClass}
                    onChange={(e) => {
                      setSelectedClass(e.target.value);
                      setSelectedStudentId(""); // Reset student selection
                      setInfoModalError("");
                    }}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition font-bold text-slate-900 cursor-pointer"
                  >
                    <option value="">-- Chọn Lớp học của bạn --</option>
                    {uniqueClasses.map((cls) => (
                      <option key={cls} value={cls}>Lớp {cls}</option>
                    ))}
                  </select>
                </div>

                {/* 2. HỌ VÀ TÊN DROPDOWN */}
                <div className="space-y-1.5">
                  <label className="block text-slate-700 font-bold">Họ và Tên thí sinh <span className="text-rose-500">*</span></label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => {
                      setSelectedStudentId(e.target.value);
                      setInfoModalError("");
                    }}
                    disabled={!selectedClass}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition font-bold text-slate-900 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {!selectedClass ? "<- Vui lòng chọn lớp trước" : "-- Chọn đúng Họ và Tên của bạn --"}
                    </option>
                    {filteredStudents.map((s) => (
                      <option key={s.id} value={s.id}>{s.fullName}</option>
                    ))}
                  </select>
                </div>

                {/* 3. MẬT KHẨU PHÒNG THI */}
                <div className="space-y-1.5">
                  <label className="block text-slate-700 font-bold">Mật khẩu phòng thi <span className="text-rose-500">*</span></label>
                  <input
                    type="password"
                    placeholder="Nhập mật khẩu được cấp"
                    value={studentPassword}
                    onChange={(e) => {
                      setStudentPassword(e.target.value);
                      setInfoModalError("");
                    }}
                    disabled={!selectedStudentId}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition font-semibold text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed font-mono tracking-widest text-center"
                  />
                </div>

                {infoModalError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl flex items-center gap-2 font-medium">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{infoModalError}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowInfoModal(false);
                    setPendingStartArgs(null);
                    setStudentPassword("");
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={!selectedStudentId || !studentPassword}
                  onClick={handleConfirmStudentAuth}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs transition shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Xác nhận & Vào làm bài
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
