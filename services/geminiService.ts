
import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { Suggestion, StageDesign, CharacterDesign, ProjectDNA, ProductionPhase, StoryArchitecture, Storyboard, VideoPromptEntry } from "../types";

export class GeminiService {
  constructor(apiKey: string) { }

  async generateSuggestions(input: string, phase: ProductionPhase, context: string): Promise<Suggestion[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const currentDNA = JSON.parse(context) as ProjectDNA;
    
    const prompt = `
    目前的製作設定：
    - 形式：${currentDNA.format}
    - 預想視覺風格：${currentDNA.style}
    - 畫面比例：${currentDNA.ratio}
    
    核心靈感/指令： "${input}"。
    
    請根據目前的製作階段 [${phase}]，提供三個具體的創意導向（頂尖導演提案）。
    
    請回傳 JSON 陣列。`;

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

  async elaboratePlan(suggestion: Suggestion, baseDNA: ProjectDNA): Promise<ProjectDNA> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
    請將以下提案擴充為完整的電影拍攝 DNA：
    提案標題：${suggestion.title}
    內容需包含：符合該風格的地理環境、社會背景、核心敘事與一份細緻的劇本摘要。
    `;
    
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
            coreNarrative: { type: Type.STRING },
            directorVision: { type: Type.STRING }
          },
          required: ["format", "style", "story", "environment", "socialBackground", "coreNarrative", "directorVision"]
        }
      }
    });
    const result = JSON.parse(response.text || "{}");
    return { ...result, format: baseDNA.format, ratio: baseDNA.ratio };
  }

  async identifyCoreStages(dna: ProjectDNA): Promise<StageDesign[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `針對劇本識別核心舞台。
    劇本摘要：${dna.story}`;

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
    const prompt = `分析角色特徵。劇本：${dna.story}`;
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
    const prompt = `鋪陳敘事結構。劇本：${dna.story}`;
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
    const prompt = `生成技術分鏡。專案：${JSON.stringify(dna)}`;
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
    
    【關鍵規則】
    1. Shot 1 (Idx 0) 必須是影片開場！描述中必須包含「影片標題：${title || 'Untitled'}」與「作者：${author || 'AI Director'}」的字樣出現於畫面中（透過字幕特效），視覺風格需符合專案風格。
    2. 從 Shot 2 開始才是正片故事，描述中需強調開場字幕已淡出。
    3. 每個提示詞描述長度不超過 5 秒。若分鏡鏡位超過 5 秒，請拆分為多個提示詞。
    4. 使用 [STAGE_01], [CHAR_01] 代號。
    
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
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: ratio === '9:16' ? '9:16' : '16:9'
      }
    });

    let currentOp = operation;
    while (!currentOp.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
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
      contents: `內容：${text}`,
    });
    return response.text || text;
  }

  async generateCoreStyleVisual(dna: ProjectDNA): Promise<string | null> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `A cinematic mood board for: "${dna.coreNarrative}". Style: ${dna.style}.`;
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
    const gridPrompt = `Professional 3x3 Stage Concept Sheet for: "${stage.name}". Context: ${stage.description}.`;
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
    const gridPrompt = `Professional 3x3 Character Visual Sheet for: "${character.name}".`;
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
