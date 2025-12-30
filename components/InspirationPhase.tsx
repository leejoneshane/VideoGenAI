
import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { Suggestion } from '../types';

interface InspirationPhaseProps {
  input: string;
  setInput: (val: string) => void;
  isLoading: boolean;
  isElaborating: boolean;
  suggestions: Suggestion[];
  onSubmit: (e: React.FormEvent) => void;
  onSuggestionClick: (s: Suggestion) => void;
  guideText: string;
}

export const InspirationPhase: React.FC<InspirationPhaseProps> = ({
  input, setInput, isLoading, isElaborating, suggestions, onSubmit, onSuggestionClick, guideText
}) => {
  return (
    <div className="w-full max-w-2xl mt-20 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
      <h2 className="text-xl md:text-2xl font-serif text-center mb-8 text-neutral-100">{guideText}</h2>
      <form onSubmit={onSubmit} className="relative group">
        <textarea 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="在此輸入您的創意指令..." 
          rows={3} 
          className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-lg focus:outline-none focus:ring-2 focus:ring-amber-600/50 resize-none shadow-2xl transition-all" 
        />
        <button type="submit" disabled={isLoading || !input.trim()} className="absolute right-3 top-3 bg-amber-600 hover:bg-amber-500 p-3 rounded-xl shadow-lg transition-all">
          {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
        </button>
      </form>
      
      {!isElaborating && suggestions?.length > 0 && (
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 animate-in slide-in-from-bottom-8 duration-700">
          {suggestions.map((s, i) => (
            <button 
              key={i} 
              onClick={() => onSuggestionClick(s)} 
              className="glass p-8 rounded-2xl text-center border-white/5 hover:border-amber-600 group transition-all"
            >
              <h3 className="text-lg font-serif font-bold mb-4 line-clamp-2 h-14 flex items-center justify-center text-neutral-200">{s.title}</h3>
              <div className="flex flex-wrap justify-center gap-1.5">
                {s.tags?.map(t => <span key={t} className="text-[9px] bg-amber-900/30 px-2 py-0.5 rounded text-amber-200/60 border border-amber-600/10">#{t}</span>)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
