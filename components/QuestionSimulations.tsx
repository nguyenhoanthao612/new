"use client";

import React, { useState, useEffect } from "react";
import { Question } from "@/lib/ic3data";
import { Check, X, MoveHorizontal, MapPin, Play, Pause, RotateCw, FolderPlus, FileText, ChevronRight, HelpCircle } from "lucide-react";

interface QuestionSimulationProps {
  question: Question;
  currentAnswer: any; // User's active selected answer state
  onChangeAnswer: (answer: any) => void;
  showFeedback?: boolean; // Whether in immediate practice feedback mode
}

export default function QuestionSimulation({
  question,
  currentAnswer,
  onChangeAnswer,
  showFeedback = false,
}: QuestionSimulationProps) {
  switch (question.type) {
    case "single-choice":
      return (
        <SingleChoiceSim
          question={question}
          currentAnswer={currentAnswer}
          onChangeAnswer={onChangeAnswer}
          showFeedback={showFeedback}
        />
      );
    case "multiple-response":
      return (
        <MultipleResponseSim
          question={question}
          currentAnswer={currentAnswer}
          onChangeAnswer={onChangeAnswer}
          showFeedback={showFeedback}
        />
      );
    case "true-false":
      return (
        <TrueFalseSim
          question={question}
          currentAnswer={currentAnswer}
          onChangeAnswer={onChangeAnswer}
          showFeedback={showFeedback}
        />
      );
    case "matching":
      return (
        <MatchingSim
          question={question}
          currentAnswer={currentAnswer}
          onChangeAnswer={onChangeAnswer}
          showFeedback={showFeedback}
        />
      );
    case "drag-drop":
      return (
        <DragAndDropSim
          question={question}
          currentAnswer={currentAnswer}
          onChangeAnswer={onChangeAnswer}
          showFeedback={showFeedback}
        />
      );
    case "hotspot":
      return (
        <HotspotSim
          question={question}
          currentAnswer={currentAnswer}
          onChangeAnswer={onChangeAnswer}
          showFeedback={showFeedback}
        />
      );
    case "performance":
      return (
        <PerformanceSim
          question={question}
          currentAnswer={currentAnswer}
          onChangeAnswer={onChangeAnswer}
          showFeedback={showFeedback}
        />
      );
    case "video":
      return (
        <VideoSim
          question={question}
          currentAnswer={currentAnswer}
          onChangeAnswer={onChangeAnswer}
          showFeedback={showFeedback}
        />
      );
    default:
      return <div className="text-red-500">Dạng câu hỏi không hỗ trợ.</div>;
  }
}

