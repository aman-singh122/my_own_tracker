import "./globals.css";

export const metadata = {
  title: "180-Day Productivity Tracker",
  description: "Track 6-hour study discipline for 180 days",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 min-h-screen">{children}</body>
    </html>
  );
}
