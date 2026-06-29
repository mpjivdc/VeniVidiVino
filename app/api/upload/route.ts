import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const prompt = `Analyze this wine label image and extract the following details in JSON format:
- name: The name of the wine.
- producer: The producer/winery name.
- year: The vintage year as a number. If not found, use current year.
- type: One of "Red", "White", "Rose", "Sparkling", "Dessert", "Fortified", "Orange", "Other". Infer from color or grape if possible. Default to "Red".
- region: The region (e.g., Napa Valley, Bordeaux).
- subRegion: The specific sub-region or AOC if visible (e.g., Bolgheri, Margaux).
- country: The country of origin.
- grapes: An array of grape varieties mentioned on the label.
- alcohol: The alcohol percentage as a number (e.g., 14.5).
- pairings: Suggest exactly 3 perfect food pairings based on this wine's style as a single string (e.g., "Grilled ribeye, aged cheddar, dark chocolate").
- tastingNotes: An array of exactly 4-6 relevant tasting notes from this PROFESSIONAL TASTING GRID. Choose terms that match the wine's style and type:

  FRUIT - Citrus: Lemon, Lime, Grapefruit, Orange peel
  FRUIT - Stone: Peach, Apricot, Nectarine, Cherry
  FRUIT - Red: Strawberry, Raspberry, Redcurrant, Cranberry
  FRUIT - Black: Blackberry, Black cherry, Plum, Blackcurrant
  FRUIT - Tropical: Pineapple, Mango, Melon, Lychee, Banana
  FRUIT - Dried: Fig, Raisin, Prune, Jammy
  FLORAL: Rose, Violet, Honeysuckle, Orange blossom, Jasmine
  HERBAL/VEGETAL: Grass, Bell pepper, Asparagus, Mint, Eucalyptus, Tobacco, Tomato leaf, Tea
  SPICE: Black pepper, Cinnamon, Clove, Vanilla, Licorice, Ginger, Anise
  EARTHY/MINERAL: Mushroom, Forest floor, Wet stones, Flint, Chalk, Dust, Petroleum
  OAK/AGE: Cedar, Toast, Smoke, Caramel, Butter, Nutty, Chocolate, Coffee, Leather
  MOUTHFEEL: High Acidity, Low Acidity, Soft Tannins, Firm Tannins, Light Body, Full Body

Return ONLY raw valid JSON. Do not include markdown formatting or backticks.`;

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.GOOGLE_AI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ _error: "GOOGLE_AI_API_KEY not configured" }, { status: 500 });
        }

        const formData = await req.formData();
        const file = formData.get("image") as File;

        if (!file) {
            return NextResponse.json({ error: "No image provided" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const base64Image = buffer.toString("base64");

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

        const result = await model.generateContent([
            {
                inlineData: {
                    data: base64Image,
                    mimeType: file.type || "image/jpeg",
                }
            },
            { text: prompt }
        ]);

        const text = result.response.text();
        const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const data = JSON.parse(jsonString);

        return NextResponse.json({ ...data, _model: "gemini-2.0-flash-lite" });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[AI Scan] Error:", message);
        return NextResponse.json({ _error: message });
    }
}
