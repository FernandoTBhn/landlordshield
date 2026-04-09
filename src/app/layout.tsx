import type { Metadata } from "next";
import { Lora, Source_Sans_3 } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PostHogProvider from "@/components/PostHogProvider";
import "./globals.css";

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "LandlordShield — UK Landlord Compliance Made Simple",
    template: "%s | LandlordShield",
  },
  description:
    "Know if you're compliant with the Renters' Rights Act in 5 minutes. Track gas safety, EPC, deposit protection, Information Sheets and more. Free for your first property.",
  keywords: [
    "landlord compliance",
    "Renters Rights Act",
    "UK landlord",
    "gas safety certificate",
    "EPC",
    "deposit protection",
    "prescribed information",
    "Information Sheet",
    "Section 21",
    "landlord software",
  ],
  authors: [{ name: "LandlordShield" }],
  creator: "LandlordShield",
  metadataBase: new URL("https://landlordshield.co.uk"),
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://landlordshield.co.uk",
    siteName: "LandlordShield",
    title: "LandlordShield — UK Landlord Compliance Made Simple",
    description:
      "Know if you're compliant with the Renters' Rights Act in 5 minutes. The Information Sheet deadline is 31 May. The fine is up to £7,000 per tenancy.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LandlordShield — UK Landlord Compliance Made Simple",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LandlordShield — UK Landlord Compliance Made Simple",
    description:
      "Know if you're compliant with the Renters' Rights Act in 5 minutes. Free for your first property.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://landlordshield.co.uk",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${lora.variable} ${sourceSans.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        <PostHogProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </PostHogProvider>
      </body>
    </html>
  );
}
