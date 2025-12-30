
import React, { useState, useEffect, useRef } from 'react';
import { ProductionPhase, Suggestion, ProjectState, ProjectDNA, StageDesign, CharacterDesign } from './types';
import { PHASE_METADATA } from './constants';
import { GeminiService } from './services/geminiService';
import { ApiKeySelector } from './components/ApiKeySelector';
import { InspirationPhase } from './components/InspirationPhase';
import { ProductionPlanPhase } from './components/ProductionPlanPhase';
import { VisualDevPhase } from './components/VisualDevPhase';
import { CharacterDevPhase } from './components/CharacterDevPhase';
import { 
  Film, Loader2, ArrowRight, 
  ChevronRight, Download, Upload,
  X, CheckCircle2, Terminal, MapPin, Users, Target,
  Grid, Image as ImageIcon, Maximize2, DownloadCloud, UserPlus
} from 'lucide-react';

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isElaborating, setIsElaborating] = useState(false);
  const [input, setInput] = useState('');
  const [activeStep, setActiveStep] = useState<ProductionPhase>(ProductionPhase.INSPIRATION);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  
  const [project, setProject] = useState<ProjectState>({
    currentPhase: ProductionPhase.INSPIRATION,
    initialInput: '',
    dna: { format: '電影', style: '寫實電影感 (Realistic Cinematic)', story: '', ratio: '16:9', environment: '', socialBackground: '', coreNarrative: '' },
    suggestions: [], proposedStages: [], proposedCharacters: [], history: [], generatedVideos: [], sceneGrid: []
  });

  const [tempDNA, setTempDNA] = useState<ProjectDNA>(project.dna);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const geminiRef = useRef<GeminiService | null>(null);

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
    if (activeStep === ProductionPhase.INSPIRATION && project.initialInput) {
      setInput(project.initialInput);
    }
  }, [project.initialInput, activeStep]);

  useEffect(() => {
    if (activeStep === ProductionPhase.VISUAL_DEV && project.proposedStages.length === 0 && !isAnalyzing && geminiRef.current) {
      handleIdentifyStages();
    }
    if (activeStep === ProductionPhase.CHARACTER_DEV && project.proposedCharacters.length === 0 && !isAnalyzing && geminiRef.current) {
      handleAutoAnalyzeCharacters();
    }
  }, [activeStep, project.proposedStages.length, project.proposedCharacters.length]);

  const handleIdentifyStages = async () => {
    if (!geminiRef.current || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const stages = await geminiRef.current.identifyCoreStages(project.dna);
      setProject(prev => ({ ...prev, proposedStages: stages }));
    } catch (err) { console.error(err); } finally { setIsAnalyzing(false); }
  };

  const handleAutoAnalyzeCharacters = async () => {
    if (!geminiRef.current || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const chars = await geminiRef.current.analyzeCharacters(project.dna);
      setProject(prev => ({ ...prev, proposedCharacters: chars }));
    } catch (err) { console.error(err); } finally { setIsAnalyzing(false); }
  };

  const handleSubmitIdea = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading || !geminiRef.current) return;
    setIsLoading(true);
    try {
      const results = await geminiRef.current.generateSuggestions(input, activeStep, JSON.stringify(project.dna));
      setProject(prev => ({ 
        ...prev, 
        suggestions: results || [], 
        initialInput: activeStep === ProductionPhase.INSPIRATION ? input : prev.initialInput
      }));
    } finally { setIsLoading(false); }
  };

  const handleSuggestionClick = async (s: Suggestion) => {
    if (!geminiRef.current) return;
    setIsElaborating(true);
    try {
      const detailedDNA = await geminiRef.current.elaboratePlan(s);
      setTempDNA(detailedDNA);
      setProject(prev => ({
        ...prev, dna: detailedDNA, currentPhase: ProductionPhase.PRODUCTION_PLAN, suggestions: []
      }));
      setActiveStep(ProductionPhase.PRODUCTION_PLAN);
    } finally { setIsElaborating(false); }
  };

  const handleRenderCoreVisualOnly = async () => {
    if (!geminiRef.current) return;
    setIsLoading(true);
    try {
      const coreImage = await geminiRef.current.generateCoreStyleVisual(tempDNA) || undefined;
      setProject(prev => ({ ...prev, coreSceneImage: coreImage }));
    } finally { setIsLoading(false); }
  };

  const confirmProductionPlan = async () => {
    if (!geminiRef.current) return;
    setIsLoading(true);
    try {
      // 如果還沒生成核心視覺，則生成一個
      let coreImage = project.coreSceneImage;
      if (!coreImage) {
        coreImage = await geminiRef.current.generateCoreStyleVisual(tempDNA) || undefined;
      }
      setProject(prev => ({
        ...prev, currentPhase: ProductionPhase.VISUAL_DEV, dna: { ...tempDNA }, coreSceneImage: coreImage,
        proposedStages: [], proposedCharacters: []
      }));
      setActiveStep(ProductionPhase.VISUAL_DEV);
    } finally { setIsLoading(false); }
  };

  const saveProject = () => {
    const dataToSave = { ...project, initialInput: input };
    const data = JSON.stringify(dataToSave, null, 2);
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
        if (data.currentPhase && data.dna) {
          setProject(data);
          setActiveStep(data.currentPhase);
          setTempDNA(data.dna);
          if (data.initialInput) setInput(data.initialInput);
        }
      } catch (err) { alert('檔案格式錯誤。'); }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRenderStageGrid = async (idx: number) => {
    if (!geminiRef.current) return;
    setIsLoading(true);
    setProject(prev => ({ ...prev, selectedStageIndex: idx }));
    try {
      const gridResult = await geminiRef.current.generateSceneGrid(project.dna, project.proposedStages[idx]);
      if (gridResult) {
        setProject(prev => {
          const newStages = [...prev.proposedStages];
          newStages[idx] = { ...newStages[idx], gridImage: gridResult };
          return { ...prev, proposedStages: newStages };
        });
      }
    } finally { setIsLoading(false); }
  };

  const handleRenderCharacterGrid = async (idx: number) => {
    if (!geminiRef.current) return;
    setIsLoading(true);
    setProject(prev => ({ ...prev, selectedCharacterIndex: idx }));
    try {
      const gridResult = await geminiRef.current.generateCharacterGrid(project.dna, project.proposedCharacters[idx]);
      if (gridResult) {
        setProject(prev => {
          const newChars = [...prev.proposedCharacters];
          newChars[idx] = { ...newChars[idx], gridImage: gridResult };
          return { ...prev, proposedCharacters: newChars };
        });
      }
    } finally { setIsLoading(false); }
  };

  const updateStage = (idx: number, field: keyof StageDesign, value: string) => {
    setProject(prev => {
      const newStages = [...prev.proposedStages];
      newStages[idx] = { ...newStages[idx], [field]: value };
      return { ...prev, proposedStages: newStages };
    });
  };

  const updateCharacter = (idx: number, field: keyof CharacterDesign, value: string) => {
    setProject(prev => {
      const newChars = [...prev.proposedCharacters];
      newChars[idx] = { ...newChars[idx], [field]: value };
      return { ...prev, proposedCharacters: newChars };
    });
  };

  const handlePolishCharacter = async (idx: number, field: keyof CharacterDesign, label: string) => {
    if (!geminiRef.current || isLoading) return;
    setIsLoading(true);
    try {
      const char = project.proposedCharacters[idx];
      const polished = await geminiRef.current.polishText(char[field] as string, `角色塑造之${label}`);
      updateCharacter(idx, field, polished);
    } finally { setIsLoading(false); }
  };

  const downloadImage = (base64: string, name: string) => {
    const link = document.createElement('a');
    link.href = base64;
    link.download = `${name}.png`;
    link.click();
  };

  if (!hasKey) return <ApiKeySelector onSelected={() => setHasKey(true)} />;

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
          <h1 className="text-lg font-serif font-bold tracking-widest text-white/90">電影蒙太奇</h1>
        </div>
        <nav className="flex-1 space-y-2">
          {Object.entries(PHASE_METADATA).map(([key, meta], idx) => {
            const phaseKey = key as ProductionPhase;
            const isActive = activeStep === phaseKey;
            const isAccessible = Object.values(ProductionPhase).indexOf(phaseKey) <= Object.values(ProductionPhase).indexOf(project.currentPhase);
            return (
              <button key={key} disabled={!isAccessible} onClick={() => setActiveStep(phaseKey)} className={`w-full relative flex items-center gap-4 p-3 rounded-lg transition-all text-left group ${isActive ? 'bg-amber-600/20 text-amber-500 ring-1 ring-amber-600/30' : 'text-neutral-600 hover:text-neutral-400'} ${!isAccessible ? 'opacity-30 grayscale cursor-not-allowed' : 'cursor-pointer'}`}>
                {isActive && <div className="absolute left-0 w-1 h-6 bg-amber-600 rounded-full" />}
                <span className="text-xl">{meta.icon}</span>
                <div className="flex flex-col"><span className="text-[9px] uppercase tracking-tighter opacity-50">Step 0{idx+1}</span><span className="text-sm font-bold">{meta.title}</span></div>
              </button>
            );
          })}
        </nav>
        <div className="mt-8 space-y-2 border-t border-white/5 pt-6">
          <button onClick={saveProject} className="w-full flex items-center gap-3 px-3 py-2 text-xs text-neutral-400 hover:text-white transition-colors group"><Download className="w-4 h-4 text-amber-600" /> <span>匯出專案</span></button>
          <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 px-3 py-2 text-xs text-neutral-400 hover:text-white transition-colors group"><Upload className="w-4 h-4 text-amber-600" /> <span>匯入專案</span></button>
          <input type="file" ref={fileInputRef} onChange={loadProject} className="hidden" accept=".json" />
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-16 px-8 border-b border-white/5 flex items-center justify-between z-10 bg-black/50 backdrop-blur-md">
          <div className="flex items-center gap-2"><Terminal className="w-4 h-4 text-amber-600" /><span className="text-[10px] text-neutral-500 uppercase tracking-[0.2em]">TERMINAL</span><ChevronRight className="w-3 h-3 text-neutral-600" /><span className="text-sm font-bold text-amber-500 uppercase">{PHASE_METADATA[activeStep]?.title}</span></div>
          <div className="flex items-center gap-4">
            {activeStep === ProductionPhase.PRODUCTION_PLAN && (
              <button onClick={confirmProductionPlan} disabled={isLoading} className="bg-amber-600 hover:bg-amber-500 px-6 py-2 rounded-full text-[11px] font-bold flex items-center gap-2 shadow-lg transition-all">
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} 確認方案並塑造舞台
              </button>
            )}
            {activeStep === ProductionPhase.VISUAL_DEV && (
              <button onClick={() => setActiveStep(ProductionPhase.CHARACTER_DEV)} className="bg-amber-600 hover:bg-amber-500 px-6 py-2 rounded-full text-[11px] font-bold flex items-center gap-2 shadow-lg transition-all">
                <UserPlus className="w-3.5 h-3.5" /> 進行角色塑造
              </button>
            )}
          </div>
        </header>

        <section className="flex-1 flex flex-col items-center justify-start p-8 max-w-5xl mx-auto w-full overflow-y-auto">
          {activeStep === ProductionPhase.INSPIRATION && (
            <InspirationPhase input={input} setInput={setInput} isLoading={isLoading} isElaborating={isElaborating} suggestions={project.suggestions} onSubmit={handleSubmitIdea} onSuggestionClick={handleSuggestionClick} guideText={PHASE_METADATA[activeStep]?.guide} />
          )}
          {activeStep === ProductionPhase.PRODUCTION_PLAN && (
            <ProductionPlanPhase dna={tempDNA} setDna={setTempDNA} onRenderCoreVisual={handleRenderCoreVisualOnly} isLoading={isLoading} />
          )}
          {activeStep === ProductionPhase.VISUAL_DEV && (
            <VisualDevPhase project={project} isAnalyzing={isAnalyzing} isLoading={isLoading} onUpdateStage={updateStage} onRenderGrid={handleRenderStageGrid} guideText={PHASE_METADATA[activeStep]?.guide} />
          )}
          {activeStep === ProductionPhase.CHARACTER_DEV && (
            <CharacterDevPhase project={project} isAnalyzing={isAnalyzing} isLoading={isLoading} onUpdateCharacter={updateCharacter} onPolishCharacter={handlePolishCharacter} onRenderGrid={handleRenderCharacterGrid} guideText={PHASE_METADATA[activeStep]?.guide} />
          )}
        </section>
      </main>

      <aside className="w-80 border-l border-white/5 bg-black/40 p-6 flex flex-col gap-8 overflow-y-auto">
        <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest border-b border-white/5 pb-2">視覺檔案 (Asset)</h3>
        
        {/* 核心視覺 */}
        <div className="space-y-4">
          <span className="text-[10px] text-amber-500/70 font-mono uppercase tracking-widest block">CORE_VISUAL</span>
          {project.coreSceneImage ? (
            <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-lg cursor-zoom-in" onClick={() => setExpandedImage(project.coreSceneImage!)}>
              <img src={project.coreSceneImage} className="w-full h-full object-cover" alt="Core Visual" />
            </div>
          ) : (
            <div className="py-12 border border-dashed border-white/10 rounded-2xl text-center opacity-30">
              <ImageIcon className="w-6 h-6 mx-auto mb-2 text-neutral-700" />
              <p className="text-[8px] uppercase tracking-widest">等待核心視覺</p>
            </div>
          )}
        </div>

        {/* 舞台九宮格列表 */}
        {project.proposedStages.some(s => s.gridImage) && (
          <div className="space-y-6 pt-6 border-t border-white/5">
            <span className="text-[10px] text-amber-500/70 font-mono uppercase tracking-widest block">STAGE_GRIDS</span>
            {project.proposedStages.filter(s => s.gridImage).map((stage, i) => (
              <div key={i} className="space-y-2 group">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-neutral-400 truncate block">{stage.name}</span>
                  <Download className="w-3 h-3 text-neutral-600 hover:text-amber-500 cursor-pointer" onClick={() => downloadImage(stage.gridImage!, `Stage-${stage.name}`)} />
                </div>
                <div className="aspect-square rounded-xl overflow-hidden border border-white/5 cursor-zoom-in" onClick={() => setExpandedImage(stage.gridImage!)}>
                  <img src={stage.gridImage} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" alt={stage.name} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 角色九宮格列表 */}
        {project.proposedCharacters.some(c => c.gridImage) && (
          <div className="space-y-6 pt-6 border-t border-white/5">
            <span className="text-[10px] text-amber-500/70 font-mono uppercase tracking-widest block">CHARACTER_GRIDS</span>
            {project.proposedCharacters.filter(c => c.gridImage).map((char, i) => (
              <div key={i} className="space-y-2 group">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-neutral-400 truncate block">{char.name}</span>
                  <Download className="w-3 h-3 text-neutral-600 hover:text-amber-500 cursor-pointer" onClick={() => downloadImage(char.gridImage!, `Character-${char.name}`)} />
                </div>
                <div className="aspect-square rounded-xl overflow-hidden border border-white/5 cursor-zoom-in" onClick={() => setExpandedImage(char.gridImage!)}>
                  <img src={char.gridImage} className="w-full h-full object-cover" alt={char.name} />
                </div>
              </div>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
};

export default App;
