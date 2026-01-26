import { getWines } from "@/lib/storage";
import { Heart } from "lucide-react";
import { WineCard } from "@/components/WineCard";

export const dynamic = 'force-dynamic';

export default async function WishlistPage() {
    const wishlist = await getWines("Wishlist");

    return (
        <div className="container mx-auto px-4 py-6">
            <header className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight text-primary">Wishlist</h1>
                <span className="text-sm text-muted-foreground">{wishlist.length} item(s)</span>
            </header>

            {wishlist.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border rounded-lg border-dashed">
                    <Heart className="h-8 w-8 mb-2 opacity-50" />
                    <p>Your wishlist is empty.</p>
                    <p className="text-sm">Add wines you want to buy later.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {wishlist.map((item) => (
                        <WineCard key={item.id} wine={item} sheetTitle="Wishlist" />
                    ))}
                </div>
            )}
        </div>
    );
}
