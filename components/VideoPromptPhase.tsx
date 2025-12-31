
import React from 'react';
import { Loader2, Play, CheckCircle2, Video, Map, User, Clock, Link, Type, UserCircle, Zap, RefreshCw } from 'lucide-react';
import { ProjectState, VideoPromptEntry } from '../types';

interface VideoPromptPhaseProps {
  project: ProjectState;
  isLoading: boolean;
  onUpdateMetadata: (title: string, author: string) => void;
  onUpdatePrompt: (idx: number, prompt: string) => void;
  onGenerateVideo: (idx: number) => void;
  generatingIdx: number | null;
  guideText: string;
  onRefreshAllPrompts: () => void;
}

export const VideoPromptPhase: React.FC<VideoPromptPhaseProps> = ({
  project, isLoading, onUpdateMetadata, onUpdatePrompt, onGenerateVideo, generatingIdx, guideText, onRefreshAllPrompts
}) => {
  if (isLoading && !project.videoPrompts) {
    return (
      <div className="py-20 flex flex-col items-center gap-6 animate-pulse">
        <Loader2 className="w-12 h-12 text-amber-600 animate-spin" />
        <p className="text-amber-500 text-xs font-bold uppercase tracking-[0.3em]">AI 正在重新構思完整影片指令...</p>
      </div>
    );
  }

  if (!project.videoPrompts) return null;

  return (
    <div className="w-full space-y-8 pb-20 animate-in fade-in duration-1000">
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-serif text-neutral-100">根據拍攝願景，生成完整影片！</h2>
        <p className="text-xs text-neutral-500 max-w-xl mx-auto italic">每個提示詞皆遵循 5 秒原則切分。修改上方資訊後，Shot 1 會自動同步更新；若想重新思考全片，請點擊右側重新規劃按鈕。</p>
      </div>

      {/* 影片元數據編輯區 */}
      <div className="glass p-6 rounded-2xl border-amber-600/10 flex flex-col md:flex-row gap-6 mb-8 items-end">
        <div className="flex-1 space-y-2 w-full">
          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
            <Type className="w-3 h-3 text-amber-500" /> 影片總標題
          </label>
          <input 
            type="text"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-neutral-100 outline-none focus:ring-1 focus:ring-amber-500"
            value={project.videoTitle || ''}
            onChange={(e) => onUpdateMetadata(e.target.value, project.videoAuthor || '')}
            placeholder="輸入影片標題 (會同步至 Shot 1)"
          />
        </div>
        <div className="flex-1 space-y-2 w-full">
          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
            <UserCircle className="w-3 h-3 text-amber-500" /> 導演/作者
          </label>
          <input 
            type="text"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-neutral-100 outline-none focus:ring-1 focus:ring-amber-500"
            value={project.videoAuthor || ''}
            onChange={(e) => onUpdateMetadata(project.videoTitle || '', e.target.value)}
            placeholder="輸入作者 (會同步至 Shot 1)"
          />
        </div>
        <button 
          onClick={onRefreshAllPrompts}
          disabled={isLoading}
          className="px-4 py-3 bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-amber-500 border border-white/10 rounded-xl transition-all group"
          title="根據新元數據重新思考所有提示詞內容"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />}
        </button>
      </div>

      {/* 提示詞卡片清單 */}
      <div className="grid grid-cols-1 gap-4">
        {project.videoPrompts.map((entry, idx) => (
          <div key={idx} className={`glass p-6 rounded-2xl border-white/5 flex flex-col md:flex-row gap-6 hover:border-amber-600/20 transition-all relative overflow-hidden group ${entry.videoUrl ? 'bg-amber-600/5 border-amber-600/10' : ''}`}>
            
            {/* 左側資訊與預覽 */}
            <div className="md:w-1/3 space-y-3 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${idx === 0 ? 'bg-blue-600/20 text-blue-400 border-blue-600/30' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                    {idx === 0 ? 'OPENING' : `SHOT ${entry.shotIdx + 1}`}
                  </span>
                  {entry.isContinuous && (
                    <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-tighter flex items-center gap-1">
                      <Link className="w-3 h-3" /> Cont.
                    </span>
                  )}
                </div>
                {entry.videoUrl && <CheckCircle2 className="w-4 h-4 text-green-500" />}
              </div>
              
              {entry.videoUrl ? (
                <div className="aspect-video bg-black rounded-xl overflow-hidden border border-white/10 relative group/vid shadow-inner">
                  <video 
                    key={entry.videoUrl} 
                    src={entry.videoUrl} 
                    className="w-full h-full object-cover" 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    controls
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover/vid:opacity-100 transition-opacity">
                    <p className="text-[8px] text-white/60 font-mono text-center">本地緩存預覽已就緒</p>
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-black/40 rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-2 opacity-50">
                  <Video className="w-6 h-6 text-neutral-600" />
                  <span className="text-[8px] uppercase tracking-widest text-neutral-500">等待生成影片內容</span>
                </div>
              )}
            </div>

            {/* 右側提示詞編輯區 */}
            <div className="flex-1 flex flex-col gap-3">
              {/* 元數據行 */}
              <div className="flex items-center gap-4 px-1">
                <div className="flex items-center gap-1.5 text-[9px] text-neutral-400 font-mono">
                  <Clock className="w-3 h-3 text-neutral-600" /> {entry.timeRange}
                </div>
                <div className="flex items-center gap-1.5 text-[9px] text-neutral-400">
                  <Map className="w-3 h-3 text-neutral-600" /> {entry.stageRef}
                </div>
                {entry.charRef !== "N/A" && (
                  <div className="flex items-center gap-1.5 text-[9px] text-neutral-400">
                    <User className="w-3 h-3 text-neutral-600" /> {entry.charRef}
                  </div>
                )}
              </div>

              <div className="relative">
                <div className="absolute -top-2 left-3 px-2 bg-neutral-900 text-[9px] font-bold text-neutral-500 uppercase tracking-widest border border-white/5 rounded z-10">VIDEO GENERATION PROMPT</div>
                <textarea 
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-4 pt-6 text-sm text-amber-100/80 font-mono leading-relaxed resize-none focus:ring-1 focus:ring-amber-600 outline-none transition-colors"
                  rows={3}
                  value={entry.prompt}
                  onChange={(e) => onUpdatePrompt(idx, e.target.value)}
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => onGenerateVideo(idx)}
                  disabled={generatingIdx !== null}
                  className={`flex items-center gap-2 px-6 py-2 rounded-full text-[11px] font-bold transition-all shadow-lg ${entry.videoUrl ? 'bg-green-600/20 text-green-400 border border-green-600/30' : 'bg-amber-600 hover:bg-amber-500 text-white'}`}
                >
                  {generatingIdx === idx ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> 影片轉碼中...</>
                  ) : entry.videoUrl ? (
                    <><Play className="w-3.5 h-3.5" /> 重新拍攝片段</>
                  ) : (
                    <><Zap className="w-3.5 h-3.5" /> 生成影片片段</>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
