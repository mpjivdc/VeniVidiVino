export type WineType = "Red" | "White" | "Rose" | "Sparkling" | "Dessert" | "Fortified" | "Orange" | "Other";

export interface Wine {
    id: string;
    // Identity
    name: string;
    vintage: number;
    country: string;
    region: string;
    subRegion?: string;
    type: WineType;
    grapes?: string[];
    producer: string;

    // Specs
    alcoholContent?: number;
    bottleSize?: string; // e.g. "750ml"

    // Inventory
    quantity: number;
    location?: string;

    // Timeline
    drinkFrom?: number; // Year
    drinkTo?: number;   // Year
    boughtAt?: string;
    boughtDate?: string;
    price?: number;

    // Review
    rating?: number;
    tastingNotes?: string[]; // Multi-select
    pairingSuggestions?: string;

    image?: string;
    dateAdded: string;

    // Final A-Y Alignment Fields
    status?: string;
    createdAt?: string;
    updatedAt?: string;
    userId?: string;
    notes?: string;
}

export interface WishlistItem extends Wine { } // Now they share structure
