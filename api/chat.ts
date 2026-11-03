import { GoogleGenAI } from "@google/genai";
import { ILIGAN_DRRM_SYSTEM_INSTRUCTION } from "../src/constants/systemInstruction.js";
import {
  HAZARD_GUIDES,
  ILIGAN_BARANGAYS,
  OFFICIAL_HOTLINES,
} from "../src/constants/iliganData.js";
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

type LocalizedText = Record<Language, string>;

function guideSteps(guideId: string): LocalizedText[] {
  return HAZARD_GUIDES.find((guide) => guide.id === guideId)?.duringSteps ?? [];
}

// Steps come from the hazard guides where one exists, so this can't drift from the Guides tab.
// Matching is on whole words: "bahay" (house) must not count as "baha" (flood).
const EMERGENCY_HAZARDS: {
  pattern: RegExp;
  label: LocalizedText;
  steps: LocalizedText[];
  callFireStation?: boolean;
}[] = [
  {
    pattern: /earthquake|quake|tremor|linog|lindol/,
    label: { ceb: "LINOG", fil: "LINDOL", en: "EARTHQUAKE" },
    steps: guideSteps("h-earthquake"),
  },
  {
    pattern: /tsunami/,
    label: { ceb: "TSUNAMI", fil: "TSUNAMI", en: "TSUNAMI" },
    steps: [
      {
        ceb: "Biya dayon sa baybayon ug adto sa taas nga dapit o layo sa dagat.",
        fil: "Umalis agad sa baybayin at pumunta sa mataas na lugar o malayo sa dagat.",
        en: "Leave the shore now and go to high ground or as far inland as you can.",
      },
      {
        ceb: "Ayaw na paghulat og pahibalo kung kusog ang linog o kalit nga mihubas ang dagat.",
        fil: "Huwag nang hintayin ang babala kung malakas ang lindol o biglang umurong ang dagat.",
        en: "Do not wait for a warning if the shaking was strong or the sea suddenly pulls back.",
      },
    ],
  },
  {
    pattern: /\b(?:wild)?fires?\b|\bsmoke\b|\bburning\b|sunog|\bkalayo\b/,
    label: { ceb: "SUNOG", fil: "SUNOG", en: "FIRE" },
    steps: [
      {
        ceb: "Gawas dayon sa building ug ayaw na pagbalik para sa mga gamit.",
        fil: "Lumabas agad ng gusali at huwag nang bumalik para sa mga gamit.",
        en: "Get out of the building now and do not go back for belongings.",
      },
      {
        ceb: "Kung naay aso, pagpaubos ug taboni ang ilong ug baba.",
        fil: "Kung may usok, yumuko at takpan ang ilong at bibig.",
        en: "If there is smoke, stay low and cover your nose and mouth.",
      },
    ],
    callFireStation: true,
  },
  {
    pattern: /landslide|mudslide|dahili|guho ng lupa/,
    label: { ceb: "PAGDAHILI SA YUTA", fil: "PAGGUHO NG LUPA", en: "LANDSLIDE" },
    steps: guideSteps("h-landslide"),
  },
  {
    pattern:
      /\bflood|storm surge|daluyong|\b(?:baha|bahaan|nagbaha|nagbabaha|mibaha|mobaha|gibaha|pagbaha|pagbabaha|binaha|binabaha|bumaha|bumabaha|babaha)\b/,
    label: { ceb: "BAHA", fil: "BAHA", en: "FLOOD" },
    steps: guideSteps("h-flood"),
  },
  {
    pattern: /typhoon|cyclone|bagyo|\bstorm\b(?! surge)/,
    label: { ceb: "BAGYO", fil: "BAGYO", en: "TYPHOON" },
    steps: guideSteps("h-typhoon"),
  },
];

const UNKNOWN_EMERGENCY_REPLY: LocalizedText = {
  ceb: "🚨 **PALAYO SA PELIGRO KUNG LUWAS KANG MOLIHOK.** Pangayo dayon og tabang. Isulti ang imong barangay, unsay nahitabo, ug kung naay naangol o natanggong.",
  fil: "🚨 **LUMAYO SA PANGANIB KUNG LIGTAS KANG GUMALAW.** Humingi agad ng tulong. Sabihin ang iyong barangay, ang nangyari, at kung may nasaktan o na-trap.",
  en: "🚨 **GET AWAY FROM DANGER IF IT IS SAFE TO MOVE.** Call for help now. Say your barangay, what happened, and if anyone is hurt or trapped.",
};

