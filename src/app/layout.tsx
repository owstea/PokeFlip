import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
    title: "Flip Tracker",
    description: "Suivi des achats et ventes",
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="fr">
        <body className="bg-zinc-900 text-white">
        <Navbar />
        <main className="pt-16">
            {children}
        </main>
        </body>
        </html>
    );
}
