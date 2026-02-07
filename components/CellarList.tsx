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
    const [showFinished, setShowFinished] = useState(false)
    const [wines, setWines] = useState<Wine[]>(initialWines)

    const handleWineUpdate = (id: string, newQuantity: number) => {
        setWines(prevWines =>
            prevWines.map(wine =>
                wine.id === id ? { ...wine, quantity: newQuantity } : wine
            )
        )
    }

    const filteredWines = wines.filter(w => showFinished ? true : w.quantity > 0)
    const bottleCount = wines.filter(w => w.quantity > 0).length

    return (
        <>
            <header className="mb-8 flex items-center justify-between">
                <div className="flex flex-col">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">My Cellar</h1>
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-0.5">{bottleCount} bottles in stock</span>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFinished(!showFinished)}
                    className={`rounded-full gap-2 text-[10px] font-bold transition-all h-10 px-4 border-white/10 ${showFinished ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-card text-muted-foreground hover:text-foreground hover:bg-white/5"}`}
                >
                    {showFinished ? <History className="h-3.5 w-3.5" /> : <Filter className="h-3.5 w-3.5" />}
                    {showFinished ? "HIDE FINISHED" : "SHOW FINISHED"}
                </Button>
            </header>

            {filteredWines.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="bg-white/5 p-6 rounded-full mb-4">
                        <Filter className="h-8 w-8 text-muted-foreground opacity-20" />
                    </div>
                    <p className="text-foreground font-bold">{showFinished ? "No wines found." : "Your cellar is empty."}</p>
                    <p className="text-sm text-muted-foreground mt-1 max-w-[200px]">Start adding wines or check history.</p>
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