// 1. SINGLE CHOICE SIMULATION
function SingleChoiceSim({ question, currentAnswer, onChangeAnswer, showFeedback }: QuestionSimulationProps) {
  const options = question.options || [];

  return (
    <div className="space-y-3" id={`single-choice-container-${question.id}`}>
      {options.map((option) => {
        const isSelected = currentAnswer === option;
        const isCorrectOption = option === question.correctSingle;
        
        let optionStyles = "border border-gray-200 bg-white hover:bg-gray-50 text-gray-800";
        if (isSelected) {
          optionStyles = "border-2 border-indigo-600 bg-indigo-50/50 text-indigo-900";
        }
        
        if (showFeedback) {
          if (isCorrectOption) {
            optionStyles = "border-2 border-green-500 bg-green-50 text-green-900";
          } else if (isSelected && !isCorrectOption) {
            optionStyles = "border-2 border-red-500 bg-red-50 text-red-900";
          }
        }

        return (
          <button
            key={option}
            id={`option-btn-${option.replace(/\s+/g, '-')}`}
            type="button"
            className={`w-full text-left p-4 rounded-xl transition-all duration-150 flex items-center justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${optionStyles}`}
            onClick={() => !showFeedback && onChangeAnswer(option)}
            disabled={showFeedback}
          >
            <span className="font-medium text-sm leading-relaxed">{option}</span>
            <div className="flex items-center space-x-2 shrink-0 ml-4">
              {showFeedback && isCorrectOption && (
                <div className="p-1 rounded-full bg-green-500 text-white" id="correct-badge">
                  <Check className="h-4 w-4" />
                </div>
              )}
              {showFeedback && isSelected && !isCorrectOption && (
                <div className="p-1 rounded-full bg-red-500 text-white" id="wrong-badge">
                  <X className="h-4 w-4" />
                </div>
              )}
              <div
                className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                  isSelected ? "border-indigo-600 bg-indigo-600" : "border-gray-300 bg-white"
                }`}
                id={`option-bullet-${option.replace(/\s+/g, '-')}`}
              >
                {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// 2. MULTIPLE RESPONSE SIMULATION
function MultipleResponseSim({ question, currentAnswer = [], onChangeAnswer, showFeedback }: QuestionSimulationProps) {
  const options = question.options || [];

  const handleSelect = (option: string) => {
    if (showFeedback) return;
    const current = (currentAnswer as string[]) || [];
    const updated = current.includes(option)
      ? current.filter((item) => item !== option)
      : [...current, option];
    onChangeAnswer(updated);
  };

  return (
    <div className="space-y-3" id={`multi-options-container-${question.id}`}>
      <p className="text-xs text-gray-500 font-medium mb-1">
        * Hãy chọn đầy đủ tất cả đáp án đúng (Hệ thống ghi nhận khi chọn nhiều lựa chọn).
      </p>
      {options.map((option) => {
        const isSelected = (currentAnswer as string[] || []).includes(option);
        const isCorrectOption = (question.correctMultiple || []).includes(option);

        let optionStyles = "border border-gray-200 bg-white hover:bg-gray-50 text-gray-800";
        if (isSelected) {
          optionStyles = "border-2 border-indigo-600 bg-indigo-50/50 text-indigo-950";
        }

        if (showFeedback) {
          if (isCorrectOption) {
            optionStyles = "border-2 border-green-500 bg-green-50 text-green-950";
          } else if (isSelected && !isCorrectOption) {
            optionStyles = "border-2 border-red-500 bg-red-50 text-red-900";
          }
        }

        return (
          <button
            key={option}
            id={`multi-option-btn-${option.replace(/\s+/g, '-')}`}
            type="button"
            className={`w-full text-left p-4 rounded-xl transition-all duration-150 flex items-center justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${optionStyles}`}
            onClick={() => handleSelect(option)}
            disabled={showFeedback}
          >
            <span className="font-medium text-sm leading-relaxed">{option}</span>
            <div className="flex items-center space-x-2 shrink-0 ml-4">
              {showFeedback && isCorrectOption && (
                <div className="p-1 rounded-full bg-green-500 text-white" id="multi-correct-badge">
                  <Check className="h-4 w-4" />
                </div>
              )}
              {showFeedback && isSelected && !isCorrectOption && (
                <div className="p-1 rounded-full bg-red-500 text-white" id="multi-wrong-badge">
                  <X className="h-4 w-4" />
                </div>
              )}
              <div
                className={`h-5 w-5 rounded border flex items-center justify-center ${
                  isSelected ? "border-indigo-600 bg-indigo-600 text-white" : "border-gray-300 bg-white"
                }`}
                id={`multi-option-checkbox-${option.replace(/\s+/g, '-')}`}
              >
                {isSelected && <Check className="h-3.w-3 stroke-[3]" />}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// 3. TRUE / FALSE SIMULATION
function TrueFalseSim({ question, currentAnswer, onChangeAnswer, showFeedback }: QuestionSimulationProps) {
  const choices = ["Đúng", "Sai"];

  return (
    <div className="grid grid-cols-2 gap-4" id={`true-false-container-${question.id}`}>
      {choices.map((choice) => {
        const isSelected = currentAnswer === choice;
        const isCorrectOption = choice === question.correctSingle;

        let tfStyles = "border border-gray-200 bg-white hover:bg-gray-50 text-gray-800";
        if (isSelected) {
          tfStyles = choice === "Đúng" 
            ? "border-2 border-emerald-600 bg-emerald-50 text-emerald-950"
            : "border-2 border-rose-600 bg-rose-50 text-rose-950";
        }

        if (showFeedback) {
          if (isCorrectOption) {
            tfStyles = "border-2 border-green-500 bg-green-50 text-green-950";
          } else if (isSelected && !isCorrectOption) {
            tfStyles = "border-2 border-red-500 bg-red-50 text-red-950";
          }
        }

        return (
          <button
            key={choice}
            id={`tf-btn-${choice}`}
            type="button"
            className={`p-6 rounded-xl text-center text-lg font-bold transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${tfStyles}`}
            onClick={() => !showFeedback && onChangeAnswer(choice)}
            disabled={showFeedback}
          >
            {choice}
          </button>
        );
      })}
    </div>
  );
}

// 4. MATCHING SIMULATION
function MatchingSim({ question, currentAnswer = {}, onChangeAnswer, showFeedback }: QuestionSimulationProps) {
  const pairs = question.matchingPairs || [];
  
  // Static lists for left side and right side options
  const lefts = pairs.map((p) => p.left);
  const rights = Array.from(new Set(pairs.map((p) => p.right)));

  const handleSelection = (left: string, rightVal: string) => {
    if (showFeedback) return;
    const updated = {
      ...(currentAnswer as Record<string, string> || {}),
      [left]: rightVal,
    };
    onChangeAnswer(updated);
  };

  return (
    <div className="space-y-4" id={`matching-container-${question.id}`}>
      <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex items-center space-x-2 text-xs text-gray-600">
        <HelpCircle className="h-4 w-4 text-indigo-500 shrink-0" />
        <span>Hãy liên kết mỗi mục ở cột bên Trái với phân loại chính xác ở cột bên Phải bằng cách chọn từ hộp thả xuống.</span>
      </div>

      <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden bg-white">
        {lefts.map((left, index) => {
          const matchedValue = (currentAnswer as Record<string, string> || {})[left] || "";
          const correctRight = pairs.find((p) => p.left === left)?.right;
          const isCorrect = matchedValue === correctRight;

          return (
            <div
              key={left}
              id={`matching-row-${index}`}
              className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                showFeedback
                  ? isCorrect
                    ? "bg-green-50/25"
                    : "bg-red-50/25"
                  : "hover:bg-gray-50/50"
              }`}
            >
              <div className="flex-1 font-semibold text-gray-800 text-sm md:text-base">
                {left}
              </div>
              
              <div className="flex items-center space-x-3 shrink-0">
                <div className="text-gray-400">
                  <MoveHorizontal className="h-4 w-4 hidden md:block" />
                </div>
                
                <div className="relative">
                  <select
                    id={`match-select-${index}`}
                    value={matchedValue}
                    onChange={(e) => handleSelection(left, e.target.value)}
                    disabled={showFeedback}
                    className={`w-56 text-sm px-3 py-2 rounded-lg border bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      showFeedback
                        ? isCorrect
                          ? "border-green-500 text-green-900 bg-green-50"
                          : "border-red-400 text-red-950 bg-red-50"
                        : "border-gray-300 text-gray-700"
                    }`}
                  >
                    <option value="">-- Chọn đáp án ghép --</option>
                    {rights.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                {showFeedback && (
                  <div className="shrink-0">
                    {isCorrect ? (
                      <span className="inline-flex items-center px-2 py-1 rounded bg-green-100 text-green-800 text-xs font-bold gap-1" id="matching-correct-tag">
                        <Check className="h-3 w-3" /> Đúng
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded bg-red-100 text-red-800 text-xs font-bold gap-1" id="matching-wrong-tag">
                        <X className="h-3 w-3" /> Sai (Đáp án: {correctRight})
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 5. DRAG AND DROP SIMULATION
function DragAndDropSim({ question, currentAnswer = {}, onChangeAnswer, showFeedback }: QuestionSimulationProps) {
  const items = question.dragItems || [];
  const targets = question.dragTargets || [];

  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  // User click on a word pool item
  const handleWordSelect = (word: string) => {
    if (showFeedback) return;
    setSelectedWord(selectedWord === word ? null : word);
  };

  // Place selected word into target placeholder slot
  const handlePlaceWord = (targetIndex: number) => {
    if (showFeedback || !selectedWord) return;
    
    // Check if word is already placed elsewhere, clear it
    const updated = { ...(currentAnswer as Record<number, string> || {}) };
    Object.keys(updated).forEach((key) => {
      if (updated[Number(key)] === selectedWord) {
        delete updated[Number(key)];
      }
    });

    updated[targetIndex] = selectedWord;
    onChangeAnswer(updated);
    setSelectedWord(null);
  };

  const handleClearTarget = (targetIndex: number) => {
    if (showFeedback) return;
    const updated = { ...(currentAnswer as Record<number, string> || {}) };
    delete updated[targetIndex];
    onChangeAnswer(updated);
  };

  // Check if item is currently assigned
  const assignedWords = Object.values(currentAnswer as Record<number, string> || {});

  return (
    <div className="space-y-6" id={`drag-drop-container-${question.id}`}>
      <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 text-xs text-indigo-950">
        💡 <strong>Hướng dẫn thực hành:</strong> Click chọn một mục từ <strong>Danh sách đáp án</strong> bên dưới, sau đó click vào <strong>Hộp thả trống</strong> thích hợp để ghép đối tượng vào sơ đồ.
      </div>

      {/* DRAG ITEMS / WORD POOL */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Danh sách đáp án:</h4>
        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl min-h-12 items-center">
          {items.map((item) => {
            const isAssigned = assignedWords.includes(item);
            const isSelected = selectedWord === item;

            return (
              <button
                key={item}
                id={`drag-item-${item.slice(0,10).replace(/\s+/g, '-')}`}
                type="button"
                onClick={() => handleWordSelect(item)}
                disabled={showFeedback || isAssigned}
                className={`px-3 py-2 text-xs font-medium rounded-lg border cursor-pointer transition-all ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-600 text-white shadow-md scale-105"
                    : isAssigned
                    ? "opacity-30 border-gray-200 bg-gray-100 text-gray-400 pointer-events-none"
                    : "border-gray-200 bg-white hover:bg-gray-100 hover:border-gray-300 text-gray-700"
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      {/* DRAG TARGETS */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Đặt vào đúng mục:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {targets.map((target, index) => {
            const placedWord = (currentAnswer as Record<number, string> || {})[index];
            const isCorrect = placedWord === target.expectedItem;

            return (
              <div
                key={target.placeholder}
                id={`drop-target-box-${index}`}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  showFeedback
                    ? isCorrect
                      ? "border-green-500 bg-green-50/50"
                      : "border-red-400 bg-red-50/50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="text-xs font-bold text-gray-500 mb-2">
                  Phân mục: <span className="text-gray-800">{target.placeholder}</span>
                </div>

                <div className="relative">
                  {placedWord ? (
                    <div className="flex items-center justify-between p-2 rounded-lg border border-indigo-200 bg-indigo-50/30 text-indigo-950 font-medium text-xs">
                      <span>{placedWord}</span>
                      {!showFeedback && (
                        <button
                          id={`clear-target-${index}`}
                          type="button"
                          onClick={() => handleClearTarget(index)}
                          className="p-1 text-gray-400 hover:text-gray-600 bg-white rounded shadow-sm cursor-pointer"
                        >
                          <X className="h-3.h-3" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      id={`place-btn-${index}`}
                      type="button"
                      onClick={() => handlePlaceWord(index)}
                      className={`w-full py-4 px-3 border border-dashed rounded-lg flex items-center justify-center text-xs font-medium cursor-pointer transition-all ${
                        selectedWord
                          ? "border-indigo-500 bg-indigo-50/30 text-indigo-600 font-bold animate-pulse"
                          : "border-gray-300 bg-gray-50 text-gray-400 hover:bg-gray-100"
                      }`}
                    >
                      {selectedWord ? "Nhấp vào đây để Đặt" : "[ Trống - Chọn đáp án ở trên ]"}
                    </button>
                  )}
                </div>

                {showFeedback && (
                  <div className="mt-2 text-xs">
                    {isCorrect ? (
                      <span className="text-green-600 font-semibold flex items-center gap-1" id={`correct-drag-${index}`}>
                        <Check className="h-3 w-3" /> Đúng mục
                      </span>
                    ) : (
                      <span className="text-red-600 font-semibold" id={`wrong-drag-${index}`}>
                        ⚠️ Sai mục (Đáp án đúng: <span className="italic">{target.expectedItem}</span>)
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// 6. HOTSPOT QUESTION SIMULATION
function HotspotSim({ question, currentAnswer, onChangeAnswer, showFeedback }: QuestionSimulationProps) {
  const hotspots = question.hotspots || [];

  const handleImgClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (showFeedback) return;
    
    const container = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - container.left;
    const clickY = e.clientY - container.top;
    
    // Convert click point to percentages so it scales properly
    const pctX = (clickX / container.width) * 100;
    const pctY = (clickY / container.height) * 100;

    // Detect if click falls inside any predefined hotspots
    const hit = hotspots.find((spot) => {
      // spot.x, spot.y, spot.width, spot.height are percentages of the layout
      return (
        pctX >= spot.x &&
        pctX <= spot.x + spot.width &&
        pctY >= spot.y &&
        pctY <= spot.y + spot.height
      );
    });

    if (hit) {
      onChangeAnswer(hit.id);
    } else {
      // Custom coordinate marker for generic click feedback if missed any predefined areas
      onChangeAnswer({ customX: pctX, customY: pctY });
    }
  };

  // Render overlay for hotspots when feedback is active, or target selection box
  const selectedId = typeof currentAnswer === "string" ? currentAnswer : null;
  const customCoord = typeof currentAnswer === "object" ? currentAnswer : null;

  return (
    <div className="space-y-4" id={`hotspot-container-${question.id}`}>
      <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-900 font-medium">
        🎯 <strong>Hotspot Task:</strong> Nhấp chuột trực tiếp lên giao diện ảnh phần mềm bên dưới để thực thi thao tác chọn vị trí được yêu cầu.
      </div>

      <div className="text-sm font-bold text-gray-700 bg-gray-100 p-2 rounded-lg inline-flex items-center gap-1">
        <MapPin className="h-4 w-4 text-rose-500" />
        Vị trí đã chọn:{" "}
        <span className="text-indigo-600 ml-1">
          {selectedId
            ? hotspots.find((h) => h.id === selectedId)?.name
            : customCoord
            ? `Tọa độ tự do (X: ${Math.round(customCoord.customX)}%, Y: ${Math.round(customCoord.customY)}%)`
            : "Chưa chọn vùng"}
        </span>
      </div>

      <div className="relative border-2 border-gray-200 rounded-xl overflow-hidden shadow bg-slate-900 inline-block w-full max-w-[800px]">
        {/* INTERACTIVE MOCK BOARD */}
        {/* Using a custom drawn UI or picsum placeholder */}
        <div
          onClick={handleImgClick}
          className={`relative cursor-crosshair select-none overflow-hidden ${showFeedback ? "pointer-events-none" : ""}`}
          style={{ aspectRatio: "800/300" }}
          id="hotspot-img-canvas"
        >
          {/* MOCK OFFICE INTERFACE DRAWN WITH TAILWIND FOR THE EXPERT EXAM SUITE */}
          <div className="absolute inset-0 bg-[#f3f2f1] flex flex-col font-sans">
            {/* Quick Access Toolbar */}
            <div className="h-10 bg-[#185abd] text-white flex items-center px-4 justify-between border-b border-gray-300">
              <div className="flex items-center space-x-4">
                {/* Save Icon Simulation */}
                <div 
                  className={`p-1.5 rounded cursor-pointer transition ${selectedId === "save" ? "bg-indigo-700 ring-2 ring-white" : "hover:bg-indigo-700"}`}
                  style={{ width: "32px", height: "30px" }}
                >
                  {/* HDD icon shape */}
                  <div className="w-5 h-5 border-2 border-white rounded-sm mx-auto relative flex items-center justify-center">
                    <div className="absolute top-0 w-2.h-2 bg-white" />
                  </div>
                </div>
                <div className="text-xs font-semibold opacity-85">KỳThi_IC3.docx - Word</div>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-3 h-3 border border-white" />
                <div className="text-lg font-bold">×</div>
              </div>
            </div>

            {/* Ribbon Tab Menus */}
            <div className="h-8 bg-white border-b border-gray-200 flex items-center px-4 space-x-6 text-xs text-gray-700 font-medium">
              <span className="text-indigo-600 border-b-2 border-indigo-600 pb-1.h-1">Tệp tin</span>
              <span>Trang chủ (Home)</span>
              <span>Chèn (Insert)</span>
              <span>Bố trí trang (Layout)</span>
              <span>Tham chiếu (References)</span>
            </div>

            {/* Ribbon Body containing font settings */}
            <div className="h-16 bg-[#f3f2f1] border-b border-gray-300 flex items-center px-4 space-x-4">
              <div className="bg-white px-2 py-1.h-1 border border-gray-300 rounded flex items-center space-x-1 text-xs">
                <span className="font-semibold text-gray-700">Segoe UI</span>
                <span className="text-gray-400">▼</span>
              </div>
              <div className="bg-white px-2 py-1.h-1 border border-gray-300 rounded text-xs">
                <span>11</span>
              </div>
              {/* Bold control icon simulation */}
              <div 
                className={`p-1.5 rounded cursor-pointer border transition font-bold text-sm select-none ${selectedId === "bold" ? "bg-indigo-100 border-indigo-400 text-indigo-700 font-black" : "bg-white border-gray-300 hover:bg-gray-100"}`}
                style={{ width: "30px", height: "30px" }}
              >
                B
              </div>
              <div className="italic font-serif w-8 h-8 border bg-white rounded flex items-center justify-center text-xs text-gray-600 cursor-default">I</div>
              <div className="underline w-8 h-8 border bg-white rounded flex items-center justify-center text-xs text-gray-600 cursor-default">U</div>
            </div>

            {/* Simulated Blank Document Canvas containing text */}
            <div className="flex-1 bg-white p-6 shadow-inner text-left">
              <p className="text-lg font-bold text-gray-800 border-b pb-2 mb-2">ĐỀ THI IC3 - MICROSOFT WORD SIMULATOR</p>
              <p className="text-xs text-gray-500 leading-normal">
                Để giải quyết nhiệm vụ bấm chọn nút &apos;Save&apos; (Lưu tài liệu), hãy nhấp chọn biểu tượng đĩa mềm nằm ở thanh công cụ phía trên góc trái.
              </p>
            </div>
          </div>

          {/* REAL TIME MARKER RING */}
          {selectedId && (
            (() => {
              const spot = hotspots.find((h) => h.id === selectedId);
              if (!spot) return null;
              return (
                <div
                  id="selection-coordinate-ring"
                  className={`absolute rounded-full border-4 animate-ping-once transition-all flex items-center justify-center ${
                    showFeedback
                      ? spot.isCorrect
                        ? "border-green-500 bg-green-500/20"
                        : "border-red-500 bg-red-500/20"
                      : "border-indigo-600 bg-indigo-600/25"
                  }`}
                  style={{
                    left: `${spot.x}%`,
                    top: `${spot.y}%`,
                    width: `${spot.width}%`,
                    height: `${spot.height}%`,
                    transform: "translate(-1%, -1%)",
                  }}
                >
                  <span className="bg-white border border-gray-300 text-xs text-gray-800 px-1 py-0.5 rounded shadow absolute top-full mt-1 whitespace-nowrap font-bold">
                    {spot.name}
                  </span>
                </div>
              );
            })()
          )}

          {customCoord && (
            <div
              id="custom-coord-marker"
              className="absolute w-8 h-8 rounded-full border-4 border-rose-500 bg-rose-500/25 flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${customCoord.customX}%`,
                top: `${customCoord.customY}%`,
              }}
            >
              <div className="w-2 h-2 bg-rose-600 rounded-full" />
            </div>
          )}

          {/* SHOW FEEDBACK PATHWAYS OVERLAYS */}
          {showFeedback &&
            hotspots.map((spot) => (
              <div
                key={spot.id}
                id={`feedback-heatmap-${spot.id}`}
                className={`absolute rounded border-2 dev-only ${
                  spot.isCorrect
                    ? "border-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/25"
                    : "border-red-400 bg-red-400/10 hover:bg-red-400/25"
                }`}
                style={{
                  left: `${spot.x}%`,
                  top: `${spot.y}%`,
                  width: `${spot.width}%`,
                  height: `${spot.height}%`,
                }}
                title={`${spot.name} (${spot.isCorrect ? "Đúng" : "Sai"})`}
              />
            ))}
        </div>
      </div>
    </div>
  );
}

// 7. PERFORMANCE-BASED QUESTION SIMULATION
function PerformanceSim({ question, currentAnswer, onChangeAnswer, showFeedback }: QuestionSimulationProps) {
  const task = question.performanceTask;

  // React state reflecting the current mini OS Virtual Sandbox File Explorer or Object Canvas!
  const [folders, setFolders] = useState<string[]>(task?.initialState?.folders || []);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!task) return;
    // If the student already answered this, recover state from their submission
    if (currentAnswer && currentAnswer.folders) {
      setTimeout(() => {
        setFolders(currentAnswer.folders);
      }, 0);
    } else {
      setTimeout(() => {
        setFolders(task.initialState.folders || []);
      }, 0);
    }
  }, [currentAnswer, task]);

  if (!task) return null;

  const triggerStateChange = (updatedFolders: string[]) => {
    setFolders(updatedFolders);
    onChangeAnswer({ folders: updatedFolders });
  };

  const handleCreateFolder = () => {
    if (showFeedback) return;
    setIsCreating(true);
    setNewFolderName("New Folder");
  };

  const handleSaveNewFolder = () => {
    const trimmed = newFolderName.trim();
    if (!trimmed) {
      setIsCreating(false);
      return;
    }
    const updated = [...folders, trimmed];
    triggerStateChange(updated);
    setIsCreating(false);
  };

  const handleStartEdit = (index: number) => {
    if (showFeedback) return;
    setEditingIndex(index);
    setNewFolderName(folders[index]);
  };

  const handleSaveEdit = (index: number) => {
    const trimmed = newFolderName.trim();
    if (!trimmed) {
      setEditingIndex(null);
      return;
    }
    const updated = [...folders];
    updated[index] = trimmed;
    triggerStateChange(updated);
    setEditingIndex(null);
  };

  const handleDeleteFolder = (index: number) => {
    if (showFeedback) return;
    const updated = folders.filter((_, i) => i !== index);
    triggerStateChange(updated);
  };

  // Determine standard result matching expectedState
  const expectedFolders = task.expectedState.folders as string[];
  const isCurrentlyCorrect = expectedFolders.every((fol) => folders.includes(fol)) && folders.length === expectedFolders.length;

  return (
    <div className="space-y-4" id={`performance-sandbox-${question.id}`}>
      <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 text-xs text-emerald-950">
        💻 <strong>Bài thi thao tác thực hành:</strong> Hãy trực tiếp sử dụng các nút chức năng trên màn hình máy chủ giả lập Windows Explorer phía dưới để đáp ứng nhiệm vụ yêu cầu.
      </div>

      <div className="border border-gray-300 rounded-xl overflow-hidden shadow-sm bg-[#faf9f8]">
        {/* TOP WINDOW TITLE BAR */}
        <div className="h-10 bg-slate-800 text-white flex items-center px-4 justify-between font-mono text-xs select-none">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-red-500 rounded-full inline-block" />
            <span className="w-3 h-3 bg-yellow-500 rounded-full inline-block" />
            <span className="w-3 h-3 bg-green-500 rounded-full inline-block" />
            <span className="text-gray-300 font-bold ml-2">Windows Explorer (Ổ ảo: study_lab://C/IC3_STUDY)</span>
          </div>
          <div className="text-emerald-400 font-bold">● VIRTUAL SIMULATOR RUNNING</div>
        </div>

        {/* EXPLORER ACTION UTILITY MENU */}
        <div className="p-3 bg-white border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              id="new-folder-action-btn"
              type="button"
              onClick={handleCreateFolder}
              disabled={showFeedback}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:bg-gray-400 disabled:pointer-events-none"
            >
              <FolderPlus className="h-4 w-4" />
              Tạo Thư mục mới (New Folder)
            </button>
          </div>

          <div className="text-xs text-gray-500 font-medium">
            Mục hiện tại: <span className="font-bold text-gray-700 font-mono">{folders.length} items</span>
          </div>
        </div>

        {/* FILE CONTAINER WINDOW CABINET */}
        <div className="p-6 min-h-[180px] bg-white grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {folders.map((folder, index) => {
            const isEditing = editingIndex === index;

            return (
              <div
                key={`${folder}-${index}`}
                className="group relative p-3 border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/20 rounded-xl flex flex-col items-center justify-center text-center transition"
              >
                <div className="w-12 h-10 bg-amber-400 rounded-md relative flex items-end justify-center shadow-sm select-none">
                  {/* Folder icon tab */}
                  <div className="absolute top-[-3px] left-0 w-5 h-2 bg-amber-500 rounded-t" />
                </div>

                <div className="mt-2 w-full">
                  {isEditing ? (
                    <div className="flex flex-col gap-1">
                      <input
                        id={`edit-folder-input-${index}`}
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onBlur={() => handleSaveEdit(index)}
                        onKeyDown={(e) => e.key === "Enter" && handleSaveEdit(index)}
                        autoFocus
                        className="w-full text-center text-xs border border-indigo-500 rounded px-1 py-0.5 bg-white outline-none font-bold"
                      />
                      <button
                        id={`save-folder-btn-${index}`}
                        type="button"
                        onClick={() => handleSaveEdit(index)}
                        className="text-[10px] bg-indigo-600 text-white py-0.5 px-1.5 rounded"
                      >
                        Lưu
                      </button>
                    </div>
                  ) : (
                    <span
                      id={`folder-label-${index}`}
                      onClick={() => handleStartEdit(index)}
                      className="text-xs font-semibold text-gray-700 cursor-pointer hover:underline truncate block w-full px-1"
                      title="Nhấn để đổi tên"
                    >
                      {folder}
                    </span>
                  )}
                </div>

                {/* Hover control deletes for realistic simulation */}
                {!showFeedback && !isEditing && (
                  <button
                    id={`delete-folder-${index}`}
                    type="button"
                    onClick={() => handleDeleteFolder(index)}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-rose-500 text-white rounded-full p-0.5 hover:bg-rose-600 transition shadow-sm cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}

          {/* SIMULATED NEW FOLDER INPUT ROW */}
          {isCreating && (
            <div className="p-3 border-2 border-dashed border-indigo-400 bg-indigo-50/10 rounded-xl flex flex-col items-center justify-center text-center">
              <div className="w-12 h-10 bg-amber-200 rounded-md relative flex items-end justify-center shadow-sm select-none">
                <div className="absolute top-[-3px] left-0 w-5 h-2 bg-amber-300 rounded-t" />
              </div>
              <div className="mt-2 flex flex-col gap-1 w-full">
                <input
                  id="new-folder-input"
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onBlur={handleSaveNewFolder}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveNewFolder()}
                  autoFocus
                  className="w-full text-center text-xs border border-indigo-500 rounded px-1 py-0.5 bg-white outline-none font-bold"
                />
                <button
                  id="save-new-folder-btn"
                  type="button"
                  onClick={handleSaveNewFolder}
                  className="text-[10px] bg-green-600 text-white py-0.5 px-1.5 rounded"
                >
                  Tạo mới
                </button>
              </div>
            </div>
          )}
        </div>

        {/* STATUS FOOTER COMPLETED GRADING */}
        <div className="px-4 py-2 bg-slate-100 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
          <span>Trạng thái: Máy chủ ảo đã được đồng bộ với biểu khảo thí.</span>
          {showFeedback && (
            <div id="performance-feedback-badge">
              {isCurrentlyCorrect ? (
                <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded font-bold flex items-center gap-1">
                  <Check className="h-3 w-3" /> Nhiệm vụ hoàn thành xuất sắc!
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded font-bold">
                  ⚠️ Thao tác chưa hoàn chỉnh. Thiếu thư mục: {expectedFolders.filter(f => !folders.includes(f)).join(", ") || "Dư thừa đối tượng"}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 8. VIDEO-BASED QUESTION SIMULATION
function VideoSim({ question, currentAnswer, onChangeAnswer, showFeedback }: QuestionSimulationProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [watchCount, setWatchCount] = useState(0);

  // Auto animation simulated reader for the video logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            setWatchCount((c) => c + 1);
            return 100;
          }
          return prev + 5;
        });
      }, 350);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  const handlePlayToggle = () => {
    if (progress >= 100) {
      setProgress(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleRewind = () => {
    setProgress(0);
    setIsPlaying(false);
  };

  return (
    <div className="space-y-4" id={`video-simulation-${question.id}`}>
      {/* simulated premium video segment */}
      <p className="text-xs text-gray-400 font-medium">
        * Quy định: Học viên xem hết hoạt ảnh minh họa công nghệ trước khi làm bài thi.
      </p>

      <div className="border border-slate-300 bg-slate-950 rounded-xl overflow-hidden max-w-[700px] shadow-lg relative">
        <div className="aspect-video w-full flex flex-col justify-between p-4 relative text-white">
          {/* BACKGROUND ANIMATED DECORATION GIVING THE COSMIC VIDEO VIBE */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 to-slate-900/40 z-0 pointer-events-none" />
          
          {/* VIDEO HEADER */}
          <div className="z-10 flex items-center justify-between text-[11px] uppercase tracking-wider text-indigo-200">
            <span>Video Bài giảng IC3</span>
            <span>Chủ đề: Xác thực hai lớp (2FA) & OTP</span>
          </div>

          {/* INNER VIDEO GRAPHIC ANIMATION */}
          <div className="z-10 flex-1 flex flex-col items-center justify-center p-4">
            {progress < 25 && (
              <div className="text-center space-y-2" id="scene-1">
                <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mx-auto text-xl border border-indigo-400">🔑</div>
                <p className="text-sm font-semibold">Bước 1: Người dùng đăng nhập bằng Mật khẩu tĩnh thông thường</p>
              </div>
            )}
            {progress >= 25 && progress < 60 && (
              <div className="text-center space-y-2" id="scene-2">
                <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto text-xl border border-amber-400">📱</div>
                <p className="text-sm font-semibold text-amber-200">Bước 2: Hệ thống gửi mã khóa liên kết OTP ngẫu nhiên về điện thoại di động</p>
              </div>
            )}
            {progress >= 60 && progress < 95 && (
              <div className="text-center space-y-2 transition" id="scene-3">
                <div className="w-16 h-16 bg-teal-500/20 text-teal-400 rounded-full flex items-center justify-center mx-auto text-xl border border-teal-400">🛡️</div>
                <p className="text-sm font-semibold text-teal-200">Bước 3: Nhập mã OTP chính xác để mở khóa tài khoản an toàn tuyệt đối</p>
              </div>
            )}
            {progress >= 95 && (
              <div className="text-center space-y-2" id="scene-4">
                <div className="w-16 h-16 bg-green-500 border border-green-400 rounded-full flex items-center justify-center mx-auto text-2xl">✓</div>
                <p className="text-sm font-bold text-green-300">Hoạt ảnh kết thúc - Kênh bảo vệ an toàn 2 lớp đã được tối ưu hóa!</p>
              </div>
            )}
          </div>

          {/* VIDEO CONTROLS */}
          <div className="z-10 bg-slate-900/90 rounded-lg p-2 flex items-center justify-between text-xs mt-auto">
            <div className="flex items-center space-x-3">
              <button
                id="video-play-btn"
                type="button"
                onClick={handlePlayToggle}
                className="p-1.5 bg-indigo-600 rounded-md text-white hover:bg-indigo-700 cursor-pointer"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <button
                id="video-rewind-btn"
                type="button"
                onClick={handleRewind}
                className="p-1 text-gray-400 hover:text-white cursor-pointer"
                title="Xem lại từ đầu"
              >
                <RotateCw className="h-4 w-4" />
              </button>
            </div>

            {/* Simulated progress slider bar */}
            <div className="flex-1 mx-4 relative">
              <div className="w-full bg-slate-700 h-2 rounded overflow-hidden">
                <div className="bg-indigo-500 h-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="font-mono text-[10px] text-gray-300 shrink-0 select-none">
              {progress < 100 ? `${Math.round(progress / 10)}s / 10s` : "Hoàn thành ✓"}
            </div>
          </div>
        </div>
      </div>

      <div className="border border-indigo-100 bg-indigo-50/20 rounded-xl p-4 mt-4 space-y-3">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Câu hỏi liên kết với Video:
        </h4>
        <SingleChoiceSim
          question={question}
          currentAnswer={currentAnswer}
          onChangeAnswer={onChangeAnswer}
          showFeedback={showFeedback}
        />
      </div>
    </div>
  );
}
