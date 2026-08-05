/**
 * Shared category-icon resolver.
 * Maps a category name → a consistent emoji icon, so every place that shows
 * categories (homepage carousel, header dropdown, mobile menu) looks identical.
 * If the category has an uploaded image, callers should prefer that and only
 * fall back to this resolver.
 */

const ICON_MAP: { keywords: string[]; icon: string }[] = [
    { keywords: ['construction', 'engineering', 'civil', 'architect'],                              icon: '🏗️' },
    { keywords: ['electrical', 'electronics', 'electric'],                                          icon: '⚡' },
    { keywords: ['family', 'kids', 'daily care', 'baby', 'child'],                                 icon: '👨‍👩‍👧‍👦' },
    { keywords: ['fashion', 'personal style', 'clothing', 'apparel', 'garment'],                   icon: '👗' },
    { keywords: ['home & lifestyle', 'home and lifestyle', 'lifestyle', 'home decor', 'interior', 'furniture'], icon: '🏠' },
    { keywords: ['industrial', 'manufacturing', 'factory', 'machinery'],                            icon: '🏭' },
    { keywords: ['agriculture', 'food industry', 'farming', 'agro'],                               icon: '🌾' },
    { keywords: ['auto', 'vehicle', 'motor', 'car', 'bike', 'truck', 'transport'],                icon: '🚗' },
    { keywords: ['sport', 'fitness', 'gym', 'exercise', 'outdoor'],                               icon: '⚽' },
    { keywords: ['health', 'beauty', 'cosmetic', 'skincare', 'medical', 'pharma', 'wellness'],    icon: '💊' },
    { keywords: ['toy', 'game', 'play', 'puzzle'],                                                 icon: '🧸' },
    { keywords: ['bag', 'luggage', 'backpack', 'suitcase'],                                        icon: '👜' },
    { keywords: ['shoe', 'footwear', 'sneaker', 'sandal', 'boot'],                                icon: '👟' },
    { keywords: ['watch', 'jewel', 'accessories', 'sunglass'],                                     icon: '⌚' },
    { keywords: ['gadget', 'tool', 'hardware', 'equipment'],                                       icon: '🔧' },
    { keywords: ['book', 'stationery', 'education', 'office', 'school'],                          icon: '📚' },
    { keywords: ['phone', 'smartphone', 'mobile', 'tablet'],                                       icon: '📱' },
    { keywords: ['computer', 'laptop', 'pc', 'desktop'],                                           icon: '💻' },
    { keywords: ['grocery', 'supermarket', 'vegetable', 'fruit'],                                  icon: '🛒' },
    { keywords: ['pet', 'animal', 'dog', 'cat', 'bird'],                                          icon: '🐾' },
    { keywords: ['energy', 'solar', 'power', 'oil', 'gas'],                                       icon: '🔋' },
    { keywords: ['chemical', 'plastic', 'rubber', 'material'],                                     icon: '🧪' },
    { keywords: ['security', 'safety', 'surveillance', 'cctv'],                                   icon: '🔒' },
    { keywords: ['textile', 'fabric', 'yarn', 'thread'],                                          icon: '🧵' },
    { keywords: ['food', 'restaurant', 'catering', 'bakery'],                                     icon: '🍽️' },
    { keywords: ['printing', 'packaging', 'paper', 'cardboard'],                                  icon: '🖨️' },
];

export function resolveCategoryIcon(name: string, dbIcon?: string): string {
    const lower = (name || '').toLowerCase();
    for (const entry of ICON_MAP) {
        if (entry.keywords.some(kw => lower.includes(kw))) {
            return entry.icon;
        }
    }
    return dbIcon || '📦';
}
