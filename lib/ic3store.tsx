"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { 
  User, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged
} from "firebase/auth";
import { 
  doc, 
  collection, 
  addDoc, 
  onSnapshot,
  deleteDoc,
  updateDoc
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { UserProgress, ExamRecord, Classroom, UploadedDocument, IC3Question, SAMPLE_QUESTIONS, TestSet } from "./ic3data";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface IC3ContextType {
  firebaseUser: User | null;
  userProfile: UserProgress | null;
  activeRole: "student" | "teacher" | "admin";
  loading: boolean;
  classrooms: Classroom[];
  examRecords: ExamRecord[];
  documents: UploadedDocument[];
  allUsers: UserProgress[];
  questions: IC3Question[];
  testSets: TestSet[];
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, displayName: string, role: "student" | "teacher") => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  joinClassroom: (code: string) => Promise<void>;
  createClassroom: (name: string) => Promise<string>;
  saveExamResult: (module: "cf" | "ka" | "lo", correctCount: number, totalQuestions: number, timeSpent: number, testSetId?: string, testSetTitle?: string) => Promise<void>;
  updateUserRole: (newRole: "student" | "teacher" | "admin") => Promise<void>;
  uploadDocument: (name: string, size: number, type: string) => Promise<string>;
  deleteDocument: (docId: string) => Promise<void>;
  addQuestion: (q: Omit<IC3Question, "id">) => Promise<void>;
  deleteQuestion: (qId: string) => Promise<void>;
  updateQuestion: (qId: string, q: Partial<IC3Question>) => Promise<void>;
  addTestSet: (t: Omit<TestSet, "id">) => Promise<string>;
  updateTestSet: (tId: string, t: Partial<TestSet>) => Promise<void>;
  deleteTestSet: (tId: string) => Promise<void>;
  duplicateTestSet: (tId: string) => Promise<string>;
}

const IC3Context = createContext<IC3ContextType | undefined>(undefined);

export const isUserAdmin = (user: User | null): boolean => {
  if (!user) return false;
  const email = user.email?.toLowerCase() || "";
  return (
    user.uid === "Mx33zQx6FVP9L7lThJ7YDue9FUI2" ||
    email === "admin@ic3master.com" ||
    email === "nguyenhoanthao612@gmail.com" ||
    email.startsWith("admin") ||
    email.includes("admin")
  );
};

export const DEFAULT_TEST_SETS: TestSet[] = [
  {
    id: "default_cf",
    title: "Vòng Luyện Tập CF - Mặc Định",
    description: "Bộ câu hỏi luyện tập mặc định cho Mô-đun Computing Fundamentals.",
    level: "cf",
    duration: 50,
    passingScore: 700,
  },
  {
    id: "ot1_cf",
    title: "OT1",
    description: "Bài ôn luyện phản xạ nhanh OT1 - Máy tính căn bản cường độ cao bám sát cấu trúc đề thi chính thức.",
    level: "cf",
    duration: 50,
    passingScore: 700,
  },
  {
    id: "default_ka",
    title: "Vòng Luyện Tập KA - Mặc Định",
    description: "Bộ câu hỏi luyện tập mặc định cho Mô-đun Key Applications.",
    level: "ka",
    duration: 50,
    passingScore: 700,
  },
  {
    id: "default_lo",
    title: "Vòng Luyện Tập LO - Mặc Định",
    description: "Bộ câu hỏi luyện tập mặc định cho Mô-đun Living Online.",
    level: "lo",
    duration: 50,
    passingScore: 700,
  }
];

