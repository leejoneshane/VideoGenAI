
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

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  videoUrl?: string;
  images?: string[];
}

export interface Suggestion {
  title: string;
  description: string;
  tags: string[];
  environment?: string;
  socialBackground?: string;
  coreNarrative?: string;
  format?: string;
  style?: string;
}

export interface StageDesign {
  id: string; // 例如: stage_1
  name: string;
  description: string;
  gridImage?: string;
}

export interface CharacterDesign {
  id: string; // 例如: char_01
  name: string;
  role: string;
  physicalTraits: string; 
  visualTone: string;    
  motivation: string;    
  gridImage?: string;    
}

export interface Chapter {
  title: string;
  emotionalTone: string;
  summary: string;
  scenes: string[];
}

export interface StoryArchitecture {
  incitingIncident: string;
  midpoint: string;
  climax: string;
  resolution: string;
  chapters: Chapter[];
}

export interface StoryboardEntry {
  startTime: string; // mm:ss
  endTime: string;   // mm:ss
  stage: string;     
  character: string; 
  shotType: string;
  movement: string;
  action: string;    
  audio: string;     
}

export interface Storyboard {
  entries: StoryboardEntry[];
}

export interface VideoPromptEntry {
  shotIdx: number;
  timeRange: string;
  prompt: string;
  isContinuous: boolean;
  stageRef: string;
  charRef: string;
  videoUrl?: string; // 儲存生成後的影片網址
}

export interface ProjectDNA {
  format: string;
  style: string;
  story: string;
  ratio: string;
  environment: string;
  socialBackground: string;
  spatialGeometry: string;   // 空間幾何
  colorAesthetics: string;   // 色彩美學
  conflictEssence: string;   // 衝突本質
  coreNarrative: string;
  directorVision?: string;
}

export interface ProjectState {
  currentPhase: ProductionPhase;
  initialInput: string;
  videoTitle?: string;  // 影片標題
  videoAuthor?: string; // 作者名稱
  dna: ProjectDNA;
  proposedStages: StageDesign[];
  proposedCharacters: CharacterDesign[]; 
  storyArchitecture?: StoryArchitecture;
  storyboard?: Storyboard;
  videoPrompts?: VideoPromptEntry[];
  selectedStageIndex?: number;
  selectedCharacterIndex?: number;      
  coreStageImage?: string; 
}
