import { WeatherData } from '../types';

// In-memory cache for Iligan City live weather
let cachedWeatherData: WeatherData | null = null;
let cacheTime = 0;
const CACHE_DURATION_MS = 3 * 60 * 1000; // 3 minutes
const WEATHER_TIMEOUT_MS = 5000; // Failures aren't cached, so an outage must not stall every chat request

export function mapWmoToCondition(code: number, isDay: boolean = true) {
  if (code === 0) {
    return {
      ceb: isDay ? 'Matahom ug Hayag nga Panahon' : 'Matin-aw nga Gabii',
      fil: isDay ? 'Maliwanag at Sikat ng Araw' : 'Maliwanag na Gabi',
      en: isDay ? 'Clear & Sunny Skies' : 'Clear Night Skies',
      safetyNote: {
        ceb: 'Maayo ang panahon karon. Gamay ang tsansa sa kusog nga ulan.',
        fil: 'Maganda ang panahon ngayon. Mababa ang tsansa ng matinding pag-ulan.',
        en: 'Fair weather right now, with a low chance of heavy rain.',
      }
    };
  } else if (code >= 1 && code <= 3) {
    return {
      ceb: 'Medyo Dagom hangtod sa Dagom nga Panganod nga adunay Pipila nga Pag-ulan o Kilat-Leklek',
      fil: 'Bahagyang Maalapaap hanggang sa Maalapaap na may Pag-ulan o Kidlat sa Ilang Bahagi',
      en: 'Partly Cloudy to Cloudy Skies with Isolated Rainshowers or Thunderstorms',
      safetyNote: {
        ceb: 'Pagbantay sa paspas nga pag-ulan sa hapon ug gabii.',
        fil: 'Mag-ingat sa biglaang buhos ng ulan.',
        en: 'Watch for sudden afternoon or evening rain showers.',
      }
    };
  } else if (code >= 51 && code <= 67) {
    return {
      ceb: 'Adunay Hinay hangtod sa Sakat nga Pag-ulan / Drizzle',
      fil: 'Bahagya hanggang Katamtamang Pag-ulan',
      en: 'Light to Moderate Rainshowers / Drizzle',
      safetyNote: {
        ceb: 'Hinay nga pag-ulan. Pag-amping sa danlog nga kadalanan ug pag-ubos sa visibility sa mga kabukiran sa Iligan.',
        fil: 'Maulang panahon. Mag-ingat sa madulas na daan at limitadong kakayahang makakita sa kabundukan ng Iligan.',
        en: 'Light to moderate rain. Drive safely on wet roads and watch for reduced mountain visibility.',
      }
    };
  } else if (code >= 80 && code <= 82) {
    return {
      ceb: 'Kusog ug Paspas nga Kusog nga Baha / Scattered Thunderstorms',
      fil: 'Malakas na Pag-ulan at Kulog-Kidlat sa Ilang Bahagi',
      en: 'Scattered Moderate to Heavy Rainshowers & Thunderstorms',
      safetyNote: {
        ceb: 'Posibleng magpahinabo og localized flash flood sa mga sapa sa Iligan (Mandulog & Iligan River tributaries) ug landslide sa mga bakilid.',
        fil: 'Posibleng magdulot ng flash flood sa mga ilog ng Iligan at landslide sa mabundok na lugar.',
        en: 'Localized flash floods are possible along vulnerable rivers (Mandulog, Tipanoy, Iligan River), with landslides on steep slopes.',
      }
    };
  } else if (code >= 95) {
    return {
      ceb: 'Seryoso ug Kusog nga Bagyo o Dugdug-Kilat (Thunderstorm Warning)',
      fil: 'Banta ng Malakas na Bagyo at Kidlat (Thunderstorm Warning)',
      en: 'Severe Thunderstorm & Lightning Warning',
      safetyNote: {
        ceb: 'Taas nga peligro sa paspas nga pag-awas sa suba (Flash Flood) ug pagdahili sa yuta (Landslide). Pag-andam dayon sa pag-evacuate kun kinahanglan.',
        fil: 'Mataas ang banta ng Flash Flood at Landslide. Maghandang lumikas kung kinakailangan.',
        en: 'High risk of sudden flash floods and landslides. Be ready to evacuate if needed.',
      }
    };
  }

  // Default fallback for cloudiness/weather
  return {
    ceb: 'Dagom nga Panganod nga adunay Tsansa sa Pag-ulan',
    fil: 'Maalapaap na Panahon na may Tsansa ng Ulan',
    en: 'Cloudy Skies with Chance of Precipitation',
    safetyNote: {
      ceb: 'Pag-usab-usab sa panahon. Hinumdumi kanunay ang pagdala og payong ug pag-inspeksyon sa drainage.',
      fil: 'Pabalik-balik na buhos ng ulan. Magdala ng payong at tiyaking malinis ang mga kanal.',
      en: 'Variable weather conditions. Carry rain gear and monitor creek and river levels.',
    }
  };
}

function requireNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Weather API response is missing ${field}`);
  }
  return value;
}

/**
 * Returns current Open-Meteo data for Iligan City, or throws if it can't be fetched.
 * Never substitute placeholder values here: this is a safety app, and callers
 * tell the user when weather is unavailable.
 */
export async function fetchIliganRealtimeWeather(): Promise<WeatherData> {
  const now = Date.now();
  if (cachedWeatherData && now - cacheTime < CACHE_DURATION_MS) {
    return cachedWeatherData;
  }

  const response = await fetch(
    'https://api.open-meteo.com/v1/forecast?latitude=8.2280&longitude=124.2452&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,wind_speed_10m&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&timezone=Asia%2FManila',
    { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(WEATHER_TIMEOUT_MS) }
  );

  if (!response.ok) {
    throw new Error(`Weather API responded with HTTP status ${response.status}`);
  }

  const data = await response.json();
  const current = data.current || {};
  const daily = data.daily || {};
  const hourly = data.hourly || {};

  const code = requireNumber(current.weather_code, 'weather_code');
  const isDay = requireNumber(current.is_day, 'is_day') === 1;
  const condMap = mapWmoToCondition(code, isDay);

  // Hourly data starts at 00:00 Manila time: 06:00-18:00 = today, 18:00-24:00 = tonight
  const hourlyChances: unknown[] = Array.isArray(hourly.precipitation_probability)
    ? hourly.precipitation_probability
    : [];
  const highestChance = (fromHour: number, toHour: number) => {
    const chances = hourlyChances
      .slice(fromHour, toHour)
      .filter((chance): chance is number => typeof chance === 'number');
    return chances.length > 0 ? Math.max(...chances) : undefined;
  };

  const result: WeatherData = {
    city: 'Iligan City, Lanao del Norte, Philippines',
    timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Manila' }) + ' PHT',
    temperature: Math.round(requireNumber(current.temperature_2m, 'temperature_2m')),
    apparentTemperature: Math.round(requireNumber(current.apparent_temperature, 'apparent_temperature')),
    relativeHumidity: requireNumber(current.relative_humidity_2m, 'relative_humidity_2m'),
    cloudCover: requireNumber(current.cloud_cover, 'cloud_cover'),
    windSpeed: Math.round(requireNumber(current.wind_speed_10m, 'wind_speed_10m')),
    precipitation: requireNumber(current.precipitation, 'precipitation'),
    isDay,
    weatherCode: code,
    conditionLabel: {
      ceb: condMap.ceb,
      fil: condMap.fil,
      en: condMap.en,
    },
    safetyNote: condMap.safetyNote,
    todayHigh: Math.round(requireNumber(daily.temperature_2m_max?.[0], 'temperature_2m_max')),
    todayLow: Math.round(requireNumber(daily.temperature_2m_min?.[0], 'temperature_2m_min')),
    rainChanceToday: requireNumber(highestChance(6, 18) ?? daily.precipitation_probability_max?.[0], 'rain chance today'),
    rainChanceTonight: requireNumber(highestChance(18, 24), 'rain chance tonight'),
    precipitationSum: Number(requireNumber(daily.precipitation_sum?.[0], 'precipitation_sum').toFixed(1)),
    source: 'Open-Meteo forecast model (8.2280° N, 124.2452° E); not an official DOST-PAGASA bulletin',
  };

  cachedWeatherData = result;
  cacheTime = now;
  return result;
}
