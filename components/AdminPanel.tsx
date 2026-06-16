"use client";

import React, { useState } from "react";
import { useIC3 } from "@/lib/ic3store";
import { Download, Upload, RotateCcw, ShieldCheck, FileText, Server, Users, Award, BookOpen, AlertCircle, CheckCircle } from "lucide-react";

export default function AdminPanel() {
  const { lessons, questions, exams, currentUser, exportDatabase, importDatabase, resetSystemData } = useIC3();

  const [importJson, setImportJson] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleExportData = () => {
    try {
      const dataStr = exportDatabase();
      const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

      const exportFileDefaultName = `ic3_prep_database_backup_${new Date().toISOString().split("T")[0]}.json`;

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();
      
      setSuccessMsg("✓ Xuất dữ liệu tệp tin sao lưu thành công!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (e) {
      setErrorMsg("Xuất dữ liệu thất bại.");
    }
  };

  const handleImportData = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    if (!importJson.trim()) {
      setErrorMsg("Vui lòng nhập văn bản chuỗi JSON cơ sở dữ liệu sao lưu!");
      return;
    }

    const success = importDatabase(importJson);
    if (success) {
      setSuccessMsg("✓ Nhập và đồng bộ hóa cơ sở dữ liệu mới thành công!");
      setImportJson("");
    } else {
      setErrorMsg("Chuỗi JSON cấu trúc dữ liệu không hợp lệ. Vui lòng kiểm tra lại cấu trúc xuất bản.");
    }
  };

  const handleReset = () => {
    if (window.confirm("CẢNH BÁO: Hành động này sẽ xóa toàn bộ tiến trình học tập, lịch sử thi thử và câu hỏi thêm mới để khôi phục cấu hình mặc định ban đầu. Bạn có chắc chắn muốn thực hiện?")) {
      resetSystemData();
      alert("Hệ thống đã phục hồi trạng thái hạt giống (seed) ban đầu thành công.");
    }
  };

  return (
    <div className="space-y-6" id="admin-panel-viewport">
      {/* HEADER METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center space-x-3 shadow-sm" id="admin-metric-lessons">
          <BookOpen className="h-8 w-8 text-indigo-600 shrink-0" />
          <div>
            <span className="text-[10px] text-gray-400 font-bold block">TỔNG SỐ BÀI HỌC</span>
            <span className="text-xl font-black text-gray-800">{lessons.length} bài</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center space-x-3 shadow-sm" id="admin-metric-questions">
          <FileText className="h-8 w-8 text-indigo-600 shrink-0" />
          <div>
            <span className="text-[10px] text-gray-400 font-bold block">NGÂN HÀNG LÍ THUYẾT</span>
            <span className="text-xl font-black text-gray-800">{questions.length} câu</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center space-x-3 shadow-sm" id="admin-metric-users">
          <Users className="h-8 w-8 text-indigo-600 shrink-0" />
          <div>
            <span className="text-[10px] text-gray-400 font-bold block">HỌC VIÊN ĐĂNG KÝ MẪU</span>
            <span className="text-xl font-black text-emerald-600">6,520 học viên</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center space-x-3 shadow-sm" id="admin-metric-exams">
          <Award className="h-8 w-8 text-indigo-600 shrink-0" />
          <div>
            <span className="text-[10px] text-gray-400 font-bold block">SỐ ĐỀ THI THỬ</span>
            <span className="text-xl font-black text-gray-800">{exams.length} đề thi</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Data Administration & Seed System */}
        <div className="lg:col-span-2 space-y-6">
          {/* Backup administrative tool */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <div>
              <h3 className="font-bold text-gray-800 text-sm">Biên bản Nhập / Xuất Cở sở Dữ liệu (Backup & Sync)</h3>
              <p className="text-[10px] text-gray-400">Sao lưu tệp tin cấu hình đề thi hoặc đồng bộ hóa ngân hàng câu hỏi lập tức</p>
            </div>

            {successMsg && (
              <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-xs font-semibold flex items-center gap-2" id="admin-success-box">
                <CheckCircle className="h-4 w-4 shrink-0" /> {successMsg}
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-semibold flex items-center gap-2" id="admin-error-box">
                <AlertCircle className="h-4 w-4 shrink-0" /> {errorMsg}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                id="export-db-action"
                type="button"
                onClick={handleExportData}
                className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Download className="h-4 w-4" /> Tải về tệp sao lưu JSON (.json)
              </button>

              <button
                id="reset-db-action"
                type="button"
                onClick={handleReset}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-rose-600 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" /> Reset cơ sở dữ liệu mặc định
              </button>
            </div>

            {/* Import layout form */}
            <form onSubmit={handleImportData} className="pt-4 border-t border-gray-150 space-y-3">
              <label className="text-xs font-bold text-gray-700 block">Dán chuỗi dữ liệu sao lưu JSON mục tiêu:</label>
              <textarea
                id="import-db-textarea"
                rows={5}
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder='Dán nội dung tệp JSON đã tải về hoặc bản sao cấu trúc chuỗi...'
                className="w-full border border-gray-300 rounded-lg p-3 text-xs font-mono bg-slate-50 outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                id="import-db-action"
                type="submit"
                className="py-2.5 px-5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="h-4 w-4" /> Xác thực & Nạp cơ sở dữ liệu mới
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Deployment Guideline & Scalability parameters */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 text-left">
            <div className="flex items-center space-x-2 text-indigo-700">
              <Server className="h-5 w-5" />
              <h3 className="font-bold text-xs uppercase tracking-widest">Tiêu chuẩn triển khai thực tế</h3>
            </div>

            <p className="text-[11px] text-gray-500 leading-relaxed font-semibold">
              Hệ thống được thiết kế theo mô hình **Stateless Client-authoritative** kết hợp lưu trữ an toàn cấp độ trình duyệt:
            </p>

            <ul className="space-y-2 text-[10px] text-gray-600 list-disc ml-4 font-medium leading-relaxed">
              <li>
                <strong>Cân bằng tải cao:</strong> Hoàn toàn không tốn chi phí băng thông lưu trữ máy chủ ảo khi học viên làm bài thi, dễ dàng phục vụ hàng vạn lượt kết nối cùng lúc.
              </li>
              <li>
                <strong>Tương thích đa thiết bị:</strong> Responsive hoàn hảo từ PC lớp học tin học tới Máy tính bảng cá nhân.
              </li>
              <li>
                <strong>An toàn dữ liệu:</strong> Dễ dàng xuất sao lưu cấu hình đề thi (.json) để lưu trữ lên Google Drive nhà trường hoặc chia sẻ trực tiếp cho học nhóm.
              </li>
              <li>
                <strong>Sát đề Certiport:</strong> Phản hồi điểm số theo module giúp giáo viên khoanh vùng bồi dưỡng nâng cao tỷ lệ đỗ chứng chỉ thực khi đi thi.
              </li>
            </ul>

            <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-150 text-[10px] text-indigo-900 font-bold flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-indigo-600" />
              Hệ thống Giám thị Proctoring chống gian lận ảo luôn hoạt động tự động.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
