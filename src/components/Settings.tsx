import React, { useState } from 'react';
import { db } from '../db';

const Settings: React.FC = () => {
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [resetting, setResetting] = useState(false);

  const saveApiKey = () => {
    localStorage.setItem('gemini_api_key', apiKey);
    alert('API Key 已儲存');
  };

  const handleReset = async () => {
    if (window.confirm('確定要清除所有學習進度嗎？這將會重置題目權重。')) {
      setResetting(true);
      await db.progress.clear();
      setResetting(false);
      alert('進度已清除');
    }
  };

  const handleClearDB = async () => {
    if (window.confirm('確定要清除所有題庫資料嗎？系統將在下次啟動時重新從加密檔加載。')) {
      await db.questions.clear();
      await db.progress.clear();
      alert('資料庫已清空，請重新整理頁面。');
      window.location.reload();
    }
  };

  return (
    <div className="py-10">
      <h2 className="text-3xl font-bold mb-8">⚙️ 系統設定</h2>

      <div className="space-y-8">
        <section className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            🤖 Gemini AI 家教設定
          </h3>
          <p className="text-gray-400 mb-4 text-sm">
            輸入你的 Gemini API Key 以啟動 AI 白話解析功能。Key 將儲存在瀏覽器本地。
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="輸入 API Key..."
              className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 flex-grow focus:outline-none focus:border-green-500"
            />
            <button
              onClick={saveApiKey}
              className="bg-green-600 hover:bg-green-500 px-6 py-2 rounded-lg font-bold transition"
            >
              儲存
            </button>
          </div>
        </section>

        <section className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-500">
            ⚠️ 危險區域
          </h3>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold">清除學習進度</p>
                <p className="text-gray-400 text-sm">刪除答對/答錯紀錄，題目權重回歸預設。</p>
              </div>
              <button
                onClick={handleReset}
                disabled={resetting}
                className="bg-red-900/40 hover:bg-red-800 border border-red-500 text-red-500 px-4 py-2 rounded-lg font-bold transition"
              >
                重置進度
              </button>
            </div>
            
            <hr className="border-gray-700" />

            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold">重置題庫資料</p>
                <p className="text-gray-400 text-sm">清空 IndexedDB 並重新從加密檔匯入。</p>
              </div>
              <button
                onClick={handleClearDB}
                className="bg-red-900/40 hover:bg-red-800 border border-red-500 text-red-500 px-4 py-2 rounded-lg font-bold transition"
              >
                重置題庫
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;
