import { GoogleGenerativeAI } from "@google/generative-ai"; // 改用呢個更穩定的 library
import { Workout } from "../types";

// 1. 取得 API Key
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

// 2. 初始化 (搬入 function 或加 null check 避免初始化失敗)
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export const getWorkoutAnalysis = async (history: Workout[]) => {
  if (!genAI) return "API Key 設定中，請稍後...";

  try {
    // 3. 修正 Model 名稱為穩定版
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      以下是用戶最近的健身紀錄：
      ${JSON.stringify(history.slice(-5))}
      根據這些紀錄，請提供一句簡短且具激勵性的廣東話健身建議（約30字以內）。
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || "加油，今日都要爆汗！";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "保持規律，進步就在眼前！";
  }
};

export const getDetailedProgressAnalysis = async (history: Workout[]) => {
  if (!genAI) return "分析過程中出現錯誤，請檢查 API 設定。";

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `你是專業健身教練。請分析以下數據並以廣東話提供詳細 Markdown 建議：${JSON.stringify(history)}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || "暫時未有足夠數據進行詳細分析。";
  } catch (error) {
    console.error("Advanced Gemini Error:", error);
    return "分析過程中出現錯誤，請稍後再試。";
  }
};
