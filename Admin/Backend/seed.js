import { db } from './firebase.js';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seed() {
    console.log("🚀 Starting bulk product upload...");

    try {
        const filePath = path.join(__dirname, 'products.json');
        if (!fs.existsSync(filePath)) {
            console.error("❌ Error: products.json not found in Admin/Backend/ directory.");
            return;
        }

        const productsData = fs.readFileSync(filePath, 'utf-8');
        const products = JSON.parse(productsData);

        if (!Array.isArray(products)) {
            console.error("❌ Error: products.json must be an array of products.");
            return;
        }

        console.log(`📦 Found ${products.length} products to upload.`);

        let successCount = 0;
        let failCount = 0;

        for (const product of products) {
            try {
                // Handle placeholder images or non-existent images
                const image = (product.image && product.image.includes('...')) ? "" : (product.image || "");

                const formattedProduct = {
                    ...product,
                    image: image,
                    price: parseFloat(product.price) || 0,
                    stock: parseInt(product.stock) || 0,
                    createdAt: serverTimestamp()
                };

                await addDoc(collection(db, 'products'), formattedProduct);
                successCount++;
                if (successCount % 10 === 0) {
                    console.log(`✅ Progress: ${successCount}/${products.length} items added...`);
                }
            } catch (e) {
                failCount++;
                console.error(`❌ Error adding ${product.name}: `, e.message);
            }
        }
        console.log(`\n✨ Bulk upload complete!`);
        console.log(`✅ Successfully added: ${successCount}`);
        console.log(`❌ Failed: ${failCount}`);
    } catch (err) {
        console.error("❌ Fatal Error during seeding:", err.message);
    }
}

seed();
