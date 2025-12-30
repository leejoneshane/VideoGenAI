import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { Suggestion, StageDesign, CharacterDesign, ProjectDNA, ProductionPhase } from "../types";

export class GeminiService {
  constructor(apiKey: string) { }

  async generateSuggestions(input: string, phase: ProductionPhase, context: string): Promise<Suggestion[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `目前的靈感/指令： "${input}"。
    請根據目前的製作階段 [${phase}]，提供三個具體的創意導向（高層次提案）。
    
    【關鍵任務】如果是 INSPIRATION 階段，請發揮頂尖導演聯想力，自動推論出初步的：
    1. 地理環境 (environment)
    2. 社會背景 (socialBackground)
    3. 核心敘事 (coreNarrative)
    
    請回傳 JSON 陣列，包含 title, description, tags, environment, socialBackground, coreNarrative。`;

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
              environment: { type: Type.STRING },
              socialBackground: { type: Type.STRING },
              coreNarrative: { type: Type.STRING }
            },
            required: ["title", "description", "tags"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  }

  async identifyCoreStages(dna: ProjectDNA): Promise<StageDesign[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `你是一位頂尖電影美術指導與空間設計師。請針對提供的劇本內容進行核心舞台 (Core Stage) 的識別與視覺設計。

【執行步驟】
1. 歸納主要地點：深入閱讀「劇本摘要」，從中找出故事主要發生的物理地點，並歸納為 1-3 個最具敘事代表性的核心舞台。
2. 宏觀審視與篩選：對於每個初步選定的地點，請進行專業審視：「這是否為角色的核心活動區？」或「這是否為角色之間關鍵的互動空間？」。若兩者皆為否，請剔除該地點並尋找更具空間敘事張力的地點。
3. 詳細空間設計：為選定的舞台產出具備工業標準的描述，內容必須包含：
    - 場地大小與空間格局 (Scale & Layout)
    - 位置、方位與方向感 (Position & Orientation)
    - 關鍵物件、道具與美術陳設 (Key Props & Dressing)
    - 光影質調、色調色標與材質細節 (Lighting, Color & Textures)
    - 敘事氛圍與心理空間感 (Atmosphere)

劇本摘要：${dna.story}
視覺風格定義：${dna.style}
環境背景：${dna.environment}

請回傳 JSON 陣列，包含 name 與詳盡的 description。`;

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
    
    請回傳 JSON 陣列。`;

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
              role: { type: Type.STRING, description: '角色定位，如主角、反派、關鍵配角' },
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

  async elaboratePlan(suggestion: Suggestion): Promise<ProjectDNA> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `將以下提案擴充為完整的電影拍攝 DNA：${suggestion.title}。內容包含地理環境、社會背景、核心敘事與劇本摘要。`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            format: { type: Type.STRING },
            style: { type: Type.STRING },
            story: { type: Type.STRING },
            ratio: { type: Type.STRING },
            environment: { type: Type.STRING },
            socialBackground: { type: Type.STRING },
            coreNarrative: { type: Type.STRING }
          },
          required: ["format", "style", "story", "environment", "socialBackground", "coreNarrative"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  }

  async polishText(text: string, type: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `你是專業電影視覺指導。請進行場景化潤色，強調視覺細節與專業術語。類型：${type}。內容：${text}`,
    });
    return response.text || text;
  }

  async generateCoreStyleVisual(dna: ProjectDNA): Promise<string | null> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      A professional cinematic mood board / style guide collage for the film project: "${dna.coreNarrative}".
      STRICT LAYOUT REQUIREMENT: Generate ONE single image that is a composite (split-screen/grid) showing 4-5 distinct cinematic perspectives:
      1. An Epic Wide Shot establishing the ${dna.environment}.
      2. A dramatic medium shot showcasing the lighting and ${dna.style} texture.
      3. An extreme close-up of a symbolic prop or texture representing the ${dna.socialBackground}.
      4. A dynamic low-angle or high-angle shot with intense mood.
      
      The overall image MUST have a unified color grading and lighting style. 
      Professional film production quality, cinematic concept art, 8k, detailed shadows and highlights.
    `;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio: "16:9", imageSize: "1K" } }
      });
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
      return null;
    } catch (error) { return null; }
  }

  async generateImage(prompt: string): Promise<string | null> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio: "16:9", imageSize: "1K" } }
      });
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
      return null;
    } catch (error) { return null; }
  }

  async generateSceneGrid(dna: ProjectDNA, stage: StageDesign): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const gridPrompt = `
      Professional 3x3 cinematic concept art storyboard for stage: "${stage.name}".
      Spatial Context: ${stage.description}. Style: ${dna.style}.
      STRICT LAYOUT REQUIREMENT: Single 1:1 square image strictly divided into a 3x3 grid with EXACTLY NINE equal rectangular panels. 
      Consistent lighting, texture, and color grading across all 9 panels. 8k resolution, cinematic concept design.
    `;
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
    const gridPrompt = `
      A professional 3x3 cinematic character concept art sheet for: "${character.name}" (${character.role}).
      Traits: ${character.physicalTraits}. 
      Visual Tone & Material: ${character.visualTone}. 
      Motivation & Expressions: ${character.motivation}.
      Film Style: ${dna.style}.
      
      CRITICAL LAYOUT REQUIREMENT: 
      Generate a single 1:1 square image strictly divided into a 3x3 grid containing exactly NINE distinct equal-sized panels. 
      DO NOT GENERATE EXTRA ROWS OR COLUMNS. THE GRID MUST BE EXACTLY 3x3.
      
      Grid Content Mapping:
      - (1,1) Top-Left: Full-body heroic/villainous standing pose.
      - (1,2) Top-Center: Extreme close-up of the eyes and emotional expression.
      - (1,3) Top-Right: Profile view (side silhouette) showing costume depth.
      - (2,1) Mid-Left: Macro detail of costume fabric, armor, or material texture.
      - (2,2) CENTER: Main narrative action pose - showing the character's dynamic core.
      - (2,3) Mid-Right: Close-up of a signature accessory, weapon, or tool.
      - (3,1) Bottom-Left: Dramatic lighting study - shadows and highlights on face.
      - (3,2) Bottom-Center: Hand detail or character-specific gesture.
      - (3,3) Bottom-Right: Environmental interaction - how character fits in the world.
      
      Visual Consistency: The character's face, clothing, and the overall color palette MUST be identical across all nine panels. High-end cinematic concept art, 8k.
    `;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ text: gridPrompt }] },
        config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } }
      });
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
    } catch (error) { console.error("Character grid generation failed:", error); }
    return "";
  }

  async generateVideo(prompt: string, onProgress: (status: string) => void): Promise<string | null> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      onProgress("正在初始化拍攝設備...");
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
      });
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }
      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      return downloadLink ? `${downloadLink}&key=${process.env.API_KEY}` : null;
    } catch (error) { return null; }
  }
}
