import { GoogleGenAI } from "@google/genai";

// Ensure you set VITE_GEMINI_API_KEY in your .env file
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

export const ai = new GoogleGenAI({
  apiKey: apiKey || '',
});

/**
 * Analyzes a legal document using Gemini 1.5 Pro.
 */
export async function analyzeDocument(textOrBase64: string, mimeType: string = "application/pdf"): Promise<any> {
  if (!apiKey) throw new Error("Gemini API key is missing. Add VITE_GEMINI_API_KEY to your .env");

  const systemPrompt = `You are CourtSense, an expert AI legal assistant for everyday people.
Analyze the provided legal document. Explain it in plain English designed for a 5th-grade reading level.
Identify any dangerous or unfair risks, explain the user's rights in context, and suggest simple next steps.
Return ONLY valid JSON in this EXACT structure (all fields required):
{
  "documentType": "e.g. Eviction Notice, Demand Letter",
  "urgencySummary": "e.g. Respond within 5 days",
  "severity": "high", 
  "keyFacts": [ { "label": "Sender", "value": "..." }, { "label": "Deadline", "value": "..." } ],
  "plainSummary": "A robust plain English summary describing what the document says...",
  "risks": [ { "title": "Binding Arbitration", "explanation": "What it means...", "severity": "high", "quote": "exact quote from text" } ],
  "rights": [ { "title": "Right to Contest", "explanation": "..." } ],
  "nextSteps": [ "step 1", "step 2" ],
  "draftResponse": { "applicable": true, "subject": "Dispute Notice", "body": "..." },
  "disclaimer": "This analysis was automatically generated and does not constitute formal legal advice."
}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: [
      systemPrompt,
      mimeType === "text/plain"
        ? textOrBase64
        : { inlineData: { data: textOrBase64, mimeType } }
    ],
    config: {
      responseMimeType: "application/json",
      temperature: 0.1,
    }
  });

  return JSON.parse(response.text || "{}");
}

/**
 * Conversational chat with CourtSense retaining the premium persona.
 */
export async function chatWithCourtSense(history: { role: "user" | "ai", content: string }[], message: string, context: string = ""): Promise<string> {
  if (!apiKey) return "Gemini API key is missing.";

  const systemInstruction = `You are CourtSense, an elite AI legal assistant for everyday people. Keep your tone extremely premium, calm, and reassuring. Always format your output meticulously using Markdown (bolding, lists, italics) for maximum scannability. Break down complex legal situations logically and never use overwhelming legal jargon. Always offer actionable but safe next steps. Under no circumstances should you pretend to be a formally licensed attorney.\n\nUser Context: ${context}`;

  const contents = history.map(msg => ({
    role: msg.role === "ai" ? "model" : "user",
    parts: [{ text: msg.content }]
  }));

  contents.push({ role: "user", parts: [{ text: message }] });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents,
      config: {
        systemInstruction,
        temperature: 0.3
      }
    });
    return response.text || "I'm sorry, I couldn't process your request.";
  } catch (e) {
    console.error(e);
    return "There was an error communicating with CourtSense servers.";
  }
}
