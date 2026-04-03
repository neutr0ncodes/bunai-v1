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

export interface RecommendationRequest {
  profile: BodyProfile;
  preferences: StylePreferences;
  budget: BudgetBrand;
}

export interface RecommendationGenerationRecord {
  id: string;
  source: "gemini" | "fallback";
  createdAt: string;
  request: RecommendationRequest;
  recommendations: Recommendation[];
}
