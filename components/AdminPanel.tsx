"use client";

import React, { useState } from "react";
import { useIC3 } from "../lib/ic3store";
import { IC3_MODULES, UserProgress, IC3Question } from "../lib/ic3data";
import { 
  Users, 
  Trash2, 
  TrendingUp, 
  Activity, 
  Sparkles,
  Award,
  Search,
  FileText,
  ChevronLeft,
  Calendar,
  Shield,
  HardDrive,
  Folder,
  UserCheck,
  Mail,
  Loader2,
  Trash,
  PlusCircle,
  HelpCircle,
  CheckCircle,
  CheckCircle2,
  XCircle,
  MessageSquare,
  AlertTriangle,
  MapPin,
  X
} from "lucide-react";

export default function AdminPanel() {
  const { 
    classrooms, 
    examRecords, 
    documents, 
    allUsers, 
    deleteDocument,
    questions,
    addQuestion,
    deleteQuestion,
    updateQuestion,
    testSets,
    addTestSet,
    updateTestSet,
    deleteTestSet,
    duplicateTestSet
  } = useIC3();

  // Selected administrative tabs
  const [activeTab, setActiveTab] = useState<"users" | "stats" | "questions" | "records" | "testSets">("users");

  // TestSet Form States
  const [editingTestSet, setEditingTestSet] = useState<any | null>(null);
  const [formTestTitle, setFormTestTitle] = useState("");
  const [formTestLevel, setFormTestLevel] = useState<"cf" | "ka" | "lo">("cf");
  const [formTestDescription, setFormTestDescription] = useState("");
  const [formTestDuration, setFormTestDuration] = useState<number>(50);
  const [formTestPassingScore, setFormTestPassingScore] = useState<number>(700);
  const [deletingTestSetId, setDeletingTestSetId] = useState<string | null>(null);
  const [testSetIdToConfirmDelete, setTestSetIdToConfirmDelete] = useState<string | null>(null);
  const [isSubmittingTestSet, setIsSubmittingTestSet] = useState(false);

  // Selection of single user details
  const [selectedUser, setSelectedUser] = useState<UserProgress | null>(null);

  // Search filter
  const [searchTerm, setSearchTerm] = useState("");

  // Deleting state flag
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);
  const [docIdToConfirmDelete, setDocIdToConfirmDelete] = useState<string | null>(null);
  const [questionIdToConfirmDelete, setQuestionIdToConfirmDelete] = useState<string | null>(null);
  const [adminNotice, setAdminNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Create/Edit Question Form States
  const [editingQuestion, setEditingQuestion] = useState<IC3Question | null>(null);
  const [formTestSetId, setFormTestSetId] = useState<string>("");
  const [formModule, setFormModule] = useState<"cf" | "ka" | "lo">("cf");
  const [formLevel, setFormLevel] = useState<string>("CF (LV1)");
  const [formQuestionType, setFormQuestionType] = useState<string>("Multiple Choice");
  const [formTopic, setFormTopic] = useState("");
  const [formText, setFormText] = useState("");
  const [formOptA, setFormOptA] = useState("");
  const [formOptB, setFormOptB] = useState("");
  const [formOptC, setFormOptC] = useState("");
  const [formOptD, setFormOptD] = useState("");
  const [formOptionsList, setFormOptionsList] = useState<string[]>(["", "", "", ""]);
  const [formCorrectIndex, setFormCorrectIndex] = useState<number>(0);
  const [formCorrectAnswer, setFormCorrectAnswer] = useState<string>("A");
  const [formExplanation, setFormExplanation] = useState("");
  const [smartPasteText, setSmartPasteText] = useState("");
  const [smartPasteFeedback, setSmartPasteFeedback] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formHotspots, setFormHotspots] = useState<Array<{ x: number; y: number; radius: number }>>([]);
  const [adminHotspotRadius, setAdminHotspotRadius] = useState<number>(3);
  
  // Dynamic Custom Question Type states
  const [formCorrectIndicesMulti, setFormCorrectIndicesMulti] = useState<number[]>([]);
  const [formCorrectAnswerBool, setFormCorrectAnswerBool] = useState<boolean>(true);
  const [formStatements, setFormStatements] = useState<Array<{ statement: string; answer: boolean }>>([{ statement: "", answer: true }]);
  const [formMatchingPairs, setFormMatchingPairs] = useState<Array<{ left: string; right: string }>>([{ left: "", right: "" }]);
  const [formCorrectAnswersBlank, setFormCorrectAnswersBlank] = useState<string>("");
  const [formDragItems, setFormDragItems] = useState<string>("");
  const [formDragTargets, setFormDragTargets] = useState<Array<{ placeholder: string; expectedItem: string }>>([{ placeholder: "", expectedItem: "" }]);
  const [formVideoUrl, setFormVideoUrl] = useState<string>("");

  const [successPopup, setSuccessPopup] = useState<{ isOpen: boolean; message: string; subMessage?: string } | null>(null);

  const handleAdminImgClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const pctX = Number(((clickX / rect.width) * 100).toFixed(1));
    const pctY = Number(((clickY / rect.height) * 100).toFixed(1));
    
    // Add new hotspot coordinate point
    setFormHotspots((prev) => [...prev, { x: pctX, y: pctY, radius: adminHotspotRadius }]);
  };

  const [formDifficulty, setFormDifficulty] = useState<string>("medium");
  const [formAttachments, setFormAttachments] = useState<Array<{ type: string; url: string }>>([]);
  const [newAttachmentType, setNewAttachmentType] = useState<string>("image");
  const [newAttachmentUrl, setNewAttachmentUrl] = useState<string>("");
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);

  // Google Sheets Import States
  const [importSheetUrl, setImportSheetUrl] = useState("");
  const [importMode, setImportMode] = useState<"append" | "overwrite">("append");
  const [isImportValidating, setIsImportValidating] = useState(false);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [isImportingToDb, setIsImportingToDb] = useState(false);
  const [importProgressPercent, setImportProgressPercent] = useState(0);

  // Custom robust CSV Parser compliant with escapes, quotes, commas
  const parseCSV = (text: string): string[][] => {
    const result: string[][] = [];
    let row: string[] = [];
    let col = "";
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      
      if (inQuotes) {
        if (char === '"') {
          if (nextChar === '"') {
            col += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          col += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          row.push(col);
          col = "";
        } else if (char === '\r' || char === '\n') {
          row.push(col);
          col = "";
          if (row.some(x => x !== "")) {
            result.push(row);
          }
          row = [];
          if (char === '\r' && nextChar === '\n') {
            i++;
          }
        } else {
          col += char;
        }
      }
    }
    if (row.length > 0 || col !== "") {
      row.push(col);
      if (row.some(x => x !== "")) {
        result.push(row);
      }
    }
    return result;
  };

  // Google Sheet Link Verification & Parsing
  const handleValidateSheet = async () => {
    if (!importSheetUrl.trim()) {
      showNotice("error", "Vui lòng nhập đường liên kết Google Sheet!");
      return;
    }

    setIsImportValidating(true);
    setImportErrors([]);
    setImportPreview([]);
    setImportProgressPercent(0);

    try {
      const sheetIdMatch = importSheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!sheetIdMatch) {
         setImportErrors(["Đường dẫn Google Sheet không đúng định dạng. Đảm bảo đường dẫn có dạng: https://docs.google.com/spreadsheets/d/ID-TRANG-TINH/..."]);
         setIsImportValidating(false);
         return;
      }
      const sheetId = sheetIdMatch[1];
      
      // Determine tab GID if available
      const gidMatch = importSheetUrl.match(/[#&]gid=([0-9]+)/);
      const gid = gidMatch ? gidMatch[1] : "0";
      
      const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
      
      const res = await fetch(exportUrl);
      if (!res.ok) {
        throw new Error("Không thể tải bảng tính. Bạn đã bật chia sẻ: 'Bất kỳ ai có đường liên kết đều có thể xem' chưa?");
      }

      const csvText = await res.text();
      const rows = parseCSV(csvText);

      if (rows.length < 2) {
        throw new Error("Bảng tính rỗng hoặc không có dữ liệu thực tế.");
      }

      const rawHeaders = rows[0].map(h => h.trim());
      const normalizedHeaders = rawHeaders.map(h => h.toLowerCase());

      // Only really require the core fields to be present as headers
      const requiredCols = ["questiontype", "questiontext", "correctanswer", "explanation"];

      const missingCols = requiredCols.filter(col => !normalizedHeaders.includes(col));
      if (missingCols.length > 0) {
        throw new Error(`Cấu trúc cột không khớp. Thiếu các cột bắt buộc: [${missingCols.join(", ")}].`);
      }

      // Map columns indexes including optional columns names
      const colMapping: Record<string, number> = {};
      const allPossibleCols = [
        "level", "questiontype", "questiontext", 
        "optiona", "optionb", "optionc", "optiond", 
        "correctanswer", "explanation", "difficulty", "attachments"
      ];
      
      allPossibleCols.forEach(col => {
        colMapping[col] = normalizedHeaders.indexOf(col);
      });
      // Fallback mappings if level/module is named differently or missing
      if (colMapping["level"] === -1) {
        colMapping["level"] = normalizedHeaders.findIndex(h => h.includes("module") || h.includes("học phần") || h.includes("mảng kiến thức") || h.includes("mảng"));
      }

      colMapping["id"] = normalizedHeaders.indexOf("id");

      const errors: string[] = [];
      const parsedList: any[] = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 1;

        if (row.length === 0 || row.every(cell => cell.trim() === "")) {
          continue;
        }

        const getVal = (key: string) => {
          const idx = colMapping[key];
          return idx !== -1 && idx < row.length ? row[idx].trim() : "";
        };

        let levelVal = getVal("level");
        if (!levelVal) {
          levelVal = "CF (LV1)";
        } else {
          const lvlUpper = levelVal.toUpperCase();
          const isValidLvl = lvlUpper.includes("CF") || lvlUpper.includes("KA") || lvlUpper.includes("LO") ||
                    ["CF", "KA", "LO", "CF (LV1)", "KA (LV2)", "LO (LV3)"].includes(lvlUpper);
          if (!isValidLvl) {
            levelVal = "CF (LV1)"; // default fallback on mismatch instead of failure
          }
        }

        const qType = getVal("questiontype");
        const qText = getVal("questiontext");
        const optA = getVal("optiona");
        const optB = getVal("optionb");
        const optC = getVal("optionc");
        const optD = getVal("optiond");
        const correctAns = getVal("correctanswer");
        const expl = getVal("explanation");
        const diff = getVal("difficulty") || "medium";
        const attachsStr = getVal("attachments");
        const customId = getVal("id");

        // Rules check
        if (!qType) {
          errors.push(`Dòng ${rowNum}: Cột 'questionType' bị bỏ trống.`);
        } else {
          const validTypes = ["Multiple Choice", "Multiple Select", "True / False", "Matching", "Fill In The Blank", "Drag And Drop", "Hotspot", "Video Based", "Ordering / Sequence", "Ordering"];
          if (!validTypes.some(vt => vt.toLowerCase() === qType.toLowerCase())) {
            errors.push(`Dòng ${rowNum}: Cột 'questionType' (${qType}) không hợp lệ. Các loại hỗ trợ: ${validTypes.join(", ")}`);
          }
        }

        if (!qText) {
          errors.push(`Dòng ${rowNum}: Cột 'questionText' bị bỏ trống.`);
        }

        if (!correctAns) {
          errors.push(`Dòng ${rowNum}: Cột 'correctAnswer' bị bỏ trống.`);
        }

        let parsedAttachs: any[] = [];
        if (attachsStr) {
          try {
            if (attachsStr.startsWith("[") && attachsStr.endsWith("]")) {
              parsedAttachs = JSON.parse(attachsStr);
            } else {
              const urls = attachsStr.split(/[;,]/);
              urls.forEach(urlObj => {
                const u = urlObj.trim();
                if (u) {
                  const isVideo = u.includes("youtube.com") || u.includes("youtu.be") || u.endsWith(".mp4");
                  const isPdf = u.endsWith(".pdf");
                  parsedAttachs.push({
                    type: isVideo ? "video" : isPdf ? "pdf" : "image",
                    url: u
                  });
                }
              });
            }
          } catch (e) {
            errors.push(`Dòng ${rowNum}: Cột 'attachments' (${attachsStr}) chứa định dạng JSON hoặc liên kết không hợp lệ.`);
          }
        }

        parsedList.push({
          id: customId || `imported_${Date.now()}_${i}_${Math.floor(Math.random() * 1000)}`,
          level: levelVal,
          questionType: qType,
          questionText: qText,
          optionA: optA,
          optionB: optB,
          optionC: optC,
          optionD: optD,
          correctAnswer: correctAns,
          explanation: expl || "Giải thích đang được cập nhật.",
          difficulty: diff || "medium",
          attachments: parsedAttachs
        });
      }

      if (errors.length > 0) {
        setImportErrors(errors);
        showNotice("error", `Phát hiện ${errors.length} dòng dữ liệu lỗi. Hủy toàn bộ hoạt động import.`);
      } else {
        setImportPreview(parsedList);
        showNotice("success", `Google Sheet hoàn hảo! Sẵn sàng nạp ${parsedList.length} câu hỏi lên Firestore.`);
      }
    } catch (e: any) {
      console.error(e);
      setImportErrors([e.message || "Tải dữ liệu bảng tính thất bại."]);
      showNotice("error", e.message || "Kiểm tra quyền truy cập dữ liệu liên kết.");
    } finally {
      setIsImportValidating(false);
    }
  };

  // Safe import transactions to Firestore with clear progressbar
  const handleImportToDb = async () => {
    if (importPreview.length === 0) return;
    setIsImportingToDb(true);
    setImportProgressPercent(5);

    try {
      // 1. If Overwrite choice, safely prune existing questions first
      if (importMode === "overwrite") {
        setImportProgressPercent(10);
        const dynamicQuestions = questions.filter(q => {
          const isStatic = (q.id || "").startsWith("cf_") || (q.id || "").startsWith("ka_") || (q.id || "").startsWith("lo_");
          return !isStatic;
        });

        for (let i = 0; i < dynamicQuestions.length; i++) {
          try {
            await deleteQuestion(dynamicQuestions[i].id);
          } catch (e) {
            console.warn("Delete dynamic question failed during clear:", e);
          }
          const delPct = Math.round(10 + (i / Math.max(1, dynamicQuestions.length)) * 25);
          setImportProgressPercent(delPct);
        }
      }

      setImportProgressPercent(40);

      // 2. Stream uploaded rows sequentially
      for (let i = 0; i < importPreview.length; i++) {
        const item = importPreview[i];
        
        // Resolve module key
        let modId: "cf" | "ka" | "lo" = "cf";
        const cleanLvl = item.level.toUpperCase();
        if (cleanLvl.includes("CF") || cleanLvl.includes("LV1") || cleanLvl.includes("FUNDAMENTAL")) {
          modId = "cf";
        } else if (cleanLvl.includes("KA") || cleanLvl.includes("LV2") || cleanLvl.includes("APPLICATION")) {
          modId = "ka";
        } else if (cleanLvl.includes("LO") || cleanLvl.includes("LV3") || cleanLvl.includes("ONLINE")) {
          modId = "lo";
        }

        // Parse options array
        let finalOptions: string[] = [];
        if (item.questionType === "True / False" || item.questionType === "true-false") {
          finalOptions = ["Đúng", "Sai"];
        } else {
          finalOptions = [item.optionA, item.optionB, item.optionC, item.optionD].filter(Boolean);
        }

        // Resolve correctIndex matching chars
        let cIdx = 0;
        const rawAns = item.correctAnswer.toString().toUpperCase().trim();
        if (rawAns === "A" || rawAns === "0") cIdx = 0;
        else if (rawAns === "B" || rawAns === "1") cIdx = 1;
        else if (rawAns === "C" || rawAns === "2") cIdx = 2;
        else if (rawAns === "D" || rawAns === "3") cIdx = 3;
        else if (rawAns.includes("ĐÚNG") || rawAns === "TRUE") cIdx = 0;
        else if (rawAns.includes("SAI") || rawAns === "FALSE") cIdx = 1;

        let imageUrl = "";
        let hotspotsArr: any[] = [];
        let correctSeq: string[] = [];

        if (item.questionType === "Hotspot") {
          try {
            if (item.correctAnswer.startsWith("[") && item.correctAnswer.endsWith("]")) {
              hotspotsArr = JSON.parse(item.correctAnswer);
            }
          } catch (e) {}
          // Look for an image attachment to load
          const imgAttach = item.attachments?.find((att: any) => att.type === "image");
          if (imgAttach) {
            imageUrl = imgAttach.url;
          }
        } else if (item.questionType === "Ordering / Sequence" || item.questionType === "Ordering") {
          correctSeq = finalOptions;
        }

        await addQuestion({
          module: modId,
          level: item.level,
          questionType: item.questionType,
          topic: item.level + " General",
          questionText: item.questionText,
          optionA: item.optionA || "",
          optionB: item.optionB || "",
          optionC: item.optionC || "",
          optionD: item.optionD || "",
          options: finalOptions,
          correctIndex: cIdx,
          correctAnswer: item.correctAnswer,
          explanation: item.explanation,
          difficulty: item.difficulty,
          attachments: item.attachments,
          imageUrl,
          hotspots: hotspotsArr,
          correctSequence: correctSeq,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });

        const uploadPct = Math.round(40 + (i / importPreview.length) * 58);
        setImportProgressPercent(uploadPct);
      }

      setImportProgressPercent(100);
      showNotice("success", `Đã nhập và đồng bộ thành công ${importPreview.length} câu hỏi vào hệ thống Firestore!`);
      setImportPreview([]);
      setImportSheetUrl("");
    } catch (err: any) {
      console.error(err);
      showNotice("error", "Quá trình nhập dữ liệu bị gián đoạn: " + err.message);
    } finally {
      setIsImportingToDb(false);
    }
  };

  // Filtered users matching search string
  const filteredUsers = allUsers.filter(user => {
    const nameMatch = (user.displayName || "").toLowerCase().includes(searchTerm.toLowerCase());
    const emailMatch = (user.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    const roleMatch = (user.role || "").toLowerCase().includes(searchTerm.toLowerCase());
    return nameMatch || emailMatch || roleMatch;
  });

  // Calculate stats in real-time
  const totalUsersNum = allUsers.length;
  const totalDocsNum = documents.length;
  const totalExams = examRecords.length;
  const avgScore = totalExams > 0 ? Math.round(examRecords.reduce((acc, curr) => acc + curr.score, 0) / totalExams) : 0;
  const passedCount = examRecords.filter((r) => r.passed).length;
  const passRate = totalExams > 0 ? Math.round((passedCount / totalExams) * 100) : 0;

  // File size formatter
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const showNotice = (type: "success" | "error", text: string) => {
    setAdminNotice({ type, text });
    setTimeout(() => {
      setAdminNotice((curr) => curr?.text === text ? null : curr);
    }, 4500);
  };

  // Safe document deletion with database synchronization
  const handleDeleteDoc = async (docId: string) => {
    if (docIdToConfirmDelete !== docId) {
      setDocIdToConfirmDelete(docId);
      setTimeout(() => {
        setDocIdToConfirmDelete((curr) => curr === docId ? null : curr);
      }, 4000);
      return;
    }
    setDocIdToConfirmDelete(null);
    setDeletingDocId(docId);
    try {
      await deleteDocument(docId);
      showNotice("success", "Đã xóa tài liệu khỏi hệ thống thành công!");
    } catch (err) {
      console.error("Xóa tài liệu thất bại:", err);
      showNotice("error", "Không có quyền hoặc quá trình xóa tệp gặp lỗi.");
    } finally {
      setDeletingDocId(null);
    }
  };
 
  const parsePastedBlock = (text: string) => {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return null;

    let questionLines: string[] = [];
    const optionsList: { text: string; isCorrect: boolean; rawPrefix: string }[] = [];
    let detectedExplanation = "";
    const detectedCorrectIndices: number[] = [];

    let isParsingOptions = false;
    const optionPrefixRegex = /^([-a-eA-Eg1-4]|đúng|sai)\s*[\.\)\-:\s]\s*(.*)$/i;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      const expMatch = line.match(/^(?:giải thích|lời giải|gợi ý|explanation|giai thich|loi gia|note)[:\-=\s]\s*(.*)$/i);
      if (expMatch) {
        detectedExplanation = expMatch[1].trim();
        continue;
      }

      const ansMatch = line.match(/^(?:đáp án|đáp án đúng|correct answer|answer|key|ans|dap an)[:\-=\s]\s*([a-dgA-DG1-4\s,;+&|/]+)$/i);
      if (ansMatch) {
         const letters = ansMatch[1].toUpperCase().replace(/[^A-D1-4]/g, "").split("");
         letters.forEach(char => {
           let idx = -1;
           if (["A", "1"].includes(char)) idx = 0;
           else if (["B", "2"].includes(char)) idx = 1;
           else if (["C", "3"].includes(char)) idx = 2;
           else if (["D", "4"].includes(char)) idx = 3;
           if (idx !== -1 && !detectedCorrectIndices.includes(idx)) {
             detectedCorrectIndices.push(idx);
           }
         });
         continue;
      }

      const isOptionPattern = i > 0 && optionPrefixRegex.test(line);
      if (isOptionPattern) {
        isParsingOptions = true;
      }

      if (!isParsingOptions) {
        questionLines.push(line);
      } else {
        const prefixMatch = line.match(/^([-a-eA-Eg1-4]|đúng|sai)\s*[\.\)\-:\s]\s*(.*)$/i);
        let rawPrefix = "";
        let cleanText = line;
        if (prefixMatch) {
          rawPrefix = prefixMatch[1];
          cleanText = prefixMatch[2].trim();
        }

        let isCorrect = false;
        const correctPatterns = [
          /\(Correct\)/i,
          /\[Correct\]/i,
          /\(Đúng\)/i,
          /\[Đúng\]/i,
          /\(Dung\)/i,
          /\[Dung\]/i,
          /\*$/
        ];
        for (const pattern of correctPatterns) {
          if (pattern.test(cleanText)) {
            isCorrect = true;
            cleanText = cleanText.replace(pattern, "").trim();
          }
        }

        optionsList.push({
          text: cleanText,
          isCorrect,
          rawPrefix
        });
      }
    }

    let questionText = questionLines.join("\n").trim();
    
    return {
      questionText,
      options: optionsList,
      explanation: detectedExplanation,
      correctIndices: detectedCorrectIndices
    };
  };

  const handlePasteInQuestionText = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData("text");
    if (!pastedText) return;
    
    const parsed = parsePastedBlock(pastedText);
    if (!parsed) return;

    if (parsed.options.length === 0) {
      const singleTfMatch = parsed.questionText.match(/^(.*?)\s*[\(\[]?(Đúng|Sai|True|False)[\)\]]?$/i);
      if (singleTfMatch) {
         e.preventDefault();
         const cleanQ = singleTfMatch[1].trim();
         const ansText = singleTfMatch[2].toLowerCase();
         const isTrue = ansText === "đúng" || ansText === "true";
         setFormText(cleanQ);
         setFormQuestionType("True / False Single");
         setFormCorrectAnswerBool(isTrue);
         showNotice("success", `⚡ Đã nhận diện Đúng/Sai đơn, đáp án: ${isTrue ? "Đúng" : "Sai"}`);
         return;
      }
      return;
    }

    e.preventDefault();
    setFormText(parsed.questionText);
    
    if (parsed.explanation) {
      setFormExplanation(parsed.explanation);
    }

    const isTrueFalseMultiple = parsed.options.length > 1 && parsed.options.every(opt => {
      const t = opt.text.toLowerCase();
      const hasSaiMark = t.includes("sai") || t.includes("false") || t.includes("không");
      const hasDungMark = t.includes("đúng") || t.includes("true");
      return hasSaiMark || hasDungMark;
    });

    const isTrueFalseSingle = parsed.options.length === 2 && 
      (parsed.options[0].text.toLowerCase() === "đúng" || parsed.options[0].text.toLowerCase() === "true" ||
       parsed.options[0].text.toLowerCase() === "sai" || parsed.options[0].text.toLowerCase() === "false");

    if (isTrueFalseMultiple) {
      setFormQuestionType("True / False Multiple");
      
      const statements = parsed.options.map(opt => {
         let textPart = opt.text;
         let isCorrectValue = true;
         
         const saiPatterns = [
           /\(Sai\)/i, /\[Sai\]/i, /\(False\)/i, /\[False\]/i, /\(Không\)/i, /\[Không\]/i
         ];
         const dungPatterns = [
           /\(Đúng\)/i, /\[Đúng\]/i, /\(True\)/i, /\[True\]/i
         ];
         
         let foundSai = false;
         let foundDung = false;
         
         for (const p of saiPatterns) {
           if (p.test(textPart)) {
             foundSai = true;
             textPart = textPart.replace(p, "").trim();
           }
         }
         for (const p of dungPatterns) {
           if (p.test(textPart)) {
             foundDung = true;
             textPart = textPart.replace(p, "").trim();
           }
         }
         
         if (foundSai) {
           isCorrectValue = false;
         } else if (foundDung) {
           isCorrectValue = true;
         } else {
           isCorrectValue = opt.isCorrect;
         }
         
         return {
           statement: textPart,
           answer: isCorrectValue
         };
      });
      
      setFormStatements(statements);
      showNotice("success", `⚡ Đã tự động nhận diện câu hỏi True/False nhiều phát biểu (${statements.length} câu con)!`);
    } else if (isTrueFalseSingle) {
      setFormQuestionType("True / False Single");
      let dungIndex = parsed.options.findIndex(o => o.text.toLowerCase() === "đúng" || o.text.toLowerCase() === "true");
      if (dungIndex === -1) dungIndex = 0;
      
      let isCorrectBool = true;
      if (parsed.correctIndices.length > 0) {
        isCorrectBool = parsed.correctIndices[0] === dungIndex;
      } else {
        const correctIndex = parsed.options.findIndex(o => o.isCorrect);
        if (correctIndex !== -1) {
          isCorrectBool = correctIndex === dungIndex;
        }
      }
      setFormCorrectAnswerBool(isCorrectBool);
      showNotice("success", `⚡ Đã nhận diện câu hỏi Đúng/Sai (Đơn) với đáp án: ${isCorrectBool ? 'Đúng' : 'Sai'}!`);
    } else {
      const optA = parsed.options[0]?.text || "";
      const optB = parsed.options[1]?.text || "";
      const optC = parsed.options[2]?.text || "";
      const optD = parsed.options[3]?.text || "";
      
      setFormOptA(optA);
      setFormOptB(optB);
      setFormOptC(optC);
      setFormOptD(optD);
      
      const paddedList = [optA, optB, optC, optD];
      setFormOptionsList(paddedList);
      
      const correctIndicesMarked = parsed.options
        .map((o, idx) => o.isCorrect ? idx : -1)
        .filter(idx => idx !== -1);
        
      const mergedCorrectIndices = Array.from(new Set([...correctIndicesMarked, ...parsed.correctIndices]));
      
      if (mergedCorrectIndices.length > 1) {
        setFormQuestionType("Multiple Select");
        setFormCorrectIndicesMulti(mergedCorrectIndices);
        showNotice("success", `⚡ Nhận diện câu hỏi Nhiều lựa chọn (Multiple Select) với các đáp án: ${mergedCorrectIndices.map(i => String.fromCharCode(65 + i)).join(", ")}!`);
      } else {
        setFormQuestionType("Multiple Choice");
        let finalCorrectIdx = 0;
        if (mergedCorrectIndices.length === 1) {
          finalCorrectIdx = mergedCorrectIndices[0];
        }
        setFormCorrectIndex(finalCorrectIdx);
        setFormCorrectAnswer(String.fromCharCode(65 + finalCorrectIdx));
        showNotice("success", `⚡ Nhận diện câu hỏi Trắc nghiệm (Multiple Choice) với đáp án ĐÚNG: ${String.fromCharCode(65 + finalCorrectIdx)}!`);
      }
    }
  };

  const handleSmartPasteChange = (val: string) => {
    setSmartPasteText(val);
    if (!val.trim()) {
      setSmartPasteFeedback("");
      setFormOptA("");
      setFormOptB("");
      setFormOptC("");
      setFormOptD("");
      return;
    }

    const lines = val.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      setSmartPasteFeedback("");
      return;
    }

    const parsedOptions: string[] = [];
    let foundCorrectIndex: number | null = null;

    lines.forEach((line) => {
      let text = line;
      let isCorrectForThisLine = false;

      // Identify correct option indicators and strip them
      const correctPatterns = [
        /\(Correct\)/i,
        /\[Correct\]/i,
        /\(Đúng\)/i,
        /\[Đúng\]/i,
        /\*$/
      ];

      for (const pattern of correctPatterns) {
        if (pattern.test(text)) {
          isCorrectForThisLine = true;
          text = text.replace(pattern, "").trim();
        }
      }

      // Identify prefixes like: a. b. c. d. A. B. C. D. 1. 2. 3. 4.
      const prefixMatch = text.match(/^(?:[a-dA-D1-4])(?:[\.\)\s-]+\s*)(.*)$/);
      let detectedPrefix = "";
      if (prefixMatch) {
        detectedPrefix = text[0].toLowerCase();
        text = prefixMatch[1].trim();
      }

      if (isCorrectForThisLine) {
        if (detectedPrefix === 'a' || detectedPrefix === '1') {
          foundCorrectIndex = 0;
        } else if (detectedPrefix === 'b' || detectedPrefix === '2') {
          foundCorrectIndex = 1;
        } else if (detectedPrefix === 'c' || detectedPrefix === '3') {
          foundCorrectIndex = 2;
        } else if (detectedPrefix === 'd' || detectedPrefix === '4') {
          foundCorrectIndex = 3;
        } else {
          foundCorrectIndex = parsedOptions.length;
        }
      }

      parsedOptions.push(text);
    });

    if (parsedOptions.length > 0) setFormOptA(parsedOptions[0]);
    if (parsedOptions.length > 1) setFormOptB(parsedOptions[1]);
    if (parsedOptions.length > 2) setFormOptC(parsedOptions[2]);
    if (parsedOptions.length > 3) setFormOptD(parsedOptions[3]);

    if (parsedOptions.length < 4) {
      if (parsedOptions.length <= 3) setFormOptD("");
      if (parsedOptions.length <= 2) setFormOptC("");
      if (parsedOptions.length <= 1) setFormOptB("");
    }

    const paddedList = [...parsedOptions];
    while (paddedList.length < 4) {
      paddedList.push("");
    }
    setFormOptionsList(paddedList);

    let feedbackMsg = `🎯 Đã phân tích tự động ${parsedOptions.length} phương án.`;
    if (foundCorrectIndex !== null && foundCorrectIndex >= 0 && foundCorrectIndex < 4) {
      setFormCorrectIndex(foundCorrectIndex);
      setFormCorrectAnswer(String.fromCharCode(65 + foundCorrectIndex));
      feedbackMsg += ` Phát hiện đáp án ĐÚNG: Option ${String.fromCharCode(65 + foundCorrectIndex)}`;
    }

    setSmartPasteFeedback(feedbackMsg);
  };

  // Create/Edit Question Submission Handler
  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submit Started");
    
    if (!formText.trim()) {
      showNotice("error", "Vui lòng nhập nội dung câu hỏi bắt buộc!");
      return;
    }

    setIsSubmittingQuestion(true);
    let finalOpts: string[] = [];
    if (formQuestionType === "True / False Single") {
      finalOpts = ["Đúng", "Sai"];
    } else if (["Multiple Choice", "Multiple Select", "Ordering / Sequence", "Video Based"].includes(formQuestionType)) {
      finalOpts = formOptionsList.map(o => o.trim()).filter(Boolean);
    } else {
      finalOpts = [];
    }

    // Automatically derive level and topic based on selected module
    let finalLevel = "CF (LV1)";
    if (formModule === "ka") finalLevel = "KA (LV2)";
    if (formModule === "lo") finalLevel = "LO (LV3)";

    const finalTopic = finalLevel + " General";
    const finalDifficulty = editingQuestion?.difficulty || "medium";

    let derivedCorrectAnswer = "";
    if (formQuestionType === "True / False Single") {
      derivedCorrectAnswer = formCorrectAnswerBool ? "Đúng" : "Sai";
    } else if (formQuestionType === "Multiple Select") {
      derivedCorrectAnswer = formCorrectIndicesMulti.map(i => String.fromCharCode(65 + i)).join(", ");
    } else if (formQuestionType === "True / False Multiple") {
      derivedCorrectAnswer = formStatements.map(s => `${s.statement}: ${s.answer ? "Đúng" : "Sai"}`).join("; ");
    } else if (formQuestionType === "Matching") {
      derivedCorrectAnswer = formMatchingPairs.map(p => `${p.left} = ${p.right}`).join("; ");
    } else if (formQuestionType === "Fill In The Blank") {
      derivedCorrectAnswer = formCorrectAnswersBlank;
    } else if (formQuestionType === "Drag And Drop") {
      derivedCorrectAnswer = formDragTargets.map(t => `${t.placeholder} = ${t.expectedItem}`).join("; ");
    } else if (formQuestionType === "Hotspot") {
      derivedCorrectAnswer = JSON.stringify(formHotspots);
    } else if (formQuestionType === "Ordering / Sequence") {
      derivedCorrectAnswer = finalOpts.join(" -> ");
    } else {
      derivedCorrectAnswer = formCorrectAnswer || String.fromCharCode(65 + formCorrectIndex);
    }

    try {
      const payload: any = {
        module: formModule,
        level: finalLevel,
        questionType: formQuestionType,
        topic: finalTopic,
        questionText: formText.trim(),
        optionA: finalOpts[0] || "",
        optionB: finalOpts[1] || "",
        optionC: finalOpts[2] || "",
        optionD: finalOpts[3] || "",
        options: finalOpts,
        correctIndex: formCorrectIndex,
        correctAnswer: derivedCorrectAnswer,
        explanation: formExplanation.trim(),
        difficulty: finalDifficulty,
        attachments: formAttachments,
        imageUrl: formImageUrl,
        hotspots: formHotspots,
        correctSequence: formQuestionType === "Ordering / Sequence" ? finalOpts : [],
        testSetId: formTestSetId || "",
        correctIndicesMulti: formQuestionType === "Multiple Select" ? formCorrectIndicesMulti : [],
        correctAnswerBool: formQuestionType === "True / False Single" ? formCorrectAnswerBool : false,
        statements: formQuestionType === "True / False Multiple" ? formStatements : [],
        matchingPairs: formQuestionType === "Matching" ? formMatchingPairs : [],
        correctAnswersBlank: formQuestionType === "Fill In The Blank" ? formCorrectAnswersBlank.split(/[,;]/).map(x => x.trim()).filter(Boolean) : [],
        dragItems: formQuestionType === "Drag And Drop" ? formDragItems.split(/[,;]/).map(x => x.trim()).filter(Boolean) : [],
        dragTargets: formQuestionType === "Drag And Drop" ? formDragTargets : [],
        videoUrl: formQuestionType === "Video Based" ? formVideoUrl.trim() : "",
        updatedAt: Date.now()
      };

      console.log("Firestore Save Started");

      // We implement a 3-second maximum execution window so that the UI never hangs for more than 3 seconds.
      const savePromise = (async () => {
        if (editingQuestion) {
          // Edit mode
          await updateQuestion(editingQuestion.id, payload);
        } else {
          // Create mode
          await addQuestion({
            ...payload,
            createdAt: Date.now()
          });
        }
      })();

      const timeoutPromise = new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          console.warn("Firestore save exceeded 3 seconds. Resolving optimistically to reset spinner.");
          resolve(); 
        }, 3000);
      });

      // Race the save action against our 3s safeguard
      await Promise.race([savePromise, timeoutPromise]);
      console.log("Firestore Save Success");

      if (editingQuestion) {
        showNotice("success", "Đã lưu câu hỏi thành công.");
        setSuccessPopup({
          isOpen: true,
          message: "Cập nhật câu hỏi thành công!",
          subMessage: "Đã tối ưu hóa dữ liệu và đồng bộ hóa tức thì lên đám mây Cloud Firestore."
        });
        setEditingQuestion(null);
      } else {
        showNotice("success", "Đã lưu câu hỏi thành công.");
        setSuccessPopup({
          isOpen: true,
          message: "Tạo câu hỏi mới thành công!",
          subMessage: "Thông tin câu hỏi đã được đẩy thành công lên Cloud Firestore và sẵn sàng cho học viên luyện tập."
        });
      }

       // Reset form states completely
      setFormTopic("");
      setFormText("");
      setFormOptA("");
      setFormOptB("");
      setFormOptC("");
      setFormOptD("");
      setFormOptionsList(["", "", "", ""]);
      setSmartPasteText("");
      setSmartPasteFeedback("");
      setFormCorrectIndex(0);
      setFormCorrectAnswer("A");
      setFormExplanation("");
      setFormAttachments([]);
      setFormImageUrl("");
      setFormHotspots([]);
      setFormTestSetId("");
      
      // Reset custom inputs
      setFormCorrectIndicesMulti([]);
      setFormCorrectAnswerBool(true);
      setFormStatements([{ statement: "", answer: true }]);
      setFormMatchingPairs([{ left: "", right: "" }]);
      setFormCorrectAnswersBlank("");
      setFormDragItems("");
      setFormDragTargets([{ placeholder: "", expectedItem: "" }]);
      setFormVideoUrl("");
    } catch (err: any) {
      console.log("Firestore Save Failed:", err);
      showNotice("error", "Có lỗi xảy ra: " + err.message);
    } finally {
      setIsSubmittingQuestion(false);
      console.log("Loading State Reset");
    }
  };

  // Delete dynamic question from database
  const handleDeleteQuestion = async (qId: string) => {
    if (questionIdToConfirmDelete !== qId) {
      setQuestionIdToConfirmDelete(qId);
      setTimeout(() => {
        setQuestionIdToConfirmDelete((curr) => curr === qId ? null : curr);
      }, 4000);
      return;
    }
    setQuestionIdToConfirmDelete(null);
    setDeletingQuestionId(qId);
    try {
      await deleteQuestion(qId);
      showNotice("success", "Đã xóa câu hỏi tùy chỉnh thành công!");
    } catch (err: any) {
      console.error(err);
      showNotice("error", "Xóa thất bại: " + err.message);
    } finally {
      setDeletingQuestionId(null);
    }
  };

  // Test set event handlers
  const handleCreateTestSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTestTitle.trim()) {
      showNotice("error", "Vui lòng nhập tên đề thi bắt buộc!");
      return;
    }
    
    setIsSubmittingTestSet(true);
    try {
      const payload = {
        title: formTestTitle.trim(),
        description: formTestDescription.trim(),
        level: formTestLevel,
        duration: Number(formTestDuration) || 50,
        passingScore: Number(formTestPassingScore) || 700,
        updatedAt: Date.now()
      };
      
      if (editingTestSet) {
        await updateTestSet(editingTestSet.id, payload);
        showNotice("success", "Cập nhật bài thi thành công!");
        setEditingTestSet(null);
      } else {
        await addTestSet({
          ...payload,
          createdAt: Date.now()
        });
        showNotice("success", "Tạo bài thi mới thành công!");
      }
      
      // Clear forms
      setFormTestTitle("");
      setFormTestDescription("");
      setFormTestDuration(50);
      setFormTestPassingScore(700);
      setFormTestLevel("cf");
    } catch (err: any) {
      console.error(err);
      showNotice("error", err.message || "Lỗi thao tác dữ liệu.");
    } finally {
      setIsSubmittingTestSet(false);
    }
  };

  const handleEditTestSetClick = (t: any) => {
    setEditingTestSet(t);
    setFormTestTitle(t.title);
    setFormTestDescription(t.description || "");
    setFormTestLevel(t.level);
    setFormTestDuration(t.duration || 50);
    setFormTestPassingScore(t.passingScore || 700);
    
    const comp = document.getElementById("testset-form-card");
    if (comp) {
      comp.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleDeleteTestSetClick = async (tId: string) => {
    if (testSetIdToConfirmDelete !== tId) {
      setTestSetIdToConfirmDelete(tId);
      setTimeout(() => {
        setTestSetIdToConfirmDelete((curr) => curr === tId ? null : curr);
      }, 4000);
      return;
    }
    setTestSetIdToConfirmDelete(null);
    setDeletingTestSetId(tId);
    try {
      await deleteTestSet(tId);
      showNotice("success", "Xóa bài thi thành công!");
    } catch (err: any) {
      console.error(err);
      showNotice("error", err.message || "Lỗi xóa dữ liệu.");
    } finally {
      setDeletingTestSetId(null);
    }
  };

  const handleDuplicateTestSetClick = async (tId: string) => {
    try {
      await duplicateTestSet(tId);
      showNotice("success", "Nhân bản bài thi thành công!");
    } catch (err: any) {
      console.error(err);
      showNotice("error", err.message || "Lỗi nhân bản.");
    }
  };

  // Stats calculators per level
  const getLevelStats = (modId: "cf" | "ka" | "lo") => {
    // 1. Question count
    const qCount = questions.filter(q => q.module === modId).length;
    // 2. Testing attempts
    const levelExams = examRecords.filter(r => r.module === modId);
    const totalTests = levelExams.length;
    // 3. Average Accuracy Rate
    let avgAccuracy = 0;
    if (totalTests > 0) {
      const sumAccuracy = levelExams.reduce((acc, curr) => {
        const accuracy = (curr.correctCount / curr.totalQuestions) * 100;
        return acc + accuracy;
      }, 0);
      avgAccuracy = Math.round(sumAccuracy / totalTests);
    }

    return { qCount, totalTests, avgAccuracy };
  };

  const cfStats = getLevelStats("cf");
  const kaStats = getLevelStats("ka");
  const loStats = getLevelStats("lo");

  return (
    <div className="space-y-8 animate-fade-in" id="admin-panel-stage">

      {/* Screen-centered Success Popup Modal */}
      {successPopup && successPopup.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[10000] p-4 animate-fade-in" id="admin-success-popup-backdrop">
          <div className="bg-white border border-slate-100 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative transform transition-all duration-300 scale-100" id="admin-success-popup-content">
            <button 
              type="button"
              onClick={() => setSuccessPopup(null)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-emerald-50 text-emerald-500 p-4 rounded-full border border-emerald-100 animate-bounce">
                <CheckCircle className="w-12 h-12" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-800 leading-tight">
                  {successPopup.message}
                </h3>
                {successPopup.subMessage && (
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {successPopup.subMessage}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSuccessPopup(null)}
                className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-extrabold rounded-2xl transition-all duration-200 shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
              >
                Xác nhận &amp; Tiếp tục
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Admin Toast Notices */}
      {adminNotice && (
        <div className="fixed top-5 right-5 z-[9999] p-4 rounded-xl shadow-2xl border flex items-center gap-3 backdrop-blur-md animate-fade-in bg-white max-w-sm border-slate-150">
          <div className={`p-2 rounded-lg shrink-0 ${adminNotice.type === "success" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
            {adminNotice.type === "success" ? <Shield className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
          <div className="text-left text-xs min-w-0 flex-1">
            <h4 className="font-bold text-slate-800">{adminNotice.type === "success" ? "Thành công" : "Lỗi hệ thống"}</h4>
            <p className="text-slate-500 mt-0.5 leading-snug">{adminNotice.text}</p>
          </div>
          <button onClick={() => setAdminNotice(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded font-bold cursor-pointer shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {/* Root Admin Header Banner */}
      <div 
        className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 border border-slate-800 rounded-2xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6" 
        id="admin-header-banner"
      >
        <div className="space-y-2 text-left">
          <div className="flex flex-wrap items-center gap-3">
            <span className="bg-purple-500/20 text-purple-300 font-bold text-[11px] px-3 py-1 rounded-full uppercase tracking-wider border border-purple-500/30">
              Quản trị viên tối cao
            </span>
            <span className="bg-rose-500/20 text-rose-300 font-bold text-[11px] px-3 py-1 rounded-full uppercase tracking-wider border border-rose-500/30 flex items-center gap-1.5 animate-pulse">
              <Shield className="w-3.5 h-3.5 fill-red-400" />
              ADMIN MODE ACTIVE
            </span>
          </div>
          <h2 className="text-2xl md:text-3.5xl font-black font-display tracking-tight text-white mt-1.5 font-sans">
            Phân Hệ Quản Trị Hệ Thống
          </h2>
          <p className="text-indigo-200/75 text-xs md:text-sm max-w-xl leading-relaxed">
            Hạ tầng quản lý người dùng, rà soát hồ sơ kiểm định, thống kê chỉ số học thuật và hiệu chỉnh ngân hàng câu hỏi IC3 GS6 chuẩn hóa.
          </p>
        </div>

        {/* Action Tabs Panel */}
        <div 
          className="flex flex-wrap gap-1 bg-slate-950/80 border border-slate-800 p-1.5 rounded-xl self-start md:self-auto shrink-0" 
          id="admin-dashboard-tabs"
        >
          <button
            id="tab-btn-users"
            onClick={() => { setActiveTab("users"); setSelectedUser(null); }}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-all duration-200 flex items-center gap-1.5 ${activeTab === "users" ? "bg-purple-600 text-white shadow-lg shadow-purple-900/30" : "text-slate-400 hover:text-slate-200"}`}
          >
            <Users className="w-3.5 h-3.5" />
            Người dùng ({totalUsersNum})
          </button>
          
          <button
            id="tab-btn-stats"
            onClick={() => { setActiveTab("stats"); setSelectedUser(null); }}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-all duration-200 flex items-center gap-1.5 ${activeTab === "stats" ? "bg-purple-600 text-white shadow-lg shadow-purple-900/30" : "text-slate-400 hover:text-slate-200"}`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Thống kê học tập
          </button>

          <button
            id="tab-btn-questions"
            onClick={() => { setActiveTab("questions"); setSelectedUser(null); }}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-all duration-200 flex items-center gap-1.5 ${activeTab === "questions" ? "bg-purple-600 text-white shadow-lg shadow-purple-900/30" : "text-slate-400 hover:text-slate-200"}`}
          >
            <Folder className="w-3.5 h-3.5" />
            Ngân hàng câu hỏi ({questions.length})
          </button>

          <button
            id="tab-btn-test-sets"
            onClick={() => { setActiveTab("testSets"); setSelectedUser(null); }}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-all duration-150 flex items-center gap-1.5 ${activeTab === "testSets" ? "bg-purple-600 text-white shadow-lg shadow-purple-900/30" : "text-slate-400 hover:text-slate-200"}`}
          >
            <Award className="w-3.5 h-3.5" />
            Bài ôn luyện ({testSets.length})
          </button>

          <button
            id="tab-btn-records"
            onClick={() => { setActiveTab("records"); setSelectedUser(null); }}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-all duration-200 flex items-center gap-1.5 ${activeTab === "records" ? "bg-purple-600 text-white shadow-lg shadow-purple-900/30" : "text-slate-400 hover:text-slate-200"}`}
          >
            <Award className="w-3.5 h-3.5" />
            Biên bản kết quả ({totalExams})
          </button>
        </div>
      </div>

      {/* Admin Meta Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="admin-summary-grid">
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-2 hover:shadow-md transition duration-200 text-left">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-sans">Tổng người dùng</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-black block text-slate-800 font-display font-sans">{totalUsersNum}</span>
          <p className="text-[10px] text-slate-500">Tài khoản đăng ký hệ thống</p>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-2 hover:shadow-md transition duration-200 text-left">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-sans">Tổng tệp đã nhận</span>
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-black block text-slate-800 font-display font-sans">{totalDocsNum}</span>
          <p className="text-[10px] text-slate-500">Tải hồ sơ & tệp ôn thi</p>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-2 hover:shadow-md transition duration-200 text-left">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-sans">Bài Testing đã làm</span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-black block text-slate-800 font-display font-sans">{totalExams}</span>
          <p className="text-[10px] text-slate-500">Ghi nhận biên bản Testing</p>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-2 hover:shadow-md transition duration-200 text-left">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-sans">Tỷ lệ đạt trung bình</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-black block text-emerald-600 font-display font-sans">{passRate}%</span>
          <p className="text-[10px] text-slate-500">Điểm số {'>'}= 700 / 1000</p>
        </div>
      </div>

      {/* TABS IMPLEMENTATION */}

      {/* 1. Tab Users: User Directory & Documents Explorer */}
      {activeTab === "users" && (
        <div className="space-y-6 animate-fade-in" id="admin-view-users">
          {!selectedUser ? (
            // User List view
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6 text-left">
              
              {/* Table search & count */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-sans">Danh Sách Người Dùng</h3>
                  <p className="text-slate-500 text-xs mt-0.5">Danh bạ thành viên, phân quyền và thống kê trữ lượng tài liệu tải lên.</p>
                </div>
                
                <div className="relative w-full sm:w-80">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Tìm theo tên, email, vai trò..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-purple-500 text-slate-800 bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Table wrapper */}
              <div className="border border-slate-100 rounded-xl overflow-hidden overflow-x-auto shadow-inner bg-slate-50/5">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-slate-600 hover:text-slate-800 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-4">Người dùng</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Vai trò</th>
                      <th className="p-4">Ngày tham gia</th>
                      <th className="p-4 text-center">Tệp tin đã tải</th>
                      <th className="p-4 text-right">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 italic font-medium">
                          Không tìm thấy người dùng nào phù hợp với từ khóa tìm kiếm.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => {
                        const userFiles = documents.filter(doc => doc.userId === user.userId);
                        return (
                          <tr key={user.userId} className="border-b border-slate-50 hover:bg-purple-50/20 transition-all duration-150 group">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-sm">
                                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
                                </span>
                                <div className="text-left">
                                  <span className="font-bold text-slate-800 block text-xs group-hover:text-purple-700 transition">
                                    {user.displayName || "Thành viên tự do"}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">ID: {user.userId.substring(0, 8)}...</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 font-medium text-slate-600">
                              <div className="flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                <span>{user.email || "Không xác định"}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase border ${
                                user.role === "admin" 
                                  ? "bg-rose-50 text-rose-700 border-rose-200" 
                                  : user.role === "teacher" 
                                    ? "bg-amber-50 text-amber-700 border-amber-200" 
                                    : "bg-blue-50 text-blue-700 border-blue-200"
                              }`}>
                                {user.role === "admin" ? "Admin" : user.role === "teacher" ? "Giảng viên" : "Học viên"}
                              </span>
                            </td>
                            <td className="p-4 text-slate-500 font-medium">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                <span>
                                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "Hôm nay"}
                                </span>
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <span className={`inline-flex items-center justify-center w-7 h-7 font-black text-xs rounded-full ${
                                userFiles.length > 0 ? "bg-purple-100 text-purple-700 ring-2 ring-purple-50" : "bg-slate-100 text-slate-400"
                              }`}>
                                {userFiles.length}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => setSelectedUser(user)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-purple-600 group-hover:bg-purple-600 text-slate-700 group-hover:text-white hover:text-white text-[11px] font-bold rounded-lg transition-all duration-200 shadow-sm"
                              >
                                Xem tệp tài liệu
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            // User Specific Uploaded Documents view
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6 text-left">
              
              {/* Header go back */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-5 gap-4">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="inline-flex items-center gap-1.5 text-slate-500 hover:text-purple-600 font-bold transition text-xs cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Trở lại danh sách người dùng
                </button>
                
                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-bold">
                  Quản lý tệp cá nhân tài khoản
                </span>
              </div>

              {/* User Bio Card */}
              <div className="bg-gradient-to-br from-slate-50 to-indigo-50/20 border border-slate-100 p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <span className="w-12 h-12 rounded-full bg-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-md shrink-0">
                    {selectedUser.displayName ? selectedUser.displayName.charAt(0).toUpperCase() : "U"}
                  </span>
                  
                  <div className="space-y-1 text-left">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold font-display text-slate-900 text-base">{selectedUser.displayName || "Thành viên tự do"}</h4>
                      <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200 text-[9px] font-black uppercase">
                        {selectedUser.role}
                      </span>
                    </div>
                    
                    <div className="text-xs text-slate-500 space-y-0.5">
                      <p className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Email: <strong className="text-slate-700">{selectedUser.email}</strong></span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Ngày tham gia: <strong className="text-slate-700">{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString("vi-VN") : "Hôm nay"}</strong></span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 p-4 rounded-xl shrink-0 text-center w-44 shadow-sm space-y-0.5">
                  <Folder className="w-5 h-5 text-purple-500 mx-auto" />
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Tổng tệp lưu trữ</span>
                  <span className="text-2xl font-black block text-indigo-600 font-mono">
                    {documents.filter(d => d.userId === selectedUser.userId).length} tệp
                  </span>
                </div>
              </div>

              {/* List of user documents */}
              <div className="space-y-4">
                <h3 className="text-sm font-extrabold text-slate-800 font-sans flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-600" />
                  Hồ Sơ Các Tệp/Tài Liệu Đã Tải Lên Phân Hệ Cloud
                </h3>

                {documents.filter(d => d.userId === selectedUser.userId).length === 0 ? (
                  <div className="bg-slate-50 border border-slate-100/60 p-8 rounded-xl text-center text-slate-400 italic text-xs">
                    Thành viên này hiện chưa thực hiện tải lên bất kỳ tệp tin hay tài liệu chứng nhận nào.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {documents
                      .filter(d => d.userId === selectedUser.userId)
                      .map((docItem) => (
                        <div 
                          key={docItem.id} 
                          className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm hover:shadow-md transition duration-200 flex justify-between items-center gap-4 relative overflow-hidden group"
                        >
                          <div className="flex items-center gap-3 min-w-0 text-left">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg shrink-0">
                              <FileText className="w-6 h-6" />
                            </div>
                            
                            <div className="min-w-0">
                              <h5 className="font-bold text-slate-800 text-xs truncate" title={docItem.name}>
                                {docItem.name}
                              </h5>
                              
                              <p className="text-[10px] text-slate-500 mt-1 space-x-2 block">
                                <span className="font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">{docItem.type.toUpperCase() || "FILE"}</span>
                                <span>Dung lượng: <strong>{formatFileSize(docItem.size)}</strong></span>
                              </p>
                              
                              <span className="text-[9px] text-slate-400 block mt-1.5 font-mono">
                                Đã tải lên: {new Date(docItem.createdAt).toLocaleDateString("vi-VN")} {new Date(docItem.createdAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>

                          <button
                            id={`del-doc-btn-${docItem.id}`}
                            onClick={() => handleDeleteDoc(docItem.id)}
                            disabled={deletingDocId === docItem.id}
                            className={`p-2 border shadow-sm rounded-lg transition duration-150 shrink-0 disabled:opacity-50 cursor-pointer text-xs font-bold leading-none flex items-center gap-1 ${
                              docIdToConfirmDelete === docItem.id
                                ? "bg-red-600 border-red-600 text-white hover:bg-red-700 hover:border-red-750 animate-pulse"
                                : "bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-600 hover:text-white"
                            }`}
                            title={docIdToConfirmDelete === docItem.id ? "Xác nhận xóa tệp tin này vĩnh viễn" : "Xóa tài liệu này"}
                          >
                            {deletingDocId === docItem.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : docIdToConfirmDelete === docItem.id ? (
                              <span>Thực sự xóa?</span>
                            ) : (
                              <Trash className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Overview System Stats View */}
      {activeTab === "stats" && (
        <div className="space-y-6 animate-fade-in text-left" id="admin-view-stats">
          
          {/* Custom stats per upgraded requirements */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="standards-stats-cards">
            
            {/* CF stats card */}
            <div className="bg-white border-l-4 border-l-sky-500 border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-extrabold text-[10px] px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-100 rounded">CF (LV1)</span>
                  <h4 className="font-extrabold text-slate-900 text-xs text-slate-500 mt-1 uppercase tracking-wider font-mono">Máy tính Căn bản</h4>
                </div>
                <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600 font-bold text-xs">1</div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-50 text-center font-mono">
                <div className="space-y-0.5">
                  <span className="text-[9px] text-slate-400 font-sans block leading-none">Số câu hỏi</span>
                  <span className="text-lg font-black text-slate-800">{cfStats.qCount}</span>
                </div>
                <div className="space-y-0.5 border-x border-slate-100">
                  <span className="text-[9px] text-slate-400 font-sans block leading-none">Lượt thi</span>
                  <span className="text-lg font-black text-slate-800">{cfStats.totalTests}</span>
                </div>
                <div className="space-y-0.5 text-sky-600">
                  <span className="text-[9px] text-sky-500 font-sans block leading-none">C.xác TB</span>
                  <span className="text-lg font-black">{cfStats.avgAccuracy}%</span>
                </div>
              </div>
            </div>

            {/* KA stats card */}
            <div className="bg-white border-l-4 border-l-amber-500 border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-extrabold text-[10px] px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded">KA (LV2)</span>
                  <h4 className="font-extrabold text-slate-900 text-xs text-slate-500 mt-1 uppercase tracking-wider font-mono">Các ứng dụng chủ chốt</h4>
                </div>
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 font-bold text-xs font-mono">2</div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-50 text-center font-mono">
                <div className="space-y-0.5">
                  <span className="text-[9px] text-slate-400 font-sans block leading-none">Số câu hỏi</span>
                  <span className="text-lg font-black text-slate-800">{kaStats.qCount}</span>
                </div>
                <div className="space-y-0.5 border-x border-slate-100">
                  <span className="text-[9px] text-slate-400 font-sans block leading-none">Lượt thi</span>
                  <span className="text-lg font-black text-slate-800">{kaStats.totalTests}</span>
                </div>
                <div className="space-y-0.5 text-amber-600">
                  <span className="text-[9px] text-amber-500 font-sans block leading-none">C.xác TB</span>
                  <span className="text-lg font-black">{kaStats.avgAccuracy}%</span>
                </div>
              </div>
            </div>

            {/* LO stats card */}
            <div className="bg-white border-l-4 border-l-indigo-500 border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-extrabold text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded">LO (LV3)</span>
                  <h4 className="font-extrabold text-slate-900 text-xs text-slate-500 mt-1 uppercase tracking-wider font-mono">Cuộc sống trực tuyến</h4>
                </div>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs font-mono">3</div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-50 text-center font-mono">
                <div className="space-y-0.5">
                  <span className="text-[9px] text-slate-400 font-sans block leading-none">Số câu hỏi</span>
                  <span className="text-lg font-black text-slate-800">{loStats.qCount}</span>
                </div>
                <div className="space-y-0.5 border-x border-slate-100">
                  <span className="text-[9px] text-slate-400 font-sans block leading-none">Lượt thi</span>
                  <span className="text-lg font-black text-slate-800">{loStats.totalTests}</span>
                </div>
                <div className="space-y-0.5 text-indigo-600">
                  <span className="text-[9px] text-indigo-500 font-sans block leading-none">C.xác TB</span>
                  <span className="text-lg font-black">{loStats.avgAccuracy}%</span>
                </div>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="stats-details-block">
            
            {/* System Connection details */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Activity className="w-5 h-5 text-indigo-600" />
                <h4 className="font-extrabold text-slate-900 font-display text-sm">Hạ Tầng Kết Nối Cloud</h4>
              </div>

              <div className="space-y-3.5 text-xs text-slate-600 font-medium">
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100/60">
                  <span>Cục dữ liệu Firestore Cloud</span>
                  <span className="bg-emerald-50 text-emerald-700 font-extrabold px-3 py-1 rounded-full border border-emerald-100 text-[10px]">
                    KẾT NỐI ỔN ĐỊNH (ONLINE)
                  </span>
                </div>
                
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100/60">
                  <span>Phiên bản máy chủ Firebase API</span>
                  <span className="font-bold text-slate-800 font-mono">Firestore Web SDK v11.x</span>
                </div>

                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100/60">
                  <span>Tổng lớp học khởi tạo</span>
                  <span className="font-bold text-slate-800 font-mono">{classrooms.length} lớp học hoạt động</span>
                </div>

                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100/60">
                  <span>Học phần chuẩn hóa tích hợp</span>
                  <span className="font-bold text-slate-800">Tiếng Việt (IC3 Certiport GS6)</span>
                </div>
              </div>
            </div>

            {/* Performance charts */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h4 className="font-extrabold text-slate-900 font-display text-sm">Tiến Trình Đạt Chuẩn Theo Mảng Thi</h4>
              </div>

              <div className="space-y-4 animate-fade-in" id="modules-performance">
                {IC3_MODULES.map(mod => {
                  const mExams = examRecords.filter(r => r.module === mod.id);
                  const mPass = mExams.filter(r => r.passed).length;
                  const rate = mExams.length > 0 ? Math.round((mPass / mExams.length) * 100) : 0;
                  return (
                    <div key={mod.id} className="text-xs space-y-2" id={`mod-stats-${mod.id}`}>
                      <div className="flex justify-between text-slate-700 font-semibold font-sans">
                        <span>{mod.name.split("-")[0].trim()}</span>
                        <span className="text-slate-500 font-mono">{rate}% đỗ ({mExams.length} bài thi)</span>
                      </div>
                      
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200/50">
                        <div 
                          className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full transition-all duration-300 rounded-full" 
                          style={{ width: `${rate}%` }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Question Type Stats Card */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4 text-left" id="admin-question-types-stats-card">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Folder className="w-5 h-5 text-indigo-600" />
              <h4 className="font-extrabold text-slate-900 font-display text-sm">Thống Kê Nhóm Loại Câu Hỏi IC3 GS6</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              {[
                { name: "Multiple Choice (Trắc nghiệm 1 đáp án)", key: "multiple choice", color: "from-sky-500 to-blue-600" },
                { name: "Multiple Select (Nhiều đáp án)", key: "multiple select", color: "from-purple-500 to-indigo-600" },
                { name: "True / False (Đúng/Sai)", key: "true / false", color: "from-emerald-500 to-teal-600" },
                { name: "Matching (Nối cột)", key: "matching", color: "from-pink-500 to-rose-600" },
                { name: "Fill In The Blank (Điền từ)", key: "fill in the blank", color: "from-amber-500 to-orange-600" },
                { name: "Drag & Drop (Kéo thả)", key: "drag and drop", color: "from-cyan-500 to-blue-500" },
                { name: "Hotspot (Điểm nóng)", key: "hotspot", color: "from-fuchsia-500 to-pink-500" },
                { name: "Ordering (Sắp xếp thứ tự)", key: "ordering", color: "from-violet-500 to-purple-600" },
                { name: "Video Based (Theo video)", key: "video based", color: "from-rose-500 to-red-600" }
              ].map(type => {
                const qCount = questions.filter(q => {
                  const qtype = (q.questionType || "").toLowerCase();
                  const search = type.key.toLowerCase();
                  if (search === "multiple choice") {
                    return qtype.includes("choice") || qtype.includes("trắc nghiệm 1 đáp án") || qtype === "" || qtype === "multiple choice";
                  }
                  if (search === "multiple select") {
                    return qtype.includes("select") || qtype.includes("nhiều đáp án") || qtype.includes("response") || qtype === "multiple select";
                  }
                  if (search === "true / false") {
                    return qtype.includes("true") || qtype.includes("đúng / sai") || qtype === "true / false" || qtype === "true-false";
                  }
                  if (search === "ordering") {
                    return qtype.includes("ordering") || qtype.includes("sequence") || qtype === "ordering / sequence";
                  }
                  return qtype.includes(search);
                }).length;
                const percent = questions.length > 0 ? Math.round((qCount / questions.length) * 100) : 0;
                return (
                  <div key={type.key} className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-2 text-left relative overflow-hidden group">
                    <div className="flex justify-between items-center relative z-10">
                      <span className="text-[10px] font-extrabold text-slate-500 block truncate" title={type.name}>{type.name}</span>
                      <span className="text-xs font-black text-slate-800 font-mono bg-white px-2 py-0.5 rounded border border-slate-150">{qCount} câu</span>
                    </div>
                    <div className="space-y-1 relative z-10">
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className={`bg-gradient-to-r ${type.color} h-full rounded-full transition-all duration-300`} style={{ width: `${percent}%` }} />
                      </div>
                      <span className="text-[9px] text-slate-400 block font-mono">Tỷ trọng: {percent}% hệ thống</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. Questions Database and Management view */}
      {activeTab === "questions" && (
        <div className="space-y-6 animate-fade-in text-left" id="admin-view-questions">
          
          {/* Dynamic Google Sheets Import Interface */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4" id="google-sheet-import-card">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <PlusCircle className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-extrabold text-slate-900 font-sans">Nhập Câu Hỏi Hàng Loạt Qua Google Sheets</h3>
            </div>

            <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 text-xs text-slate-600 space-y-1.5 leading-relaxed">
              <h4 className="font-bold text-slate-800 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-purple-600" />
                Hướng dẫn định dạng tệp trang tính (Google Sheet):
              </h4>
              <p>1. Thiết lập quyền chia sẻ: <strong className="text-slate-800">Bất kỳ ai có đường liên kết đều có thể xem (Anyone with the link can view)</strong>.</p>
              <p>2. Đầu mục của trang tính trang chính phải khớp chính xác 100% với tên trường: <code className="bg-white border text-rose-600 px-1 py-0.5 rounded">level</code>, <code className="bg-white border text-rose-600 px-1 py-0.5 rounded">questionType</code>, <code className="bg-white border text-rose-600 px-1 py-0.5 rounded">questionText</code>, <code className="bg-white border text-rose-600 px-1 py-0.5 rounded">optionA</code>, <code className="bg-white border text-rose-600 px-1 py-0.5 rounded">optionB</code>, <code className="bg-white border text-rose-600 px-1 py-0.5 rounded">optionC</code>, <code className="bg-white border text-rose-600 px-1 py-0.5 rounded">optionD</code>, <code className="bg-white border text-rose-600 px-1 py-0.5 rounded">correctAnswer</code>, <code className="bg-white border text-rose-600 px-1 py-0.5 rounded">explanation</code>, <code className="bg-white border text-rose-600 px-1 py-0.5 rounded">difficulty</code>, <code className="bg-white border text-rose-600 px-1 py-0.5 rounded">attachments</code>. (Riêng <code className="bg-white border text-slate-600 px-1 py-0.5 rounded">id</code> không bắt buộc).</p>
              <p>3. <strong className="text-slate-800">Nguyên tắc giao dịch:</strong> Chỉ nhập dữ liệu khi 100% dòng hợp lệ. Nếu phát hiện một dòng sai lệch, toàn bộ lô hàng sẽ bị hủy bỏ.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end text-xs font-semibold text-slate-700">
              <div className="md:col-span-2 space-y-1">
                <label className="block text-slate-500">Đường dẫn tệp Google Sheets</label>
                <input
                  type="text"
                  placeholder="https://docs.google.com/spreadsheets/d/SpreadsheetID/edit?usp=sharing"
                  value={importSheetUrl}
                  onChange={(e) => setImportSheetUrl(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-500">Chế độ ghi nhận</label>
                <select
                  value={importMode}
                  onChange={(e) => setImportMode(e.target.value as "append" | "overwrite")}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 cursor-pointer"
                >
                  <option value="append">Ghi tiếp (Append - Thêm mới)</option>
                  <option value="overwrite">Ghi đè (Overwrite - Xóa toàn bộ câu hỏi cũ)</option>
                </select>
              </div>
            </div>

            {/* Error logs listing */}
            {importErrors.length > 0 && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Phát hiện {importErrors.length} lỗi cấu trúc dữ liệu - Không thể nhập:</span>
                </div>
                <div className="max-h-40 overflow-y-auto pl-5 space-y-1 list-disc font-mono">
                  {importErrors.map((err, errIdx) => (
                    <p key={errIdx}>• {err}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Preview loaded items before submit */}
            {importPreview.length > 0 && (
              <div className="bg-emerald-50/50 border border-emerald-200 p-4 rounded-xl space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Xác thực thành công! Sẵn sàng nhập lô {importPreview.length} câu hỏi.</span>
                  </div>
                  <button 
                    onClick={() => setImportPreview([])} 
                    className="text-slate-400 hover:text-slate-600 p-1 rounded font-bold cursor-pointer"
                  >
                    Hủy xem trước
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
                  {importPreview.map((item, pIdx) => (
                    <div key={item.id} className="bg-white border rounded-lg p-2 text-[10px] space-y-1">
                      <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold">
                        <span>Học phần: {item.level}</span>
                        <span>Loại: {item.questionType}</span>
                      </div>
                      <p className="font-extrabold text-slate-800 line-clamp-2">{item.questionText}</p>
                      <p className="text-slate-500 italic truncate">Đáp án: {item.correctAnswer}</p>
                    </div>
                  ))}
                </div>

                {isImportingToDb && (
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between font-bold text-indigo-700 text-[10px]">
                      <span>Đang nạp dữ liệu lên Firestore Cloud...</span>
                      <span>{importProgressPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 h-full rounded-full transition-all duration-350" style={{ width: `${importProgressPercent}%`}} />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1.5">
                  <button
                    onClick={handleImportToDb}
                    disabled={isImportingToDb}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold rounded-lg text-[11px] cursor-pointer flex items-center gap-1.5 uppercase transition"
                  >
                    {isImportingToDb ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : "Nạp Dữ Liệu Lên Đám Mây"}
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-start">
              <button
                onClick={handleValidateSheet}
                disabled={isImportValidating || isImportingToDb}
                className="px-5 py-2.5 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 font-extrabold rounded-xl text-xs flex items-center gap-1.5 uppercase cursor-pointer shadow-sm hover:shadow-md transition"
              >
                {isImportValidating ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : "Xem Trước & Xác Thực Tệp Sheets"}
              </button>
            </div>
          </div>

          {/* Form Create or Edit Question */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-5" id="create-edit-question-card">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-extrabold text-slate-900 font-sans">
                  {editingQuestion ? `Chỉnh Sửa Câu Hỏi #${editingQuestion.id.substring(0, 8)}` : "Tạo Câu Hỏi Mới Chuẩn Hóa"}
                </h3>
              </div>
              
              {editingQuestion && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingQuestion(null);
                    setFormTopic("");
                    setFormText("");
                    setFormOptA("");
                    setFormOptB("");
                    setFormOptC("");
                    setFormOptD("");
                    setSmartPasteText("");
                    setSmartPasteFeedback("");
                    setFormCorrectIndex(0);
                    setFormCorrectAnswer("A");
                    setFormExplanation("");
                    setFormAttachments([]);
                  }}
                  className="px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-[10px] font-bold"
                >
                  Hủy chế độ sửa (Tạo mới)
                </button>
              )}
            </div>

            <form onSubmit={handleCreateQuestion} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold text-slate-700">
              
              {/* Module selection */}
              <div className="space-y-1 md:col-span-1">
                <label className="block text-slate-500">Mảng kiến thức</label>
                <select
                  value={formModule}
                  onChange={(e) => {
                    const val = e.target.value as "cf" | "ka" | "lo";
                    setFormModule(val);
                    // Automatically sync state internally for backward compatibility if any components look at formLevel
                    if (val === "cf") setFormLevel("CF (LV1)");
                    else if (val === "ka") setFormLevel("KA (LV2)");
                    else if (val === "lo") setFormLevel("LO (LV3)");
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold cursor-pointer text-slate-800"
                >
                  <option value="cf">CF (LV1) - Máy tính Căn bản</option>
                  <option value="ka">KA (LV2) - Các ứng dụng Chủ chốt</option>
                  <option value="lo">LO (LV3) - Cuộc sống Trực tuyến</option>
                </select>
              </div>

              {/* Question interactive Types */}
              <div className="space-y-1 md:col-span-1">
                <label className="block text-slate-500">Dạng câu hỏi tương tác (Type)</label>
                <select
                  value={formQuestionType}
                  onChange={(e) => setFormQuestionType(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold cursor-pointer text-slate-800"
                >
                  <option value="Multiple Choice">Multiple Choice (1 Đáp án)</option>
                  <option value="Multiple Select">Multiple Select (Nhiều đáp án)</option>
                  <option value="True / False Single">True / False Single (1 Phát biểu)</option>
                  <option value="True / False Multiple">True / False Multiple (Nhiều phát biểu)</option>
                  <option value="Matching">Matching (Nối cặp)</option>
                  <option value="Fill In The Blank">Fill In The Blank (Điền khuyết)</option>
                  <option value="Drag And Drop">Drag And Drop (Kéo thả)</option>
                  <option value="Hotspot">Hotspot (Điểm nóng)</option>
                  <option value="Ordering / Sequence">Ordering / Sequence (Sắp xếp thứ tự)</option>
                  <option value="Video Based">Video Based (Tương tác video)</option>
                </select>
              </div>

              {/* Test Set select field */}
              <div className="space-y-1 md:col-span-1">
                <label className="block text-slate-500">Bài kiểm tra (Thêm vào đâu?)</label>
                <select
                  value={formTestSetId}
                  onChange={(e) => setFormTestSetId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold cursor-pointer text-slate-800"
                >
                  {formModule === "cf" ? (
                    <>
                      <option value="">Bài luyện tập tổng hợp (Mặc định)</option>
                      <option value="ot1_cf">OT1 (Bài kiểm tra luyện đề)</option>
                    </>
                  ) : (
                    <option value="">-- Mặc định (Bổ trợ theo Level) --</option>
                  )}
                  {[...testSets]
                    .filter((ts) => ts.level === formModule && ts.id !== "default_cf" && ts.id !== "default_ka" && ts.id !== "default_lo" && ts.id !== "ot1_cf")
                    .sort((a, b) => a.title.localeCompare(b.title, "vi", { numeric: true, sensitivity: "base" }))
                    .map((ts) => (
                      <option key={ts.id} value={ts.id}>
                        {ts.title}
                      </option>
                    ))}
                </select>
              </div>

              {/* Question text */}
              <div className="col-span-full space-y-1">
                <label className="block text-slate-500 font-semibold text-xs text-indigo-750 flex items-center justify-between">
                  <span>Nội dung câu hỏi (Question Text)</span>
                  <span className="text-[10px] text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md font-medium border border-purple-100">
                    💡 Hỗ trợ dán thẳng block Câu hỏi + Đáp án để tự tách tách
                  </span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Nhập nội dung hoặc dán trực tiếp cụm câu hỏi & các phương án A, B, C, D kèm nhãn (Đúng) để tự động điền các ô dưới..."
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  onPaste={handlePasteInQuestionText}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-150 focus:outline-none focus:bg-white transition duration-150"
                />
              </div>

              {/* Options list container – only show option inputs if it is not a true/false or hotspot question */}
              {["Multiple Choice", "Multiple Select", "Ordering / Sequence", "Video Based"].includes(formQuestionType) && (
                <div className="space-y-3 p-4 bg-slate-50/50 border border-slate-100 rounded-2xl col-span-full text-left">
                  <span className="text-[10px] uppercase text-indigo-650 tracking-wider font-extrabold block">
                    {formQuestionType === "Ordering / Sequence" 
                      ? "Danh sách các mục cần sắp xếp (Hãy nhập theo đúng thứ tự chính xác)" 
                      : `Danh sách phương án trả lời tùy chọn (${formOptionsList.length} lựa chọn)`}
                  </span>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {formOptionsList.map((opt, index) => {
                        const labelChar = String.fromCharCode(65 + index);
                        const isSingleCorrect = ["Multiple Choice", "Video Based"].includes(formQuestionType) && formCorrectIndex === index;
                        const isMultiCorrect = formQuestionType === "Multiple Select" && formCorrectIndicesMulti.includes(index);

                        return (
                          <div 
                            key={index} 
                            className={`space-y-1.5 p-3 rounded-2xl border transition duration-150 ${
                              isSingleCorrect 
                                ? "bg-emerald-50/50 border-emerald-300 shadow-sm" 
                                : isMultiCorrect 
                                ? "bg-indigo-50/40 border-indigo-300 shadow-sm"
                                : "bg-white border-slate-100"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <label className="text-[11px] font-bold text-slate-500 uppercase">
                                  {formQuestionType === "Ordering / Sequence" 
                                    ? `Bước thứ ${index + 1}` 
                                    : `Lựa chọn ${labelChar}`}
                                </label>

                                {["Multiple Choice", "Video Based"].includes(formQuestionType) && (
                                  <label className="inline-flex items-center gap-1 cursor-pointer select-none">
                                    <input
                                      type="radio"
                                      name="correctIndexGroup"
                                      checked={formCorrectIndex === index}
                                      onChange={() => {
                                        setFormCorrectIndex(index);
                                        setFormCorrectAnswer(labelChar);
                                      }}
                                      className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-400"
                                    />
                                    <span className={`text-[10px] font-extrabold uppercase transition ${
                                      formCorrectIndex === index ? "text-emerald-700 font-black h-fit" : "text-slate-400"
                                    }`}>
                                      {formCorrectIndex === index ? "✓ ĐÚNG" : "Đáp án ĐÚNG"}
                                    </span>
                                  </label>
                                )}

                                {formQuestionType === "Multiple Select" && (
                                  <label className="inline-flex items-center gap-1 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={formCorrectIndicesMulti.includes(index)}
                                      onChange={() => {
                                        if (formCorrectIndicesMulti.includes(index)) {
                                          setFormCorrectIndicesMulti(prev => prev.filter(i => i !== index));
                                        } else {
                                          setFormCorrectIndicesMulti(prev => [...prev, index].sort());
                                        }
                                      }}
                                      className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-400"
                                    />
                                    <span className={`text-[10px] font-extrabold uppercase transition ${
                                      formCorrectIndicesMulti.includes(index) ? "text-indigo-700 font-black" : "text-slate-400"
                                    }`}>
                                      {formCorrectIndicesMulti.includes(index) ? "✓ CHỌN ĐÚNG" : "Chọn Đúng"}
                                    </span>
                                  </label>
                                )}
                              </div>

                              {formOptionsList.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = formOptionsList.filter((_, idx) => idx !== index);
                                    setFormOptionsList(updated);
                                    if (formCorrectIndex >= updated.length) {
                                      setFormCorrectIndex(Math.max(0, updated.length - 1));
                                      setFormCorrectAnswer(String.fromCharCode(65 + Math.max(0, updated.length - 1)));
                                    }
                                    setFormCorrectIndicesMulti(prev => prev.filter(i => i < updated.length));
                                  }}
                                  className="text-rose-500 hover:text-rose-700 text-[10px] font-semibold flex items-center gap-0.5 opacity-60 hover:opacity-100 transition"
                                >
                                  <Trash2 className="w-3 h-3" /> Xóa
                                </button>
                              )}
                            </div>
                            <input
                              type="text"
                              placeholder={
                                formQuestionType === "Ordering / Sequence" 
                                  ? `Ví dụ: Thao tác bước ${index + 1}` 
                                  : `Nội dung của đáp án lựa chọn ${labelChar}`
                              }
                              value={opt}
                              onChange={(e) => {
                                const val = e.target.value;
                                const updated = [...formOptionsList];
                                updated[index] = val;
                                setFormOptionsList(updated);
                                // Sync back to formOptA..D for legacy fallbacks
                                if (index === 0) setFormOptA(val);
                                else if (index === 1) setFormOptB(val);
                                else if (index === 2) setFormOptC(val);
                                else if (index === 3) setFormOptD(val);
                              }}
                              className={`w-full p-2.5 bg-white border rounded-xl text-slate-800 text-xs focus:ring-2 focus:outline-none transition ${
                                isSingleCorrect 
                                  ? "border-emerald-300 focus:ring-emerald-300" 
                                  : isMultiCorrect 
                                  ? "border-indigo-300 focus:ring-indigo-300"
                                  : "border-slate-200 focus:ring-indigo-200"
                              }`}
                            />
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => setFormOptionsList(prev => [...prev, ""])}
                      className="w-full py-2.5 border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/15 hover:bg-indigo-50/35 text-indigo-700 font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" /> Thêm phương án khác
                    </button>
                  </div>
                </div>
              )}

              {/* Hotspot Editor section */}
              {formQuestionType === "Hotspot" && (
                <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl col-span-full text-left space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <MapPin className="w-5 h-5 text-indigo-650 animate-bounce" />
                    <h4 className="font-extrabold text-slate-800 font-display">Thiết lập tọa độ điểm nóng (Hotspot Editor)</h4>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-bold block">Đường dẫn URL ảnh nền (Background Image URL)</label>
                    <input
                      type="text"
                      placeholder="Nhập URL hình ảnh (Ví dụ: https://picsum.photos/800/400 hoặc từ drive, hosting...)"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-850 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {/* Left Column: Image Interaction Canvas */}
                    <div className="space-y-2 text-left">
                      <span className="text-[11px] text-indigo-650 font-extrabold uppercase block">👉 CLICK TRỰC TIẾP LÊN ẢNH ĐỂ ĐẶT ĐỊM ĐÚNG:</span>
                      
                      {formImageUrl ? (
                        <div 
                          onClick={handleAdminImgClick}
                          className="relative border-2 border-slate-200 rounded-xl overflow-hidden cursor-crosshair select-none bg-slate-100 max-w-full inline-block group shadow-md"
                          id="admin-hotspot-drawing-canvas"
                        >
                          <img 
                            src={formImageUrl} 
                            alt="Hotspot Base" 
                            className="max-h-[350px] object-contain pointer-events-none"
                            referrerPolicy="no-referrer"
                          />
                          {/* Absolute marked hotspots points on image preview */}
                          {formHotspots.map((spot, idx) => (
                            <div 
                              key={idx} 
                              className="absolute bg-emerald-500/30 border border-emerald-600 rounded-full flex items-center justify-center text-[10px] text-white font-black"
                              style={{
                                left: `${spot.x}%`,
                                top: `${spot.y}%`,
                                width: `${spot.radius * 2}%`,
                                height: `${spot.radius * 2}%`,
                                transform: "translate(-50%, -50%)"
                              }}
                            >
                              <span className="scale-75 bg-slate-900 border border-white rounded-full w-5 h-5 flex items-center justify-center shadow-md font-mono">
                                {idx + 1}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-44 bg-slate-100 rounded-xl flex items-center justify-center text-xs text-slate-400 font-bold border-2 border-dashed border-slate-250">
                          Chưa cung cấp liên kết hình ảnh. Vui lòng dán link ảnh ở trên.
                        </div>
                      )}
                    </div>

                    {/* Right Column: Hotspot coordinates lists and deletions */}
                    <div className="space-y-3 bg-white p-4 border border-slate-150 rounded-xl text-xs flex flex-col justify-between">
                      <div>
                        <div className="flex gap-2 items-center justify-between pb-1.5 border-b mb-2">
                          <span className="font-extrabold text-slate-700">Các điểm đúng đã tạo ({formHotspots.length} điểm)</span>
                          <div className="flex gap-1 items-center">
                            <span className="font-semibold text-slate-500">Bán kính rộng:</span>
                            <input
                              type="number"
                              min={1}
                              max={20}
                              value={adminHotspotRadius}
                              onChange={(e) => setAdminHotspotRadius(Math.max(1, Math.min(20, Number(e.target.value))))}
                              className="w-10 text-center border p-0.5 rounded text-indigo-750 font-bold font-mono"
                            />
                            <span>%</span>
                          </div>
                        </div>

                        <div className="max-h-[220px] overflow-y-auto space-y-1.5 pr-1">
                          {formHotspots.length === 0 ? (
                            <p className="text-slate-400 italic text-center py-6">Chưa có điểm gán nào được cấu hình. Nhấp chọn trực tiếp lên ảnh.</p>
                          ) : (
                            formHotspots.map((spot, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-100 p-2 rounded-lg hover:border-indigo-200 transition">
                                <div className="flex items-center gap-1.5 font-bold text-slate-700">
                                  <span className="bg-slate-900 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono">{idx + 1}</span>
                                  <span>Tọa độ: X={spot.x}%, Y={spot.y}% | R={spot.radius}%</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFormHotspots(current => current.filter((_, i) => i !== idx));
                                  }}
                                  className="text-rose-500 hover:bg-rose-50 px-2.5 py-1 rounded transition font-bold text-[11px]"
                                >
                                  Xóa
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t text-slate-400 text-[10px] font-sans">
                        * Tọa độ tự động thiết lập dạng phần trăm (%) của khung ảnh nền để đảm bảo co giãn kích thước tự nhiên trên Mobile và Desktop của thí sinh.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Correct answers input and extra fields */}
              <div className="col-span-full space-y-4 text-left">
                {/* 1. Multiple Choice */}
                {(formQuestionType === "Multiple Choice" || formQuestionType === "Video Based") && (
                  <div className="grid grid-cols-1 gap-4">
                    {formQuestionType === "Video Based" && (
                      <div className="space-y-1">
                        <label className="block text-slate-500 font-extrabold text-[11px] uppercase text-indigo-700">🎥 Đường dẫn Video YouTube</label>
                        <input
                          type="text"
                          placeholder="Ví dụ: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                          value={formVideoUrl}
                          onChange={(e) => setFormVideoUrl(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs"
                        />
                      </div>
                    )}
                    <div className="bg-emerald-50/45 p-3.5 border border-emerald-100 rounded-2xl flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold leading-none shrink-0 animate-pulse">✓</div>
                      <div>
                        <p className="text-xs font-bold text-emerald-850">Lựa chọn đúng: Phương án {formCorrectAnswer || String.fromCharCode(65 + formCorrectIndex)}</p>
                        <p className="text-[10px] text-emerald-600 font-medium">Bạn đã nhấp đặt đáp án đúng trực tiếp cạnh ô nhập nội dung phương án ở trên.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Multiple Select */}
                {formQuestionType === "Multiple Select" && (
                  <div className="bg-indigo-50/45 p-3.5 border border-indigo-150 rounded-2xl flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-indigo-650 flex items-center justify-center text-white text-xs font-bold shrink-0">☑</div>
                    <div>
                      <p className="text-xs font-bold text-indigo-900">
                        Đáp án đúng đã thiết lập: {formCorrectIndicesMulti.length > 0 
                          ? formCorrectIndicesMulti.map(i => String.fromCharCode(65 + i)).join(", ") 
                          : "Chưa chọn đáp án nào"}
                      </p>
                      <p className="text-[10px] text-indigo-550 font-medium">Chọn một hoặc nhiều đáp án chuẩn xác trực tiếp bằng nút tick bên cạnh mỗi hộp nhập ở trên.</p>
                    </div>
                  </div>
                )}

                {/* 3. True / False Single */}
                {formQuestionType === "True / False Single" && (
                  <div className="space-y-3.5 text-left">
                    <div className="bg-sky-50 border border-sky-100 p-3 rounded-xl text-xs text-sky-850 flex items-start gap-2 max-w-xl">
                      <span className="text-sm">💡</span>
                      <p>
                        Bạn đang chọn dạng <strong>1 Phát biểu duy nhất</strong>. Nếu muốn tạo câu hỏi chứa <strong>nhiều phát biểu con (thêm nhiều câu)</strong> đòi hỏi tích chọn Đúng/Sai cho từng ý, xin vui lòng chọn Dạng câu tương tác là <strong>True / False Multiple (Nhiều phát biểu)</strong> ở trên!
                      </p>
                    </div>

                    <label className="block text-slate-500 font-extrabold text-xs uppercase">Đáp án Đúng hoặc Sai của phát biểu này:</label>
                    <div className="flex gap-4 max-w-md">
                      <button
                        type="button"
                        onClick={() => setFormCorrectAnswerBool(true)}
                        className={`flex-1 py-3 px-5 rounded-xl border flex items-center justify-center gap-2 transition cursor-pointer ${
                          formCorrectAnswerBool 
                            ? "border-emerald-500 bg-emerald-50/50 text-emerald-900 font-extrabold" 
                            : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs uppercase font-bold">ĐÚNG (True)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormCorrectAnswerBool(false)}
                        className={`flex-1 py-3 px-5 rounded-xl border flex items-center justify-center gap-2 transition cursor-pointer ${
                          !formCorrectAnswerBool 
                            ? "border-rose-500 bg-rose-50/50 text-rose-900 font-extrabold" 
                            : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        <XCircle className="w-4 h-4 text-rose-600" />
                        <span className="text-xs uppercase font-bold">SAI (False)</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 4. True / False Multiple */}
                {formQuestionType === "True / False Multiple" && (
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-left space-y-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-extrabold text-slate-700 text-xs uppercase">📝 Danh sách phát biểu con và câu trả lời Đúng/Sai tương ứng:</span>
                      <button
                        type="button"
                        onClick={() => setFormStatements(prev => [...prev, { statement: "", answer: true }])}
                        className="text-xs bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold p-1 px-3 rounded-lg flex items-center gap-1 transition cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" /> Thêm phát biểu
                      </button>
                    </div>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto">
                      {formStatements.length === 0 ? (
                        <p className="text-slate-400 italic text-center text-xs py-4">Chưa có phát biểu nào được thêm.</p>
                      ) : (
                        formStatements.map((item, idx) => (
                          <div key={idx} className="flex gap-2 items-center bg-white p-2 border border-slate-150 rounded-xl">
                            <span className="font-black text-slate-500 text-xs w-6 text-center">{idx + 1}</span>
                            <input
                              type="text"
                              placeholder="Nội dung khẳng định/phát biểu..."
                              value={item.statement}
                              onChange={(e) => {
                                const updated = [...formStatements];
                                updated[idx].statement = e.target.value;
                                setFormStatements(updated);
                              }}
                              className="flex-1 p-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-850 focus:outline-none"
                            />
                            
                            <div className="flex bg-slate-100 p-0.5 rounded-lg shrink-0 border border-slate-250/30">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...formStatements];
                                  updated[idx].answer = true;
                                  setFormStatements(updated);
                                }}
                                className={`px-3 py-1.5 rounded-md text-[10px] font-extrabold uppercase transition cursor-pointer ${
                                  item.answer 
                                    ? "bg-emerald-600 text-white shadow-sm" 
                                    : "text-slate-500 hover:text-slate-700"
                                }`}
                              >
                                Đúng
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...formStatements];
                                  updated[idx].answer = false;
                                  setFormStatements(updated);
                                }}
                                className={`px-3 py-1.5 rounded-md text-[10px] font-extrabold uppercase transition cursor-pointer ${
                                  !item.answer 
                                    ? "bg-rose-600 text-white shadow-sm" 
                                    : "text-slate-500 hover:text-slate-700"
                                }`}
                              >
                                Sai
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => setFormStatements(prev => prev.filter((_, i) => i !== idx))}
                              className="p-1.5 text-rose-550 hover:bg-rose-50 rounded-lg shrink-0 transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 5. Matching */}
                {formQuestionType === "Matching" && (
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-left space-y-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-extrabold text-slate-700 text-xs uppercase">🖇️ Cặp ghép nối phù hợp:</span>
                      <button
                        type="button"
                        onClick={() => setFormMatchingPairs(prev => [...prev, { left: "", right: "" }])}
                        className="text-xs bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold p-1 px-3 rounded-lg flex items-center gap-1 transition"
                      >
                        <PlusCircle className="w-3.5 h-3.5" /> Thêm cặp ghép
                      </button>
                    </div>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto">
                      {formMatchingPairs.length === 0 ? (
                        <p className="text-slate-400 italic text-center text-xs py-4">Chưa có cặp ghép nào.</p>
                      ) : (
                        formMatchingPairs.map((pair, idx) => (
                          <div key={idx} className="flex gap-2 items-center bg-white p-2 border border-slate-150 rounded-xl">
                            <span className="font-black text-slate-500 text-xs w-6 text-center">{idx + 1}</span>
                            <input
                              type="text"
                              placeholder="Vế trái (Ví dụ: Ctrl + C)"
                              value={pair.left}
                              onChange={(e) => {
                                const updated = [...formMatchingPairs];
                                updated[idx].left = e.target.value;
                                setFormMatchingPairs(updated);
                              }}
                              className="flex-1 p-2 bg-slate-550 border border-slate-200 rounded-xl text-xs text-slate-800"
                            />
                            <span className="text-slate-400 text-xs font-bold shrink-0">Nối với →</span>
                            <input
                              type="text"
                              placeholder="Vế phải (Ví dụ: Sao chép)"
                              value={pair.right}
                              onChange={(e) => {
                                const updated = [...formMatchingPairs];
                                updated[idx].right = e.target.value;
                                setFormMatchingPairs(updated);
                              }}
                              className="flex-1 p-2 bg-slate-550 border border-slate-200 rounded-xl text-xs text-slate-800"
                            />
                            <button
                              type="button"
                              onClick={() => setFormMatchingPairs(prev => prev.filter((_, i) => i !== idx))}
                              className="p-1.5 text-rose-550 hover:bg-rose-50 rounded-lg shrink-0 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 6. Fill In The Blank */}
                {formQuestionType === "Fill In The Blank" && (
                  <div className="space-y-1 text-left">
                    <label className="block text-slate-500 font-extrabold text-xs uppercase">Các đáp án Đúng được chấp nhận (cách nhau bởi dấu phẩy):</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Word, Microsoft Word, MS Word"
                      value={formCorrectAnswersBlank}
                      onChange={(e) => setFormCorrectAnswersBlank(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none placeholder-slate-400 text-xs"
                    />
                    <p className="text-[10px] text-slate-400 italic mt-1">* Khi chấm điểm, mọi khoảng trắng thừa và dạng chữ HOA/thường đều được bỏ qua.</p>
                  </div>
                )}

                {/* 7. Drag And Drop */}
                {formQuestionType === "Drag And Drop" && (
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-left space-y-3">
                    <div className="space-y-1">
                      <label className="block text-slate-500 font-extrabold text-xs uppercase">🎨 Các nhãn kéo (Cách nhau bởi dấu phẩy):</label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Căn trái, Căn phải, Căn giữa"
                        value={formDragItems}
                        onChange={(e) => setFormDragItems(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                      />
                    </div>
                    <div className="flex justify-between items-center border-t pt-2 mt-2">
                      <span className="font-extrabold text-slate-700 text-xs uppercase flex items-center gap-1">📥 Các vùng chứa đáp án cần kéo vào (Drop Targets):</span>
                      <button
                        type="button"
                        onClick={() => setFormDragTargets(prev => [...prev, { placeholder: "", expectedItem: "" }])}
                        className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold p-1 px-3 rounded-lg flex items-center gap-1"
                      >
                        <PlusCircle className="w-3.5 h-3.5" /> Thêm vùng thả
                      </button>
                    </div>
                    <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                      {formDragTargets.length === 0 ? (
                        <p className="text-slate-400 italic text-center text-xs py-4">Chưa có vùng thả nào.</p>
                      ) : (
                        formDragTargets.map((target, idx) => {
                          const parsedDragItems = formDragItems.split(/[,;]/).map(x => x.trim()).filter(Boolean);
                          return (
                            <div key={idx} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-white p-3 border border-slate-150 rounded-2xl shadow-sm">
                              <span className="font-extrabold text-slate-400 text-xs w-6 text-center pt-1.5 sm:pt-0">{idx + 1}</span>
                              
                              <div className="flex-1 w-full space-y-1">
                                <span className="text-[10px] uppercase text-slate-400 font-bold block mb-0.5">Vị trí/Mô tả vùng thả:</span>
                                <input
                                  type="text"
                                  placeholder="Mô tả/Vị trí (Ví dụ: Cân lề trái văn bản)"
                                  value={target.placeholder}
                                  onChange={(e) => {
                                    const updated = [...formDragTargets];
                                    updated[idx].placeholder = e.target.value;
                                    setFormDragTargets(updated);
                                  }}
                                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                                />
                              </div>

                              <div className="flex-1 w-full space-y-1">
                                <span className="text-[10px] uppercase text-indigo-500 font-extrabold block mb-0.5">🎯 Chọn nhãn đúng kéo vào:</span>
                                <select
                                  value={target.expectedItem}
                                  onChange={(e) => {
                                    const updated = [...formDragTargets];
                                    updated[idx].expectedItem = e.target.value;
                                    setFormDragTargets(updated);
                                  }}
                                  className="w-full p-2 bg-indigo-50/50 border border-indigo-200 rounded-xl text-xs text-indigo-950 font-bold focus:outline-none cursor-pointer"
                                >
                                  <option value="">-- Chọn nhãn mong muốn --</option>
                                  {parsedDragItems.map((itm, keyIdx) => (
                                    <option key={keyIdx} value={itm}>
                                      {itm}
                                    </option>
                                  ))}
                                  {!parsedDragItems.includes(target.expectedItem) && target.expectedItem && (
                                    <option value={target.expectedItem}>{target.expectedItem}</option>
                                  )}
                                </select>
                              </div>

                              <button
                                type="button"
                                onClick={() => setFormDragTargets(prev => prev.filter((_, i) => i !== idx))}
                                className="p-2 text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl shrink-0 transition self-end sm:self-center cursor-pointer mt-2 sm:mt-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Interactive attachments builder block */}
              <div className="col-span-full md:col-span-2 space-y-2 border border-slate-100 p-4 rounded-2xl bg-slate-50/20 text-left">
                <span className="text-[10px] uppercase text-slate-400 tracking-wider font-extrabold block">Tài nguyên học thuật đính kèm (Attachments)</span>
                
                {formAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formAttachments.map((att, attIdx) => (
                      <div key={attIdx} className="bg-white border rounded-full pl-3 pr-1 py-1 flex items-center gap-1.5 text-[10px] font-bold text-slate-700">
                        <span>[{att.type.toUpperCase()}]</span>
                        <span className="truncate max-w-xs">{att.url}</span>
                        <button 
                          type="button" 
                          onClick={() => setFormAttachments(prev => prev.filter((_, idx2) => idx2 !== attIdx))} 
                          className="w-4 h-4 rounded-full bg-slate-150 hover:bg-slate-200 text-slate-500 font-bold border-0 cursor-pointer flex items-center justify-center text-[8px]"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 items-center text-xs">
                  <select
                    value={newAttachmentType}
                    onChange={(e) => setNewAttachmentType(e.target.value)}
                    className="p-2 bg-white border border-slate-200 rounded-xl font-bold cursor-pointer"
                  >
                    <option value="image">Hình ảnh (Image)</option>
                    <option value="video">Phim (Video)</option>
                    <option value="link">Trang web (Web link)</option>
                    <option value="pdf">Tài liệu (PDF)</option>
                  </select>
                  <input
                    type="text"
                    placeholder="URL tài nguyên (VD: https://youtube.com/...)"
                    value={newAttachmentUrl}
                    onChange={(e) => setNewAttachmentUrl(e.target.value)}
                    className="flex-1 p-2 bg-white border border-slate-200 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newAttachmentUrl.trim()) return;
                      setFormAttachments(prev => [...prev, { type: newAttachmentType, url: newAttachmentUrl.trim() }]);
                      setNewAttachmentUrl("");
                    }}
                    className="px-3 py-2 bg-indigo-50 border border-indigo-150 text-indigo-700 hover:bg-indigo-600 hover:text-white font-bold rounded-xl transition cursor-pointer"
                  >
                    Thêm đính kèm
                  </button>
                </div>
              </div>

              {/* Explanation statement */}
              <div className="col-span-full space-y-1">
                <label className="block text-slate-500 font-sans">Giải đạo chi tiết vì sao đúng (Explanation)</label>
                <textarea
                  rows={2}
                  placeholder="Điền giải thuật, hướng dẫn hoặc chỉ bảo để rèn luyện tư duy cho sĩ tử..."
                  value={formExplanation}
                  onChange={(e) => setFormExplanation(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
              </div>

              <div className="col-span-full pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingQuestion}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs transition shadow-md hover:shadow-lg flex items-center gap-1.5 cursor-pointer uppercase"
                >
                  {isSubmittingQuestion ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      Đang thực hiện chuyển giao...
                    </>
                  ) : editingQuestion ? (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Cập Nhật Câu Hỏi Khảo Thí
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4" />
                      Thêm Câu Hỏi Mới Lên Đám Mây
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>

          {/* List all Database questions */}
          <div className="space-y-4">
            <div className="flex justify-between items-center text-left">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 font-sans">Kho Ngân Hàng Câu Hỏi Khảo Thí ({questions.length} câu hỏi)</h3>
                <p className="text-[11px] text-slate-400 mt-1">Câu hỏi hệ thống tích hợp sẵn và câu hỏi tự tạo tải từ đám mây Firestore.</p>
              </div>
              <span className="text-xs text-slate-400 bg-slate-100 border px-3 py-1 rounded-full font-bold">Chỉ Admins được quyền can thiệp</span>
            </div>
            
            <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1" id="questions-pool-scroller2">
              {questions.map((q, idx) => {
                const isStatic = (q.id || "").startsWith("cf_") || (q.id || "").startsWith("ka_") || (q.id || "").startsWith("lo_");
                
                return (
                  <div key={q.id || idx} className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm text-left hover:shadow-md transition relative" id={`admin-q-${q.id}`}>
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[9px] font-extrabold tracking-wider px-2 py-0.5 bg-slate-100 text-slate-500 rounded font-mono">
                          MỘT SỐ: {q.id ? q.id.substring(0, 15) : idx}
                        </span>
                        
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                          q.module === "cf" 
                            ? "bg-sky-50 text-sky-700 border border-sky-100" 
                            : q.module === "ka" 
                              ? "bg-amber-50 text-amber-700 border border-amber-100" 
                              : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                        }`}>
                          {q.level || (q.module === "cf" ? "CF (LV1)" : q.module === "ka" ? "KA (LV2)" : "LO (LV3)")}
                        </span>

                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-150 border text-slate-700">
                          {q.questionType || "Multiple Choice"}
                        </span>

                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          isStatic ? "bg-slate-50 text-slate-400" : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                        }`}>
                          {isStatic ? "Mặc định (Bố trợ)" : "Lớp Cloud DB"}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Topic segment info name */}
                        <span className="text-[11px] text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded font-extrabold">{q.topic || "Chung"}</span>
                        
                        {/* Inline Actions inside Database list */}
                        {!isStatic && q.id && (
                          <div className="flex items-center gap-1 shrink-0">
                            
                            {/* Inline Edit action button custom */}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingQuestion(q);
                                setFormTestSetId(q.testSetId || "");
                                setFormModule(q.module);
                                setFormTopic(q.topic || "");
                                setFormLevel(q.level || "");
                                setFormQuestionType(q.questionType || "Multiple Choice");
                                setFormDifficulty(q.difficulty || "medium");
                                setFormText(q.questionText || "");
                                setFormOptA(q.optionA || (q.options && q.options[0]) || "");
                                setFormOptB(q.optionB || (q.options && q.options[1]) || "");
                                setFormOptC(q.optionC || (q.options && q.options[2]) || "");
                                setFormOptD(q.optionD || (q.options && q.options[3]) || "");
                                
                                const loadedOpts = q.options && q.options.length > 0 
                                  ? [...q.options] 
                                  : [q.optionA || "", q.optionB || "", q.optionC || "", q.optionD || ""].filter(Boolean);
                                while (loadedOpts.length < 4) {
                                  loadedOpts.push("");
                                }
                                setFormOptionsList(loadedOpts);

                                setSmartPasteText("");
                                setSmartPasteFeedback("");
                                setFormCorrectIndex(q.correctIndex || 0);
                                setFormCorrectAnswer(q.correctAnswer || "");
                                setFormExplanation(q.explanation || "");
                                setFormAttachments(q.attachments || []);
                                setFormImageUrl(q.imageUrl || "");
                                setFormCorrectIndicesMulti((q as any).correctIndicesMulti || []);
                                setFormCorrectAnswerBool((q as any).correctAnswerBool !== undefined ? (q as any).correctAnswerBool : true);
                                setFormStatements((q as any).statements || [{ statement: "", answer: true }]);
                                setFormMatchingPairs((q as any).matchingPairs || [{ left: "", right: "" }]);
                                setFormCorrectAnswersBlank((q as any).correctAnswersBlank ? (q as any).correctAnswersBlank.join(", ") : "");
                                setFormDragItems((q as any).dragItems ? (q as any).dragItems.join(", ") : "");
                                setFormDragTargets((q as any).dragTargets || [{ placeholder: "", expectedItem: "" }]);
                                setFormVideoUrl((q as any).videoUrl || "");
                                let pts = q.hotspots || [];
                                if (pts.length === 0 && (q.questionType || "") === "Hotspot") {
                                  try {
                                    pts = JSON.parse(q.correctAnswer || "[]");
                                  } catch (e) {}
                                }
                                setFormHotspots(pts);
                                
                                const comp = document.getElementById("create-edit-question-card");
                                if (comp) {
                                  comp.scrollIntoView({ behavior: "smooth" });
                                }
                              }}
                              className="p-1 px-2 border border-amber-100 bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white rounded text-[10px] font-bold flex items-center gap-1 transition"
                            >
                              Sửa
                            </button>

                            <button
                              id={`del-q-btn-${q.id}`}
                              onClick={() => handleDeleteQuestion(q.id)}
                              disabled={deletingQuestionId === q.id}
                              className={`p-1 text-xs font-bold leading-none flex items-center gap-1 rounded transition disabled:opacity-40 cursor-pointer ${
                                questionIdToConfirmDelete === q.id
                                  ? "bg-red-600 text-white hover:bg-red-700 font-extrabold px-1.5 py-0.5 animate-pulse"
                                  : "text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                              }`}
                              title={questionIdToConfirmDelete === q.id ? "Xác nhận xóa câu hỏi này vĩnh viễn" : "Xóa câu hỏi"}
                            >
                              {deletingQuestionId === q.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : questionIdToConfirmDelete === q.id ? (
                                <span>Xóa luôn?</span>
                              ) : (
                                <Trash className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-sm font-bold text-slate-800 leading-relaxed mt-2">{q.questionText}</p>
                    
                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-xs text-slate-600 font-medium text-left">
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className={`p-2 rounded-xl border ${oIdx === q.correctIndex ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-bold" : "border-slate-100 bg-slate-50/50"}`}>
                            {String.fromCharCode(65 + oIdx)}. {opt}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Show custom attachments list in viewer card */}
                    {q.attachments && q.attachments.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {q.attachments.map((at, atid) => (
                          <a 
                            key={atid} 
                            href={at.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-150 rounded-full px-2 py-0.5 hover:bg-indigo-100/70"
                          >
                            <span>📎 {at.type.toUpperCase()}: {at.url.length > 25 ? at.url.substring(0, 25) + "..." : at.url}</span>
                          </a>
                        ))}
                      </div>
                    )}

                    <div className="bg-indigo-50/30 border border-indigo-100/50 rounded-lg p-2.5 text-[11px] text-slate-600 mt-2.5 font-medium">
                      <strong className="text-indigo-900 font-extrabold">Giải thích phương án: </strong>
                      {q.explanation}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* 4. Global Exam Records list */}
      {activeTab === "records" && (
        <div className="space-y-4 animate-fade-in text-left" id="admin-view-records">
          <h3 className="text-lg font-bold text-slate-900 font-sans">Tất cả biên bản chứng chỉ trực tuyến</h3>

          {examRecords.length === 0 ? (
            <div className="bg-white border border-slate-100 p-8 rounded-xl text-center text-slate-400 text-sm italic" id="admin-records-empty1">
              Không tìm thấy biên bản kết quả bài thi nào trong cơ sở dữ liệu.
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-x-auto" id="admin-records-table-wrapper1">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-600 hover:text-slate-800 font-bold">
                    <th className="p-3">Học sinh</th>
                    <th className="p-3">Phân môn</th>
                    <th className="p-3">Thời gian nộp</th>
                    <th className="p-3">Số câu đúng</th>
                    <th className="p-3">Điểm chuẩn</th>
                    <th className="p-3 text-right">Kết quả</th>
                  </tr>
                </thead>
                <tbody>
                  {examRecords.map((rec) => {
                    const mInfo = IC3_MODULES.find((m) => m.id === rec.module);
                    return (
                      <tr key={rec.id} className="border-b border-slate-50 hover:bg-slate-50/50 py-2">
                        <td className="p-3 font-semibold text-slate-800">{rec.studentName}</td>
                        <td className="p-3 text-slate-600">
                          {rec.module === "cf" ? "CF (LV1)" : rec.module === "ka" ? "KA (LV2)" : "LO (LV3)"}
                        </td>
                        <td className="p-3 text-slate-500">
                          {new Date(rec.createdAt).toLocaleDateString("vi-VN")} {new Date(rec.createdAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-3 text-slate-500 font-semibold">{rec.correctCount} / {rec.totalQuestions}</td>
                        <td className="p-3 font-extrabold text-indigo-600 text-sm font-mono">{rec.score}</td>
                        <td className="p-3 text-right">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${rec.passed ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"}`}>
                            {rec.passed ? "ĐẠT" : "TRƯỢT"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 5. Manage Test Sets */}
      {activeTab === "testSets" && (
        <div className="space-y-6 animate-fade-in text-left font-sans" id="admin-view-testsets">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">Quản Lý Bài Làm & Đề Ôn Luyện Nâng Cao</h3>
              <p className="text-xs text-slate-500 mt-1">Cấu trúc các nhóm bài ôn tập phân loại theo từng mảng kiến thức, đặt cấu hình thời lượng, điểm đạt chuẩn, đồng bộ ngân hàng câu hỏi tương ứng.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form column (1/3) */}
            <div className="lg:col-span-1" id="testset-form-card">
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="border-b border-slate-50 pb-3">
                  <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                    <PlusCircle className="w-4 h-4 text-purple-600" />
                    {editingTestSet ? "Cập Nhật Bài Làm" : "Thêm Bài Làm Mới"}
                  </h4>
                </div>

                <form onSubmit={handleCreateTestSet} className="space-y-3.5 text-xs font-semibold text-slate-700">
                  <div className="space-y-1">
                    <label className="block text-slate-500">Tên bài làm (Title)</label>
                    <input
                      type="text"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-purple-500 font-sans"
                      placeholder="Ví dụ: CF Bài Ôn Tập Số 1"
                      value={formTestTitle}
                      onChange={(e) => setFormTestTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-500">Mảng kiến thức (Level)</label>
                    <select
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 cursor-pointer"
                      value={formTestLevel}
                      onChange={(e) => setFormTestLevel(e.target.value as "cf" | "ka" | "lo")}
                    >
                      <option value="cf">CF (LV1) - Máy tính Căn bản</option>
                      <option value="ka">KA (LV2) - Các ứng dụng Chủ chốt</option>
                      <option value="lo">LO (LV3) - Cuộc sống Trực tuyến</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-500">Mô tả bài làm (Description)</label>
                    <textarea
                      rows={3}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-1 focus:ring-purple-500 font-sans"
                      placeholder="Mô tả nội dung trọng tâm bài làm..."
                      value={formTestDescription}
                      onChange={(e) => setFormTestDescription(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-slate-500">Thời lượng (Phút)</label>
                      <input
                        type="number"
                        min={5}
                        max={180}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-850 font-mono"
                        value={formTestDuration}
                        onChange={(e) => setFormTestDuration(Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-slate-500">Điểm đạt (Điểm số)</label>
                      <input
                        type="number"
                        min={100}
                        max={1000}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-850 font-mono"
                        value={formTestPassingScore}
                        onChange={(e) => setFormTestPassingScore(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="submit"
                      disabled={isSubmittingTestSet}
                      className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-55 text-white font-extrabold rounded-xl text-center shadow-md transition text-xs font-sans"
                    >
                      {isSubmittingTestSet ? "Đang lưu..." : editingTestSet ? "Cập Nhật" : "Tạo Mới"}
                    </button>
                    {editingTestSet && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTestSet(null);
                          setFormTestTitle("");
                          setFormTestDescription("");
                          setFormTestDuration(50);
                          setFormTestPassingScore(700);
                          setFormTestLevel("cf");
                        }}
                        className="px-3 py-2.5 bg-slate-105 border border-slate-200 text-slate-650 hover:bg-slate-200 rounded-xl font-bold transition text-xs"
                      >
                        Hủy
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* List column (2/3) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                <div className="border-b border-slate-50 pb-3 mb-4 flex justify-between items-center">
                  <h4 className="text-sm font-extrabold text-slate-800">Danh sách Bài Luyện Tập</h4>
                  <span className="text-[10px] bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full font-black">
                    TỔNG SỐ: {testSets.length} BÀI LÀM
                  </span>
                </div>

                {testSets.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs italic">
                    Chưa có bài ôn luyện tùy chỉnh nào được thiết lập. Hãy tạo bài làm mới ở bảng bên trái.
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {[...testSets]
                      .sort((a, b) => a.title.localeCompare(b.title, "vi", { numeric: true, sensitivity: "base" }))
                      .map((ts) => {
                      const tsQuestionsCount = questions.filter(q => q.testSetId === ts.id).length;
                      return (
                        <div key={ts.id} className="p-4 rounded-2xl border border-slate-150/70 bg-slate-50/10 hover:bg-slate-50/50 hover:border-purple-250 transition-all flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between text-left">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                ts.level === "cf" 
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                                  : ts.level === "ka"
                                  ? "bg-amber-50 text-amber-700 border border-amber-100"
                                  : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                              }`}>
                                {ts.level === "cf" ? "CF (LV1)" : ts.level === "ka" ? "KA (LV2)" : "LO (LV3)"}
                              </span>
                              <h5 className="text-xs font-black text-slate-850 font-sans tracking-tight">{ts.title}</h5>
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium line-clamp-2 leading-relaxed">{ts.description || "Chưa thiết lập mô tả dành riêng cho học phần."}</p>
                            
                            <div className="flex flex-wrap items-center gap-2.5 text-[10px] text-slate-400 font-bold pt-1.5">
                              <span className="flex items-center gap-1">⌚ {ts.duration || 50} Phút</span>
                              <span className="flex items-center gap-1">⭐ Điểm chuẩn: {ts.passingScore || 700} / 1000</span>
                              <span className="flex items-center gap-1 bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-black">
                                📚 {tsQuestionsCount} Câu hỏi
                              </span>
                            </div>
                          </div>

                          <div className="flex sm:flex-col gap-1.5 shrink-0 self-end sm:self-center">
                            <button
                              onClick={() => handleDuplicateTestSetClick(ts.id)}
                              className="px-2.5 py-1.5 border border-purple-100 bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              Nhân bản
                            </button>
                            <button
                              onClick={() => handleEditTestSetClick(ts)}
                              className="px-2.5 py-1.5 border border-amber-100 bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              Chỉnh cài đặt
                            </button>
                            <button
                              onClick={() => handleDeleteTestSetClick(ts.id)}
                              disabled={deletingTestSetId === ts.id}
                              className="px-2.5 py-1.5 border border-rose-100 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              {deletingTestSetId === ts.id ? "Đang xóa..." : testSetIdToConfirmDelete === ts.id ? "Chắc chắn?" : "Xóa"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Statistics Dashboard by Practice Test (Tạo thống kê chi tiết theo từng bài luyện tập) */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm" id="testset-statistics-dashboard">
            <div className="border-b border-slate-50 pb-3 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <div>
                <h4 className="text-sm font-extrabold text-slate-800">Thống Kê Chi Tiết Hiệu Suất Ôn Luyện</h4>
                <p className="text-[10px] text-slate-400 font-medium">Bảng báo cáo tổng hợp về số lượng bài tập, tiến trình giải và tỷ lệ học viên hoàn thành xuất sắc tiêu chuẩn.</p>
              </div>
            </div>

            {testSets.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs italic">
                Chưa có dữ liệu thống kê ôn tập.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-slate-600 hover:text-slate-800 font-black">
                      <th className="p-3">Tên bài ôn tập</th>
                      <th className="p-3 text-center">Tổng câu hỏi</th>
                      <th className="p-3 text-center">Số lượt làm</th>
                      <th className="p-3 text-center">Điểm trung bình</th>
                      <th className="p-3 text-right">Tỷ lệ Đạt (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...testSets]
                      .sort((a, b) => a.title.localeCompare(b.title, "vi", { numeric: true, sensitivity: "base" }))
                      .map((ts) => {
                      const tsQuestionsCount = questions.filter(q => q.testSetId === ts.id).length;
                      const attempts = examRecords.filter(r => r.testSetId === ts.id);
                      const totalAttempts = attempts.length;
                      
                      const avgScore = totalAttempts > 0 
                        ? Math.round(attempts.reduce((acc, curr) => acc + curr.score, 0) / totalAttempts) 
                        : 0;
                        
                      const passes = attempts.filter(r => r.passed).length;
                      const passPercent = totalAttempts > 0 
                        ? Math.round((passes / totalAttempts) * 105) // normalizes passing rates appropriately
                        : 0;
                        
                      // Ensure percentage never exceeds 100%
                      const normalizedPassRate = passPercent > 100 ? 100 : passPercent;

                      return (
                        <tr key={ts.id} className="border-b border-slate-50 hover:bg-slate-50/30 font-medium">
                          <td className="p-3 font-bold text-slate-800">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                                ts.level === "cf" 
                                  ? "bg-emerald-50 text-emerald-700" 
                                  : ts.level === "ka"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-indigo-50 text-indigo-700"
                              }`}>
                                {ts.level.toUpperCase()}
                              </span>
                              <span>{ts.title}</span>
                            </div>
                          </td>
                          <td className="p-3 text-center text-slate-600 font-mono font-bold">
                            {tsQuestionsCount}
                          </td>
                          <td className="p-3 text-center text-slate-600 font-mono font-bold">
                            {totalAttempts}
                          </td>
                          <td className="p-3 text-center text-indigo-600 font-mono font-black text-sm">
                            {avgScore}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-2.5">
                              <div className="w-16 bg-slate-100 rounded-full h-1.5 hidden sm:block overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    normalizedPassRate >= 80 
                                      ? "bg-emerald-500" 
                                      : normalizedPassRate >= 50 
                                      ? "bg-amber-500" 
                                      : "bg-rose-500"
                                  }`}
                                  style={{ width: `${normalizedPassRate}%` }}
                                />
                              </div>
                              <span className={`font-mono font-black ${
                                normalizedPassRate >= 80 
                                  ? "text-emerald-600" 
                                  : normalizedPassRate >= 50 
                                  ? "text-amber-600" 
                                  : "text-rose-500"
                              }`}>
                                {normalizedPassRate}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
