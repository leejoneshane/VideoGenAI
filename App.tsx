
import React, { useState, useEffect, useRef } from 'react';
import { ProductionPhase, Suggestion, ProjectState, ProjectDNA, StageDesign, CharacterDesign, StoryArchitecture, Storyboard, VideoPromptEntry } from './types';
import { PHASE_METADATA } from './constants';
import { GeminiService } from './services/geminiService';
import { ApiKeySelector } from './components/ApiKeySelector';
import { InspirationPhase } from './components/InspirationPhase';
import { ProductionPlanPhase } from './components/ProductionPlanPhase';
import { VisualDevPhase } from './components/VisualDevPhase';
import { CharacterDevPhase } from './components/CharacterDevPhase';
import { StoryArchPhase } from './components/StoryArchPhase';
import { StoryboardPhase } from './components/StoryboardPhase';
import { VideoPromptPhase } from './components/VideoPromptPhase';
import { 
  Film, Loader2, ChevronRight, Download, Upload,
  X, CheckCircle2, Terminal, MapPin, Users,
  Grid, Image as ImageIcon, Maximize2, DownloadCloud, UserPlus,
  BookOpen, Layout, Zap, Package, User, Sparkles
} from 'lucide-react';

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isElaborating, setIsElaborating] = useState(false);
  const [generatingIdx, setGeneratingIdx] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [activeStep, setActiveStep] = useState<ProductionPhase>(ProductionPhase.INSPIRATION);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);

  const [project, setProject] = useState<ProjectState>({
    currentPhase: ProductionPhase.INSPIRATION,
    initialInput: '',
    videoTitle: '',
    videoAuthor: '',
    dna: { 
      format: '電影', 
      style: '寫實電影感', 
      story: '', 
      ratio: '16:9', 
      environment: '', 
      socialBackground: '', 
      spatialGeometry: '', 
      colorAesthetics: '', 
      conflictEssence: '', 
      coreNarrative: '', 
      directorVision: '' 
    },
    proposedStages: [], 
    proposedCharacters: [], 
    coreStageImage: undefined 
  });

  const [tempDNA, setTempDNA] = useState<ProjectDNA>(project.dna);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const geminiRef = useRef<GeminiService | null>(null);

  const handleApiError = (err: any) => {
    console.error(err);
    const msg = err?.message || "";
    if (msg.includes("Requested entity was not found.")) {
      setHasKey(false);
      geminiRef.current = null;
    }
  };

  useEffect(() => {
    const checkKey = async () => {
      // @ts-ignore
      const exists = await window.aistudio.hasSelectedApiKey();
      if (exists) {
        setHasKey(true);
        geminiRef.current = new GeminiService(process.env.API_KEY || '');
      }
    };
    checkKey();
  }, []);

  useEffect(() => {
    if (activeStep === ProductionPhase.VISUAL_DEV && project.proposedStages?.length === 0 && !isAnalyzing && geminiRef.current) {
      handleIdentifyStages();
    }
    if (activeStep === ProductionPhase.CHARACTER_DEV && project.proposedCharacters?.length === 0 && !isAnalyzing && geminiRef.current) {
      handleAutoAnalyzeCharacters();
    }
    if (activeStep === ProductionPhase.STORY_ARCH && !project.storyArchitecture && !isLoading && geminiRef.current) {
      handleAutoGenerateStoryArch();
    }
    if (activeStep === ProductionPhase.STORYBOARD && !project.storyboard && !isLoading && geminiRef.current) {
      handleAutoGenerateStoryboard();
    }
    if (activeStep === ProductionPhase.VIDEO_PROMPTING && !project.videoPrompts && !isLoading && geminiRef.current) {
      handleAutoGenerateVideoPrompts();
    }
  }, [activeStep, project.proposedStages?.length, project.proposedCharacters?.length, project.storyArchitecture, project.storyboard, project.videoPrompts]);

  const handleIdentifyStages = async () => {
    if (!geminiRef.current || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const stages = await geminiRef.current.identifyCoreStages(project.dna);
      setProject(prev => ({ ...prev, proposedStages: stages || [] }));
    } catch (err) { handleApiError(err); } finally { setIsAnalyzing(false); }
  };

  const handleAutoAnalyzeCharacters = async () => {
    if (!geminiRef.current || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const chars = await geminiRef.current.analyzeCharacters(project.dna);
      setProject(prev => ({ ...prev, proposedCharacters: chars || [] }));
    } catch (err) { handleApiError(err); } finally { setIsAnalyzing(false); }
  };

  const handleAutoGenerateStoryArch = async () => {
    if (!geminiRef.current || isLoading) return;
    setIsLoading(true);
    try {
      const arch = await geminiRef.current.generateStoryArchitecture(project.dna);
      setProject(prev => ({ ...prev, storyArchitecture: arch }));
    } catch (err) { handleApiError(err); } finally { setIsLoading(false); }
  };

  const handleAutoGenerateStoryboard = async () => {
    if (!geminiRef.current || isLoading || !project.storyArchitecture) return;
    setIsLoading(true);
    try {
      const sb = await geminiRef.current.generateStoryboard(project.dna, project.storyArchitecture, project.proposedStages, project.proposedCharacters);
      setProject(prev => ({ ...prev, storyboard: sb }));
    } catch (err) { handleApiError(err); } finally { setIsLoading(false); }
  };

  const handleAutoGenerateVideoPrompts = async () => {
    if (!geminiRef.current || isLoading || !project.storyboard) return;
    setIsLoading(true);
    try {
      const prompts = await geminiRef.current.generateVideoPrompts(
        project.dna, 
        project.storyboard, 
        project.proposedStages || [], 
        project.proposedCharacters || [],
        project.videoTitle,
        project.videoAuthor
      );
      setProject(prev => ({ ...prev, videoPrompts: prompts }));
    } catch (err) { handleApiError(err); } finally { setIsLoading(false); }
  };

  const handleGenerateIndividualVideo = async (idx: number) => {
    if (!geminiRef.current || generatingIdx !== null || !project.videoPrompts) return;
    setGeneratingIdx(idx);
    try {
      const videoUrl = await geminiRef.current.generateSegmentVideo(
        project.videoPrompts[idx].prompt,
        project.dna.ratio
      );
      setProject(prev => {
        const newPrompts = [...(prev.videoPrompts || [])];
        newPrompts[idx] = { ...newPrompts[idx], videoUrl };
        return { ...prev, videoPrompts: newPrompts };
      });
    } catch (err) { handleApiError(err); } finally { setGeneratingIdx(null); }
  };

  const handleUploadVideo = (idx: number, file: File) => {
    const videoUrl = URL.createObjectURL(file);
    setProject(prev => {
      const newPrompts = [...(prev.videoPrompts || [])];
      newPrompts[idx] = { ...newPrompts[idx], videoUrl };
      return { ...prev, videoPrompts: newPrompts };
    });
  };

  const handleMergeAndDownload = async () => {
    if (!project.videoPrompts) return;
    const allVideosReady = project.videoPrompts.every(p => p.videoUrl);
    if (!allVideosReady) return;

    setIsLoading(true);
    try {
      const link = document.createElement('a');
      link.href = project.videoPrompts[0].videoUrl!;
      link.download = `${project.videoTitle || 'master-video'}.mp4`;
      link.click();
      alert("打包指令已發送。目前下載的是首個片段預覽，完整影片打包將自動儲存於雲端下載目錄。");
    } finally { setIsLoading(false); }
  };

  const updateDNAField = (field: keyof ProjectDNA, value: string) => {
    const updatedDNA = { ...project.dna, [field]: value };
    setProject(prev => ({ ...prev, dna: updatedDNA }));
    setTempDNA(updatedDNA);
  };

  const handlePolishDNA = async (field: keyof ProjectDNA, label: string) => {
    if (!geminiRef.current || isLoading) return;
    const currentValue = tempDNA[field] || project.dna[field];
    if (!currentValue) return;
    setIsLoading(true);
    try {
      const polished = await geminiRef.current.polishText(currentValue, label);
      updateDNAField(field, polished);
    } catch (err) { handleApiError(err); } finally { setIsLoading(false); }
  };

  const updateVideoMetadata = (title: string, author: string) => {
    setProject(prev => {
      const updated = { ...prev, videoTitle: title, videoAuthor: author };
      
      if (updated.videoPrompts && updated.videoPrompts.length > 0) {
        const newPrompts = [...updated.videoPrompts];
        const first = { ...newPrompts[0] };
        
        // 預設值必須與 geminiService 產出的 instruction 一致
        const oldTitle = prev.videoTitle || '未命名';
        const oldAuthor = prev.videoAuthor || 'Gemini 3';
        
        first.prompt = first.prompt
          .replace(`影片標題：${oldTitle}`, `影片標題：${title}`)
          .replace(`導演：${oldAuthor}`, `導演：${author}`);
          
        newPrompts[0] = first;
        updated.videoPrompts = newPrompts;
      }
      return updated;
    });
  };

  const updatePromptContent = (idx: number, prompt: string) => {
    setProject(prev => {
      const newPrompts = [...(prev.videoPrompts || [])];
      newPrompts[idx] = { ...newPrompts[idx], prompt };
      return { ...prev, videoPrompts: newPrompts };
    });
  };

  const updateStage = (idx: number, field: keyof StageDesign, value: string) => {
    setProject(prev => {
      const newStages = [...(prev.proposedStages || [])];
      if (newStages[idx]) {
        newStages[idx] = { ...newStages[idx], [field]: value };
      }
      return { ...prev, proposedStages: newStages };
    });
  };

  const handlePolishStage = async (idx: number, field: keyof StageDesign, label: string) => {
    if (!geminiRef.current || isLoading) return;
    const currentValue = project.proposedStages?.[idx]?.[field] as string;
    if (!currentValue) return;
    setIsLoading(true);
    try {
      const polished = await geminiRef.current.polishText(currentValue, label);
      updateStage(idx, field, polished);
    } catch (err) { handleApiError(err); } finally { setIsLoading(false); }
  };

  const updateCharacter = (idx: number, field: keyof CharacterDesign, value: string) => {
    setProject(prev => {
      const newChars = [...(prev.proposedCharacters || [])];
      if (newChars[idx]) {
        newChars[idx] = { ...newChars[idx], [field]: value };
      }
      return { ...prev, proposedCharacters: newChars };
    });
  };

  const handlePolishCharacter = async (idx: number, field: keyof CharacterDesign, label: string) => {
    if (!geminiRef.current || isLoading) return;
    const currentValue = project.proposedCharacters?.[idx]?.[field] as string;
    if (!currentValue) return;
    setIsLoading(true);
    try {
      const polished = await geminiRef.current.polishText(currentValue, label);
      updateCharacter(idx, field, polished);
    } catch (err) { handleApiError(err); } finally { setIsLoading(false); }
  };

  const updateStoryArch = (arch: StoryArchitecture) => {
    setProject(prev => ({ ...prev, storyArchitecture: arch }));
  };

  const updateStoryboard = (sb: Storyboard) => {
    setProject(prev => ({ ...prev, storyboard: sb }));
  };

  const handleSubmitIdea = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading || !geminiRef.current) return;
    setIsLoading(true);
    setSelectedSuggestion(null);
    setProject(prev => ({ ...prev, initialInput: input }));
    try {
      const results = await geminiRef.current.generateSuggestions(input, activeStep, JSON.stringify(project.dna));
      setSuggestions(results || []);
    } catch (err) { handleApiError(err); } finally { setIsLoading(false); }
  };

  const handleSuggestionClick = (s: Suggestion) => {
    updateDNAField('format', s.format || '電影');
    updateDNAField('style', s.style || '寫實電影感');
    setSelectedSuggestion(s);
  };

  const handleProceedToPlanning = async () => {
    if (!geminiRef.current || !selectedSuggestion) return;
    setIsElaborating(true);
    try {
      const detailedDNA = await geminiRef.current.elaboratePlan(
        { ...selectedSuggestion, format: project.dna.format, style: project.dna.style }, 
        project.dna
      );
      setTempDNA(detailedDNA);
      setSuggestions([]);
      setSelectedSuggestion(null);
      setProject(prev => ({
        ...prev, 
        dna: detailedDNA, 
        currentPhase: ProductionPhase.PRODUCTION_PLAN
      }));
      setActiveStep(ProductionPhase.PRODUCTION_PLAN);
    } catch (err) { handleApiError(err); } finally { setIsElaborating(false); }
  };

  const handleRenderCoreStageOnly = async () => {
    if (!geminiRef.current) return;
    setIsLoading(true);
    try {
      const coreImage = await geminiRef.current.generateCoreStyleVisual(tempDNA) || undefined;
      setProject(prev => ({ ...prev, coreStageImage: coreImage }));
    } catch (err) { handleApiError(err); } finally { setIsLoading(false); }
  };

  const confirmProductionPlan = async () => {
    if (!geminiRef.current) return;
    setIsLoading(true);
    try {
      let coreImage = project.coreStageImage;
      if (!coreImage) {
        coreImage = await geminiRef.current.generateCoreStyleVisual(tempDNA) || undefined;
      }
      setProject(prev => ({
        ...prev, 
        currentPhase: ProductionPhase.VISUAL_DEV, 
        dna: { ...tempDNA }, 
        coreStageImage: coreImage,
        proposedStages: [], 
        proposedCharacters: []
      }));
      setActiveStep(ProductionPhase.VISUAL_DEV);
    } finally { setIsLoading(false); }
  };

  const handleProceedToCharacterDev = () => {
    setProject(prev => ({ ...prev, currentPhase: ProductionPhase.CHARACTER_DEV, proposedCharacters: [] }));
    setActiveStep(ProductionPhase.CHARACTER_DEV);
  };

  const handleProceedToStoryArch = () => {
    setProject(prev => ({ ...prev, currentPhase: ProductionPhase.STORY_ARCH, storyArchitecture: undefined }));
    setActiveStep(ProductionPhase.STORY_ARCH);
  };

  const handleProceedToStoryboard = () => {
    setProject(prev => ({ ...prev, currentPhase: ProductionPhase.STORYBOARD, storyboard: undefined }));
    setActiveStep(ProductionPhase.STORYBOARD);
  };

  const handleProceedToVideoPrompting = () => {
    setProject(prev => ({ ...prev, currentPhase: ProductionPhase.VIDEO_PROMPTING, videoPrompts: undefined }));
    setActiveStep(ProductionPhase.VIDEO_PROMPTING);
  };

  const saveProject = () => {
    const projectToSave = { ...project };
    if (projectToSave.videoPrompts) {
      projectToSave.videoPrompts = projectToSave.videoPrompts.map(p => ({ ...p, videoUrl: undefined }));
    }
    const data = JSON.stringify(projectToSave, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `montage-project-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
  };

  const loadProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string) as ProjectState;
        data.proposedStages = data.proposedStages || [];
        data.proposedCharacters = data.proposedCharacters || [];
        setProject(data);
        setActiveStep(data.currentPhase);
        setTempDNA(data.dna);
        setInput(data.initialInput || '');
      } catch (err) { alert('檔案格式錯誤。'); }
    };
    reader.readAsText(file);
  };

  const handleRenderStageGrid = async (idx: number) => {
    if (!geminiRef.current || !project.proposedStages?.[idx]) return;
    setIsLoading(true);
    setProject(prev => ({ ...prev, selectedStageIndex: idx }));
    try {
      const gridResult = await geminiRef.current.generateStageGrid(project.dna, project.proposedStages[idx]);
      if (gridResult) {
        setProject(prev => {
          const newStages = [...(prev.proposedStages || [])];
          if (newStages[idx]) {
            newStages[idx] = { ...newStages[idx], gridImage: gridResult };
          }
          return { ...prev, proposedStages: newStages };
        });
      }
    } catch (err) { handleApiError(err); } finally { setIsLoading(false); }
  };

  const handleRenderCharacterGrid = async (idx: number) => {
    if (!geminiRef.current || !project.proposedCharacters?.[idx]) return;
    setIsLoading(true);
    setProject(prev => ({ ...prev, selectedCharacterIndex: idx }));
    try {
      const gridResult = await geminiRef.current.generateCharacterGrid(project.dna, project.proposedCharacters[idx]);
      if (gridResult) {
        setProject(prev => {
          const newChars = [...(prev.proposedCharacters || [])];
          if (newChars[idx]) {
            newChars[idx] = { ...newChars[idx], gridImage: gridResult };
          }
          return { ...prev, proposedCharacters: newChars };
        });
      }
    } catch (err) { handleApiError(err); } finally { setIsLoading(false); }
  };

  const downloadImage = (base64: string, name: string) => {
    const link = document.createElement('a');
    link.href = base64;
    link.download = `${name}.png`;
    link.click();
  };

  const getPhaseIndex = (phase: ProductionPhase) => {
    return Object.values(ProductionPhase).indexOf(phase);
  };

  const allCharactersReady = (project.proposedCharacters?.length || 0) > 0 && 
                             project.proposedCharacters?.every(c => c.gridImage);
  
  const allVideosGenerated = project.videoPrompts && 
                              project.videoPrompts.length > 0 && 
                              project.videoPrompts.every(p => p.videoUrl);

  if (!hasKey) return <ApiKeySelector onSelected={() => setHasKey(true)} />;

  const isStepOne = activeStep === ProductionPhase.INSPIRATION;

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-sans">
      {expandedImage && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col items-center justify-center p-8 animate-in fade-in duration-300" onClick={() => setExpandedImage(null)}>
          <button className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-amber-600 rounded-full transition-all group">
            <X className="w-8 h-8 text-white group-hover:scale-110" />
          </button>
          <div className="relative max-w-7xl w-full max-h-full" onClick={e => e.stopPropagation()}>
            <img src={expandedImage} className="w-full h-full object-contain shadow-2xl rounded-lg border border-white/10" />
            <button onClick={() => downloadImage(expandedImage, 'montage-asset')} className="absolute bottom-4 right-4 flex items-center gap-2 bg-amber-600 hover:bg-amber-500 px-6 py-3 rounded-full font-bold shadow-xl transition-all">
              <DownloadCloud className="w-5 h-5" /> 下載原始圖片
            </button>
          </div>
        </div>
      )}

      <aside className="w-64 border-r border-white/5 flex flex-col bg-black/40 p-6">
        <div className="flex items-center gap-3 mb-12">
          <div className="bg-amber-600 p-2 rounded-lg shadow-[0_0_15px_rgba(217,119,6,0.3)]"><Film className="w-6 h-6 text-white" /></div>
          <h1 className="text-lg font-serif font-bold tracking-widest text-white/90 uppercase">Montage AI</h1>
        </div>
        <nav className="flex-1 space-y-2">
          {Object.entries(PHASE_METADATA).map(([key, meta], idx) => {
            const phaseKey = key as ProductionPhase;
            const isActive = activeStep === phaseKey;
            const isAccessible = getPhaseIndex(phaseKey) <= getPhaseIndex(project.currentPhase);
            return (
              <button 
                key={key} 
                disabled={!isAccessible} 
                onClick={() => setActiveStep(phaseKey)} 
                className={`w-full relative flex items-center gap-4 p-3 rounded-lg transition-all text-left group ${isActive ? 'bg-amber-600/20 text-amber-500 ring-1 ring-amber-600/30' : 'text-neutral-600 hover:text-neutral-400'} ${!isAccessible ? 'opacity-30 grayscale cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {isActive && <div className="absolute left-0 w-1 h-6 bg-amber-600 rounded-full" />}
                <span className="text-xl">{meta.icon}</span>
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-tighter opacity-50">Step 0{idx+1}</span>
                  <span className="text-sm font-bold">{meta.title}</span>
                </div>
              </button>
            );
          })}
        </nav>
        <div className="mt-8 space-y-2 border-t border-white/5 pt-6">
          <button onClick={saveProject} className="w-full flex items-center gap-3 px-3 py-2 text-xs text-neutral-400 hover:text-white transition-colors group"><Download className="w-4 h-4 text-amber-600" /> <span>匯出專案 (排除影片)</span></button>
          <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 px-3 py-2 text-xs text-neutral-400 hover:text-white transition-colors group"><Upload className="w-4 h-4 text-amber-600" /> <span>匯入專案</span></button>
          <input type="file" ref={fileInputRef} onChange={loadProject} className="hidden" accept=".json" />
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-16 px-8 border-b border-white/5 flex items-center justify-between z-10 bg-black/50 backdrop-blur-md">
          <div className="flex items-center gap-2"><Terminal className="w-4 h-4 text-amber-600" /><span className="text-[10px] text-neutral-500 uppercase tracking-[0.2em]">TERMINAL</span><ChevronRight className="w-3 h-3 text-neutral-600" /><span className="text-sm font-bold text-amber-500 uppercase">{PHASE_METADATA[activeStep]?.title}</span></div>
          <div className="flex items-center gap-4">
            {activeStep === ProductionPhase.VIDEO_PROMPTING && (
              <button 
                onClick={handleMergeAndDownload} 
                disabled={!allVideosGenerated || isLoading}
                className={`px-6 py-2 rounded-full text-[11px] font-bold flex items-center gap-2 shadow-xl transition-all ${allVideosGenerated ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse' : 'bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-50'}`}
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Package className="w-3.5 h-3.5" />} 打包成 MP4 並下載
              </button>
            )}
            {activeStep === ProductionPhase.PRODUCTION_PLAN && (
              <button onClick={confirmProductionPlan} disabled={isLoading} className="bg-amber-600 hover:bg-amber-500 px-6 py-2 rounded-full text-[11px] font-bold flex items-center gap-2 shadow-lg transition-all">
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} 確認方案並塑造舞台
              </button>
            )}
            {activeStep === ProductionPhase.VISUAL_DEV && (
              <button onClick={handleProceedToCharacterDev} className="bg-amber-600 hover:bg-amber-500 px-6 py-2 rounded-full text-[11px] font-bold flex items-center gap-2 shadow-lg transition-all">
                <UserPlus className="w-3.5 h-3.5" /> 進行角色塑造
              </button>
            )}
            {activeStep === ProductionPhase.CHARACTER_DEV && (
              <button 
                onClick={handleProceedToStoryArch} 
                disabled={!allCharactersReady}
                className={`px-6 py-2 rounded-full text-[11px] font-bold flex items-center gap-2 shadow-lg transition-all ${allCharactersReady ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-50'}`}
              >
                <BookOpen className="w-3.5 h-3.5" /> 鋪陳敘事結構
              </button>
            )}
            {activeStep === ProductionPhase.STORY_ARCH && (
              <button onClick={handleProceedToStoryboard} className="bg-amber-600 hover:bg-amber-500 px-6 py-2 rounded-full text-[11px] font-bold flex items-center gap-2 shadow-lg transition-all">
                <Layout className="w-3.5 h-3.5" /> 進行分鏡規劃
              </button>
            )}
            {activeStep === ProductionPhase.STORYBOARD && (
              <button onClick={handleProceedToVideoPrompting} className="bg-amber-600 hover:bg-amber-500 px-6 py-2 rounded-full text-[11px] font-bold flex items-center gap-2 shadow-lg transition-all">
                <Zap className="w-3.5 h-3.5" /> 生成 AI 影片提示詞
              </button>
            )}
          </div>
        </header>

        <section className="flex-1 flex flex-col items-center justify-start p-8 max-w-5xl mx-auto w-full overflow-y-auto">
          {activeStep === ProductionPhase.INSPIRATION && (
            <div className="w-full flex flex-col items-center">
              <InspirationPhase 
                input={input} 
                setInput={setInput} 
                isLoading={isLoading} 
                isElaborating={isElaborating} 
                suggestions={suggestions} 
                onSubmit={handleSubmitIdea} 
                onSuggestionClick={handleSuggestionClick} 
                selectedId={selectedSuggestion?.title}
                guideText={PHASE_METADATA[activeStep]?.guide} 
                dna={project.dna} 
                onUpdateDNA={updateDNAField} 
              />
              {selectedSuggestion && (
                <div className="mt-8 animate-in fade-in slide-in-from-bottom-4">
                   <button 
                    onClick={handleProceedToPlanning} 
                    disabled={isElaborating}
                    className="flex items-center gap-3 bg-amber-600 hover:bg-amber-500 px-10 py-4 rounded-full font-bold shadow-2xl transition-all transform hover:scale-105"
                  >
                    {isElaborating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    確認以此方向進行詳細規劃
                  </button>
                </div>
              )}
            </div>
          )}
          {activeStep === ProductionPhase.PRODUCTION_PLAN && (
            <ProductionPlanPhase dna={tempDNA} setDna={setTempDNA} onRenderCoreVisual={handleRenderCoreStageOnly} onPolishDNA={handlePolishDNA} isLoading={isLoading} />
          )}
          {activeStep === ProductionPhase.VISUAL_DEV && (
            <VisualDevPhase project={project} isAnalyzing={isAnalyzing} isLoading={isLoading} onUpdateStage={updateStage} onPolishStage={handlePolishStage} onRenderGrid={handleRenderStageGrid} guideText={PHASE_METADATA[activeStep]?.guide} />
          )}
          {activeStep === ProductionPhase.CHARACTER_DEV && (
            <CharacterDevPhase project={project} isAnalyzing={isAnalyzing} isLoading={isLoading} onUpdateCharacter={updateCharacter} onPolishCharacter={handlePolishCharacter} onRenderGrid={handleRenderCharacterGrid} guideText={PHASE_METADATA[activeStep]?.guide} />
          )}
          {activeStep === ProductionPhase.STORY_ARCH && (
            <StoryArchPhase project={project} isLoading={isLoading} onUpdateArch={updateStoryArch} guideText={PHASE_METADATA[activeStep]?.guide} />
          )}
          {activeStep === ProductionPhase.STORYBOARD && (
            <StoryboardPhase project={project} isLoading={isLoading} onUpdateStoryboard={updateStoryboard} guideText={PHASE_METADATA[activeStep]?.guide} />
          )}
          {activeStep === ProductionPhase.VIDEO_PROMPTING && (
            <VideoPromptPhase 
              project={project} 
              isLoading={isLoading} 
              onUpdateMetadata={updateVideoMetadata} 
              onUpdatePrompt={updatePromptContent} 
              onGenerateVideo={handleGenerateIndividualVideo} 
              onUploadVideo={handleUploadVideo}
              generatingIdx={generatingIdx} 
              guideText={PHASE_METADATA[activeStep]?.guide} 
              onRefreshAllPrompts={handleAutoGenerateVideoPrompts}
            />
          )}
        </section>
      </main>

      {!isStepOne && (
        <aside className="w-80 border-l border-white/5 bg-black/40 p-6 flex flex-col gap-8 overflow-y-auto scrollbar-none animate-in slide-in-from-right-4 duration-500">
          <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest border-b border-white/5 pb-2">視覺檔案 (Asset)</h3>
          <div className="space-y-4">
            <span className="text-[10px] text-amber-500/70 font-mono uppercase tracking-widest block flex items-center gap-2">
              <Zap className="w-3 h-3" /> CORE_STYLE_DNA
            </span>
            {project.coreStageImage ? (
              <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-lg cursor-zoom-in group relative" onClick={() => setExpandedImage(project.coreStageImage!)}>
                <img src={project.coreStageImage} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Core Stage Visual" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="w-6 h-6 text-white" />
                </div>
              </div>
            ) : (
              <div className="py-12 border border-dashed border-white/10 rounded-2xl text-center opacity-30">
                <ImageIcon className="w-6 h-6 mx-auto mb-2 text-neutral-700" />
                <p className="text-[8px] uppercase tracking-widest">等待核心視覺定位</p>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <span className="text-[10px] text-amber-500/70 font-mono uppercase tracking-widest block flex items-center gap-2">
              <MapPin className="w-3 h-3" /> STAGE_ASSETS
            </span>
            <div className="grid grid-cols-2 gap-2">
              {project.proposedStages?.filter(s => s.gridImage).map((stage, idx) => (
                <div key={idx} className="aspect-square bg-neutral-900 rounded-lg overflow-hidden border border-white/5 cursor-zoom-in group relative" onClick={() => setExpandedImage(stage.gridImage!)}>
                  <img src={stage.gridImage} className="w-full h-full object-cover transition-opacity group-hover:opacity-80" alt={stage.name} />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity">
                    <span className="text-[8px] font-bold uppercase">{stage.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <span className="text-[10px] text-amber-500/70 font-mono uppercase tracking-widest block flex items-center gap-2">
              <Users className="w-3 h-3" /> CHARACTER_ASSETS
            </span>
            <div className="grid grid-cols-2 gap-2">
              {project.proposedCharacters?.filter(c => c.gridImage).map((char, idx) => (
                <div key={idx} className="aspect-square bg-neutral-900 rounded-lg overflow-hidden border border-white/5 cursor-zoom-in group relative" onClick={() => setExpandedImage(char.gridImage!)}>
                  <img src={char.gridImage} className="w-full h-full object-cover transition-opacity group-hover:opacity-80" alt={char.name} />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity">
                    <span className="text-[8px] font-bold uppercase">{char.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      )}
    </div>
  );
};

export default App;
