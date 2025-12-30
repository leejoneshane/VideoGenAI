
import React, { useState, useRef, useEffect } from 'react';
import { Message, ProductionPhase } from '../types';
import { Loader2, Send, Image as ImageIcon, Video, Film, PlayCircle } from 'lucide-react';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  onGenerateVideo: (prompt: string, shotLabel: string) => void;
  isLoading: boolean;
  currentPhase: ProductionPhase;
  onGenerateGrid: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage, 
  onGenerateVideo,
  isLoading, 
  currentPhase,
  onGenerateGrid
}) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
  };

  const parseVideoPrompts = (content: string) => {
    // Regex to find AI Video Prompt blocks (from the specified format)
    const promptRegex = /AI 影片生成提示詞.*:.*"(.*)"/g;
    const matches = [...content.matchAll(promptRegex)];
    return matches.map(m => m[1]);
  };

  const showGridButton = [
    ProductionPhase.VISUAL_DEV, 
    ProductionPhase.CHARACTER_DEV, 
    ProductionPhase.STORYBOARD
  ].includes(currentPhase);

  return (
    <div className="flex flex-col h-full bg-neutral-900 border-x border-neutral-800 shadow-2xl overflow-hidden">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-amber-900"
      >
        {messages.map((msg, i) => {
          const videoPrompts = msg.role === 'assistant' ? parseVideoPrompts(msg.content) : [];
          
          return (
            <div 
              key={i} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`
                max-w-[85%] p-4 rounded-2xl shadow-lg
                ${msg.role === 'user' 
                  ? 'bg-amber-700 text-white rounded-tr-none' 
                  : 'bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-tl-none'}
              `}>
                <div className="whitespace-pre-wrap leading-relaxed text-sm md:text-base mb-2">
                  {msg.content}
                </div>

                {/* Video Prompts Detection & Action */}
                {videoPrompts.length > 0 && (
                  <div className="mt-4 p-3 bg-black/40 rounded-xl border border-amber-900/30">
                    <p className="text-xs font-bold text-amber-500 mb-2 uppercase tracking-tighter">偵測到可生成的影片提示詞</p>
                    <div className="flex flex-col gap-2">
                      {videoPrompts.map((p, idx) => (
                        <button 
                          key={idx}
                          onClick={() => onGenerateVideo(p, `Shot ${idx + 1}`)}
                          className="flex items-center justify-between gap-3 p-2 bg-amber-600/10 hover:bg-amber-600/20 border border-amber-600/30 rounded-lg text-xs text-amber-200 text-left transition-colors"
                        >
                          <span className="truncate flex-1">"{p.substring(0, 60)}..."</span>
                          <Video className="w-4 h-4 shrink-0 text-amber-500" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Inline Video Player */}
                {msg.videoUrl && (
                  <div className="mt-4 rounded-xl overflow-hidden border border-neutral-700 bg-black">
                    <video 
                      src={msg.videoUrl} 
                      controls 
                      autoPlay 
                      loop 
                      className="w-full h-auto"
                    />
                    <div className="p-2 bg-neutral-800 text-[10px] text-neutral-400 flex items-center gap-2">
                       <Film className="w-3 h-3" /> 5.0s | Veo 3.1 Fast Preview
                    </div>
                  </div>
                )}

                {msg.images && msg.images.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 gap-2">
                     {msg.images.map((img, idx) => (
                       <img key={idx} src={img} alt="Generated" className="rounded-lg border border-neutral-600 w-full" />
                     ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-neutral-800 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
              <span className="text-neutral-400 italic">正在處理中...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-neutral-900 border-t border-neutral-800">
        <div className="flex flex-wrap gap-2 mb-3">
          {showGridButton && (
            <button
              onClick={onGenerateGrid}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-900/30 border border-amber-800/50 text-amber-400 text-xs hover:bg-amber-900/50 transition-colors disabled:opacity-50"
            >
              <ImageIcon className="w-4 h-4" />
              生成概念九宮格
            </button>
          )}
          <button
            onClick={() => onSendMessage("好的，我們進行下一步。")}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs hover:bg-neutral-700 transition-colors disabled:opacity-50"
          >
            下一步
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="輸入指令..."
            className="flex-1 bg-neutral-800 border border-neutral-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-neutral-500"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-amber-600 hover:bg-amber-500 text-white p-3 rounded-xl transition-all disabled:opacity-50 disabled:bg-neutral-700"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
