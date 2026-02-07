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

    const filteredWines = initialWines.filter(w => showFinished ? true : w.quantity > 0)
    const bottleCount = initialWines.filter(w => w.quantity > 0).length

    return (
        <>
            <header className="mb-6 flex items-center justify-between">
                <div className="flex flex-col">
                    <h1 className="text-2xl font-bold tracking-tight text-primary">My Cellar</h1>
                    <span className="text-xs text-muted-foreground">{bottleCount} bottles in stock</span>
                </div>

                <Button
                    variant={showFinished ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowFinished(!showFinished)}
                    className="rounded-full gap-2 text-xs font-bold transition-all h-9"
                >
                    {showFinished ? <History className="h-3.5 w-3.5" /> : <Filter className="h-3.5 w-3.5" />}
                    {showFinished ? "HIDE FINISHED" : "SHOW FINISHED"}
                </Button>
            </header>

            {filteredWines.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <p>{showFinished ? "No wines found." : "Your cellar is empty or all wines are finished."}</p>
                    <p className="text-sm">Start adding wines or check history.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-24">
                    {filteredWines.map((wine) => (
                        <WineCard key={wine.id} wine={wine} sheetTitle="Cellar" />
                    ))}
                </div>
            )}
        </>
    )
}
