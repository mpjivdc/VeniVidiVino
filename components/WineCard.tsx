"use client"

import Image from "next/image"
import { Wine as WineType } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import { WineDetailView } from "./WineDetailView"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { useState } from "react"

interface WineCardProps {
    wine: WineType
    sheetTitle: "Cellar" | "Wishlist"
}

export function WineCard({ wine, sheetTitle }: WineCardProps) {
    const [isOpen, setIsOpen] = useState(false)

    // Drinking Window Logic (Definitive 2026 implementation)
    const currentYear = 2026;
    let windowStatus: { color: string, label: string } | null = null;

    if (wine.drinkFrom && wine.drinkTo) {
        if (currentYear < wine.drinkFrom) {
            windowStatus = { color: "bg-blue-500", label: "Too young" }
        } else if (currentYear >= wine.drinkFrom && currentYear < wine.drinkTo) {
            windowStatus = { color: "bg-green-500", label: "Ready to drink" }
        } else if (currentYear === wine.drinkTo) {
            windowStatus = { color: "bg-orange-500", label: "Drink now" }
        } else if (currentYear > wine.drinkTo) {
            windowStatus = { color: "bg-red-500", label: "Past peak" }
        }
    }

    return (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <DrawerTrigger asChild>
                <Card className="overflow-hidden border-border/40 bg-card/50 backdrop-blur-sm transition-all hover:bg-card/80 active:scale-[0.98] cursor-pointer relative">
                    {windowStatus && (
                        <div className="absolute top-2 right-2 z-10">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className={`w-3 h-3 rounded-full ${windowStatus.color} shadow-sm border border-white/20`} />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="text-xs font-semibold">{windowStatus.label}</p>
                                        <p className="text-[10px] opacity-70">Window: {wine.drinkFrom} - {wine.drinkTo}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    )}
                    <CardContent className="p-0 flex h-32">
                        <div className="w-24 relative bg-muted shrink-0">
                            {wine.image ? (
                                <img
                                    src={wine.image}
                                    alt={wine.name}
                                    className="object-cover w-full h-full"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-muted-foreground text-xs p-2 text-center">
                                    No Image
                                </div>
                            )}
                        </div>
                        <div className="flex-1 p-3 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-semibold text-sm line-clamp-2 leading-tight pr-4">{wine.name}</h3>
                                    {wine.rating && (
                                        <div className="flex items-center bg-primary/20 px-1.5 py-0.5 rounded text-xs text-primary font-medium shrink-0 ml-2">
                                            {wine.rating}
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-1">{wine.producer}</p>
                                {wine.country && <p className="text-[10px] text-muted-foreground opacity-80">{wine.region ? `${wine.region}, ` : ''}{wine.country}</p>}
                            </div>
                            <div className="flex items-center gap-2 mt-2 overflow-hidden">
                                <Badge variant="secondary" className="text-[10px] px-1.5 h-5 shrink-0">{wine.vintage}</Badge>
                                <Badge variant="outline" className="text-[10px] px-1.5 h-5 border-primary/30 text-primary shrink-0">{wine.type}</Badge>
                                {wine.grapes && wine.grapes.length > 0 && (
                                    <span className="text-[10px] text-muted-foreground truncate ml-1">{wine.grapes.join(", ")}</span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </DrawerTrigger>
            <DrawerContent className="p-0 border-none bg-transparent">
                <WineDetailView wine={wine} sheetTitle={sheetTitle} onClose={() => setIsOpen(false)} />
            </DrawerContent>
        </Drawer>
    )
}
