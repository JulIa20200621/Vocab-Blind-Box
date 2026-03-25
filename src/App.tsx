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
import { Word, WordBank, AppSettings, DailyProgress, UserProfile } from './types';
import { DEFAULT_BANKS } from './data/defaultWords';

import { GoogleGenAI, Type } from "@google/genai";
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// --- Constants & Helpers ---
const STORAGE_KEY_BANKS = 'word_blind_box_custom_banks';
const STORAGE_KEY_SETTINGS = 'word_blind_box_settings';
const STORAGE_KEY_HISTORY = 'word_blind_box_history';
const STORAGE_KEY_PROGRESS = 'word_blind_box_progress';
const STORAGE_KEY_USER = 'word_blind_box_user';

const COLORS = [
  '#FFB7B2', '#FFDAC1', '#E2F0CB', '#B5EAD7', '#C7CEEA', 
  '#F3D1F4', '#D1E8E2', '#F9D5E5', '#E3E2B4', '#A8E6CF'
];

const COLOR_THEMES = {
  warm: ['#FFB7B2', '#FFDAC1', '#F9D5E5', '#FFD1DC', '#FFE4E1'],
  cool: ['#C7CEEA', '#B5EAD7', '#D1E8E2', '#E0F7FA', '#E1F5FE'],
  nature: ['#E2F0CB', '#B5EAD7', '#A8E6CF', '#DCEDC1', '#F1F8E9'],
  dark: ['#2C3E50', '#34495E', '#212121', '#37474F', '#455A64'],
};

const NEUTRAL_COLORS = ['#000000', '#333333', '#666666', '#999999'];

const WORD_FIXED_PALETTE = [
  { high: '#000000', low: '#666666', name: '黑灰' },
  { high: '#999999', low: '#CCCCCC', name: '浅灰' },
  { high: '#E63946', low: '#FAD2E1', name: '红' },
  { high: '#007AFF', low: '#BDE0FE', name: '蓝' },
  { high: '#34C759', low: '#D8F3DC', name: '绿' },
  { high: '#FFD60A', low: '#FFF3B0', name: '黄' },
  { high: '#AF52DE', low: '#E0BBE4', name: '紫' },
  { high: '#FF9500', low: '#FFD8A8', name: '橙' },
];

const BG_FIXED_PALETTE = [
  { color: '#FFFFFF', name: '纯白' },
  { color: '#FDFCF8', name: '米白' },
  { color: '#F5F5F5', name: '浅灰' },
  { color: '#FFF0F5', name: '淡粉' },
  { color: '#F0F8FF', name: '淡蓝' },
  { color: '#F5F5DC', name: '米黄' },
  { color: '#1A1A1B', name: '深黑' },
  { color: '#2C3E50', name: '深蓝' },
  { color: '#34495E', name: '灰蓝' },
  { color: '#121212', name: '极黑' },
  { color: '#1E1E1E', name: '炭黑' },
  { color: '#212121', name: '哑黑' },
];

const MOODS = [
  { emoji: '😊', label: '开心', color: '#FFD700' },
  { emoji: '😎', label: '自信', color: '#4CAF50' },
  { emoji: '🤔', label: '思考', color: '#2196F3' },
  { emoji: '😴', label: '困倦', color: '#9C27B0' },
  { emoji: '😫', label: '疲惫', color: '#FF5722' },
  { emoji: '😤', label: '奋斗', color: '#F44336' },
];

const getRandomColor = (palette: string[]) => palette[Math.floor(Math.random() * palette.length)];

// --- Components ---

