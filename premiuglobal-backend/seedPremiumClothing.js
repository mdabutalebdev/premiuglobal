const mongoose = require('mongoose');
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL;

const productSchema = new mongoose.Schema({
    name: String, slug: String, sku: String, description: String, tagline: String,
    priceType: String, productType: String, price: Number, originalPrice: Number, discount: Number,
    thumbnail: String, images: [String], category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    variants: [], stock: Number, status: String, visibility: String, isDeleted: Boolean,
    tags: [String], colors: [String], colorHex: [String], sizes: [String], aiLabels: [String],
    rating: Number, reviewCount: Number, totalSold: Number, viewCount: Number,
    likeCount: Number, commentCount: Number, shareCount: Number,
}, { timestamps: true });

// Check if model already exists to avoid OverwriteModelError
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
const Category = mongoose.models.Category || mongoose.model('Category', new mongoose.Schema({ name: String, slug: String }));

async function seed() {
    try {
        await mongoose.connect(DATABASE_URL);
        console.log('Connected to MongoDB');

        // Create new categories if they don't exist
        const catNames = ['Shirts', 'Pants', 'T-Shirts', 'Sarees'];
        const catMap = {};

        for (const name of catNames) {
            let cat = await Category.findOne({ name });
            if (!cat) {
                const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                cat = await Category.create({ name, slug });
                console.log(`Created category: ${name}`);
            }
            catMap[name] = cat._id;
        }

        const products = [
            {
                name: 'Premium Formal Men\'s Shirt',
                description: 'Elegant formal shirt tailored with premium cotton, perfect for business meetings and formal events.',
                tagline: 'Refined elegance for professionals',
                price: 2500,
                originalPrice: 3200,
                thumbnail: 'https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?w=500&q=80',
                images: ['https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?w=800&q=80'],
                category: catMap['Shirts'],
                tags: ['shirt', 'men', 'formal', 'cotton'],
                colors: ['White', 'Light Blue'],
                sizes: ['M', 'L', 'XL'],
                stock: 45,
                rating: 4.8, reviewCount: 112, totalSold: 340, viewCount: 1500,
            },
            {
                name: 'Casual Checkered Oxford Shirt',
                description: 'Classic checkered Oxford shirt made from breathable fabric. Ideal for casual Fridays or weekend outings.',
                tagline: 'Casual comfort meets style',
                price: 1800,
                originalPrice: 2200,
                thumbnail: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500&q=80',
                images: ['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80'],
                category: catMap['Shirts'],
                tags: ['shirt', 'men', 'casual', 'checkered'],
                colors: ['Red', 'Navy'],
                sizes: ['S', 'M', 'L', 'XL'],
                stock: 60,
                rating: 4.6, reviewCount: 89, totalSold: 210, viewCount: 900,
            },
            {
                name: 'Luxury Slim Fit Chino Pants',
                description: 'Premium stretch chinos providing a modern slim fit while ensuring maximum mobility and comfort all day.',
                tagline: 'Modern fit, all-day comfort',
                price: 2800,
                originalPrice: 3500,
                thumbnail: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500&q=80',
                images: ['https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&q=80'],
                category: catMap['Pants'],
                tags: ['pant', 'men', 'chino', 'slim fit'],
                colors: ['Khaki', 'Navy', 'Olive'],
                sizes: ['30', '32', '34', '36'],
                stock: 50,
                rating: 4.7, reviewCount: 65, totalSold: 180, viewCount: 1100,
            },
            {
                name: 'Classic Denim Jeans',
                description: 'Timeless blue denim jeans crafted with durable stitching and premium fade-resistant wash.',
                tagline: 'The everyday essential',
                price: 3200,
                originalPrice: 4000,
                thumbnail: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&q=80',
                images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80'],
                category: catMap['Pants'],
                tags: ['pant', 'jeans', 'denim', 'casual'],
                colors: ['Blue', 'Black'],
                sizes: ['30', '32', '34'],
                stock: 80,
                rating: 4.9, reviewCount: 230, totalSold: 560, viewCount: 2200,
            },
            {
                name: 'Graphic Print Pure Cotton T-Shirt',
                description: 'Comfortable pure cotton t-shirt featuring a modern graphic print. Soft to the touch and highly breathable.',
                tagline: 'Express yourself',
                price: 900,
                originalPrice: 1200,
                thumbnail: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80',
                images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80'],
                category: catMap['T-Shirts'],
                tags: ['t-shirt', 'men', 'graphic', 'cotton'],
                colors: ['White', 'Black', 'Grey'],
                sizes: ['M', 'L', 'XL'],
                stock: 120,
                rating: 4.5, reviewCount: 145, totalSold: 420, viewCount: 1800,
            },
            {
                name: 'Premium Basic V-Neck T-Shirt',
                description: 'Minimalist V-neck t-shirt made of high-quality stretch fabric. An essential piece for any wardrobe.',
                tagline: 'Simplicity at its best',
                price: 750,
                originalPrice: 950,
                thumbnail: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500&q=80',
                images: ['https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80'],
                category: catMap['T-Shirts'],
                tags: ['t-shirt', 'basic', 'v-neck'],
                colors: ['Black', 'White'],
                sizes: ['S', 'M', 'L'],
                stock: 150,
                rating: 4.6, reviewCount: 210, totalSold: 630, viewCount: 3000,
            },
            {
                name: 'Exclusive Silk Jamdani Saree',
                description: 'Traditional handcrafted Silk Jamdani saree with intricate golden zari work. Perfect for weddings and festivals.',
                tagline: 'Heritage wrapped in elegance',
                price: 15000,
                originalPrice: 18500,
                thumbnail: 'https://images.unsplash.com/photo-1610189045763-79d34e262de6?w=500&q=80',
                images: ['https://images.unsplash.com/photo-1610189045763-79d34e262de6?w=800&q=80'],
                category: catMap['Sarees'],
                tags: ['saree', 'women', 'silk', 'traditional', 'wedding'],
                colors: ['Red', 'Gold'],
                sizes: ['Free Size'],
                stock: 10,
                rating: 4.9, reviewCount: 35, totalSold: 45, viewCount: 2500,
            },
            {
                name: 'Pure Cotton Handloom Saree',
                description: 'Comfortable and lightweight pure cotton handloom saree for daily wear and casual outings.',
                tagline: 'Breathable comfort, timeless style',
                price: 3500,
                originalPrice: 4200,
                thumbnail: 'https://images.unsplash.com/photo-1583391733959-f18305f61dfa?w=500&q=80',
                images: ['https://images.unsplash.com/photo-1583391733959-f18305f61dfa?w=800&q=80'],
                category: catMap['Sarees'],
                tags: ['saree', 'women', 'cotton', 'handloom'],
                colors: ['Blue', 'Yellow'],
                sizes: ['Free Size'],
                stock: 25,
                rating: 4.7, reviewCount: 56, totalSold: 110, viewCount: 1300,
            }
        ];

        // Add computed fields
        products.forEach(p => {
            p.slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
            p.sku = 'SKU-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
            p.status = 'active';
            p.visibility = 'visible';
            p.isDeleted = false;
            p.priceType = 'fixed';
            p.productType = 'simple';
            if (p.originalPrice && p.originalPrice > p.price) {
                p.discount = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
            }
            p.likeCount = Math.floor(Math.random() * 50);
            p.commentCount = p.reviewCount;
            p.shareCount = Math.floor(Math.random() * 30);
        });

        const result = await Product.insertMany(products);
        console.log(`\nInserted ${result.length} new clothing products:`);
        result.forEach(p => console.log(`  ✅ ${p.name} — ৳${p.price}`));

        await mongoose.disconnect();
        console.log('\nDone!');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

seed();
