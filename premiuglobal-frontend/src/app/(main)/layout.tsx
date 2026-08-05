import Header from "@/components/layout/Header/Header";
import NewFooter from "@/components/layout/Footer/NewFooter";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import MobileSearchOverlay from "@/components/layout/MobileSearchOverlay";

export default function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <Header />
            <main>
                {children}
            </main>
            <NewFooter />
            {/* Sticky bottom nav for phones/tablets; the padding keeps content
                clear of it. Both are hidden on desktop (lg+). */}
            <div className="lg:hidden h-[58px]" aria-hidden />
            <MobileBottomNav />
            <MobileSearchOverlay />
        </>
    );
}
