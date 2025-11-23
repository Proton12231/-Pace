import { GoogleGenAI } from "@google/genai";
import { GoalConfig, StudyLog, StudyPhase } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeStudyProgress = async (
  goals: GoalConfig,
  logs: StudyLog[],
  phase: StudyPhase
): Promise<{ text: string }> => {
  try {
    const ai = getClient();

    // Filter last 20 logs
    const recentLogs = logs.slice(0, 20);

    // Helper to format log string based on type
    const logSummaries = recentLogs.map((l) => {
      let details = "";
      if (l.vocabData) {
        details = `Vocab: +${l.vocabData.learned}/-${l.vocabData.forgotten}`;
      } else if (l.readingIntensiveData) {
        details = `Reading: ${l.readingIntensiveData.articleTitle}, Unknown: ${l.readingIntensiveData.unknownWordCount}, Chunks: ${l.readingIntensiveData.chunkCount}`;
      } else if (l.corpusData) {
        details = `Corpus: Ch${l.corpusData.chapter}-${l.corpusData.section}, Round ${l.corpusData.round}, Acc: ${l.corpusData.accuracy}%`;
      } else if (l.p2ListeningData) {
        details = `Listen Type: ${
          l.p2ListeningData.questionType
        }, Acc: ${Math.round(
          (l.p2ListeningData.correctCount / l.p2ListeningData.totalCount) * 100
        )}%`;
      } else if (l.p2WritingData) {
        details = `Writing: ${l.p2WritingData.taskType} (${l.p2WritingData.topicType}), Score: ${l.p2WritingData.score}`;
      } else if (l.mockData) {
        details = `Mock: ${l.mockData.book} ${l.mockData.test}, Overall: ${l.mockData.overallScore} (L${l.mockData.listeningScore} R${l.mockData.readingScore})`;
      }

      return `${l.date}: ${details}`;
    });

    const prompt = `
      You are an expert IELTS Tutor. Analyze the following student data and provide a progress report in Chinese.
      
      Context:
      - Current Phase: ${phase}
      - Target Score: ${goals.targetScore}
      - Exam Date: ${goals.examDate}
      
      Recent Activity Log:
      ${JSON.stringify(logSummaries, null, 2)}
      
      Instructions:
      1. Identify weak spots (e.g., low corpus accuracy, declining vocab retention, unbalanced writing scores).
      2. Provide 3 specific actionable tips.
      3. Be concise (under 300 words).
      4. Use encouraging but strict tone.
      5. Output in Chinese.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a professional IELTS coach.",
        temperature: 0.7,
      },
    });

    return { text: response.text || "无法生成分析报告，请稍后再试。" };
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return { text: "AI 服务暂时不可用，请检查网络或 API Key。" };
  }
};
