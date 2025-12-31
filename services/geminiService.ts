
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
    6. 劇本摘要 (Story)：編寫一份至少 800 字、充滿強烈鏡頭感、精確動作描述與感官細節（聲響、觸感、氣味、光影變化）的文字劇本。這必須是一段具備三幕結構特徵的高水準文學描述，包含關鍵轉折點的視覺意象。

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
2. 宏觀審視與篩選：針對地點進行「角色—路徑—交匯點 (Actor-Path-Nexus)」專業審核。這是否為角色的核心活動區？是否為關鍵路徑？是否為衝突/互動的交匯點？若皆為否，請剔除並尋找更具敘事張力的地點。
3. 詳細空間設計：為選定的舞台產出具備工業標準的描述，內容必須包含：
    - 場地大小與空間格局 (Scale & Layout)：定義空間的物理邊界與層次感。
    - 位置、方位與方向感 (Position & Orientation)：角色進入空間後的視覺導向。
    - 關鍵物件、道具與美術陳設 (Key Props & Dressing)：具有敘事功能的環境物件。
    - 光影質調、色調色標與材質細節 (Lighting, Color & Textures)：如強烈對比、特定光譜或材質紋理（金屬、斑駁混凝土等）。
    - 敘事氛圍與心理空間感 (Atmosphere)：環境如何反映角色的心境或故事壓力。

劇本摘要：${dna.story}
視覺風格定義：${dna.style}
環境背景：${dna.environment}

請回傳 JSON 陣列，包含 name（2-4 個繁體中文名稱）與詳盡的 description。`;

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
              name: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ["name", "description"]
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
    
    請回傳 JSON 陣列，包含 name（2-4 個繁體中文名稱）與 role, physicalTraits, visualTone, motivation。`;
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
              name: { type: Type.STRING },
              role: { type: Type.STRING },
              physicalTraits: { type: Type.STRING },
              visualTone: { type: Type.STRING },
              motivation: { type: Type.STRING }
            },
            required: ["name", "role", "physicalTraits", "visualTone", "motivation"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  }

  async generateStoryArchitecture(dna: ProjectDNA): Promise<StoryArchitecture> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `請為以下劇本建立精密的敘事結構與情感曲線：${dna.story}
    
    確保三幕劇的關鍵轉折點（Plot Points）清晰，且蒙太奇節奏能反映出主題深度。`;
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

  async generateStoryboard(dna: ProjectDNA, arch: StoryArchitecture, stageNames: string[], characterNames: string[]): Promise<Storyboard> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `請將敘事結構轉化為專業技術分鏡：${JSON.stringify(dna)}
    
    可用舞台：${stageNames.join(', ')}
    可用角色：${characterNames.join(', ')}
    
    請精確定義鏡位（WS/LS/MCU/CU）與運鏡邏輯（Pan/Tilt/Dolly/Track）。`;
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
                  stage: { type: Type.STRING },
                  character: { type: Type.STRING },
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
    const prompt = `你是一位頂尖影片提示詞專家。
    
    【關鍵規則：文字渲染優化】
    1. Shot 1 (Idx 0) 必須是影片開場。
    2. 描述中必須包含「影片標題：${title || 'Untitled'}」與「作者：${author || 'AI Director'}」出現在畫面中。
    3. 針對文字渲染，請在描述中加入：「Typography should be clean, high-contrast, professional cinematic titles overlay. The traditional Chinese characters must be rendered as sharp, geometric graphic design elements to ensure stroke accuracy. Style: Minimalist white typography on dark background.」
    4. 從 Shot 2 開始才是正片故事，描述中需強調開場字幕已淡出。
    5. 每個提示詞描述長度不超過 5 秒。
    6. 使用 [STAGE_01], [CHAR_01] 代號。
    
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
      contents: `內容：${text}。請以頂尖編劇與攝影指導的視角，優化這段內容的敘事張力與感官細節。`,
    });
    return response.text || text;
  }

  async generateCoreStyleVisual(dna: ProjectDNA): Promise<string | null> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `A cinematic masterpiece mood board capturing the essence of: "${dna.coreNarrative}". Cinematic lighting, Texture-driven, Style: ${dna.style}.`;
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
    Stage: "${stage.name}". 
    Context: ${stage.description}. 
    Aesthetic: ${dna.style}.
    The grid must contain exactly 9 distinct panels showing these specific perspectives:
    1. Birds-eye view / Top-down overview of the entire location.
    2. Front wide shot capturing the primary architecture or layout.
    3. Side wide shot showing spatial depth and lateral perspective.
    4. View from the main entrance or arrival point.
    5. Medium close-up of the core interaction area or "Narrative Nexus".
    6. Atmospheric texture detail A (e.g., floor material, wall weathering, specific decor).
    7. Atmospheric lighting detail B (e.g., light through windows, neon glow, shadow patterns).
    8. Close-up of a key prop or critical piece of set dressing mentioned in the description.
    9. Subjective POV shot from a character's eye level looking into the space.
    All panels must maintain strict visual consistency with the defined aesthetic: ${dna.style} and Cinematic Lighting.`;

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
    const gridPrompt = `Professional 3x3 Character Visual Identity Sheet for film production. 
    Character: "${character.name}". 
    Role: ${character.role}. 
    Aesthetic: ${dna.style}.
    Details: ${character.physicalTraits}, ${character.visualTone}.
    The grid must contain exactly 9 distinct panels showing these specific perspectives:
    1. 正面全貌 (Front full body shot): Primary character design and silhouette.
    2. 側面輪廓 (Side profile view): Establishing physical depth and facial profile.
    3. 背面與表面結構 (Back view and surface structure): Showing rear costume details and fabric behavior.
    4. 頭部/感官特寫 (Head and sensory close-up): High-detail facial features, eyes, and skin texture.
    5. 末端肢體細節 (Extremity details): Close-up of hands, footwear, or specific limb accessories/jewelry.
    6. 材質與紋理特寫 (Texture and material close-up): Macro shot of fabric weave, scars, or equipment materials.
    7. 動態姿態 (Dynamic pose): The character in a typical narrative motion or action pose.
    8. 特徵神態 (Characteristic expression): Capturing a signature emotional state or iconic look.
    9. 比例參照與氛圍 (Proportion reference and atmosphere): The character scaled within their dramatic lighting context.
    All panels must maintain strict visual consistency with the defined aesthetic: ${dna.style} and Cinematic Lighting.`;

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
