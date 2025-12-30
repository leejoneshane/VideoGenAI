
import React from 'react';

interface ApiKeySelectorProps {
  onSelected: () => void;
}

export const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onSelected }) => {
  const handleSelect = async () => {
    // @ts-ignore
    await window.aistudio.openSelectKey();
    onSelected();
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50 p-6 text-center">
      <h2 className="text-3xl font-serif mb-4 text-amber-500">專業導演模式已就緒</h2>
      <p className="text-gray-400 max-w-md mb-8">
        為了提供最高品質的「Nano Banana Pro」影像生成服務，請選擇您的付費 Google Cloud API 金鑰。
        <br />
        <a 
          href="https://ai.google.dev/gemini-api/docs/billing" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-amber-600 underline hover:text-amber-400 mt-2 inline-block"
        >
          查看計費說明
        </a>
      </p>
      <button
        onClick={handleSelect}
        className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-8 rounded-full transition-all transform hover:scale-105"
      >
        選擇 API 金鑰以開始
      </button>
    </div>
  );
};
