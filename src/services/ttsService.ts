import { Language } from '../types';

/**
 * Clean and format markdown text into natural human-spoken sentences.
 */
export function sanitizeTextForSpeech(text: string): string {
  if (!text) return '';

  return (
    text
      // Convert markdown links [text](url) -> text
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      // Remove URLs
      .replace(/https?:\/\/[^\s)]+/g, '')
      // Remove headers, bold, italics, code blocks, bullet markers
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      .replace(/~~([^~]+)~~/g, '')
      // Remove HTML tags
      .replace(/<[^>]+>/g, '')
      // Remove bullet stars, hyphens at line starts
      .replace(/^\s*[-*+]\s+/gm, '')
      // Clean up common disaster agency acronyms for clearer phonetic reading
      .replace(/\bICDRRMD\b/g, 'I C D R R M D')
      .replace(/\bCDRRMO\b/g, 'C D R R M O')
      .replace(/\bLGU\b/g, 'L G U')
      .replace(/\bBFP\b/g, 'B F P')
      .replace(/\bPNP\b/g, 'P N P')
      .replace(/\bPCG\b/g, 'P C G')
      .replace(/\bDOST-PAGASA\b/gi, 'DOST Pagasa')
      .replace(/\bPAGASA\b/gi, 'Pagasa')
      .replace(/\bDOST-PHIVOLCS\b/gi, 'DOST Phivolcs')
      .replace(/\bPHIVOLCS\b/gi, 'Phivolcs')
      .replace(/\bGTLMH\b/g, 'G T L M H Hospital')
      .replace(/\bILPI\b/g, 'I L P I')
      .replace(/\bICWS\b/g, 'I C W S')
      // Clean phone numbers: format with pauses
      .replace(/\((\d{3})\)\s*(\d{3})-(\d{4})/g, '$1 $2 $3')
      // Remove common emojis and symbols
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      // Remove stray markdown symbols
      .replace(/[#*_~|`]/g, '')
      // Collapse repeated punctuation and whitespace
      .replace(/\n+/g, '. ')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/**
 * Splits text into conversational sentence chunks under maxLen characters
 * to avoid browser-specific speech synthesis buffer truncation and timeout bugs.
 */
export function splitIntoSentenceChunks(text: string, maxLen = 160): string[] {
  if (!text.trim()) return [];

  // Match sentences by standard punctuation
  const sentenceRegex = /[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g;
  const rawSentences = text.match(sentenceRegex) || [text];

  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of rawSentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    if (trimmed.length > maxLen) {
      // If a single sentence is very long, split by comma or semi-colon or words
      const subPhrases = trimmed.split(/([,;:]\s+)/);
      for (const phrase of subPhrases) {
        if (!phrase.trim()) continue;
        if ((currentChunk + ' ' + phrase).trim().length <= maxLen) {
          currentChunk = (currentChunk + ' ' + phrase).trim();
        } else {
          if (currentChunk) chunks.push(currentChunk);
          currentChunk = phrase.trim();
        }
      }
    } else if ((currentChunk + ' ' + trimmed).trim().length <= maxLen) {
      currentChunk = (currentChunk + ' ' + trimmed).trim();
    } else {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = trimmed;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

export interface TTSCallbacks {
  onStart?: () => void;
  onChunkChange?: (chunkIndex: number, totalChunks: number) => void;
  onPause?: () => void;
  onResume?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

// Global active utterance array to prevent Chrome / Safari garbage collection bug
const activeUtterances: SpeechSynthesisUtterance[] = [];

class TextToSpeechManager {
  private voices: SpeechSynthesisVoice[] = [];
  private isVoicesLoaded = false;
  private currentChunks: string[] = [];
  private currentChunkIndex = 0;
  private isPaused = false;
  private isSpeaking = false;
  private activeMessageId: string | null = null;
  private currentCallbacks: TTSCallbacks = {};
  private currentLang: Language = 'ceb';
  private hasAudioBeenUnlocked = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  private loadVoices() {
    if (!this.isSupported()) return;
    try {
      this.voices = window.speechSynthesis.getVoices() || [];
      if (this.voices.length > 0) {
        this.isVoicesLoaded = true;
      }
    } catch {
      // Ignore voice loading errors
    }
  }

  /**
   * Unlock Web Audio & Speech Synthesis on mobile (iOS Safari / Android Chrome)
   * Must be called during a user gesture (tap, click, keydown).
   */
  public unlockAudio() {
    if (this.hasAudioBeenUnlocked || !this.isSupported()) return;
    try {
      // Prime SpeechSynthesis with an empty utterance
      const emptyUtterance = new SpeechSynthesisUtterance(' ');
      emptyUtterance.volume = 0.01;
      emptyUtterance.rate = 10;
      window.speechSynthesis.speak(emptyUtterance);
      this.hasAudioBeenUnlocked = true;
    } catch {
      // Silently catch unlock issues
    }
  }

  /**
   * Select best voice for the chosen language
   */
  private getBestVoice(language: Language): { voice: SpeechSynthesisVoice | null; langCode: string } {
    if (!this.isVoicesLoaded) {
      this.loadVoices();
    }

    if (language === 'ceb' || language === 'fil') {
      // Match Tagalog / Filipino voices
      const filVoice = this.voices.find(
        (v) =>
          v.lang.toLowerCase().startsWith('fil') ||
          v.lang.toLowerCase().startsWith('tl') ||
          v.name.toLowerCase().includes('filipino') ||
          v.name.toLowerCase().includes('tagalog')
      );
      if (filVoice) return { voice: filVoice, langCode: filVoice.lang };

      // Fallback: Philippine English voice if available
      const enPhVoice = this.voices.find((v) => v.lang.toLowerCase() === 'en-ph');
      if (enPhVoice) return { voice: enPhVoice, langCode: 'en-PH' };

      return { voice: null, langCode: 'fil-PH' };
    } else {
      // English
      const enPhVoice = this.voices.find((v) => v.lang.toLowerCase() === 'en-ph');
      if (enPhVoice) return { voice: enPhVoice, langCode: 'en-PH' };

      const enVoice = this.voices.find(
        (v) => v.lang.toLowerCase().startsWith('en') && (v.default || v.lang.toLowerCase() === 'en-us')
      );
      if (enVoice) return { voice: enVoice, langCode: enVoice.lang };

      return { voice: null, langCode: 'en-US' };
    }
  }

  public speak(
    messageId: string,
    rawText: string,
    language: Language,
    callbacks: TTSCallbacks = {}
  ) {
    if (!this.isSupported()) {
      callbacks.onError?.(new Error('SpeechSynthesis is not supported in this browser.'));
      return;
    }

    // Stop any existing speech playback
    this.stop();

    const sanitized = sanitizeTextForSpeech(rawText);
    if (!sanitized) {
      callbacks.onEnd?.();
      return;
    }

    this.currentChunks = splitIntoSentenceChunks(sanitized);
    if (this.currentChunks.length === 0) {
      callbacks.onEnd?.();
      return;
    }

    this.activeMessageId = messageId;
    this.currentLang = language;
    this.currentCallbacks = callbacks;
    this.currentChunkIndex = 0;
    this.isPaused = false;
    this.isSpeaking = true;

    this.currentCallbacks.onStart?.();
    this.speakCurrentChunk();
  }

  private speakCurrentChunk() {
    if (!this.isSpeaking || this.isPaused) return;

    if (this.currentChunkIndex >= this.currentChunks.length) {
      this.cleanup();
      this.currentCallbacks.onEnd?.();
      return;
    }

    const chunkText = this.currentChunks[this.currentChunkIndex];
    const { voice, langCode } = this.getBestVoice(this.currentLang);

    const utterance = new SpeechSynthesisUtterance(chunkText);
    utterance.lang = langCode;
    if (voice) {
      utterance.voice = voice;
    }

    // Tune speech rate and pitch for clear, natural emergency broadcast cadence
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Prevent Chromium garbage collection bug by pushing to active pool
    activeUtterances.push(utterance);

    utterance.onstart = () => {
      this.currentCallbacks.onChunkChange?.(this.currentChunkIndex, this.currentChunks.length);
    };

    utterance.onend = () => {
      // Remove from active pool
      const idx = activeUtterances.indexOf(utterance);
      if (idx !== -1) activeUtterances.splice(idx, 1);

      if (this.isSpeaking && !this.isPaused) {
        this.currentChunkIndex++;
        this.speakCurrentChunk();
      }
    };

    utterance.onerror = (e) => {
      const idx = activeUtterances.indexOf(utterance);
      if (idx !== -1) activeUtterances.splice(idx, 1);

      // Handle user cancellation vs actual error
      if (e.error === 'canceled' || e.error === 'interrupted') {
        return;
      }
      console.warn('TTS chunk error:', e);
      this.currentChunkIndex++;
      if (this.currentChunkIndex < this.currentChunks.length) {
        this.speakCurrentChunk();
      } else {
        this.cleanup();
        this.currentCallbacks.onError?.(e);
      }
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('SpeechSynthesis speak failed:', err);
      this.cleanup();
      this.currentCallbacks.onError?.(err);
    }
  }

  public pause() {
    if (!this.isSupported() || !this.isSpeaking || this.isPaused) return;
    try {
      window.speechSynthesis.pause();
      this.isPaused = true;
      this.currentCallbacks.onPause?.();
    } catch (e) {
      console.warn('SpeechSynthesis pause error:', e);
    }
  }

  public resume() {
    if (!this.isSupported() || !this.isSpeaking || !this.isPaused) return;
    try {
      window.speechSynthesis.resume();
      this.isPaused = false;
      this.currentCallbacks.onResume?.();
    } catch (e) {
      console.warn('SpeechSynthesis resume error:', e);
      // Fallback: re-speak current chunk
      this.isPaused = false;
      this.speakCurrentChunk();
    }
  }

  public stop() {
    if (!this.isSupported()) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore cancel error
    }
    activeUtterances.length = 0;
    this.cleanup();
  }

  private cleanup() {
    this.isSpeaking = false;
    this.isPaused = false;
    this.activeMessageId = null;
    this.currentChunks = [];
    this.currentChunkIndex = 0;
  }

  public getPlaybackState(): 'idle' | 'playing' | 'paused' {
    if (!this.isSpeaking) return 'idle';
    if (this.isPaused) return 'paused';
    return 'playing';
  }

  public getActiveMessageId(): string | null {
    return this.activeMessageId;
  }
}

export const ttsService = new TextToSpeechManager();
