import React, { useState, useEffect } from "react";
import { PlayerState } from "../types";
import { 
  BrainCircuit, 
  Loader2, 
  Sparkles, 
  AlertTriangle, 
  Lightbulb, 
  Trophy, 
  Target, 
  BookOpen, 
  HelpCircle, 
  CheckCircle, 
  ChevronRight, 
  BookMarked,
  ArrowRight,
  GraduationCap,
  MessageSquare,
  Wand2,
  Zap
} from "lucide-react";
import { analyzeTutor, companionAction as doCompanionAction } from "../utils/gemini";
import { motion, AnimatePresence } from "motion/react";

interface TutorProps {
  playerState: PlayerState;
}

interface TutorReport {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  xpTierName: string;
}

const QUICK_SUBJECTS = [
  { name: "Toán học", icon: "📐", color: "from-blue-600 to-indigo-600" },
  { name: "Vật lý", icon: "⚡", color: "from-amber-500 to-orange-600" },
  { name: "Hóa học", icon: "🧪", color: "from-teal-500 to-emerald-600" },
  { name: "Sinh học", icon: "🧬", color: "from-emerald-600 to-green-700" },
  { name: "Lịch sử", icon: "⚔️", color: "from-red-600 to-rose-700" },
  { name: "Địa lý", icon: "🗺️", color: "from-cyan-500 to-blue-600" },
  { name: "Ngữ văn", icon: "✍️", color: "from-purple-500 to-pink-600" },
  { name: "Ngoại ngữ", icon: "🗣️", color: "from-indigo-600 to-purple-700" },
];

