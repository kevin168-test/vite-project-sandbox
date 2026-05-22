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
    <div className="py-6">
      <div className="flex justify-between items-center mb-6 bg-gray-800 p-4 rounded-xl sticky top-20 z-10 border border-gray-700">
        <div className="text-lg font-bold">第 {currentIndex + 1} / 50 題</div>
        <div className={`text-2xl font-mono ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-green-400'}`}>
          ⏱️ {formatTime(timeLeft)}
        </div>
        <button 
          onClick={handleSubmit}
          className="bg-red-600 hover:bg-red-500 px-4 py-1 rounded font-bold transition"
        >
          結束交卷
        </button>
      </div>

      <div className="bg-gray-800 p-8 rounded-2xl shadow-xl mb-6 border border-gray-700 min-h-[400px]">
        <h2 className="text-xl font-bold mb-8 leading-relaxed">{q.question}</h2>
        <div className="grid grid-cols-1 gap-4">
          {['A', 'B', 'C', 'D'].map((opt) => (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                userAnswers[q.id!] === opt 
                ? 'border-green-500 bg-green-900/20' 
                : 'border-gray-700 hover:border-gray-500 bg-gray-900/30'
              }`}
            >
              <span className="font-bold mr-4">{opt}.</span>
              {(q as any)[opt]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex(currentIndex - 1)}
          className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg disabled:opacity-30 transition"
        >
          上一題
        </button>
        <div className="flex gap-2 flex-wrap justify-center max-w-[50%]">
          {questions.map((_, idx) => (
            <div 
              key={idx}
              className={`w-3 h-3 rounded-full ${userAnswers[questions[idx].id!] ? 'bg-green-500' : 'bg-gray-700'}`}
            />
          ))}
        </div>
        <button
          disabled={currentIndex === questions.length - 1}
          onClick={() => setCurrentIndex(currentIndex + 1)}
          className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg disabled:opacity-30 transition"
        >
          下一題
        </button>
      </div>
    </div>
  );
};

export default ExamMode;
