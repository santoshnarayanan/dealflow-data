import { ReactNode } from "react";
import Navbar from "./Navbar";

interface LayoutProps {
  children: ReactNode;
}

function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto p-6">{children}</main>
      <footer className="bg-gray-900 text-white p-4 text-center">
        Dealflow © {new Date().getFullYear()}
      </footer>
    </div>
  );
}

export default Layout;
