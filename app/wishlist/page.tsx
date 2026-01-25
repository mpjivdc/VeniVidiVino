export default function WishlistPage() {
    return (
        <div className="container mx-auto px-4 py-6">
            <header className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-primary">Wishlist</h1>
                <p className="text-sm text-muted-foreground">Wines you want to buy.</p>
            </header>
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border rounded-lg border-dashed">
                <p>Your wishlist is empty.</p>
                <p className="text-sm">Feature coming soon.</p>
            </div>
        </div>
    );
}
