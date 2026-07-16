import React, { useState } from "react";
import { PlayerState } from "../types";
import { PUZZLE_THEMES, PuzzleTheme } from "../data/puzzles";
import { Award, Lock, Sparkles, Trophy, Grid, Eye } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CollectionProps {
  playerState: PlayerState;
  setPlayerState: React.Dispatch<React.SetStateAction<PlayerState>>;
}

export default function Collection({ playerState, setPlayerState }: CollectionProps) {
  const [selectedThemeId, setSelectedThemeId] = useState<string>("halong_bay");
  const [placedPieces, setPlacedPieces] = useState<Record<string, number[]>>({}); // puzzleThemeId -> array of piece indices that have been drag/clicked and placed on board

  const currentTheme = PUZZLE_THEMES.find((t) => t.id === selectedThemeId) || PUZZLE_THEMES[0];

  // Total pieces: 12 (4 columns x 3 rows)
  const cols = 4;
  const rows = 3;
  const totalPieces = currentTheme.totalPieces;

  const collected = playerState.collectedPieces[currentTheme.id] || [];
  const placed = placedPieces[currentTheme.id] || [];

  // Pieces in inventory that have been collected but NOT yet placed on the board
  const unplacedInventory = collected.filter((p) => !placed.includes(p));

  const isCompleted = placed.length === totalPieces;
  const alreadyClaimed = playerState.completedPuzzles.includes(currentTheme.id);

  const handlePlacePiece = (pieceIndex: number) => {
    setPlacedPieces((prev) => {
      const currentPlaced = prev[currentTheme.id] || [];
      if (currentPlaced.includes(pieceIndex)) return prev;
      return {
        ...prev,
        [currentTheme.id]: [...currentPlaced, pieceIndex].sort((a, b) => a - b),
      };
    });
  };

  const handleClaimReward = () => {
    if (!isCompleted || alreadyClaimed) return;

    setPlayerState((prev) => ({
      ...prev,
      gold: prev.gold + currentTheme.goldReward,
      completedPuzzles: [...prev.completedPuzzles, currentTheme.id],
    }));
  };

  const handlePlaceAll = () => {
    // Convenience to place all collected pieces onto the board
    setPlacedPieces((prev) => {
      const currentPlaced = prev[currentTheme.id] || [];
      const newPlaced = [...new Set([...currentPlaced, ...collected])].sort((a, b) => a - b);
      return {
        ...prev,
        [currentTheme.id]: newPlaced,
      };
    });
  };

  // Helper to calculate CSS background positions for each puzzle piece
  // Piece index is 0 to 11
  const getPieceStyle = (index: number) => {
    const colIndex = index % cols;
    const rowIndex = Math.floor(index / cols);
    const xPercent = (colIndex / (cols - 1)) * 100;
    const yPercent = (rowIndex / (rows - 1)) * 100;

    return {
      backgroundImage: `url(${currentTheme.imageUrl})`,
      backgroundSize: `${cols * 100}% ${rows * 100}%`,
      backgroundPosition: `${xPercent}% ${yPercent}%`,
    };
  };

  return (
    <div className="max-w-6xl mx-auto py-4 px-4">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold font-sans tracking-tight text-white flex items-center gap-2">
          <Grid className="text-emerald-400" /> Thư Viện Mảnh Ghép Kỳ Bí
        </h2>
        <p className="text-slate-300 text-sm">
          Thu thập các mảnh ghép từ các trận đấu quái vật để hoàn thiện tranh cổ vật và mở khóa các phần quà thần thoại.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Theme Selectors & Info */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-slate-800/50 border-2 border-slate-700 rounded-[32px] p-4 shadow-xl">
            <h3 className="text-sm font-mono text-slate-400 uppercase mb-3 tracking-widest font-semibold">
              Bộ Sưu Tập Của Bạn
            </h3>
            <div className="flex flex-col gap-2">
              {PUZZLE_THEMES.map((theme) => {
                const themeCollectedCount = playerState.collectedPieces[theme.id]?.length || 0;
                const themePlacedCount = placedPieces[theme.id]?.length || 0;
                const isThemeDone = themePlacedCount === theme.totalPieces;
                const isThemeClaimed = playerState.completedPuzzles.includes(theme.id);

                return (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedThemeId(theme.id)}
                    className={`p-3 rounded-xl flex items-center justify-between text-left transition-all duration-300 ${
                      selectedThemeId === theme.id
                        ? "bg-emerald-500/10 border-2 border-emerald-500/40 text-white"
                        : "bg-slate-950/50 border border-slate-900 text-gray-400 hover:bg-slate-800/30 hover:border-slate-850"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 relative">
                        <img
                          src={theme.imageUrl}
                          alt={theme.name}
                          className="w-full h-full object-cover grayscale-[30%]"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-slate-950/20" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-gray-200">{theme.name}</h4>
                        <span className="text-[10px] uppercase font-mono font-bold text-amber-400">
                          {theme.rarity}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono text-gray-300">
                        {themePlacedCount}/{theme.totalPieces} mảnh
                      </div>
                      <div className="text-[10px] text-slate-500">
                        ({themeCollectedCount} đã có)
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Theme details card */}
          <div className="bg-indigo-950/40 border-2 border-indigo-500/30 rounded-[32px] p-5 shadow-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">
                Độ hiếm: {currentTheme.rarity}
              </span>
              <div className="flex items-center gap-1 font-mono text-sm text-amber-400 font-bold">
                <Trophy size={14} /> +{currentTheme.goldReward} vàng
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{currentTheme.name}</h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              {currentTheme.description}
            </p>

            <div className="border-t border-slate-800/80 pt-4">
              <div className="text-xs text-slate-400 uppercase font-mono mb-2">Thống kê chiến lợi phẩm</div>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
                <div className="bg-[#0F172A] p-2 rounded-xl border border-slate-700">
                  <span className="block text-[10px] text-slate-500 uppercase font-mono">Đã thu thập</span>
                  <span className="font-mono font-bold text-emerald-400">{collected.length} mảnh</span>
                </div>
                <div className="bg-[#0F172A] p-2 rounded-xl border border-slate-700">
                  <span className="block text-[10px] text-slate-500 uppercase font-mono">Đã ghép thành</span>
                  <span className="font-mono font-bold text-blue-400">{placed.length} mảnh</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Jigsaw Assembly Stage */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-[#1E293B] border-4 border-[#334155] rounded-[32px] p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-xl">
            <div className="absolute top-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Completion Celebrations */}
            <AnimatePresence>
              {isCompleted && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-950/95 z-20 flex flex-col items-center justify-center text-center p-6"
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 4 }}
                    className="w-20 h-20 bg-amber-500/10 border-2 border-amber-400 rounded-full flex items-center justify-center text-4xl mb-4 shadow-lg shadow-amber-500/20"
                  >
                    🏆
                  </motion.div>
                  <h3 className="text-2xl font-bold text-amber-400 mb-2 flex items-center gap-2">
                    <Sparkles className="animate-pulse" /> Tuyệt Tác Hoàn Thành!
                  </h3>
                  <p className="text-gray-300 max-w-md text-sm leading-relaxed mb-6">
                    Ngươi thật xuất sắc! Toàn bộ bức họa cổ vật <strong>"{currentTheme.name}"</strong> đã được phục chế hoàn toàn.
                    Tri thức và sự kiên trì đã giúp ngươi giải mã được bí mật này.
                  </p>

                  <div className="w-64 aspect-video rounded-xl overflow-hidden mb-6 border border-amber-400/40 shadow-2xl">
                    <img
                      src={currentTheme.imageUrl}
                      alt={currentTheme.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {alreadyClaimed ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl px-5 py-2.5 text-emerald-400 text-sm font-semibold flex items-center gap-2">
                      <Award size={18} /> Đã nhận phần thưởng danh giá này!
                    </div>
                  ) : (
                    <button
                      onClick={handleClaimReward}
                      className="bg-amber-500 text-slate-950 px-6 py-3 rounded-xl font-bold hover:bg-amber-400 hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg shadow-amber-500/20 cursor-pointer"
                    >
                      Nhận {currentTheme.goldReward} Vàng Thưởng
                    </button>
                  )}
                  
                  <button 
                    onClick={() => {
                      // Allow viewing board again
                      setPlacedPieces(prev => ({
                        ...prev,
                        [currentTheme.id]: prev[currentTheme.id].filter(x => x !== 0) // toggle just one piece out temporarily to review
                      }));
                    }}
                    className="mt-4 text-xs text-gray-500 hover:text-gray-300 underline cursor-pointer"
                  >
                    Xem lại bảng ghép mảnh
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* The 4x3 Jigsaw Assembly Board */}
            <div className="w-full max-w-lg mb-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-mono text-slate-300 flex items-center gap-1.5 uppercase font-semibold">
                  <Grid size={14} /> Khung phục chế cổ vật (4 x 3)
                </span>
                {unplacedInventory.length > 0 && (
                  <button
                    onClick={handlePlaceAll}
                    className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-semibold cursor-pointer"
                  >
                    Ghép tất cả mảnh đang có
                  </button>
                )}
              </div>

              <div className="grid grid-cols-4 gap-1.5 aspect-[4/3] w-full bg-[#0F172A] border-4 border-slate-700 p-2.5 rounded-[32px] shadow-2xl relative">
                {Array.from({ length: totalPieces }).map((_, idx) => {
                  const isPlaced = placed.includes(idx);
                  const isUserHasButNotPlaced = unplacedInventory.includes(idx);

                  return (
                    <div
                      key={idx}
                      className={`relative aspect-square rounded-lg flex items-center justify-center overflow-hidden transition-all duration-300 ${
                        isPlaced
                          ? "border border-emerald-500/20 shadow-md shadow-slate-950/50"
                          : isUserHasButNotPlaced
                          ? "bg-[#1E293B] border-2 border-dashed border-amber-500/40 cursor-pointer hover:border-amber-400 animate-pulse"
                          : "bg-slate-900/40 border border-slate-800/40 text-gray-700"
                      }`}
                      onClick={() => {
                        if (isUserHasButNotPlaced) {
                          handlePlacePiece(idx);
                        }
                      }}
                    >
                      {isPlaced ? (
                        <div className="w-full h-full" style={getPieceStyle(idx)} />
                      ) : isUserHasButNotPlaced ? (
                        <div className="flex flex-col items-center justify-center text-center p-1">
                          <Sparkles className="text-amber-400 mb-1" size={16} />
                          <span className="text-[9px] font-mono font-bold text-amber-300">Ấn ghép #{idx + 1}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <Lock size={16} className="text-slate-800" />
                          <span className="text-[9px] font-mono text-slate-800 mt-1">#{idx + 1}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Inventory / Stockpile Area */}
            <div className="w-full border-t border-slate-800/60 pt-5">
              <h4 className="text-xs font-mono text-slate-300 uppercase mb-3 tracking-wider flex items-center gap-1.5 font-semibold">
                Kho chứa mảnh ghép của chủ đề này ({unplacedInventory.length})
              </h4>

              {unplacedInventory.length === 0 ? (
                <div className="bg-[#0F172A] rounded-2xl p-5 text-center text-slate-400 text-sm border border-dashed border-slate-700">
                  {collected.length === placed.length && collected.length > 0 ? (
                    <span className="text-emerald-400 font-medium">✨ Toàn bộ mảnh ghép thu thập được đã được đặt lên bảng!</span>
                  ) : (
                    <span>Chưa có mảnh ghép chưa đặt. Hãy thám hiểm làm bài tập và thắng quái vật để đoạt mảnh ghép mới!</span>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap gap-3 justify-center">
                  {unplacedInventory.map((pieceIdx) => (
                    <motion.button
                      key={pieceIdx}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePlacePiece(pieceIdx)}
                      className="bg-[#0F172A] hover:bg-slate-900 border border-amber-500/30 hover:border-amber-400 rounded-xl p-2.5 flex items-center gap-2 text-left shadow-lg shadow-amber-500/5 transition-all duration-300 cursor-pointer"
                    >
                      {/* Micro thumbnail */}
                      <div className="w-8 h-8 rounded overflow-hidden relative">
                        <div className="w-full h-full opacity-60" style={getPieceStyle(pieceIdx)} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-amber-400 font-sans">Mảnh số #{pieceIdx + 1}</div>
                        <div className="text-[10px] text-slate-500 font-mono">Click để đặt vào tranh</div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
