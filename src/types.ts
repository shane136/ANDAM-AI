export type Language = 'ceb' | 'fil' | 'en';
export type Theme = 'light' | 'dark';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  language?: Language;
  isEmergency?: boolean;
  sources?: {
    name: string;
    url?: string;
  }[];
}

export interface EmergencyContact {
  id: string;
  name: string;
  agency: string;
  numbers: string[];
  category: 'rescue' | 'police' | 'fire' | 'medical' | 'utilities' | 'government';
  address?: string;
  description?: string;
  isAvailable247?: boolean;
}

export interface BarangayInfo {
  id: string;
  name: string;
  district: 'North' | 'South' | 'East' | 'West' | 'Central';
  populationEstimate?: string;
  hazards: ('flood' | 'flash_flood' | 'landslide' | 'storm_surge' | 'fire')[];
  evacuationCentres?: string[];
  keyRiskNotes: {
    ceb: string;
    fil: string;
    en: string;
  };
  contactPersonOrOffice?: string;
}

export interface HazardGuide {
  id: string;
  title: { ceb: string; fil: string; en: string };
  hazardType: 'flooding' | 'flash_flood' | 'earthquake' | 'tsunami' | 'typhoon' | 'landslide' | 'storm_surge' | 'fire' | 'heatwave';
  icon: string;
  summary: { ceb: string; fil: string; en: string };
  beforeSteps: { ceb: string; fil: string; en: string }[];
  duringSteps: { ceb: string; fil: string; en: string }[];
  afterSteps: { ceb: string; fil: string; en: string }[];
  safetyTip: { ceb: string; fil: string; en: string };
}

export interface GoBagItem {
  id: string;
  category: 'water_food' | 'first_aid' | 'tools_gear' | 'documents_cash' | 'sanitation' | 'special_needs';
  title: { ceb: string; fil: string; en: string };
  description?: { ceb: string; fil: string; en: string };
  checked: boolean;
  isEssential: boolean;
}

export interface WeatherData {
  city: string;
  timestamp: string;
  temperature: number;
  apparentTemperature: number;
  relativeHumidity: number;
  cloudCover: number;
  windSpeed: number;
  precipitation: number;
  isDay: boolean;
  weatherCode: number;
  conditionLabel: {
    ceb: string;
    fil: string;
    en: string;
  };
  pagasaSynopsis: {
    ceb: string;
    fil: string;
    en: string;
  };
  todayHigh: number;
  todayLow: number;
  rainChanceToday: number;
  rainChanceTonight: number;
  precipitationSum: number;
  source: string;
}

export interface AdvisoryItem {
  id: string;
  title: string;
  agency: 'ILIGAN_ICDRRMD' | 'ILIGAN_CDRRMO' | 'PAGASA' | 'PHIVOLCS' | 'ILIGAN_LGU';
  type: 'weather' | 'earthquake' | 'flood' | 'general';
  level: 'info' | 'advisory' | 'warning' | 'critical';
  content: string;
  date: string;
  link?: string;
}
