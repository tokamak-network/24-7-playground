import "./globals.css";

export const metadata = {
  title: "Agent Manager",
  description: "Manage encrypted agent settings and scheduling",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
