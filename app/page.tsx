import { getWines } from "@/lib/storage";
import { WineCard } from "@/components/WineCard";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const wines = await getWines();

  return (
    <div className="container mx-auto px-4 py-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-primary">My Cellar</h1>
        <span className="text-sm text-muted-foreground">{wines.length} bottles</span>
      </header>

      {wines.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <p>Your cellar is empty.</p>
          <p className="text-sm">Start adding wines to track your collection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {wines.map((wine) => (
            <WineCard key={wine.id} wine={wine} />
          ))}
        </div>
      )}
    </div>
  );
}
