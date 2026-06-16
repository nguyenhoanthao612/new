"use client";

import React, { useState } from "react";
import { useIC3 } from "../lib/ic3store";
import { IC3_MODULES, SAMPLE_QUESTIONS, UserProgress } from "../lib/ic3data";
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
  Trash
} from "lucide-react";

export default function AdminPanel() {
  const { 
    classrooms, 
    examRecords, 
    documents, 
    allUsers, 
    deleteDocument 
  } = useIC3();

  // Selected administrative tabs
  const [activeTab, setActiveTab] = useState<"users" | "stats" | "questions" | "records">("users");

  // Selection of single user details
  const [selectedUser, setSelectedUser] = useState<UserProgress | null>(null);

  // Search filter
  const [searchTerm, setSearchTerm] = useState("");

  // Deleting state flag
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

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

  // Safe document deletion with database synchronization
  const handleDeleteDoc = async (docId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn tệp/tài liệu này khỏi hệ thống không?")) {
      return;
    }
    setDeletingDocId(docId);
    try {
      await deleteDocument(docId);
    } catch (err) {
      console.error("Xóa tài liệu thất bại:", err);
      alert("Không có quyền hoặc quá trình xóa tệp gặp lỗi.");
    } finally {
      setDeletingDocId(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" id="admin-panel-stage">
      
      {/* Root Admin Header Banner */}
      <div 
        className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 border border-slate-800 rounded-2xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6" 
        id="admin-header-banner"
      >
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="bg-purple-500/20 text-purple-300 font-bold text-[11px] px-3 py-1 rounded-full uppercase tracking-wider border border-purple-500/30">
              Quản trị viên tối cao
            </span>
            <span className="bg-rose-500/20 text-rose-300 font-bold text-[11px] px-3 py-1 rounded-full uppercase tracking-wider border border-rose-500/30 flex items-center gap-1.5 animate-pulse">
              <Shield className="w-3.5 h-3.5 fill-red-400" />
              ADMIN MODE ACTIVE
            </span>
          </div>
          <h2 className="text-2xl md:text-3.5xl font-black font-display tracking-tight text-white mt-1.5">
            Phân Hệ Quản Trị Hệ Thống
          </h2>
          <p className="text-indigo-200/75 text-xs md:text-sm max-w-xl leading-relaxed">
            Hạ tầng quản lý người dùng, rà soát hồ sơ tài liệu trực tuyến, thống kê điểm bài thi mô phỏng và kho câu hỏi IC3 GS6.
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
            Kho câu hỏi ({SAMPLE_QUESTIONS.length})
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
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-2 hover:shadow-md transition duration-200">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Tổng người dùng</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-black block text-slate-800 font-display">{totalUsersNum}</span>
          <p className="text-[10px] text-slate-500">Tài khoản đăng ký hệ thống</p>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-2 hover:shadow-md transition duration-200">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Tổng tệp đã tải</span>
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-black block text-slate-800 font-display">{totalDocsNum}</span>
          <p className="text-[10px] text-slate-500">Toàn bộ tệp & tài liệu ôn thi</p>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-2 hover:shadow-md transition duration-200">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Lượt thi thử</span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-black block text-slate-800 font-display">{totalExams}</span>
          <p className="text-[10px] text-slate-500">Ghi nhận biên bản nộp bài</p>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-2 hover:shadow-md transition duration-200">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Tỷ lệ đạt trung bình</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-black block text-emerald-600 font-display">{passRate}%</span>
          <p className="text-[10px] text-slate-500">Điểm số {'>'}= 700 / 1000</p>
        </div>
      </div>

      {/* TABS IMPLEMENTATION */}

      {/* 1. Tab Users: User Directory & Documents Explorer */}
      {activeTab === "users" && (
        <div className="space-y-6 animate-fade-in" id="admin-view-users">
          {!selectedUser ? (
            // User List view
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
              
              {/* Table search & count */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-display">Danh Sách Người Dùng</h3>
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
                                <div>
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
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
              
              {/* Header go back */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-5 gap-4">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="inline-flex items-center gap-1.5 text-slate-500 hover:text-purple-600 font-bold transition text-xs"
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
                  
                  <div className="space-y-1">
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
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Tống tệp lưu trữ</span>
                  <span className="text-2xl font-black block text-indigo-600">
                    {documents.filter(d => d.userId === selectedUser.userId).length} tệp
                  </span>
                </div>
              </div>

              {/* List of user documents */}
              <div className="space-y-4">
                <h3 className="text-sm font-extrabold text-slate-800 font-display flex items-center gap-2">
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
                          <div className="flex items-center gap-3 min-w-0">
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
                              
                              <span className="text-[9px] text-slate-400 block mt-1.5">
                                Đã tải lên: {new Date(docItem.createdAt).toLocaleDateString("vi-VN")} {new Date(docItem.createdAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>

                          <button
                            id={`del-doc-btn-${docItem.id}`}
                            onClick={() => handleDeleteDoc(docItem.id)}
                            disabled={deletingDocId === docItem.id}
                            className="p-2 border border-rose-100 shadow-sm bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-lg transition duration-150 shrink-0 disabled:opacity-50"
                            title="Xóa tài liệu này"
                          >
                            {deletingDocId === docItem.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
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
        <div className="space-y-6 animate-fade-in" id="admin-view-stats">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="stats-details-block">
            
            {/* System Connection details */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Activity className="w-5 h-5 text-indigo-600" />
                <h4 className="font-extrabold text-slate-900 font-display text-sm">Hiệu Suất Kết Nối Hệ Thống</h4>
              </div>

              <div className="space-y-3.5 text-xs text-slate-600">
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100/60">
                  <span className="font-medium">Cục dữ liệu Firestore Cloud</span>
                  <span className="bg-emerald-50 text-emerald-700 font-extrabold px-3 py-1 rounded-full border border-emerald-100 text-[10px]">
                    KẾT NỐI ỔN ĐỊNH (ONLINE)
                  </span>
                </div>
                
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100/60">
                  <span className="font-medium">Phiên bản máy chủ Firebase API</span>
                  <span className="font-bold text-slate-800 font-mono">Firestore Web SDK v11.x</span>
                </div>

                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100/60">
                  <span className="font-medium">Tổng lớp học khởi tạo</span>
                  <span className="font-bold text-slate-800">{classrooms.length} lớp học hoạt động</span>
                </div>

                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100/60">
                  <span className="font-medium">Dịch thuật bản địa</span>
                  <span className="font-bold text-slate-800">Tiếng Việt (Chuẩn hóa ôn thi quốc tế)</span>
                </div>
              </div>
            </div>

            {/* Performance charts */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h4 className="font-extrabold text-slate-900 font-display text-sm">Thống Kê Tiến Trình Ôn Luyện Theo Mảng Thi</h4>
              </div>

              <div className="space-y-4" id="modules-performance">
                {IC3_MODULES.map(mod => {
                  const mExams = examRecords.filter(r => r.module === mod.id);
                  const mPass = mExams.filter(r => r.passed).length;
                  const rate = mExams.length > 0 ? Math.round((mPass / mExams.length) * 100) : 0;
                  return (
                    <div key={mod.id} className="text-xs space-y-2" id={`mod-stats-${mod.id}`}>
                      <div className="flex justify-between text-slate-700 font-semibold font-display">
                        <span>{mod.name.split("(")[0].trim()}</span>
                        <span className="text-slate-500">{rate}% đỗ ({mExams.length} lượt thi)</span>
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
        </div>
      )}

      {/* 3. Questions Database view */}
      {activeTab === "questions" && (
        <div className="space-y-4 animate-fade-in" id="admin-view-questions">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900 font-display">Bộ câu hỏi IC3 GS6 Mặc định</h3>
            <span className="text-xs text-slate-400">Không thể sửa đổi ngân hàng câu hỏi gốc</span>
          </div>
          
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1" id="questions-pool-scroller2">
            {SAMPLE_QUESTIONS.map((q, idx) => (
              <div key={q.id} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm" id={`admin-q-${q.id}`}>
                <div className="flex justify-between items-start gap-4 mb-2">
                  <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                    Mã: {q.id} • Phân mục: {q.module.toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">{q.topic}</span>
                </div>
                <p className="text-sm font-semibold text-slate-800 leading-snug">{q.questionText}</p>
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-slate-600 font-medium">
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} className={`p-1.5 rounded border ${oIdx === q.correctIndex ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-bold" : "border-slate-100 bg-slate-50/50"}`}>
                      {String.fromCharCode(65 + oIdx)}. {opt}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Global Exam Records list */}
      {activeTab === "records" && (
        <div className="space-y-4 animate-fade-in" id="admin-view-records">
          <h3 className="text-lg font-bold text-slate-900 font-display">Tất cả chứng tích thi thử trực tuyến</h3>

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
                          {mInfo?.name.split("(")[0].trim() || rec.module}
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
    </div>
  );
}
