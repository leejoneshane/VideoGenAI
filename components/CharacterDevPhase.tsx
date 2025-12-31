
import { Loader2, Users, PersonStanding, Eye, Palette, Target, Wand2, Grid } from 'lucide-react';
import React from 'react';
import { CharacterDesign, ProjectState } from '../types';

interface CharacterDevPhaseProps {
  project: ProjectState;
  isAnalyzing: boolean;
  isLoading: boolean;
  onUpdateCharacter: (idx: number, field: keyof CharacterDesign, value: string) => void;
  onPolishCharacter: (idx: number, field: keyof CharacterDesign, label: string) => void;
  onRenderGrid: (idx: number) => void;
  guideText: string;
}

export const CharacterDevPhase: React.FC<CharacterDevPhaseProps> = ({
  project, isAnalyzing, isLoading, onUpdateCharacter, onPolishCharacter, onRenderGrid, guideText
}) => {
  return (
    <div className="w-full space-y-12 pb-20 animate-in fade-in duration-1000">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-serif text-neutral-100">{guideText}</h2>
        <p className="text-sm text-neutral-500 max-w-xl mx-auto">AI 已根據頂尖選角指導視角建立核心角色視覺原型，請優化他們的外貌特徵、材質 DNA 與動作習性。</p>
      </div>

      {isAnalyzing ? (
        <div className="py-20 flex flex-col items-center gap-6 animate-pulse">
          <Loader2 className="w-12 h-12 text-amber-600 animate-spin" />
          <p className="text-amber-500 text-xs font-bold uppercase tracking-[0.3em]">AI 正在識別核心角色並設計視覺原型...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {project.proposedCharacters.map((char, idx) => (
            <div key={idx} className={`glass p-8 rounded-3xl transition-all border-white/5 flex flex-col shadow-2xl ${project.selectedCharacterIndex === idx ? 'ring-2 ring-amber-600 bg-amber-600/5' : ''}`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-600" />
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{char.id || char.role}</span>
                </div>
                <PersonStanding className="w-5 h-5 text-neutral-700" />
              </div>
              
              <input 
                className="bg-transparent border-none text-neutral-100 font-serif font-bold text-2xl mb-6 focus:ring-0 w-full outline-none" 
                value={char.name} 
                onChange={(e) => onUpdateCharacter(idx, 'name', e.target.value)} 
                placeholder="角色姓名" 
              />

              <div className="space-y-6 mb-8 flex-1">
                {[
                  { id: 'physicalTraits', label: '外貌特徵 (Physical Traits)', icon: <Eye className="w-3 h-3" /> },
                  { id: 'visualTone', label: '外觀材質色調 (Visual DNA)', icon: <Palette className="w-3 h-3" /> },
                  { id: 'motivation', label: '內在動機與表情動作 (Motivation)', icon: <Target className="w-3 h-3" /> }
                ].map(f => (
                  <div key={f.id} className="group/field">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-[9px] font-bold text-neutral-500 uppercase flex items-center gap-1.5">{f.icon} {f.label}</label>
                      <button onClick={() => onPolishCharacter(idx, f.id as keyof CharacterDesign, f.label)} className="opacity-0 group-hover/field:opacity-100 text-amber-500 hover:text-white transition-all bg-amber-600/10 p-1 rounded-md" title="AI 精修描述"><Wand2 className="w-3 h-3" /></button>
                    </div>
                    <textarea 
                      value={char[f.id as keyof CharacterDesign] as string || ''} 
                      onChange={(e) => onUpdateCharacter(idx, f.id as keyof CharacterDesign, e.target.value)} 
                      rows={5} 
                      className="w-full bg-white/5 rounded-xl p-3 text-[11px] text-neutral-400 focus:text-neutral-200 outline-none resize-none leading-relaxed transition-colors border border-transparent focus:border-amber-600/30" 
                      placeholder={`請描述角色的${f.label}...`}
                    />
                  </div>
                ))}
              </div>

              <button 
                onClick={() => onRenderGrid(idx)} 
                disabled={isLoading} 
                className="w-full py-3.5 bg-amber-600/10 hover:bg-amber-600 text-amber-500 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
              >
                {isLoading && project.selectedCharacterIndex === idx ? <Loader2 className="w-4 h-4 animate-spin" /> : <Grid className="w-4 h-4" />} 渲染形象九宮格
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
