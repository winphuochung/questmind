import React, { useState } from "react";
import { PlayerState } from "../types";
import { mockLogin } from "../utils/authSync";
import { Swords, Loader2, Sparkles, User, Mail, Phone, Upload, Image as ImageIcon } from "lucide-react";
import { motion } from "motion/react";

interface LoginScreenProps {
  onLoginSuccess: (state: PlayerState) => void;
}

const PRESET_AVATARS = ["🧙‍♂️", "⚔️", "🏹", "🛡️", "📜", "🦊", "🐉", "🧑‍🚀"];

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [phoneOrEmail, setPhoneOrEmail] = useState("");
  const [username, setUsername] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("🧙‍♂️");
  const [customAvatarBase64, setCustomAvatarBase64] = useState<string | null>(null);
  const [customAvatarName, setCustomAvatarName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCustomAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCustomAvatarName(file.name);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        setCustomAvatarBase64(base64);
        setSelectedAvatar("CUSTOM"); // Select custom avatar
      };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneOrEmail.trim()) {
      setError("Vui lòng điền Số điện thoại hoặc Gmail để nhận diện tài khoản.");
      return;
    }
    if (!username.trim()) {
      setError("Vui lòng đặt Tên Hiệp Sĩ của bạn.");
      return;
    }

    setLoading(true);
    setError(null);

    const finalAvatar = selectedAvatar === "CUSTOM" && customAvatarBase64 ? customAvatarBase64 : selectedAvatar;

    try {
      const key = phoneOrEmail.trim().toLowerCase();
      // Simulate Firebase/Clerk login and data fetch
      const playerState = await mockLogin(key, username.trim() || "Hiệp Sĩ Ẩn Danh", finalAvatar);
      
      onLoginSuccess(playerState);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Không thể đăng nhập. Hãy kiểm tra kết nối mạng.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-b from-[#0F172A] to-[#1E1B4B]">
      
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg bg-[#1E293B]/90 border-4 border-[#334155] rounded-[40px] p-8 shadow-2xl relative z-10 backdrop-blur-md"
      >
        
        {/* Header Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 bg-gradient-to-tr from-purple-500 via-indigo-600 to-pink-500 rounded-2xl items-center justify-center shadow-lg shadow-purple-500/30 mb-4 border border-purple-400/30 relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <svg className="w-10 h-10 text-white z-10 animate-pulse" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M30 35 L50 20 L70 35 L70 65 L50 80 L30 65 Z" stroke="currentColor" strokeWidth="4" strokeOpacity="0.4" fill="none" />
              <circle cx="50" cy="48" r="18" stroke="#FCD34D" strokeWidth="4" fill="none" />
              <path d="M50 30 L50 66 M32 48 L68 48" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <circle cx="50" cy="48" r="6" fill="#FCD34D" />
              <circle cx="50" cy="30" r="3" fill="currentColor" />
              <circle cx="50" cy="66" r="3" fill="currentColor" />
              <circle cx="32" cy="48" r="3" fill="currentColor" />
              <circle cx="68" cy="48" r="3" fill="currentColor" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-display uppercase">
            QuestMind AI
          </h1>
          <p className="text-xs text-indigo-400 mt-1 font-mono uppercase tracking-widest">
            Học tập bằng game nhập vai & AI gia sư
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-2xl p-4 mb-6">
            ⚠️ <span className="font-semibold">Lỗi:</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Identity input */}
          <div>
            <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
              Số Điện Thoại hoặc Gmail
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
                <Mail size={16} />
              </span>
              <input
                type="text"
                placeholder="0987654321 hoặc hiepsi@gmail.com"
                value={phoneOrEmail}
                onChange={(e) => setPhoneOrEmail(e.target.value)}
                className="w-full bg-slate-950 text-white pl-10 pr-4 py-3 rounded-2xl border border-slate-800 focus:border-indigo-500 outline-none text-sm leading-relaxed transition-all"
                required
              />
            </div>
            <p className="text-[10px] text-gray-500 mt-1.5 leading-relaxed">
              *Hệ thống sẽ đồng bộ và lưu toàn bộ tiến trình học tập, mảnh ghép cổ vật của bạn vào số điện thoại/Gmail này.
            </p>
          </div>

          {/* Name input */}
          <div>
            <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
              Đặt Tên Hiệp Sĩ (Họ tên của bạn)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
                <User size={16} />
              </span>
              <input
                type="text"
                placeholder="Nhập tên của bạn (Ví dụ: Minh Đức)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950 text-white pl-10 pr-4 py-3 rounded-2xl border border-slate-800 focus:border-indigo-500 outline-none text-sm leading-relaxed transition-all"
                required
              />
            </div>
          </div>

          {/* Avatar selector */}
          <div>
            <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
              Chọn Chân Dung Hào Kiệt (Avatar)
            </label>
            
            {/* Avatar grid selection */}
            <div className="grid grid-cols-5 gap-2.5 mb-4">
              {PRESET_AVATARS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    setSelectedAvatar(emoji);
                    setCustomAvatarBase64(null); // Deselect custom upload
                  }}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border-2 transition-all cursor-pointer ${
                    selectedAvatar === emoji
                      ? "bg-indigo-600/20 border-indigo-500 shadow-md shadow-indigo-600/10"
                      : "bg-slate-900 border-slate-800 hover:border-slate-750"
                  }`}
                >
                  {emoji}
                </button>
              ))}

              {/* Upload custom option slot */}
              <button
                type="button"
                onClick={() => {
                  if (customAvatarBase64) {
                    setSelectedAvatar("CUSTOM");
                  } else {
                    document.getElementById("avatar-file-input")?.click();
                  }
                }}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all cursor-pointer overflow-hidden ${
                  selectedAvatar === "CUSTOM"
                    ? "bg-indigo-600/20 border-indigo-500 shadow-md shadow-indigo-600/10"
                    : "bg-slate-900 border-slate-800 hover:border-slate-750"
                }`}
                title="Tải ảnh chân dung của bạn"
              >
                {customAvatarBase64 ? (
                  <img src={customAvatarBase64} alt="Custom avatar" className="w-full h-full object-cover" referrerpolicy="no-referrer" />
                ) : (
                  <Upload size={18} className="text-gray-400 hover:text-white" />
                )}
              </button>
            </div>

            {/* Hidden Input File for Avatar */}
            <input
              id="avatar-file-input"
              type="file"
              accept="image/*"
              onChange={handleCustomAvatarUpload}
              className="hidden"
            />

            {customAvatarBase64 && (
              <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-xl border border-slate-850">
                <ImageIcon size={14} className="text-emerald-400" />
                <span className="text-[10px] text-slate-300 truncate max-w-[200px]">
                  {customAvatarName || "Ảnh tùy chỉnh của bạn"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setCustomAvatarBase64(null);
                    setCustomAvatarName("");
                    setSelectedAvatar("🧙‍♂️");
                  }}
                  className="text-[10px] text-rose-400 hover:underline ml-auto cursor-pointer"
                >
                  Xóa ảnh
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white font-bold py-3.5 rounded-2xl transition-all duration-300 shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Đang khai mở tinh linh tài khoản...
              </>
            ) : (
              <>
                <Sparkles size={18} /> KHỞI HÀNH THÁM HIỂM
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
