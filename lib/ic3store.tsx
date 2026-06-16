"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  Lesson,
  Question,
  Exam,
  UserLog,
  INITIAL_LESSONS,
  INITIAL_QUESTIONS,
  INITIAL_EXAMS,
  INITIAL_USER_LOG
} from "./ic3data";

interface IC3ContextType {
  currentUser: UserLog;
  lessons: Lesson[];
  questions: Question[];
  exams: Exam[];
  
  // App navigation active role
  activeRole: "student" | "teacher" | "admin";
  setActiveRole: (role: "student" | "teacher" | "admin") => void;
  
  // Actions
  toggleLessonCompleted: (lessonId: string) => void;
  saveExamResult: (
    examId: string,
    score: number,
    correctCount: number,
    totalCount: number,
    timeSpentSeconds: number,
    skillPerformance: { [skill: string]: number }
  ) => void;
  
  // Creation/Administration
  addNewQuestion: (question: Question) => void;
  editQuestion: (updated: Question) => void;
  deleteQuestion: (id: string) => void;
  
  addNewLesson: (lesson: Lesson) => void;
  editLesson: (updated: Lesson) => void;
  deleteLesson: (id: string) => void;
  
  // Reset/Seed Management
  resetSystemData: () => void;
  exportDatabase: () => string;
  importDatabase: (jsonStr: string) => boolean;
}

const IC3Context = createContext<IC3ContextType | undefined>(undefined);

