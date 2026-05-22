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
    <div className="py-10">
      <div className="flex justify-between items-center mb-6">
        <div className="text-lg font-bold text-yellow-500">⚡ 快速刷題 (第 {currentIndex + 1} / 25 題)</div>
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white">退出</button>
      </div>

      <div className="bg-gray-800 p-8 rounded-2xl shadow-xl mb-6 border border-gray-700 min-h-[400px]">
        <h2 className="text-xl font-bold mb-8 leading-relaxed">{q.question}</h2>
        <div className="grid grid-cols-1 gap-4">
          {['A', 'B', 'C', 'D'].map((opt) => {
            let bgColor = 'bg-gray-900/30';
            let borderColor = 'border-gray-700';
            
            if (selectedOption) {
              if (opt === q.answer) {
                bgColor = 'bg-green-900/40';
                borderColor = 'border-green-500';
              } else if (opt === selectedOption) {
                bgColor = 'bg-red-900/40';
                borderColor = 'border-red-500';
              }
            } else {
              borderColor = 'hover:border-gray-500';
            }

            return (
              <button
                key={opt}
                disabled={!!selectedOption}
                onClick={() => handleSelect(opt)}
                className={`text-left p-4 rounded-xl border-2 transition-all ${bgColor} ${borderColor}`}
              >
                <span className="font-bold mr-4">{opt}.</span>
                {(q as any)[opt]}
              </button>
            );
          })}
        </div>

        {showExplanation && (
          <div className="mt-8 animate-in fade-in slide-in-from-top-4">
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <span className="text-green-400 font-bold">✅ 正確答案：{q.answer}</span>
                <button 
                  onClick={callGemini}
                  className="bg-purple-600 hover:bg-purple-500 px-3 py-1 rounded text-xs font-bold transition"
                >
                  🤖 呼叫 Gemini 家教
                </button>
              </div>
              <p className="text-gray-300 text-sm whitespace-pre-wrap">
                <span className="font-bold text-white">💡 專業解析：</span><br/>
                {q.explanation}
              </p>
            </div>
            
            <div className="mt-6 flex justify-end items-center gap-4">
              {autoNextTimer !== null && (
                <span className="text-gray-400 text-sm italic">
                  {Math.ceil(autoNextTimer / 10)} 秒後自動跳轉...
                  <button onClick={cancelAutoNext} className="ml-2 underline">暫停</button>
                </span>
              )}
              <button
                onClick={handleNext}
                className="bg-blue-600 hover:bg-blue-500 px-8 py-2 rounded-lg font-bold transition"
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
