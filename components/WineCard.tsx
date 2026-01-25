import Image from "next/image"
import { Wine as WineType } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface WineCardProps {
    wine: WineType
}

export function WineCard({ wine }: WineCardProps) {
    return (
        <Card className="overflow-hidden border-border/40 bg-card/50 backdrop-blur-sm transition-all hover:bg-card/80">
            <CardContent className="p-0 flex h-32">
                <div className="w-24 relative bg-muted shrink-0">
                    {wine.image ? (
                        <Image
                            src={wine.image}
                            alt={wine.name}
                            fill
                            className="object-cover"
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
                            <h3 className="font-semibold text-sm line-clamp-2 leading-tight">{wine.name}</h3>
                            {wine.rating && (
                                <div className="flex items-center bg-primary/20 px-1.5 py-0.5 rounded text-xs text-primary font-medium shrink-0 ml-2">
                                    {wine.rating}
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">{wine.producer}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-[10px] px-1.5 h-5">{wine.year}</Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 h-5 border-primary/30 text-primary">{wine.type}</Badge>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
