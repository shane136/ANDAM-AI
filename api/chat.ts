import { GoogleGenAI } from "@google/genai";
import { ILIGAN_DRRM_SYSTEM_INSTRUCTION } from "../src/constants/systemInstruction.js";
import { ILIGAN_BARANGAYS } from "../src/constants/iliganData.js";
import { fetchIliganRealtimeWeather } from "../src/services/weatherService.js";

type Language = "ceb" | "fil" | "en";

interface IncomingMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatBody {
  messages?: IncomingMessage[];
  userLanguage?: Language;
  isEmergency?: boolean;
  barangay?: string;
}

const CANDIDATE_MODELS = [
  "gemini-3.7-flash",
  "gemini-flash-latest",
  "gemini-3.1-flash-lite",
];

const SOURCES = [
  { name: "Iligan City CDRRMO / LGU", url: "https://iligan.gov.ph/" },
  { name: "DOST-PAGASA", url: "https://www.pagasa.dost.gov.ph/" },
  { name: "DOST-PHIVOLCS", url: "https://www.phivolcs.dost.gov.ph/" },
];

function localFallback(
  query: string,
  language: Language = "ceb",
  barangayName?: string,
  isEmergency = false,
  weather?: Awaited<ReturnType<typeof fetchIliganRealtimeWeather>>,
) {
  const normalizedQuery = query.toLowerCase();
  const weatherQuery = ["weather", "panahon", "ulan", "rain", "pagasa", "today", "tonight"]
    .some((term) => normalizedQuery.includes(term));

  if (weatherQuery && weather) {
    if (language === "ceb") {
      return `**Iligan City Weather Update:**\n\n- **Temperatura:** ${weather.temperature}°C (Mabatyagan: ${weather.apparentTemperature}°C)\n- **Kahimtang:** ${weather.conditionLabel.ceb}\n- **Tsansa sa ulan karong adlawa:** ${weather.rainChanceToday}%\n- **Tsansa sa ulan karong gabii:** ${weather.rainChanceTonight}%\n\nSource: ${weather.source}`;
    }
    if (language === "fil") {
      return `**Ulat ng Panahon sa Iligan City:**\n\n- **Temperatura:** ${weather.temperature}°C (Pakiramdam: ${weather.apparentTemperature}°C)\n- **Kondisyon:** ${weather.conditionLabel.fil}\n- **Tsansa ng ulan ngayong araw:** ${weather.rainChanceToday}%\n- **Tsansa ng ulan ngayong gabi:** ${weather.rainChanceTonight}%\n\nSource: ${weather.source}`;
    }
    return `**Iligan City Weather Update:**\n\n- **Temperature:** ${weather.temperature}°C (Feels like ${weather.apparentTemperature}°C)\n- **Condition:** ${weather.conditionLabel.en}\n- **Rain chance today:** ${weather.rainChanceToday}%\n- **Rain chance tonight:** ${weather.rainChanceTonight}%\n\nSource: ${weather.source}`;
  }

  if (isEmergency || ["help", "tabang", "rescue", "emergency", "hotline", "baha"]
    .some((term) => normalizedQuery.includes(term))) {
    return language === "ceb"
      ? "🚨 **BALHIN DAYON SA LUWAS UG TAAS NGA DAPIT.** Ayaw paglusong sa kusog nga baha. Tawag sa **ICDRRMO: (063) 221-8459 / 0997-726-2692 / 0969-233-7878**."
      : "🚨 **MOVE TO A SAFE, HIGHER LOCATION NOW.** Do not enter moving floodwater. Call **ICDRRMO: (063) 221-8459 / 0997-726-2692 / 0969-233-7878**.";
  }

  const barangay = ILIGAN_BARANGAYS.find((item) =>
    normalizedQuery.includes(item.name.toLowerCase()) ||
    item.name.toLowerCase() === barangayName?.toLowerCase(),
  );

  if (barangay) {
    const risk = barangay.keyRiskNotes[language] || barangay.keyRiskNotes.en;
    const centres = barangay.evacuationCentres?.join(", ") || "Confirm with the barangay DRRM office";
    return `**Barangay ${barangay.name} Safety Profile:**\n\n- **Hazards:** ${barangay.hazards.join(", ")}\n- **Risk note:** ${risk}\n- **Evacuation centres:** ${centres}\n- **Local contact:** ${barangay.contactPersonOrOffice || "Barangay DRRM office"}`;
  }

  return language === "ceb"
    ? "Ako ang ANDAM AI. Makatabang ko sa Iligan City disaster safety, barangay risks, weather, Go-Bag preparation, ug emergency hotlines. Unsay imong pangutana?"
    : language === "fil"
      ? "Ako ang ANDAM AI. Maaari akong tumulong tungkol sa disaster safety, barangay risks, panahon, Go-Bag, at emergency hotlines sa Iligan City. Ano ang iyong tanong?"
      : "I am ANDAM AI. I can help with Iligan City disaster safety, barangay risks, weather, Go-Bag preparation, and emergency hotlines. What would you like to know?";
}

