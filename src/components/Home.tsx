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
    <div className="flex flex-col items-center py-6 sm:py-12 px-4 max-w-4xl mx-auto">
      <div className="text-center mb-10 sm:mb-16">
        <h1 className="text-4xl sm:text-6xl font-black mb-6 tracking-tight bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
          森林法規與保育
        </h1>
        <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
          專為森林護管員考試設計。動態權重演算法，精準鎖定你的弱點。
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 w-full">
        {modes.map((mode) => (
          <button
            key={mode.path}
            onClick={() => navigate(mode.path)}
            className={`${mode.color} p-6 sm:p-10 rounded-[2rem] shadow-2xl transition-all transform active:scale-[0.97] text-left flex items-center gap-6 group`}
          >
            <span className="text-5xl sm:text-6xl group-hover:scale-110 transition-transform">{mode.icon}</span>
            <div className="flex-grow">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-white">{mode.title}</h2>
              <p className="text-white/70 text-base sm:text-lg">{mode.description}</p>
            </div>
            <span className="text-3xl opacity-30 group-hover:opacity-100 transition-opacity">→</span>
          </button>
        ))}
      </div>
      
      <div className="mt-12 sm:mt-16 bg-slate-800/50 backdrop-blur-xl p-8 sm:p-10 rounded-[2.5rem] w-full border border-slate-700 shadow-inner">
        <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
          <span className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400">📊</span>
          學習概況
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
            <p className="text-slate-500 text-sm mb-1 font-bold uppercase tracking-wider">目前題庫總數</p>
            <p className="text-4xl font-black text-white">{stats.total}</p>
          </div>
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
            <p className="text-slate-500 text-sm mb-1 font-bold uppercase tracking-wider">已掌握題目</p>
            <p className="text-4xl font-black text-emerald-400">{stats.mastered}</p>
          </div>
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
            <p className="text-slate-500 text-sm mb-1 font-bold uppercase tracking-wider">需加強題目</p>
            <p className="text-4xl font-black text-rose-400">{stats.weak}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
