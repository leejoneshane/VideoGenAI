
import React from 'react';
import { Loader2, Sparkles, Layout, Palette, Monitor, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Suggestion, ProjectDNA } from '../types';

interface InspirationPhaseProps {
  input: string;
  setInput: (val: string) => void;
  isLoading: boolean;
  isElaborating: boolean;
  suggestions: Suggestion[];
  selectedId?: string;
  onSubmit: (e: React.FormEvent) => void;
  onSuggestionClick: (s: Suggestion) => void;
  guideText: string;
  dna: ProjectDNA;
  onUpdateDNA: (field: keyof ProjectDNA, value: string) => void;
}

export const InspirationPhase: React.FC<InspirationPhaseProps> = ({
  input, setInput, isLoading, isElaborating, suggestions, selectedId, onSubmit, onSuggestionClick, guideText, dna, onUpdateDNA
}) => {
  const stylePresets = ['寫實電影感', '賽博龐克', '吉卜力動畫', '黑色電影', '極簡主義'];

  return (
    <div className="w-full max-w-4xl mt-12 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="text-center mb-12 space-y-4">
        <h2 className="text-4xl font-serif text-neutral-100 italic">靈感之源 (Inspiration)</h2>
        <p className="text-neutral-500 text-sm max-w-lg mx-auto leading-relaxed">輸入您的靈感碎片，AI 大師將為您提案具備強烈視覺張力與敘事深度的專業導演方案。</p>
      </div>
      
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

      <form onSubmit={onSubmit} className="relative group mb-16">
        <textarea 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="在此輸入您的創意指令或靈感碎片..." 
          rows={4} 
          className="w-full bg-white/5 border border-white/10 p-6 rounded-2xl text-xl focus:outline-none focus:ring-2 focus:ring-amber-600/50 resize-none shadow-2xl transition-all placeholder:text-neutral-700" 
        />
        <button 
          type="submit" 
          disabled={isLoading || !input.trim()} 
          className="absolute right-4 bottom-4 bg-amber-600 hover:bg-amber-500 p-4 rounded-2xl shadow-lg transition-all group/btn disabled:opacity-50 disabled:bg-neutral-800"
        >
          {isLoading ? (
            <Loader2 className="w-7 h-7 animate-spin text-white" />
          ) : (
            <Sparkles className="w-7 h-7 text-white group-hover/btn:scale-110 transition-transform" />
          )}
        </button>
      </form>
      
      {!isElaborating && suggestions?.length > 0 && (
        <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
          <div className="flex items-center gap-4">
            <div className="h-px bg-white/10 flex-1" />
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.3em]">導演提案清單 (Proposals)</span>
            <div className="h-px bg-white/10 flex-1" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {suggestions.map((s, i) => {
              const isActive = selectedId === s.title;
              return (
                <button 
                  key={i} 
                  onClick={() => onSuggestionClick(s)} 
                  className={`glass p-8 rounded-3xl text-left border-white/5 group transition-all flex flex-col items-start relative overflow-hidden shadow-2xl ${isActive ? 'ring-2 ring-amber-600 bg-amber-600/5 border-amber-600/30' : 'hover:border-amber-600/50'}`}
                >
                  <div className={`absolute top-0 left-0 w-1 h-full bg-amber-600 transition-transform origin-top ${isActive ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-100'}`} />
                  <div className="flex items-center justify-between w-full mb-4">
                    <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-amber-600/10 flex items-center justify-center text-amber-500 text-[10px] font-bold font-mono">0{i+1}</div>
                       <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{s.format} • {s.style}</span>
                    </div>
                    {isActive && <CheckCircle2 className="w-4 h-4 text-amber-500" />}
                  </div>
                  <h3 className={`text-xl font-serif font-bold mb-4 leading-tight transition-colors ${isActive ? 'text-amber-500' : 'text-neutral-100 group-hover:text-amber-500'}`}>{s.title}</h3>
                  <p className={`text-[11px] line-clamp-3 mb-6 leading-relaxed transition-colors ${isActive ? 'text-neutral-300' : 'text-neutral-500 group-hover:text-neutral-400'}`}>{s.description}</p>
                  
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {s.tags?.map(t => <span key={t} className="text-[8px] font-bold bg-white/5 px-2 py-0.5 rounded text-neutral-600 border border-white/5">#{t}</span>)}
                  </div>

                  <div className={`mt-auto flex items-center gap-2 text-[10px] font-bold text-amber-600 uppercase tracking-widest transition-all transform ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-[-10px] group-hover:opacity-100 group-hover:translate-x-0'}`}>
                    {isActive ? '已選擇方向 (可修改上方參數)' : '點選此劇本方向'} <ArrowRight className="w-3 h-3" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {isElaborating && (
        <div className="w-full flex flex-col items-center gap-6 mt-20 animate-pulse">
          <Loader2 className="w-10 h-10 text-amber-600 animate-spin" />
          <div className="space-y-2 text-center">
            <p className="text-[11px] font-bold text-amber-500 uppercase tracking-[0.3em]">正在建構專業影片 DNA...</p>
            <p className="text-[9px] text-neutral-600 uppercase tracking-widest">分析地理環境、社會背景與敘事幾何</p>
          </div>
        </div>
      )}
    </div>
  );
};
