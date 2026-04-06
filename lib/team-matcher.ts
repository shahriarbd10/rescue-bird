import RescueTeamModel from "@/models/RescueTeam";
import { haversineKm, normalizeArea } from "@/lib/geo";

type Input = {
  area: string;
  lat: number;
  lng: number;
};

export async function findBestTeam(input: Input) {
  const ranked = await findTeamCandidates(input, 1);
  return ranked[0] || null;
}

export async function findTeamCandidates(input: Input, limit = 5) {
  const normalized = normalizeArea(input.area);
  const teams = await RescueTeamModel.find().lean();

  const scored: Array<{ _id: string; score: number }> = [];

  for (const team of teams) {
    let score = 0;
    const hasArea =
      Array.isArray(team.areaNames) &&
      team.areaNames.some((area) => normalizeArea(area).includes(normalized) || normalized.includes(normalizeArea(area)));
    if (hasArea) score += 100;

    if (team.location?.lat && team.location?.lng) {
      const distance = haversineKm(
        { lat: input.lat, lng: input.lng },
        { lat: Number(team.location.lat), lng: Number(team.location.lng) }
      );
      const withinRadius = distance <= (team.coverageRadiusKm || 5);
      if (withinRadius) {
        score += Math.max(0, 80 - distance * 10);
      }
    }
    if (score > 0) {
      scored.push({ _id: String(team._id), score });
    }
  }
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, limit))
    .map((item) => item._id);
}
