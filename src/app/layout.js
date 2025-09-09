import "./globals.css";

/**
 * Global <head> metadata
 */
export const metadata = {
  title: "LAMEBOY",
  description: "Let All Mankind Evolve — storefront under active development.",
  metadataBase: new URL("https://lameboy.com"),
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "LAMEBOY",
    description: "Let All Mankind Evolve — storefront under active development.",
    url: "https://lameboy.com",
    siteName: "LAMEBOY",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LAMEBOY",
    description: "Let All Mankind Evolve — storefront under active development.",
  },
};

/**
 * Optional viewport hints
 */
export const viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Keep everything on the VS Code mono stack + pitch black theme */}
      <body
        className="bg-black text-white antialiased"
        style={{
          fontFamily: "var(--mono)", // defined in globals.css
        }}
      >
        {children}
      </body>
    </html>
  );
}
