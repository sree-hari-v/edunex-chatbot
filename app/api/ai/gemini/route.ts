import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    const key = process.env.GEMINI_API_KEY;

    if (!key) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    // Use the model+version that works for your account
    const apiVersion = "v1beta";              // or "v1" depending on what you settled on
    const model = "gemini-1.5-flash-001";     // or your working model name
    const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent`;

    const systemInstruction =
      "You are EduNex, an assistant chatbot for Nilgiri College (https://nilgiricollege.ac.in/).\n" +
      "Always interpret the user's question as being about Nilgiri College.\n" +
      "Focus your answers on Nilgiri College courses, departments, fees, admissions, campus life, etc.\n" +
      "If you are not sure about an exact fact (like current fees), say that clearly and suggest visiting " +
      "the official website or contacting the college office for confirmation.";

    const payload = {
      systemInstruction: {
        role: "system",
        parts: [{ text: systemInstruction }],
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text:
                "User asked this (assume they are talking about Nilgiri College):\n\n" +
                prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 1024,
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": key,
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (!res.ok) {
      const msg = json?.error?.message || `Gemini API error ${res.status}`;
      return NextResponse.json({ error: msg }, { status: res.status });
    }

    const candidate = json.candidates?.[0];
    const text =
      candidate?.content?.parts
        ?.map((p: any) => (typeof p?.text === "string" ? p.text : ""))
        .filter(Boolean)
        .join("\n") || "";

    if (!text) {
      return NextResponse.json({ error: "Gemini: Empty response" }, { status: 500 });
    }

    return NextResponse.json({ text, provider: "gemini" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Gemini route failed" }, { status: 500 });
  }
}