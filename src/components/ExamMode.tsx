import React, { useState, useEffect, useCallback } from 'react';
import { db, type Question } from '../db';
import { getWeightedRandomSample } from '../utils/weight';
import { useNavigate } from 'react-router-dom';

const ExamMode: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(45 * 60); // 45 minutes
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const loadQuestions = async () => {
      const sampled = await getWeightedRandomSample(50);
      setQuestions(sampled);
    };
    loadQuestions();
  }, []);

  useEffect(() => {
    if (timeLeft > 0 && !isFinished) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isFinished) {
      handleSubmit();
    }
  }, [timeLeft, isFinished]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelect = (option: string) => {
    if (isFinished) return;
    const qId = questions[currentIndex].id!;
    setUserAnswers({ ...userAnswers, [qId]: option });
  };

  const handleSubmit = useCallback(async () => {
    setIsFinished(true);
    let correctCount = 0;
    
    const updates = questions.map(async (q) => {
      const userAnswer = userAnswers[q.id!];
      const isCorrect = userAnswer === q.answer;
      if (isCorrect) correctCount++;

      const progress = await db.progress.get(q.id!);
      if (progress) {
        await db.progress.update(q.id!, {
          correctCount: progress.correctCount + (isCorrect ? 1 : 0),
          wrongCount: progress.wrongCount + (isCorrect ? 0 : 1)
        });
      } else {
        await db.progress.add({
          id: q.id!,
          correctCount: isCorrect ? 1 : 0,
          wrongCount: isCorrect ? 0 : 1
        });
      }
    });

    await Promise.all(updates);
    setScore(correctCount * 2); // 50 questions, each 2 points
  }, [questions, userAnswers]);

  if (questions.length === 0) return <div className="text-center py-20 text-xl">題目加載中...</div>;

  if (isFinished) {
    const wrongQuestions = questions.filter(q => userAnswers[q.id!] !== q.answer);
    return (
      <div className="py-10">
        <div className="bg-gray-800 p-8 rounded-2xl shadow-xl text-center mb-8 border border-gray-700">
          <h2 className="text-3xl font-bold mb-4">考試結果</h2>
          <div className="text-6xl font-black text-green-500 mb-2">{score} 分</div>
          <p className="text-gray-400">耗時: {formatTime(45 * 60 - timeLeft)}</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-6 bg-green-600 hover:bg-green-500 px-6 py-2 rounded-lg font-bold"
          >
            返回首頁
          </button>
        </div>

        <h3 className="text-2xl font-bold mb-6">錯題檢討</h3>
        <div className="space-y-6">
          {wrongQuestions.map((q, idx) => (
            <div key={q.id} className="bg-gray-800 p-6 rounded-xl border-l-4 border-red-500">
              <p className="font-bold text-lg mb-4">{idx + 1}. {q.question}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 text-sm">
                <div className={`p-3 rounded border ${userAnswers[q.id!] === 'A' ? 'border-red-500 bg-red-900/20' : 'border-gray-700'}`}>A. {q.A}</div>
                <div className={`p-3 rounded border ${userAnswers[q.id!] === 'B' ? 'border-red-500 bg-red-900/20' : 'border-gray-700'}`}>B. {q.B}</div>
                <div className={`p-3 rounded border ${userAnswers[q.id!] === 'C' ? 'border-red-500 bg-red-900/20' : 'border-gray-700'}`}>C. {q.C}</div>
                <div className={`p-3 rounded border ${userAnswers[q.id!] === 'D' ? 'border-red-500 bg-red-900/20' : 'border-gray-700'}`}>D. {q.D}</div>
              </div>
              <p className="text-green-400 font-bold mb-2">正確答案：{q.answer}</p>
              <div className="bg-gray-900/50 p-4 rounded text-gray-300 text-sm whitespace-pre-wrap">
                <span className="font-bold text-white">💡 解析：</span><br/>
                {q.explanation}
              </div>
            </div>
          ))}
          {wrongQuestions.length === 0 && <p className="text-center text-green-500">太棒了！完全沒有錯題。</p>}
        </div>
      </div>
    );
  }

  const q = questions[currentIndex];
  return (
    <div className="py-2 sm:py-4 max-w-4xl mx-auto px-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-4 sm:mb-6 bg-slate-800 p-4 rounded-2xl sticky top-20 z-10 border border-slate-700 shadow-xl">
        <div className="text-lg font-bold text-slate-300">第 {currentIndex + 1} / 50 題</div>
        <div className={`text-2xl font-black font-mono ${timeLeft < 300 ? 'text-rose-500 animate-pulse' : 'text-emerald-400'}`}>
          ⏱️ {formatTime(timeLeft)}
        </div>
        <button 
          onClick={handleSubmit}
          className="w-full sm:w-auto bg-rose-600 hover:bg-rose-500 px-5 py-1.5 rounded-lg font-bold transition shadow-lg active:scale-95 text-sm"
        >
          結束交卷
        </button>
      </div>

      <div className="bg-slate-800 p-5 sm:p-8 rounded-2xl shadow-2xl mb-6 border border-slate-700 min-h-[350px]">
        <h2 className="text-xl sm:text-2xl font-bold mb-6 leading-snug text-slate-100">{q.question}</h2>
        <div className="flex flex-col gap-3">
          {['A', 'B', 'C', 'D'].map((opt) => (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              className={`text-left p-4 sm:p-5 rounded-xl border-2 transition-all flex items-start gap-3 ${
                userAnswers[q.id!] === opt 
                ? 'border-emerald-500 bg-emerald-900/30 text-emerald-400' 
                : 'border-slate-700 hover:border-slate-500 bg-slate-900/40 text-slate-300'
              }`}
            >
              <span className="text-lg font-mono opacity-50">{opt}</span>
              <span className="text-base sm:text-lg">{(q as any)[opt]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center gap-4">
        <button
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex(currentIndex - 1)}
          className="bg-slate-700 hover:bg-slate-600 px-6 py-2 rounded-xl disabled:opacity-20 transition active:scale-95 font-bold text-sm"
        >
          ← 上一題
        </button>
        <div className="hidden sm:flex gap-1 flex-wrap justify-center max-w-[40%]">
          {questions.map((_, idx) => (
            <div 
              key={idx}
              className={`w-2 h-2 rounded-full ${userAnswers[questions[idx].id!] ? 'bg-emerald-500' : 'bg-slate-700'}`}
            />
          ))}
        </div>
        <button
          disabled={currentIndex === questions.length - 1}
          onClick={() => setCurrentIndex(currentIndex + 1)}
          className="bg-slate-700 hover:bg-slate-600 px-6 py-2 rounded-xl disabled:opacity-20 transition active:scale-95 font-bold text-sm"
        >
          下一題 →
        </button>
      </div>
    </div>
  );
};

export default ExamMode;
