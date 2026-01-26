"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Wine, PlusCircle, Heart } from "lucide-react"

export function BottomNav() {
    const pathname = usePathname()

    const isActive = (path: string) => pathname === path

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <nav className="flex h-16 items-center justify-around px-4">
                <Link
                    href="/cellar"
                    className={`flex flex-col items-center justify-center gap-1 text-xs transition-colors ${isActive("/") || isActive("/cellar") ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <Wine className="h-6 w-6" />
                    <span>Cellar</span>
                </Link>
                <Link
                    href="/add"
                    className={`flex flex-col items-center justify-center gap-1 text-xs transition-colors ${isActive("/add") ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <PlusCircle className="h-8 w-8" />
                    <span className="sr-only">Add Wine</span>
                </Link>
                <Link
                    href="/wishlist"
                    className={`flex flex-col items-center justify-center gap-1 text-xs transition-colors ${isActive("/wishlist") ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <Heart className="h-6 w-6" />
                    <span>Wishlist</span>
                </Link>
            </nav>
        </div>
    )
}
