
import React from 'react';
import { Target, Users, MapPin, BookOpen, ImageIcon, Loader2 } from 'lucide-react';
import { ProjectDNA } from '../types';

interface ProductionPlanPhaseProps {
  dna: ProjectDNA;
  setDna: (dna: ProjectDNA) => void;
  onRenderCoreVisual: () => void;
  isLoading: boolean;
}

export const ProductionPlanPhase: React.FC<ProductionPlanPhaseProps> = ({ dna, setDna, onRenderCoreVisual, isLoading }) => {
  const updateField = (field: keyof ProjectDNA, value: string) => {
    setDna({ ...dna, [field]: value });
  };

  return (
    <div className="w-full space-y-12 pb-20 animate-in fade-in duration-700">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-serif text-neutral-100">優化拍攝 DNA</h2>
        <p className="text-sm text-neutral-500">確立影片風格、核心敘事與劇本細節。這將作為後續舞台與角色生成的基石。</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          {[
            { id: 'coreNarrative', label: '核心敘事', icon: <Target className="w-3 h-3" /> },
            { id: 'socialBackground', label: '社會背景', icon: <Users className="w-3 h-3" /> },
            { id: 'environment', label: '地理環境', icon: <MapPin className="w-3 h-3" /> }
          ].map(f => (
            <div key={f.id} className="group relative">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2 mb-3">
                {f.icon} {f.label}
              </label>
              <textarea 
                value={dna[f.id as keyof ProjectDNA] || ''} 
                onChange={(e) => updateField(f.id as keyof ProjectDNA, e.target.value)} 
                rows={6} 
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-neutral-300 outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed transition-all" 
              />
            </div>
          ))}
        </div>
        <div className="flex flex-col space-y-3 group">
          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5" /> 劇本摘要
          </label>
          <textarea 
            value={dna.story || ''} 
            onChange={(e) => updateField('story', e.target.value)} 
            rows={20} 
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-sm focus:ring-1 focus:ring-amber-500 outline-none leading-relaxed font-serif text-neutral-300 transition-all flex-1" 
          />
          <button 
            onClick={onRenderCoreVisual}
            disabled={isLoading}
            className="w-full py-4 bg-amber-600/10 hover:bg-amber-600 text-amber-500 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-3 transition-all shadow-lg group/btn"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />}
            渲染核心視覺定位圖 (Core Visual DNA)
          </button>
        </div>
      </div>
    </div>
  );
};