export function IC3Provider({ children }: { children: React.ReactNode }) {
  const [activeRole, setActiveRole] = useState<"student" | "teacher" | "admin">("student");
  const [currentUser, setCurrentUser] = useState<UserLog>(INITIAL_USER_LOG);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load initial dataset from localStorage or fallback to defaults
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedLessons = localStorage.getItem("ic3_lessons");
        const storedQuestions = localStorage.getItem("ic3_questions");
        const storedUser = localStorage.getItem("ic3_user");
        const storedExams = localStorage.getItem("ic3_exams");

        setTimeout(() => {
          if (storedLessons) setLessons(JSON.parse(storedLessons));
          else {
            setLessons(INITIAL_LESSONS);
            localStorage.setItem("ic3_lessons", JSON.stringify(INITIAL_LESSONS));
          }

          if (storedQuestions) setQuestions(JSON.parse(storedQuestions));
          else {
            setQuestions(INITIAL_QUESTIONS);
            localStorage.setItem("ic3_questions", JSON.stringify(INITIAL_QUESTIONS));
          }

          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setCurrentUser(parsedUser);
            setActiveRole(parsedUser.role);
          } else {
            setCurrentUser(INITIAL_USER_LOG);
            localStorage.setItem("ic3_user", JSON.stringify(INITIAL_USER_LOG));
          }

          if (storedExams) setExams(JSON.parse(storedExams));
          else {
            setExams(INITIAL_EXAMS);
            localStorage.setItem("ic3_exams", JSON.stringify(INITIAL_EXAMS));
          }

          setIsLoaded(true);
        }, 0);
      } catch (err) {
        console.error("Failed to parse stored IC3 state:", err);
        // Fallback robustly
        setTimeout(() => {
          setLessons(INITIAL_LESSONS);
          setQuestions(INITIAL_QUESTIONS);
          setExams(INITIAL_EXAMS);
          setCurrentUser(INITIAL_USER_LOG);
          setIsLoaded(true);
        }, 0);
      }
    }
  }, []);

  // Sync state helpers
  const saveLessonsToStorage = (updatedLessons: Lesson[]) => {
    setLessons(updatedLessons);
    localStorage.setItem("ic3_lessons", JSON.stringify(updatedLessons));
  };

  const saveQuestionsToStorage = (updatedQuestions: Question[]) => {
    setQuestions(updatedQuestions);
    localStorage.setItem("ic3_questions", JSON.stringify(updatedQuestions));
  };

  const saveUserToStorage = (updatedUser: UserLog) => {
    setCurrentUser(updatedUser);
    localStorage.setItem("ic3_user", JSON.stringify(updatedUser));
  };

  const saveExamsToStorage = (updatedExams: Exam[]) => {
    setExams(updatedExams);
    localStorage.setItem("ic3_exams", JSON.stringify(updatedExams));
  };

  // Toggle lesson completion
  const toggleLessonCompleted = (lessonId: string) => {
    const wasCompleted = currentUser.completedLessons.includes(lessonId);
    let updatedCompleted: string[];

    if (wasCompleted) {
      updatedCompleted = currentUser.completedLessons.filter((id) => id !== lessonId);
    } else {
      updatedCompleted = [...currentUser.completedLessons, lessonId];
    }

    const totalLessonCount = lessons.length || 10;
    const progressPercent = Math.round((updatedCompleted.length / totalLessonCount) * 100);

    const updatedUser: UserLog = {
      ...currentUser,
      completedLessons: updatedCompleted,
      progressPercent,
    };
    saveUserToStorage(updatedUser);
  };

  // Save an exam attempt log
  const saveExamResult = (
    examId: string,
    score: number,
    correctCount: number,
    totalCount: number,
    timeSpentSeconds: number,
    skillPerformance: { [skill: string]: number }
  ) => {
    const exam = exams.find((e) => e.id === examId);
    const passed = score >= (exam?.passingScorePercent || 70);

    const newLogItem = {
      examId,
      title: exam?.title || "Bài luyện tập",
      score,
      correctCount,
      totalCount,
      timeSpentSeconds,
      date: new Date().toISOString().split("T")[0],
      passed,
      skillPerformance,
    };

    const updatedHistory = [newLogItem, ...currentUser.examHistory];
    const updatedUser: UserLog = {
      ...currentUser,
      examHistory: updatedHistory,
    };
    saveUserToStorage(updatedUser);
  };

  // Manage Question state
  const addNewQuestion = (question: Question) => {
    const updated = [...questions, question];
    saveQuestionsToStorage(updated);
    
    // Also append this question to related exam if requested
    const relatedExam = exams.find((e) => e.moduleId === question.moduleId);
    if (relatedExam) {
      const updatedExams = exams.map((exp) => {
        if (exp.id === relatedExam.id) {
          return {
            ...exp,
            questions: [...exp.questions, question],
          };
        }
        return exp;
      });
      saveExamsToStorage(updatedExams);
    }
  };

  const editQuestion = (updated: Question) => {
    const updatedList = questions.map((q) => (q.id === updated.id ? updated : q));
    saveQuestionsToStorage(updatedList);

    // Update in standard exams
    const updatedExams = exams.map((exp) => {
      const exists = exp.questions.some((q) => q.id === updated.id);
      if (exists) {
        return {
          ...exp,
          questions: exp.questions.map((q) => (q.id === updated.id ? updated : q)),
        };
      }
      return exp;
    });
    saveExamsToStorage(updatedExams);
  };

  const deleteQuestion = (id: string) => {
    const updatedList = questions.filter((q) => q.id !== id);
    saveQuestionsToStorage(updatedList);

    // Remove from in-memory exams as well
    const updatedExams = exams.map((exp) => ({
      ...exp,
      questions: exp.questions.filter((q) => q.id !== id),
    }));
    saveExamsToStorage(updatedExams);
  };

  // Manage Lessons state
  const addNewLesson = (lesson: Lesson) => {
    const updated = [...lessons, lesson];
    saveLessonsToStorage(updated);
  };

  const editLesson = (updated: Lesson) => {
    const updatedList = lessons.map((l) => (l.id === updated.id ? updated : l));
    saveLessonsToStorage(updatedList);
  };

  const deleteLesson = (id: string) => {
    const updatedList = lessons.filter((l) => l.id !== id);
    saveLessonsToStorage(updatedList);
  };

  const resetSystemData = () => {
    localStorage.removeItem("ic3_lessons");
    localStorage.removeItem("ic3_questions");
    localStorage.removeItem("ic3_user");
    localStorage.removeItem("ic3_exams");
    
    setLessons(INITIAL_LESSONS);
    setQuestions(INITIAL_QUESTIONS);
    setCurrentUser(INITIAL_USER_LOG);
    setExams(INITIAL_EXAMS);
    setActiveRole("student");

    localStorage.setItem("ic3_lessons", JSON.stringify(INITIAL_LESSONS));
    localStorage.setItem("ic3_questions", JSON.stringify(INITIAL_QUESTIONS));
    localStorage.setItem("ic3_user", JSON.stringify(INITIAL_USER_LOG));
    localStorage.setItem("ic3_exams", JSON.stringify(INITIAL_EXAMS));
  };

  const exportDatabase = (): string => {
    const data = {
      lessons,
      questions,
      exams,
      currentUser
    };
    return JSON.stringify(data, null, 2);
  };

  const importDatabase = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.lessons && parsed.questions && parsed.currentUser) {
        saveLessonsToStorage(parsed.lessons);
        saveQuestionsToStorage(parsed.questions);
        saveUserToStorage(parsed.currentUser);
        if (parsed.exams) saveExamsToStorage(parsed.exams);
        setActiveRole(parsed.currentUser.role || "student");
        return true;
      }
      return false;
    } catch (e) {
      console.error("Database import crash:", e);
      return false;
    }
  };

  const handleRoleChange = (role: "student" | "teacher" | "admin") => {
    setActiveRole(role);
    const updatedUser = { ...currentUser, role };
    saveUserToStorage(updatedUser);
  };

  if (!isLoaded) {
    return null; // Safe fallback during initialization to match server render
  }

  return (
    <IC3Context.Provider
      value={{
        currentUser,
        lessons,
        questions,
        exams,
        activeRole,
        setActiveRole: handleRoleChange,
        toggleLessonCompleted,
        saveExamResult,
        addNewQuestion,
        editQuestion,
        deleteQuestion,
        addNewLesson,
        editLesson,
        deleteLesson,
        resetSystemData,
        exportDatabase,
        importDatabase
      }}
    >
      {children}
    </IC3Context.Provider>
  );
}

export function useIC3() {
  const context = useContext(IC3Context);
  if (!context) {
    throw new Error("useIC3 must be called within an IC3Provider context wrapper");
  }
  return context;
}
