import { getRecommendations, type BudgetBrand, type BodyProfile, type StylePreferences } from "../../../lib/gemini";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    profile: BodyProfile;
    preferences: StylePreferences;
    budget: BudgetBrand;
  };

  const recs = await getRecommendations(body.profile, body.preferences, body.budget);
  return Response.json(recs, { status: 200 });
}