const CALL_LABEL: LocalizedText = { ceb: "Tawag sa", fil: "Tumawag sa", en: "Call" };

function hotlineLine(contactId: string, label: string, language: Language) {
  const contact = OFFICIAL_HOTLINES.find((item) => item.id === contactId);
  if (!contact) return "";
  return `${CALL_LABEL[language]} **${label}: ${contact.numbers.slice(0, 3).join(" / ")}**.`;
}

function emergencyReply(normalizedQuery: string, language: Language) {
  const hazards = EMERGENCY_HAZARDS.filter((hazard) =>
    hazard.pattern.test(normalizedQuery),
  );
  const rescueLine = hotlineLine("cdrmmo-1", "ICDRRMD", language);

  // Without a known hazard, don't guess one: the right move depends on what's happening
  if (hazards.length === 0) {
    return `${UNKNOWN_EMERGENCY_REPLY[language]}\n\n${rescueLine}`;
  }

  const sections = hazards.map((hazard) => {
    const steps = hazard.steps.map((step) => `- ${step[language]}`).join("\n");
    return `🚨 **${hazard.label[language]}:**\n\n${steps}`;
  });
  const fireLine = hazards.some((hazard) => hazard.callFireStation)
    ? hotlineLine("bfp-iligan", "BFP", language)
    : "";

  return [...sections, fireLine, rescueLine].filter(Boolean).join("\n\n");
}

function localFallback(
  query: string,
  language: Language = "ceb",
  barangayName?: string,
  isEmergency = false,
  weather?: Awaited<ReturnType<typeof fetchIliganRealtimeWeather>>,
) {
  const normalizedQuery = query.toLowerCase();
  const weatherQuery = [
    "weather",
    "panahon",
    "ulan",
    "rain",
    "pagasa",
    "today",
    "tonight",
  ].some((term) => normalizedQuery.includes(term));

  // Safety steps must win over everything else, even if the message also mentions weather
  if (
    isEmergency ||
    ["help", "tabang", "rescue", "emergency", "hotline", "baha"].some((term) =>
      normalizedQuery.includes(term),
    )
  ) {
    return emergencyReply(normalizedQuery, language);
  }

  if (weatherQuery && weather) {
    if (language === "ceb") {
      return `**Iligan City Weather Update:**\n\n- **Temperatura:** ${weather.temperature}°C (Mabatyagan: ${weather.apparentTemperature}°C)\n- **Kahimtang:** ${weather.conditionLabel.ceb}\n- **Tsansa sa ulan karong adlawa:** ${weather.rainChanceToday}%\n- **Tsansa sa ulan karong gabii:** ${weather.rainChanceTonight}%\n\nSource: ${weather.source}`;
    }
    if (language === "fil") {
      return `**Ulat ng Panahon sa Iligan City:**\n\n- **Temperatura:** ${weather.temperature}°C (Pakiramdam: ${weather.apparentTemperature}°C)\n- **Kondisyon:** ${weather.conditionLabel.fil}\n- **Tsansa ng ulan ngayong araw:** ${weather.rainChanceToday}%\n- **Tsansa ng ulan ngayong gabi:** ${weather.rainChanceTonight}%\n\nSource: ${weather.source}`;
    }
    return `**Iligan City Weather Update:**\n\n- **Temperature:** ${weather.temperature}°C (Feels like ${weather.apparentTemperature}°C)\n- **Condition:** ${weather.conditionLabel.en}\n- **Rain chance today:** ${weather.rainChanceToday}%\n- **Rain chance tonight:** ${weather.rainChanceTonight}%\n\nSource: ${weather.source}`;
  }

  if (weatherQuery) {
    return language === "ceb"
      ? "Wala koy bag-ong weather data karon. Palihog susiha ang DOST-PAGASA (https://www.pagasa.dost.gov.ph/) ug ang ICDRRMD (https://www.facebook.com/drrmoiligancity)."
      : language === "fil"
        ? "Wala akong bagong weather data ngayon. Pakitingnan ang DOST-PAGASA (https://www.pagasa.dost.gov.ph/) at ang ICDRRMD (https://www.facebook.com/drrmoiligancity)."
        : "I don't have current weather data right now. Please check DOST-PAGASA (https://www.pagasa.dost.gov.ph/) and ICDRRMD (https://www.facebook.com/drrmoiligancity).";
  }

  const barangay = ILIGAN_BARANGAYS.find(
    (item) =>
      normalizedQuery.includes(item.name.toLowerCase()) ||
      item.name.toLowerCase() === barangayName?.toLowerCase(),
  );

  if (barangay) {
    const risk = barangay.keyRiskNotes[language] || barangay.keyRiskNotes.en;
    const centres =
      barangay.evacuationCentres?.join(", ") ||
      "Confirm with the barangay DRRM office";
    return `**Barangay ${barangay.name} Safety Profile:**\n\n- **Hazards:** ${barangay.hazards.join(", ")}\n- **Risk note:** ${risk}\n- **Evacuation centres:** ${centres}\n- **Local contact:** ${barangay.contactPersonOrOffice || "Barangay DRRM office"}`;
  }

  return language === "ceb"
    ? "Ako ang ANDAM AI. Makatabang ko sa Iligan City disaster safety, barangay risks, weather, Go-Bag preparation, ug emergency hotlines. Unsay imong pangutana?"
    : language === "fil"
      ? "Ako ang ANDAM AI. Maaari akong tumulong tungkol sa disaster safety, barangay risks, panahon, Go-Bag, at emergency hotlines sa Iligan City. Ano ang iyong tanong?"
      : "I am ANDAM AI. I can help with Iligan City disaster safety, barangay risks, weather, Go-Bag preparation, and emergency hotlines. What would you like to know?";
}

