import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { ILIGAN_DRRM_SYSTEM_INSTRUCTION } from "./src/constants/systemInstruction";
import { fetchIliganRealtimeWeather } from "./src/services/weatherService";
import { ILIGAN_BARANGAYS, OFFICIAL_HOTLINES, HAZARD_GUIDES, GO_BAG_ITEMS } from "./src/constants/iliganData";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize Gemini Client
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is missing from environment variables.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// Supported model pool with seamless automatic fallback
const CANDIDATE_MODELS = [
  "gemini-3.7-flash",
  "gemini-flash-latest",
  "gemini-3.1-flash-lite"
];

// Helper function to handle generateContent across candidate models and retries
async function generateContentWithFallback(ai: GoogleGenAI, baseParams: any) {
  let lastError: any;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      console.log(`Sending DRRM query to model: ${modelName}...`);
      const response = await ai.models.generateContent({
        ...baseParams,
        model: modelName,
      });
      if (response && response.text) {
        return response;
      }
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      console.warn(`Model ${modelName} failed (${err?.status || err?.code || 'error'}): ${errMsg.slice(0, 150)}`);
      // Short delay before trying the next model
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  throw lastError;
}

// Smart context-aware local DRRM knowledge fallback generator
function generateLocalDRRMFallback(query: string, lang: 'ceb' | 'fil' | 'en' = 'ceb', barangayName?: string, isEmergency?: boolean, weatherData?: any) {
  const q = query.toLowerCase();
  const selectedLang = (lang === 'fil' || lang === 'en') ? lang : 'ceb';

  // 1. Weather / PAGASA queries
  const isWeatherQuery = q.includes('weather') || q.includes('panahon') || q.includes('ulan') || q.includes('init') || q.includes('temp') || q.includes('pagasa') || q.includes('rain') || q.includes('dagom') || q.includes('bagyo') || q.includes('tonight') || q.includes('today');
  if (isWeatherQuery && weatherData) {
    if (selectedLang === 'ceb') {
      return `**Iligan City Live Weather & DOST-PAGASA Telemetry:**\n\n- **Temperatura Karon**: ${weatherData.temperature}°C (Mabatyagan: ${weatherData.apparentTemperature}°C)\n- **Kahimtang sa Kalangitan**: ${weatherData.conditionLabel.ceb}\n- **Kahigayonan sa Pag-ulan Karong Adlawa (Daytime)**: ${weatherData.rainChanceToday}%\n- **Kahigayonan sa Pag-ulan Karong Gabii (Nighttime)**: ${weatherData.rainChanceTonight}%\n- **PAGASA Regional Bulletin**: ${weatherData.pagasaSynopsis.ceb}\n\n*Alang sa mga dinalian nga pagbaha o pagdahili sa yuta, tawag dayon sa **ICDRRMO Hotline: (063) 221-8459 / 0997-726-2692 / 0969-233-7878** (Official FB: facebook.com/drrmoiligancity).*`;
    } else if (selectedLang === 'fil') {
      return `**Iligan City Live Weather & DOST-PAGASA Telemetry:**\n\n- **Kasalukuyang Temperatura**: ${weatherData.temperature}°C (Pakiramdam: ${weatherData.apparentTemperature}°C)\n- **Lagay ng Panahon**: ${weatherData.conditionLabel.fil}\n- **Tsansa ng Ulan Ngayong Araw (Daytime)**: ${weatherData.rainChanceToday}%\n- **Tsansa ng Ulan Ngayong Gabi (Nighttime)**: ${weatherData.rainChanceTonight}%\n- **DOST-PAGASA Bulletin**: ${weatherData.pagasaSynopsis.fil}\n\n*Emergency Hotlines: **ICDRRMO: (063) 221-8459 / 0997-726-2692 / 0969-233-7878** (Official FB: facebook.com/drrmoiligancity).*`;
    } else {
      return `**Iligan City Real-Time Weather Update (DOST-PAGASA Telemetry):**\n\n- **Current Temperature**: ${weatherData.temperature}°C (Feels like ${weatherData.apparentTemperature}°C)\n- **Condition**: ${weatherData.conditionLabel.en}\n- **Rain Probability Today (Daytime)**: ${weatherData.rainChanceToday}%\n- **Rain Probability Tonight (Nighttime)**: ${weatherData.rainChanceTonight}%\n- **DOST-PAGASA Regional Synopsis**: ${weatherData.pagasaSynopsis.en}\n\n*Emergency Rescue Hotlines: **ICDRRMO: (063) 221-8459 / 0997-726-2692 / 0969-233-7878** (Official FB: facebook.com/drrmoiligancity).*`;
    }
  }

  // 2. Specific Barangay Hazard / Evacuation queries
  let matchedBarangay = ILIGAN_BARANGAYS.find(b => q.includes(b.name.toLowerCase()) || (barangayName && b.name.toLowerCase() === barangayName.toLowerCase()));
  if (matchedBarangay) {
    const riskNote = matchedBarangay.keyRiskNotes[selectedLang] || matchedBarangay.keyRiskNotes.en;
    const evacCenters = matchedBarangay.evacuationCentres.join(", ");
    const hazards = matchedBarangay.hazards.join(", ").toUpperCase();

    if (selectedLang === 'ceb') {
      return `**Impormasyon sa Kaluwasan alang sa Barangay ${matchedBarangay.name}, Iligan City:**\n\n- **Mga Nag-unang Peligro**: ${hazards}\n- **Talaan sa Peligro (MGB/DRRM)**: ${riskNote}\n- **Mga Opisyal nga Evacuation Centers**: ${evacCenters}\n- **Lokal nga Koordinasyon**: ${matchedBarangay.contactPersonOrOffice}\n\n*Kun adunay baha o dinalian nga pagbakwit, tawag sa **ICDRRMO: (063) 221-8459 / 0997-726-2692 / 0969-233-7878**.*`;
    } else if (selectedLang === 'fil') {
      return `**Impormasyon sa Kaligtasan para sa Barangay ${matchedBarangay.name}, Iligan City:**\n\n- **Pangunahing Panganib**: ${hazards}\n- **Pagsusuri sa Peligro (MGB/DRRM)**: ${riskNote}\n- **Opisyal na Evacuation Centers**: ${evacCenters}\n- **Lokal na Ugnayan**: ${matchedBarangay.contactPersonOrOffice}\n\n*Hotlines: **ICDRRMO Rescue: (063) 221-8459 / 0997-726-2692 / 0969-233-7878**.*`;
    } else {
      return `**Disaster Safety & Evacuation Profile for Barangay ${matchedBarangay.name}, Iligan City:**\n\n- **Primary Hazard Vectors**: ${hazards}\n- **Risk Assessment (MGB/DRRM)**: ${riskNote}\n- **Designated Evacuation Centers**: ${evacCenters}\n- **Local Committee**: ${matchedBarangay.contactPersonOrOffice}\n\n*Emergency Hotlines: **ICDRRMO: (063) 221-8459 / 0997-726-2692 / 0969-233-7878**.*`;
    }
  }

  // 3. Emergency / Rescue queries
  if (isEmergency || q.includes('help') || q.includes('tabang') || q.includes('rescue') || q.includes('sakay') || q.includes('tulong') || q.includes('emergency') || q.includes('hotline') || q.includes('police') || q.includes('fire') || q.includes('pnp') || q.includes('bfp')) {
    if (selectedLang === 'ceb') {
      return `🚨 **DINALIAN NGA MGA OPISYAL NGA HOTLINE SA ILIGAN CITY (24/7):**\n\n- **ICDRRMO (Iligan Rescue & Disaster Command)**: **(063) 221-8459** | **0997-726-2692** (Globe) | **0969-233-7878** (Smart)\n- **Official FB Page**: [facebook.com/drrmoiligancity](https://www.facebook.com/drrmoiligancity)\n- **PNP Iligan City Police Office (ICPO)**: **167** / **(063) 221-6699** / **0917-700-1660**\n- **BFP Iligan Central Fire Station**: **160** / **161** / **(063) 221-9055** / **0967-871-4388**\n- **Philippine Red Cross Iligan Chapter**: **143** / **(063) 222-2907** / **0967-228-3196**\n- **Philippine Coast Guard (PCG Iligan)**: **(063) 211-5398** / **0917-640-2326**\n- **Gregorio T. Lluch Memorial Hospital (City Hospital - GTLMH)**: **(063) 221-2536** / **(063) 221-9906**\n- **Adventist Medical Center (Sanitarium)**: **(063) 221-3636** / **(063) 221-7199**\n- **ILPI Power Hazard Hotline**: **0917-844-7071** / **(063) 221-5708**\n- **ICWS Waterworks Emergency**: **(063) 223-3233** / **0945-662-6528**\n\n**Giya sa Kaluwasan**:\n1. Pabilin sa luwas nga taas nga lugar.\n2. Palonga ang main power breaker kun mosulod na ang tubig.\n3. Pag-andam sa inyong Go-Bag ug paminaw sa opisyal nga pahibalo sa CDRRMO.`;
    } else {
      return `🚨 **ILIGAN CITY OFFICIAL EMERGENCY HOTLINES (24/7 COMMAND):**\n\n- **ICDRRMO (Iligan Rescue & Disaster Command)**: **(063) 221-8459** | **0997-726-2692** (Globe) | **0969-233-7878** (Smart)\n- **Official FB Page**: [facebook.com/drrmoiligancity](https://www.facebook.com/drrmoiligancity)\n- **PNP Iligan City Police HQ (ICPO)**: **167** / **(063) 221-6699** / **0917-700-1660**\n- **BFP Iligan Central Fire Station**: **160** / **161** / **(063) 221-9055** / **0967-871-4388**\n- **Philippine Red Cross (Iligan Chapter)**: **143** / **(063) 222-2907** / **0967-228-3196**\n- **Philippine Coast Guard (PCG Iligan)**: **(063) 211-5398** / **0917-640-2326**\n- **Gregorio T. Lluch Memorial Hospital (City Hospital - GTLMH)**: **(063) 221-2536** / **(063) 221-9906**\n- **Adventist Medical Center (Sanitarium)**: **(063) 221-3636** / **(063) 221-7199**\n- **ILPI Power Outage & Hazards**: **0917-844-7071** / **(063) 221-5708**\n- **ICWS Waterworks Desk**: **(063) 223-3233** / **0945-662-6528**\n\n**Immediate Safety Instructions**:\n1. Move to higher ground immediately if floodwaters rise.\n2. Turn off main circuit breakers and LPG tanks.\n3. Carry your emergency Go-Bag and await official rescue instructions.`;
    }
  }

  // 4. Go-Bag / Checklist inquiries
  if (q.includes('go bag') || q.includes('bag') || q.includes('checklist') || q.includes('gamit') || q.includes('dalhon') || q.includes('survival')) {
    if (selectedLang === 'ceb') {
      return `🎒 **MGA IMPORTANTE NGA SULOD SA 72-HOUR FAMILY GO-BAG:**\n\n1. **Tubig & Pagkaon**: 1 galon nga tubig matag tawo kada adlaw, easy-open nga de-lata, biskwit.\n2. **First Aid & Tambal**: Personal nga tambal (maintenance), alcohol, bendahe, paracetamol.\n3. **Kahayag & Komunikasyon**: Flashlight, battery-operated radio, spare batteries, power bank.\n4. **Importanteng Dokumento**: Birth certificates, IDs, land titles sa waterproof ziplock pouch.\n5. **Sanitary & Sanina**: Extra bisti, toothbrush, sabon, emergency whistle ug pisi.\n\n*Tan-awa ang **Family Go-Bag** tab sa app para sa interactive packing list.*`;
    } else {
      return `🎒 **72-HOUR EMERGENCY GO-BAG ESSENTIALS:**\n\n1. **Drinking Water & Food**: 1 gallon per person per day, non-perishable canned food, biscuits.\n2. **First Aid & Medications**: Essential maintenance meds, antiseptic, bandages, paracetamol.\n3. **Lighting & Communication**: Heavy-duty flashlight, AM/FM radio, power banks, extra batteries.\n4. **Critical Documents**: Identification, land titles, insurance in waterproof ziplock bags.\n5. **Personal Sanitation & Clothing**: Dry change of clothes, raincoat, hygiene kit, emergency whistle.\n\n*Check the **Family Go-Bag** tab in this app for the complete interactive checklist.*`;
    }
  }

  // 5. Default Comprehensive Disaster Preparedness Answer
  if (selectedLang === 'ceb') {
    return `Maayong adlaw! Ako ang **ANDAM AI** — ang imong 24/7 AI Chatbot alang sa Disaster Safety ug Preparedness sa Iligan City.\n\n- **ICDRRMO Official Hotlines**: **(063) 221-8459** | **0997-726-2692** (Globe) | **0969-233-7878** (Smart)\n- **Official FB**: [facebook.com/drrmoiligancity](https://www.facebook.com/drrmoiligancity)\n- **Barangay Risks**: Susiha ang imong barangay evacuation center ug hazard level.\n- **PAGASA Alerts**: Kanunayng mag-monitor sa mga pahimangno sa bagyo ug pagbaha.\n\nUnsay imong gustong mahibaloan bahin sa kaluwasan sa imong lugar karon?`;
  } else if (selectedLang === 'fil') {
    return `Magandang araw! Ako ang **ANDAM AI** — ang iyong 24/7 AI Chatbot para sa Disaster Safety at Preparedness sa Iligan City.\n\n- **ICDRRMO Official Hotlines**: **(063) 221-8459** | **0997-726-2692** (Globe) | **0969-233-7878** (Smart)\n- **Official FB**: [facebook.com/drrmoiligancity](https://www.facebook.com/drrmoiligancity)\n- **Barangay Risks**: Alamin ang mga evacuation center at hazard level ng inyong barangay.\n- **PAGASA Alerts**: Maging handa sa mga ulat ng panahon at pagbaha.\n\nMayroon ka bang nais itanong ukol sa kaligtasan ng inyong barangay?`;
  } else {
    return `Welcome to **ANDAM AI** — Your 24/7 AI Disaster Safety & Emergency Preparedness Assistant for Iligan City.\n\n- **ICDRRMO Official Hotlines**: **(063) 221-8459** | **0997-726-2692** (Globe) | **0969-233-7878** (Smart)\n- **Official FB**: [facebook.com/drrmoiligancity](https://www.facebook.com/drrmoiligancity)\n- **Evacuation & Barangay Hazards**: Search and inspect your local barangay disaster risk profile.\n- **DOST-PAGASA Telemetry**: Monitor live weather, rain probability, and flood advisories.\n\nHow can I help keep your family safe today?`;
  }
}

