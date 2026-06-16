"use client";

import React, { useState } from "react";
import { useIC3 } from "@/lib/ic3store";
import { Question } from "@/lib/ic3data";
import { Check, Trash2, Plus, PenTool, Database, BookOpen, UserCheck, AlertCircle, Save } from "lucide-react";

export default function TeacherConsole() {
  const { questions, currentUser, addNewQuestion, deleteQuestion } = useIC3();

  // Active sub tab inside educator workspace
  const [activeSubTab, setActiveSubTab] = useState<"questions" | "add-question">("questions");

  // Form states for creating custom questions
  const [newQType, setNewQType] = useState<"single-choice" | "multiple-response" | "true-false">("single-choice");
  const [newQModule, setNewQModule] = useState<"CF" | "KA" | "LO">("CF");
  const [newQText, setNewQText] = useState("");
  const [newQDifficulty, setNewQDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [newQTopic, setNewQTopic] = useState("");
  const [newQExplanation, setNewQExplanation] = useState("");
  
  // Options state
  const [optA, setOptA] = useState("");
  const [optB, setOptB] = useState("");
  const [optC, setOptC] = useState("");
  const [optD, setOptD] = useState("");
  
  // Choice assertions
  const [correctSingle, setCorrectSingle] = useState("");
  const [correctMultiple, setCorrectMultiple] = useState<string[]>([]);
  const [qSkill, setQSkill] = useState("");

  const handleSubmitQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQText.trim() || !newQTopic.trim() || !newQExplanation.trim()) {
      alert("Vui lòng nhập đầy đủ các trường thông tin câu hỏi cơ bản!");
      return;
    }

    // Assemble options based on question types
    let options: string[] = [];
    let singleAns = "";
    let multiAns: string[] = [];

    if (newQType === "true-false") {
      options = ["Đúng", "Sai"];
      singleAns = correctSingle || "Đúng";
    } else {
      if (!optA.trim() || !optB.trim() || !optC.trim() || !optD.trim()) {
        alert("Vui lòng hoàn thiện nội dung đầy đủ cho cả 4 Đáp án lựa chọn A, B, C, D!");
        return;
      }
      options = [
        `A. ${optA.trim()}`,
        `B. ${optB.trim()}`,
        `C. ${optC.trim()}`,
        `D. ${optD.trim()}`
      ];

      if (newQType === "single-choice") {
        if (!correctSingle) {
          alert("Vui lòng chọn hoặc khẳng định một đáp án đúng!");
          return;
        }
        singleAns = `A. ${correctSingle === "A" ? optA : correctSingle === "B" ? optB : correctSingle === "C" ? optC : optD}`;
      } else {
        if (correctMultiple.length === 0) {
          alert("Vui lòng chọn ít nhất 1 đáp án chính xác cho dạng Trắc nghiệm nhiều lựa chọn!");
          return;
        }
        multiAns = correctMultiple.map((letter) => {
          return `A. ${letter === "A" ? optA : letter === "B" ? optB : letter === "C" ? optC : optD}`;
        });
      }
    }

    const payload: Question = {
      id: `custom-q-${Date.now()}`,
      moduleId: newQModule,
      topic: newQTopic.trim(),
      type: newQType,
      difficulty: newQDifficulty,
      skills: [qSkill.trim() || "Kiến thức chung"],
      tags: [newQTopic.trim()],
      questionText: newQText.trim(),
      explanation: newQExplanation.trim(),
      options: options.length > 0 ? options : undefined,
      correctSingle: singleAns || undefined,
      correctMultiple: multiAns.length > 0 ? multiAns : undefined
    };

    addNewQuestion(payload);
    alert("✓ Đã thêm câu hỏi mới thành công vào ngân hàng đề thi hệ thống!");
    
    // Reset forms
    setNewQText("");
    setNewQTopic("");
    setNewQExplanation("");
    setOptA("");
    setOptB("");
    setOptC("");
    setOptD("");
    setCorrectSingle("");
    setCorrectMultiple([]);
    setQSkill("");
    setActiveSubTab("questions");
  };

  const handleToggleMultiCorrect = (letter: string) => {
    setCorrectMultiple((prev) =>
      prev.includes(letter) ? prev.filter((l) => l !== letter) : [...prev, letter]
    );
  };

  return (
    <div className="space-y-6" id="teacher-console-viewport">
      {/* HEADER ROW OPTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 border border-gray-200 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-800 leading-snug">Giảng viên / Hội đồng Khảo thí</h2>
          <p className="text-xs text-gray-400">Tạo tài liệu học tập, soạn thảo câu hỏi luyện thi và theo dõi tiến độ khảo sát</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="subtab-q-list"
            onClick={() => setActiveSubTab("questions")}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "questions"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 hover:bg-slate-200 text-gray-600"
            }`}
          >
            <Database className="h-4 w-4" /> Ngân hàng Câu hỏi ({questions.length})
          </button>
          
          <button
            id="subtab-q-add"
            onClick={() => setActiveSubTab("add-question")}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "add-question"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 hover:bg-slate-200 text-gray-600"
            }`}
          >
            <Plus className="h-4 w-4" /> Soạn câu hỏi mới
          </button>
        </div>
      </div>

      {/* SUBTAB 1: SYSTEM QUESTIONS DATABASE */}
      {activeSubTab === "questions" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden" id="teacher-subtab-questions">
          <div className="p-5 border-b border-gray-150">
            <h3 className="font-bold text-sm text-gray-800">Cơ sở dữ liệu câu hỏi ôn tập</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" id="questions-dashboard-table">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="p-4">Nội dung câu hỏi</th>
                  <th className="p-4">Dạng câu / Phân hệ</th>
                  <th className="p-4">Mức độ khó</th>
                  <th className="p-4">Chủ đề</th>
                  <th className="p-4 text-right">Xử lý</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {questions.map((q) => (
                  <tr key={q.id} className="hover:bg-gray-50/50" id={`q-row-${q.id}`}>
                    <td className="p-4 max-w-sm">
                      <div className="font-bold text-gray-800 truncate" title={q.questionText}>
                        {q.questionText}
                      </div>
                      <div className="text-[10px] text-indigo-600 font-mono mt-1 font-bold">Mã ID: {q.id}</div>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                        {q.type}
                      </span>
                      <span className="ml-1.5 text-indigo-800 bg-indigo-50 px-1.5 py-0.5 rounded font-bold font-mono">
                        {q.moduleId}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`font-bold px-1.5 py-0.5 rounded ${
                          q.difficulty === "easy"
                            ? "bg-green-100 text-green-800"
                            : q.difficulty === "medium"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {q.difficulty === "easy" ? "Dễ" : q.difficulty === "medium" ? "Trung bình" : "Khó"}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600">{q.topic}</td>
                    <td className="p-4 text-right">
                      <button
                        id={`delete-btn-${q.id}`}
                        onClick={() => {
                          if (window.confirm("Bạn có tin tưởng muốn Xóa câu hỏi này khỏi hệ thống?")) {
                            deleteQuestion(q.id);
                          }
                        }}
                        type="button"
                        className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg cursor-pointer"
                        title="Xóa câu hỏi này"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: CREATE QUESTION FORM */}
      {activeSubTab === "add-question" && (
        <form
          onSubmit={handleSubmitQuestion}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6 text-left"
          id="teacher-question-form"
        >
          <div className="border-b border-gray-150 pb-3">
            <h3 className="font-bold text-base text-gray-800">Biên tập viên Đề thi IC3 trực tuyến</h3>
            <p className="text-[11px] text-gray-400">Các câu hỏi được thiết lập chuẩn theo bộ lọc sẽ lập tức tích hợp vào các đề luyện thi chung.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 block">Dạng câu hỏi tương tác:</label>
              <select
                id="form-q-type"
                value={newQType}
                onChange={(e) => {
                  setNewQType(e.target.value as any);
                  setCorrectSingle("");
                  setCorrectMultiple([]);
                }}
                className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-xs"
              >
                <option value="single-choice">Trắc nghiệm 1 Đáp án (Multiple choice)</option>
                <option value="multiple-response">Trắc nghiệm Nhiều đáp án (Multiple response)</option>
                <option value="true-false">Khẳng định Đúng / Sai (True / False)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 block">Phân hệ ôn thi (Module):</label>
              <select
                id="form-q-module"
                value={newQModule}
                onChange={(e) => setNewQModule(e.target.value as any)}
                className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-xs"
              >
                <option value="CF">Computing Fundamentals (CF)</option>
                <option value="KA">Key Applications (KA)</option>
                <option value="LO">Living Online (LO)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 block">Độ khó câu hỏi:</label>
              <select
                id="form-q-difficulty"
                value={newQDifficulty}
                onChange={(e) => setNewQDifficulty(e.target.value as any)}
                className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-xs"
              >
                <option value="easy">Dễ</option>
                <option value="medium">Trung bình</option>
                <option value="hard">Khó</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 block">Chuyên đề (Topic):</label>
              <input
                id="form-q-topic"
                type="text"
                placeholder="Ví dụ: Thiết bị lưu trữ, Word, Excel..."
                value={newQTopic}
                onChange={(e) => setNewQTopic(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-xs bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 block">Kỹ năng mục tiêu (Skills):</label>
              <input
                id="form-q-skill"
                type="text"
                placeholder="Ví dụ: RAM, Quản lý thư mục..."
                value={qSkill}
                onChange={(e) => setQSkill(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-xs bg-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-600 block">Nội dung câu hỏi ôn thi:</label>
            <textarea
              id="form-q-text"
              rows={3}
              placeholder="Nhập đề bài câu hỏi chi tiết..."
              value={newQText}
              onChange={(e) => setNewQText(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-xs bg-white"
            />
          </div>

          {/* DYNAMIC ANSWER FORM FIELDS ACCORDING TO DESIRED SELECTION */}
          {newQType === "true-false" ? (
            <div className="bg-slate-50 p-4 rounded-xl border border-gray-200 space-y-3">
              <h4 className="text-xs font-bold text-gray-700">Assert correct choice (Đúng / Sai)</h4>
              <div className="flex items-center space-x-6 text-xs">
                <label className="flex items-center gap-1.5 font-semibold">
                  <input
                    type="radio"
                    name="tf-correct"
                    checked={correctSingle === "Đúng"}
                    onChange={() => setCorrectSingle("Đúng")}
                  />
                  Phương án ĐÚNG chính xác
                </label>
                <label className="flex items-center gap-1.5 font-semibold">
                  <input
                    type="radio"
                    name="tf-correct"
                    checked={correctSingle === "Sai"}
                    onChange={() => setCorrectSingle("Sai")}
                  />
                  Phương án SẠI chính xác
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-gray-150">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Soạn thảo các đáp án & Đánh dấu kết quả:</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">Nội dung Đáp án A:</label>
                  <input
                    id="form-opt-a"
                    type="text"
                    value={optA}
                    onChange={(e) => setOptA(e.target.value)}
                    placeholder="Nhập lựa chọn A..."
                    className="w-full border border-gray-300 rounded-lg p-2 bg-white text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">Nội dung Đáp án B:</label>
                  <input
                    id="form-opt-b"
                    type="text"
                    value={optB}
                    onChange={(e) => setOptB(e.target.value)}
                    placeholder="Nhập lựa chọn B..."
                    className="w-full border border-gray-300 rounded-lg p-2 bg-white text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">Nội dung Đáp án C:</label>
                  <input
                    id="form-opt-c"
                    type="text"
                    value={optC}
                    onChange={(e) => setOptC(e.target.value)}
                    placeholder="Nhập lựa chọn C..."
                    className="w-full border border-gray-300 rounded-lg p-2 bg-white text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">Nội dung Đáp án D:</label>
                  <input
                    id="form-opt-d"
                    type="text"
                    value={optD}
                    onChange={(e) => setOptD(e.target.value)}
                    placeholder="Nhập lựa chọn D..."
                    className="w-full border border-gray-300 rounded-lg p-2 bg-white text-xs"
                  />
                </div>
              </div>

              {/* DESIGN SELECTORS BASED ON Single choice or multiple choices */}
              {newQType === "single-choice" ? (
                <div className="pt-3 border-t border-gray-200">
                  <label className="text-xs font-bold text-gray-600 block mb-1.5">Đáp án nào đúng nhất?</label>
                  <div className="flex space-x-4 text-xs font-bold">
                    {["A", "B", "C", "D"].map((letter) => (
                      <label key={letter} className="flex items-center gap-1.5">
                        <input
                          type="radio"
                          name="correct-single-option"
                          checked={correctSingle === letter}
                          onChange={() => setCorrectSingle(letter)}
                        />
                        Đáp án {letter}
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="pt-3 border-t border-gray-200">
                  <label className="text-xs font-bold text-gray-600 block mb-1.5">Những đáp án nào đúng? (Chọn tối đa 4)</label>
                  <div className="flex space-x-4 text-xs font-bold">
                    {["A", "B", "C", "D"].map((letter) => (
                      <label key={letter} className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={correctMultiple.includes(letter)}
                          onChange={() => handleToggleMultiCorrect(letter)}
                        />
                        Đúng {letter}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-600 block">Giải thích lý thuật chuyên sâu (Sư phạm):</label>
            <textarea
              id="form-q-explanation"
              rows={3}
              placeholder="Giải nghĩa lý do đáp án này đúng và các đáp án khác sai để bồi dưỡng học viên..."
              value={newQExplanation}
              onChange={(e) => setNewQExplanation(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-xs bg-white"
            />
          </div>

          <div className="pt-4 border-t border-gray-150 flex items-center justify-end">
            <button
              id="submit-question-form-btn"
              type="submit"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Save className="h-4 w-4" /> Lưu & Tích hợp câu hỏi mới
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
