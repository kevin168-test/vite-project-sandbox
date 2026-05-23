import React, { useState, useEffect } from 'react';
import { db, type Question } from '../db';
import { useNavigate } from 'react-router-dom';

const ReviewMode: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadReviewQuestions = async () => {
      const progress = await db.progress
        .filter(p => p.wrongCount > 0 && p.wrongCount >= p.correctCount)
        .toArray();
      const ids = progress.map(p => p.id);
      const qData = await db.questions.bulkGet(ids);
      setQuestions(qData.filter((q): q is Question => !!q));
    };
    loadReviewQuestions();
  }, []);

  const handleSelect = async (opt: string) => {
    if (selectedOption) return;
    
    const q = questions[currentIndex];
    const correct = opt === q.answer;
    setSelectedOption(opt);
    setShowExplanation(true);

    const progress = await db.progress.get(q.id!);
    if (progress) {
      await db.progress.update(q.id!, {
        correctCount: progress.correctCount + (correct ? 1 : 0),
        wrongCount: progress.wrongCount + (correct ? 0 : 1)
      });
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      alert('錯題複習完成！');
      navigate('/');
    }
  };

  if (questions.length === 0) return (
    <div className="text-center py-20">
      <div className="text-6xl mb-6">🎉</div>
      <h2 className="text-2xl font-bold mb-4">目前沒有需要複習的錯題！</h2>
      <button onClick={() => navigate('/')} className="bg-green-600 px-6 py-2 rounded-lg">返回首頁</button>
    </div>
  );

  const q = questions[currentIndex];

  return (
    <div className="py-4 sm:py-6 max-w-3xl mx-auto px-4">
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <div className="text-lg font-bold text-red-500">🔄 錯題複習 (第 {currentIndex + 1} / {questions.length} 題)</div>
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white text-sm">退出</button>
      </div>

      <div className="bg-gray-800 p-5 sm:p-8 rounded-2xl shadow-xl mb-6 border border-gray-700 min-h-[300px]">
        <h2 className="text-lg sm:text-xl font-bold mb-6 leading-relaxed text-slate-100">{q.question}</h2>
        <div className="grid grid-cols-1 gap-3">
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
            }
            return (
              <button
                key={opt}
                disabled={!!selectedOption}
                onClick={() => handleSelect(opt)}
                className={`text-left p-3.5 sm:p-4 rounded-xl border-2 transition-all flex items-start gap-3 ${bgColor} ${borderColor}`}
              >
                <span className="font-mono opacity-60 font-bold">{opt}</span>
                <span className="text-base sm:text-lg">{(q as any)[opt]}</span>
              </button>
            );
          })}
        </div>

        {showExplanation && (
          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="bg-gray-900 p-4 sm:p-6 rounded-xl border border-gray-700">
              <span className="text-green-400 font-bold mb-1 block text-lg">✅ 正確答案：{q.answer}</span>
              <div className="text-gray-300 text-base sm:text-lg whitespace-pre-wrap leading-relaxed">
                <span className="font-bold text-white mb-1 block">💡 專業解析：</span>
                {q.explanation}
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleNext}
                className="bg-blue-600 hover:bg-blue-500 px-8 py-2 rounded-lg font-bold transition active:scale-95"
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

export default ReviewMode;
