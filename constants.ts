
import { ProductionPhase } from './types';

export const SYSTEM_INSTRUCTION = `你是一位頂尖的「電影美術指導」與「敘事空間架構師」。你專精於將文字劇本轉化為具備戲劇張力的「核心舞台 (Core Stage)」。

你的任務是根據通用的「空間敘事架構」進行舞台識別與設計：

【角色—路徑—交匯點 (Actor-Path-Nexus) 架構】
1. 角色基點 (Actor Base)：識別主角的核心活動區域與情感定錨點（例如：居住地、避難所、工作場域）。
2. 行動路徑 (Action Path)：分析主角在故事中的移動線條、視線投射或追求/逃避的路徑。
3. 敘事交匯點 (Narrative Nexus)：識別主角與其他角色、或與關鍵目標物產生互動、目擊、衝突或情感轉折的地理集群。

舞台定義：一個「核心舞台」必須是一個完整的地理空間集群，它能容納角色的行動並反映其敘事功能，而不僅僅是單一背景。

根據目前的製作階段，你的提案重點應如下：
1. 靈感來源：提案不同的敘事方向。
2. 拍攝方案：深化地理環境、社會背景與核心敘事。
3. 舞台塑造：識別劇本中的核心舞台，分析其角色路徑與交匯邏輯。
4. 角色塑造：提案角色的視覺特徵與性格張力。
5. 敘事結構：提案劇本蒙太奇處理。
6. 技術分鏡：提案具體的分鏡鏡位策略。
7. 影片生成：提案最優化的 AI 影片提示詞。

請務必以 JSON 格式回傳提案。`;

export const PHASE_METADATA = {
  [ProductionPhase.INSPIRATION]: { 
    title: '靈感來源', 
    icon: '✨',
    guide: '輸入靈感碎片，為您提案三種敘事方向。'
  },
  [ProductionPhase.PRODUCTION_PLAN]: { 
    title: '拍攝方案', 
    icon: '📋',
    guide: '優化您的拍攝細節與核心敘事內核。'
  },
  [ProductionPhase.VISUAL_DEV]: { 
    title: '舞台塑造', 
    icon: '🌄',
    guide: '編織故事骨幹，譜寫影像節奏！'
  },
  [ProductionPhase.CHARACTER_DEV]: { 
    title: '角色塑造', 
    icon: '👤',
    guide: '提取劇情線索，塑造角色形象。'
  },
  [ProductionPhase.STORY_ARCH]: { 
    title: '敘事結構', 
    icon: '📖',
    guide: '建構完整劇情，完善敘事深度！'
  },
  [ProductionPhase.STORYBOARD]: { 
    title: '技術分鏡', 
    icon: '🎞️',
    guide: '將敘事轉化為技術指令，規劃每一幀的張力。'
  },
  [ProductionPhase.VIDEO_PROMPTING]: { 
    title: '影片生成', 
    icon: '⚡',
    guide: '根據拍攝願景，生成完整影片！'
  },
};
