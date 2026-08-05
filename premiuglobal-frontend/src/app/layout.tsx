import type { Metadata } from "next";
import "./globals.css";
import { ReduxProvider } from "@/redux";
import FloatingContact from "@/components/shared/FloatingContact";
import FloatingCart from "@/components/shared/FloatingCart";
import CartDrawer from "@/components/shared/CartDrawer";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.freshfoodbazar.com"),
  title: {
    // Brand-only fallback. Pages set their own title, which the template turns
    // into "<Page> | Premium".
    default: "Premium",
    template: "%s | Premium",
  },
  description: "Premium — fresh, quality food and grocery delivered across Bangladesh at the best prices.",
  keywords: ["fresh food bazar", "fresh food", "grocery", "online food", "bangladesh", "pickle", "honey"],
  applicationName: "Premium",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Premium",
    title: "Premium",
    description: "Premium — fresh, quality food and grocery delivered across Bangladesh at the best prices.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Premium",
    description: "Premium — fresh, quality food and grocery delivered across Bangladesh at the best prices.",
  },
  robots: { index: true, follow: true },
};

import { Toaster } from 'react-hot-toast';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Poppins = storefront, Inter = admin panel (see .admin-shell in globals.css) */}
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-KGFCPH47');`,
          }}
        />
        {/* End Google Tag Manager */}
      </head>
      <body suppressHydrationWarning>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-KGFCPH47"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        <GoogleAnalytics />
        <ReduxProvider>
          <ThemeProvider>
            <Toaster position="top-center" reverseOrder={false} />
            {children}
            <CartDrawer />
            <FloatingCart />
            <FloatingContact />
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}





