
import React from 'react';
import { Loader2, Flag, Zap, Trophy, History, Layers, MessageSquare, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { ProjectState, StoryArchitecture } from '../types';

interface StoryArchPhaseProps {
  project: ProjectState;
  isLoading: boolean;
  onUpdateArch: (arch: StoryArchitecture) => void;
  guideText: string;
}

export const StoryArchPhase: React.FC<StoryArchPhaseProps> = ({
  project, isLoading, onUpdateArch, guideText
}) => {
  const arch = project.storyArchitecture;

  if (isLoading && !arch) {
    return (
      <div className="py-20 flex flex-col items-center gap-6 animate-pulse">
        <Loader2 className="w-12 h-12 text-amber-600 animate-spin" />
        <p className="text-amber-500 text-xs font-bold uppercase tracking-[0.3em]">AI 正在架構敘事蒙太奇節奏...</p>
      </div>
    );
  }

  if (!arch) return null;

  const handleUpdateScene = (chapterIdx: number, sceneIdx: number, val: string) => {
    const newArch = JSON.parse(JSON.stringify(arch));
    newArch.chapters[chapterIdx].scenes[sceneIdx] = val;
    onUpdateArch(newArch);
  };

  const handleAddScene = (chapterIdx: number) => {
    const newArch = JSON.parse(JSON.stringify(arch));
    newArch.chapters[chapterIdx].scenes.push("");
    onUpdateArch(newArch);
  };

  const handleRemoveScene = (chapterIdx: number, sceneIdx: number) => {
    const newArch = JSON.parse(JSON.stringify(arch));
    newArch.chapters[chapterIdx].scenes.splice(sceneIdx, 1);
    onUpdateArch(newArch);
  };

  const handleMoveScene = (chapterIdx: number, sceneIdx: number, direction: 'up' | 'down') => {
    const newArch = JSON.parse(JSON.stringify(arch));
    const scenes = newArch.chapters[chapterIdx].scenes;
    const targetIdx = direction === 'up' ? sceneIdx - 1 : sceneIdx + 1;
    if (targetIdx < 0 || targetIdx >= scenes.length) return;
    
    [scenes[sceneIdx], scenes[targetIdx]] = [scenes[targetIdx], scenes[sceneIdx]];
    onUpdateArch(newArch);
  };

  return (
    <div className="w-full space-y-8 pb-20 animate-in fade-in duration-1000">
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-serif text-neutral-100">{guideText}</h2>
        <p className="text-xs text-neutral-500 max-w-xl mx-auto">敘事結構已生成。您可以自由編輯、新增或調整場景序列。</p>
      </div>

      {/* 結構點區塊 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {[
          { icon: <Zap className="w-3.5 h-3.5" />, label: '激勵事件', field: 'incitingIncident', color: 'text-blue-400' },
          { icon: <Flag className="w-3.5 h-3.5" />, label: '中點轉折', field: 'midpoint', color: 'text-amber-400' },
          { icon: <Trophy className="w-3.5 h-3.5" />, label: '全片高潮', field: 'climax', color: 'text-red-400' },
          { icon: <History className="w-3.5 h-3.5" />, label: '故事結局', field: 'resolution', color: 'text-green-400' },
        ].map((item, i) => (
          <div key={i} className="glass p-4 rounded-xl border-white/5 space-y-2 group">
            <div className={`flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest ${item.color}`}>
              {item.icon} {item.label}
            </div>
            <textarea
              className="w-full bg-transparent border-none text-[11px] text-neutral-400 leading-relaxed italic resize-none focus:ring-0 focus:text-white transition-colors p-0"
              rows={2}
              value={arch[item.field as keyof StoryArchitecture] as string}
              onChange={(e) => onUpdateArch({ ...arch, [item.field]: e.target.value })}
            />
          </div>
        ))}
      </div>

      {/* 章節區塊 */}
      <div className="space-y-6">
        <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.3em] flex items-center gap-2 px-2">
          <Layers className="w-3.5 h-3.5" /> 章節蒙太奇劃分 (Chapters)
        </h3>
        <div className="space-y-4">
          {arch.chapters.map((chapter, i) => (
            <div key={i} className="glass p-6 rounded-2xl border-white/5 flex flex-col md:flex-row gap-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                <span className="text-6xl font-serif font-bold italic">0{i+1}</span>
              </div>
              
              <div className="md:w-1/4 space-y-3 shrink-0">
                <div className="space-y-0.5">
                  <span className="text-[8px] font-bold text-amber-600 uppercase tracking-tighter">CHAPTER 0{i+1}</span>
                  <input
                    className="w-full bg-transparent border-none text-lg font-serif font-bold text-neutral-100 p-0 focus:ring-0"
                    value={chapter.title}
                    onChange={(e) => {
                      const newArch = JSON.parse(JSON.stringify(arch));
                      newArch.chapters[i].title = e.target.value;
                      onUpdateArch(newArch);
                    }}
                  />
                </div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-600/10 border border-amber-600/20 rounded-full">
                  <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                  <input
                    className="bg-transparent border-none text-[9px] font-bold text-amber-500 uppercase p-0 focus:ring-0 w-24"
                    value={chapter.emotionalTone}
                    onChange={(e) => {
                      const newArch = JSON.parse(JSON.stringify(arch));
                      newArch.chapters[i].emotionalTone = e.target.value;
                      onUpdateArch(newArch);
                    }}
                  />
                </div>
                <textarea
                  className="w-full bg-transparent border-none text-[11px] text-neutral-400 leading-relaxed resize-none focus:ring-0 focus:text-neutral-200 p-0"
                  rows={3}
                  value={chapter.summary}
                  onChange={(e) => {
                    const newArch = JSON.parse(JSON.stringify(arch));
                    newArch.chapters[i].summary = e.target.value;
                    onUpdateArch(newArch);
                  }}
                />
              </div>

              <div className="md:w-3/4 space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
                    <MessageSquare className="w-3 h-3" /> 場景序列描述
                  </span>
                  <button
                    onClick={() => handleAddScene(i)}
                    className="flex items-center gap-1 px-2 py-0.5 bg-amber-600/10 hover:bg-amber-600 text-amber-500 hover:text-white rounded text-[9px] font-bold transition-all"
                  >
                    <Plus className="w-3 h-3" /> 新增場景
                  </button>
                </div>
                
                <div className="grid grid-cols-1 gap-1.5">
                  {chapter.scenes.map((scene, si) => (
                    <div key={si} className="flex items-center gap-3 p-1.5 bg-white/5 rounded-lg border border-white/5 hover:border-amber-600/20 transition-all group/scene">
                      {/* 編號 */}
                      <div className="w-5 h-5 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center shrink-0">
                        <span className="text-[8px] font-mono text-neutral-500">{si+1}</span>
                      </div>

                      {/* 場景描述框 - 縮減高度 */}
                      <div className="flex-1 min-w-0">
                        <textarea
                          className="w-full bg-transparent border-none text-[11px] text-neutral-300 leading-snug resize-none focus:ring-0 focus:text-white p-0 h-auto"
                          rows={1}
                          value={scene}
                          onChange={(e) => handleUpdateScene(i, si, e.target.value)}
                          placeholder="場景描述..."
                          onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = target.scrollHeight + 'px';
                          }}
                        />
                      </div>

                      {/* 操作按鈕群 - 更緊湊 */}
                      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover/scene:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleMoveScene(i, si, 'up')} 
                          className="p-1 hover:bg-white/10 text-neutral-500 hover:text-amber-500 rounded transition-colors"
                          title="上移"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleMoveScene(i, si, 'down')} 
                          className="p-1 hover:bg-white/10 text-neutral-500 hover:text-amber-500 rounded transition-colors"
                          title="下移"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleRemoveScene(i, si)} 
                          className="p-1 hover:bg-red-500/10 text-neutral-500 hover:text-red-500 rounded transition-colors"
                          title="刪除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {chapter.scenes.length === 0 && (
                    <div className="py-4 border border-dashed border-white/10 rounded-lg text-center">
                      <p className="text-[8px] text-neutral-600 uppercase tracking-widest">目前尚無場景</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
