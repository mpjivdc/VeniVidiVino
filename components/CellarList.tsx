"use client"

import { useState } from "react"
import { Wine } from "@/lib/types"
import { WineCard } from "./WineCard"
import { Filter, History, ChevronDown, Check, X } from "lucide-react"
import { Button } from "./ui/button"
import { getFlag } from "./WineCard"

interface CellarListProps {
    initialWines: Wine[]
}

export function CellarList({ initialWines }: CellarListProps) {
    const [wines, setWines] = useState<Wine[]>(initialWines)
    const [isFilterOpen, setIsFilterOpen] = useState(false)

    // Filter State
    const [showFinished, setShowFinished] = useState(false)
    const [filterType, setFilterType] = useState<string>("All")
    const [selectedVintages, setSelectedVintages] = useState<number[]>([])
    const [selectedCountries, setSelectedCountries] = useState<string[]>([])
    const [filterRating, setFilterRating] = useState<number>(0)

    // Dynamic Data Extraction
    const availableVintages = Array.from(new Set(wines.map(w => w.vintage)))
        .filter(Boolean)
        .sort((a, b) => b - a)

    const availableCountries = Array.from(new Set(wines.map(w => w.country)))
        .filter(Boolean)
        .sort()

    const handleWineUpdate = (id: string, newQuantity: number) => {
        setWines(prevWines =>
            prevWines.map(wine =>
                wine.id === id ? { ...wine, quantity: newQuantity } : wine
            )
        )
    }

    const toggleVintage = (v: number) => {
        setSelectedVintages(prev =>
            prev.includes(v) ? prev.filter(item => item !== v) : [...prev, v]
        )
    }

    const toggleCountry = (c: string) => {
        setSelectedCountries(prev =>
            prev.includes(c) ? prev.filter(item => item !== c) : [...prev, c]
        )
    }

    const filteredWines = wines.filter(w => {
        // Status filter
        if (!showFinished && w.quantity <= 0) return false;

        // Type filter
        if (filterType !== "All" && w.type !== filterType) return false;

        // Vintage filter (Multi-select)
        if (selectedVintages.length > 0 && !selectedVintages.includes(w.vintage)) return false;

        // Country filter (Multi-select)
        if (selectedCountries.length > 0 && !selectedCountries.includes(w.country)) return false;

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

                {/* version tag */}
                <div className="text-center py-2 -mt-2">
                    <p className="text-[9px] text-primary/40 font-black tracking-[0.2em] uppercase">V4.3-DYNAMIC-FILTERS</p>
                </div>

                {/* Filter Menu Drawer */}
                {isFilterOpen && (
                    <div className="mt-6 p-6 bg-card border border-white/5 rounded-[3rem] shadow-2xl animate-in slide-in-from-top-4 duration-300">
                        <div className="space-y-8">
                            {/* Status & Type */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary mb-3 flex justify-between items-center">
                                        Display
                                    </label>
                                    <button
                                        onClick={() => setShowFinished(!showFinished)}
                                        className={`w-full py-3.5 px-4 rounded-2xl border text-[10px] font-black tracking-widest transition-all uppercase ${showFinished ? "bg-primary/20 border-primary/50 text-white shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)]" : "bg-white/5 border-white/5 text-muted-foreground"}`}
                                    >
                                        {showFinished ? "SHOWING FINISHED" : "HIDDEN FINISHED"}
                                    </button>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary mb-3 flex justify-between items-center">
                                        Type
                                    </label>
                                    <div className="relative group">
                                        <select
                                            value={filterType}
                                            onChange={(e) => setFilterType(e.target.value)}
                                            className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-3.5 text-[10px] font-black tracking-widest focus:outline-none focus:ring-1 focus:ring-primary appearance-none uppercase"
                                        >
                                            {wineTypes.map(t => <option key={t} value={t} className="bg-neutral-900">{t}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/40 pointer-events-none group-focus-within:text-primary transition-colors" />
                                    </div>
                                </div>
                            </div>

                            {/* Dynamic Vintages Multi-Select */}
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-primary mb-3 flex justify-between items-center">
                                    Vintages
                                    {selectedVintages.length > 0 && (
                                        <span className="bg-primary text-white px-2 py-0.5 rounded-full text-[9px] font-black shadow-lg shadow-primary/20">{selectedVintages.length}</span>
                                    )}
                                </label>
                                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                                    {availableVintages.length > 0 ? availableVintages.map(v => (
                                        <button
                                            key={v}
                                            onClick={() => toggleVintage(v)}
                                            className={`px-3 py-2 rounded-xl border text-[10px] font-bold transition-all ${selectedVintages.includes(v) ? "bg-primary border-primary text-white shadow-md shadow-primary/20" : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10"}`}
                                        >
                                            {selectedVintages.includes(v) && <Check className="w-2.5 h-2.5 inline-block mr-1" />}
                                            {v}
                                        </button>
                                    )) : <p className="text-[10px] text-muted-foreground italic opacity-50">None available</p>}
                                </div>
                            </div>

                            {/* Dynamic Countries Multi-Select */}
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-primary mb-3 flex justify-between items-center">
                                    Origin
                                    {selectedCountries.length > 0 && (
                                        <span className="bg-primary text-white px-2 py-0.5 rounded-full text-[9px] font-black shadow-lg shadow-primary/20">{selectedCountries.length}</span>
                                    )}
                                </label>
                                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                                    {availableCountries.length > 0 ? availableCountries.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => toggleCountry(c)}
                                            className={`px-3 py-2 rounded-xl border text-[10px] font-bold transition-all flex items-center gap-2 ${selectedCountries.includes(c) ? "bg-primary border-primary text-white shadow-md shadow-primary/20" : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10"}`}
                                        >
                                            <span className="text-xs">{getFlag(c)}</span>
                                            {c}
                                            {selectedCountries.includes(c) && <Check className="w-2.5 h-2.5" />}
                                        </button>
                                    )) : <p className="text-[10px] text-muted-foreground italic opacity-50">None available</p>}
                                </div>
                            </div>

                            {/* Rating */}
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-primary mb-3 flex justify-between items-center">
                                    Minimum Rating
                                    {filterRating > 0 && <span className="bg-primary text-white px-2 py-0.5 rounded-full text-[9px] font-black shadow-lg shadow-primary/20">{filterRating}★</span>}
                                </label>
                                <div className="flex items-center gap-2">
                                    {[0, 1, 2, 3, 4, 5].map(r => (
                                        <button
                                            key={r}
                                            onClick={() => setFilterRating(r)}
                                            className={`flex-1 py-2.5 rounded-xl border text-[10px] font-black transition-all ${filterRating === r ? "bg-primary border-primary text-white shadow-md shadow-primary/20" : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10"}`}
                                        >
                                            {r === 0 ? "ANY" : `${r}+ ★`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Reset Button */}
                            <button
                                onClick={() => {
                                    setShowFinished(false);
                                    setFilterType("All");
                                    setSelectedVintages([]);
                                    setSelectedCountries([]);
                                    setFilterRating(0);
                                }}
                                className="w-full py-5 text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-primary transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <X className="w-3 h-3" />
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
