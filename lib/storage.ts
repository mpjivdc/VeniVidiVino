"use server"

import { Wine } from "./types";
import { getDoc } from "./google-sheets";
import { revalidatePath } from "next/cache";

const HEADER_VALUES = [
    'Name', 'Vintage', 'Country', 'Region', 'Sub-region', 'Type', 'Grapes', 'Alcohol%', 'Bottle Size',
    'Quantity', 'Location', 'Drink From', 'Drink To', 'Rating', 'Price', 'Bought At', 'Bought Date', 'Tasting Notes',
    'Pairing', 'Status', 'CreatedAt', 'UpdatedAt', 'UserId', 'Notes', 'Image', 'Expert Ratings'
];

// Map internal Wine keys to Sheet Header names
const KEY_TO_HEADER: Record<string, string> = {
    name: 'Name', vintage: 'Vintage', country: 'Country', region: 'Region', subRegion: 'Sub-region',
    type: 'Type', grapes: 'Grapes', alcoholContent: 'Alcohol%', bottleSize: 'Bottle Size',
    quantity: 'Quantity', location: 'Location', drinkFrom: 'Drink From', drinkTo: 'Drink To',
    rating: 'Rating', price: 'Price', boughtAt: 'Bought At', boughtDate: 'Bought Date',
    tastingNotes: 'Tasting Notes', pairingSuggestions: 'Pairing',
    status: 'Status', createdAt: 'CreatedAt', updatedAt: 'UpdatedAt',
    userId: 'UserId', personalNotes: 'Notes', image: 'Image', expertRatings: 'Expert Ratings'
};

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
                id: row.get("Status") || row.get("Name"), // Fallback for ID
                name: row.get("Name"),
                vintage: parseInt(row.get("Vintage")) || new Date().getFullYear(),
                country: row.get("Country"),
                region: row.get("Region"),
                subRegion: row.get("Sub-region"),
                type: row.get("Type") as Wine["type"],
                grapes,
                producer: row.get("Producer") || "",
                alcoholContent: parseFloat(row.get("Alcohol%")) || undefined,
                bottleSize: row.get("Bottle Size"),
                quantity: !isNaN(parseInt(row.get("Quantity"))) ? parseInt(row.get("Quantity")) : 1,
                location: row.get("Location"),
                drinkFrom: parseInt(row.get("Drink From")) || undefined,
                drinkTo: parseInt(row.get("Drink To")) || undefined,
                boughtAt: row.get("Bought At"),
                boughtDate: row.get("Bought Date"),
                price: parseFloat(row.get("Price")) || undefined,
                rating: parseFloat(row.get("Rating")) || undefined,
                tastingNotes,
                pairingSuggestions: row.get("Pairing"),
                image: row.get("Image"),
                dateAdded: row.get("CreatedAt"),
                status: row.get("Status"),
                createdAt: row.get("CreatedAt"),
                updatedAt: row.get("UpdatedAt"),
                userId: row.get("UserId"),
                personalNotes: row.get("Notes"),
                expertRatings: row.get("Expert Ratings"),
            }
        });
    } catch (error) {
        console.error(`Error fetching ${sheetTitle} from Sheets:`, error);
        return [];
    }
}

export async function addWine(wine: Omit<Wine, "id" | "dateAdded">, destinations: ("Cellar" | "Wishlist")[]): Promise<void> {
    const doc = await getDoc();

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newWine: Record<string, string | number | string[] | undefined> = {
        ...wine,
        image: wine.image,
        status: id, // Use status as UUID storage
        createdAt: now,
        updatedAt: now,
        id: id,
        dateAdded: now,
        tastingNotes: JSON.stringify(wine.tastingNotes || []),
        grapes: JSON.stringify(wine.grapes || []),
    };

    try {
        for (const title of destinations) {
            let sheet = doc.sheetsByTitle[title];
            if (!sheet) {
                sheet = await doc.addSheet({ headerValues: HEADER_VALUES, title });
            }

            // Object-based append to guarantee column alignment
            const rowData: Record<string, string> = {};
            Object.entries(newWine).forEach(([key, val]) => {
                const header = KEY_TO_HEADER[key];
                if (header) {
                    rowData[header] = val !== undefined && val !== null ? val.toString() : "";
                }
            });

            await sheet.addRow(rowData);

            revalidatePath("/cellar");
            revalidatePath("/wishlist");
            revalidatePath("/");
        }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[Storage] Save Failed: ${message}`);
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
    // We use "Status" column as our internal ID
    const row = rows.find((r) => r.get("Status") === id);

    if (row) {
        console.log(`[Storage] Updating row for ID: ${id} in ${sheetTitle}`);
        const serializedUpdates: Record<string, string | number | string[] | undefined> = { ...updates };

        if (updates.tastingNotes) serializedUpdates.tastingNotes = JSON.stringify(updates.tastingNotes);
        if (updates.grapes) serializedUpdates.grapes = JSON.stringify(updates.grapes);

        Object.entries(serializedUpdates).forEach(([key, value]) => {
            const header = KEY_TO_HEADER[key];
            if (header && value !== undefined && value !== null && key !== "id") {
                console.log(`[Storage] Writing ${value} to column: ${header}`);
                row.set(header, value.toString());
            }
        });
        await row.save();
        console.log(`[Storage] Save successful for ID: ${id}`);
    } else {
        console.warn(`[Storage] Row NOT FOUND for ID: ${id} in ${sheetTitle}`);
    }
}
