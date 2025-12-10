import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    const key = process.env.GROQ_API_KEY;

    if (!key) {
      return NextResponse.json(
        { error: "GROQ_API_KEY not configured on server" },
        { status: 500 }
      );
    }

    // Call Groq API
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

    // FIX: Read raw text first to avoid crashing on empty bodies
    const textBody = await res.text();

    if (!textBody) {
      return NextResponse.json(
        { error: "Groq returned an empty response." },
        { status: 500 }
      );
    }

    // Try parsing JSON safely
    let json: any;
    try {
      json = JSON.parse(textBody);
    } catch {
      // If it fails, return the raw text (often an HTML error page from a proxy)
      return NextResponse.json(
        { error: `Groq invalid JSON: ${textBody.slice(0, 100)}...` },
        { status: 500 }
      );
    }

    if (!res.ok) {
      const msg = json?.error?.message || JSON.stringify(json);
      return NextResponse.json(
        { error: `Groq API Error: ${msg}` },
        { status: res.status }
      );
    }

    const answer = json.choices?.[0]?.message?.content;
    if (!answer) {
      return NextResponse.json(
        { error: "Groq response missing content." },
        { status: 500 }
      );
    }

    return NextResponse.json({ text: answer, provider: "groq" });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Internal Server Error in Groq route" },
      { status: 500 }
    );
  }
}
