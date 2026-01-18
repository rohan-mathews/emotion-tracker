import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { mood } = await req.json();

    // Connect to Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Decide what to ask based on mood
    let prompt = "";
    if (mood === "sad") {
      prompt = "Tell me a very short, cheesy joke to cheer someone up. Keep it under 2 sentences.";
    } else if (mood === "angry") {
      prompt = "Give me one calm, stoic sentence to help me relax. Keep it short.";
    } else if (mood === "happy") {
      prompt = "Give me a high-five phrase or a fun fact!";
    } else {
      prompt = "Tell me a random interesting fact.";
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ message: text });
  } catch (error) {
    return NextResponse.json({ message: "Could not find a joke today!" }, { status: 500 });
  }
}