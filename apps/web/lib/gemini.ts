import { GoogleGenAI, Type } from "@google/genai";

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  return new GoogleGenAI({ apiKey });
}

export interface BodyProfile {
  height: string;
  weight: string;
  bodyType: string;
  age?: string;
  gender: string;
}

export interface StylePreferences {
  occasions: string[];
  seasons: string[];
  vibes: string[];
}

export interface BudgetBrand {
  tier: string;
  brands: string[];
}

export interface Recommendation {
  id: string;
  name: string;
  brand: string;
  price: string;
  imageUrl: string;
  description: string;
  matchScore: number;
}

export async function getRecommendations(
  profile: BodyProfile,
  preferences: StylePreferences,
  budget: BudgetBrand
): Promise<Recommendation[]> {
  const prompt = `
    Act as a high-end fashion stylist for an app called FitMe.
    Based on the following user profile, suggest 5 clothing items.
    
    User Profile:
    - Body: ${profile.height}cm, ${profile.weight}kg, ${profile.bodyType} physique, ${profile.gender}
    - Preferences: ${preferences.occasions.join(", ")}, ${preferences.seasons.join(", ")}, ${preferences.vibes.join(", ")}
    - Budget Tier: ${budget.tier}
    - Preferred Brands: ${budget.brands.join(", ")}

    Return the recommendations in a structured JSON format.
    Each item should have: id, name, brand, price (in INR), imageUrl (use high quality placeholder fashion images from Unsplash or similar), description, and matchScore (0-100).
  `;

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              brand: { type: Type.STRING },
              price: { type: Type.STRING },
              imageUrl: { type: Type.STRING },
              description: { type: Type.STRING },
              matchScore: { type: Type.NUMBER },
            },
            required: ["id", "name", "brand", "price", "imageUrl", "description", "matchScore"],
          },
        },
      },
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    // Fallback mock data if AI fails
    return [
      {
        id: "1",
        name: "Architectural Wool Blazer",
        brand: "Massimo Dutti",
        price: "₹12,990",
        imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=800",
        description: "A structured blazer with clean lines, perfect for an athletic physique.",
        matchScore: 98,
      },
      {
        id: "2",
        name: "Minimalist Silk Blouse",
        brand: "COS",
        price: "₹6,500",
        imageUrl: "https://images.unsplash.com/photo-1539109132314-34a9c6553876?auto=format&fit=crop&q=80&w=800",
        description: "Flowing silk fabric that complements a slim silhouette.",
        matchScore: 92,
      },
    ];
  }
}
