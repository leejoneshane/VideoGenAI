
import React, { useEffect } from 'react';
// Added Plus and Trash2 to the imports from lucide-react
import { Loader2, Info, BookOpen, Video, Move, Plus, Trash2 } from 'lucide-react';
import { ProjectState, Storyboard, StoryboardEntry } from '../types';

interface StoryboardPhaseProps {
  project: ProjectState;
  isLoading: boolean;
  onUpdateStoryboard: (sb: Storyboard) => void;
  guideText: string;
}

export const StoryboardPhase: React.FC<StoryboardPhaseProps> = ({
  project, isLoading, onUpdateStoryboard, guideText
}) => {
  const sb = project.storyboard;

  useEffect(() => {
    if (sb && sb.entries.length > 0) {
      let needsFix = false;
      const fixedEntries = sb.entries.map(entry => {
        let { startTime, endTime } = entry;
        if (startTime && startTime.includes('-')) {
          const parts = startTime.split('-').map(p => p.trim());
          startTime = parts[0];
          endTime = parts[1] || endTime;
          needsFix = true;
        }
        if (endTime && endTime.includes('-')) {
          const parts = endTime.split('-').map(p => p.trim());
          endTime = parts[1] || parts[0];
          needsFix = true;
        }
        return { ...entry, startTime, endTime };
      });
      if (needsFix) onUpdateStoryboard({ entries: fixedEntries });
    }
  }, [sb?.entries.length]); 

  if (isLoading && !sb) {
    return (
      <div className="py-20 flex flex-col items-center gap-6 animate-pulse">
        <Loader2 className="w-12 h-12 text-amber-600 animate-spin" />
        <p className="text-amber-500 text-xs font-bold uppercase tracking-[0.3em]">AI 正在編寫技術分鏡腳本...</p>
      </div>
    );
  }

  if (!sb) return null;

  const addSeconds = (timeStr: string, secondsToAdd: number) => {
    const parts = (timeStr || "00:00").split(':');
    let m = 0, s = 0;
    if (parts.length === 3) {
      m = parseInt(parts[1]) || 0;
      s = parseInt(parts[2]) || 0;
    } else {
      m = parseInt(parts[0]) || 0;
      s = parseInt(parts[1]) || 0;
    }
    let totalSeconds = m * 60 + s + secondsToAdd;
    if (totalSeconds < 0) totalSeconds = 0;
    const nextM = Math.floor(totalSeconds / 60);
    const nextS = totalSeconds % 60;
    return `${String(nextM).padStart(2, '0')}:${String(nextS).padStart(2, '0')}`;
  };

  const handleUpdateEntry = (idx: number, field: keyof StoryboardEntry, val: string) => {
    const newEntries = [...sb.entries];
    newEntries[idx] = { ...newEntries[idx], [field]: val };
    if (field === 'endTime' && idx < newEntries.length - 1) {
      newEntries[idx + 1] = { ...newEntries[idx + 1], startTime: addSeconds(val, 1) };
    } else if (field === 'startTime' && idx > 0) {
      newEntries[idx - 1] = { ...newEntries[idx - 1], endTime: addSeconds(val, -1) };
    }
    onUpdateStoryboard({ entries: newEntries });
  };

  const handleAddEntry = (idx: number) => {
    const newEntries = [...sb.entries];
    const currentEntry = newEntries[idx];
    const startTime = addSeconds(currentEntry.endTime || "00:00", 1);
    const endTime = addSeconds(startTime, 5);
    const newEntry: StoryboardEntry = {
      startTime,
      endTime,
      stage: project.proposedStages[0]?.name || "舞台名稱",
      character: project.proposedCharacters[0]?.name || "角色姓名",
      shotType: "MCU",
      movement: "STATIC",
      action: "新場景視覺動態...",
      audio: "環境音效..."
    };
    newEntries.splice(idx + 1, 0, newEntry);
    onUpdateStoryboard({ entries: newEntries });
  };

  const handleRemoveEntry = (idx: number) => {
    if (sb.entries.length <= 1) return;
    const newEntries = [...sb.entries];
    newEntries.splice(idx, 1);
    onUpdateStoryboard({ entries: newEntries });
  };

  const formatDisplayTime = (time: string) => {
    if (!time) return "00:00";
    const parts = time.split(':');
    if (parts.length === 3) return `${parts[1]}:${parts[2]}`;
    return time;
  };

  const termGroups = [
    {
      label: '鏡頭類型 (Shot Type)',
      icon: <Video className="w-3 h-3" />,
      terms: [
        { key: 'WS / LS', desc: '遠景：建立場景環境與空間感。' },
        { key: 'MS', desc: '中景：拍攝角色腰部以上，兼顧動作與背景。' },
        { key: 'MCU', desc: '中特寫：胸部以上，聚焦表情與細微反應。' },
        { key: 'CU', desc: '特寫：臉部或局部，強化情緒張力。' },
        { key: 'OTS', desc: '過肩鏡頭：用於對話，建立空間深度與聯繫。' },
        { key: 'POV', desc: '主觀鏡頭：以角色視角觀看，增加代入感。' }
      ]
    },
    {
      label: '運鏡方式 (Movement)',
      icon: <Move className="w-3 h-3" />,
      terms: [
        { key: 'STATIC', desc: '靜止：相機固定，強調構圖與穩定觀察。' },
        { key: 'PAN', desc: '水平平移：相機定點旋轉，掃視空間或追蹤。' },
        { key: 'TILT', desc: '垂直傾斜：相機定點上下俯仰。' },
        { key: 'DOLLY', desc: '推拉運鏡：相機在軌道上前後移動增加深度。' },
        { key: 'ZOOM', desc: '變焦：調整焦距放大焦點（非實體位移）。' },
        { key: 'TRACK', desc: '橫向移動：相機側向移動跟隨主體行動。' }
      ]
    }
  ];

  return (
    <div className="w-full space-y-4 pb-20 animate-in fade-in duration-1000">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-serif text-neutral-100">{guideText}</h2>
        <p className="text-[9px] text-neutral-500 uppercase tracking-widest">規則：次鏡頭起始時間為前鏡頭結束時間 + 1s</p>
      </div>

      <div className="border border-white/10 shadow-2xl bg-black/40 relative overflow-hidden flex flex-col h-[500px] mb-8">
        {/* 表格標題 */}
        <div className="w-full bg-white/5 border-b border-white/10 flex h-8 items-center shrink-0">
          <div className="w-[8%] text-[8px] font-bold text-neutral-500 uppercase tracking-widest text-center border-r border-white/5">Time</div>
          <div className="w-[10%] px-2 text-[8px] font-bold text-neutral-500 uppercase tracking-widest border-r border-white/5">Stage</div>
          <div className="w-[10%] px-2 text-[8px] font-bold text-neutral-500 uppercase tracking-widest border-r border-white/5">Character</div>
          <div className="w-[10%] px-2 text-[8px] font-bold text-neutral-500 uppercase tracking-widest border-r border-white/5">Shot</div>
          <div className="w-[10%] px-2 text-[8px] font-bold text-neutral-500 uppercase tracking-widest border-r border-white/5">Motion</div>
          <div className="w-[27%] px-3 text-[8px] font-bold text-neutral-500 uppercase tracking-widest border-r border-white/5">Action</div>
          <div className="w-[20%] px-3 text-[8px] font-bold text-neutral-500 uppercase tracking-widest border-r border-white/5">Audio</div>
          <div className="w-[5%] px-1 text-[8px] font-bold text-neutral-500 uppercase tracking-widest text-center">Ops</div>
        </div>

        {/* 捲動內容區塊 */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden divide-y divide-white/5">
          {sb.entries.map((entry, idx) => (
            <div key={idx} className="flex hover:bg-amber-600/5 transition-colors group border-b border-white/5 last:border-b-0 min-h-[44px]">
              
              {/* 時間欄位 */}
              <div className="w-[8%] flex flex-col border-r border-white/5 bg-black/40 shrink-0">
                <div className="h-1/2 flex items-center border-b border-white/5">
                  <input
                    className="bg-transparent border-none text-[9px] font-mono font-bold text-amber-600 w-full h-full p-0 focus:ring-0 text-center leading-none"
                    value={formatDisplayTime(entry.startTime)}
                    readOnly={idx === 0}
                    onChange={(e) => handleUpdateEntry(idx, 'startTime', e.target.value)}
                  />
                </div>
                <div className="h-1/2 flex items-center">
                  <input
                    className="bg-transparent border-none text-[9px] font-mono font-bold text-amber-500 w-full h-full p-0 focus:ring-0 text-center leading-none"
                    value={formatDisplayTime(entry.endTime)}
                    onChange={(e) => handleUpdateEntry(idx, 'endTime', e.target.value)}
                  />
                </div>
              </div>

              {/* 其餘欄位均為 Textarea */}
              <div className="w-[10%] px-1.5 py-1.5 border-r border-white/5 flex items-center">
                <textarea
                  className="w-full bg-transparent border-none text-[10px] font-bold text-amber-100 leading-tight resize-none p-0 focus:ring-0 text-center"
                  rows={2}
                  value={entry.stage}
                  onChange={(e) => handleUpdateEntry(idx, 'stage', e.target.value)}
                />
              </div>

              <div className="w-[10%] px-1.5 py-1.5 border-r border-white/5 flex items-center">
                <textarea
                  className="w-full bg-transparent border-none text-[10px] font-bold text-amber-500 leading-tight resize-none p-0 focus:ring-0 text-center"
                  rows={2}
                  value={entry.character}
                  onChange={(e) => handleUpdateEntry(idx, 'character', e.target.value)}
                />
              </div>

              <div className="w-[10%] px-2 py-1.5 border-r border-white/5 flex items-center">
                <textarea
                  className="w-full bg-transparent border-none text-[10px] font-bold text-blue-400 uppercase leading-tight resize-none p-0 focus:ring-0 text-center"
                  rows={2}
                  value={entry.shotType}
                  onChange={(e) => handleUpdateEntry(idx, 'shotType', e.target.value)}
                />
              </div>

              <div className="w-[10%] px-2 py-1.5 border-r border-white/5 flex items-center">
                <textarea
                  className="w-full bg-transparent border-none text-[10px] font-bold text-purple-400 uppercase leading-tight resize-none p-0 focus:ring-0 text-center"
                  rows={2}
                  value={entry.movement}
                  onChange={(e) => handleUpdateEntry(idx, 'movement', e.target.value)}
                />
              </div>

              <div className="w-[27%] px-3 py-1.5 border-r border-white/5 flex items-center">
                <textarea
                  className="w-full bg-transparent border-none text-[10px] text-neutral-200 leading-tight resize-none p-0 focus:ring-0"
                  rows={2}
                  value={entry.action}
                  onChange={(e) => handleUpdateEntry(idx, 'action', e.target.value)}
                />
              </div>

              <div className="w-[20%] px-3 py-1.5 border-r border-white/5 flex items-center">
                <textarea
                  className="w-full bg-transparent border-none text-[9px] text-neutral-400 italic leading-tight resize-none p-0 focus:ring-0"
                  rows={2}
                  value={entry.audio}
                  onChange={(e) => handleUpdateEntry(idx, 'audio', e.target.value)}
                />
              </div>

              {/* 操作 */}
              <div className="w-[5%] px-1 py-1 flex flex-col gap-0.5 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button onClick={() => handleAddEntry(idx)} className="p-0.5 bg-amber-600/10 hover:bg-amber-600 text-amber-500 hover:text-white transition-all rounded">
                  <Plus className="w-2.5 h-2.5" />
                </button>
                <button onClick={() => handleRemoveEntry(idx)} className="p-1 bg-red-500/10 hover:bg-red-500 text-neutral-600 hover:text-white transition-all rounded">
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 名詞解釋區塊 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-bottom-4 duration-700">
        {termGroups.map((group, gIdx) => (
          <div key={gIdx} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <div className="p-1.5 bg-amber-600/10 rounded-lg text-amber-500">{group.icon}</div>
              <h4 className="text-[10px] font-bold text-neutral-300 uppercase tracking-widest">{group.label}</h4>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {group.terms.map((term, tIdx) => (
                <div key={tIdx} className="flex items-start gap-2 group/term">
                  <span className="text-[9px] font-mono font-bold text-amber-600 bg-amber-600/5 px-1.5 py-0.5 rounded border border-amber-600/10 shrink-0 group-hover/term:bg-amber-600 group-hover/term:text-white transition-all">{term.key}</span>
                  <p className="text-[9px] text-neutral-500 leading-relaxed group-hover/term:text-neutral-300 transition-colors">{term.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center pt-6 opacity-30">
        <div className="inline-flex items-center gap-2 text-[9px] font-bold text-neutral-600 uppercase tracking-[0.3em]">
          <BookOpen className="w-3 h-3" /> 專業技術參考 • Technical Guide
        </div>
      </div>
    </div>
  );
};