export function IC3Provider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [examRecords, setExamRecords] = useState<ExamRecord[]>([]);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [allUsers, setAllUsers] = useState<UserProgress[]>([]);
  const [dbQuestions, setDbQuestions] = useState<IC3Question[]>([]);
  const [questions, setQuestions] = useState<IC3Question[]>([]);
  const [dbTestSets, setDbTestSets] = useState<TestSet[]>([]);
  const [testSets, setTestSets] = useState<TestSet[]>([]);

  // Guest users state saved to localStorage
  const [localExamRecords, setLocalExamRecords] = useState<ExamRecord[]>([]);

  // Track activeRole
  const activeRole = isUserAdmin(firebaseUser) ? "admin" : "student";

  // Bootstrap local storage records on startup
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ic3_local_exams");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setLocalExamRecords(parsed);
          }
        } catch (e) {
          console.error("Failed to parse local exams", e);
        }
      }
    }
  }, []);

  // Listen to all Questions (Publicly accessible)
  useEffect(() => {
    const questionsQuery = collection(db, "questions");
    const unsubscribe = onSnapshot(questionsQuery, (snapshot) => {
      const list: IC3Question[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        
        // 1. Determine module out of level structure
        let moduleVal: "cf" | "ka" | "lo" = data.module || "cf";
        const lvl = (data.level || data.module || "").toString().toLowerCase();
        if (lvl.includes("cf") || lvl.includes("lv1") || lvl.includes("fundamental") || lvl === "cf") {
          moduleVal = "cf";
        } else if (lvl.includes("ka") || lvl.includes("lv2") || lvl.includes("application") || lvl === "ka") {
          moduleVal = "ka";
        } else if (lvl.includes("lo") || lvl.includes("lv3") || lvl.includes("online") || lvl === "lo") {
          moduleVal = "lo";
        }

        // 2. Normalize and check Question Type
        let qType = data.questionType || "Multiple Choice";
        if (qType === "True / False" || qType === "true-false") {
          const hasMultipleStatements = [data.optionA, data.optionB, data.optionC, data.optionD].filter(Boolean).length > 1;
          if (hasMultipleStatements) {
            qType = "True / False Multiple";
          } else {
            qType = "True / False Single";
          }
        }

        // 3. Generate Options list safely
        let opts = data.options || [];
        if (!opts || opts.length === 0) {
          const optA = data.optionA || "";
          const optB = data.optionB || "";
          const optC = data.optionC || "";
          const optD = data.optionD || "";
          opts = [optA, optB, optC, optD].filter((v) => v !== "");
          if (opts.length === 0 && (qType === "True / False Single" || qType === "True / False Multiple")) {
            opts = ["Đúng", "Sai"];
          }
        }

        // 4. Resolve Correct Index securely
        let correctIdx = data.correctIndex;
        if (correctIdx === undefined || correctIdx === null || typeof correctIdx !== "number") {
          const ans = (data.correctAnswer || "").toString().trim().toUpperCase();
          if (ans === "A" || ans === "0") correctIdx = 0;
          else if (ans === "B" || ans === "1") correctIdx = 1;
          else if (ans === "C" || ans === "2") correctIdx = 2;
          else if (ans === "D" || ans === "3") correctIdx = 3;
          else if (ans.includes("ĐÚNG") || ans === "TRUE") correctIdx = 0;
          else if (ans.includes("SAI") || ans === "FALSE") correctIdx = 1;
          else correctIdx = 0; // standard fallback
        }

        // 5. Smart Dynamic Fallback for statements if missing in True / False Multiple
        let statements = data.statements || [];
        if (qType === "True / False Multiple" && (!statements || statements.length === 0)) {
          const opsArray = [data.optionA, data.optionB, data.optionC, data.optionD].filter(Boolean);
          if (opsArray.length > 0) {
            const rawAnsString = (data.correctAnswer || "").toString().toUpperCase();
            const ansParts = rawAnsString.split(/[,;\n|]/).map(p => p.trim()).filter(Boolean);
            
            statements = opsArray.map((op, idx) => {
              let matchAnswer = true; // default is True
              if (ansParts.length > idx) {
                const part = ansParts[idx];
                if (part.includes("SAI") || part.includes("FALSE") || part.includes("KHÔNG") || part === "F" || part === "S") {
                  matchAnswer = false;
                }
              } else {
                const cleanOpLabel = String.fromCharCode(65 + idx);
                const searchLabel = `OPTION${cleanOpLabel}`;
                const hasLabelWithSai = rawAnsString.includes(`${cleanOpLabel}: SAI`) || 
                                       rawAnsString.includes(`${cleanOpLabel}=SAI`) || 
                                       rawAnsString.includes(`${cleanOpLabel} SAI`) ||
                                       rawAnsString.includes(`${searchLabel}: SAI`) ||
                                       rawAnsString.includes(`${cleanOpLabel}: FALSE`) ||
                                       rawAnsString.includes(`${cleanOpLabel}=FALSE`);
                if (hasLabelWithSai) {
                  matchAnswer = false;
                }
              }
              return { statement: op, answer: matchAnswer };
            });
          }
        }

        const originalTestSetId = data.testSetId || "";
        const finalTestSetId = originalTestSetId ? originalTestSetId : `default_${moduleVal}`;

        list.push({
          id: d.id,
          module: moduleVal,
          topic: data.topic || "Tổng hợp",
          questionText: data.questionText || "",
          options: opts,
          correctIndex: correctIdx,
          explanation: data.explanation || "Giải thích đang được cập nhật.",
          level: data.level || (moduleVal === "cf" ? "CF (LV1)" : moduleVal === "ka" ? "KA (LV2)" : "LO (LV3)"),
          questionType: qType,
          optionA: data.optionA || "",
          optionB: data.optionB || "",
          optionC: data.optionC || "",
          optionD: data.optionD || "",
          correctAnswer: data.correctAnswer || "",
          difficulty: data.difficulty || "medium",
          attachments: data.attachments || [],
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now(),
          imageUrl: data.imageUrl || "",
          hotspots: data.hotspots || [],
          correctSequence: data.correctSequence || [],
          statements: statements,
          matchingPairs: data.matchingPairs || [],
          dragItems: data.dragItems || [],
          dragTargets: data.dragTargets || [],
          correctIndicesMulti: data.correctIndicesMulti || [],
          correctAnswerBool: data.correctAnswerBool !== undefined ? data.correctAnswerBool : true,
          correctAnswersBlank: data.correctAnswersBlank || [],
          videoUrl: data.videoUrl || "",
          testSetId: finalTestSetId,
        } as IC3Question);
      });
      setDbQuestions(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, "questions");
    });
    return () => unsubscribe();
  }, []);

  // Listen to all Test Sets (Publicly accessible)
  useEffect(() => {
    const testSetsQuery = collection(db, "testSets");
    const unsubscribe = onSnapshot(testSetsQuery, (snapshot) => {
      const list: TestSet[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          title: data.title || "",
          description: data.description || "",
          level: data.level || "cf",
          duration: Number(data.duration) || 50,
          passingScore: Number(data.passingScore) || 700,
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now(),
        } as TestSet);
      });
      setDbTestSets(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, "testSets");
    });
    return () => unsubscribe();
  }, []);

  // Merge dbTestSets with DEFAULT_TEST_SETS
  useEffect(() => {
    const combined = [...DEFAULT_TEST_SETS];
    dbTestSets.forEach((d) => {
      if (!combined.some((c) => c.id === d.id)) {
        combined.push(d);
      }
    });
    setTestSets(combined);
  }, [dbTestSets]);

  // If Firestore is empty, fall back to SAMPLE_QUESTIONS. Once there are questions in Firestore, use only Firestore.
  useEffect(() => {
    if (dbQuestions.length > 0) {
      setQuestions(dbQuestions);
    } else {
      setQuestions(SAMPLE_QUESTIONS);
    }
  }, [dbQuestions]);

  // Listen to Auth state changes - only accept verified admin users
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (!isUserAdmin(user)) {
          console.warn("[SECURITY ENFORCEMENT] Non-admin blocked. Automatic signing out.", user.uid);
          await signOut(auth);
          setFirebaseUser(null);
          setUserProfile(null);
          setLoading(false);
          return;
        }

        setFirebaseUser(user);
        const adminProfile: UserProgress = {
          userId: user.uid,
          role: "admin",
          displayName: "Quản Trị Viên",
          email: user.email || "admin@ic3master.com",
          createdAt: Date.now()
        };
        setUserProfile(adminProfile);
      } else {
        setFirebaseUser(null);
        setUserProfile(null);
        setClassrooms([]);
        setDocuments([]);
        setAllUsers([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Listen to cloud collections IF admin is logged in. Otherwise, fall back to local elements.
  useEffect(() => {
    if (!firebaseUser || !isUserAdmin(firebaseUser)) {
      setExamRecords(localExamRecords);
      setClassrooms([]);
      setDocuments([]);
      setAllUsers([]);
      return;
    }

    let unsubExams = () => {};
    let unsubClasses = () => {};
    let unsubDocs = () => {};
    let unsubUsers = () => {};

    // 1. Listen to all Exams
    const examsQuery = collection(db, "exams");
    unsubExams = onSnapshot(examsQuery, (snapshot) => {
      const records: ExamRecord[] = [];
      snapshot.forEach((d) => {
        records.push({ id: d.id, ...d.data() } as ExamRecord);
      });
      setExamRecords(records.sort((a, b) => b.createdAt - a.createdAt));
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, "exams");
    });

    // 2. Listen to all Classrooms
    const classesQuery = collection(db, "classrooms");
    unsubClasses = onSnapshot(classesQuery, (snapshot) => {
      const list: Classroom[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Classroom);
      });
      setClassrooms(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, "classrooms");
    });

    // 3. Listen to all Users
    const usersQuery = collection(db, "users");
    unsubUsers = onSnapshot(usersQuery, (snapshot) => {
      const list: UserProgress[] = [];
      snapshot.forEach((d) => {
        list.push({ ...d.data(), userId: d.id } as UserProgress);
      });
      setAllUsers(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, "users");
    });

    // 4. Listen to all Documents
    const docsQuery = collection(db, "documents");
    unsubDocs = onSnapshot(docsQuery, (snapshot) => {
      const list: UploadedDocument[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as UploadedDocument);
      });
      setDocuments(list.sort((a, b) => b.createdAt - a.createdAt));
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, "documents");
    });

    return () => {
      unsubExams();
      unsubClasses();
      unsubDocs();
      unsubUsers();
    };
  }, [firebaseUser, localExamRecords]);

  // Authenticate Admin
  const loginWithEmail = async (email: string, password: string) => {
    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      if (!isUserAdmin(credential.user)) {
        await signOut(auth);
        throw new Error("Tài khoản không phải Quản trị viên của hệ thống.");
      }
    } catch (e) {
      setLoading(false);
      throw e;
    }
  };

  // Reg is fully deactivated for regular users
  const registerWithEmail = async () => {
    throw new Error("Chức năng đăng ký tài khoản tự do đã đóng. Mọi thí sinh có thể ôn luyện tự do trực tiếp không cần tài khoản.");
  };

  const logout = async () => {
    setLoading(true);
    await signOut(auth);
    setFirebaseUser(null);
    setUserProfile(null);
    setClassrooms([]);
    setExamRecords(localExamRecords);
    setDocuments([]);
    setAllUsers([]);
    setLoading(false);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  // Stubs for inactive user roles features
  const joinClassroom = async () => {
    throw new Error("Hệ thống lớp học đã được tối giản hóa sang hình thức học tập công khai tự do.");
  };

  const createClassroom = async () => {
    throw new Error("Không hỗ trợ tạo lớp học mới đơn lẻ.");
  };

  const updateUserRole = async () => {
    throw new Error("Không hỗ trợ thay đổi vai trò tài khoản.");
  };

  const uploadDocument = async () => {
    throw new Error("Chức năng tải lên tài liệu cá nhân đã bị đóng.");
  };

  const deleteDocument = async (docId: string) => {
    if (isUserAdmin(firebaseUser)) {
      try {
        await deleteDoc(doc(db, "documents", docId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `documents/${docId}`);
      }
    } else {
      throw new Error("Chỉ Quản trị viên mới được xóa tài liệu.");
    }
  };

  // Saves simulated exam results dynamically (either locally for guests or to Firestore for Admin)
  const saveExamResult = async (
    module: "cf" | "ka" | "lo",
    correctCount: number,
    totalQuestions: number,
    timeSpent: number,
    testSetId?: string,
    testSetTitle?: string
  ) => {
    const ratio = correctCount / totalQuestions;
    const scoreVal = Math.round(ratio * 1000);
    const passed = scoreVal >= 700;

    const record: Omit<ExamRecord, "id"> = {
      userId: firebaseUser ? firebaseUser.uid : "guest_candidate",
      studentName: firebaseUser ? "Quản Trị Viên" : "Thí sinh tự do",
      module,
      score: scoreVal,
      correctCount,
      totalQuestions,
      timeSpent,
      passed,
      createdAt: Date.now(),
      testSetId: testSetId || "",
      testSetTitle: testSetTitle || ""
    };

    if (isUserAdmin(firebaseUser)) {
      try {
        await addDoc(collection(db, "exams"), record);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, "exams");
      }
    } else {
      const newLocalRecord: ExamRecord = {
        id: `local_${Date.now()}`,
        ...record
      };
      const updated = [newLocalRecord, ...localExamRecords];
      setLocalExamRecords(updated);
      if (typeof window !== "undefined") {
        localStorage.setItem("ic3_local_exams", JSON.stringify(updated));
      }
    }
  };

  const addQuestion = async (q: Omit<IC3Question, "id">) => {
    if (isUserAdmin(firebaseUser)) {
      try {
        await addDoc(collection(db, "questions"), q);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, "questions");
      }
    } else {
      throw new Error("Chỉ Quản trị viên mới được tạo câu hỏi mới.");
    }
  };

  const deleteQuestion = async (qId: string) => {
    if (isUserAdmin(firebaseUser)) {
      try {
        await deleteDoc(doc(db, "questions", qId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `questions/${qId}`);
      }
    } else {
      throw new Error("Chỉ Quản trị viên mới được xóa câu hỏi.");
    }
  };

  const updateQuestion = async (qId: string, q: Partial<IC3Question>) => {
    if (isUserAdmin(firebaseUser)) {
      const { id, ...data } = q as any;
      try {
        await updateDoc(doc(db, "questions", qId), data);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `questions/${qId}`);
      }
    } else {
      throw new Error("Chỉ Quản trị viên mới được chỉnh sửa câu hỏi.");
    }
  };

  const addTestSet = async (t: Omit<TestSet, "id">) => {
    if (isUserAdmin(firebaseUser)) {
      try {
        const docRef = await addDoc(collection(db, "testSets"), t);
        return docRef.id;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, "testSets");
        return "";
      }
    } else {
      throw new Error("Chỉ Quản trị viên mới được tạo bài kiểm tra.");
    }
  };

  const updateTestSet = async (tId: string, t: Partial<TestSet>) => {
    if (isUserAdmin(firebaseUser)) {
      const { id, ...data } = t as any;
      try {
        await updateDoc(doc(db, "testSets", tId), data);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `testSets/${tId}`);
      }
    } else {
      throw new Error("Chỉ Quản trị viên mới được chỉnh sửa bài kiểm tra.");
    }
  };

  const deleteTestSet = async (tId: string) => {
    if (isUserAdmin(firebaseUser)) {
      try {
        await deleteDoc(doc(db, "testSets", tId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `testSets/${tId}`);
      }
    } else {
      throw new Error("Chỉ Quản trị viên mới được xóa bài kiểm tra.");
    }
  };

  const duplicateTestSet = async (tId: string) => {
    if (isUserAdmin(firebaseUser)) {
      const found = testSets.find(item => item.id === tId);
      if (!found) throw new Error("Không tìm thấy bài kiểm tra để nhân bản.");
      try {
        const payload: Omit<TestSet, "id"> = {
          title: `${found.title} - Bản Sao`,
          description: found.description || "",
          level: found.level,
          duration: found.duration,
          passingScore: found.passingScore,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        const docRef = await addDoc(collection(db, "testSets"), payload);
        return docRef.id;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, "testSets");
        return "";
      }
    } else {
      throw new Error("Chỉ Quản trị viên mới được nhân bản bài kiểm tra.");
    }
  };

  return (
    <IC3Context.Provider
      value={{
        firebaseUser,
        userProfile,
        activeRole,
        loading,
        classrooms,
        examRecords,
        documents,
        allUsers,
        questions,
        testSets,
        loginWithEmail,
        registerWithEmail,
        logout,
        resetPassword,
        joinClassroom,
        createClassroom,
        saveExamResult,
        updateUserRole,
        uploadDocument,
        deleteDocument,
        addQuestion,
        deleteQuestion,
        updateQuestion,
        addTestSet,
        updateTestSet,
        deleteTestSet,
        duplicateTestSet
      }}
    >
      {children}
    </IC3Context.Provider>
  );
}

export function useIC3() {
  const context = useContext(IC3Context);
  if (context === undefined) {
    throw new Error("useIC3 must be used within an IC3Provider");
  }
  return context;
}
