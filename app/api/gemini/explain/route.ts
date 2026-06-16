import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

// Initialize Gemini Client with correct User-Agent for telemetry as required
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

export async function POST(req: NextRequest) {
  try {
    const { questionText, questionType, correctAnswers, explanationSeed } = await req.json();

    if (!questionText) {
      return NextResponse.json({ error: "Thành phần câu hỏi trống." }, { status: 400 });
    }

    const systemPrompt = `Bạn là một giảng viên Tin học Quốc tế, chuyên gia luyện thi chứng chỉ IC3.
Hãy phân tích và viết bài giải thích chi tiết bám sát thực tế Certiport cho câu hỏi ôn luyện IC3 dưới đây. Trình bày bằng Tiếng Việt.`;

    const prompt = `Câu hỏi: "${questionText}"
Dạng đề: "${questionType}"
Đáp án đúng hoàn toàn: "${correctAnswers}"
Ghi chú giải thích sơ bộ: "${explanationSeed || ""}"

Yêu cầu đầu ra:
Hãy viết bài phân tích sư phạm có cấu trúc Markdown rõ ràng gồm:
- 💡 **Giải Thích Đáp Án Đúng**: Tại sao phương án này là chính xác nhất theo tiêu chuẩn của Microsoft/IC3. Refer chi tiết cấu trúc hệ thống nếu cần.
- 🚫 **Phân Tích Sai Lầm Thường Gặp**: Vì sao các đáp án hoặc thao tác khác lại chưa đúng hay không tối ưu.
- 🛠️ **Mẹo & Kỹ Năng Thi Cử**: Lời khuyên độc quyền để làm nhanh dạng câu hỏi này trong bài test Certiport thật (ví dụ: mẹo phím tắt, vùng click, hoặc cách suy luận).
- 📘 **Tài Liệu Ôn Tập Bổ Sung**: Chủ đề kiến thức hoặc công cụ cần ôn luyện kỹ hơn trên Microsoft Learn hoặc tài liệu IC3.

Lưu ý: Giữ giọng điệu học thuật lịch sự, khích lệ tinh thần người học và trực quan sinh động bằng các biểu tượng emoji. Tránh viết quá dài dòng, tập trung nâng tầm tư duy thực chiến.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    const text = response.text || "Không thể khởi tạo nội dung giải thích tự động từ Gemini lúc này.";

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("Gemini Explain API Crash:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi kết nối với máy chủ AI Gemini. Vui lòng kiểm tra lại cấu hình khóa bảo mật." },
      { status: 500 }
    );
  }
}
