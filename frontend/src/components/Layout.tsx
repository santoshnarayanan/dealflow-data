import type { ReactNode } from "react";
import Navbar from "./Navbar";

interface LayoutProps {
    children: ReactNode;
}

function Layout({ children }: LayoutProps) {
    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            {/* Navbar */}
            <Navbar />

            {/* Main content */}
            <main className="flex-grow container mx-auto p-6">{children}</main>

            {/* Footer */}
            <footer className="bg-gray-800 text-gray-300 p-4 text-center">
                <p>
                    © {new Date().getFullYear()} <span className="font-semibold">Dealflow</span>.
                    All rights reserved.
                </p>
            </footer>
        </div>
    );
}

export default Layout;
