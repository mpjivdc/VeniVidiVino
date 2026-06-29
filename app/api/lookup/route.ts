import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { name, vintage } = await req.json();
        if (!name?.trim()) {
            return NextResponse.json({ _error: "No wine name provided" }, { status: 400 });
        }

        const apiKey = process.env.GOOGLE_AI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ _error: "GOOGLE_AI_API_KEY not configured" }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

        const query = vintage ? `${name} ${vintage}` : name;

        const prompt = `You are a wine expert database. Provide accurate information about this wine: "${query}".

Return a JSON object with these fields (only include fields you're confident about):
- name: the precise wine name
- producer: winery or producer name
- year: vintage year as a number${vintage ? ` (likely ${vintage})` : ''}
- type: one of "Red", "White", "Rose", "Sparkling", "Dessert", "Fortified", "Orange", "Other"
- country: country of origin
- region: primary wine region (e.g. Tuscany, Bordeaux, Napa Valley)
- subRegion: specific AOC, DOC, AVA (e.g. Bolgheri, Margaux, Rutherford)
- grapes: array of grape variety names
- alcohol: typical alcohol percentage as a number (e.g. 14.5)
- drinkFrom: recommended drinking window start year as number
- drinkTo: recommended drinking window end year as number
- pairings: exactly 3 food pairings as a single comma-separated string
- tastingNotes: array of 4-6 descriptors chosen ONLY from this list:
  Lemon, Lime, Grapefruit, Orange peel, Peach, Apricot, Nectarine, Cherry, Strawberry, Raspberry, Redcurrant, Cranberry, Blackberry, Black cherry, Plum, Blackcurrant, Pineapple, Mango, Melon, Lychee, Banana, Fig, Raisin, Prune, Jammy, Rose, Violet, Honeysuckle, Orange blossom, Jasmine, Grass, Bell pepper, Asparagus, Mint, Eucalyptus, Tobacco, Tomato leaf, Tea, Black pepper, Cinnamon, Clove, Vanilla, Licorice, Ginger, Anise, Mushroom, Forest floor, Wet stones, Flint, Chalk, Dust, Petroleum, Cedar, Toast, Smoke, Caramel, Butter, Nutty, Chocolate, Coffee, Leather, High Acidity, Low Acidity, Soft Tannins, Firm Tannins, Light Body, Full Body

Return ONLY raw valid JSON. No markdown. No explanation. No code blocks.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const data = JSON.parse(jsonString);

        return NextResponse.json(data);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[Lookup] Error:", message);
        return NextResponse.json({ _error: message });
    }
}
