import { GoogleGenAI, Schema, Type } from "@google/genai";
import { BrandIdentity, SocialPlatform, ImageResolution, AspectRatio } from "../types";

// Helper to initialize AI with the key from process.env
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeBrandIdentity = async (url: string): Promise<BrandIdentity> => {
  const ai = getAI();
  
  // Using flash which supports search and is faster
  const model = "gemini-2.5-flash";
  
  const prompt = `Analyze the brand identity for the website: ${url}. 
  I need a structured summary of their Visual Style, Tone of Voice, Target Audience, and Color Palette.
  Be concise but specific.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          visualStyle: { type: Type.STRING },
          toneOfVoice: { type: Type.STRING },
          targetAudience: { type: Type.STRING },
          colorPalette: { type: Type.STRING }
        },
        required: ["visualStyle", "toneOfVoice", "targetAudience", "colorPalette"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("Failed to analyze brand.");

  const data = JSON.parse(text);
  return {
    url,
    ...data
  };
};

export const generateSocialImage = async (
  prompt: string, 
  brand: BrandIdentity | null, 
  resolution: ImageResolution, 
  aspect: AspectRatio
): Promise<string> => {
  const ai = getAI();
  // Using Flash Image (Nano Banana) to avoid strict cloud linking requirements of Pro
  const model = "gemini-2.5-flash-image";

  let finalPrompt = prompt;
  if (brand) {
    finalPrompt += `\n\nBrand Style Guidelines to adhere to:
    - Visual Style: ${brand.visualStyle}
    - Color Palette: ${brand.colorPalette}
    Ensure the image reflects this brand identity strictly.`;
  }

  const response = await ai.models.generateContent({
    model,
    contents: {
        parts: [{ text: finalPrompt }]
    },
    config: {
      imageConfig: {
        // imageSize is not supported in Flash Image, only aspect ratio
        aspectRatio: aspect
      }
    }
  });

  // Extract image
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No image generated.");
};

export const generateSocialCaption = async (
  topic: string,
  platform: SocialPlatform,
  brand: BrandIdentity | null
): Promise<string> => {
  const ai = getAI();
  const model = "gemini-2.5-flash";

  let systemInstruction = `You are a social media expert. Write a caption for ${platform}.`;
  
  if (brand) {
    systemInstruction += ` Adapt the writing style to match this brand voice: ${brand.toneOfVoice}. Target Audience: ${brand.targetAudience}.`;
  }

  const prompt = `Write a engaging caption about: "${topic}". 
  Platform specific requirements:
  - Instagram: Use emojis and hashtags. Informal but professional.
  - LinkedIn: Professional, industry-focused, thought leadership style.
  - Facebook: Conversational, community-focused.
  
  Return ONLY the caption text.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction
    }
  });

  return response.text || "";
};

export const generateNewsletterContent = async (
  topic: string,
  audience: string,
  brand: BrandIdentity | null
): Promise<{ subject: string; body: string }> => {
  const ai = getAI();
  const model = "gemini-2.5-flash";

  let context = "";
  if (brand) {
    context = `Brand Voice: ${brand.toneOfVoice}. Brand Context: ${brand.visualStyle}.`;
  }

  const prompt = `Write a newsletter about "${topic}" for an audience of "${audience}".
  ${context}
  Format the response as JSON with "subject" and "body" fields. The body should be in Markdown.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
            subject: { type: Type.STRING },
            body: { type: Type.STRING }
        }
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("Failed to generate newsletter.");
  
  return JSON.parse(text);
};