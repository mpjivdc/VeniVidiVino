import { AddWineForm } from "@/components/AddWineForm";

export default function AddWinePage() {
    return (
        <div className="container mx-auto px-4 py-6 max-w-lg">
            <header className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-primary">Add New Wine</h1>
                <p className="text-sm text-muted-foreground">Snap a photo and details.</p>
            </header>
            <AddWineForm />
        </div>
    );
}
