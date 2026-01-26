"use server"

import { Wine } from "./types";
import { getDoc } from "./google-sheets";
import { revalidatePath } from "next/cache";

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

        await sheet.loadHeaderRow();

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

    const newWine: any = {
        ...wine,
        id: crypto.randomUUID(),
        dateAdded: new Date().toISOString(),
        tastingNotes: JSON.stringify(wine.tastingNotes || []),
        grapes: JSON.stringify(wine.grapes || []),
    };

    try {
        for (const title of destinations) {
            let sheet = doc.sheetsByTitle[title];
            if (!sheet) {
                console.log(`[STRICT DEBUG] Sheet "${title}" not found. Creating it...`);
                sheet = await doc.addSheet({ headerValues: HEADER_VALUES, title });
            }

            console.log(`[STRICT DEBUG] ATTEMPTING APPEND TO "${title}" (Sheet ID: ${sheet.sheetId})...`);

            // Explicitly load headers to avoid "Header values are not yet loaded"
            try {
                await sheet.loadHeaderRow();
            } catch (e) {
                console.log("[STRICT DEBUG] Could not load headers (Sheet might be empty). Setting them now...");
                await sheet.setHeaderRow(HEADER_VALUES);
            }

            const currentHeaders = sheet.headerValues || [];
            console.log(`[STRICT DEBUG] CURRENT HEADERS: ${currentHeaders.join(", ")}`);

            // Map the object to the header order to ENSURE it lands in the right columns
            // This is safer than just passing the object if there's any header mismatch
            const rowArray = HEADER_VALUES.map(header => {
                const val = newWine[header];
                return val !== undefined && val !== null ? val.toString() : "";
            });

            console.log(`[STRICT DEBUG] ROW ARRAY TO SEND: ${JSON.stringify(rowArray)}`);
            console.log(`[STRICT DEBUG] ROW COUNT BEFORE: ${sheet.rowCount}`);

            // Use the array-based addRow for absolute precision
            const addedRow = await sheet.addRow(rowArray);

            console.log(`[STRICT DEBUG] SUCCESS: Row added to "${title}". ID: ${newWine.id}`);
            console.log(`[STRICT DEBUG] ROW COUNT AFTER: ${sheet.rowCount}`);

            // Force revalidation immediately
            revalidatePath("/cellar");
            revalidatePath("/wishlist");
            revalidatePath("/");
        }
    } catch (error: any) {
        console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        console.error("FATAL STORAGE ERROR: FAILED TO ADD ROW TO SHEET");
        console.error(`ERROR MESSAGE: ${error.message}`);
        console.error(`STACK: ${error.stack}`);
        console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        throw error;
    }
}

export async function deleteWine(id: string, sheetTitle: "Cellar" | "Wishlist"): Promise<void> {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle[sheetTitle];
    if (!sheet) return;

    await sheet.loadHeaderRow();
    const rows = await sheet.getRows();
    const row = rows.find((r) => r.get("id") === id);
    if (row) await row.delete();
}

export async function updateWine(id: string, updates: Partial<Wine>, sheetTitle: "Cellar" | "Wishlist"): Promise<void> {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle[sheetTitle];
    if (!sheet) return;

    await sheet.loadHeaderRow();
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
