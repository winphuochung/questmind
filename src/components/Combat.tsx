import React, { useState } from "react";
import { PlayerState, Question, Chapter, HistoryItem } from "../types";
import { Heart, Coins, Shield, HelpCircle, Swords, ArrowRight, CornerDownLeft, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import MonsterArt from "./MonsterArt";
import { evaluateEssay } from "../utils/gemini";

interface CombatProps {
  playerState: PlayerState;
  setPlayerState: React.Dispatch<React.SetStateAction<PlayerState>>;
  onQuit: () => void;
}

export default function Combat({ playerState, setPlayerState, onQuit }: CombatProps) {
  const campaign = playerState.activeCampaign;
  const chapterId = playerState.activeChapterId;
  const currentChapter = campaign?.chapters.find((c) => c.id === chapterId) as Chapter;

  if (!currentChapter) {
    return (
      <div className="py-12 text-center text-white">
        <p>Lỗi: Không tìm thấy ải đấu trường hiện tại.</p>
        <button onClick={onQuit} className="mt-4 px-4 py-2 bg-emerald-500 text-slate-950 rounded-xl font-bold cursor-pointer">
          Trở về Bản đồ
        </button>
      </div>
    );
  }

  // Combat States
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [monsterHp, setMonsterHp] = useState<number>(100);
  const [userBlankAnswer, setUserBlankAnswer] = useState<string>("");
  const [userEssayAnswer, setUserEssayAnswer] = useState<string>("");
  
  // Feedback and evaluation states
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{
    shown: boolean;
    isCorrect: boolean;
    text: string;
    explanation: string;
    score?: number;
  } | null>(null);

  // Active protections
  const [isShieldActive, setIsShieldActive] = useState<boolean>(false);
  const [isHintUsed, setIsHintUsed] = useState<boolean>(false);

  // Animation triggers
  const [playerAttackTrigger, setPlayerAttackTrigger] = useState<boolean>(false);
  const [monsterAttackTrigger, setMonsterAttackTrigger] = useState<boolean>(false);

  const currentQuestion = currentChapter.questions[currentQuestionIdx];

  const handleUseHint = () => {
    if (isHintUsed) return;
    if (playerState.items.hint <= 0) {
      alert("Bạn không còn Cuộn Sách Gợi Ý nào trong hành trang. Hãy mua thêm trong Cửa Hàng!");
      return;
    }

    setPlayerState((prev) => ({
      ...prev,
      items: { ...prev.items, hint: prev.items.hint - 1 },
    }));
    setIsHintUsed(true);
  };

  const handleUseShield = () => {
    if (isShieldActive) return;
    if (playerState.items.shield <= 0) {
      alert("Bạn không còn Khiên Trí Tuệ nào trong hành trang. Hãy mua thêm trong Cửa Hàng!");
      return;
    }

    setPlayerState((prev) => ({
      ...prev,
      items: { ...prev.items, shield: prev.items.shield - 1 },
    }));
    setIsShieldActive(true);
  };

  const processCorrectAnswer = (xpEarned: number, goldEarned: number, dynamicFeedback: string, dynamicExplanation: string) => {
    setPlayerAttackTrigger(true);
    setTimeout(() => setPlayerAttackTrigger(false), 800);

    setMonsterHp((prev) => Math.max(0, prev - 20));

    // Update state
    setPlayerState((prev) => {
      // Record to history
      const newHistoryItem: HistoryItem = {
        question: currentQuestion.question,
        levelName: currentQuestion.levelName,
        type: currentQuestion.type,
        isCorrect: true,
        chapterTitle: currentChapter.title,
      };

      const finalXpEarned = prev.items.doubleXp ? xpEarned * 2 : xpEarned;

      return {
        ...prev,
        xp: prev.xp + finalXpEarned,
        gold: prev.gold + goldEarned,
        history: [...prev.history, newHistoryItem],
      };
    });

    setFeedback({
      shown: true,
      isCorrect: true,
      text: dynamicFeedback,
      explanation: dynamicExplanation,
    });
  };

  const processWrongAnswer = (dynamicFeedback: string, dynamicExplanation: string) => {
    setMonsterAttackTrigger(true);
    setTimeout(() => setMonsterAttackTrigger(false), 800);

    let finalHearts = playerState.hearts;
    let shieldConsumed = false;

    if (isShieldActive) {
      setIsShieldActive(false);
      shieldConsumed = true;
    } else {
      finalHearts = Math.max(0, playerState.hearts - 1);
    }

    setPlayerState((prev) => {
      const newHistoryItem: HistoryItem = {
        question: currentQuestion.question,
        levelName: currentQuestion.levelName,
        type: currentQuestion.type,
        isCorrect: false,
        chapterTitle: currentChapter.title,
      };

      return {
        ...prev,
        hearts: finalHearts,
        history: [...prev.history, newHistoryItem],
      };
    });

    setFeedback({
      shown: true,
      isCorrect: false,
      text: shieldConsumed
        ? `🛡️ Năng lượng Khiên Trí Tuệ đã hấp thụ cú đánh! Bạn được bảo toàn sinh mệnh. ${dynamicFeedback}`
        : dynamicFeedback,
      explanation: dynamicExplanation,
    });
  };

  const submitAnswer = async (answer: string) => {
    if (evaluating || feedback?.shown) return;

    if (currentQuestion.type === "multiple_choice") {
      const isCorrect = answer === currentQuestion.correctAnswer;
      if (isCorrect) {
        processCorrectAnswer(20, 15, "⚔️ Tuyệt diêu! Đòn đánh trúng điểm chí mạng, quái vật rú lên đau đớn!", currentQuestion.explanation);
      } else {
        processWrongAnswer("💥 Quái vật phản đòn cực mạnh! Bạn đã nhận sát thương.", currentQuestion.explanation);
      }
    } else if (currentQuestion.type === "fill_in_the_blank") {
      const trimmedUser = answer.trim().toLowerCase();
      const trimmedCorrect = currentQuestion.correctAnswer.trim().toLowerCase();
      // Match substring to handle mild variations
      const isCorrect = trimmedUser === trimmedCorrect || trimmedCorrect.includes(trimmedUser) && trimmedUser.length > 2;

      if (isCorrect) {
        processCorrectAnswer(25, 20, "🏹 Thần sầu! Mũi tên trí tuệ đã xuyên thủng khoảng trống phòng ngự của quái vật!", currentQuestion.explanation);
      } else {
        processWrongAnswer(`💥 Đòn đánh hụt! Đáp án đúng cần điền là "${currentQuestion.correctAnswer}".`, currentQuestion.explanation);
      }
    } else if (currentQuestion.type === "essay") {
      // Call server API for real-time evaluation
      setEvaluating(true);
      try {
        const data = await evaluateEssay({
          question: currentQuestion.question,
          userAnswer: answer,
          level: currentQuestion.level,
          levelName: currentQuestion.levelName,
          sampleAnswer: currentQuestion.correctAnswer,
        });

        if (data.isCorrect) {
          processCorrectAnswer(35, 30, `🌟 Tuyệt chiêu tối thượng (Điểm: ${data.score}/100)! ${data.feedback}`, data.explanation);
        } else {
          processWrongAnswer(`💥 Quái vật kháng cự (Điểm: ${data.score}/100)! ${data.feedback}`, data.explanation);
        }
      } catch (err: any) {
        console.error(err);
        alert("Lỗi kết nối khi đánh giá tự luận: " + (err.message || err));
      } finally {
        setEvaluating(false);
      }
    }
  };

  const handleNextStage = () => {
    // Reset temporary tools
    setIsHintUsed(false);
    setUserBlankAnswer("");
    setUserEssayAnswer("");
    setFeedback(null);

    // Level up calculation (if XP exceeds threshhold)
    const nextLevelXp = playerState.level * 150;
    if (playerState.xp >= nextLevelXp) {
      setPlayerState((prev) => ({
        ...prev,
        level: prev.level + 1,
        xp: prev.xp - nextLevelXp,
      }));
    }

    if (currentQuestionIdx < 4) {
      // Proceed to next question of chapter
      setCurrentQuestionIdx((prev) => prev + 1);
    } else {
      // Chapter finished completely!
      handleVictory();
    }
  };

  const handleVictory = () => {
    // Grant puzzle piece reward
    // Select a random piece from 0 to 11 for the first incomplete puzzle theme or "halong_bay"
    const activePuzzleThemeId = "halong_bay"; // Defaulting to halong bay as first
    const currentCollected = playerState.collectedPieces[activePuzzleThemeId] || [];

    // Find all uncollected piece indexes
    const uncollected = Array.from({ length: 12 }, (_, i) => i).filter((i) => !currentCollected.includes(i));
    let rewardedPieceIndex = 0;

    if (uncollected.length > 0) {
      // Give random uncollected piece
      rewardedPieceIndex = uncollected[Math.floor(Math.random() * uncollected.length)];
    } else {
      // Already has all, give duplicates or select another theme
      rewardedPieceIndex = Math.floor(Math.random() * 12);
    }

    const updatedCollected = [...currentCollected, rewardedPieceIndex].sort((a, b) => a - b);

    // Disable XP booster
    const updatedItems = { ...playerState.items, doubleXp: false };

    setPlayerState((prev) => {
      const isNewCompletion = !prev.completedChapters.includes(currentChapter.id);
      const newCompleted = isNewCompletion ? [...prev.completedChapters, currentChapter.id] : prev.completedChapters;

      // Unlock next chapter automatically
      let newUnlocked = [...prev.unlockedChapters];
      if (currentChapter.id === "chapter_1" && !newUnlocked.includes("chapter_2")) {
        newUnlocked.push("chapter_2");
      } else if (currentChapter.id === "chapter_2" && !newUnlocked.includes("chapter_3")) {
        newUnlocked.push("chapter_3");
      }

      return {
        ...prev,
        completedChapters: newCompleted,
        unlockedChapters: newUnlocked,
        items: updatedItems,
        collectedPieces: {
          ...prev.collectedPieces,
          [activePuzzleThemeId]: updatedCollected,
        },
        activeTab: "map",
      };
    });

    alert(
      `🏆 CHƯƠNG HOÀN THÀNH! Bạn đã xuất sắc đánh bại thủ vệ "${currentChapter.monsterName}".\n` +
      `🎁 Bạn nhận được mảnh ghép số #${rewardedPieceIndex + 1} của bức tranh "Kỳ Quan Vịnh Hạ Long". Hãy vào Thư Viện Mảnh Ghép để phục dựng bức họa cổ vật nhé!`
    );
  };

  const handleInstantRevive = () => {
    if (playerState.items.revive > 0) {
      setPlayerState((prev) => ({
        ...prev,
        hearts: 5,
        items: { ...prev.items, revive: prev.items.revive - 1 },
      }));
      setFeedback(null);
    } else {
      // Prompt user to purchase revive potion with Gold
      if (playerState.gold >= 50) {
        setPlayerState((prev) => ({
          ...prev,
          hearts: 5,
          gold: prev.gold - 50,
        }));
        setFeedback(null);
        alert("🧙‍♂️ Albus đã pha chế thần dược! Bạn đã phục sinh với 5 Trái Tim.");
      } else {
        alert("Ngươi không có đủ 50 vàng để hồi sinh khẩn cấp. Hãy tháo chạy về bản đồ để phục hồi thể lực.");
        onQuit();
      }
    }
  };

  const isPlayerDead = playerState.hearts <= 0;

  return (
    <div className="max-w-4xl mx-auto py-4 px-4">
      {/* Top Controls / HUD */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onQuit}
          className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-gray-400 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-all duration-300 cursor-pointer"
        >
          ← Tháo lui về Bản đồ
        </button>

        <div className="flex items-center gap-4 bg-slate-950/80 px-4 py-2 rounded-2xl border border-slate-850">
          <div className="flex items-center gap-1 text-rose-500">
            {Array.from({ length: 5 }).map((_, i) => (
              <Heart
                key={i}
                size={18}
                className={i < playerState.hearts ? "fill-rose-500 animate-pulse" : "text-slate-800"}
              />
            ))}
          </div>
          <div className="w-px h-4 bg-slate-800" />
          <div className="flex items-center gap-1 text-amber-400 font-mono font-bold text-sm">
            <Coins size={16} /> {playerState.gold}
          </div>
        </div>
      </div>

      {/* Main RPG Battle Scene */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        
        {/* Left Side: Player Adventurer */}
        <div className={`bg-slate-900 border-2 rounded-3xl p-5 relative overflow-hidden transition-all duration-300 ${
          playerAttackTrigger ? "border-amber-500 shadow-lg shadow-amber-500/20 translate-x-4" : "border-slate-800"
        }`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl" />
          <div className="flex flex-col items-center justify-center text-center py-6">
            <div className={`w-20 h-20 bg-slate-800 border-2 border-indigo-400 rounded-full flex items-center justify-center text-5xl mb-3 shadow-lg ${
              playerAttackTrigger ? "scale-110 rotate-12 transition-transform duration-100" : ""
            }`}>
              🧙‍♂️
            </div>
            <h4 className="font-extrabold text-white text-lg">Nhà Thám Hiểm</h4>
            <span className="text-xs font-mono text-indigo-400 mt-1 uppercase tracking-wider bg-indigo-950/40 border border-indigo-900/40 px-2.5 py-0.5 rounded-full">
              Cấp Độ {playerState.level}
            </span>

            {/* Shield Indicator */}
            {isShieldActive && (
              <div className="mt-4 flex items-center gap-1 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-900/40 px-3 py-1 rounded-xl animate-pulse">
                <Shield size={14} className="fill-emerald-500" /> Khiên Ma Pháp Bảo Vệ Đang Bật
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Monster Adversary */}
        <div className={`bg-slate-900 border-2 rounded-3xl p-5 relative overflow-hidden transition-all duration-300 ${
          monsterAttackTrigger ? "border-rose-500 shadow-lg shadow-rose-500/20 -translate-x-4" : "border-slate-800"
        }`}>
          <MonsterArt
            seed={currentChapter.id + currentChapter.monsterName}
            isBoss={currentChapter.isBoss}
            hpPercentage={monsterHp / 100}
            attackTrigger={monsterAttackTrigger}
          />
          <div className="absolute top-0 left-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl animate-pulse" />
          <div className="flex flex-col items-center justify-center text-center py-6 relative z-10">
            <div className={`w-20 h-20 bg-slate-800/80 backdrop-blur-md border-2 border-rose-500 rounded-full flex items-center justify-center text-5xl mb-3 shadow-lg ${
              monsterAttackTrigger ? "scale-110 -rotate-12 transition-transform duration-100" : ""
            }`}>
              {currentChapter.isBoss ? "👹" : "😈"}
            </div>
            <h4 className="font-extrabold text-white text-lg">{currentChapter.monsterName}</h4>
            <span className="text-xs font-mono text-rose-400 mt-1 uppercase tracking-wider bg-rose-950/40 border border-rose-900/40 px-2.5 py-0.5 rounded-full">
              Thử Thách Trí Tuệ
            </span>

            {/* Monster Health Bar */}
            <div className="w-full max-w-[200px] mt-4">
              <div className="flex justify-between text-[10px] font-mono text-rose-400 mb-1">
                <span>SINH LỰC QUÁI VẬT</span>
                <span>{monsterHp}/100 HP</span>
              </div>
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-rose-600 to-red-500 transition-all duration-500"
                  style={{ width: `${monsterHp}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quest / Trivia Content Box */}
      <div className="bg-white rounded-[32px] p-8 relative overflow-hidden shadow-2xl border-4 border-[#334155] text-slate-900">
        
        {/* Game Over Screen Overlay */}
        <AnimatePresence>
          {isPlayerDead && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/95 z-30 flex flex-col items-center justify-center text-center p-6"
            >
              <div className="text-5xl mb-3 animate-bounce select-none">💀</div>
              <h3 className="text-2xl font-bold text-rose-500 mb-2 font-sans uppercase tracking-wide">
                Chiến Binh Đã Ngã Xuống!
              </h3>
              <p className="text-gray-400 text-sm max-w-md leading-relaxed mb-6">
                Ngươi đã cạn kiệt 5 trái tim sinh mệnh trước mưu đồ tri thức của quái vật.
                Đừng nản chí! Hãy hồi sinh để tiếp tục chiến đấu hoặc tích lũy thêm kiến thức để thử sức lại.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleInstantRevive}
                  className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-sm transition-all duration-300 shadow-lg shadow-rose-600/10 cursor-pointer"
                >
                  {playerState.items.revive > 0
                    ? `Dùng Thuốc Hồi Sinh (Còn ${playerState.items.revive})`
                    : "Mua & Dùng Hồi Sinh (50 vàng)"}
                </button>
                <button
                  onClick={onQuit}
                  className="px-6 py-3 bg-slate-900 border border-slate-800 text-gray-400 hover:text-white rounded-xl text-sm transition-all duration-300 cursor-pointer"
                >
                  Trở Về Bản Đồ
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Level / Difficulty Indicator Header */}
        <div className="flex justify-between items-center border-b-2 border-slate-100 pb-3 mb-4">
          <span className="text-xs font-mono text-indigo-600 uppercase tracking-widest font-bold">
            Đợt công kích {currentQuestionIdx + 1}/5 • {currentQuestion.levelName}
          </span>
          <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-200 font-mono font-bold uppercase">
            Cấp {currentQuestion.level}
          </span>
        </div>

        {/* Question Text */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-slate-900 font-sans leading-relaxed">
            {currentQuestion.question}
          </h3>
        </div>

        {/* Interactive Action Workspace */}
        {evaluating ? (
          <div className="py-8 flex flex-col items-center justify-center text-center gap-3">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            <p className="text-indigo-600 text-xs font-mono uppercase tracking-widest animate-pulse">
              Đại Pháp Sư AI đang rà soát chiêu thức của bạn...
            </p>
          </div>
        ) : feedback?.shown ? (
          /* Feedback View After Answering */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`border rounded-2xl p-5 mb-6 ${
              feedback.isCorrect
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">{feedback.isCorrect ? "🛡️" : "💥"}</span>
              <div>
                <h4 className="font-extrabold text-sm mb-1">
                  {feedback.isCorrect ? "ĐÒN ĐÁNH THÀNH CÔNG!" : "QUÁI VẬT PHẢN CÔNG!"}
                </h4>
                <p className="text-sm font-sans mb-3 text-slate-800">{feedback.text}</p>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs text-slate-700 leading-relaxed font-sans">
                  <span className="font-bold text-indigo-600 uppercase block mb-1">Lời giải của Gia sư AI:</span>
                  {feedback.explanation}
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={handleNextStage}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all duration-300 cursor-pointer"
              >
                Tiếp Tục Phiêu Lưu <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        ) : (
          /* Standard Input View based on Question Type */
          <div className="mb-6">
            {currentQuestion.type === "multiple_choice" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentQuestion.options?.map((option, idx) => {
                  const actionLabel = idx === 0 ? "⚔️ Chém Thần Tốc" : idx === 1 ? "🔮 Phóng Phép" : idx === 2 ? "🏹 Bắn Cung" : "🛡️ Phản Đòn";
                  return (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => submitAnswer(idx.toString())}
                      className="bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 hover:border-indigo-500 text-left p-4 rounded-2xl text-sm text-slate-800 transition-all duration-300 group cursor-pointer"
                    >
                      <span className="block text-[10px] text-indigo-600 font-mono font-bold uppercase mb-1 tracking-wider group-hover:text-indigo-700">
                        {actionLabel}
                      </span>
                      {option}
                    </motion.button>
                  );
                })}
              </div>
            )}

            {currentQuestion.type === "fill_in_the_blank" && (
              <div className="flex flex-col gap-3 max-w-lg">
                <input
                  type="text"
                  placeholder="Nhập từ hoặc cụm từ còn thiếu vào đây..."
                  value={userBlankAnswer}
                  onChange={(e) => setUserBlankAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && userBlankAnswer) submitAnswer(userBlankAnswer);
                  }}
                  className="bg-slate-50 text-slate-900 px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 outline-none text-sm font-sans"
                />
                <button
                  onClick={() => submitAnswer(userBlankAnswer)}
                  disabled={!userBlankAnswer}
                  className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer self-start"
                >
                  ⚔️ Ra Đòn Tấn Công!
                </button>
              </div>
            )}

            {currentQuestion.type === "essay" && (
              <div className="flex flex-col gap-3">
                <textarea
                  rows={4}
                  placeholder="Nhập phần giải thích, phân tích hoặc câu trả lời tự luận đầy đủ của bạn vào đây (AI sẽ tự động rà soát, đánh giá ý chính của bạn)..."
                  value={userEssayAnswer}
                  onChange={(e) => setUserEssayAnswer(e.target.value)}
                  className="bg-slate-50 text-slate-900 p-4 rounded-xl border-2 border-slate-200 focus:border-indigo-500 outline-none text-sm font-sans resize-none"
                />
                <button
                  onClick={() => submitAnswer(userEssayAnswer)}
                  disabled={!userEssayAnswer}
                  className="px-5 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer self-start flex items-center gap-1.5 shadow-lg shadow-purple-600/10"
                >
                  🔮 Tung Phép Thuật Tuyệt Chiêu!
                </button>
              </div>
            )}
          </div>
        )}

        {/* Combat items & utilities panel */}
        {!feedback?.shown && !evaluating && (
          <div className="border-t-2 border-slate-100 pt-4 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2">
              {/* Shield Protection */}
              <button
                onClick={handleUseShield}
                disabled={isShieldActive || playerState.items.shield <= 0}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-300 ${
                  isShieldActive
                    ? "bg-emerald-100 border-2 border-emerald-300 text-emerald-800"
                    : playerState.items.shield > 0
                    ? "bg-slate-100 border-2 border-slate-200 hover:border-emerald-500/30 text-slate-700 hover:text-slate-900 cursor-pointer"
                    : "bg-slate-50 border-2 border-slate-100 text-slate-300 cursor-not-allowed"
                }`}
              >
                <Shield size={14} className={isShieldActive ? "fill-emerald-600 text-emerald-600" : ""} />
                <span>
                  {isShieldActive ? "Đã bật Khiên" : `Khiên Trí Tuệ (${playerState.items.shield})`}
                </span>
              </button>

              {/* Hint Scroll */}
              <button
                onClick={handleUseHint}
                disabled={isHintUsed || playerState.items.hint <= 0}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-300 ${
                  isHintUsed
                    ? "bg-sky-100 border-2 border-sky-300 text-sky-800"
                    : playerState.items.hint > 0
                    ? "bg-slate-100 border-2 border-slate-200 hover:border-sky-500/30 text-slate-700 hover:text-slate-900 cursor-pointer"
                    : "bg-slate-50 border-2 border-slate-100 text-slate-300 cursor-not-allowed"
                }`}
              >
                <HelpCircle size={14} />
                <span>
                  {isHintUsed ? "Đã dùng Gợi ý" : `Cuộn Gợi Ý (${playerState.items.hint})`}
                </span>
              </button>
            </div>

            <div className="text-[11px] text-slate-400 font-mono italic">
              *Mẹo: Ghé thăm Cửa Hàng để mua thêm bảo vật giúp thám hiểm an toàn hơn!
            </div>
          </div>
        )}

        {/* Display hint if used */}
        {isHintUsed && !feedback?.shown && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-4 bg-sky-50 border-2 border-sky-200 rounded-xl p-3 text-sky-800 text-xs flex items-start gap-2"
          >
            <Sparkles className="text-sky-600 flex-shrink-0 mt-0.5" size={14} />
            <div>
              <span className="font-bold uppercase block text-[10px] tracking-wide mb-0.5">Tiên tri Gợi Ý:</span>
              {currentQuestion.hint}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
