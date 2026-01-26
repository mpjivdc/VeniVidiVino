import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("image") as File;

        if (!file) {
            return NextResponse.json({ error: "No image provided" }, { status: 400 });
        }

        if (!process.env.GOOGLE_API_KEY) {
            return NextResponse.json({ error: "API Key not configured" }, { status: 500 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const base64Image = buffer.toString("base64");

        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = `Analyze this wine label image and extract the following details in JSON format:
    - name: The name of the wine.
    - producer: The producer/winery name.
    - year: The vintage year (number). If not found, use current year.
    - type: One of "Red", "White", "Rose", "Sparkling", "Dessert", "Fortified". Infer from color or grape if possible. Default to "Red".
    - region: The region (e.g., Napa Valley, Bordeaux).
    - country: The country of origin.
    
    Return ONLY raw JSON, no markdown formatting.`;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: file.type || "image/jpeg",
                },
            },
        ]);

        const response = await result.response;
        const text = response.text();

        // Clean up potential markdown code blocks
        const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const data = JSON.parse(jsonString);

        return NextResponse.json(data);
    } catch (error) {
        console.error("Analysis failed:", error);
        return NextResponse.json({ error: "Failed to analyze image" }, { status: 500 });
    }
}
