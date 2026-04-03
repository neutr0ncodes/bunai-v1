import { generateRecommendations } from "@repo/api/recommendations";
import { createRecommendationRepository } from "@repo/db/recommendations";
import type { RecommendationRequest } from "@repo/types/recommendations";

export async function POST(req: Request) {
  const body = (await req.json()) as RecommendationRequest;

  const recs = await generateRecommendations(body, createRecommendationRepository());
  return Response.json(recs, { status: 200 });
}
