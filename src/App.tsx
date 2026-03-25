/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings as SettingsIcon, 
  Plus, 
  X, 
  ChevronLeft, 
  Volume2, 
  RefreshCw,
  BookOpen,
  Home as HomeIcon,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { Word, WordBank, AppSettings } from './types';
import { DEFAULT_BANKS } from './data/defaultWords';

import { GoogleGenAI, Type } from "@google/genai";
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// --- Constants & Helpers ---
const STORAGE_KEY_BANKS = 'word_blind_box_custom_banks';
const STORAGE_KEY_SETTINGS = 'word_blind_box_settings';
const STORAGE_KEY_HISTORY = 'word_blind_box_history';

const COLORS = [
  '#FFB7B2', '#FFDAC1', '#E2F0CB', '#B5EAD7', '#C7CEEA', 
  '#F3D1F4', '#D1E8E2', '#F9D5E5', '#E3E2B4', '#A8E6CF'
];

const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

// --- Components ---

export default function App() {
  const [view, setView] = useState<'home' | 'blind-box' | 'settings' | 'detail'>('home');
  const [customBanks, setCustomBanks] = useState<WordBank[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    currentBankId: 'gaokao',
    noRepeat: true,
    displayDuration: 3,
  });
  const [history, setHistory] = useState<string[]>([]); // Used for no-repeat logic
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [bgColor, setBgColor] = useState('#FFFFFF');

  // Initialize data
  useEffect(() => {
    const savedBanks = localStorage.getItem(STORAGE_KEY_BANKS);
    if (savedBanks) setCustomBanks(JSON.parse(savedBanks));

    const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (savedSettings) setSettings(JSON.parse(savedSettings));

    const savedHistory = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  // Save data
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_BANKS, JSON.stringify(customBanks));
  }, [customBanks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
  }, [history]);

  const allBanks = [...DEFAULT_BANKS, ...customBanks];
  const currentBank = allBanks.find(b => b.id === settings.currentBankId) || DEFAULT_BANKS[0];

  const speak = (text: string) => {
    // Cancel any ongoing speech to prevent mismatch when switching fast
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const pickRandomWord = useCallback(() => {
    let availableWords = currentBank.words;
    
    if (settings.noRepeat && history.length < currentBank.words.length) {
      availableWords = currentBank.words.filter(w => !history.includes(w.word));
    }

    if (availableWords.length === 0) {
      if (settings.noRepeat) {
        setHistory([]); // Reset history if all words used
        availableWords = currentBank.words;
      } else {
        return; // Should not happen
      }
    }

    const word = availableWords[Math.floor(Math.random() * availableWords.length)];
    setCurrentWord(word);
    setBgColor(getRandomColor());
    if (settings.noRepeat) {
      setHistory(prev => [...prev, word.word]);
    }
    
    // Speak
    speak(`${word.word}. ${word.pos}. ${word.meaning}`);
  }, [currentBank, settings, history]);

  const handleStart = () => {
    setView('blind-box');
    pickRandomWord();
  };

  const fetchDetailedDefinition = (word: Word) => {
    // No longer using AI, just navigating to the detail view which will show links
    setView('detail');
  };

  // --- Shake Detection ---
  useEffect(() => {
    let lastX: number | null = null;
    let lastY: number | null = null;
    let lastZ: number | null = null;
    const threshold = 15;

    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc || view !== 'blind-box') return;

      const { x, y, z } = acc;
      if (x === null || y === null || z === null) return;

      if (lastX !== null && lastY !== null && lastZ !== null) {
        const deltaX = Math.abs(lastX - x);
        const deltaY = Math.abs(lastY - y);
        const deltaZ = Math.abs(lastZ - z);

        if ((deltaX > threshold && deltaY > threshold) || (deltaX > threshold && deltaZ > threshold) || (deltaY > threshold && deltaZ > threshold)) {
          pickRandomWord();
        }
      }

      lastX = x;
      lastY = y;
      lastZ = z;
    };

    if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', handleMotion);
    }
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [view, pickRandomWord]);

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900 overflow-hidden flex flex-col max-w-md mx-auto shadow-2xl relative">
      <AnimatePresence mode="wait">
        {view === 'home' && (
          <motion.div 
            key="home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col p-6"
          >
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl font-bold tracking-tight">单词盲盒</h1>
              <button onClick={() => setView('settings')} className="p-2 rounded-full hover:bg-neutral-200 transition-colors">
                <SettingsIcon size={24} />
              </button>
            </div>

            <button 
              onClick={handleStart}
              className="w-full aspect-square rounded-3xl bg-[#FF1493] text-white flex flex-col items-center justify-center shadow-lg active:scale-95 transition-transform mb-8"
            >
              <span className="text-4xl font-black mb-2">START</span>
              <span className="text-sm opacity-80">开启今日盲盒</span>
            </button>

            <div className="space-y-4">
              <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-sm">
                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">当前词库</label>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-lg">{currentBank.name}</span>
                  <button onClick={() => setView('settings')} className="text-[#FF1493] text-sm font-semibold">修改</button>
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">不重复模式</h3>
                  <p className="text-xs text-neutral-500">单词全部出现前不重复</p>
                </div>
                <button 
                  onClick={() => setSettings(s => ({ ...s, noRepeat: !s.noRepeat }))}
                  className={`w-12 h-6 rounded-full transition-colors relative ${settings.noRepeat ? 'bg-[#FF1493]' : 'bg-neutral-300'}`}
                >
                  <motion.div 
                    animate={{ x: settings.noRepeat ? 24 : 4 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                  />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'blind-box' && currentWord && (
          <motion.div 
            key="blind-box"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ backgroundColor: bgColor }}
            className="flex-1 flex flex-col items-center justify-center p-8 transition-colors duration-500"
          >
            <div className="text-center space-y-4">
              <motion.h2 
                key={currentWord.word}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-5xl font-bold tracking-tight"
              >
                {currentWord.word}
              </motion.h2>
              <motion.div 
                key={`${currentWord.word}-meaning`}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-xl text-neutral-800/80 max-w-xs mx-auto"
              >
                <span className="italic font-serif mr-2">{currentWord.pos}</span>
                {currentWord.meaning}
              </motion.div>
            </div>

            <div className="absolute top-8 right-8">
              <button onClick={pickRandomWord} className="p-3 bg-white/20 backdrop-blur-md rounded-full text-neutral-900">
                <RefreshCw size={24} />
              </button>
            </div>

            <div className="absolute bottom-12 text-neutral-500 text-sm animate-pulse">
              摇一摇换个词
            </div>

            {/* Bottom Menu after delay */}
            <DelayedMenu 
              duration={settings.displayDuration} 
              word={currentWord}
              onDetail={() => fetchDetailedDefinition(currentWord)}
              onHome={() => setView('home')}
            />
          </motion.div>
        )}

        {view === 'settings' && (
          <motion.div 
            key="settings"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="flex-1 bg-white flex flex-col"
          >
            <div className="p-6 border-bottom flex items-center gap-4">
              <button onClick={() => setView('home')} className="p-2 -ml-2"><ChevronLeft /></button>
              <h2 className="text-xl font-bold">设置与词库</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <section>
                <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-4">显示时长 (秒)</h3>
                <input 
                  type="range" min="3" max="30" 
                  value={settings.displayDuration}
                  onChange={(e) => setSettings(s => ({ ...s, displayDuration: parseInt(e.target.value) }))}
                  className="w-full accent-[#FF1493]"
                />
                <div className="text-center mt-2 font-mono">{settings.displayDuration}s</div>
              </section>

              <section>
                <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-4">选择词库</h3>
                <div className="grid grid-cols-1 gap-3">
                  {allBanks.map(bank => (
                    <div 
                      key={bank.id}
                      onClick={() => setSettings(s => ({ ...s, currentBankId: bank.id }))}
                      className={`p-4 rounded-2xl border-2 transition-all flex justify-between items-center ${settings.currentBankId === bank.id ? 'border-[#FF1493] bg-[#FF1493]/5' : 'border-neutral-100 bg-neutral-50'}`}
                    >
                      <span className="font-semibold">{bank.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-400">{bank.words.length} 词</span>
                        {bank.isCustom && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setCustomBanks(prev => prev.filter(b => b.id !== bank.id));
                              if (settings.currentBankId === bank.id) setSettings(s => ({ ...s, currentBankId: 'gaokao' }));
                            }}
                            className="p-1 text-red-500"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <AddCustomBank onAdd={(bank) => setCustomBanks(prev => [...prev, bank])} />
            </div>
          </motion.div>
        )}

        {view === 'detail' && (
          <motion.div 
            key="detail"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="flex-1 bg-neutral-50 flex flex-col"
          >
            <div className="p-6 bg-white border-b flex items-center justify-between sticky top-0 z-10">
              <button onClick={() => setView('blind-box')} className="p-2 -ml-2 text-neutral-500"><ChevronLeft /></button>
              <h2 className="text-xl font-bold">词典查询</h2>
              <div className="w-10" />
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-neutral-100 text-center">
                <h3 className="text-4xl font-black text-[#FF1493] mb-2">{currentWord?.word}</h3>
                <p className="text-xl text-neutral-500 mb-6">{currentWord?.pos}. {currentWord?.meaning}</p>
                
                <div className="space-y-4">
                  <p className="text-sm text-neutral-400">选择你信任的词典查看详细解析：</p>
                  
                  <a 
                    href={`https://dict.youdao.com/w/eng/${encodeURIComponent(currentWord?.word || '')}#keyfrom=dict2.index`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-[#FF1493]/5 border border-[#FF1493]/20 rounded-2xl text-[#FF1493] font-bold hover:bg-[#FF1493]/10 transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <BookOpen size={20} /> 有道词典 (推荐)
                    </span>
                    <ExternalLink size={18} />
                  </a>

                  <a 
                    href={`https://dictionary.cambridge.org/zhs/搜索/英语-汉语-简体/?q=${encodeURIComponent(currentWord?.word || '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-2xl text-blue-600 font-bold hover:bg-blue-100 transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <BookOpen size={20} /> 剑桥词典 (权威)
                    </span>
                    <ExternalLink size={18} />
                  </a>

                  <a 
                    href={`https://www.bing.com/dict/search?q=${encodeURIComponent(currentWord?.word || '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-neutral-100 border border-neutral-200 rounded-2xl text-neutral-600 font-bold hover:bg-neutral-200 transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <BookOpen size={20} /> 必应词典
                    </span>
                    <ExternalLink size={18} />
                  </a>
                </div>
              </div>

              <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                <h4 className="text-blue-800 font-bold mb-2 flex items-center gap-2">
                  🚀 为什么要查词典？
                </h4>
                <p className="text-blue-700 text-sm leading-relaxed">
                  通过权威词典，你可以看到更地道的例句、词源故事以及同义词辨析。这能帮你更全面地掌握单词用法，而不仅仅是记住一个中文意思。
                </p>
              </div>
            </div>
            
            <div className="p-6 bg-white/80 backdrop-blur-xl border-t">
              <button 
                onClick={() => setView('home')}
                className="w-full py-4 bg-neutral-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-black/10"
              >
                <HomeIcon size={20} /> 返回主页
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DelayedMenu({ duration, onDetail, onHome, word }: { duration: number, onDetail: () => void, onHome: () => void, word: Word }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    const timer = setTimeout(() => setVisible(true), duration * 1000);
    return () => clearTimeout(timer);
  }, [duration, word]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          className="absolute bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl rounded-t-[32px] shadow-2xl border-t border-white/20"
        >
          <div className="flex flex-col gap-3">
            <button 
              onClick={onDetail}
              className="w-full py-4 bg-[#FF1493] text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#FF1493]/20"
            >
              <BookOpen size={20} /> 查看具体释义
            </button>
            <button 
              onClick={onHome}
              className="w-full py-4 bg-white border border-neutral-200 rounded-2xl font-bold flex items-center justify-center gap-2"
            >
              <HomeIcon size={20} /> 回到主页
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function AddCustomBank({ onAdd }: { onAdd: (bank: WordBank) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [rawWords, setRawWords] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [useAi, setUseAi] = useState(true);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }

      if (useAi) {
        // Use Gemini to extract words from text
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `从以下文本中提取出重要的英语生词，并为每个单词提供词性(pos)和中文释义(meaning)。
          文本内容: ${fullText.substring(0, 10000)}
          
          请以JSON数组格式返回，每个对象包含: word, pos, meaning。`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  pos: { type: Type.STRING },
                  meaning: { type: Type.STRING }
                },
                required: ["word", "pos", "meaning"]
              }
            }
          }
        });

        const extractedWords = JSON.parse(response.text);
        if (Array.isArray(extractedWords)) {
          const formatted = extractedWords.map(w => `${w.word} ${w.pos} ${w.meaning}`).join('\n');
          setRawWords(prev => prev ? prev + '\n' + formatted : formatted);
        }
      } else {
        // Simple extraction: Match English words and Chinese on the same line
        const lines = fullText.split('\n');
        const extracted: string[] = [];
        
        lines.forEach(line => {
          const engMatch = line.match(/[a-zA-Z]{3,}/);
          const chiMatch = line.match(/[\u4e00-\u9fa5]+/);
          
          if (engMatch) {
            const word = engMatch[0].toLowerCase();
            const meaning = chiMatch ? chiMatch[0] : '[待补全]';
            extracted.push(`${word} n. ${meaning}`);
          }
        });

        const unique = Array.from(new Set(extracted)).slice(0, 100);
        setRawWords(prev => prev ? prev + '\n' + unique.join('\n') : unique.join('\n'));
      }
      
      if (!name) setName(file.name.replace('.pdf', ''));
    } catch (error) {
      console.error('PDF processing error:', error);
      alert('PDF解析失败，请尝试手动输入或检查网络。');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAdd = () => {
    if (!name || !rawWords) return;
    
    const words: Word[] = rawWords.split('\n').map(line => {
      const parts = line.split(/[,，\s]+/);
      return {
        word: parts[0] || '',
        pos: parts[1] || 'n.',
        meaning: parts.slice(2).join(' ') || '未知释义'
      };
    }).filter(w => w.word);

    onAdd({
      id: Date.now().toString(),
      name,
      words,
      isCustom: true
    });

    setName('');
    setRawWords('');
    setIsOpen(false);
  };

  return (
    <section>
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full py-4 border-2 border-dashed border-neutral-200 rounded-2xl text-neutral-400 font-bold flex items-center justify-center gap-2 hover:border-[#FF1493] hover:text-[#FF1493] transition-colors"
      >
        <Plus size={20} /> 添加自定义词库
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">新建词库</h3>
                <button onClick={() => setIsOpen(false)}><X /></button>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs text-blue-700 font-bold uppercase tracking-wider">✨ PDF 单词提取</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-blue-600">AI 翻译</span>
                      <button 
                        onClick={() => setUseAi(!useAi)}
                        className={`w-8 h-4 rounded-full transition-colors relative ${useAi ? 'bg-blue-500' : 'bg-neutral-300'}`}
                      >
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${useAi ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-blue-400 mb-3 leading-tight">
                    {useAi ? "AI 模式：自动识别生词并翻译（最智能，需联网）" : "极简模式：提取单词及同行中文（无需联网，保护隐私）"}
                  </p>
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-blue-300 rounded-xl cursor-pointer hover:bg-blue-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {isProcessing ? (
                        <RefreshCw className="animate-spin text-blue-500" />
                      ) : (
                        <>
                          <Plus className="text-blue-500 mb-1" />
                          <p className="text-xs text-blue-600">点击上传 PDF 自动提取单词</p>
                        </>
                      )}
                    </div>
                    <input type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} disabled={isProcessing} />
                  </label>
                </div>

                <input 
                  placeholder="词库名称 (如: 我的生词本)"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full p-4 bg-neutral-100 rounded-xl outline-none focus:ring-2 ring-[#FF1493]"
                />

                <textarea 
                  placeholder="输入单词，格式: 单词 词性 意思 (每行一个)&#10;例如: apple n. 苹果"
                  rows={6}
                  value={rawWords}
                  onChange={e => setRawWords(e.target.value)}
                  className="w-full p-4 bg-neutral-100 rounded-xl outline-none focus:ring-2 ring-[#FF1493] resize-none"
                />
              </div>

              <button 
                onClick={handleAdd}
                className="w-full py-4 bg-[#FF1493] text-white rounded-xl font-bold"
              >
                确认添加
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
