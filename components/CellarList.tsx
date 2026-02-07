"use client"

import { useState } from "react"
import { Wine } from "@/lib/types"
import { WineCard } from "./WineCard"
import { Filter, History } from "lucide-react"
import { Button } from "./ui/button"

interface CellarListProps {
    initialWines: Wine[]
}

export function CellarList({ initialWines }: CellarListProps) {
    const [wines, setWines] = useState<Wine[]>(initialWines)
    const [isFilterOpen, setIsFilterOpen] = useState(false)

    // Filter State
    const [showFinished, setShowFinished] = useState(false)
    const [filterType, setFilterType] = useState<string>("All")
    const [filterVintage, setFilterVintage] = useState<string>("")
    const [filterCountry, setFilterCountry] = useState<string>("")
    const [filterRating, setFilterRating] = useState<number>(0)

    const handleWineUpdate = (id: string, newQuantity: number) => {
        setWines(prevWines =>
            prevWines.map(wine =>
                wine.id === id ? { ...wine, quantity: newQuantity } : wine
            )
        )
    }

    const filteredWines = wines.filter(w => {
        // Status filter
        if (!showFinished && w.quantity <= 0) return false;

        // Type filter
        if (filterType !== "All" && w.type !== filterType) return false;

        // Vintage filter
        if (filterVintage && w.vintage.toString() !== filterVintage) return false;

        // Country filter
        if (filterCountry && !w.country.toLowerCase().includes(filterCountry.toLowerCase())) return false;

        // Rating filter
        if (filterRating > 0 && (w.rating || 0) < filterRating) return false;

        return true;
    })

    const bottleCount = wines.filter(w => w.quantity > 0).length
    const wineTypes = ["All", "Red", "White", "Rose", "Sparkling", "Dessert", "Fortified", "Orange", "Other"]

    return (
        <>
            <header className="mb-8 relative z-20">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">My Cellar</h1>
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-0.5">{bottleCount} bottles in stock</span>
                    </div>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className={`rounded-xl transition-all h-12 w-12 border-white/5 ${isFilterOpen ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-card text-muted-foreground hover:text-foreground hover:bg-white/5"}`}
                    >
                        <Filter className="h-5 w-5" />
                    </Button>
                </div>

                {/* Filter Menu Drawer */}
                {isFilterOpen && (
                    <div className="mt-6 p-6 bg-card border border-white/5 rounded-[2rem] shadow-2xl animate-in slide-in-from-top-4 duration-300">
                        <div className="space-y-6">
                            {/* Status & Type */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-3 block">Display</label>
                                    <button
                                        onClick={() => setShowFinished(!showFinished)}
                                        className={`w-full py-3 px-4 rounded-xl border text-xs font-bold transition-all ${showFinished ? "bg-primary/10 border-primary/30 text-primary" : "bg-white/5 border-white/5 text-muted-foreground"}`}
                                    >
                                        {showFinished ? "SHOWING FINISHED" : "HIDDEN FINISHED"}
                                    </button>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-3 block">Type</label>
                                    <select
                                        value={filterType}
                                        onChange={(e) => setFilterType(e.target.value)}
                                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
                                    >
                                        {wineTypes.map(t => <option key={t} value={t} className="bg-neutral-900">{t}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Vintage & Country */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-3 block">Vintage</label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 2019"
                                        value={filterVintage}
                                        onChange={(e) => setFilterVintage(e.target.value)}
                                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/20"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-3 block">Origin</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Italy"
                                        value={filterCountry}
                                        onChange={(e) => setFilterCountry(e.target.value)}
                                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/20"
                                    />
                                </div>
                            </div>

                            {/* Rating */}
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-3 block">Minimum Rating</label>
                                <div className="flex items-center gap-2">
                                    {[0, 1, 2, 3, 4, 5].map(r => (
                                        <button
                                            key={r}
                                            onClick={() => setFilterRating(r)}
                                            className={`flex-1 py-2 rounded-lg border text-[10px] font-black transition-all ${filterRating === r ? "bg-primary border-primary text-white shadow-md shadow-primary/20" : "bg-white/5 border-white/5 text-muted-foreground"}`}
                                        >
                                            {r === 0 ? "ANY" : `${r}+`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Reset Button */}
                            <button
                                onClick={() => {
                                    setShowFinished(false);
                                    setFilterType("All");
                                    setFilterVintage("");
                                    setFilterCountry("");
                                    setFilterRating(0);
                                }}
                                className="w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors mt-2"
                            >
                                RESET FILTERS
                            </button>
                        </div>
                    </div>
                )}
            </header>

            {filteredWines.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="bg-white/5 p-6 rounded-full mb-4">
                        <Filter className="h-8 w-8 text-muted-foreground opacity-20" />
                    </div>
                    <p className="text-foreground font-bold">No matches found.</p>
                    <p className="text-sm text-muted-foreground mt-1 max-w-[200px]">Try adjusting your filters or search criteria.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-24">
                    {filteredWines.map((wine) => (
                        <WineCard
                            key={wine.id}
                            wine={wine}
                            sheetTitle="Cellar"
                            onQuantityChange={handleWineUpdate}
                        />
                    ))}
                </div>
            )}
        </>
    )
}
