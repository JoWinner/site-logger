import { NextResponse } from "next/server";
import { z } from "zod";

import { requireProfile } from "@/lib/auth/session";

const coordinatesSchema = z.object({
  latitude: z.coerce.number().min(-85.0511).max(85.0511),
  longitude: z.coerce.number().min(-180).max(180),
});

export async function GET(request: Request) {
  await requireProfile();
  const url = new URL(request.url);
  const parsed = coordinatesSchema.safeParse({
    latitude: url.searchParams.get("latitude"),
    longitude: url.searchParams.get("longitude"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid map coordinates." }, { status: 400 });
  }

  const token = process.env.MAPBOX_ACCESS_TOKEN?.trim();
  if (!token) {
    return NextResponse.json({ error: "Map preview unavailable." }, { status: 503 });
  }

  const { latitude, longitude } = parsed.data;
  const marker = `pin-s+ef6a2e(${longitude},${latitude})`;
  const mapUrl = new URL(
    `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${marker}/${longitude},${latitude},15/640x320@2x`,
  );
  mapUrl.searchParams.set("access_token", token);

  const response = await fetch(mapUrl, {
    headers: { Accept: "image/png,image/jpeg" },
    signal: AbortSignal.timeout(5_000),
  }).catch(() => null);
  if (!response?.ok) {
    return NextResponse.json({ error: "Map preview unavailable." }, { status: 502 });
  }

  return new NextResponse(await response.arrayBuffer(), {
    headers: {
      "Content-Type": response.headers.get("Content-Type") ?? "image/png",
      "Cache-Control": "private, max-age=300",
    },
  });
}
