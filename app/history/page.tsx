export const dynamic = 'force-dynamic';
import { getWines } from "@/lib/storage";
import { WineCard } from "@/components/WineCard";

export default async function HistoryPage() {
    const allWines = await getWines("Cellar");
    const consumedWines = allWines.filter(w => w.quantity === 0);

    return (
        <div className="container mx-auto px-4 py-6">
            <header className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight text-primary">History</h1>
                <span className="text-sm text-muted-foreground">{consumedWines.length} bottles consumed</span>
            </header>

            {consumedWines.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <p>No consumed wines yet.</p>
                    <p className="text-sm">Wines will appear here once you've finished them.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-24">
                    {consumedWines.map((wine) => (
                        <WineCard key={wine.id} wine={wine} sheetTitle="Cellar" />
                    ))}
                </div>
            )}
        </div>
    );
}
