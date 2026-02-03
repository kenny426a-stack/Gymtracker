// services/geminiService.ts
import { GoogleGenerativeAI } from "@google/generative-ai"; // 👈 留意呢度轉咗名
import { Workout } from "../types";

// 讀取 Vercel 環境變數
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export const getWorkoutAnalysis = async (history: Workout[]) => {
  if (!genAI) return "API Key 未設定，請檢查環境變數。";

  try {
    // 免費版請務必用 gemini-1.5-flash，速度快且穩定
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `你是一個健身教練，請用廣東話分析以下最近紀錄並給予一句 30 字內的鼓勵：${JSON.stringify(history.slice(-5))}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini Error:", error);
    return "加油！保持訓練呀！";
  }
};

export const getDetailedProgressAnalysis = async (history: Workout[]) => {
  if (!genAI) return "分析失敗，API Key 缺失。";

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `你是專業教練，請用廣東話詳細分析這些數據並以 Markdown 列表回覆：${JSON.stringify(history)}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Advanced Error:", error);
    return "分析過程中出現錯誤，請稍後再試。";
  }
};
