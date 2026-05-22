import React, { useState, useEffect, useRef } from 'react';
import { db, type Question } from '../db';
import { getWeightedRandomSample } from '../utils/weight';
import { useNavigate } from 'react-router-dom';

const PracticeMode: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [autoNextTimer, setAutoNextTimer] = useState<number | null>(null);
  const timerRef = useRef<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadQuestions = async () => {
      const sampled = await getWeightedRandomSample(25);
      setQuestions(sampled);
    };
    loadQuestions();
  }, []);

  const handleSelect = async (opt: string) => {
    if (selectedOption) return;
    
    const q = questions[currentIndex];
    const correct = opt === q.answer;
    setSelectedOption(opt);
    setShowExplanation(true);

    // Update progress
    const progress = await db.progress.get(q.id!);
    if (progress) {
      await db.progress.update(q.id!, {
        correctCount: progress.correctCount + (correct ? 1 : 0),
        wrongCount: progress.wrongCount + (correct ? 0 : 1)
      });
    } else {
      await db.progress.add({
        id: q.id!,
        correctCount: correct ? 1 : 0,
        wrongCount: correct ? 0 : 1
      });
    }

    if (correct) {
      // Auto next in 1.5s
      let count = 15;
      const interval = setInterval(() => {
        count -= 1;
        setAutoNextTimer(count);
        if (count <= 0) {
          clearInterval(interval);
          handleNext();
        }
      }, 100);
      timerRef.current = interval;
    }
  };

  const handleNext = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setAutoNextTimer(null);
    
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      alert('練習結束！');
      navigate('/');
    }
  };

  const cancelAutoNext = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      setAutoNextTimer(null);
    }
  };

  const callGemini = () => {
    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) {
      alert('請先在設定頁面輸入 Gemini API Key');
      return;
    }
    alert('正在呼叫 Gemini AI 家教... (功能開發中)');
  };

  if (questions.length === 0) return <div className="text-center py-20 text-xl">題目加載中...</div>;

  const q = questions[currentIndex];

  return (
    <div className="py-6 sm:py-10 max-w-3xl mx-auto px-4">
      <div className="flex justify-between items-center mb-6 sm:mb-10">
        <div className="text-xl sm:text-2xl font-bold text-yellow-500 flex items-center gap-2">
          ⚡ 快速刷題 <span className="text-sm sm:text-base text-gray-500 font-normal">(第 {currentIndex + 1} / 25 題)</span>
        </div>
        <button onClick={() => navigate('/')} className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm font-bold transition">退出</button>
      </div>

      <div className="bg-slate-800 p-6 sm:p-10 rounded-3xl shadow-2xl mb-8 border border-slate-700">
        <h2 className="text-2xl sm:text-3xl font-bold mb-10 leading-snug text-slate-100">{q.question}</h2>
        <div className="flex flex-col gap-4 sm:gap-6">
          {['A', 'B', 'C', 'D'].map((opt) => {
            let bgColor = 'bg-slate-900/50';
            let borderColor = 'border-slate-700';
            let textColor = 'text-slate-200';
            
            if (selectedOption) {
              if (opt === q.answer) {
                bgColor = 'bg-emerald-900/40';
                borderColor = 'border-emerald-500';
                textColor = 'text-emerald-400 font-bold';
              } else if (opt === selectedOption) {
                bgColor = 'bg-rose-900/40';
                borderColor = 'border-rose-500';
                textColor = 'text-rose-400 font-bold';
              }
            } else {
              borderColor = 'hover:border-slate-500 active:scale-[0.98]';
            }

            return (
              <button
                key={opt}
                disabled={!!selectedOption}
                onClick={() => handleSelect(opt)}
                className={`text-left p-5 sm:p-8 rounded-2xl border-2 transition-all duration-200 flex items-start gap-4 ${bgColor} ${borderColor} ${textColor}`}
              >
                <span className="text-xl sm:text-2xl opacity-60 font-mono mt-0.5">{opt}</span>
                <span className="text-lg sm:text-xl leading-relaxed">{(q as any)[opt]}</span>
              </button>
            );
          })}
        </div>

        {showExplanation && (
          <div className="mt-10 pt-10 border-t border-slate-700 animate-in fade-in slide-in-from-top-4">
            <div className="bg-slate-900/80 p-6 sm:p-8 rounded-2xl border border-slate-600">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <span className="text-emerald-400 text-xl font-black px-4 py-1 bg-emerald-400/10 rounded-full">
                  ✅ 正確答案：{q.answer}
                </span>
                <button 
                  onClick={callGemini}
                  className="bg-indigo-600 hover:bg-indigo-500 px-5 py-2 rounded-xl text-sm font-bold shadow-lg transition"
                >
                  🤖 呼叫 Gemini 家教
                </button>
              </div>
              <div className="text-slate-300 text-lg sm:text-xl leading-loose">
                <span className="font-bold text-slate-100 mb-2 block">💡 專業解析：</span>
                <div className="whitespace-pre-wrap">{q.explanation}</div>
              </div>
            </div>
            
            <div className="mt-8 flex flex-col sm:flex-row justify-end items-center gap-6">
              {autoNextTimer !== null && (
                <span className="text-slate-400 text-lg italic bg-slate-800 px-4 py-2 rounded-full border border-slate-700">
                  {Math.ceil(autoNextTimer / 10)} 秒後自動跳轉...
                  <button onClick={cancelAutoNext} className="ml-3 text-indigo-400 font-bold underline">暫停</button>
                </span>
              )}
              <button
                onClick={handleNext}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 px-12 py-4 rounded-2xl text-xl font-bold shadow-xl transition active:scale-95"
              >
                下一題
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PracticeMode;
