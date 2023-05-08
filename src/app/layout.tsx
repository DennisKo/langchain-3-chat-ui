import "./globals.css";
import { Inter, Source_Code_Pro } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const scp = Source_Code_Pro({ subsets: ["latin"], variable: "--font-scp" });

export const metadata = {
  title: "Langchain ChatUI ⚡️",
  description: "OpenAI ChatUI. Powered by Langchain, Nextjs and OpenAI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${scp.variable} h-full`}>
        {children}
      </body>
    </html>
  );
}
