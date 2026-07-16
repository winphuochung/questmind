import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const DB_FILE = path.join(process.cwd(), "users_db.json");

// Helper: Read server JSON database
function readDb(): Record<string, any> {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(data || "{}");
    }
  } catch (err) {
    console.error("Lỗi đọc file users_db.json:", err);
  }
  return {};
}

// Helper: Write server JSON database
function writeDb(data: Record<string, any>) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Lỗi ghi file users_db.json:", err);
  }
}

const app = express();
const PORT = 3000;

// Set up server-side Gemini client
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Helper: Ensure API key is present
function checkApiKey(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
    return res.status(500).json({
      error: "Thiếu GEMINI_API_KEY trong hệ thống. Vui lòng thiết lập trong Cài đặt > Secrets.",
    });
  }
  next();
}

/**
 * API: Generate an RPG study campaign from material
 */
app.post("/api/generate-campaign", checkApiKey, async (req, res) => {
  try {
    const { materialText, websiteLink, imageBase64, mimeType } = req.body;

    if (!materialText && !websiteLink && !imageBase64) {
      return res.status(400).json({ error: "Vui lòng cung cấp ít nhất một tài liệu học tập (ghi chú, link hoặc ảnh)." });
    }

    let promptContent: any[] = [];
    let materialDescription = "";

    if (materialText) {
      promptContent.push({ text: `Tài liệu ghi chú của người dùng:\n${materialText}\n` });
      materialDescription += "ghi chú cá nhân";
    }
    if (websiteLink) {
      promptContent.push({ text: `Link website tài liệu (hãy tự mô phỏng kiến thức xoay quanh chủ đề này hoặc phân tích thông tin từ link này):\n${websiteLink}\n` });
      materialDescription += (materialDescription ? " và " : "") + `website ${websiteLink}`;
    }
    if (imageBase64 && mimeType) {
      promptContent.push({
        inlineData: {
          data: imageBase64,
          mimeType: mimeType,
        },
      });
      promptContent.push({ text: "Hãy đọc nội dung chữ và hình vẽ từ hình ảnh tài liệu này để làm nguồn kiến thức tạo câu hỏi.\n" });
      materialDescription += (materialDescription ? " và " : "") + "ảnh chụp tài liệu";
    }

    const systemInstruction = `
Bạn là một AI Gia sư Cá nhân xuất sắc kiêm Thiết kế Game RPG giáo dục.
Nhiệm vụ của bạn là phân tích tài liệu học tập được cung cấp và tạo ra một "Hành trình Thám hiểm Tri thức" (Campaign Map) gồm đúng 3 Chương (Chapters), mỗi Chương đại diện cho một khu vực bản đồ phiêu lưu khác nhau và có một Quái vật canh giữ.
Chương cuối cùng (Chương 3) sẽ có một Thủ Vệ Boss Cuối vô cùng hoành tráng.

Mỗi Chương phải chứa chính xác 5 câu hỏi với ĐỘ KHÓ TĂNG DẦN theo đúng 5 bậc nhận thức sau:
- Câu 1: Cơ bản (Nhận biết)
- Câu 2: Hiểu và giải thích
- Câu 3: Vận dụng (tập trung tình huống thực tế ngắn)
- Câu 4: Phân tích (đưa ra dữ kiện phức tạp hơn)
- Câu 5: Nâng cao và sáng tạo (Câu hỏi mở rộng hoặc thử thách tổng hợp khó nhất)

Các loại câu hỏi cần được phân bổ đa dạng giữa:
1. 'multiple_choice' (Trắc nghiệm): gồm 4 đáp án lựa chọn. Trường correctAnswer phải chứa chuỗi số chỉ mục từ "0", "1", "2" đến "3".
2. 'fill_in_the_blank' (Điền khuyết): câu hỏi có khoảng trống điền từ (ví dụ biểu diễn khoảng trống dạng ______). Trường correctAnswer chứa từ khóa chính xác cần điền.
3. 'essay' (Tự luận / Câu hỏi thực tế / Tình huống): câu hỏi mở đòi hỏi người chơi nhập câu trả lời giải thích bằng tiếng Việt. correctAnswer sẽ là câu trả lời mẫu gợi ý.

Hãy đặt tên cho Chiến dịch (campaignTitle) thật ngầu, phù hợp với nội dung tài liệu (Ví dụ: "Huyền Thoại Sinh Học", "Chiến Tích Cơ Học", "Đại Lộ Lịch Sử", v.v.).
Đặt tên các Chương (title), Tên Khu Vực Bản Đồ (areaName) và Tên Quái Vật (monsterName) theo phong cách fantasy RPG bí ẩn, thú vị.

Tất cả nội dung phản hồi, tiêu đề, câu hỏi, lựa chọn, giải thích (explanation) và gợi ý (hint) bắt buộc phải bằng TIẾNG VIỆT, viết rõ ràng, sư phạm, giàu tính khích lệ chiến đấu.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        ...promptContent,
        {
          text: "Hãy tạo chiến dịch học tập RPG dựa trên hướng dẫn và cấu trúc JSON nghiêm ngặt.",
        },
      ],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            campaignTitle: {
              type: Type.STRING,
              description: "Tiêu đề hào hùng của chiến dịch học tập, ví dụ: 'Chiến Tích Đại Số Tuyến Tính'",
            },
            chapters: {
              type: Type.ARRAY,
              description: "Danh sách đúng 3 chương học tập",
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "chapter_1, chapter_2, chapter_3" },
                  title: { type: Type.STRING, description: "Tên chương, ví dụ: 'Chương 1: Bình Minh Giải Tích'" },
                  areaName: { type: Type.STRING, description: "Khu vực bản đồ, ví dụ: 'Thung Lũng Sương Mù'" },
                  monsterName: { type: Type.STRING, description: "Quái vật trấn giữ, ví dụ: 'Yêu Tinh Công Thức'" },
                  monsterDescription: { type: Type.STRING, description: "Mô tả ngắn đầy kịch tính về quái vật" },
                  isBoss: { type: Type.BOOLEAN, description: "Chương cuối là Boss cuối (true), các chương trước là false" },
                  questions: {
                    type: Type.ARRAY,
                    description: "Danh sách đúng 5 câu hỏi có độ khó từ level 1 đến level 5",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        level: { type: Type.INTEGER, description: "Giá trị từ 1 đến 5 đại diện cho độ khó" },
                        levelName: { type: Type.STRING, description: "Tên mức độ, ví dụ: 'Cơ bản (Nhận biết)', 'Vận dụng'..." },
                        type: { type: Type.STRING, description: "Phải thuộc một trong: multiple_choice, fill_in_the_blank, essay" },
                        question: { type: Type.STRING, description: "Nội dung câu hỏi học tập bằng tiếng Việt" },
                        options: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                          description: "Chỉ dành cho trắc nghiệm (đúng 4 lựa chọn). Bắt buộc bỏ trống nếu là tự luận hoặc điền khuyết.",
                        },
                        correctAnswer: {
                          type: Type.STRING,
                          description: "Đáp án đúng: chỉ mục từ '0' đến '3' nếu là trắc nghiệm, hoặc từ khóa đúng nếu là điền khuyết, hoặc câu trả lời mẫu mẫu nếu là essay.",
                        },
                        explanation: { type: Type.STRING, description: "Lời giải thích cặn kẽ, dễ hiểu từ gia sư AI" },
                        hint: { type: Type.STRING, description: "Gợi ý thông minh giúp người chơi tự suy luận" },
                      },
                      required: ["id", "level", "levelName", "type", "question", "correctAnswer", "explanation", "hint"],
                    },
                  },
                },
                required: ["id", "title", "areaName", "monsterName", "monsterDescription", "isBoss", "questions"],
              },
            },
          },
          required: ["campaignTitle", "chapters"],
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (error: any) {
    console.error("Lỗi khi tạo campaign:", error);
    res.status(500).json({ error: `Không thể tạo màn chơi AI: ${error.message || error}` });
  }
});

/**
 * API: Evaluate open-ended essay/application answers on-the-fly
 */
app.post("/api/evaluate-essay", checkApiKey, async (req, res) => {
  try {
    const { question, userAnswer, level, levelName, sampleAnswer } = req.body;

    if (!question || !userAnswer) {
      return res.status(400).json({ error: "Thiếu thông tin câu hỏi hoặc câu trả lời của người dùng." });
    }

    const systemInstruction = `
Bạn là một AI Gia Sư kiêm Giám Khảo Đấu Trường Tri Thức RPG.
Bạn cần đánh giá câu trả lời tự luận/vận dụng của người chơi đối với câu hỏi học tập được cung cấp.

Hãy đánh giá xem câu trả lời của người học có thể hiện sự hiểu biết đúng đắn, đầy đủ ý chính hay không (đừng quá khắt khe từng từ ngữ, hãy chấm dựa trên tư duy và ý tưởng cốt lõi).
Hãy viết lời nhận xét (feedback) đậm chất RPG thám hiểm chiến đấu:
- Nếu đúng hoặc gần đúng: Khen ngợi nhiệt tình kiểu "Chiêu thức dũng mãnh!", "Phá giải thế trận!", đồng thời củng cố kiến thức.
- Nếu sai hoặc thiếu sót lớn: Mô tả quái vật né tránh đòn đánh hoặc phản công nhẹ nhàng, đưa ra phân tích tại sao chưa đúng và khích lệ người chơi cố gắng.

Bắt buộc trả về kết quả dưới định dạng JSON theo cấu trúc quy định.
Nội dung phản hồi hoàn toàn bằng tiếng Việt.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          text: `
Câu hỏi (Độ khó: ${levelName} - Cấp ${level}):
"${question}"

Câu trả lời mẫu gợi ý:
"${sampleAnswer || "Nêu quan điểm/phân tích hợp lý"}"

Câu trả lời của người chơi nhập vào:
"${userAnswer}"

Hãy đánh giá câu trả lời trên.
          `,
        },
      ],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isCorrect: { type: Type.BOOLEAN, description: "true nếu câu trả lời đạt yêu cầu kiến thức, false nếu sai hoàn toàn hoặc quá xa đề" },
            score: { type: Type.INTEGER, description: "Điểm số từ 0 đến 100 dựa trên mức độ hoàn thiện kiến thức" },
            feedback: { type: Type.STRING, description: "Lời nhận xét nhập vai RPG đầy cảm hứng kiêm giảng dạy" },
            explanation: { type: Type.STRING, description: "Lời giải chi tiết đầy đủ để người học ôn tập kiến thức đúng đắn" },
          },
          required: ["isCorrect", "score", "feedback", "explanation"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.error("Lỗi khi chấm bài tự luận:", error);
    res.status(500).json({ error: `Không thể chấm điểm tự luận: ${error.message || error}` });
  }
});

