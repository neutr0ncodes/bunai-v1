import { GoogleGenAI, Type } from "@google/genai";
import type { RecommendationRepository } from "@repo/db/recommendations";
import type {
  Recommendation,
  RecommendationGenerationRecord,
  RecommendationRequest,
} from "@repo/types/recommendations";
import { requireEnv } from "@repo/utils/env";

function createGeminiClient() {
  return new GoogleGenAI({ apiKey: requireEnv("GEMINI_API_KEY") });
}

function buildPrompt({ profile, preferences, budget }: RecommendationRequest): string {
  return `
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
}

function getFallbackRecommendations(): Recommendation[] {
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

function buildRecord(
  request: RecommendationRequest,
  recommendations: Recommendation[],
  source: RecommendationGenerationRecord["source"]
): RecommendationGenerationRecord {
  return {
    id: crypto.randomUUID(),
    source,
    createdAt: new Date().toISOString(),
    request,
    recommendations,
  };
}

export async function generateRecommendations(
  request: RecommendationRequest,
  repository?: RecommendationRepository
): Promise<Recommendation[]> {
  try {
    const ai = createGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: buildPrompt(request),
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

    const recommendations = JSON.parse(response.text || "[]") as Recommendation[];
    await repository?.saveGeneration(buildRecord(request, recommendations, "gemini"));
    return recommendations;
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    const recommendations = getFallbackRecommendations();
    await repository?.saveGeneration(buildRecord(request, recommendations, "fallback"));
    return recommendations;
  }
}
