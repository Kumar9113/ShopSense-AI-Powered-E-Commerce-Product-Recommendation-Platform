import { NextResponse } from "next/server";
const AI_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
export async function POST(request) {
  try {
    const body = await request.json();
    const response = await fetch(`${AI_URL}/search`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
    return NextResponse.json(await response.json(), { status: response.status });
  } catch (error) { return NextResponse.json({ success: false, error: error.message }, { status: 500 }); }
}
