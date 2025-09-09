import "./globals.css";

export const metadata = {
  title: "LAMEBOY",
  description: "Let All Mankind Evolve",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        style={{ fontFamily: "var(--mono)" }}
        className="bg-black text-white antialiased"
      >
        {children}
      </body>
    </html>
  );
}
