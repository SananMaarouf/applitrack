import "./globals.css";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import HeaderAuth from "@/components/header-auth";
import { Toaster } from "@/components/ui/toaster";
import { HomeButton } from "@/components/homeButton"
import { Footer } from "@/components/footer";


const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Applitrack",
  description: "A job application tracker to help you organize your job search.",
  other: {
    "google-site-verification": "-TzfPaAsZvr4tsndZwCHrgHcPz6MAeflFIfCwP8rg3w",
  },
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground min-h-screen flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <main className="flex flex-col items-center grow">
            <section className="flex-1 w-full flex flex-col gap-6 items-center">
              <nav className="w-full flex justify-center h-16">
                <section className="
                  w-full max-w-5xl flex justify-between items-center 
                  px-1 md:px-0 text-sm py-2">
                  <HomeButton />
                  <HeaderAuth />
                </section>
              </nav>

              <section className="flex flex-col gap-6 my-auto w-full max-w-5xl">
                {children}
              </section>

              <Footer />
            </section>
          </main>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
