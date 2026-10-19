import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Server is missing OPENAI_API_KEY. Add it to .env.local." }, { status: 500 });
    }

    const form = await request.formData();
    const prompt = String(form.get("prompt") || "").trim();
    if (!prompt) return NextResponse.json({ error: "A prompt is required." }, { status: 400 });

    // POLICY HOOK: Add your own content rules / moderation here before calling the image API.
    // Keep this server-side. Do not rely on client-side checks for enforcement.
    const openai = new OpenAI({ apiKey });
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024"
    });

    const image = response.data?.[0]?.b64_json;
    if (!image) throw new Error("The image provider returned no image data.");
    return NextResponse.json({ image });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Image generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
