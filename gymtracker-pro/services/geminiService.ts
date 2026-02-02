
import { GoogleGenAI } from "@google/genai";
import { Workout } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getWorkoutAnalysis = async (history: Workout[]) => {
  try {
    const prompt = `
      以下是用戶最近的健身紀錄：
      ${JSON.stringify(history.slice(-5))}

      根據這些紀錄，請提供一句簡短且具激勵性的廣東話健身建議（約30字以內）。
      用戶目前的訓練次序是：胸、背、腿。
      如果用戶有進步，請給予肯定。
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "加油，今日都要爆汗！";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "保持規律，進步就在眼前！";
  }
};

export const getDetailedProgressAnalysis = async (history: Workout[]) => {
  try {
    const prompt = `
      你是專業的健身教練。請分析以下用戶的健身歷史數據：
      ${JSON.stringify(history)}

      要求：
      1. 分析重量變化趨勢。
      2. 分析總訓練容量 (Volume = Weight * Reps) 的進度。
      3. 給予專業且詳細的廣東話建議，指出哪些動作有進步，哪些需要加強。
      4. 格式：請以 Markdown 列表形式回覆，保持語氣專業且富有鼓勵性。
      5. 使用廣東話口語（例如：仲可以加重、做得好、爆肌）。
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });

    return response.text || "暫時未有足夠數據進行詳細分析。";
  } catch (error) {
    console.error("Advanced Gemini Error:", error);
    return "分析過程中出現錯誤，請稍後再試。";
  }
};
