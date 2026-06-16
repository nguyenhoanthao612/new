"use client";

import React, { useState } from "react";
import { useIC3 } from "../lib/ic3store";
import { IC3_MODULES, ExamRecord } from "../lib/ic3data";
import { 
  Laptop, 
  FileSpreadsheet, 
  Globe2, 
  Award, 
  History, 
  Users, 
  FolderPlus, 
  CheckCircle, 
  ChevronRight, 
  BookOpen, 
  AlertCircle,
  Calendar,
  UploadCloud,
  FileText,
  Trash2,
  Loader2
} from "lucide-react";

interface UserDashboardProps {
  onStartPractice: (module: "cf" | "ka" | "lo") => void;
  onStartExam: (module: "cf" | "ka" | "lo") => void;
}

export default function UserDashboard({ onStartPractice, onStartExam }: UserDashboardProps) {
  const { 
    userProfile, 
    classrooms, 
    examRecords, 
    joinClassroom, 
    documents, 
    uploadDocument, 
    deleteDocument 
  } = useIC3();

  // Joint state for class joining code
  const [classCode, setClassCode] = useState("");
  const [classError, setClassError] = useState<string | null>(null);
  const [classSuccess, setClassSuccess] = useState<string | null>(null);
  const [classSubmitting, setClassSubmitting] = useState(false);

  // File Uploading states
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [docIdToConfirmDelete, setDocIdToConfirmDelete] = useState<string | null>(null);

  // Classroom handler
  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setClassError(null);
    setClassSuccess(null);
    if (!classCode.trim()) return;

    setClassSubmitting(true);
    try {
      await joinClassroom(classCode);
      setClassSuccess("Bạn đã đăng ký tham gia lớp học thành công!");
      setClassCode("");
    } catch (err: any) {
      console.error(err);
      setClassError(err.message || "Không thể đăng ký tham gia lớp học.");
    } finally {
      setClassSubmitting(false);
    }
  };

  // Drag and Drop Event Handling
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processUpload(e.target.files[0]);
    }
  };

  const processUpload = async (file: File) => {
    setUploadError(null);
    setUploadSuccess(null);
    setUploading(true);
    try {
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("Dung lượng tệp vượt quá giới hạn (Tối đa 10MB)");
      }
      const extension = file.name.split('.').pop() || 'unknown';
      await uploadDocument(file.name, file.size, extension);
      setUploadSuccess(`Đã nạp tệp thành công: ${file.name}`);
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "Không thể tải lên tệp tin.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (docId: string, docName: string) => {
    if (docIdToConfirmDelete !== docId) {
      setDocIdToConfirmDelete(docId);
      // Automatically reset confirmation state after 4 seconds
      setTimeout(() => {
        setDocIdToConfirmDelete((curr) => curr === docId ? null : curr);
      }, 4000);
      return;
    }
    setDocIdToConfirmDelete(null);
    setUploadError(null);
    setUploadSuccess(null);
    try {
      await deleteDocument(docId);
      setUploadSuccess("Xóa tệp thành công khỏi cơ sở dữ liệu!");
    } catch (err: any) {
      console.error(err);
      setUploadError("Không thể hoàn tất yêu cầu xóa.");
    }
  };

  // Icon mapping helper
  const getModuleIcon = (id: string) => {
    switch (id) {
      case "cf":
        return <Laptop className="w-8 h-8 text-blue-500" />;
      case "ka":
        return <FileSpreadsheet className="w-8 h-8 text-amber-500" />;
      case "lo":
        return <Globe2 className="w-8 h-8 text-purple-500" />;
      default:
        return <BookOpen className="w-8 h-8 text-slate-500" />;
    }
  };

  // Accent styles helper
  const getModuleStyle = (id: string) => {
    switch (id) {
      case "cf":
        return "border-blue-100 hover:border-blue-300 bg-gradient-to-br from-white to-blue-50/20";
      case "ka":
        return "border-amber-100 hover:border-amber-300 bg-gradient-to-br from-white to-amber-50/20";
      case "lo":
        return "border-purple-100 hover:border-purple-300 bg-gradient-to-br from-white to-purple-50/20";
      default:
        return "border-slate-100 hover:border-slate-300";
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" id="student-dashboard-wrapper">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-xl p-6 md:p-8 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6" id="student-hero-banner">
        <div>
          <span className="bg-white/20 text-white font-semibold text-xs px-2.5 py-1 rounded-full uppercase tracking-wider">
            Thí sinh luyện thi
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold font-display tracking-tight mt-2" id="greet-student-name">
            Chào mừng, {userProfile?.displayName || "Bạn học"}
          </h2>
          <p className="opacity-85 text-sm max-w-xl mt-1 leading-relaxed">
            Hôm nay bạn định luyện phần thi nào? Khám phá 3 bộ tích hợp và sẵn sàng đối diện phòng thi thật đạt chứng chỉ quốc tế IC3 bậc cao.
          </p>
        </div>

        {/* Highlight Quick Score Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 shrink-0 w-full md:w-56 text-center shadow-inner" id="candidate-metrics-quick">
          <Award className="w-6 h-6 text-yellow-300 mx-auto mb-1" />
          <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-200 block">Số bài thi đã làm</span>
          <span className="text-3xl font-black block text-white mt-0.5">{examRecords.length}</span>
          <p className="text-[10px] opacity-75 mt-0.5">Tỷ lệ đạt: {examRecords.length > 0 ? Math.round((examRecords.filter(m => m.passed).length / examRecords.length) * 100) : 0}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="student-grid-panels">
        {/* Main Learning Hub - 3 IC3 Modules (takes 2 cols) */}
        <div className="lg:col-span-2 space-y-6" id="student-hub">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900 font-display transition shrink-0">
              Chương trình Ôn luyện
            </h3>
            <span className="text-xs text-slate-500 font-medium">Bản cập nhật GS6 mới nhất</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="modules-hub-grid">
            {IC3_MODULES.map((mod) => {
              const bestRecord = examRecords
                .filter((r) => r.module === mod.id)
                .sort((a, b) => b.score - a.score)[0];

              return (
                <div
                  key={mod.id}
                  id={`dashboard-module-card-${mod.id}`}
                  className={`flex flex-col h-full border rounded-xl p-5 shadow-sm transition ${getModuleStyle(mod.id)}`}
                >
                  <div className="shrink-0 mb-4">{getModuleIcon(mod.id)}</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 leading-snug text-sm">
                      {mod.name.split("(")[0].trim()}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 lines-2 leading-relaxed">
                      {mod.description}
                    </p>
                  </div>

                  {/* Display highest achieved scaled score if found */}
                  {bestRecord ? (
                    <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg text-center my-3 text-[11px]" id={`module-score-${mod.id}`}>
                      <span className="text-slate-500 block">Cao nhất:</span>
                      <span className={`font-bold block text-sm ${bestRecord.passed ? "text-emerald-600" : "text-amber-600"}`}>
                        {bestRecord.score} / 1000
                      </span>
                    </div>
                  ) : (
                    <div className="h-6" />
                  )}

                  {/* Actions buttons */}
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                    <button
                      id={`practice-btn-${mod.id}`}
                      onClick={() => onStartPractice(mod.id)}
                      className="w-full py-2 hover:bg-slate-50 text-slate-700 font-semibold border border-slate-200 rounded-lg text-xs transition"
                    >
                      Luyện tập tự do
                    </button>
                    <button
                      id={`exam-btn-${mod.id}`}
                      onClick={() => onStartExam(mod.id)}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs shadow-sm transition flex items-center justify-center gap-1"
                    >
                      Thi thử GS6
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Exam History Sub-panel */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm" id="candidate-exam-history-card">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <History className="w-5 h-5 text-indigo-600" />
              <h4 className="font-bold text-slate-900 font-display">Lịch sử làm bài thi thử</h4>
            </div>

            {examRecords.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-sm italic" id="empty-exams-msg">
                Bạn chưa tham gia kỳ thi thử nào.
              </div>
            ) : (
              <div className="overflow-x-auto" id="exams-table-scroller">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 hover:text-slate-600 font-semibold">
                      <th className="pb-2">Phần thi</th>
                      <th className="pb-2">Ngày làm bài</th>
                      <th className="pb-2">Thời lượng</th>
                      <th className="pb-2">Điểm chuẩn</th>
                      <th className="pb-2 text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {examRecords.slice(0, 5).map((rec) => {
                      const mInfo = IC3_MODULES.find((m) => m.id === rec.module);
                      const min = Math.floor(rec.timeSpent / 60);
                      const sec = rec.timeSpent % 60;
                      return (
                        <tr key={rec.id} className="border-b border-slate-50 hover:bg-slate-50/50 py-2">
                          <td className="py-2.5 font-bold text-slate-800">
                            {mInfo?.name.split("(")[0].trim() || rec.module}
                          </td>
                          <td className="py-2.5 text-slate-500 whitespace-nowrap">
                            {new Date(rec.createdAt).toLocaleDateString("vi-VN")}
                          </td>
                          <td className="py-2.5 text-slate-500 font-mono">
                            {min} phút {sec} giây
                          </td>
                          <td className="py-2.5 text-slate-800 font-extrabold text-sm font-mono">
                            {rec.score} / 1000
                          </td>
                          <td className="py-2.5 text-right">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${rec.passed ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"}`}>
                              {rec.passed ? "Đạt" : "Trượt"}
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

          {/* Document Management Card */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4" id="documents-manager-card">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h4 className="font-bold text-slate-900 font-display text-sm">Tệp tin & Tài liệu ôn tập</h4>
              </div>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2 py-0.5 rounded border border-indigo-100">
                Tệp cá nhân
              </span>
            </div>

            {/* Upload errors / success details */}
            {uploadError && (
              <div className="bg-rose-50 border border-rose-100 text-rose-700 p-2.5 rounded-lg text-xs" id="doc-upload-err">
                {uploadError}
              </div>
            )}
            {uploadSuccess && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-2.5 rounded-lg text-xs" id="doc-upload-succ">
                {uploadSuccess}
              </div>
            )}

            {/* Drag & Drop uploader area */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer relative ${
                dragActive 
                  ? "border-indigo-500 bg-indigo-50/40" 
                  : "border-slate-200 bg-slate-50/30 hover:bg-slate-50/70"
              }`}
              id="file-drop-zone-student"
            >
              <input
                type="file"
                id="file-upload-input-student"
                className="hidden"
                onChange={handleFileChange}
                disabled={uploading}
              />
              <label htmlFor="file-upload-input-student" className="cursor-pointer space-y-2 block">
                {uploading ? (
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
                ) : (
                  <UploadCloud className="w-8 h-8 text-indigo-500 mx-auto" />
                )}
                
                <div className="text-xs">
                  <span className="font-bold text-indigo-600">Nhấp để tải lên</span> hoặc kéo thả tài liệu vào đây (PDF, Word, Excel, Hình ảnh...)
                </div>
                <p className="text-[10px] text-slate-400">Dung lượng tệp tối đa: 10MB</p>
              </label>
            </div>

            {/* List of user uploaded files */}
            <div className="space-y-2.5" id="user-docs-items-list">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Các tệp đã tải lên ({documents.length})</span>
              
              {documents.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4">Bạn chưa tải lên tài liệu nào.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {documents.map((docItem) => {
                    const formattedSize = docItem.size > 1024 * 1024 
                      ? (docItem.size / (1024 * 1024)).toFixed(2) + " MB" 
                      : (docItem.size / 1024).toFixed(1) + " KB";
                    
                    return (
                      <div 
                        key={docItem.id} 
                        className="flex justify-between items-center bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-xs"
                        id={`user-doc-${docItem.id}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-700 truncate text-[11px] max-w-[140px]" title={docItem.name}>
                              {docItem.name}
                            </p>
                            <span className="text-[9px] text-slate-400 block">
                              {formattedSize} • {new Date(docItem.createdAt).toLocaleDateString("vi-VN")}
                            </span>
                          </div>
                        </div>

                        <button
                          id={`del-user-doc-btn-${docItem.id}`}
                          onClick={() => handleDeleteFile(docItem.id, docItem.name)}
                          className={`p-1 rounded-md transition text-xs font-bold leading-none flex items-center gap-1 ${
                            docIdToConfirmDelete === docItem.id 
                              ? "text-red-600 bg-red-50 hover:bg-red-100 px-1.5 py-0.5 animate-pulse" 
                              : "text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                          }`}
                          title={docIdToConfirmDelete === docItem.id ? "Nhấp lại để xác nhận xóa tệp" : "Xóa tài liệu"}
                        >
                          {docIdToConfirmDelete === docItem.id ? (
                            <span>Xóa?</span>
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Classroom Panels (takes 1 col) */}
        <div className="space-y-6" id="student-sidebar">
          {/* Active Classes Card */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm" id="class-control-panel">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <Users className="w-5 h-5 text-blue-600" />
              <h4 className="font-bold text-slate-900 font-display">Lớp học liên kết</h4>
            </div>

            {classrooms.length > 0 ? (
              <div className="space-y-3" id="active-classrooms">
                {classrooms.map((cls) => (
                  <div key={cls.id} className="bg-slate-50 border border-slate-100 p-3 rounded-lg" id={`class-item-${cls.id}`}>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded">
                      LỚP HỌC CHÍNH THỨC
                    </span>
                    <h5 className="font-bold text-slate-800 text-sm mt-1">{cls.name}</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
                      <div>
                        <span>Giảng dạy:</span>
                        <p className="font-semibold text-slate-700">{cls.teacherName}</p>
                      </div>
                      <div>
                        <span>Mã lớp:</span>
                        <p className="font-semibold text-slate-700 font-mono tracking-wider">{cls.code}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4" id="join-class-form-wrapper">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Nếu bạn được giáo viên hướng dẫn, hãy nhập mã lớp học gồm 6 ký tự để liên kết bảng điểm thi thử trực tiếp với giáo viên.
                </p>

                {classError && (
                  <div className="flex items-start gap-2 bg-rose-50 text-rose-700 p-2.5 rounded-lg text-xs border border-rose-100" id="class-error">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{classError}</span>
                  </div>
                )}

                {classSuccess && (
                  <div className="flex items-start gap-2 bg-emerald-50 text-emerald-700 p-2.5 rounded-lg text-xs border border-emerald-100" id="class-success">
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{classSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleJoinClass} className="flex gap-2" id="student-join-class-form">
                  <input
                    id="join-class-code-input"
                    type="text"
                    required
                    maxLength={6}
                    placeholder="MÃ LỚP (Ví dụ: AXF609)"
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono tracking-widest focus:outline-none focus:border-blue-600 text-slate-800"
                  />
                  <button
                    type="submit"
                    id="join-class-submit-btn"
                    disabled={classSubmitting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition shrink-0 disabled:opacity-50"
                  >
                    {classSubmitting ? "..." : "Tham gia"}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Quick study material references */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4" id="study-panel-ads">
            <span className="font-bold text-slate-900 border-b border-slate-100 pb-2 block text-sm font-display">Tài liệu ôn thi vàng</span>
            <div className="space-y-3 font-medium text-xs text-slate-700">
              <a href="#" className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100 transition">
                <span>Tài liệu ôn thi Máy tính căn bản 2026</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>
              <a href="#" className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100 transition">
                <span>Bộ đề cấu trúc chuẩn GS6 các ứng dụng</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>
              <a href="#" className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100 transition">
                <span>Tài liệu tự bảo mật gia đình trực tuyến</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
