export const metadata = {
  title: "PostCraft — LinkedIn Post Generator",
  description: "Generate crisp LinkedIn posts from a guided chat.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
