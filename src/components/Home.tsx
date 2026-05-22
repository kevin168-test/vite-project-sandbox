import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, mastered: 0, weak: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const total = await db.questions.count();
      const allProgress = await db.progress.toArray();
      const mastered = allProgress.filter(p => p.correctCount > p.wrongCount).length;
      const weak = allProgress.filter(p => p.wrongCount > 0 && p.wrongCount >= p.correctCount).length;
      setStats({ total, mastered, weak });
    };
    fetchStats();
  }, []);

  const modes = [
    {
      title: '正式模擬考',
      description: '45 分鐘 / 50 題，全真模擬考試環境',
      path: '/exam',
      icon: '📝',
      color: 'bg-blue-600 hover:bg-blue-500'
    },
    {
      title: '快速刷題',
      description: '25 題加權抽題，即時顯示解析與 AI 家教',
      path: '/practice',
      icon: '⚡',
      color: 'bg-yellow-600 hover:bg-yellow-500'
    },
    {
      title: '錯題複習',
      description: '針對弱點進行強化訓練',
      path: '/review',
      icon: '🔄',
      color: 'bg-red-600 hover:bg-red-500'
    }
  ];

  return (
    <div className="flex flex-col items-center py-10">
      <h1 className="text-4xl font-extrabold mb-4 text-center">🌲 森林法規與保育 🌲</h1>
      <p className="text-gray-400 mb-10 text-center max-w-lg">
        專為森林護管員考試設計的離線刷題系統。動態權重演算法，精準鎖定你的弱點。
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {modes.map((mode) => (
          <button
            key={mode.path}
            onClick={() => navigate(mode.path)}
            className={`${mode.color} p-6 rounded-2xl shadow-xl transition-all transform hover:scale-105 text-left flex flex-col h-full`}
          >
            <span className="text-4xl mb-4">{mode.icon}</span>
            <h2 className="text-2xl font-bold mb-2">{mode.title}</h2>
            <p className="text-white/80 text-sm flex-grow">{mode.description}</p>
          </button>
        ))}
      </div>
      
      <div className="mt-12 bg-gray-800 p-6 rounded-xl w-full border border-gray-700">
        <h3 className="text-xl font-bold mb-4">📊 學習概況</h3>
        <p className="text-gray-400">目前題庫總數: <span className="text-white font-bold">{stats.total}</span></p>
        <p className="text-gray-400">已掌握題目: <span className="text-green-400 font-bold">{stats.mastered}</span></p>
        <p className="text-gray-400">需加強題目: <span className="text-red-400 font-bold">{stats.weak}</span></p>
      </div>
    </div>
  );
};

export default Home;
