import React, { useState } from "react";
import { PlayerState } from "../types";
import { Sparkles, Heart, HelpCircle, Shield, Zap, Coins } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ShopProps {
  playerState: PlayerState;
  setPlayerState: React.Dispatch<React.SetStateAction<PlayerState>>;
}

export default function Shop({ playerState, setPlayerState }: ShopProps) {
  const [dialogText, setDialogText] = useState(
    "Chào mừng nhà thám hiểm trẻ tuổi! Ngươi cần trang bị những bảo vật ma thuật gì để vượt qua các Thủ vệ Tri thức hung tợn đây?"
  );

  const shopItems = [
    {
      id: "revive",
      name: "Bình Hồi Sinh Thượng Hạng",
      description: "Hồi sinh ngay lập tức với 5 trái tim đỏ mọng khi thất bại ở một chương.",
      cost: 50,
      icon: <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />,
      tag: "Cứu mạng",
    },
    {
      id: "hint",
      name: "Cuộn Sách Tiên Tri (Gợi ý)",
      description: "Xem gợi ý của câu hỏi ngay lập tức mà không phải tốn HP hay lo lắng.",
      cost: 20,
      icon: <HelpCircle className="w-8 h-8 text-sky-400" />,
      tag: "Học tập",
    },
    {
      id: "shield",
      name: "Khiên Trí Tuệ Vạn Năng",
      description: "Bảo vệ bạn khỏi bị trừ Trái tim ở 1 câu trả lời sai tiếp theo.",
      cost: 35,
      icon: <Shield className="w-8 h-8 text-emerald-400" />,
      tag: "Bảo vệ",
    },
    {
      id: "doubleXp",
      name: "Bùa Chú Đại Hồn (X2 XP)",
      description: "Nhân đôi toàn bộ Điểm Kinh Nghiệm (XP) nhận được ở chương thám hiểm tiếp theo.",
      cost: 45,
      icon: <Zap className="w-8 h-8 text-amber-400 fill-amber-400" />,
      tag: "Tăng tốc",
    },
  ];

  const handleBuy = (item: typeof shopItems[0]) => {
    if (playerState.gold < item.cost) {
      setDialogText("Ôi không... túi vàng của ngươi xẹp lép rồi kìa! Hãy trả lời đúng thêm câu hỏi để tích lũy tiền vàng nhé.");
      return;
    }

    if (item.id === "doubleXp" && playerState.items.doubleXp) {
      setDialogText("Ngươi đang sở hữu một Bùa chú X2 XP chưa kích hoạt rồi. Hãy thám hiểm để tiêu thụ nó trước đã!");
      return;
    }

    // Process purchase
    setPlayerState((prev) => {
      const updatedItems = { ...prev.items };
      if (item.id === "revive") updatedItems.revive += 1;
      else if (item.id === "hint") updatedItems.hint += 1;
      else if (item.id === "shield") updatedItems.shield += 1;
      else if (item.id === "doubleXp") updatedItems.doubleXp = true;

      return {
        ...prev,
        gold: prev.gold - item.cost,
        items: updatedItems,
      };
    });

    setDialogText(`Tuyệt vời! Ngươi đã sở hữu thành công "${item.name}". Bảo vật này chắc chắn sẽ hộ mệnh đắc lực cho ngươi!`);
  };

  return (
    <div className="max-w-4xl mx-auto py-4 px-4">
      {/* Header and Stats */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold font-sans tracking-tight text-white flex items-center gap-2">
            <Sparkles className="text-amber-400 animate-pulse" /> Tiệm Ma Thuật Tri Thức
          </h2>
          <p className="text-slate-300 text-sm">Nơi đổi vàng lấy những pháp bảo trợ chiến đắc lực trên hành trình</p>
        </div>
        <div className="bg-[#1E293B] border-2 border-amber-500/50 rounded-2xl px-4 py-2 flex items-center gap-3 shadow-lg shadow-amber-500/5">
          <Coins className="text-amber-400 animate-bounce" size={24} />
          <div>
            <div className="text-xs text-slate-400 uppercase font-mono">Túi Tiền Của Bạn</div>
            <div className="text-2xl font-mono font-bold text-amber-400">{playerState.gold} <span className="text-sm font-sans">vàng</span></div>
          </div>
        </div>
      </div>

      {/* Shopkeeper Interaction Panel */}
      <div className="bg-[#1E293B] border-4 border-[#334155] rounded-[32px] p-6 mb-8 flex flex-col md:flex-row items-center gap-5 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl" />
        <div className="flex-shrink-0 relative">
          <div className="w-20 h-20 bg-slate-800 border-2 border-amber-400 rounded-full flex items-center justify-center text-4xl shadow-inner select-none animate-bounce">
            🧙‍♂️
          </div>
          <span className="absolute bottom-0 right-0 bg-amber-500 text-slate-950 font-bold text-xs px-1.5 py-0.5 rounded-full">Albus</span>
        </div>
        <div className="flex-1">
          <div className="text-xs text-amber-400 font-mono mb-1 tracking-widest uppercase">Phù Thủy Tiệm Trưởng</div>
          <p className="text-slate-200 text-md leading-relaxed font-sans italic">
            "{dialogText}"
          </p>
        </div>
      </div>

      {/* Inventory Display */}
      <div className="bg-indigo-950/40 border-2 border-indigo-500/30 rounded-[32px] p-5 mb-8 shadow-inner">
        <h3 className="text-sm font-mono text-slate-300 uppercase mb-3 tracking-wider font-semibold">Hành trang của bạn</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#1E293B] rounded-2xl p-3 border border-slate-700 flex items-center gap-3">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            <div>
              <div className="text-xs text-slate-400">Thuốc Hồi Sinh</div>
              <div className="text-lg font-bold text-white font-mono">{playerState.items.revive}</div>
            </div>
          </div>
          <div className="bg-[#1E293B] rounded-2xl p-3 border border-slate-700 flex items-center gap-3">
            <HelpCircle className="w-5 h-5 text-sky-400" />
            <div>
              <div className="text-xs text-slate-400">Sách Gợi Ý</div>
              <div className="text-lg font-bold text-white font-mono">{playerState.items.hint}</div>
            </div>
          </div>
          <div className="bg-[#1E293B] rounded-2xl p-3 border border-slate-700 flex items-center gap-3">
            <Shield className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="text-xs text-slate-400">Khiên Trí Tuệ</div>
              <div className="text-lg font-bold text-white font-mono">{playerState.items.shield}</div>
            </div>
          </div>
          <div className="bg-[#1E293B] rounded-2xl p-3 border border-slate-700 flex items-center gap-3">
            <Zap className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-xs text-slate-400">Bùa X2 XP</div>
              <div className="text-sm font-bold text-white font-sans">
                {playerState.items.doubleXp ? "Đã chuẩn bị" : "Chưa có"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Items For Sale Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {shopItems.map((item) => (
          <motion.div
            key={item.id}
            whileHover={{ scale: 1.01 }}
            className="bg-slate-800/50 border-2 border-slate-700 hover:border-indigo-500 rounded-[32px] p-5 flex gap-4 transition-all duration-300 relative shadow-md"
          >
            <div className="flex-shrink-0 bg-[#1E293B] w-16 h-16 rounded-2xl flex items-center justify-center border border-slate-750">
              {item.icon}
            </div>
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-lg font-bold text-white">{item.name}</h4>
                  <span className="text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded bg-slate-900 text-amber-400 font-semibold">
                    {item.tag}
                  </span>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-3">{item.description}</p>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1.5 font-mono text-amber-400 font-bold">
                  <Coins size={18} className="text-amber-400" />
                  <span>{item.cost} vàng</span>
                </div>
                <button
                  onClick={() => handleBuy(item)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    playerState.gold >= item.cost
                      ? "bg-amber-500 text-slate-950 hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/20 active:scale-95 cursor-pointer"
                      : "bg-slate-800 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Mua bảo vật
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
