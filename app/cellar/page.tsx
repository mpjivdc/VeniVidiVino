export const dynamic = 'force-dynamic';
import { getWines } from "@/lib/storage";
import { CellarList } from "@/components/CellarList";

export default async function CellarPage() {
  const wines = await getWines("Cellar");

  return (
    <div className="container mx-auto px-4 py-6">
      <CellarList initialWines={wines} />
    </div>
  );
}
