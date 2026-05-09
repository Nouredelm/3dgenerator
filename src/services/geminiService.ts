import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedModel } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `You are an expert OpenSCAD developer and 3D modeling assistant.
Your goal is to generate high-quality OpenSCAD code and a matching 3D preview.

For every request, you must provide:
1. A descriptive title.
2. A brief explanation of the model.
3. Valid, clean OpenSCAD code (.scad). Use parameters and variables (OpenSCAD Customizer style) so the user can modify values.
4. A set of parameters for the Customizer.
5. A simplified 3D preview representation for Three.js. 

PREVIEW GUIDELINES:
- Three.js uses centered geometries by default. 
- Ensure 'position' refers to the CENTER of the object in 3D space.
- If the OpenSCAD code uses 'center=false' (default), adjust the Three.js 'position' accordingly (e.g., pos = [size/2, size/2, size/2]).
- Supported preview types: 
  - 'box': args = [width, height, depth]
  - 'cylinder': args = [radiusTop, radiusBottom, height]. Note: Three.js cylinders are centered on height; if SCAD is not centered, offset position[2] by height/2.
  - 'sphere': args = [radius]
  - 'torus': args = [radius, tubeRadius]
- Use colors to distinguish different parts of the model.

IMPORTANT: The preview must be a faithful spatial representation of the major components in the SCAD code. If the SCAD code uses 'difference()', represent the main body in the preview and omit the holes unless they are major features.

Response format must be valid JSON.`;

const MODEL_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    scadCode: { type: Type.STRING },
    parameters: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          label: { type: Type.STRING },
          type: { type: Type.STRING },
          value: { type: Type.STRING },
          min: { type: Type.NUMBER },
          max: { type: Type.NUMBER },
          step: { type: Type.NUMBER },
        },
        required: ["name", "label", "type", "value"],
      },
    },
    preview: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING },
          args: { type: Type.ARRAY, items: { type: Type.NUMBER } },
          position: { type: Type.ARRAY, items: { type: Type.NUMBER } },
          rotation: { type: Type.ARRAY, items: { type: Type.NUMBER } },
          color: { type: Type.STRING },
        },
        required: ["type", "args", "position", "rotation"],
      },
    },
  },
  required: ["title", "description", "scadCode", "parameters", "preview"],
};

export async function generateSCADModel(prompt: string, image?: { data: string; mimeType: string }): Promise<GeneratedModel> {
  const parts: any[] = [{ text: prompt }];
  
  if (image) {
    parts.push({
      inlineData: {
        data: image.data,
        mimeType: image.mimeType,
      },
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: { parts },
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: MODEL_SCHEMA,
    },
  });

  if (!response.text) {
    throw new Error("No response from Gemini");
  }

  return JSON.parse(response.text) as GeneratedModel;
}

export async function updateModelWithParameters(originalModel: GeneratedModel, updatedParams: any): Promise<GeneratedModel> {
  const prompt = `Adjust the following model based on these updated parameter values: ${JSON.stringify(updatedParams)}.
  Original Model: ${JSON.stringify(originalModel)}
  
  Please update both the scadCode and the preview representation to reflect these changes.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: MODEL_SCHEMA,
    },
  });

  if (!response.text) {
    throw new Error("No response from Gemini");
  }

  return JSON.parse(response.text) as GeneratedModel;
}
