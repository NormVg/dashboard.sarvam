import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("file");

    if (!audioFile) {
      return NextResponse.json({ error: "Missing audio file" }, { status: 400 });
    }

    const apiKey = req.headers.get("API-Subscription-Key") || process.env.NEXT_PUBLIC_SARVAM_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 401 });
    }

    // Forward the exact same form data to Sarvam
    const sarvamFormData = new FormData();
    sarvamFormData.append("file", audioFile);
    sarvamFormData.append("model", "saaras:v3");

    const response = await fetch("https://api.sarvam.ai/speech-to-text", {
      method: "POST",
      headers: {
        "api-subscription-key": apiKey,
      },
      body: sarvamFormData as any,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Sarvam STT API error:", response.status, errorText);
      return NextResponse.json({ error: `API Error: ${response.status} ${errorText}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Speech API proxy error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
