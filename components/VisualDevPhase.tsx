
import React from 'react';
import { Loader2, MapPin, Edit3, Grid, Monitor } from 'lucide-react';
import { ProjectState, StageDesign } from '../types';

interface VisualDevPhaseProps {
  project: ProjectState;
  isAnalyzing: boolean;
  isLoading: boolean;
  onUpdateStage: (idx: number, field: keyof StageDesign, value: string) => void;
  onRenderGrid: (idx: number) => void;
  guideText: string;
}

export const VisualDevPhase: React.FC<VisualDevPhaseProps> = ({
  project, isAnalyzing, isLoading, onUpdateStage, onRenderGrid, guideText
}) => {
  return (
    <div className="w-full space-y-12 pb-20 animate-in fade-in duration-1000">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-serif text-neutral-100">{guideText}</h2>
        <p className="text-sm text-neutral-500 max-w-xl mx-auto">AI 已識別故事中的主角活動地理集群，請渲染舞台視覺九宮格以確保場景的一致性。</p>
      </div>

      {isAnalyzing ? (
        <div className="py-20 flex flex-col items-center gap-6 animate-pulse">
          <Loader2 className="w-12 h-12 text-amber-600 animate-spin" />
          <p className="text-amber-500 text-xs font-bold uppercase tracking-[0.3em]">AI 正在識別核心舞台...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {project.proposedStages.map((stage, idx) => (
            <div key={idx} className={`glass p-6 rounded-2xl transition-all border-white/5 flex flex-col hover:border-amber-600/30 shadow-xl ${project.selectedStageIndex === idx ? 'ring-2 ring-amber-600 bg-amber-600/5' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">STAGE 0{idx+1}</span>
                </div>
                <Edit3 className="w-3.5 h-3.5 text-neutral-700 opacity-50" />
              </div>
              <input 
                className="bg-transparent border-none text-neutral-100 font-serif font-bold text-lg mb-2 focus:ring-0 w-full outline-none" 
                value={stage.name} 
                onChange={(e) => onUpdateStage(idx, 'name', e.target.value)} 
                placeholder="舞台名稱"
              />
              <textarea 
                className="w-full bg-white/5 rounded-xl p-3 text-[11px] text-neutral-400 focus:text-neutral-200 outline-none resize-none flex-1 mb-4 leading-relaxed" 
                rows={6} 
                value={stage.description} 
                onChange={(e) => onUpdateStage(idx, 'description', e.target.value)} 
                placeholder="舞台空間描述..." 
              />
              <button 
                onClick={() => onRenderGrid(idx)} 
                disabled={isLoading} 
                className="w-full py-2.5 bg-amber-600/10 hover:bg-amber-600 text-amber-500 hover:text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-2 transition-all"
              >
                {isLoading && project.selectedStageIndex === idx ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Grid className="w-3.5 h-3.5" />} 渲染舞台九宮格
              </button>
            </div>
          ))}
        </div>
      )}

      {project.selectedStageIndex !== undefined && project.proposedStages[project.selectedStageIndex]?.gridImage && (
        <div className="space-y-6 pt-12 border-t border-white/5 animate-in zoom-in-95">
          <h3 className="text-xs font-bold text-amber-500 uppercase tracking-[0.4em] flex items-center gap-2">
            <Monitor className="w-4 h-4" /> {project.proposedStages[project.selectedStageIndex]?.name} 視覺細節
          </h3>
          <div className="aspect-square max-w-2xl mx-auto rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
            <img src={project.proposedStages[project.selectedStageIndex!]?.gridImage} className="w-full h-full object-cover" alt="Stage Grid" />
          </div>
        </div>
      )}
    </div>
  );
};
