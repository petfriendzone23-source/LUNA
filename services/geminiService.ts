
import { GoogleGenAI } from "@google/genai";
import { CyclePhase, UserProfile } from "../types";

export const getCycleInsights = async (phase: CyclePhase, profile: UserProfile): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const goalText = profile.goal === 'conceive' ? 'tentando engravidar' : profile.goal === 'avoid' ? 'evitando gravidez' : 'apenas acompanhando o ciclo';
    
    const prompt = `Você é Luna, uma assistente virtual empática e especialista em saúde feminina. 
    A usuária está na fase ${phase} do ciclo menstrual. 
    O objetivo dela é: ${goalText}.
    Forneça um insight curto (máximo 200 caracteres) com uma dica de bem-estar, nutrição ou exercício para hoje. 
    Seja carinhosa e use um emoji. Não use formatação Markdown complexa.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Continue se cuidando hoje! Você é prioridade. ✨";
  } catch (error) {
    console.error("Erro ao buscar insights:", error);
    return "Mantenha-se hidratada e descanse se necessário. Seu corpo agradece! 🌸";
  }
};
