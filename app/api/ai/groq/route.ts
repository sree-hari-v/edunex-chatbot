import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // 1. Safe Request Parsing
    let prompt;
    try {
      const body = await req.json();
      prompt = body.prompt;
    } catch (e) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    // 2. Check API Key
    const key = process.env.GROQ_API_KEY;
    if (!key) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is missing on Vercel." },
        { status: 500 }
      );
    }

    // 3. Call Groq API
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content:
              "You are EduNex, an assistant chatbot for Nilgiri College (https://nilgiricollege.ac.in/). " +
              "Always answer as if you represent Nilgiri College. " +
              "If you are not sure about exact facts like current fees, say that clearly and " +
              "suggest visiting the official website or contacting the college.",
          },
          {
            role: "user",
            content:
              "User asked this (assume they are talking about Nilgiri College):\n\n" +
              prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 1024,
      }),
    });

    // 4. THE FIX: Read as text first.
    // This prevents the "Unexpected end of JSON" crash on the frontend.
    const rawText = await res.text();

    if (!rawText) {
      // If Groq returns nothing, we send a valid JSON error instead of crashing.
      return NextResponse.json(
        { error: "Groq API returned an empty response." },
        { status: 502 }
      );
    }

    // 5. Safe JSON Parsing
    let json;
    try {
      json = JSON.parse(rawText);
    } catch (e) {
      // If Groq returns HTML error (like 504 Gateway Timeout), we catch it here.
      return NextResponse.json(
        { error: `Groq returned invalid JSON: ${rawText.slice(0, 50)}...` },
        { status: 502 }
      );
    }

    // 6. Check for API Errors inside the JSON
    if (!res.ok) {
      const msg = json?.error?.message || "Unknown error";
      return NextResponse.json(
        { error: `Groq Error (${res.status}): ${msg}` },
        { status: res.status }
      );
    }

    // 7. Success
    const answer = json.choices?.[0]?.message?.content || "";
    if (!answer) {
      return NextResponse.json({ error: "Groq response was empty." }, { status: 500 });
    }

    return NextResponse.json({ text: answer, provider: "groq" });

  } catch (e: any) {
    console.error("Groq Route Error:", e);
    return NextResponse.json(
      { error: e.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
