const mongoose = require('mongoose');
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL;

const siteContentSchema = new mongoose.Schema({
    theme: {
        primaryColor: String,
        secondaryColor: String,
    }
}, { strict: false });

const SiteContent = mongoose.models.SiteContent || mongoose.model('SiteContent', siteContentSchema, 'sitecontents');

async function updateTheme() {
    try {
        await mongoose.connect(DATABASE_URL);
        console.log('Connected to MongoDB');

        // Find existing site content or create one if it doesn't exist
        let content = await SiteContent.findOne();
        if (!content) {
            content = new SiteContent({
                theme: {
                    primaryColor: '#C5A059',
                    secondaryColor: '#333333'
                }
            });
            await content.save();
        } else {
            // Update existing content
            await SiteContent.updateOne(
                { _id: content._id },
                { $set: { "theme.primaryColor": "#C5A059", "theme.secondaryColor": "#333333" } }
            );
        }

        console.log('Theme updated successfully.');
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

updateTheme();
