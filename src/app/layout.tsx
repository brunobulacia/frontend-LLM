import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";


//COMPONENTES PARA RENDERIZAR EL SIDEBAR A UN LADO
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { AuthInitializer } from "@/components/auth/AuthInitializer";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FICCT Noticias - Generador de Contenidos",
  description: "Generador de Contenidos para FICCT Noticias",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
   <html lang="en">
      <body>
        <AuthInitializer>
          <main>{children}</main>
          <Toaster />
        </AuthInitializer>
      </body>
    </html>
  );
}
