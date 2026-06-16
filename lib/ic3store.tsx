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
  deleteDoc
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { UserProgress, ExamRecord, Classroom, UploadedDocument } from "./ic3data";

interface IC3ContextType {
  firebaseUser: User | null;
  userProfile: UserProgress | null;
  activeRole: "student" | "teacher" | "admin";
  loading: boolean;
  classrooms: Classroom[];
  examRecords: ExamRecord[];
  documents: UploadedDocument[];
  allUsers: UserProgress[];
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, displayName: string, role: "student" | "teacher") => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  joinClassroom: (code: string) => Promise<void>;
  createClassroom: (name: string) => Promise<string>;
  saveExamResult: (module: "cf" | "ka" | "lo", correctCount: number, totalQuestions: number, timeSpent: number) => Promise<void>;
  updateUserRole: (newRole: "student" | "teacher" | "admin") => Promise<void>;
  uploadDocument: (name: string, size: number, type: string) => Promise<string>;
  deleteDocument: (docId: string) => Promise<void>;
}

const IC3Context = createContext<IC3ContextType | undefined>(undefined);

export function IC3Provider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [examRecords, setExamRecords] = useState<ExamRecord[]>([]);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [allUsers, setAllUsers] = useState<UserProgress[]>([]);

  // Guest users state saved to localStorage
  const [localExamRecords, setLocalExamRecords] = useState<ExamRecord[]>([]);

  // Track activeRole
  const activeRole = firebaseUser?.uid === "Mx33zQx6FVP9L7lThJ7YDue9FUI2" ? "admin" : "student";

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

  // Listen to Auth state changes - only accept the special Admin UID Mx33zQx6FVP9L7lThJ7YDue9FUI2
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (user.uid !== "Mx33zQx6FVP9L7lThJ7YDue9FUI2") {
          console.warn("[SECURITY ENFORCEMENT] Non-admin UID blocked. Automatic signing out.", user.uid);
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
    if (!firebaseUser || firebaseUser.uid !== "Mx33zQx6FVP9L7lThJ7YDue9FUI2") {
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
      console.error("Error listening to exams collection:", err);
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
      console.error("Error listening to classrooms collection:", err);
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
      console.error("Error listening to users collection:", err);
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
      console.error("Error listening to documents collection:", err);
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
      if (credential.user.uid !== "Mx33zQx6FVP9L7lThJ7YDue9FUI2") {
        await signOut(auth);
        throw new Error("Tài khoản không phải Quản trị viên duy nhất của hệ thống.");
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
    if (firebaseUser?.uid === "Mx33zQx6FVP9L7lThJ7YDue9FUI2") {
      await deleteDoc(doc(db, "documents", docId));
    } else {
      throw new Error("Chỉ Quản trị viên mới được xóa tài liệu.");
    }
  };

  // Saves simulated exam results dynamically (either locally for guests or to Firestore for Admin)
  const saveExamResult = async (
    module: "cf" | "ka" | "lo",
    correctCount: number,
    totalQuestions: number,
    timeSpent: number
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
      createdAt: Date.now()
    };

    if (firebaseUser?.uid === "Mx33zQx6FVP9L7lThJ7YDue9FUI2") {
      try {
        await addDoc(collection(db, "exams"), record);
      } catch (err) {
        console.warn("Firestore save failed, saving locally instead:", err);
        const newLocalRecord: ExamRecord = {
          id: `local_${Date.now()}`,
          ...record
        };
        const updated = [newLocalRecord, ...localExamRecords];
        setLocalExamRecords(updated);
        localStorage.setItem("ic3_local_exams", JSON.stringify(updated));
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
        loginWithEmail,
        registerWithEmail,
        logout,
        resetPassword,
        joinClassroom,
        createClassroom,
        saveExamResult,
        updateUserRole,
        uploadDocument,
        deleteDocument
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