export default function Tutor({ playerState }: TutorProps) {
  // Tab control: "analysis" | "companion"
  const [activeTab, setActiveTab] = useState<"analysis" | "companion">("companion");
  
  // Analytics State
  const [loadingAnalysis, setLoadingAnalysis] = useState<boolean>(false);
  const [report, setReport] = useState<TutorReport | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Companion State
  const [selectedSubject, setSelectedSubject] = useState<string>("Toán học");
  const [companionAction, setCompanionAction] = useState<"suggest_questions" | "correct_homework" | "ask_question">("suggest_questions");
  const [homeworkText, setHomeworkText] = useState<string>("");
  const [generalQuestion, setGeneralQuestion] = useState<string>("");
  const [companionReply, setCompanionReply] = useState<string | null>(null);
  const [loadingCompanion, setLoadingCompanion] = useState<boolean>(false);
  const [companionError, setCompanionError] = useState<string | null>(null);

  const historyLength = playerState.history.length;
  const correctCount = playerState.history.filter((h) => h.isCorrect).length;
  const accuracy = historyLength > 0 ? Math.round((correctCount / historyLength) * 100) : 0;

  // Fetch standard report analysis
  const fetchTutorAnalysis = async () => {
    if (historyLength === 0) return;
    setLoadingAnalysis(true);
    setAnalysisError(null);
    try {
      const data = await analyzeTutor({ history: playerState.history });
      setReport(data);
    } catch (err: any) {
      console.error(err);
      setAnalysisError(err.message || "Đã xảy ra lỗi trong quá trình liên lạc với Pháp Sư AI.");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  useEffect(() => {
    if (historyLength > 0 && !report) {
      fetchTutorAnalysis();
    }
  }, [historyLength]);

  // Request interactive companion service (suggest questions, correct homework, general chat)
  const handleCompanionCall = async (actionOverride?: "suggest_questions" | "correct_homework" | "ask_question", payloadQuery?: string) => {
    setLoadingCompanion(true);
    setCompanionError(null);
    setCompanionReply(null);
    
    const finalAction = actionOverride || companionAction;
    let query = "";
    if (finalAction === "correct_homework") {
      query = payloadQuery || homeworkText;
      if (!query.trim()) {
        setCompanionError("Vui lòng nhập đề bài hoặc bài giải của bạn để Pháp Sư sửa bài.");
        setLoadingCompanion(false);
        return;
      }
    } else if (finalAction === "ask_question") {
      query = payloadQuery || generalQuestion;
      if (!query.trim()) {
        setCompanionError("Vui lòng nhập câu hỏi thắc mắc của bạn.");
        setLoadingCompanion(false);
        return;
      }
    }

    try {
      const data = await doCompanionAction({
        action: finalAction,
        subject: selectedSubject,
        query: query,
        history: playerState.history,
      });

      setCompanionReply(data.reply);
    } catch (err: any) {
      console.error(err);
      setCompanionError(err.message || "Xảy ra lỗi khi triệu hồi thần chỉ Gia Sư AI.");
    } finally {
      setLoadingCompanion(false);
    }
  };

  // Helper template button click
  const triggerQuickTemplate = async (action: "correct_homework" | "ask_question", text: string) => {
    setCompanionAction(action);
    if (action === "correct_homework") {
      setHomeworkText(text);
    } else {
      setGeneralQuestion(text);
    }
    await handleCompanionCall(action, text);
  };

  // Beautiful custom parser for AI responses (handling markdown headers, bullet points, numbers, bold)
  const parseAndFormatResponse = (text: string | null) => {
    if (!text) return null;
    const lines = text.split("\n");
    return lines.map((line, index) => {
      let trimmed = line.trim();
      if (!trimmed) return <div key={index} className="h-2" />;

      // Headers
      if (trimmed.startsWith("### ")) {
        return (
          <h5 key={index} className="text-sm font-bold text-indigo-300 mt-4 mb-2 font-display">
            {trimmed.slice(4)}
          </h5>
        );
      }
      if (trimmed.startsWith("## ")) {
        return (
          <h4 key={index} className="text-md font-bold text-amber-400 mt-5 mb-2.5 font-display border-b border-slate-750 pb-1">
            {trimmed.slice(3)}
          </h4>
        );
      }
      if (trimmed.startsWith("# ")) {
        return (
          <h3 key={index} className="text-lg font-bold text-white mt-6 mb-3 font-display border-b-2 border-amber-500/20 pb-1.5 flex items-center gap-2">
            ✨ {trimmed.slice(2)}
          </h3>
        );
      }

      // Bullets
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        return (
          <div key={index} className="flex gap-2 text-xs text-slate-300 ml-4 my-1.5 items-start">
            <span className="text-amber-500 mt-1 flex-shrink-0">•</span>
            <span>{replaceBoldText(trimmed.slice(2))}</span>
          </div>
        );
      }

      // Numbered List
      const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
      if (numMatch) {
        return (
          <div key={index} className="flex gap-2 text-xs text-slate-300 ml-4 my-2 items-start">
            <span className="font-mono text-amber-500 font-bold flex-shrink-0">{numMatch[1]}.</span>
            <span>{replaceBoldText(numMatch[2])}</span>
          </div>
        );
      }

      // Paragraph
      return (
        <p key={index} className="text-xs text-slate-300 leading-relaxed my-2">
          {replaceBoldText(trimmed)}
        </p>
      );
    });
  };

  const replaceBoldText = (text: string) => {
    const parts = text.split(/\*\*([\s\S]*?)\*\*/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className="font-bold text-amber-300">{part}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="max-w-5xl mx-auto py-4 px-4">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold font-sans tracking-tight text-white flex items-center gap-2">
            <BrainCircuit className="text-purple-400 animate-pulse" /> Đền Thờ Tiên Tri Học Thuật
          </h2>
          <p className="text-gray-400 text-sm">
            Nơi Đại Pháp Sư Gia Sư AI soi sáng lá số học lực, cung cấp câu hỏi luyện công và giải đáp mọi phép toán lý hóa văn sử.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-700 self-start md:self-auto">
          <button
            onClick={() => setActiveTab("companion")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
              activeTab === "companion"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/15"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Wand2 size={13} /> Khởi Linh Gia Sư
          </button>
          <button
            onClick={() => setActiveTab("analysis")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
              activeTab === "analysis"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/15"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Target size={13} /> Lá Số Học Lực ({historyLength})
          </button>
        </div>
      </div>

      {/* Interactive AI Companion Tab */}
      {activeTab === "companion" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Panel */}
          <div className="lg:col-span-5 bg-[#1E293B] border-4 border-[#334155] rounded-[32px] p-6 shadow-xl flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center text-xl text-purple-400">
                🔮
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Pháp Thuật Hỗ Trợ</h3>
                <p className="text-[10px] text-gray-500 font-mono">Chọn tính năng học thuật của Đại Pháp Sư</p>
              </div>
            </div>

            {/* Action Select Buttons */}
            <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => {
                  setCompanionAction("suggest_questions");
                  setCompanionReply(null);
                  setCompanionError(null);
                }}
                className={`py-2 px-1 rounded-lg text-[10px] font-bold text-center transition-all cursor-pointer ${
                  companionAction === "suggest_questions"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Gợi Ý Đề Bài
              </button>
              <button
                onClick={() => {
                  setCompanionAction("correct_homework");
                  setCompanionReply(null);
                  setCompanionError(null);
                }}
                className={`py-2 px-1 rounded-lg text-[10px] font-bold text-center transition-all cursor-pointer ${
                  companionAction === "correct_homework"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Sửa Bài Tập
              </button>
              <button
                onClick={() => {
                  setCompanionAction("ask_question");
                  setCompanionReply(null);
                  setCompanionError(null);
                }}
                className={`py-2 px-1 rounded-lg text-[10px] font-bold text-center transition-all cursor-pointer ${
                  companionAction === "ask_question"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Hỏi Đáp Tự Do
              </button>
            </div>

            {/* Input fields based on action */}
            <AnimatePresence mode="wait">
              {companionAction === "suggest_questions" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col gap-4"
                >
                  <div>
                    <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
                      Chọn Môn Học Thần Thánh
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {QUICK_SUBJECTS.map((subj) => (
                        <button
                          key={subj.name}
                          onClick={() => setSelectedSubject(subj.name)}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                            selectedSubject === subj.name
                              ? "bg-purple-600/20 border-purple-500 text-white shadow-md shadow-purple-600/5"
                              : "bg-slate-900/50 border-slate-800 text-gray-400 hover:border-slate-750 hover:text-gray-200"
                          }`}
                        >
                          <span className="text-base">{subj.icon}</span>
                          <span className="text-xs font-medium">{subj.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleCompanionCall()}
                    disabled={loadingCompanion}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all duration-300 shadow-md shadow-purple-500/10 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loadingCompanion ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Đại Pháp Sư Đang Thiết Kế Trận Pháp...
                      </>
                    ) : (
                      <>
                        <Wand2 size={16} /> Gợi Ý 3 Câu Hỏi Ôn Luyện
                      </>
                    )}
                  </button>
                </motion.div>
              )}

              {companionAction === "correct_homework" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col gap-4"
                >
                  <div>
                    <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1.5">
                      Đề bài & Bài giải của bạn
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Dán đề bài hoặc đoạn văn bài tập của bạn kèm lời giải (nếu có) để Pháp Sư rà soát lỗi sai..."
                      value={homeworkText}
                      onChange={(e) => setHomeworkText(e.target.value)}
                      className="w-full bg-slate-950 text-white p-3.5 rounded-xl border border-slate-800 focus:border-purple-500 outline-none text-xs leading-relaxed resize-none"
                    />
                  </div>

                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                    <span className="text-[10px] font-mono text-amber-500 uppercase font-bold block mb-1">💡 Đề xuất mẫu thử:</span>
                    <div className="flex flex-col gap-1.5">
                      <button
                        onClick={() => triggerQuickTemplate("correct_homework", "Đề bài: Giải phương trình 2x^2 - 5x + 2 = 0.\nLời giải của em: Delta = 25 - 4(2)(2) = 25 - 16 = 9. Căn delta = 3. Nghiệm x1 = (5+3)/2 = 4; x2 = (5-3)/2 = 1. Bài em làm đúng chưa ạ?")}
                        className="text-[10px] text-gray-400 hover:text-amber-400 text-left truncate cursor-pointer block hover:underline"
                      >
                        ⚡ Sửa bài toán phương trình bậc hai bị tính sai nghiệm
                      </button>
                      <button
                        onClick={() => triggerQuickTemplate("correct_homework", "Sửa lỗi chính tả & ngữ pháp câu tiếng Anh sau: 'He go to school yesterday and see an beautiful bird.'")}
                        className="text-[10px] text-gray-400 hover:text-amber-400 text-left truncate cursor-pointer block hover:underline"
                      >
                        ⚡ Sửa ngữ pháp câu tiếng Anh thì quá khứ
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCompanionCall()}
                    disabled={loadingCompanion}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all duration-300 shadow-md shadow-purple-500/10 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loadingCompanion ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Đang Phép Giải Bài Luyện...
                      </>
                    ) : (
                      <>
                        <Wand2 size={16} /> Luyện Hóa & Sửa Bài Tập
                      </>
                    )}
                  </button>
                </motion.div>
              )}

              {companionAction === "ask_question" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col gap-4"
                >
                  <div>
                    <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1.5">
                      Đặt câu hỏi học thuật tự do
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Nhập bất kỳ câu hỏi lý thuyết, thắc mắc công thức toán, lý hay phân tích văn học..."
                      value={generalQuestion}
                      onChange={(e) => setGeneralQuestion(e.target.value)}
                      className="w-full bg-slate-950 text-white p-3.5 rounded-xl border border-slate-800 focus:border-purple-500 outline-none text-xs leading-relaxed resize-none"
                    />
                  </div>

                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                    <span className="text-[10px] font-mono text-amber-500 uppercase font-bold block mb-1">💡 Gợi ý câu hỏi mẫu:</span>
                    <div className="flex flex-col gap-1.5">
                      <button
                        onClick={() => triggerQuickTemplate("ask_question", "Giải thích lực hướng tâm là gì và cho ví dụ trong thực tế đời sống.")}
                        className="text-[10px] text-gray-400 hover:text-amber-400 text-left truncate cursor-pointer block hover:underline"
                      >
                        🔮 Giải thích 'Lực Hướng Tâm' của Vật Lý
                      </button>
                      <button
                        onClick={() => triggerQuickTemplate("ask_question", "Làm thế nào để phân biệt liên kết ion và liên kết cộng hóa trị bằng ví dụ?")}
                        className="text-[10px] text-gray-400 hover:text-amber-400 text-left truncate cursor-pointer block hover:underline"
                      >
                        🔮 So sánh liên kết Ion vs Cộng Hóa Trị
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCompanionCall()}
                    disabled={loadingCompanion}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all duration-300 shadow-md shadow-purple-500/10 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loadingCompanion ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Đại Pháp Sư Đang Tra Cứu Thư Tịch...
                      </>
                    ) : (
                      <>
                        <MessageSquare size={16} /> Triệu Thỉnh Thần Chỉ Đáp Án
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Magical Output Scroll Panel */}
          <div className="lg:col-span-7 flex flex-col h-full min-h-[460px]">
            {loadingCompanion ? (
              <div className="flex-1 bg-slate-900/50 border-4 border-[#334155] rounded-[32px] p-8 flex flex-col items-center justify-center text-center gap-4 min-h-[420px] shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent animate-pulse" />
                <Loader2 className="w-14 h-14 text-purple-400 animate-spin" />
                <div>
                  <h4 className="text-lg font-bold text-white font-display">Đại Pháp Sư đang niệm chú...</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">Mật độ tinh thể Gemini đang giải mã các cổ thư tri thức để ban phát linh chỉ phù hợp.</p>
                </div>
              </div>
            ) : companionError ? (
              <div className="flex-1 bg-slate-900/50 border-4 border-rose-500/30 rounded-[32px] p-8 flex flex-col items-center justify-center text-center gap-3 min-h-[420px] shadow-2xl">
                <AlertTriangle className="text-rose-500 animate-bounce" size={40} />
                <h4 className="font-bold text-lg text-white font-display">Pháp Thuật Đứt Đoạn</h4>
                <p className="text-xs text-slate-300 max-w-sm">{companionError}</p>
                <button
                  onClick={() => handleCompanionCall()}
                  className="mt-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer"
                >
                  Niệm Lại Ma Pháp
                </button>
              </div>
            ) : companionReply ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 bg-gradient-to-b from-[#1E293B] to-[#0F172A] border-4 border-[#334155] rounded-[32px] p-6 shadow-2xl relative min-h-[420px] flex flex-col"
              >
                {/* Scroll Label */}
                <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📜</span>
                    <div>
                      <h4 className="font-bold text-sm text-amber-400 font-display">Cổ Thư Khởi Linh AI</h4>
                      <p className="text-[9px] text-gray-500 font-mono">Bản dịch ma pháp của Pháp Sư Grandis</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded uppercase">
                    Thần Lực Gemini 3.5
                  </span>
                </div>

                {/* Printable Scroll Content */}
                <div className="flex-1 overflow-y-auto max-h-[380px] pr-2 custom-scrollbar">
                  {parseAndFormatResponse(companionReply)}
                </div>

                {/* Decorative border */}
                <div className="mt-4 border-t border-slate-800 pt-3 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                  <span>*Bí kíp học tập gia truyền</span>
                  <span>Đã ghi chép hoàn tất</span>
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 bg-[#1E293B] border-4 border-[#334155] rounded-[32px] p-8 text-center flex flex-col items-center justify-center min-h-[420px] shadow-xl">
                <div className="w-20 h-20 bg-slate-800 border-2 border-purple-500/20 rounded-full flex items-center justify-center text-4xl mb-4 shadow-inner">
                  🧙‍♀️
                </div>
                <h3 className="text-base font-bold text-white font-display mb-1">Mật Các Khởi Linh Tri Thức</h3>
                <p className="text-slate-400 text-xs max-w-sm leading-relaxed">
                  Đại Pháp Sư Grandis đang chờ nghe sắc lệnh học thuật của bạn. Hãy chọn tính năng bên trái (Gợi ý câu hỏi, Sửa bài tập, hoặc Hỏi đáp tự do) để khai thông ma pháp!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legacy Statistics Analysis Tab */}
      {activeTab === "analysis" && (
        <>
          {/* Core Learning Statistics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 animate-fadeIn">
            <div className="bg-slate-800/50 border-2 border-slate-700 rounded-2xl p-4 flex items-center gap-4 shadow-md">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                <Target className="text-purple-400" size={24} />
              </div>
              <div>
                <div className="text-xs text-slate-400 uppercase font-mono">Tỷ lệ chính xác</div>
                <div className="text-2xl font-mono font-bold text-white">{accuracy}%</div>
                <div className="text-[10px] text-slate-400">{correctCount} đúng / {historyLength} tổng lượt ra đòn</div>
              </div>
            </div>

            <div className="bg-slate-800/50 border-2 border-slate-700 rounded-2xl p-4 flex items-center gap-4 shadow-md">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                <Trophy className="text-amber-400" size={24} />
              </div>
              <div>
                <div className="text-xs text-slate-400 uppercase font-mono">Cấp độ thám hiểm</div>
                <div className="text-2xl font-mono font-bold text-amber-400">Cấp {playerState.level}</div>
                <div className="text-[10px] text-slate-400">Tích lũy {playerState.xp} Điểm Kinh Nghiệm (XP)</div>
              </div>
            </div>

            <div className="bg-slate-800/50 border-2 border-slate-700 rounded-2xl p-4 flex items-center gap-4 shadow-md">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <BookOpen className="text-emerald-400" size={24} />
              </div>
              <div>
                <div className="text-xs text-slate-400 uppercase font-mono">Ải đã hoàn tất</div>
                <div className="text-2xl font-mono font-bold text-emerald-400">{playerState.completedChapters.length} Ải</div>
                <div className="text-[10px] text-slate-400">Chinh phục thành công các thủ vệ đại lục</div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          {historyLength === 0 ? (
            <div className="bg-[#1E293B] border-4 border-[#334155] rounded-[32px] p-8 text-center max-w-2xl mx-auto shadow-2xl">
              <div className="text-5xl mb-4 select-none animate-bounce">🔮</div>
              <h3 className="text-xl font-bold text-white mb-2 font-display">Thạch Kính Trống Không</h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                Ngươi chưa tham gia bất kỳ cuộc đọ sức tri thức nào! Hãy quay lại Trang Chủ, chọn một môn học để nạp tài liệu và chiến đấu vượt qua quái thú. Khi đó Đại Pháp Sư mới có thể soi sáng căn cơ học tập của ngươi!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Panel: Tutor Dialog */}
              <div className="lg:col-span-4 bg-[#1E293B] border-4 border-[#334155] rounded-[32px] p-5 flex flex-col items-center text-center shadow-xl">
                <div className="w-24 h-24 bg-slate-800 border-4 border-purple-500/40 rounded-full flex items-center justify-center text-5xl mb-4 shadow-lg shadow-purple-500/20">
                  🧙‍♀️
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Đại Pháp Sư Grandis</h3>
                <span className="text-[10px] uppercase font-mono tracking-widest px-2.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-semibold mb-4">
                  {report?.xpTierName || "Cố Vấn Tối Cao"}
                </span>

                <p className="text-slate-300 text-xs italic leading-relaxed mb-6 bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                  "Mỗi trận đấu oanh liệt giúp ta thâu tóm từng tia tinh túy học nghiệp của ngươi. Hãy cùng duyệt qua lá số để gia tăng pháp lực chống lại thủ thủ vệ!"
                </p>

                <button
                  onClick={fetchTutorAnalysis}
                  disabled={loadingAnalysis}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/10 cursor-pointer"
                >
                  {loadingAnalysis ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Soi Sáng Ma Pháp Kính...
                    </>
                  ) : (
                    <>
                      <BrainCircuit size={18} /> Cập Nhật Phân Tích Mới
                    </>
                  )}
                </button>
              </div>

              {/* Right Panel: AI Strengths, Weaknesses, Recommendations */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                {loadingAnalysis ? (
                  <div className="bg-[#1E293B] border-2 border-slate-700 rounded-[32px] p-12 flex flex-col items-center justify-center text-center gap-4 shadow-xl">
                    <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
                    <div>
                      <h4 className="text-lg font-bold text-white">Đại Pháp Sư đang bấm quẻ...</h4>
                      <p className="text-slate-300 text-sm mt-1">Hệ thống đang giải mã các lỗi sai và câu đúng để lập báo cáo học lực cá nhân hóa.</p>
                    </div>
                  </div>
                ) : analysisError ? (
                  <div className="bg-[#1E293B] border-2 border-red-500/30 rounded-[32px] p-6 text-center text-red-400">
                    <AlertTriangle className="mx-auto mb-2 text-red-500" size={32} />
                    <h4 className="font-bold text-lg text-white">Thiết bị pháp trận bị nhiễu sóng</h4>
                    <p className="text-sm text-slate-300 mt-1">{analysisError}</p>
                    <button
                      onClick={fetchTutorAnalysis}
                      className="mt-4 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-xs text-red-400 font-semibold transition-colors cursor-pointer"
                    >
                      Thử lại pháp thuật
                    </button>
                  </div>
                ) : report ? (
                  <div className="flex flex-col gap-6">
                    {/* Strengths Card */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-800/50 border-2 border-slate-700 rounded-[32px] p-6 shadow-md"
                    >
                      <h4 className="text-md font-bold text-white flex items-center gap-2 mb-4 border-b border-slate-750 pb-3">
                        <Sparkles className="text-amber-400" size={18} /> Khí Hải Tri Thức (Điểm Mạnh Học Tập)
                      </h4>
                      <ul className="flex flex-col gap-3">
                        {report.strengths.map((strength, i) => (
                          <li key={i} className="flex gap-3 text-sm text-slate-200 leading-relaxed items-start">
                            <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                              ✓
                            </span>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>

                    {/* Weaknesses Card */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-slate-800/50 border-2 border-slate-700 rounded-[32px] p-6 shadow-md"
                    >
                      <h4 className="text-md font-bold text-white flex items-center gap-2 mb-4 border-b border-slate-750 pb-3">
                        <AlertTriangle className="text-rose-400" size={18} /> Điểm Sơ Hở Phòng Thủ (Khu Vực Yếu Cần Cải Thiện)
                      </h4>
                      <ul className="flex flex-col gap-3">
                        {report.weaknesses.map((weakness, i) => (
                          <li key={i} className="flex gap-3 text-sm text-slate-200 leading-relaxed items-start">
                            <span className="w-5 h-5 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                              !
                            </span>
                            <span>{weakness}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>

                    {/* Recommendations Card */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-slate-800/50 border-2 border-slate-700 rounded-[32px] p-6 shadow-md"
                    >
                      <h4 className="text-md font-bold text-white flex items-center gap-2 mb-4 border-b border-slate-750 pb-3">
                        <Lightbulb className="text-emerald-400" size={18} /> Bí Kíp Rèn Luyện Pháp Công (Lời Khuyên Hướng Dẫn Ôn Tập)
                      </h4>
                      <ul className="flex flex-col gap-3">
                        {report.recommendations.map((rec, i) => (
                          <li key={i} className="flex gap-3 text-sm text-slate-200 leading-relaxed items-start">
                            <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  </div>
                ) : (
                  <div className="bg-[#1E293B] border-2 border-slate-700 rounded-[32px] p-12 text-center text-slate-300 shadow-xl">
                    Vui lòng ấn nút "Cập Nhật Phân Tích Mới" để triệu gọi Đại Pháp Sư rà soát dữ liệu học lực của bạn.
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
