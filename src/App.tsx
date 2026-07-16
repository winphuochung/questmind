import React, { useState, useEffect } from "react";
import { PlayerState, Campaign } from "./types";
import { PRELOADED_MATERIALS } from "./data/puzzles";
import {
  Sparkles,
  Swords,
  Heart,
  Coins,
  BrainCircuit,
  Grid,
  HelpCircle,
  Shield,
  Trash2,
  Globe,
  FileText,
  ImageIcon,
  Compass,
  Info,
  ChevronRight,
  BookOpen,
  CheckCircle2,
  User,
  RefreshCw,
  Cloud,
  Upload,
  Save,
  Settings,
  Key,
  BarChart2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { generateCampaign } from "./utils/gemini";
import { mockCloudSync } from "./utils/authSync";

// Sub-components
import Map from "./components/Map";
import Combat from "./components/Combat";
import Shop from "./components/Shop";
import Collection from "./components/Collection";
import Tutor from "./components/Tutor";
import LoginScreen from "./components/LoginScreen";
import Stats from "./components/Stats";

// Storage Key
const LOCAL_STORAGE_KEY = "ai_rpg_learning_state_v1";

// Initial Empty Player State
const DEFAULT_PLAYER_STATE: PlayerState = {
  xp: 0,
  level: 1,
  gold: 150, // Generous starting gold to buy shields/potions immediately
  hearts: 5,
  items: {
    revive: 1,
    hint: 2,
    shield: 1,
    doubleXp: false,
  },
  history: [],
  activeCampaign: undefined,
  unlockedChapters: ["chapter_1"],
  completedChapters: [],
  collectedPieces: {
    halong_bay: [0, 4], // Give starting pieces to let user explore the gallery board
  },
  completedPuzzles: [],
  activeTab: "home",
  activeChapterId: undefined,
};

export default function App() {
  const [playerState, setPlayerState] = useState<PlayerState>(DEFAULT_PLAYER_STATE);
  const [loadingCampaign, setLoadingCampaign] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Profile Edit & Sync States
  const [showEditProfileModal, setShowEditProfileModal] = useState<boolean>(false);
  const [editUsername, setEditUsername] = useState<string>("");
  const [editAvatar, setEditAvatar] = useState<string>("🧙‍♂️");
  const [editCustomAvatarBase64, setEditCustomAvatarBase64] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Settings & Gemini Config
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => localStorage.getItem("GEMINI_API_KEY") || "");
  const [geminiModel, setGeminiModel] = useState<string>(() => localStorage.getItem("GEMINI_MODEL") || "gemini-3-flash-preview");

  // Form Inputs
  const [customNotes, setCustomNotes] = useState<string>("");
  const [websiteUrl, setWebsiteUrl] = useState<string>("");
  const [uploadedFileText, setUploadedFileText] = useState<string>("");
  const [uploadedFileMime, setUploadedFileMime] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);

  // Drag and drop state
  const [dragActive, setDragActive] = useState<boolean>(false);

  // Auto sync helper (mocked for SPA)
  const syncStateToServer = async (stateToSync: PlayerState) => {
    try {
      await mockCloudSync(stateToSync);
    } catch (e) {
      console.error("Auto sync failed", e);
    }
  };

  // Manual sync trigger (mocked for SPA)
  const syncStateToServerManual = async () => {
    if (!playerState.phoneOrEmail) return;
    setSyncing(true);
    setSyncMessage(null);
    try {
      await mockCloudSync(playerState);
      setSyncMessage("Đồng bộ dữ liệu Đám Mây thành công! Tiến trình học thuật đã được lưu trữ an toàn.");
      setTimeout(() => setSyncMessage(null), 4000);
    } catch (e: any) {
      setSyncMessage("Thất bại. Hãy thử lại sau.");
      setTimeout(() => setSyncMessage(null), 3000);
    } finally {
      setSyncing(false);
    }
  };

  // Load state on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Guarantee hearts are refilled on fresh load if dead, for playability
        if (parsed.hearts <= 0) {
          parsed.hearts = 5;
        }
        setPlayerState(parsed);
      }
      // Check if API Key is missing, then show Settings Modal
      if (!localStorage.getItem("GEMINI_API_KEY")) {
        setShowSettingsModal(true);
      }
    } catch (e) {
      console.error("Error parsing local state:", e);
    }
  }, []);

  // Save state on change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(playerState));
    if (playerState.isLoggedIn && playerState.phoneOrEmail) {
      syncStateToServer(playerState);
    }
  }, [playerState]);



  // Read uploaded text or image file
  const handleFileProcess = async (file: File) => {
    setUploadedFileName(file.name);
    setUploadedFileMime(file.type);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const resultStr = reader.result as string;
        const base64Data = resultStr.split(",")[1];
        setUploadedImageBase64(base64Data);
        setUploadedFileText(""); // Clear text
      };
    } else {
      // Treat as plain text
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = () => {
        setUploadedFileText(reader.result as string);
        setUploadedImageBase64(null); // Clear image
      };
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleFileProcess(e.target.files[0]);
    }
  };

  const clearUploadedFile = () => {
    setUploadedFileName("");
    setUploadedFileMime(null);
    setUploadedFileText("");
    setUploadedImageBase64(null);
  };

  // Launch campaign creation
  const launchCampaign = async (notes: string, link: string, imgBase64: string | null, imgMime: string | null) => {
    setLoadingCampaign(true);
    setErrorMessage(null);
    setLoadingStep(0); // Bắt đầu

    try {
      // Giả lập bước 1: Khởi tạo dữ liệu & xử lý Prompt
      await new Promise(res => setTimeout(res, 600));
      setLoadingStep(1); 
      await new Promise(res => setTimeout(res, 600));

      // Bước 2: Khởi chạy AI
      setLoadingStep(2);
      const generatedCampaign: Campaign = await generateCampaign({
        materialText: notes,
        websiteLink: link,
        imageBase64: imgBase64 || undefined,
        mimeType: imgMime || undefined,
      });

      // Bước 3: Hoàn tất
      setLoadingStep(3);
      await new Promise(res => setTimeout(res, 600));

      setPlayerState((prev) => ({
        ...prev,
        activeCampaign: generatedCampaign,
        unlockedChapters: ["chapter_1"],
        completedChapters: [],
        hearts: 5,
        activeTab: "map",
      }));
      setLoadingCampaign(false);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Kết nối máy chủ bị lỗi. Hãy kiểm tra khóa API.");
      // Không đặt setLoadingCampaign(false) để user thấy trạng thái lỗi trên cột tiến trình
    }
  };

  const handleStartCustomNotes = () => {
    const combinedText = [
      customNotes && `GHI CHÚ CHI TIẾT:\n${customNotes}`,
      uploadedFileText && `NỘI DUNG TẬP TIN ĐÍNH KÈM:\n${uploadedFileText}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    launchCampaign(combinedText, websiteUrl, uploadedImageBase64, uploadedFileMime);
  };

  const handleStartPreloaded = (id: string) => {
    const matched = PRELOADED_MATERIALS.find((m) => m.id === id);
    if (matched) {
      launchCampaign(matched.content, "", null, null);
    }
  };

  const handleResetState = () => {
    if (confirm("Bạn có chắc muốn xóa sạch toàn bộ lịch sử thám hiểm, trang bị và tiền vàng để làm lại từ đầu không?")) {
      setPlayerState(DEFAULT_PLAYER_STATE);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setCustomNotes("");
      setWebsiteUrl("");
      clearUploadedFile();
    }
  };

  const handleOpenEditProfile = () => {
    setEditUsername(playerState.username || "");
    const isPreset = ["🧙‍♂️", "⚔️", "🏹", "🛡️", "📜", "🦊", "🐉", "🧑‍🚀"].includes(playerState.avatar || "");
    if (isPreset) {
      setEditAvatar(playerState.avatar || "🧙‍♂️");
      setEditCustomAvatarBase64(null);
    } else {
      setEditAvatar("CUSTOM");
      setEditCustomAvatarBase64(playerState.avatar || null);
    }
    setShowEditProfileModal(true);
  };

  const handleEditCustomAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.readAsDataURL(e.target.files[0]);
      reader.onload = () => {
        setEditCustomAvatarBase64(reader.result as string);
        setEditAvatar("CUSTOM");
      };
    }
  };

  const handleSaveProfile = async () => {
    if (!editUsername.trim()) return;
    const finalAvatar = editAvatar === "CUSTOM" && editCustomAvatarBase64 ? editCustomAvatarBase64 : editAvatar;
    
    const updatedState: PlayerState = {
      ...playerState,
      username: editUsername.trim(),
      avatar: finalAvatar,
    };
    
    setPlayerState(updatedState);
    setShowEditProfileModal(false);
    await syncStateToServer(updatedState);
  };

  const handleLogout = () => {
    if (confirm("Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này không? Tiến trình học tập hiện tại đã được đồng bộ hóa đám mây.")) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setPlayerState(DEFAULT_PLAYER_STATE);
    }
  };

  const handleSaveSettings = () => {
    localStorage.setItem("GEMINI_API_KEY", geminiApiKey.trim());
    localStorage.setItem("GEMINI_MODEL", geminiModel);
    setShowSettingsModal(false);
  };

  if (!playerState.isLoggedIn) {
    return (
      <LoginScreen onLoginSuccess={(loggedInState) => {
        setPlayerState(loggedInState);
      }} />
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col font-sans select-none antialiased">
      
      {/* Upper Navigation Bar */}
      <header className="border-b-4 border-[#334155] bg-[#1E293B] sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Logo & Title */}
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => setPlayerState((prev) => ({ ...prev, activeTab: "home" }))}
          >
            <div className="w-10 h-10 bg-gradient-to-tr from-purple-500 via-indigo-600 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 border border-purple-400/20">
              <svg className="w-6 h-6 text-white" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
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
            <div>
              <h1 className="text-xl font-bold font-display tracking-tight text-white flex items-center gap-1.5">
                QuestMind AI <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-mono">RPG v1.0</span>
              </h1>
              <p className="text-[10px] text-gray-500 font-mono">Học Tập Bằng Game Nhập Vai & AI Gia Sư</p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex flex-wrap justify-center items-center gap-1.5">
            <button
              onClick={() => setPlayerState((prev) => ({ ...prev, activeTab: "home" }))}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
                playerState.activeTab === "home"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/15"
                  : "text-gray-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              Trang Chủ
            </button>

            {playerState.activeCampaign && (
              <button
                onClick={() => setPlayerState((prev) => ({ ...prev, activeTab: "map" }))}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${
                  playerState.activeTab === "map" || playerState.activeTab === "battle"
                    ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/15"
                    : "text-gray-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <Compass size={14} /> Bản Đồ
              </button>
            )}

            <button
              onClick={() => setPlayerState((prev) => ({ ...prev, activeTab: "puzzles" }))}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${
                playerState.activeTab === "puzzles"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/15"
                  : "text-gray-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <Grid size={14} /> Thư Viện Mảnh Ghép
            </button>

            <button
              onClick={() => setPlayerState((prev) => ({ ...prev, activeTab: "tutor" }))}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${
                playerState.activeTab === "tutor"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/15"
                  : "text-gray-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <BrainCircuit size={14} /> Pháp Sư AI
            </button>

            <button
              onClick={() => setPlayerState((prev) => ({ ...prev, activeTab: "shop" }))}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${
                playerState.activeTab === "shop"
                  ? "bg-slate-800 text-amber-400 border border-amber-500/30"
                  : "text-gray-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              Tiệm Pháp Bảo
            </button>

            <button
              onClick={() => setPlayerState((prev) => ({ ...prev, activeTab: "stats" }))}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${
                playerState.activeTab === "stats"
                  ? "bg-pink-600 text-white shadow-lg shadow-pink-600/15"
                  : "text-gray-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <BarChart2 size={14} /> Thống Kê
            </button>
          </nav>

          {/* User Profile Info Widget & Cloud Sync Indicator */}
          <div className="flex items-center gap-3 bg-slate-950/40 p-1.5 pl-3 pr-2.5 rounded-2xl border border-slate-700/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
                {playerState.avatar && playerState.avatar.startsWith("data:") ? (
                  <img src={playerState.avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-lg">{playerState.avatar || "🧙‍♂️"}</span>
                )}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white max-w-[90px] truncate leading-tight">
                  {playerState.username || "Hiệp Sĩ"}
                </div>
                <div className="text-[9px] text-indigo-300 font-mono">
                  Cấp {playerState.level} Scholar
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 border-l border-slate-700/60 pl-2">
              <button
                onClick={handleOpenEditProfile}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
                title="Sửa hồ sơ & Đổi Avatar"
              >
                <Edit2 size={13} />
              </button>
              <button
                onClick={syncStateToServerManual}
                disabled={syncing}
                className={`p-1.5 hover:bg-slate-800 rounded-lg transition-all cursor-pointer relative ${
                  syncing ? "text-purple-400 animate-spin" : "text-emerald-400 hover:text-emerald-300"
                }`}
                title="Đồng bộ Đám mây cứu hộ"
              >
                <Cloud size={13} />
                <span className="absolute top-1 right-1 w-1 h-1 bg-emerald-500 rounded-full animate-ping" />
              </button>
              <button
                onClick={() => setShowSettingsModal(true)}
                className="p-1.5 hover:bg-slate-800 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 font-bold text-xs border border-slate-700/50 bg-slate-900/50 px-2"
                title="Cài đặt API Key"
              >
                <Settings size={13} className="text-slate-300" />
                <span className="text-slate-300">Settings (API Key)</span>
                <span className="hidden sm:inline text-red-400 ml-1 animate-pulse">Lấy API key để sử dụng app</span>
              </button>
              <button
                onClick={handleLogout}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-rose-400 hover:text-rose-300 transition-all cursor-pointer"
                title="Đăng xuất khỏi tài khoản"
              >
                <LogOut size={13} />
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Main Container Stage */}
      <main className="flex-grow py-8 relative bg-gradient-to-b from-[#0F172A] to-[#1E1B4B]">
        
        {/* Full screen loading wizard */}
        <AnimatePresence>
          {loadingCampaign && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/95 z-50 flex flex-col items-center justify-center text-center p-6"
            >
              <div className="relative mb-6">
                <div className={`w-24 h-24 rounded-full border-4 ${errorMessage ? 'border-red-500/20 border-t-red-500' : 'border-indigo-500/20 border-t-indigo-500 animate-spin'}`} />
                <div className="absolute inset-0 flex items-center justify-center text-3xl animate-pulse">
                  {errorMessage ? "⚠️" : "🧙‍♂️"}
                </div>
              </div>

              <h2 className="text-2xl font-bold text-white mb-6 font-display">
                {errorMessage ? "Nghi thức thất bại" : "Đại Pháp Sư Trí Tuệ đang thi triển..."}
              </h2>
              
              {/* Progress Columns */}
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-3xl">
                {["Khởi tạo dữ liệu", "Xử lý & Prompt", "Khởi chạy AI", "Hoàn tất Campaign"].map((stepName, i) => {
                  let status = "pending";
                  if (i < loadingStep) status = "success";
                  else if (errorMessage) status = "error";
                  else if (i === loadingStep) status = "loading";

                  let bgClass = "bg-slate-900 border-slate-800 text-slate-500";
                  if (status === "success") bgClass = "bg-emerald-950/50 border-emerald-500/50 text-emerald-400";
                  if (status === "loading") bgClass = "bg-indigo-950/50 border-indigo-500/50 text-indigo-400 animate-pulse";
                  if (status === "error") bgClass = "bg-red-950/50 border-red-500/50 text-red-400";

                  return (
                    <div key={i} className={`flex-1 p-3 border-2 rounded-xl flex flex-col gap-1.5 transition-all ${bgClass}`}>
                      <span className="font-bold text-xs uppercase tracking-wider">{stepName}</span>
                      <span className="text-[10px] opacity-80">
                        {status === "success" && "Hoàn tất"}
                        {status === "loading" && "Đang xử lý..."}
                        {status === "pending" && "Đang chờ"}
                        {status === "error" && "Đã dừng do lỗi"}
                      </span>
                    </div>
                  );
                })}
              </div>

              {errorMessage && (
                <div className="mt-8 bg-red-950/50 border border-red-500/30 p-4 rounded-xl text-red-400 text-sm max-w-2xl text-left">
                  <span className="font-bold">Lỗi:</span> {errorMessage}
                </div>
              )}

              {errorMessage && (
                <button
                  onClick={() => setLoadingCampaign(false)}
                  className="mt-6 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-sm transition-all"
                >
                  Đóng & Thử lại
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Workspace Router */}
        <AnimatePresence mode="wait">
          <motion.div
            key={playerState.activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            {playerState.activeTab === "home" && (
              <div className="max-w-5xl mx-auto px-4">
                
                {/* Hero Greeting Panel */}
                <div className="text-center max-w-3xl mx-auto mb-10">
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 6 }}
                    className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-3xl mb-4"
                  >
                    🚀
                  </motion.div>
                  <h2 className="text-4xl font-extrabold text-white font-display tracking-tight mb-3">
                    Biến Kiến Thức Khô Khan Thành Đấu Trường Sinh Tử!
                  </h2>
                  <p className="text-gray-400 text-md leading-relaxed">
                    Nạp bất kỳ tập tin ghi chú, chụp ảnh đề thi, hay dán link slide bài giảng của bạn vào đây.
                    Trí tuệ nhân tạo Gemini sẽ ngay lập tức phong ấn tri thức ấy thành quái thú và thiết kế con đường phiêu lưu RPG đầy thú vị!
                  </p>
                </div>

                {errorMessage && (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 mb-8 text-rose-400 text-sm flex gap-2.5 max-w-3xl mx-auto">
                    <Info className="flex-shrink-0 mt-0.5" size={18} />
                    <div>
                      <span className="font-bold">Luyện chế ma pháp bị lỗi:</span> {errorMessage}
                      <p className="text-[11px] text-gray-500 mt-1 leading-normal">
                        Mẹo: Đảm bảo thiết lập đầy đủ khóa bí mật <strong>GEMINI_API_KEY</strong> trong menu Secrets bên trái.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
                  
                  {/* Left Column: File & Text Uploader */}
                  <div className="lg:col-span-7 bg-slate-800/50 border-2 border-slate-700 rounded-[32px] p-6 shadow-xl flex flex-col gap-5">
                    <h3 className="text-lg font-bold text-white font-display border-b-2 border-slate-700 pb-3 flex items-center gap-1.5">
                      📥 Thiết kế Hành Trình Tùy Chỉnh
                    </h3>

                    {/* Personal Notes Textarea */}
                    <div>
                      <label className="block text-xs font-mono text-gray-400 uppercase tracking-widest mb-1.5">
                        Ghi Chú Cá Nhân / Đề cương học tập
                      </label>
                      <textarea
                        rows={5}
                        placeholder="Dán đề cương, ghi chú, nội dung lý thuyết hay đề bài cần giải đáp vào đây..."
                        value={customNotes}
                        onChange={(e) => setCustomNotes(e.target.value)}
                        className="w-full bg-slate-950 text-white p-3.5 rounded-xl border border-slate-850 focus:border-indigo-500/40 outline-none text-sm leading-relaxed resize-none"
                      />
                    </div>

                    {/* Link Website */}
                    <div>
                      <label className="block text-xs font-mono text-gray-400 uppercase tracking-widest mb-1.5">
                        Dán liên kết Website tài liệu (Slide, bài báo)
                      </label>
                      <div className="flex gap-2">
                        <div className="bg-slate-950 px-3 flex items-center justify-center rounded-xl border border-slate-850 text-gray-500">
                          <Globe size={16} />
                        </div>
                        <input
                          type="url"
                          placeholder="https://example.com/bai-hoc-cua-ban"
                          value={websiteUrl}
                          onChange={(e) => setWebsiteUrl(e.target.value)}
                          className="flex-1 bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-850 focus:border-indigo-500/40 outline-none text-sm"
                        />
                      </div>
                    </div>

                    {/* Drag-and-drop file/image area */}
                    <div>
                      <label className="block text-xs font-mono text-gray-400 uppercase tracking-widest mb-1.5">
                        Đính kèm tập tin (.txt, .md) hoặc Ảnh chụp slide/ghi chú
                      </label>

                      <div
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 relative ${
                          dragActive
                            ? "border-indigo-500 bg-indigo-500/5"
                            : uploadedFileName
                            ? "border-emerald-500 bg-emerald-500/5"
                            : "border-slate-800 hover:border-slate-700 hover:bg-slate-950/40"
                        }`}
                      >
                        {uploadedFileName ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400">
                              {uploadedFileMime?.startsWith("image/") ? <ImageIcon size={20} /> : <FileText size={20} />}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-white max-w-[280px] truncate mx-auto">
                                {uploadedFileName}
                              </div>
                              <div className="text-[10px] text-gray-500 mt-0.5">
                                {uploadedFileMime?.startsWith("image/") ? "Ảnh đã nạp thành công" : "Tài liệu văn bản đã nạp"}
                              </div>
                            </div>
                            <button
                              onClick={clearUploadedFile}
                              className="mt-2 text-xs text-rose-400 hover:text-rose-300 underline cursor-pointer"
                            >
                              Gỡ bỏ tập tin
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 cursor-pointer">
                            <div className="text-gray-500 text-3xl mb-1">📁</div>
                            <p className="text-sm text-gray-300">
                              Kéo thả tài liệu học hoặc <span className="text-indigo-400 font-semibold underline">nhấp để duyệt</span>
                            </p>
                            <p className="text-xs text-gray-500">Hỗ trợ ảnh chụp màn hình, .txt, .md</p>
                            <input
                              type="file"
                              accept="text/plain,text/markdown,image/*"
                              onChange={handleFileInputChange}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={handleStartCustomNotes}
                      disabled={!customNotes && !websiteUrl && !uploadedFileName}
                      className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:from-slate-800 disabled:to-slate-800 disabled:opacity-40 text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-indigo-600/10 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Swords size={18} /> KHỞI TẠO ĐẠI LỤC PHIÊU LƯU AI
                    </button>
                  </div>

                  {/* Right Column: Preloaded campaigns */}
                  <div className="lg:col-span-5 flex flex-col gap-4">
                    <div className="bg-slate-800/50 border-2 border-slate-700 rounded-[32px] p-6 shadow-xl">
                      <h3 className="text-lg font-bold text-white font-display border-b-2 border-slate-700 pb-3 mb-4 flex items-center gap-1.5">
                        🏛️ Chọn Hành Trình Truyền Thuyết Có Sẵn
                      </h3>
                      <p className="text-slate-300 text-xs mb-4">
                        Nếu bạn muốn trải nghiệm game nhanh, hãy nhấp chọn một trong ba chiến dịch cổ xưa được tạo mẫu dưới đây:
                      </p>

                      <div className="flex flex-col gap-3">
                        {PRELOADED_MATERIALS.map((material) => (
                          <button
                            key={material.id}
                            onClick={() => handleStartPreloaded(material.id)}
                            className="p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500 text-left rounded-2xl transition-all duration-300 group flex items-start gap-3.5 cursor-pointer relative overflow-hidden"
                          >
                            <div className="w-10 h-10 bg-slate-850 rounded-xl flex items-center justify-center text-xl flex-shrink-0 border border-slate-700 text-amber-400">
                              📜
                            </div>
                            <div className="flex-1">
                              <span className="text-[9px] uppercase font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/10">
                                {material.category}
                              </span>
                              <h4 className="font-bold text-sm text-gray-200 mt-1.5 group-hover:text-amber-400 transition-colors">
                                {material.title}
                              </h4>
                              <p className="text-[11px] text-gray-400 leading-relaxed mt-1">
                                {material.description}
                              </p>
                            </div>
                            <div className="flex items-center self-center text-slate-500 group-hover:text-amber-400 transition-colors">
                              <ChevronRight size={18} />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-indigo-950/40 border-2 border-indigo-500/30 rounded-[32px] p-5 flex gap-3 text-xs text-slate-300 leading-relaxed shadow-lg">
                      <Info size={16} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-white block mb-0.5">Học tập thông minh cùng AI:</span>
                        Gia sư AI sẽ tự động phân bổ độ khó tăng dần từ nhận biết, giải thích, vận dụng tình huống thực tế đến phân tích chuyên sâu cho các ải!
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {playerState.activeTab === "map" && (
              <Map
                playerState={playerState}
                setPlayerState={setPlayerState}
                onStartBattle={(chapterId) => {
                  setPlayerState((prev) => ({
                    ...prev,
                    activeChapterId: chapterId,
                    activeTab: "battle",
                  }));
                }}
              />
            )}

            {playerState.activeTab === "battle" && (
              <Combat
                playerState={playerState}
                setPlayerState={setPlayerState}
                onQuit={() => {
                  setPlayerState((prev) => ({
                    ...prev,
                    activeTab: "map",
                    activeChapterId: undefined,
                  }));
                }}
              />
            )}

            {playerState.activeTab === "shop" && (
              <Shop playerState={playerState} setPlayerState={setPlayerState} />
            )}

            {playerState.activeTab === "puzzles" && (
              <Collection playerState={playerState} setPlayerState={setPlayerState} />
            )}

            {playerState.activeTab === "tutor" && <Tutor playerState={playerState} />}

            {playerState.activeTab === "stats" && <Stats playerState={playerState} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer controls & Reset */}
      <footer className="border-t border-[#334155] bg-[#1E293B]/90 py-8 px-4 text-center">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            <p className="text-slate-300 font-semibold">© 2026 Ải Tri Thức RPG. Mọi dữ liệu chiến trường được tinh luyện bằng Gemini 3.5 Flash.</p>
            <p className="mt-0.5 text-[10px] text-indigo-400 font-mono">Trí tuệ là vũ khí - Câu hỏi là trận chiến - Mảnh ghép là vương miện.</p>
          </div>
          <button
            onClick={handleResetState}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl transition-all duration-300 hover:text-rose-300 cursor-pointer text-[10px] font-mono font-bold"
          >
            <Trash2 size={12} /> RESET TOÀN BỘ GAME
          </button>
        </div>
      </footer>

      </footer>

      {/* Settings Modal Dialog */}
      <AnimatePresence>
        {showSettingsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border-2 border-[#334155] rounded-3xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500" />
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center border border-red-500/30 text-red-400">
                  <Key size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Cấu hình Hệ Thống AI</h3>
                  <p className="text-xs text-slate-400">Nhập API Key để mở khóa tri thức</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Gemini API Key <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-mono text-sm"
                    placeholder="AIzaSy..."
                  />
                  <p className="text-[10px] text-slate-500 mt-1.5">
                    Lấy API Key miễn phí tại <a href="https://aistudio.google.com/api-keys" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">Google AI Studio</a>. Key được lưu trữ cục bộ.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Mô Hình AI
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { id: "gemini-3-flash-preview", name: "gemini-3-flash-preview", desc: "Nhanh chóng & Hiệu quả (Mặc định)" },
                      { id: "gemini-3-pro-preview", name: "gemini-3-pro-preview", desc: "Phức tạp & Thông thái" },
                      { id: "gemini-2.5-flash", name: "gemini-2.5-flash", desc: "Mô hình ổn định cũ" }
                    ].map((model) => (
                      <div
                        key={model.id}
                        onClick={() => setGeminiModel(model.id)}
                        className={\`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 \${
                          geminiModel === model.id
                            ? "border-red-500 bg-red-500/10"
                            : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                        }\`}
                      >
                        <div className={\`w-4 h-4 rounded-full border-2 flex items-center justify-center \${geminiModel === model.id ? "border-red-500" : "border-slate-600"}\`}>
                          {geminiModel === model.id && <div className="w-2 h-2 rounded-full bg-red-500" />}
                        </div>
                        <div>
                          <div className={\`font-mono text-xs font-bold \${geminiModel === model.id ? "text-red-400" : "text-white"}\`}>{model.name}</div>
                          <div className="text-[10px] text-slate-500">{model.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-2 border-t border-slate-700/50">
                  <button
                    onClick={() => setShowSettingsModal(false)}
                    className="flex-1 bg-slate-800 hover:bg-slate-750 text-gray-300 font-bold py-2.5 rounded-xl transition-all cursor-pointer text-xs"
                  >
                    HỦY BỎ
                  </button>
                  <button
                    onClick={handleSaveSettings}
                    disabled={!geminiApiKey.trim()}
                    className="flex-1 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-bold py-2.5 rounded-xl shadow-lg transition-all cursor-pointer text-xs disabled:opacity-50"
                  >
                    LƯU CẤU HÌNH
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Profile Modal Dialog */}
      <AnimatePresence>
        {showEditProfileModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#1E293B] border-4 border-[#334155] rounded-[36px] p-6 max-w-md w-full shadow-2xl relative"
            >
              <h3 className="text-xl font-bold text-white mb-1 font-display">Chỉnh Sửa Hồ Sơ Hào Kiệt</h3>
              <p className="text-xs text-gray-400 font-mono mb-4">Thay đổi danh xưng và pháp tướng chân dung của bạn</p>

              <div className="flex flex-col gap-4">
                {/* Name */}
                <div>
                  <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1.5">Tên Hiệp Sĩ</label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-indigo-500 outline-none text-xs"
                    required
                  />
                </div>

                {/* Avatar Selection */}
                <div>
                  <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1.5">Pháp Tướng Chân Dung</label>
                  <div className="grid grid-cols-5 gap-2 mb-3">
                    {["🧙‍♂️", "⚔️", "🏹", "🛡️", "📜", "🦊", "🐉", "🧑‍🚀"].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setEditAvatar(emoji);
                          setEditCustomAvatarBase64(null);
                        }}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl border transition-all cursor-pointer ${
                          editAvatar === emoji
                            ? "bg-indigo-600/20 border-indigo-500"
                            : "bg-slate-900 border-slate-800"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}

                    {/* Upload custom option slot */}
                    <button
                      type="button"
                      onClick={() => {
                        if (editCustomAvatarBase64) {
                          setEditAvatar("CUSTOM");
                        } else {
                          document.getElementById("edit-avatar-file-input")?.click();
                        }
                      }}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all cursor-pointer overflow-hidden ${
                        editAvatar === "CUSTOM"
                          ? "bg-indigo-600/20 border-indigo-500"
                          : "bg-slate-900 border-slate-800"
                      }`}
                    >
                      {editCustomAvatarBase64 ? (
                        <img src={editCustomAvatarBase64} alt="Custom edit avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <Upload size={14} className="text-gray-400" />
                      )}
                    </button>
                  </div>

                  {/* Hidden Input File for Edit Avatar */}
                  <input
                    id="edit-avatar-file-input"
                    type="file"
                    accept="image/*"
                    onChange={handleEditCustomAvatarUpload}
                    className="hidden"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setShowEditProfileModal(false)}
                    className="flex-1 bg-slate-800 hover:bg-slate-750 text-gray-300 font-bold py-2.5 rounded-xl transition-all cursor-pointer text-xs"
                  >
                    HỦY BỎ
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white font-bold py-2.5 rounded-xl transition-all cursor-pointer text-xs flex items-center justify-center gap-1.5"
                  >
                    <Save size={14} /> LƯU HỒ SƠ
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cloud Sync Toast Notification */}
      <AnimatePresence>
        {syncMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 bg-[#1E293B] border-2 border-emerald-500/40 p-4 rounded-2xl shadow-2xl max-w-sm"
          >
            <div className="flex items-start gap-3">
              <span className="text-lg">☁️</span>
              <div>
                <h5 className="text-xs font-bold text-white font-display">Nhật Ký Thám Hiểm Đám Mây</h5>
                <p className="text-[11px] text-slate-300 leading-relaxed mt-1">{syncMessage}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
