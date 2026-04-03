import type { RecommendationGenerationRecord } from "@repo/types/recommendations";

export interface RecommendationRepository {
  saveGeneration(record: RecommendationGenerationRecord): Promise<void>;
}

class NoopRecommendationRepository implements RecommendationRepository {
  async saveGeneration(_record: RecommendationGenerationRecord): Promise<void> {}
}

export function createRecommendationRepository(): RecommendationRepository {
  return new NoopRecommendationRepository();
}
