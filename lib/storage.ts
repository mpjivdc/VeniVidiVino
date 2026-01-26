"use server"

import { Wine } from "./types";
import { getDoc } from "./google-sheets";

const HEADER_VALUES = [
    'id', 'name', 'vintage', 'country', 'region', 'subRegion', 'type', 'grapes', 'producer',
    'alcoholContent', 'bottleSize',
    'quantity', 'location',
    'drinkFrom', 'drinkTo', 'boughtAt', 'boughtDate', 'price',
    'rating', 'tastingNotes', 'pairingSuggestions',
    'image', 'dateAdded'
];

export async function getWines(sheetTitle: "Cellar" | "Wishlist"): Promise<Wine[]> {
    try {
        const doc = await getDoc();
        const sheet = doc.sheetsByTitle[sheetTitle];
        if (!sheet) return [];

        const rows = await sheet.getRows();
        return rows.map((row) => {
            // Parse array fields safely
            let tastingNotes: string[] = [];
            try {
                const rawNotes = row.get("tastingNotes");
                if (rawNotes) tastingNotes = JSON.parse(rawNotes);
            } catch {
                tastingNotes = row.get("tastingNotes") ? [row.get("tastingNotes")] : [];
            }

            let grapes: string[] = [];
            try {
                const rawGrapes = row.get("grapes");
                if (rawGrapes) grapes = JSON.parse(rawGrapes);
            } catch {
                grapes = row.get("grapes") ? [row.get("grapes")] : [];
            }

            return {
                id: row.get("id"),
                name: row.get("name"),
                vintage: parseInt(row.get("vintage")) || new Date().getFullYear(),
                country: row.get("country"),
                region: row.get("region"),
                subRegion: row.get("subRegion"),
                type: row.get("type") as any,
                grapes,
                producer: row.get("producer"),
                alcoholContent: parseFloat(row.get("alcoholContent")) || undefined,
                bottleSize: row.get("bottleSize"),
                quantity: parseInt(row.get("quantity")) || 1,
                location: row.get("location"),
                drinkFrom: parseInt(row.get("drinkFrom")) || undefined,
                drinkTo: parseInt(row.get("drinkTo")) || undefined,
                boughtAt: row.get("boughtAt"),
                boughtDate: row.get("boughtDate"),
                price: parseFloat(row.get("price")) || undefined,
                rating: parseFloat(row.get("rating")) || undefined,
                tastingNotes,
                pairingSuggestions: row.get("pairingSuggestions"),
                image: row.get("image"),
                dateAdded: row.get("dateAdded"),
            }
        });
    } catch (error) {
        console.error(`Error fetching ${sheetTitle} from Sheets:`, error);
        return [];
    }
}

export async function addWine(wine: Omit<Wine, "id" | "dateAdded">, destinations: ("Cellar" | "Wishlist")[]): Promise<void> {
    const doc = await getDoc();

    const newWine = {
        ...wine,
        id: crypto.randomUUID(),
        dateAdded: new Date().toISOString(),
        // Serialize arrays for Sheets
        tastingNotes: JSON.stringify(wine.tastingNotes || []),
        grapes: JSON.stringify(wine.grapes || []),
    };

    for (const title of destinations) {
        let sheet = doc.sheetsByTitle[title];
        if (!sheet) {
            sheet = await doc.addSheet({ headerValues: HEADER_VALUES, title });
        }
        // Ensure headers exist/match if needed (skipping advanced header sync for speed, assuming sheet exists or created correctly)

        await sheet.addRow(newWine);
    }
}

export async function deleteWine(id: string, sheetTitle: "Cellar" | "Wishlist"): Promise<void> {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle[sheetTitle];
    if (!sheet) return;

    const rows = await sheet.getRows();
    const row = rows.find((r) => r.get("id") === id);
    if (row) await row.delete();
}

export async function updateWine(id: string, updates: Partial<Wine>, sheetTitle: "Cellar" | "Wishlist"): Promise<void> {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle[sheetTitle];
    if (!sheet) return;

    const rows = await sheet.getRows();
    const row = rows.find((r) => r.get("id") === id);
    if (row) {
        const serializedUpdates: any = { ...updates };
        if (updates.tastingNotes) serializedUpdates.tastingNotes = JSON.stringify(updates.tastingNotes);
        if (updates.grapes) serializedUpdates.grapes = JSON.stringify(updates.grapes);

        Object.entries(serializedUpdates).forEach(([key, value]) => {
            if (value !== undefined && value !== null) row.set(key, value.toString());
        });
        await row.save();
    }
}