async function generateWithFallback(
  ai: GoogleGenAI,
  params: Record<string, unknown>,
) {
  let lastError: unknown;

  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        ...params,
        model,
      } as never);
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
      body = (await request.json()) as ChatBody;
    } catch {
      return Response.json(
        { error: "Request body must be valid JSON." },
        { status: 400 },
      );
    }

    const messages = body.messages;
    if (
      !Array.isArray(messages) ||
      messages.length === 0 ||
      messages.length > 50
    ) {
      return Response.json(
        { error: "Messages must contain between 1 and 50 items." },
        { status: 400 },
      );
    }

    const validMessages = messages.every(
      (message) =>
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim().length > 0 &&
        message.content.length <= 10_000,
    );
    if (!validMessages) {
      return Response.json(
        { error: "Each message must have a valid role and content." },
        { status: 400 },
      );
    }

    const language: Language = ["ceb", "fil", "en"].includes(
      body.userLanguage || "",
    )
      ? (body.userLanguage as Language)
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
      if (body.barangay)
        systemInstruction += `\nUSER LOCATION: Barangay ${body.barangay}, Iligan City.`;
      if (body.isEmergency)
        systemInstruction +=
          "\nACTIVE EMERGENCY: Give immediate safety steps and ICDRRMO hotlines first.";
      systemInstruction += weather
        ? `\nWEATHER CONTEXT (${weather.timestamp}): ${JSON.stringify(weather)}\nThis is automated forecast-model data from Open-Meteo, not a DOST-PAGASA bulletin. Credit it to Open-Meteo, never present it as coming from DOST-PAGASA, and tell users to check DOST-PAGASA for official forecasts and warnings.`
        : "\nWEATHER DATA UNAVAILABLE: You have no current weather data. Do not state or estimate current conditions, temperatures, or rain chances. Say the data is unavailable and direct users to DOST-PAGASA and ICDRRMD.";

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

      return Response.json({
        text,
        timestamp: new Date().toISOString(),
        sources: SOURCES,
      });
    } catch (error) {
      console.error(
        "Gemini unavailable; returning local DRRM response:",
        error,
      );
      return Response.json({
        text: localFallback(
          latestMessage,
          language,
          body.barangay,
          body.isEmergency,
          weather,
        ),
        timestamp: new Date().toISOString(),
        sources: SOURCES,
        fallback: true,
      });
    }
  },
};
