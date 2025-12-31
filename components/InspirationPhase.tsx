
import React from 'react';
import { Loader2, Sparkles, Layout, Palette, Monitor } from 'lucide-react';
import { Suggestion, ProjectDNA } from '../types';

interface InspirationPhaseProps {
  input: string;
  setInput: (val: string) => void;
  isLoading: boolean;
  isElaborating: boolean;
  suggestions: Suggestion[];
  onSubmit: (e: React.FormEvent) => void;
  onSuggestionClick: (s: Suggestion) => void;
  guideText: string;
  dna: ProjectDNA;
  onUpdateDNA: (field: keyof ProjectDNA, value: string) => void;
}

export const InspirationPhase: React.FC<InspirationPhaseProps> = ({
  input, setInput, isLoading, isElaborating, suggestions, onSubmit, onSuggestionClick, guideText, dna, onUpdateDNA
}) => {
  const stylePresets = ['寫實電影感', '賽博龐克', '吉卜力動畫', '黑色電影', '極簡主義'];

  return (
    <div className="w-full max-w-3xl mt-12 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
      <h2 className="text-xl md:text-2xl font-serif text-center mb-8 text-neutral-100">{guideText}</h2>
      
      {/* 核心設定區塊 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
            <Layout className="w-3 h-3 text-amber-600" /> 製作形式
          </label>
          <select 
            value={dna.format} 
            onChange={(e) => onUpdateDNA('format', e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-neutral-300 outline-none focus:ring-1 focus:ring-amber-500 transition-all appearance-none cursor-pointer hover:bg-white/10"
          >
            {['電影', '動畫', '商業廣告', '紀錄片', '音樂錄影帶 (MV)'].map(f => <option key={f} value={f} className="bg-neutral-900">{f}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
            <Palette className="w-3 h-3 text-amber-600" /> 視覺風格
          </label>
          <div className="space-y-2">
            <input 
              type="text"
              value={dna.style}
              onChange={(e) => onUpdateDNA('style', e.target.value)}
              placeholder="輸入風格關鍵字..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-neutral-300 outline-none focus:ring-1 focus:ring-amber-500 transition-all hover:bg-white/10"
            />
            <div className="flex flex-wrap gap-1.5">
              {stylePresets.map(preset => (
                <button 
                  key={preset}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onUpdateDNA('style', preset);
                  }}
                  className={`text-[9px] px-2 py-1 rounded-md transition-all border ${dna.style === preset ? 'bg-amber-600/20 border-amber-600/50 text-amber-400' : 'bg-white/5 border-white/5 text-neutral-500 hover:text-neutral-300'}`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
            <Monitor className="w-3 h-3 text-amber-600" /> 畫面比例
          </label>
          <select 
            value={dna.ratio} 
            onChange={(e) => onUpdateDNA('ratio', e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-neutral-300 outline-none focus:ring-1 focus:ring-amber-500 transition-all appearance-none cursor-pointer hover:bg-white/10"
          >
            {['16:9', '9:16', '4:3'].map(r => <option key={r} value={r} className="bg-neutral-900">{r}</option>)}
          </select>
        </div>
      </div>

      <form onSubmit={onSubmit} className="relative group mb-12">
        <textarea 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="在此輸入您的創意指令或靈感碎片..." 
          rows={4} 
          className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-lg focus:outline-none focus:ring-2 focus:ring-amber-600/50 resize-none shadow-2xl transition-all" 
        />
        <button 
          type="submit" 
          disabled={isLoading || !input.trim()} 
          className="absolute right-3 bottom-3 bg-amber-600 hover:bg-amber-500 p-4 rounded-xl shadow-lg transition-all group/btn disabled:opacity-50 disabled:bg-neutral-700"
        >
          {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : <Sparkles className="w-6 h-6 text-white group-hover/btn:scale-110 transition-transform" />}
        </button>
      </form>
      
      {!isElaborating && suggestions?.length > 0 && (
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 animate-in slide-in-from-bottom-8 duration-700">
          {suggestions.map((s, i) => (
            <button 
              key={i} 
              onClick={() => onSuggestionClick(s)} 
              className="glass p-8 rounded-2xl text-center border-white/5 hover:border-amber-600 group transition-all flex flex-col items-center"
            >
              <h3 className="text-lg font-serif font-bold mb-4 line-clamp-2 h-14 flex items-center justify-center text-neutral-200">{s.title}</h3>
              <div className="flex flex-wrap justify-center gap-1.5 mt-auto">
                {s.tags?.map(t => <span key={t} className="text-[9px] bg-amber-900/30 px-2 py-0.5 rounded text-amber-200/60 border border-amber-600/10">#{t}</span>)}
              </div>
            </button>
          ))}
        </div>
      )}

      {isElaborating && (
        <div className="w-full flex flex-col items-center gap-4 mt-20 animate-pulse">
          <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
          <p className="text-xs font-bold text-amber-500 uppercase tracking-widest">正在擴充拍攝方案 DNA...</p>
        </div>
      )}
    </div>
  );
};