const Calendar = ({ progress, onDayClick }: { progress: DailyProgress[], onDayClick: (day: DailyProgress) => void }) => {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
    return progress.find(p => p.date === dateStr) || { date: dateStr, wordCount: 0, timeSpent: 0 };
  });

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-100">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">{now.getFullYear()}年{now.getMonth() + 1}月</h3>
        <div className="flex gap-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-neutral-100 border border-neutral-900"></div>
            <span className="text-[10px] text-neutral-400">未打卡</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {['日', '一', '二', '三', '四', '五', '六'].map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-neutral-300 py-1">{d}</div>
        ))}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
        {days.map(day => {
          const hasData = day.wordCount > 0;
          return (
            <button
              key={day.date}
              onClick={() => onDayClick(day as DailyProgress)}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all relative ${
                hasData 
                  ? 'ring-2 ring-offset-1 ring-neutral-100' 
                  : 'bg-neutral-100 border border-neutral-300'
              }`}
              style={{ backgroundColor: (day as DailyProgress).moodColor || 'transparent' }}
            >
              <span className={`text-[10px] font-bold ${hasData ? 'text-white drop-shadow-sm' : 'text-neutral-400'}`}>
                {parseInt(day.date.split('-')[2])}
              </span>
              {hasData && (day as DailyProgress).mood && (
                <span className="text-xs">{(day as DailyProgress).mood}</span>
              )}
              {!hasData && (
                <div className="absolute inset-0 border border-black/20 rounded-xl pointer-events-none"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState<'home' | 'blind-box' | 'settings' | 'detail' | 'mood-prompt' | 'completion'>('home');
  const [customBanks, setCustomBanks] = useState<WordBank[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    currentBankId: 'gaokao',
    noRepeat: true,
    displayDuration: 3,
    volume: 1,
    brightness: 100,
    wordColorMode: 'fixed',
    wordFixedColor: '#000000',
    wordCustomColors: [],
    bgColorMode: 'dopamine',
    bgFixedColor: '#FFFFFF',
    bgTheme: 'warm',
    bgCustomColors: [],
    dailyGoal: 'mood',
  });
  const [history, setHistory] = useState<string[]>([]); // Used for no-repeat logic
  const [progress, setProgress] = useState<DailyProgress[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [wordColor, setWordColor] = useState('#000000');
  
  // Session tracking
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [sessionWordCount, setSessionWordCount] = useState<number>(0);
  const [selectedDay, setSelectedDay] = useState<DailyProgress | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Initialize data
  useEffect(() => {
    const savedBanks = localStorage.getItem(STORAGE_KEY_BANKS);
    if (savedBanks) setCustomBanks(JSON.parse(savedBanks));

    const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(prev => ({ ...prev, ...parsed }));
    }

    const savedHistory = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    const savedProgress = localStorage.getItem(STORAGE_KEY_PROGRESS);
    if (savedProgress) setProgress(JSON.parse(savedProgress));

    const savedUser = localStorage.getItem(STORAGE_KEY_USER);
    if (savedUser) setUser(JSON.parse(savedUser));
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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(progress));
  }, [progress]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  }, [user]);

  const allBanks = [...DEFAULT_BANKS, ...customBanks];
  const currentBank = allBanks.find(b => b.id === settings.currentBankId) || DEFAULT_BANKS[0];

  const speak = (text: string) => {
    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      // Ensure volume is a valid number between 0 and 1
      const vol = typeof settings.volume === 'number' ? settings.volume : 1;
      utterance.volume = Math.max(0, Math.min(1, vol));
      
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error('Speech synthesis error:', e);
    }
  };

  const pickRandomWord = useCallback(() => {
    let availableWords = currentBank.words;
    
    // Check if all words in bank are finished
    if (settings.noRepeat && history.length >= currentBank.words.length) {
      setView('completion');
      return;
    }

    if (settings.noRepeat && history.length < currentBank.words.length) {
      availableWords = currentBank.words.filter(w => !history.includes(w.word));
    }

    if (availableWords.length === 0) {
      if (settings.noRepeat) {
        setView('completion');
        return;
      } else {
        availableWords = currentBank.words;
      }
    }

    // Check daily goal
    if (settings.dailyGoal !== 'mood' && sessionWordCount >= (settings.dailyGoal as number)) {
      handleEndSession();
      return;
    }

    const word = availableWords[Math.floor(Math.random() * availableWords.length)];
    setCurrentWord(word);
    setSessionWordCount(prev => prev + 1);
    
    // Set Word Color
    if (settings.wordColorMode === 'fixed') {
      setWordColor(settings.wordFixedColor);
    } else if (settings.wordColorMode === 'neutral') {
      setWordColor(getRandomColor(NEUTRAL_COLORS));
    } else if (settings.wordColorMode === 'custom' && settings.wordCustomColors.length > 0) {
      setWordColor(getRandomColor(settings.wordCustomColors));
    } else {
      setWordColor(getRandomColor(COLORS));
    }

    // Set Background Color
    if (settings.bgColorMode === 'dopamine') {
      setBgColor(getRandomColor(COLORS));
    } else if (settings.bgColorMode === 'fixed') {
      setBgColor(settings.bgFixedColor);
    } else if (settings.bgColorMode === 'theme') {
      setBgColor(getRandomColor(COLOR_THEMES[settings.bgTheme]));
    } else if (settings.bgColorMode === 'custom' && settings.bgCustomColors.length > 0) {
      setBgColor(getRandomColor(settings.bgCustomColors));
    } else {
      setBgColor('#FFFFFF');
    }

    if (settings.noRepeat) {
      setHistory(prev => [...prev, word.word]);
    }
    
    // Speak
    speak(`${word.word}. ${word.pos}. ${word.meaning}`);
  }, [currentBank, settings, history]);

  const handleStart = () => {
    setSessionStartTime(Date.now());
    setSessionWordCount(0);
    setView('blind-box');
    pickRandomWord();
  };

  const handleEndSession = () => {
    setView('mood-prompt');
  };

  const saveSession = (mood?: { emoji: string, label: string, color: string }, note?: string) => {
    const duration = Math.floor((Date.now() - sessionStartTime) / 1000);
    const today = new Date().toISOString().split('T')[0];
    
    setProgress(prev => {
      const existing = prev.find(p => p.date === today);
      if (existing) {
        return prev.map(p => p.date === today ? {
          ...p,
          wordCount: p.wordCount + sessionWordCount,
          timeSpent: p.timeSpent + duration,
          mood: mood?.emoji || p.mood,
          moodColor: mood?.color || p.moodColor,
          note: note || p.note
        } : p);
      }
      return [...prev, {
        date: today,
        wordCount: sessionWordCount,
        timeSpent: duration,
        mood: mood?.emoji,
        moodColor: mood?.color,
        note
      }];
    });
    
    setView('home');
    setShowExitConfirm(false);
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
      {/* Brightness Overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-[9999] bg-black" 
        style={{ opacity: (100 - settings.brightness) / 100 * 0.8 }}
      />
      <AnimatePresence mode="wait">
        {view === 'home' && (
          <motion.div 
            key="home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col p-6 overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-8">
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold tracking-tight">单词盲盒</h1>
                <p className="text-[10px] text-neutral-400 font-medium">让每个人都能爱上背单词 ✨</p>
              </div>
              <button onClick={() => setView('settings')} className="p-2 rounded-full hover:bg-neutral-200 transition-colors">
                <SettingsIcon size={24} />
              </button>
            </div>

            <button 
              onClick={handleStart}
              className="w-full aspect-square rounded-3xl bg-[#FF1493] text-white flex flex-col items-center justify-center shadow-lg active:scale-95 transition-transform mb-8 shrink-0"
            >
              <span className="text-4xl font-black mb-2">START</span>
              <span className="text-sm opacity-80">开启今日盲盒</span>
            </button>

            <div className="space-y-6 mb-8">
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

            <Calendar 
              progress={progress} 
              onDayClick={(day) => {
                if (day.wordCount > 0) setSelectedDay(day);
              }} 
            />

            {selectedDay && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
                onClick={() => setSelectedDay(null)}
              >
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  className="bg-white w-full max-w-sm rounded-[40px] p-10 space-y-8 relative overflow-hidden"
                  onClick={e => e.stopPropagation()}
                >
                  {/* Background Decoration */}
                  <div className="absolute top-0 left-0 w-full h-24 opacity-10" style={{ backgroundColor: selectedDay.moodColor || '#FF1493' }}></div>
                  
                  <button onClick={() => setSelectedDay(null)} className="absolute top-6 right-6 p-2 bg-neutral-100 rounded-full text-neutral-400 hover:text-neutral-900 transition-colors">
                    <X size={20} />
                  </button>

                  <div className="text-center relative pt-4">
                    <div className="text-6xl mb-4 drop-shadow-lg">{selectedDay.mood || '📝'}</div>
                    <h3 className="text-2xl font-black tracking-tight">{selectedDay.date}</h3>
                    <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest mt-1">学习成就报告</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-neutral-50 p-6 rounded-[32px] text-center border border-neutral-100">
                      <div className="text-3xl font-black text-[#FF1493] mb-1">{selectedDay.wordCount}</div>
                      <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">已拆盲盒</div>
                    </div>
                    <div className="bg-neutral-50 p-6 rounded-[32px] text-center border border-neutral-100">
                      <div className="text-3xl font-black text-[#FF1493] mb-1">{Math.floor(selectedDay.timeSpent / 60)}<span className="text-sm">m</span></div>
                      <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">专注时长</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                      <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">平均效率</span>
                      <span className="text-sm font-bold">约 {selectedDay.wordCount > 0 ? (selectedDay.timeSpent / selectedDay.wordCount).toFixed(1) : 0} 秒/词</span>
                    </div>
                    
                    <div className="p-6 bg-neutral-50 rounded-[32px] border border-neutral-100 relative">
                      <label className="absolute -top-2 left-6 px-2 bg-white text-[10px] font-bold text-neutral-400 uppercase tracking-widest">今日感悟</label>
                      {selectedDay.date === new Date().toISOString().split('T')[0] ? (
                        <div className="space-y-3">
                          <textarea 
                            defaultValue={selectedDay.note}
                            id="edit-note"
                            className="w-full bg-transparent border-none focus:ring-0 text-sm text-neutral-700 leading-relaxed italic resize-none p-0 h-20"
                            placeholder="点击这里修改你的感悟..."
                          />
                          <button 
                            onClick={() => {
                              const newNote = (document.getElementById('edit-note') as HTMLTextAreaElement)?.value;
                              setProgress(prev => prev.map(p => p.date === selectedDay.date ? { ...p, note: newNote } : p));
                              setSelectedDay(prev => prev ? { ...prev, note: newNote } : null);
                            }}
                            className="text-[10px] font-bold text-[#FF1493] uppercase tracking-widest float-right"
                          >
                            保存修改
                          </button>
                        </div>
                      ) : (
                        <p className="text-neutral-700 leading-relaxed italic">
                          {selectedDay.note ? `"${selectedDay.note}"` : "今天没有留下文字，但努力已经刻在心里 ✨"}
                        </p>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={() => setSelectedDay(null)}
                    className="w-full py-5 bg-neutral-900 text-white rounded-2xl font-bold shadow-xl active:scale-95 transition-transform"
                  >
                    太棒了，继续加油
                  </button>
                </motion.div>
              </motion.div>
            )}
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
                style={{ color: wordColor }}
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

            <div className="absolute top-8 right-8 flex gap-2">
              <button 
                onClick={() => speak(`${currentWord.word}. ${currentWord.pos}. ${currentWord.meaning}`)} 
                className="p-3 bg-white/20 backdrop-blur-md rounded-full text-neutral-900"
              >
                <Volume2 size={24} />
              </button>
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
              onHome={() => setShowExitConfirm(true)}
            />

            {showExitConfirm && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
              >
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  className="bg-white w-full max-w-xs rounded-[32px] p-8 space-y-6"
                >
                  <div className="text-center">
                    <h3 className="text-xl font-bold mb-2">结束盲盒时间？</h3>
                    <p className="text-sm text-neutral-400">记录下你现在的心情吧 ✨</p>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowExitConfirm(false)}
                      className="flex-1 py-4 bg-neutral-100 rounded-2xl font-bold"
                    >
                      继续背
                    </button>
                    <button 
                      onClick={handleEndSession}
                      className="flex-1 py-4 bg-[#FF1493] text-white rounded-2xl font-bold"
                    >
                      结束
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        )}

        {view === 'mood-prompt' && (
          <motion.div 
            key="mood-prompt"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col p-8 bg-white"
          >
            <div className="flex-1 flex flex-col justify-center space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-black mb-2">今天心情如何？</h2>
                <p className="text-neutral-400">选一个代表你现在的状态</p>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                {MOODS.map(m => (
                  <button
                    key={m.label}
                    onClick={() => {
                      const note = (document.getElementById('session-note') as HTMLTextAreaElement)?.value;
                      saveSession(m, note);
                    }}
                    className="aspect-square rounded-3xl bg-neutral-50 flex flex-col items-center justify-center gap-2 hover:bg-neutral-100 transition-colors active:scale-95"
                  >
                    <span className="text-3xl">{m.emoji}</span>
                    <span className="text-[10px] font-bold text-neutral-400">{m.label}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">写点什么 (可选)</label>
                <textarea 
                  placeholder="记录下此刻的想法..."
                  className="w-full p-4 bg-neutral-50 rounded-2xl border-none focus:ring-2 focus:ring-[#FF1493]/20 h-24 resize-none"
                  onBlur={(e) => {
                    // We'll save this when they pick a mood
                  }}
                  id="session-note"
                />
              </div>
            </div>
            
            <button 
              onClick={() => {
                const note = (document.getElementById('session-note') as HTMLTextAreaElement)?.value;
                saveSession(undefined, note);
              }}
              className="w-full py-5 bg-neutral-900 text-white rounded-2xl font-bold shadow-xl"
            >
              直接跳过
            </button>
          </motion.div>
        )}

        {view === 'completion' && (
          <motion.div 
            key="completion"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center p-8 bg-[#FF1493] text-white text-center"
          >
            <motion.div
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              className="text-8xl mb-8"
            >
              🏆
            </motion.div>
            <h2 className="text-3xl font-black mb-4">恭喜你！</h2>
            <p className="text-lg opacity-90 mb-8">
              你已经成功学完了 <span className="font-black underline">{currentBank.name}</span> 的所有词汇！
            </p>
            <div className="bg-white/20 backdrop-blur-md p-6 rounded-3xl mb-8 w-full">
              <div className="text-sm opacity-80 mb-1">总计背诵</div>
              <div className="text-4xl font-black">{currentBank.words.length} 词</div>
            </div>
            <button 
              onClick={() => {
                setHistory([]);
                setView('home');
              }}
              className="w-full py-5 bg-white text-[#FF1493] rounded-2xl font-bold shadow-xl active:scale-95 transition-transform"
            >
              太棒了，回到首页
            </button>
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
            <div className="p-6 border-b flex items-center gap-4">
              <button onClick={() => setView('home')} className="p-2 -ml-2"><ChevronLeft /></button>
              <h2 className="text-xl font-bold">设置与词库</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* User Account Placeholder */}
              <section className="bg-neutral-50 p-6 rounded-[32px] border border-neutral-100">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-neutral-200 rounded-full flex items-center justify-center text-neutral-400">
                    <HomeIcon size={32} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{user?.name || '游客用户'}</h3>
                    <p className="text-xs text-neutral-400">登录同步你的学习进度</p>
                  </div>
                </div>
                <button className="w-full py-3 bg-neutral-900 text-white rounded-2xl font-bold text-sm opacity-50 cursor-not-allowed">
                  账号管理 (即将上线)
                </button>
              </section>

              <section className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-4">每日盲盒目标</h3>
                  <div className="flex gap-2 mb-4">
                    {[
                      { id: 10, label: '10个' },
                      { id: 20, label: '20个' },
                      { id: 50, label: '50个' },
                      { id: 'mood', label: '看心情' }
                    ].map(goal => (
                      <button 
                        key={goal.id}
                        onClick={() => setSettings(s => ({ ...s, dailyGoal: goal.id as any }))}
                        className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${settings.dailyGoal === goal.id ? 'bg-[#FF1493] text-white' : 'bg-neutral-100 text-neutral-500'}`}
                      >
                        {goal.label}
                      </button>
                    ))}
                  </div>
                  {typeof settings.dailyGoal === 'number' && (
                    <div className="space-y-2">
                      <input 
                        type="range" min="5" max="100" step="5"
                        value={settings.dailyGoal as number}
                        onChange={(e) => setSettings(s => ({ ...s, dailyGoal: parseInt(e.target.value) }))}
                        className="w-full accent-[#FF1493]"
                      />
                      <div className="text-center text-xs font-mono text-neutral-400">自定义目标: {settings.dailyGoal}个</div>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-4">显示时长 (秒)</h3>
                  <input 
                    type="range" min="3" max="30" 
                    value={settings.displayDuration}
                    onChange={(e) => setSettings(s => ({ ...s, displayDuration: parseInt(e.target.value) }))}
                    className="w-full accent-[#FF1493]"
                  />
                  <div className="text-center mt-2 font-mono">{settings.displayDuration}s</div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest">朗读音量</h3>
                    <span className="text-xs font-mono">{Math.round(settings.volume * 100)}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="1" step="0.1" 
                    value={settings.volume}
                    onChange={(e) => setSettings(s => ({ ...s, volume: parseFloat(e.target.value) }))}
                    className="w-full accent-[#FF1493]"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest">模拟亮度</h3>
                    <span className="text-xs font-mono">{settings.brightness}%</span>
                  </div>
                  <input 
                    type="range" min="20" max="100" step="5" 
                    value={settings.brightness}
                    onChange={(e) => setSettings(s => ({ ...s, brightness: parseInt(e.target.value) }))}
                    className="w-full accent-[#FF1493]"
                  />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-4">单词显示颜色</h3>
                  <div className="flex gap-1 mb-4">
                    {[
                      { id: 'dopamine', label: '随机多巴胺' },
                      { id: 'neutral', label: '随机黑白灰' },
                      { id: 'fixed', label: '固定色' },
                      { id: 'custom', label: '自定义' }
                    ].map(mode => (
                      <button 
                        key={mode.id}
                        onClick={() => setSettings(s => ({ ...s, wordColorMode: mode.id as any }))}
                        className={`flex-1 py-3 rounded-xl font-bold text-[9px] transition-all ${settings.wordColorMode === mode.id ? 'bg-[#FF1493] text-white' : 'bg-neutral-100 text-neutral-500'}`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                  
                  {settings.wordColorMode === 'fixed' && (
                    <div className="space-y-2">
                      {WORD_FIXED_PALETTE.map(p => (
                        <div key={p.name} className="flex items-center gap-3">
                          <span className="text-[10px] text-neutral-400 w-4">{p.name}</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSettings(s => ({ ...s, wordFixedColor: p.high }))}
                              className={`w-8 h-8 rounded-full border-2 transition-transform ${settings.wordFixedColor === p.high ? 'scale-110 border-neutral-900' : 'border-transparent'}`}
                              style={{ backgroundColor: p.high }}
                            />
                            <button
                              onClick={() => setSettings(s => ({ ...s, wordFixedColor: p.low }))}
                              className={`w-8 h-8 rounded-full border-2 transition-transform ${settings.wordFixedColor === p.low ? 'scale-110 border-neutral-900' : 'border-transparent'}`}
                              style={{ backgroundColor: p.low }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {settings.wordColorMode === 'custom' && (
                    <div className="space-y-3">
                      <p className="text-[10px] text-neutral-400">最多选3个颜色 (已选: {settings.wordCustomColors.length}/3)</p>
                      <div className="flex flex-wrap gap-2">
                        {[...COLORS, ...NEUTRAL_COLORS].map(color => {
                          const isSelected = settings.wordCustomColors.includes(color);
                          return (
                            <button
                              key={color}
                              onClick={() => {
                                setSettings(s => {
                                  if (isSelected) return { ...s, wordCustomColors: s.wordCustomColors.filter(c => c !== color) };
                                  if (s.wordCustomColors.length >= 3) return s;
                                  return { ...s, wordCustomColors: [...s.wordCustomColors, color] };
                                });
                              }}
                              className={`w-8 h-8 rounded-full border-2 transition-all ${isSelected ? 'scale-110 border-neutral-900 ring-2 ring-neutral-900/10' : 'border-transparent opacity-60'}`}
                              style={{ backgroundColor: color }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-4">背景显示模式</h3>
                  <div className="flex gap-1 mb-4">
                    {[
                      { id: 'dopamine', label: '随机多巴胺' },
                      { id: 'theme', label: '特定色系' },
                      { id: 'fixed', label: '固定纯色' },
                      { id: 'custom', label: '自定义' }
                    ].map(mode => (
                      <button 
                        key={mode.id}
                        onClick={() => setSettings(s => ({ ...s, bgColorMode: mode.id as any }))}
                        className={`flex-1 py-3 rounded-xl font-bold text-[9px] transition-all ${settings.bgColorMode === mode.id ? 'bg-[#FF1493] text-white' : 'bg-neutral-100 text-neutral-500'}`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>

                  {settings.bgColorMode === 'theme' && (
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'warm', label: '暖色调', color: '#FFB7B2' },
                        { id: 'cool', label: '冷色调', color: '#C7CEEA' },
                        { id: 'nature', label: '自然色', color: '#E2F0CB' },
                        { id: 'dark', label: '深色调', color: '#2C3E50' }
                      ].map(theme => (
                        <button
                          key={theme.id}
                          onClick={() => setSettings(s => ({ ...s, bgTheme: theme.id as any }))}
                          className={`py-2 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${settings.bgTheme === theme.id ? 'border-neutral-900 bg-neutral-50' : 'border-transparent bg-neutral-100'}`}
                        >
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.color }} />
                          <span className="text-xs font-medium">{theme.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {settings.bgColorMode === 'fixed' && (
                    <div className="grid grid-cols-6 gap-2 px-1">
                      {BG_FIXED_PALETTE.map(c => (
                        <button
                          key={c.color}
                          onClick={() => setSettings(s => ({ ...s, bgFixedColor: c.color }))}
                          className={`w-full aspect-square rounded-full border-2 transition-transform ${settings.bgFixedColor === c.color ? 'scale-110 border-neutral-900' : 'border-transparent'}`}
                          style={{ backgroundColor: c.color }}
                          title={c.name}
                        />
                      ))}
                    </div>
                  )}

                  {settings.bgColorMode === 'custom' && (
                    <div className="space-y-3">
                      <p className="text-[10px] text-neutral-400">最多选5个颜色 (已选: {settings.bgCustomColors.length}/5)</p>
                      <div className="flex flex-wrap gap-2">
                        {[...COLORS, ...BG_FIXED_PALETTE.map(p => p.color)].map(color => {
                          const isSelected = settings.bgCustomColors.includes(color);
                          return (
                            <button
                              key={color}
                              onClick={() => {
                                setSettings(s => {
                                  if (isSelected) return { ...s, bgCustomColors: s.bgCustomColors.filter(c => c !== color) };
                                  if (s.bgCustomColors.length >= 5) return s;
                                  return { ...s, bgCustomColors: [...s.bgCustomColors, color] };
                                });
                              }}
                              className={`w-8 h-8 rounded-full border-2 transition-all ${isSelected ? 'scale-110 border-neutral-900 ring-2 ring-neutral-900/10' : 'border-transparent opacity-60'}`}
                              style={{ backgroundColor: color }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
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
              <X size={20} /> 是否结束盲盒时间？
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