/**
 * API: Analyze learning history and provide tutor advice
 */
app.post("/api/analyze-tutor", checkApiKey, async (req, res) => {
  try {
    const { history } = req.body; // Array of { question, levelName, type, isCorrect, category }

    const systemInstruction = `
Bạn là Đại Pháp Sư Gia Sư AI - người hướng dẫn tối cao tại Học Viện Thám Hiểm Tri Thức.
Nhiệm vụ của bạn là xem xét lịch sử chiến đấu (trả lời câu hỏi) của người chơi, phân tích điểm mạnh, điểm yếu cụ thể của họ dựa trên dữ liệu thật này, và đưa ra những đề xuất ôn tập cực kỳ hữu ích, thông thái.

Hãy trả về phản hồi dạng JSON chứa các danh sách nhận định bằng tiếng Việt sinh động, học thuật và đậm chất fantasy RPG.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          text: `Lịch sử học tập gần đây của người học:\n${JSON.stringify(history || [])}\n\nHãy lập báo cáo phân tích năng lực.`,
        },
      ],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Danh sách 2-3 điểm mạnh được ghi nhận (ví dụ: 'Nhận biết xuất sắc thuật ngữ', 'Vận dụng tình huống nhạy bén')",
            },
            weaknesses: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Danh sách 2-3 điểm yếu cần rèn luyện thêm (ví dụ: 'Còn bối rối ở câu hỏi phân tích', 'Điền khuyết từ chuyên môn')",
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Danh sách 3 lời khuyên rèn luyện tri thức cụ thể thiết thực phong cách ma thuật RPG",
            },
            xpTierName: {
              type: Type.STRING,
              description: "Danh hiệu RPG tương xứng với hành trình học tập, ví dụ: 'Hiệp Sĩ Tri Thức Học Việc', 'Nhà Hiền Triết Tập Sự'",
            },
          },
          required: ["strengths", "weaknesses", "recommendations", "xpTierName"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.error("Lỗi phân tích gia sư:", error);
    res.status(500).json({ error: `Lỗi phân tích gia sư AI: ${error.message || error}` });
  }
});

/**
 * API: Authentication (Login or register automatically)
 */
app.post("/api/auth/login", (req, res) => {
  try {
    const { phoneOrEmail, username, avatar } = req.body;
    if (!phoneOrEmail) {
      return res.status(400).json({ error: "Số điện thoại hoặc Email không được để trống!" });
    }
    
    const db = readDb();
    const key = phoneOrEmail.trim().toLowerCase();
    
    if (db[key]) {
      // User exists, return the stored profile and state
      return res.json({
        message: "Đăng nhập thành công!",
        isNewUser: false,
        playerState: db[key]
      });
    } else {
      // Create a brand new player state with custom user profile
      const newPlayerState = {
        username: username || "Hiệp Sĩ Ẩn Danh",
        phoneOrEmail: key,
        avatar: avatar || "🧙‍♂️",
        isLoggedIn: true,
        xp: 0,
        level: 1,
        gold: 150,
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
          halong_bay: [0, 4],
        },
        completedPuzzles: [],
        activeTab: "home",
        activeChapterId: undefined,
      };
      
      db[key] = newPlayerState;
      writeDb(db);
      
      return res.json({
        message: "Tạo tài khoản Hiệp Sĩ mới thành công!",
        isNewUser: true,
        playerState: newPlayerState
      });
    }
  } catch (error: any) {
    console.error("Lỗi đăng nhập:", error);
    res.status(500).json({ error: `Lỗi đăng nhập hệ thống: ${error.message || error}` });
  }
});

/**
 * API: Save player state to server JSON database
 */
app.post("/api/auth/save-state", (req, res) => {
  try {
    const { phoneOrEmail, playerState } = req.body;
    if (!phoneOrEmail) {
      return res.status(400).json({ error: "Số điện thoại hoặc Email không được để trống để lưu dữ liệu!" });
    }
    if (!playerState) {
      return res.status(400).json({ error: "Dữ liệu người chơi rỗng!" });
    }
    
    const db = readDb();
    const key = phoneOrEmail.trim().toLowerCase();
    
    // Merge or update
    db[key] = {
      ...playerState,
      phoneOrEmail: key, // Ensure key matches
      isLoggedIn: true
    };
    
    writeDb(db);
    res.json({ success: true, message: "Đã lưu trữ dữ liệu đồng bộ lên hệ thống ma pháp!" });
  } catch (error: any) {
    console.error("Lỗi lưu trữ dữ liệu:", error);
    res.status(500).json({ error: `Lỗi lưu trữ đồng bộ: ${error.message || error}` });
  }
});

/**
 * API: Interactive AI Scholar Companion (Suggest practice questions, Correct homework/exercises, Answer doubts)
 */
app.post("/api/ai/companion", checkApiKey, async (req, res) => {
  try {
    const { action, subject, query } = req.body;
    
    if (!action) {
      return res.status(400).json({ error: "Thiếu hành động AI (action) yêu cầu." });
    }
    
    let promptText = "";
    let systemInstruction = `
Bạn là Đại Pháp Sư Gia Sư AI - cố vấn tối cao tại Học Viện Thám Hiểm Tri Thức.
Bạn nói tiếng Việt cực kỳ lưu loát, sư phạm, ân cần, giàu tính cổ vũ học tập và mang phong cách RPG ma thuật thú vị.
    `;
    
    if (action === "suggest_questions") {
      if (!subject) {
        return res.status(400).json({ error: "Vui lòng chọn môn học để gợi ý câu hỏi." });
      }
      systemInstruction += ` Nhiệm vụ của bạn là đưa ra 3 câu hỏi ôn tập cực kỳ sáng tạo, đa dạng (ví dụ: 1 câu trắc nghiệm, 1 câu điền khuyết, 1 câu giải thích thực tế) liên quan đến môn học/chủ đề được yêu cầu. Dưới mỗi câu hỏi, hãy cung cấp gợi ý ôn tập tế nhị nhưng không lộ đáp án trực tiếp, sau đó cung cấp đáp án ẩn hoặc giải thích ngắn dưới thẻ SPOILER hoặc định dạng rõ ràng để học sinh suy ngẫm.`;
      promptText = `Hãy gợi ý 3 câu hỏi ôn luyện thông thái về môn học hoặc chủ đề: "${subject}". Hãy trình bày bằng Markdown thật sinh động, đẹp mắt, có tiêu đề hào hùng.`;
    } else if (action === "correct_homework") {
      if (!query) {
        return res.status(400).json({ error: "Vui lòng nhập nội dung bài tập cần sửa." });
      }
      systemInstruction += ` Nhiệm vụ của bạn là đọc kỹ đề bài và bài làm của học sinh (nếu có). Chỉ rõ điểm đúng, điểm sai sót, giải thích cặn kẽ tại sao sai và sửa bài tập đó một cách chi tiết nhất, từng bước một, kèm theo các công thức, quy luật khoa học liên quan. Kết thúc bằng một lời khích lệ chiến đấu nâng cao công lực học thuật.`;
      promptText = `Dưới đây là bài tập / bài làm cần được sửa của môn sinh:\n"${query}"\n\nHãy phân tích, sửa bài thật chi tiết và giảng giải cặn kẽ từng bước.`;
    } else {
      // General question / Chat
      if (!query) {
        return res.status(400).json({ error: "Vui lòng nhập câu hỏi thắc mắc của bạn." });
      }
      systemInstruction += ` Nhiệm vụ của bạn là giải đáp mọi thắc mắc học tập của người dùng về bất kỳ chủ đề nào (Toán, Lý, Hóa, Sinh, Sử, Địa, Văn, Ngoại ngữ) một cách thông thái, chính xác, kèm ví dụ minh họa trực quan dễ hiểu.`;
      promptText = `Học viên hỏi: "${query}"\n\nHãy trả lời một cách thông suốt, sư phạm và dễ hiểu nhất.`;
    }
    
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        { text: promptText }
      ],
      config: {
        systemInstruction: systemInstruction,
      }
    });
    
    res.json({
      reply: response.text || "Hệ thống ma pháp ngưng trệ, Đại Pháp Sư tạm thời bế quan. Vui lòng hỏi lại sau."
    });
  } catch (error: any) {
    console.error("Lỗi AI Companion:", error);
    res.status(500).json({ error: `Không thể kết nối với Đại Pháp Sư AI: ${error.message || error}` });
  }
});

// Configure Vite middleware in development, and handle production static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
