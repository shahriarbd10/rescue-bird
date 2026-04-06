import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth, unauthorized } from "@/lib/auth";

type NominatimItem = {
  display_name: string;
  lat: string;
  lon: string;
  importance?: number;
};

export async function GET(req: NextRequest) {
  const user = await requireApiAuth(req);
  if (!user) return unauthorized();

  const query = req.nextUrl.searchParams.get("q")?.trim() || "";
  if (query.length < 3) {
    return NextResponse.json({ error: "Query must be at least 3 characters" }, { status: 400 });
  }
  if (query.length > 120) {
    return NextResponse.json({ error: "Query is too long" }, { status: 400 });
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "6");
  url.searchParams.set("countrycodes", "bd");

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": "rescue-bird-location-search/1.0 (contact: support@rescuebird.local)",
      Accept: "application/json"
    },
    cache: "no-store"
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Location search provider unavailable" }, { status: 502 });
  }

  const raw = (await res.json()) as NominatimItem[];
  const results = raw.map((item) => ({
    label: item.display_name,
    lat: Number(item.lat),
    lng: Number(item.lon),
    score: item.importance || 0
  }));

  return NextResponse.json({ results });
}
