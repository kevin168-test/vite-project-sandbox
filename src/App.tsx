import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './components/Home';
import ExamMode from './components/ExamMode';
import PracticeMode from './components/PracticeMode';
import ReviewMode from './components/ReviewMode';
import Settings from './components/Settings';
import { db } from './db';
import { decryptData } from './utils/crypto';

const App: React.FC = () => {
  useEffect(() => {
    // Disable right click
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);

    // Initial data load if empty
    const initData = async () => {
      const count = await db.questions.count();
      if (count === 0) {
        try {
          const response = await fetch('./questions.enc');
          if (response.ok) {
            const encryptedData = await response.text();
            const decrypted = decryptData(encryptedData);
            if (decrypted && Array.isArray(decrypted)) {
              await db.questions.bulkAdd(decrypted);
              console.log('Database initialized with', decrypted.length, 'questions');
            }
          }
        } catch (error) {
          console.error('Failed to load initial data:', error);
        }
      }
    };
    initData();

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white font-sans">
        <header className="bg-green-800 p-4 shadow-md sticky top-0 z-10">
          <div className="container mx-auto flex justify-between items-center">
            <Link to="/" className="text-xl font-bold flex items-center gap-2">
              🌲 森林法規刷題系統
            </Link>
            <nav className="flex gap-4">
              <Link to="/" className="hover:text-green-300 transition">首頁</Link>
              <Link to="/settings" className="hover:text-green-300 transition">設定</Link>
            </nav>
          </div>
        </header>

        <main className="container mx-auto p-4 max-w-4xl">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/exam" element={<ExamMode />} />
            <Route path="/practice" element={<PracticeMode />} />
            <Route path="/review" element={<ReviewMode />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>

        <footer className="p-8 text-center text-gray-500 text-sm">
          &copy; 2026 森林法規與保育離線 PWA 刷題系統
        </footer>
      </div>
    </Router>
  );
};

export default App;
