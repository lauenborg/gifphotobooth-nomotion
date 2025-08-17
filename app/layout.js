import { Geist, Geist_Mono, Anton } from "next/font/google";
import "./globals.css";
import "./style.scss";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
});

export const metadata = {
  title: "GIF Photobooth",
  description: "Face on GIFs",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${anton.variable} antialiased overflow-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
