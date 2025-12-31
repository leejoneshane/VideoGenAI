
import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { Suggestion, StageDesign, CharacterDesign, ProjectDNA, ProductionPhase, StoryArchitecture, Storyboard, VideoPromptEntry } from "../types";

export class GeminiService {
  constructor(apiKey: string) { }

  async generateSuggestions(input: string, phase: ProductionPhase, context: string): Promise<Suggestion[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
    你現在是一位備受讚譽的電影大師。目前的靈感指令為： "${input}"。
    請提供三個具備強烈視覺張力與敘事深度的創意導向（頂尖導演提案）。
    
    【關鍵任務】
    1. 每個提案必須包含：製作形式 (format)、視覺風格 (style)、核心敘事 (coreNarrative)。
    2. 核心敘事應包含具體的衝突點與時代氣息，但不需要在此步驟描述具體的地理位置與社會背景（這些將在下一階段詳細規劃）。
    
    請嚴格回傳符合 Schema 的 JSON 陣列。`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              format: { type: Type.STRING },
              style: { type: Type.STRING },
              coreNarrative: { type: Type.STRING }
            },
            required: ["title", "description", "tags", "format", "style", "coreNarrative"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  }

  async elaboratePlan(suggestion: Suggestion, baseDNA: ProjectDNA): Promise<ProjectDNA> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
    你現在是一位備受國際影壇推崇的視覺大師與資深編劇。請根據以下提案核心，將其擴充為極其詳盡且具備高度藝術執行力的「影片製作 DNA」：

    【提案參考內容】
    - 標題：${suggestion.title}
    - 摘要描述：${suggestion.description}
    - 製作形式：${suggestion.format}
    - 視覺風格：${suggestion.style}
    - 核心敘事（衝突核心）：${suggestion.coreNarrative}

    【核心任務：導演製作清單 (Master Production List)】
    請根據上述核心，從零開始生成並深化以下六大關鍵維度：
    1. 地理環境 (Environment)：構思該敘事發生的具體地理座標或虛構場域。描述地形、氣候特徵、物理尺度，以及環境如何壓迫或支撐主角。
    2. 社會背景 (Social Background)：定義故事發生的時代座標、文化脈絡、階級權力結構，以及導致當前衝突的社會根源。
    3. 空間幾何 (Spatial Geometry)：詳細描述在「${suggestion.style}」風格下，畫面構圖的幾何原則。例如：建築比例、自然空間的視線引導、空間的對稱性或扭曲感。
    4. 色彩美學 (Color Aesthetics)：定義核心色彩計畫（Color Palette）。包含主色調、高光與陰影的色相偏好。詳述光影質感（例如：強烈對比的硬光、薄霧般的瀰漫光、顆粒感重的膠捲質感）。
    5. 衝突本質 (Conflict Essence)：深入挖掘主角在「${suggestion.coreNarrative}」下所面臨的「內在情感衝突」與「外在生存/環境壓力」的交織點。
    6. 劇本摘要 (Story)：編寫一份至少 500 字、充滿強烈鏡頭感、精確動作描述與感官細節（聲響、觸感、氣味、光影變化）的文字劇本。這必須是一段具備三幕結構特徵的高水準文學描述，包含關鍵轉折點的視覺意象。

    請嚴格回傳符合 Schema 的 JSON 物件。
    `;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            environment: { type: Type.STRING },
            socialBackground: { type: Type.STRING },
            spatialGeometry: { type: Type.STRING },
            colorAesthetics: { type: Type.STRING },
            conflictEssence: { type: Type.STRING },
            story: { type: Type.STRING },
          },
          required: ["environment", "socialBackground", "spatialGeometry", "colorAesthetics", "conflictEssence", "story"]
        }
      }
    });
    
    const result = JSON.parse(response.text || "{}");
    return { 
      ...result, 
      format: suggestion.format || result.format || baseDNA.format, 
      style: suggestion.style || result.style || baseDNA.style,
      ratio: "16:9" 
    };
  }

  async identifyCoreStages(dna: ProjectDNA): Promise<StageDesign[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `你是一位頂尖電影美術指導與空間設計師。請針對提供的劇本內容進行核心舞台 (Core Stage) 的識別與視覺設計。

【執行步驟】
1. 歸納主要地點：深入閱讀「劇本摘要」，從中找出故事主要發生的物理地點，並歸納為 1-3 個最具敘事代表性的核心舞台。
2. 宏觀審視與篩選：針對地點進行「角色—路徑—交匯點 (Actor-Path-Nexus)」專業審核。這是否為角色的核心活動區？是否為關鍵路徑？是否為衝突/互動的交匯點？若皆為否，請剔除並尋找更具空間敘事張力的地點。
3. 進行編碼：為每個舞台分配唯一 ID。格式為 "stage_x" (例如：stage_1, stage_2)。
4. 詳細空間設計：為選定的舞台產出具備工業標準的描述，內容必須包含：
    - 場地大小與空間格局 (Scale & Layout)：定義空間的物理邊界與層次感。
    - 位置、方位與方向感 (Position & Orientation)：角色進入空間後的視覺導向。
    - 關鍵物件、道具與美術陳設 (Key Props & Dressing)：具有敘事功能的環境物件。
    - 光影質調、色調色標與材質細節 (Lighting, Color & Textures)：如強烈對比、特定光譜 or 材質紋理（金屬、斑駁混凝土等）。
    - 敘事氛圍與心理空間感 (Atmosphere)：環境如何反映角色的心境或故事壓力。

劇本摘要：${dna.story}
視覺風格定義：${dna.style}
環境背景：${dna.environment}

請回傳 JSON 陣列，包含 id, name 與詳盡的 description。`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "舞台編碼，如 stage_1" },
              name: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ["id", "name", "description"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  }

  async analyzeCharacters(dna: ProjectDNA): Promise<CharacterDesign[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `你是一位頂尖電影選角指導與角色造型設計師。請針對劇本內容，識別出「主角」、「反派」與「關鍵配角」，並為這 1-3 個核心角色設計深度視覺原型。
    
    劇本摘要：${dna.story}
    視覺風格：${dna.style}
    
   【深度要求】每個角色的總描述量應在 150-200 字之間，內容必須具備工業級的細節。
    
   【設計維度】
    1. 外貌特徵 (physicalTraits)：具體的五官輪廓、身形比例、標誌性傷疤或裝飾、服裝的剪裁與時代感。
    2. 外觀材質色調 (visualTone)：定義角色的「視覺 DNA」。包含服裝面料細節（粗糙皮革、絲綢光澤等）、專屬配色方案、以及光影如何在其臉部產生戲劇效果。
    3. 內在動機與表情動作 (motivation)：核心欲望如何轉化為習慣性表情（如：焦慮的眨眼、冷酷的嘴角下撇）與典型的動態行為。

   【編碼要求】
    為每個角色分配唯一 ID。格式為 "char_xx" (例如：char_01, char_02)。 

    請回傳 JSON 陣列，包含 id, name, role, physicalTraits, visualTone, motivation。`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "角色編碼，如 char_01" },
              name: { type: Type.STRING },
              role: { type: Type.STRING },
              physicalTraits: { type: Type.STRING },
              visualTone: { type: Type.STRING },
              motivation: { type: Type.STRING }
            },
            required: ["id", "name", "role", "physicalTraits", "visualTone", "motivation"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  }

  async generateStoryArchitecture(dna: ProjectDNA): Promise<StoryArchitecture> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `請為以下劇本建立精密的敘事結構與情感曲線：${dna.story}
    
    【輸出規範】
    1. 確保三幕劇的關鍵轉折點（Plot Points）清晰，且蒙太奇節奏能反映出主題深度。
    2. 所有的欄位內容（如章節標題、摘要、場景描述等）必須完全使用「繁體中文」回傳。`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            incitingIncident: { type: Type.STRING },
            midpoint: { type: Type.STRING },
            climax: { type: Type.STRING },
            resolution: { type: Type.STRING },
            chapters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  emotionalTone: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  scenes: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || "{}");
  }

  async generateStoryboard(dna: ProjectDNA, arch: StoryArchitecture, stages: StageDesign[], characters: CharacterDesign[]): Promise<Storyboard> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const stageInfo = stages.map(s => `[${s.id}] ${s.name}`).join(', ');
    const charInfo = characters.map(c => `[${c.id}] ${c.name}`).join(', ');

    const prompt = `請將敘事結構轉化為專業技術分鏡：${JSON.stringify(dna)}
    
    可用舞台列表：${stageInfo}
    可用角色列表：${charInfo}
    
    請精確定義鏡位（WS/LS/MCU/CU）與運鏡邏輯（Pan/Tilt/Dolly/Track）。在標註舞台與角色時，請務必使用提供的 id (如 stage_1, char_01)。`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            entries: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  startTime: { type: Type.STRING },
                  endTime: { type: Type.STRING },
                  stage: { type: Type.STRING, description: "舞台 ID" },
                  character: { type: Type.STRING, description: "角色 ID" },
                  shotType: { type: Type.STRING },
                  movement: { type: Type.STRING },
                  action: { type: Type.STRING },
                  audio: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || "{ entries: [] }");
  }

  async generateVideoPrompts(dna: ProjectDNA, storyboard: Storyboard, stages: StageDesign[], characters: CharacterDesign[], title?: string, author?: string): Promise<VideoPromptEntry[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const stageRefs = stages.map(s => `${s.id}: ${s.description}`).join('\n');
    const charRefs = characters.map(c => `${c.id}: ${c.physicalTraits}`).join('\n');

    const prompt = `你是一位頂尖影片提示詞專家。
    
    【關鍵規則：文字渲染與繁體中文優化】
    1. Shot 1 (Idx 0) 必須是影片開場。
    2. 描述中必須包含「影片標題：${title || '未命名'}」與「導演：${author || 'Gemini 3'}」出現在畫面中。
    3. 文字渲染指令 (CRITICAL)：「The text '影片標題：${title}' and '導演：${author}' must be rendered with perfect calligraphic structure. Traditional Chinese characters must exhibit precise stroke order and sharp skeletal geometry. Avoid any stroke artifacts or nonsensical patterns. The font should be a bold, high-contrast Heiti (sans-serif) or Mingti (serif) style, designed as an integral vector-like graphic overlay. Minimalism, white typography on dark cinematic backdrop.」
    4. 從 Shot 2 開始才是正片故事，描述中需強調開場字幕已淡出。
    5. 每個提示詞描述長度不超過 5 秒。
    6. 務必參照對應 ID 的視覺描述進行生成。
    
    【參照描述】
    舞台詳情：
    ${stageRefs}
    
    角色詳情：
    ${charRefs}

    專案風格：${dna.style}
    分鏡資料：${JSON.stringify(storyboard.entries)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              shotIdx: { type: Type.INTEGER },
              timeRange: { type: Type.STRING },
              prompt: { type: Type.STRING },
              isContinuous: { type: Type.BOOLEAN },
              stageRef: { type: Type.STRING },
              charRef: { type: Type.STRING }
            },
            required: ["shotIdx", "timeRange", "prompt", "isContinuous", "stageRef", "charRef"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  }

  async generateSegmentVideo(prompt: string, ratio: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const operation = await ai.models.generateVideos({
      model: 'veo-3.1-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: ratio === '9:16' ? '9:16' : '16:9'
      }
    });

    let currentOp = operation;
    while (!currentOp.done) {
      await new Promise(resolve => setTimeout(resolve, 8000));
      currentOp = await ai.operations.getVideosOperation({ operation: currentOp });
    }

    const downloadLink = currentOp.response?.generatedVideos?.[0]?.video?.uri;
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  async polishText(text: string, type: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `你現在是一位備受國際影壇肯定的頂尖電影編劇與視覺攝影指導。請針對目前的「${type}」欄位內容進行深度潤色。

【目前欄位】
${type}

【原始內容】
${text}

【潤色任務】
1. 優化敘事張力：使其文字充滿電影節奏感與戲劇衝突。
2. 強化感官細節：加入精確的材質、光影、氣息或動作細節。
3. 提升專業度：使用正確的電影工業術語，並確保文字風格符合該欄位的設計目標。
4. 繁體中文：請務必以流暢且具備文學感的繁體中文輸出。

請直接回傳潤色後的最終內容，不需要包含任何解釋文字。`,
    });
    return response.text || text;
  }

  async generateCoreStyleVisual(dna: ProjectDNA): Promise<string | null> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `A cinematic masterpiece mood board capturing the essence of: "${dna.story}". Cinematic lighting, Texture-driven, Style: ${dna.style}.`;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio: dna.ratio === '9:16' ? "9:16" : "16:9", imageSize: "1K" } }
      });
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
      return null;
    } catch (error) { return null; }
  }

  async generateStageGrid(dna: ProjectDNA, stage: StageDesign): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const gridPrompt = `Professional 3x3 Stage Concept Sheet for film production. 
    Stage ID: "${stage.id}".
    Stage Name: "${stage.name}". 
    Context: ${stage.description}. 
    Aesthetic: ${dna.style}.
    The grid must contain exactly 9 distinct panels showing these specific perspectives:
    1. 全景俯瞰 (Birds-eye view).
    2. 正面全景 (Front wide shot).
    3. 側面全景 (Side wide shot).
    4. 入口視角 (View from entrance).
    5. 核心區域特寫 (Narrative Nexus).
    6. 氛圍細節A (Texture detail).
    7. 氛圍細節B (Lighting pattern).
    8. 關鍵道具特寫 (Key prop).
    9. 角色視角POV (Character POV).
    All panels must maintain strict visual consistency with the defined aesthetic: ${dna.style}.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ text: gridPrompt }] },
        config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } }
      });
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
    } catch (error) { console.error(error); }
    return "";
  }

  async generateCharacterGrid(dna: ProjectDNA, character: CharacterDesign): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const gridPrompt = `Professional 3x3 Character Visual Identity Sheet. 
    Character ID: "${character.id}".
    Name: "${character.name}". 
    Role: ${character.role}. 
    Aesthetic: ${dna.style}.
    Details: ${character.physicalTraits}, ${character.visualTone}.
    The grid must contain exactly 9 distinct panels:
    1. 正面全貌 (Front full body).
    2. 側面輪廓 (Side profile).
    3. 背面與結構 (Back view).
    4. 頭部特寫 (Head close-up).
    5. 末端細節 (Hand/Foot accessories).
    6. 材質特寫 (Macro fabric/skin).
    7. 動態姿態 (Dynamic pose).
    8. 特徵神態 (Characteristic look).
    9. 比例與氛圍 (Atmosphere).
    Consistency is key: ${dna.style}.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ text: gridPrompt }] },
        config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } }
      });
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
    } catch (error) { console.error(error); }
    return "";
  }
}
