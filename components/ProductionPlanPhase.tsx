
import React from 'react';
import { Target, Users, MapPin, BookOpen, ImageIcon, Loader2, Maximize2, Palette, Zap, Wand2 } from 'lucide-react';
import { ProjectDNA } from '../types';

interface ProductionPlanPhaseProps {
  dna: ProjectDNA;
  setDna: (dna: ProjectDNA) => void;
  onRenderCoreVisual: () => void;
  onPolishDNA: (field: keyof ProjectDNA, label: string) => void;
  isLoading: boolean;
}

export const ProductionPlanPhase: React.FC<ProductionPlanPhaseProps> = ({ dna, setDna, onRenderCoreVisual, onPolishDNA, isLoading }) => {
  const updateField = (field: keyof ProjectDNA, value: string) => {
    setDna({ ...dna, [field]: value });
  };

  const masterListFields = [
    { id: 'spatialGeometry', label: '空間幾何 (Spatial Geometry)', icon: <Maximize2 className="w-3 h-3" /> },
    { id: 'colorAesthetics', label: '色彩美學 (Color Aesthetics)', icon: <Palette className="w-3 h-3" /> },
    { id: 'conflictEssence', label: '衝突本質 (Conflict Essence)', icon: <Zap className="w-3 h-3" /> },
    { id: 'socialBackground', label: '社會背景 (Social Background)', icon: <Users className="w-3 h-3" /> },
    { id: 'environment', label: '地理環境 (Environment)', icon: <MapPin className="w-3 h-3" /> }
  ];

  return (
    <div className="w-full space-y-12 pb-20 animate-in fade-in duration-700">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-serif text-neutral-100">優化拍攝 DNA</h2>
        <p className="text-sm text-neutral-500">確立影片風格、空間特徵與劇本細節。這將作為後續舞台與角色生成的基石。</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          {masterListFields.map(f => (
            <div key={f.id} className="group relative">
              <div className="flex justify-between items-center mb-3">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                  {f.icon} {f.label}
                </label>
                <button 
                  onClick={() => onPolishDNA(f.id as keyof ProjectDNA, f.label)} 
                  disabled={isLoading}
                  className="opacity-0 group-hover:opacity-100 text-amber-500 hover:text-white transition-all bg-amber-600/10 p-1 rounded-md" 
                  title="AI 精修描述"
                >
                  <Wand2 className="w-3 h-3" />
                </button>
              </div>
              <textarea 
                value={dna[f.id as keyof ProjectDNA] || ''} 
                onChange={(e) => updateField(f.id as keyof ProjectDNA, e.target.value)} 
                rows={4} 
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-neutral-300 outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed transition-all" 
              />
            </div>
          ))}
        </div>
        
        <div className="flex flex-col space-y-4 group">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5" /> 劇本摘要
            </label>
            <button 
              onClick={() => onPolishDNA('story', '劇本摘要')} 
              disabled={isLoading}
              className="opacity-0 group-hover:opacity-100 text-amber-500 hover:text-white transition-all bg-amber-600/10 p-1 rounded-md" 
              title="AI 精修劇本"
            >
              <Wand2 className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <button 
            onClick={onRenderCoreVisual}
            disabled={isLoading}
            className="w-full py-4 bg-amber-600/10 hover:bg-amber-600 text-amber-500 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-3 transition-all shadow-lg group/btn"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />}
            渲染核心視覺定位圖 (Core Visual DNA)
          </button>

          <textarea 
            value={dna.story || ''} 
            onChange={(e) => updateField('story', e.target.value)} 
            rows={20} 
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-sm focus:ring-1 focus:ring-amber-500 outline-none leading-relaxed font-serif text-neutral-300 transition-all flex-1" 
          />
        </div>
      </div>
    </div>
  );
};
