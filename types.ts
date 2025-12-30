export { };

export enum ProductionPhase {
  INSPIRATION = 'INSPIRATION',
  PRODUCTION_PLAN = 'PRODUCTION_PLAN',
  VISUAL_DEV = 'VISUAL_DEV',
  CHARACTER_DEV = 'CHARACTER_DEV',
  STORY_ARCH = 'STORY_ARCH',
  STORYBOARD = 'STORYBOARD',
  VIDEO_PROMPTING = 'VIDEO_PROMPTING'
}

export interface Suggestion {
  title: string;
  description: string;
  tags: string[];
  environment?: string;
  socialBackground?: string;
  coreNarrative?: string;
}

export interface StageDesign {
  name: string;
  description: string;
  gridImage?: string;
}

export interface CharacterDesign {
  name: string;
  role: string;
  physicalTraits: string; // 外貌特徵
  visualTone: string;    // 外觀材質色調
  motivation: string;    // 內在動機與表情動作
  gridImage?: string;    // 角色形象九宮格
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  images?: string[]; 
  videoUrl?: string;
  phase?: ProductionPhase;
}

export interface GeneratedVideo {
  id: string;
  url: string;
  prompt: string;
  shotLabel: string;
}

export interface ProjectDNA {
  format: string;
  style: string;
  story: string;
  ratio: string;
  environment: string;
  socialBackground: string;
  coreNarrative: string;
}

export interface ProjectState {
  currentPhase: ProductionPhase;
  initialInput?: string;
  dna: ProjectDNA;
  suggestions: Suggestion[];
  proposedStages: StageDesign[];
  proposedCharacters: CharacterDesign[]; // 新增：角色塑造提案
  selectedStageIndex?: number;
  selectedCharacterIndex?: number;      // 新增：目前選中的角色索引
  history: Message[];
  generatedVideos: GeneratedVideo[];
  sceneGrid: string[]; 
  coreSceneImage?: string; 
}