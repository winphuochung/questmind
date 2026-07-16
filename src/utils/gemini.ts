import { GoogleGenAI, Type } from "@google/genai";

const MODELS = [
  "gemini-3-flash-preview",
  "gemini-3-pro-preview",
  "gemini-2.5-flash"
];

function getApiKey(): string {
  const key = localStorage.getItem("GEMINI_API_KEY");
  if (!key) {
    throw new Error("Thiếu GEMINI_API_KEY. Vui lòng thiết lập trong Cài đặt (Settings) trên Header.");
  }
  return key;
}

function getSelectedModel(): string {
  return localStorage.getItem("GEMINI_MODEL") || MODELS[0];
}

async function fetchWithFallback(callFn: (model: string) => Promise<any>): Promise<any> {
  const selectedModel = getSelectedModel();
  
  try {
    return await callFn(selectedModel);
  } catch (error: any) {
    console.error(`Lỗi với model ${selectedModel}:`, error);
    
    // Fallback logic
    const modelIndex = MODELS.indexOf(selectedModel);
    for (let i = 1; i < MODELS.length; i++) {
      const nextModelIndex = (modelIndex + i) % MODELS.length;
      const nextModel = MODELS[nextModelIndex];
      try {
        console.log(`Đang thử lại với model dự phòng: ${nextModel}...`);
        return await callFn(nextModel);
      } catch (fallbackError) {
        console.error(`Lỗi với model dự phòng ${nextModel}:`, fallbackError);
      }
    }
    // If all fail, throw the original error or a combined one
    throw new Error(error?.message || String(error));
  }
}