// Health Check API
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "ANDAM AI - Iligan City DRRM Assistant",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY)
  });
});

// Live DOST-PAGASA & Iligan Weather API Route
app.get("/api/weather", async (req, res) => {
  try {
    const weather = await fetchIliganRealtimeWeather();
    return res.json(weather);
  } catch (error) {
    console.error("Error fetching live Iligan weather:", error);
    return res.status(500).json({ error: "Failed to fetch real-time weather update for Iligan City." });
  }
});

// Chat API Route
app.post("/api/chat", async (req, res) => {
  const { messages, userLanguage, isEmergency, barangay } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Messages array is required." });
  }

  const latestUserMessage = messages[messages.length - 1]?.content || "";
  let weatherData: any = null;

  try {
    weatherData = await fetchIliganRealtimeWeather();
  } catch (weatherErr) {
    console.warn("Could not retrieve live weather telemetry for chat prompt:", weatherErr);
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured; using local DRRM fallback.");
    }

    const ai = getGeminiClient();

    // Prepare contents array for Gemini API
    const formattedContents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    // Inject contextual language / emergency hints into system instructions if provided
    let dynamicSystemInstruction = ILIGAN_DRRM_SYSTEM_INSTRUCTION;
    if (userLanguage) {
      dynamicSystemInstruction += `\nPREFERRED USER LANGUAGE MODE: ${userLanguage}. Please respond in ${userLanguage === 'ceb' ? 'Cebuano / Bisaya' : userLanguage === 'fil' ? 'Filipino / Tagalog' : 'English'}.`;
    }
    if (barangay) {
      dynamicSystemInstruction += `\nUSER LOCATION CONTEXT: Barangay ${barangay}, Iligan City.`;
    }
    if (isEmergency) {
      dynamicSystemInstruction += `\nACTIVE EMERGENCY TRIGGERED! Prioritize immediate action steps in BOLD, official emergency hotlines (ICDRRMO Rescue: (063) 221-8459 / 0997-726-2692 / 0969-233-7878; Official FB: https://www.facebook.com/drrmoiligancity), and keep the response direct and urgent!`;
    }

    // Inject live weather telemetry
    if (weatherData) {
      dynamicSystemInstruction += `\n\n=== REAL-TIME DOST-PAGASA & ILIGAN CITY WEATHER TELEMETRY ===
Timestamp: ${weatherData.timestamp}
Location: ${weatherData.city}
Current Temperature: ${weatherData.temperature}°C (Feels like ${weatherData.apparentTemperature}°C)
Current Condition: ${weatherData.conditionLabel.en} | Cebuano: ${weatherData.conditionLabel.ceb} | Filipino: ${weatherData.conditionLabel.fil}
DOST-PAGASA Regional Synopsis: ${weatherData.pagasaSynopsis.en} | Bisaya: ${weatherData.pagasaSynopsis.ceb}
Today High / Low Temp: ${weatherData.todayHigh}°C / ${weatherData.todayLow}°C
Rain Probability TODAY (Daytime): ${weatherData.rainChanceToday}%
Rain Probability TONIGHT (Nighttime): ${weatherData.rainChanceTonight}%
Precipitation Total Expected: ${weatherData.precipitationSum} mm
Wind Speed: ${weatherData.windSpeed} km/h | Relative Humidity: ${weatherData.relativeHumidity}%
Cloud Cover: ${weatherData.cloudCover}%
Data Source: ${weatherData.source}
[INSTRUCTION]: When the user asks "what is the weather today or tonight in Iligan City" or asks about rain, temperature, or PAGASA advisories in Iligan, use these EXACT live values above. Cite DOST-PAGASA and provide clear, helpful advice for Iligan City residents!`;
    }

    const response = await generateContentWithFallback(ai, {
      contents: formattedContents,
      config: {
        systemInstruction: dynamicSystemInstruction,
        temperature: isEmergency ? 0.2 : 0.4,
      },
    });

    const replyText = response.text || generateLocalDRRMFallback(latestUserMessage, userLanguage, barangay, isEmergency, weatherData);

    return res.json({
      text: replyText,
      timestamp: new Date().toISOString(),
      sources: [
        { name: "Iligan City CDRRMO / LGU", url: "https://iligan.gov.ph/" },
        { name: "DOST-PAGASA", url: "https://www.pagasa.dost.gov.ph/" },
        { name: "DOST-PHIVOLCS", url: "https://www.phivolcs.dost.gov.ph/" }
      ]
    });
  } catch (error: any) {
    console.error("Gemini API Chat Fallback triggered:", error?.message || error);
    const fallbackText = generateLocalDRRMFallback(latestUserMessage, userLanguage, barangay, isEmergency, weatherData);
    return res.status(200).json({
      text: fallbackText,
      timestamp: new Date().toISOString(),
      sources: [
        { name: "Iligan City CDRRMO", url: "https://iligan.gov.ph/" },
        { name: "DOST-PAGASA", url: "https://www.pagasa.dost.gov.ph/" }
      ]
    });
  }
});

// Start Server with Vite Middleware in Dev or Static files in Production
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ANDAM AI - Iligan City DRRM Assistant server running on http://0.0.0.0:${PORT}`);
  });
}

// Vercel imports this Express app from the root-level api entrypoints. Starting
// a listener there would keep the serverless invocation from completing.
if (!process.env.VERCEL) {
  start().catch((error) => {
    console.error("Failed to start ANDAM AI server:", error);
    process.exitCode = 1;
  });
}

export default app;
