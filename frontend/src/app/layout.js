import "./globals.css";

export const metadata = {
  title: "FAANG 175-Day DSA Challenge",
  description: "175-day disciplined roadmap for DSA, system design, and evening execution",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 min-h-screen">{children}</body>
    </html>
  );
}