export async function generateCampaign(data: { materialText?: string, websiteLink?: string, imageBase64?: string, mimeType?: string }) {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const { materialText, websiteLink, imageBase64, mimeType } = data;

  if (!materialText && !websiteLink && !imageBase64) {
    throw new Error("Vui lòng cung cấp ít nhất một tài liệu học tập (ghi chú, link hoặc ảnh).");
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

  return fetchWithFallback(async (model) => {
    const response = await ai.models.generateContent({
      model: model,
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
              description: "Tiêu đề hào hùng của chiến dịch học tập",
            },
            chapters: {
              type: Type.ARRAY,
              description: "Danh sách đúng 3 chương học tập",
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "chapter_1, chapter_2, chapter_3" },
                  title: { type: Type.STRING, description: "Tên chương" },
                  areaName: { type: Type.STRING, description: "Khu vực bản đồ" },
                  monsterName: { type: Type.STRING, description: "Quái vật trấn giữ" },
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
                        levelName: { type: Type.STRING, description: "Tên mức độ" },
                        type: { type: Type.STRING, description: "Phải thuộc một trong: multiple_choice, fill_in_the_blank, essay" },
                        question: { type: Type.STRING, description: "Nội dung câu hỏi học tập bằng tiếng Việt" },
                        options: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                          description: "Chỉ dành cho trắc nghiệm (đúng 4 lựa chọn). Bắt buộc bỏ trống nếu là tự luận hoặc điền khuyết.",
                        },
                        correctAnswer: {
                          type: Type.STRING,
                          description: "Đáp án đúng",
                        },
                        explanation: { type: Type.STRING, description: "Lời giải thích cặn kẽ" },
                        hint: { type: Type.STRING, description: "Gợi ý thông minh" },
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
    
    return JSON.parse(response.text || "{}");
  });
}

export async function evaluateEssay(data: { question: string, userAnswer: string, level: number, levelName: string, sampleAnswer?: string }) {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const { question, userAnswer, level, levelName, sampleAnswer } = data;

  if (!question || !userAnswer) {
    throw new Error("Thiếu thông tin câu hỏi hoặc câu trả lời của người dùng.");
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

  return fetchWithFallback(async (model) => {
    const response = await ai.models.generateContent({
      model: model,
      contents: [
        {
          text: \`
Câu hỏi (Độ khó: \${levelName} - Cấp \${level}):
"\${question}"

Câu trả lời mẫu gợi ý:
"\${sampleAnswer || "Nêu quan điểm/phân tích hợp lý"}"

Câu trả lời của người chơi nhập vào:
"\${userAnswer}"

Hãy đánh giá câu trả lời trên.
          \`,
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

    return JSON.parse(response.text || "{}");
  });
}

export async function analyzeTutor(data: { history: any[] }) {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const { history } = data;

  const systemInstruction = `
Bạn là Đại Pháp Sư Gia Sư AI - người hướng dẫn tối cao tại Học Viện Thám Hiểm Tri Thức.
Nhiệm vụ của bạn là xem xét lịch sử chiến đấu (trả lời câu hỏi) của người chơi, phân tích điểm mạnh, điểm yếu cụ thể của họ dựa trên dữ liệu thật này, và đưa ra những đề xuất ôn tập cực kỳ hữu ích, thông thái.

Hãy trả về phản hồi dạng JSON chứa các danh sách nhận định bằng tiếng Việt sinh động, học thuật và đậm chất fantasy RPG.
  `;

  return fetchWithFallback(async (model) => {
    const response = await ai.models.generateContent({
      model: model,
      contents: [
        {
          text: \`Lịch sử học tập gần đây của người học:\n\${JSON.stringify(history || [])}\n\nHãy lập báo cáo phân tích năng lực.\`,
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

    return JSON.parse(response.text || "{}");
  });
}

export async function companionAction(data: { action: string, subject?: string, query?: string, history?: any[] }) {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const { action, subject, query, history } = data;

  if (!action) {
    throw new Error("Thiếu hành động AI (action) yêu cầu.");
  }

  let promptText = "";
  let systemInstruction = `
Bạn là Đại Pháp Sư Gia Sư AI - cố vấn tối cao tại Học Viện Thám Hiểm Tri Thức.
Bạn nói tiếng Việt cực kỳ lưu loát, sư phạm, ân cần, giàu tính cổ vũ học tập và mang phong cách RPG ma thuật thú vị.
  `;

  if (history && history.length > 0) {
    systemInstruction += `\nLịch sử chiến đấu (học tập) của học viên:\n${JSON.stringify(history)}\nHãy dựa vào lịch sử này để hiểu rõ điểm mạnh yếu, những câu đã trả lời sai để tư vấn hoặc ra đề phù hợp hơn.`;
  }

  if (action === "suggest_questions") {
    if (!subject) {
      throw new Error("Vui lòng chọn môn học để gợi ý câu hỏi.");
    }
    systemInstruction += ` Nhiệm vụ của bạn là đưa ra 3 câu hỏi ôn tập cực kỳ sáng tạo, đa dạng (ví dụ: 1 câu trắc nghiệm, 1 câu điền khuyết, 1 câu giải thích thực tế) liên quan đến môn học/chủ đề được yêu cầu. Dưới mỗi câu hỏi, hãy cung cấp gợi ý ôn tập tế nhị nhưng không lộ đáp án trực tiếp, sau đó cung cấp đáp án ẩn hoặc giải thích ngắn dưới thẻ SPOILER hoặc định dạng rõ ràng để học sinh suy ngẫm.`;
    promptText = `Hãy gợi ý 3 câu hỏi ôn luyện thông thái về môn học hoặc chủ đề: "${subject}". Hãy trình bày bằng Markdown thật sinh động, đẹp mắt, có tiêu đề hào hùng.`;
  } else if (action === "correct_homework") {
    if (!query) {
      throw new Error("Vui lòng nhập nội dung bài tập cần sửa.");
    }
    systemInstruction += \` Nhiệm vụ của bạn là đọc kỹ đề bài và bài làm của học sinh (nếu có). Chỉ rõ điểm đúng, điểm sai sót, giải thích cặn kẽ tại sao sai và sửa bài tập đó một cách chi tiết nhất, từng bước một, kèm theo các công thức, quy luật khoa học liên quan. Kết thúc bằng một lời khích lệ chiến đấu nâng cao công lực học thuật.\`;
    promptText = \`Dưới đây là bài tập / bài làm cần được sửa của môn sinh:\n"\${query}"\n\nHãy phân tích, sửa bài thật chi tiết và giảng giải cặn kẽ từng bước.\`;
  } else {
    // General question / Chat
    if (!query) {
      throw new Error("Vui lòng nhập câu hỏi thắc mắc của bạn.");
    }
    systemInstruction += \` Nhiệm vụ của bạn là giải đáp mọi thắc mắc học tập của người dùng về bất kỳ chủ đề nào (Toán, Lý, Hóa, Sinh, Sử, Địa, Văn, Ngoại ngữ) một cách thông thái, chính xác, kèm ví dụ minh họa trực quan dễ hiểu.\`;
    promptText = \`Học viên hỏi: "\${query}"\n\nHãy trả lời một cách thông suốt, sư phạm và dễ hiểu nhất.\`;
  }

  return fetchWithFallback(async (model) => {
    const response = await ai.models.generateContent({
      model: model,
      contents: [
        { text: promptText }
      ],
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return {
      reply: response.text || "Hệ thống ma pháp ngưng trệ, Đại Pháp Sư tạm thời bế quan. Vui lòng hỏi lại sau."
    };
  });
}
