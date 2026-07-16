import React from "react";
import { PlayerState, Chapter } from "../types";
import { Compass, ShieldAlert, Swords, CheckCircle2, Lock, Unlock, ArrowRight, Skull, Map as MapIcon, Sparkles, Heart, Coins, Trophy, FileText, Presentation, BrainCircuit } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { exportToDocx, exportToPptx } from "../utils/exportDocs";

interface MapProps {
  playerState: PlayerState;
  setPlayerState: React.Dispatch<React.SetStateAction<PlayerState>>;
  onStartBattle: (chapterId: string) => void;
}

export default function Map({ playerState, setPlayerState, onStartBattle }: MapProps) {
  const campaign = playerState.activeCampaign;

  if (!campaign) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="text-5xl mb-4 select-none animate-bounce">🗺️</div>
        <h3 className="text-2xl font-bold text-white mb-2">Chưa Phát Hiện Hành Trình</h3>
        <p className="text-gray-400 mb-6">
          Vui lòng quay về Trang Chủ và cung cấp tài liệu học tập của bạn để AI có thể trích xuất và kiến tạo một bản đồ thám hiểm tri thức tùy chỉnh nhé!
        </p>
        <button
          onClick={() => setPlayerState((prev) => ({ ...prev, activeTab: "home" }))}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-3 rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/20 cursor-pointer"
        >
          Trở về nạp tài liệu
        </button>
      </div>
    );
  }

  // Calculate overall progress percentage
  const totalChaptersCount = campaign.chapters.length;
  const completedChaptersCount = playerState.completedChapters.length;
  const progressPercent = Math.round((completedChaptersCount / totalChaptersCount) * 100);

  // Stats info
  const nextLevelXp = playerState.level * 150;
  const xpPercent = Math.min(Math.round((playerState.xp / nextLevelXp) * 100), 100);

  return (
    <div className="max-w-5xl mx-auto py-4 px-4">
      {/* Campaign Banner HUD */}
      <div className="bg-[#1E293B] border-4 border-[#334155] rounded-[32px] p-6 mb-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <div className="text-xs text-emerald-400 uppercase font-mono tracking-widest flex items-center gap-1.5 mb-1.5">
              <Compass size={14} className="animate-spin-slow" /> Chiến dịch thám hiểm hiện tại
            </div>
            <h2 className="text-3xl font-extrabold text-white font-sans tracking-tight mb-2">
              {campaign.campaignTitle}
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-xs bg-slate-900 border border-slate-700 px-2.5 py-0.5 rounded-full font-mono text-slate-300">
                Tiến độ: {completedChaptersCount}/{totalChaptersCount} Ải ({progressPercent}%)
              </span>
              {playerState.items.doubleXp && (
                <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1">
                  <Sparkles size={12} className="animate-pulse" /> Đã Kích X2 XP
                </span>
              )}
            </div>
            
            {/* Export Actions */}
            <div className="flex gap-2 mt-4">
              <button 
                onClick={() => exportToDocx(campaign)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold py-1.5 px-3 rounded-lg transition-colors border border-blue-500/50 shadow-sm cursor-pointer"
              >
                <FileText size={16} /> Xuất Đề Thi (Docx)
              </button>
              <button 
                onClick={() => exportToPptx(campaign)}
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold py-1.5 px-3 rounded-lg transition-colors border border-orange-500/50 shadow-sm cursor-pointer"
              >
                <Presentation size={16} /> Xuất Bài Giảng (Pptx)
              </button>
            </div>
          </div>

          {/* Quick HUD Stats */}
          <div className="w-full md:w-auto bg-[#0F172A] border-2 border-slate-700 rounded-2xl p-4 flex flex-col gap-3 min-w-[280px]">
            {/* Level & XP */}
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-400 mb-1.5">
                <span>Cấp độ {playerState.level}</span>
                <span>{playerState.xp} / {nextLevelXp} XP</span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
            </div>

            {/* Hearts & Gold */}
            <div className="flex justify-between items-center border-t border-slate-800 pt-2 text-sm">
              <div className="flex items-center gap-1">
                <span className="text-xs font-mono text-slate-400 mr-1.5">Sinh mệnh:</span>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Heart
                    key={i}
                    size={16}
                    className={`${
                      i < playerState.hearts
                        ? "text-rose-500 fill-rose-500"
                        : "text-slate-700"
                    } transition-colors`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1.5 font-mono text-amber-400 font-bold">
                <Coins size={16} className="text-amber-400" />
                <span>{playerState.gold}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Nodes and Progression Line */}
      <div className="mb-10 text-center">
        <h3 className="text-lg font-bold text-gray-300 font-sans tracking-wide mb-6 uppercase tracking-widest text-xs text-gray-400">
          📍 Con Đường Chinh Phục Cổ Vật Tri Thức
        </h3>

        {/* Visual Road Layout */}
        <div className="relative flex flex-col md:flex-row justify-between items-center gap-8 md:gap-4 max-w-4xl mx-auto px-4">
          
          {/* Connector Line behind cards (Desktop only) */}
          <div className="absolute top-1/2 left-16 right-16 h-1 bg-slate-800 -translate-y-1/2 z-0 hidden md:block" />

          {campaign.chapters.map((chapter, index) => {
            const isCompleted = playerState.completedChapters.includes(chapter.id);
            const isUnlocked = playerState.unlockedChapters.includes(chapter.id);
            const isBoss = chapter.isBoss;

            return (
              <div key={chapter.id} className="relative z-10 w-full md:w-64">
                
                {/* SVG Connecting Path indicator for active node */}
                {isUnlocked && !isCompleted && (
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-2xl animate-bounce hidden md:block">
                    ⚔️
                  </div>
                )}

                <motion.div
                  whileHover={isUnlocked ? { scale: 1.03, y: -4 } : {}}
                  className={`bg-[#1E293B] border-4 rounded-[32px] p-5 flex flex-col items-center justify-between min-h-[300px] transition-all duration-300 shadow-xl ${
                    isCompleted
                      ? "border-emerald-500 bg-[#1E293B]/70"
                      : isUnlocked
                      ? "border-indigo-500 shadow-indigo-950/10 hover:border-amber-400"
                      : "border-slate-700 bg-slate-800/40 text-slate-500 opacity-60"
                  }`}
                >
                  <div className="text-center w-full">
                    {/* Chapter Avatar Badge */}
                    <div className="flex justify-center mb-3">
                      <div
                        className={`w-14 h-14 rounded-full border-2 flex items-center justify-center text-2xl shadow-inner ${
                          isCompleted
                            ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                            : isUnlocked
                            ? isBoss
                              ? "bg-rose-500/10 border-rose-500 text-rose-400 animate-pulse"
                              : "bg-amber-500/10 border-amber-500 text-amber-400"
                            : "bg-slate-900 border-slate-750 text-slate-700"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 size={28} />
                        ) : isUnlocked ? (
                          isBoss ? "👹" : "👾"
                        ) : (
                          <Lock size={20} />
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-widest block mb-1">
                      ẢI 0{index + 1} {isBoss && "• BOSS"}
                    </span>
                    <h4 className="text-md font-bold text-white font-sans tracking-tight mb-1">
                      {chapter.title}
                    </h4>
                    <span className="text-xs font-mono text-emerald-400 block mb-3">
                      🏞️ {chapter.areaName}
                    </span>

                    {/* Monster Tag */}
                    <div className="bg-[#0F172A]/85 border-2 border-slate-700 rounded-xl py-2 px-3 mb-4 text-xs text-left">
                      <div className="text-[10px] text-slate-500 uppercase font-mono">Thủ Vệ Trấn Giữ</div>
                      <div className="font-bold text-gray-200 mt-0.5 flex items-center justify-between">
                        <span>{chapter.monsterName}</span>
                        <span className="text-[10px] font-mono text-rose-500">HP 100</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1 leading-normal italic">
                        "{chapter.monsterDescription}"
                      </p>
                    </div>
                  </div>

                  {/* Battle Controls */}
                  <div className="w-full mt-2">
                    {isCompleted ? (
                      <div className="w-full py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5">
                        <CheckCircle2 size={14} /> Ải đã hoàn thành
                      </div>
                    ) : isUnlocked ? (
                      <button
                        onClick={() => onStartBattle(chapter.id)}
                        className={`w-full py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all duration-300 shadow-md ${
                          isBoss
                            ? "bg-rose-600 text-white hover:bg-rose-500 hover:shadow-rose-600/20 cursor-pointer"
                            : "bg-amber-500 text-slate-950 hover:bg-amber-400 hover:shadow-amber-500/20 cursor-pointer"
                        }`}
                      >
                        <Swords size={14} /> {isBoss ? "KHIÊU CHIẾN BOSS" : "CHIẾN ĐẤU QUA ẢI"}
                      </button>
                    ) : (
                      <div className="w-full py-2.5 bg-[#0F172A] text-slate-600 border border-slate-800 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5">
                        <Lock size={14} /> Thất Truyền (Đang Khóa)
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