async function generateWithFallback(ai: GoogleGenAI, params: Record<string, unknown>) {
  let lastError: unknown;

  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({ ...params, model } as never);
      if (response.text) return response.text;
    } catch (error) {
      lastError = error;
      console.warn(`Gemini model ${model} failed:`, error);
    }
  }

  throw lastError || new Error("No Gemini model returned a response.");
}

export default {
  async fetch(request: Request) {
    if (request.method !== "POST") {
      return Response.json(
        { error: "Method not allowed." },
        { status: 405, headers: { Allow: "POST" } },
      );
    }

    let body: ChatBody;
    try {
      body = await request.json() as ChatBody;
    } catch {
      return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    const messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 50) {
      return Response.json({ error: "Messages must contain between 1 and 50 items." }, { status: 400 });
    }

    const validMessages = messages.every((message) =>
      (message.role === "user" || message.role === "assistant") &&
      typeof message.content === "string" &&
      message.content.trim().length > 0 &&
      message.content.length <= 10_000,
    );
    if (!validMessages) {
      return Response.json({ error: "Each message must have a valid role and content." }, { status: 400 });
    }

    const language: Language = ["ceb", "fil", "en"].includes(body.userLanguage || "")
      ? body.userLanguage as Language
      : "ceb";
    const latestMessage = messages[messages.length - 1].content;
    const weather = await fetchIliganRealtimeWeather().catch((error) => {
      console.warn("Weather context unavailable:", error);
      return undefined;
    });

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

      let systemInstruction = `${ILIGAN_DRRM_SYSTEM_INSTRUCTION}\nRESPONSE LANGUAGE: ${language}. Reply entirely in the selected response language, even when the user's message or prior chat history uses a different language.`;
      if (body.barangay) systemInstruction += `\nUSER LOCATION: Barangay ${body.barangay}, Iligan City.`;
      if (body.isEmergency) systemInstruction += "\nACTIVE EMERGENCY: Give immediate safety steps and ICDRRMO hotlines first.";
      if (weather) systemInstruction += `\nWEATHER CONTEXT (${weather.timestamp}): ${JSON.stringify(weather)}`;

      const text = await generateWithFallback(new GoogleGenAI({ apiKey }), {
        contents: messages.map((message) => ({
          role: message.role === "assistant" ? "model" : "user",
          parts: [{ text: message.content }],
        })),
        config: {
          systemInstruction,
          temperature: body.isEmergency ? 0.2 : 0.4,
        },
      });

      return Response.json({ text, timestamp: new Date().toISOString(), sources: SOURCES });
    } catch (error) {
      console.error("Gemini unavailable; returning local DRRM response:", error);
      return Response.json({
        text: localFallback(latestMessage, language, body.barangay, body.isEmergency, weather),
        timestamp: new Date().toISOString(),
        sources: SOURCES,
        fallback: true,
      });
    }
  },
};
