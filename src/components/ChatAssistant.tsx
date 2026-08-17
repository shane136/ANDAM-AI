import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {useMutation} from '@tanstack/react-query';
import {
  Send,
  ShieldAlert,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Copy,
  Check,
  MapPin,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  Info,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ChatMessage, Language } from '../types';
import { ILIGAN_BARANGAYS } from '../constants/iliganData';

interface ChatAssistantProps {
  language: Language;
  onNavigateToHotlines: () => void;
  onNavigateToGoBag: () => void;
  selectedBarangay: string;
  setSelectedBarangay: (b: string) => void;
}

interface ChatApiResponse {
  text?: string;
  fallbackReply?: string;
  fallback?: boolean;
  sources?: ChatMessage['sources'];
}

interface ChatApiRequest {
  messages: { role: ChatMessage['sender']; content: string }[];
  userLanguage: Language;
  isEmergency: boolean;
  barangay: string;
}

async function postChatMessage(payload: ChatApiRequest) {
  const {data} = await axios.post<ChatApiResponse>('/api/chat', payload, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 60_000,
  });
  return data;
}

export const ChatAssistant: React.FC<ChatAssistantProps> = ({
  language,
  onNavigateToHotlines,
  onNavigateToGoBag,
  selectedBarangay,
  setSelectedBarangay,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: language === 'ceb'
        ? 'Maayong adlaw! Ako ang **Iligan City DRRM Assistant**. Makatabang ako kanimo bahin sa safety guides, pagpangandam sa bagyo o linog, ug impormasyon gikan sa **Iligan ICDRRMD, DOST-PAGASA, ug DOST-PHIVOLCS**.\n\nUnsa man ang akong ikaalagad kanimo karon?'
        : language === 'fil'
        ? 'Magandang araw! Ako ang **Iligan City DRRM Assistant**. Makatutulong ako sa iyo sa mga gabay sa kaligtasan, paghahanda sa bagyo o lindol, at opisyal na impormasyon mula sa **Iligan ICDRRMD, DOST-PAGASA, at DOST-PHIVOLCS**.\n\nAno ang maipaglilingkod ko sa iyo ngayon?'
        : 'Welcome! I am the **Iligan City DRRM Assistant**. I can assist you with disaster safety guides, weather advisories, earthquake safety, and official guidance from **Iligan ICDRRMD, DOST-PAGASA, and DOST-PHIVOLCS**.\n\nHow can I help you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sources: [
        { name: 'Iligan City LGU / ICDRRMD', url: 'https://iligan.gov.ph/' },
        { name: 'DOST-PAGASA', url: 'https://www.pagasa.dost.gov.ph/' },
        { name: 'DOST-PHIVOLCS', url: 'https://www.phivolcs.dost.gov.ph/' },
      ],
    },
  ]);

  const [input, setInput] = useState('');
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatMutation = useMutation({ mutationFn: postChatMessage });
  const loading = chatMutation.isPending;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const quickQueriesRef = useRef<HTMLDivElement>(null);

  const scrollQuickQueries = (direction: 'left' | 'right') => {
    if (quickQueriesRef.current) {
      const scrollAmount = 240;
      quickQueriesRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleWheelQuickQueries = (e: React.WheelEvent<HTMLDivElement>) => {
    if (quickQueriesRef.current && e.deltaY !== 0) {
      quickQueriesRef.current.scrollLeft += e.deltaY;
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Preset Chips
  const presetChips = [
    {
      label: {
        ceb: '🚨 ACTIVE EMERGENCY: Paspas nga Baha!',
        fil: '🚨 ACTIVE EMERGENCY: Mabilis na Baha!',
        en: '🚨 ACTIVE EMERGENCY: Rapid Flooding!',
      },
      prompt: '🚨 EMERGENCY ALERT: Nagbaha na diri sa amoa sa Iligan City ug paspas nga mosaka ang tubig! Unsa akong dapat buhaton dayon?',
      emergency: true,
    },
    {
      label: {
        ceb: '⛅ Weather Today / Tonight (DOST-PAGASA)',
        fil: '⛅ Panahon Ngayon at Mamayang Gabi (PAGASA)',
        en: '⛅ Weather Today & Tonight (DOST-PAGASA)',
      },
      prompt: 'What is the weather today or tonight in Iligan City according to DOST-PAGASA?',
      emergency: false,
    },
    {
      label: {
        ceb: '📞 Official Iligan Emergency Hotlines',
        fil: '📞 Opisyal na Emergency Hotlines',
        en: '📞 Official Emergency Hotlines',
      },
      prompt: 'Unsa ang mga opisyal nga hotline numbers sa Iligan City CDRRMO Rescue, BFP, ug Police?',
      emergency: false,
    },
    {
      label: {
        ceb: '🌊 Mandulog River & Flood Safety',
        fil: '🌊 Mandulog River at Baha Safety',
        en: '🌊 Mandulog River & Flood Risk',
      },
      prompt: 'Unsa ang dapat buhaton kung magpahilo ang Iligan CDRRMO bahin sa Mandulog River water level?',
      emergency: false,
    },
    {
      label: {
        ceb: '🏚️ Linog Safety (Drop, Cover, Hold)',
        fil: '🏚️ Lindol Safety (Drop, Cover, Hold)',
        en: '🏚️ Earthquake Safety Steps',
      },
      prompt: 'Unsa ang Drop, Cover, ug Hold kung makasinati og kusog nga linog sa Iligan City?',
      emergency: false,
    },
    {
      label: {
        ceb: '🎒 Unsaon pag-andam sa Family Go-Bag?',
        fil: '🎒 Paano maghanda ng Family Go-Bag?',
        en: '🎒 How to pack a Family Go-Bag?',
      },
      prompt: 'Unsa ang mga pinaka-importante nga dapat isulod sa Family Emergency Go-Bag para sa matag pamilya sa Iligan?',
      emergency: false,
    },
  ];

  const handleSend = async (customPrompt?: string, isEmergencyTrigger = false) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language,
      isEmergency: isEmergencyTrigger || isEmergencyMode,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    try {
      // Build previous message chain for API context
      const chatHistory = [...messages, userMsg].map((m) => ({
        role: m.sender,
        content: m.text,
      }));

      const data = await chatMutation.mutateAsync({
        messages: chatHistory,
        userLanguage: language,
        isEmergency: isEmergencyTrigger || isEmergencyMode,
        barangay: selectedBarangay,
      });

      const assistantReply: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: data.text || data.fallbackReply || (
          language === 'ceb'
            ? '⚠️ Ang AI assistant adunay temporaryong kabusy o taas nga demand. Kun naa kay dinalian nga emerhensya, palihog tawag dayon sa **ICDRRMO Rescue: (063) 221-8459 / 0997-726-2692 / 0969-233-7878**.'
            : language === 'fil'
            ? '⚠️ Ang AI assistant ay may pansamantalang mataas na demand. Kung mayroon kang agarang emerhensya, mangyaring tumawag agad sa **ICDRRMO Rescue: (063) 221-8459 / 0997-726-2692 / 0969-233-7878**.'
            : '⚠️ The AI assistant is currently experiencing high demand. If you have an urgent emergency, please call **ICDRRMO Rescue Hotline: (063) 221-8459 / 0997-726-2692 / 0969-233-7878** immediately.'
        ),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: data.sources || [
          { name: 'ICDRRMO Official Facebook Page', url: 'https://www.facebook.com/drrmoiligancity' },
          { name: 'Iligan City Government Portal', url: 'https://iligan.gov.ph/' },
        ],
        isEmergency: Boolean(data.fallbackReply),
      };

      setMessages((prev) => [...prev, assistantReply]);

      // If TTS enabled, auto speak
      if (isSpeaking && window.speechSynthesis) {
        speakText(assistantReply.text);
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const responseBody = typeof err.response?.data === 'string'
          ? err.response.data.slice(0, 120)
          : err.response?.data;
        console.error('Error fetching chat response:', {
          status: err.response?.status,
          message: err.message,
          response: responseBody,
        });
      } else {
        console.error('Error fetching chat response:', err);
      }
      const fallbackReply: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: language === 'ceb'
          ? '⚠️ Pasensya, naglisod ang koneksyon sa AI Assistant karon.\n\n**DINALIAN NGA PAHIBALO SA EMERHENSYA:**\nKun anaa ka sa peligro o baha sa Iligan City, palihog tawag dayon sa **ICDRRMO Rescue Hotlines: (063) 221-8459 / 0997-726-2692 / 0969-233-7878** (Official FB: facebook.com/drrmoiligancity).'
          : '⚠️ Unable to connect to DRRM AI server.\n\n**URGENT EMERGENCY ALERT:**\nIf you are in danger or facing flooding in Iligan City, call **ICDRRMO Rescue Hotlines: (063) 221-8459 / 0997-726-2692 / 0969-233-7878** (Official FB: facebook.com/drrmoiligancity) immediately.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isEmergency: true,
      };
      setMessages((prev) => [...prev, fallbackReply]);
    } finally {
      if (isEmergencyTrigger) {
        setIsEmergencyMode(false);
      }
    }
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech Recognition is not supported in this browser version. Please type your message.');
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'ceb' ? 'fil-PH' : language === 'fil' ? 'fil-PH' : 'en-US';
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    // Clean markdown syntax for speech
    const cleanText = text.replace(/[*#_~`-]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === 'ceb' ? 'fil-PH' : language === 'fil' ? 'fil-PH' : 'en-US';
    utterance.rate = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper renderer to render basic markdown formatting
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-1.5 text-sm leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1" />;

          // Check for bold or bullet points
          let formattedLine = line;

          const isHeader = line.startsWith('###') || line.startsWith('##') || line.startsWith('#');
          const isBullet = line.trim().startsWith('*') || line.trim().startsWith('-');

          if (isHeader) {
            return (
              <h4 key={idx} className="font-bold text-amber-800 dark:text-amber-300 text-base mt-2 mb-1">
                {line.replace(/^#+\s*/, '')}
              </h4>
            );
          }

          // Parse **bold** parts
          const parts = formattedLine.split(/(\*\*.*?\*\*)/g);

          return (
            <p key={idx} className={`${isBullet ? 'pl-4 relative font-medium' : ''}`}>
              {isBullet && <span className="absolute left-1 top-0 font-bold text-amber-600 dark:text-amber-400">•</span>}
              {parts.map((part, pIdx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return (
                    <strong key={pIdx} className="font-bold text-slate-950 dark:text-amber-200">
                      {part.slice(2, -2)}
                    </strong>
                  );
                }
                return part;
              })}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl overflow-hidden shadow-lg shadow-slate-200/50 dark:shadow-none my-1 min-h-[620px] transition-colors">
      {/* Top Controls Bar */}
      <div className="bg-slate-50/90 dark:bg-slate-950/80 px-4 md:px-6 py-3 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Barangay Selector */}
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Target Barangay:</span>
          <select
            value={selectedBarangay}
            onChange={(e) => setSelectedBarangay(e.target.value)}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium rounded-xl px-3 py-1.5 focus:border-blue-600 focus:outline-none shadow-2xs"
          >
            <option value="">-- All Barangays (Iligan City) --</option>
            {ILIGAN_BARANGAYS.map((b) => (
              <option key={b.id} value={b.name}>
                Barangay {b.name} ({b.district} District)
              </option>
            ))}
          </select>
        </div>

        {/* Action Shortcuts & Audio Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToHotlines}
            className="bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <span>📞 Hotlines</span>
          </button>
          <button
            onClick={onNavigateToGoBag}
            className="bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <span>🎒 Family Go-Bag</span>
          </button>
          {isSpeaking ? (
            <button
              onClick={stopSpeaking}
              className="bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800 px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1 transition cursor-pointer"
            >
              <VolumeX className="w-3.5 h-3.5" />
              <span>Stop Audio</span>
            </button>
          ) : (
            <button
              onClick={() => setIsSpeaking(true)}
              className="bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1 transition border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs"
              title="Enable voice audio reading"
            >
              <Volume2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Voice Output</span>
            </button>
          )}
        </div>
      </div>

      {/* Emergency Mode Bar */}
      {isEmergencyMode && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-5 py-2.5 text-xs text-red-700 dark:text-red-300 flex items-center justify-between font-sans">
          <div className="flex items-center gap-2 font-semibold animate-pulse">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span>ACTIVE EMERGENCY MODE ENABLED: Responses prioritized for immediate life safety!</span>
          </div>
          <button
            onClick={() => setIsEmergencyMode(false)}
            className="text-xs text-slate-900 dark:text-white underline font-medium cursor-pointer"
          >
            Turn Off
          </button>
        </div>
      )}

      {/* Messages Scroll View */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6 bg-slate-50/50 dark:bg-slate-950/40 min-h-[380px] transition-colors">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} w-full max-w-4xl ${
                isUser ? 'ml-auto' : 'mr-auto'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5 px-1">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 font-mono">
                  {isUser ? 'Resident' : 'DRRM Assistant'}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{msg.timestamp}</span>
                {msg.isEmergency && (
                  <span className="bg-red-600 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
                    EMERGENCY
                  </span>
                )}
              </div>

              <div
                className={`p-5 rounded-2xl relative group transition-all shadow-xs ${
                  isUser
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-tr-xs max-w-[85%] text-sm leading-relaxed shadow-md shadow-blue-500/10'
                    : msg.isEmergency
                    ? 'bg-red-50/90 border border-red-300 text-slate-900 dark:bg-slate-900 dark:border-red-600/60 dark:text-slate-100 rounded-tl-xs max-w-[90%]'
                    : 'bg-white border border-slate-200/90 text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 rounded-tl-xs max-w-[90%]'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-[10px] uppercase tracking-wider font-mono text-slate-500 dark:text-slate-400 font-semibold">
                      Verified DRRM Response
                    </span>
                  </div>
                )}

                {renderFormattedText(msg.text)}

                {/* Sources Footnote for Assistant */}
                {!isUser && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                    <span className="text-[10px] uppercase tracking-wider font-mono text-slate-400 dark:text-slate-500 block mb-1.5 font-semibold">
                      Official Reference Sources:
                    </span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {msg.sources.map((s, idx) => (
                        <a
                          key={idx}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-medium transition"
                        >
                          <ExternalLink className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          <span>{s.name}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Copy Button */}
                {!isUser && (
                  <button
                    onClick={() => copyToClipboard(msg.id, msg.text)}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
                    title="Copy message"
                  >
                    {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 p-4 rounded-2xl max-w-md shadow-xs">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
            <div className="text-xs font-mono uppercase tracking-wider font-semibold">
              Retrieving verified data from CDRRMO, PAGASA & PHIVOLCS...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Chips */}
      <div className="bg-slate-50 dark:bg-slate-900/90 px-3 sm:px-5 py-2.5 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-2 transition-colors">
        <button
          type="button"
          onClick={() => scrollQuickQueries('left')}
          className="shrink-0 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
          title="Scroll quick queries left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div
          ref={quickQueriesRef}
          onWheel={handleWheelQuickQueries}
          className="flex-1 overflow-x-auto scroll-smooth scrollbar-none flex items-center gap-2 py-0.5 max-w-full cursor-grab active:cursor-grabbing"
        >
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-nowrap flex items-center gap-1.5 mr-1 shrink-0 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Quick Queries:
          </span>
          {presetChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(chip.prompt, chip.emergency)}
              className={`text-[11px] font-medium tracking-wide px-3.5 py-1.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 border cursor-pointer shrink-0 ${
                chip.emergency
                  ? 'bg-red-50 hover:bg-red-100 border-red-300 text-red-700 dark:bg-red-950/50 dark:hover:bg-red-900/60 dark:border-red-800 dark:text-red-300 font-semibold shadow-xs'
                  : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-slate-200 shadow-2xs'
              }`}
            >
              <span>{chip.label[language]}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => scrollQuickQueries('right')}
          className="shrink-0 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
          title="Scroll quick queries right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Input Box */}
      <div className="p-4 md:p-5 bg-slate-100/90 dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex flex-col gap-3 transition-colors">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Emergency Mode Toggle */}
          <button
            onClick={() => setIsEmergencyMode(!isEmergencyMode)}
            className={`px-3 py-2.5 rounded-2xl border text-xs font-semibold tracking-wide transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
              isEmergencyMode
                ? 'bg-red-600 text-white border-red-600 font-bold shadow-red-600/20'
                : 'bg-white text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Toggle Urgent Emergency Prompt Mode"
          >
            <ShieldAlert className="w-4 h-4" />
            <span className="hidden sm:inline">Emergency Mode</span>
          </button>

          {/* Voice Mic Button */}
          <button
            onClick={handleVoiceInput}
            className={`p-2.5 rounded-2xl border transition cursor-pointer shadow-xs ${
              isListening
                ? 'bg-red-600 text-white border-red-600 animate-bounce'
                : 'bg-white text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hover:text-blue-600 dark:hover:text-blue-400'
            }`}
            title="Voice Input (Bisaya / Tagalog / English)"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Main Input Container */}
          <div className="flex-1 flex gap-2 sm:gap-3 items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 sm:px-4 py-2 focus-within:border-blue-600 dark:focus-within:border-blue-500 transition-colors shadow-xs">
            <span className="text-blue-600 dark:text-blue-400 text-xs">✦</span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={
                language === 'ceb'
                  ? 'Mangutana bahin sa DRRM sa Iligan City...'
                  : language === 'fil'
                  ? 'Magtanong ukol sa DRRM sa Iligan City...'
                  : 'Ask about DRRM in Iligan City...'
              }
              className="bg-transparent border-none outline-none flex-1 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold rounded-xl cursor-pointer transition flex items-center gap-1.5 shadow-xs shadow-blue-500/20"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-sans">
          <span>
            Official DRRM Info Tool • Hotlines: <strong className="font-mono text-slate-700 dark:text-slate-300"> 221-8459 | 0997-726-2692 | 0969-233-7878</strong>
          </span>
          <span className="font-mono text-[10px] text-slate-400">Gemini 3.6 Flash</span>
        </div>
      </div>
    </div>
  );
};
