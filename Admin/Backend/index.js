import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './firebase.js';
import { collection, onSnapshot, query, orderBy, getDocs } from 'firebase/firestore';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Listen for orders in the backend to show them in the console
console.log("Starting backend order listener...");
onSnapshot(query(collection(db, 'orders'), orderBy('timestamp', 'desc')), (snapshot) => {
    console.log(`\n--- NEW ORDER UPDATE ---`);
    console.log(`Total Orders: ${snapshot.size}`);
    snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
            const order = change.doc.data();
            console.log(`New Order #${change.doc.id.slice(-6)} from ${order.userName}`);
            console.log(`Items: ${order.items?.length || 0} items | Total: ${order.total} LYD`);
        }
    });
}, (err) => {
    console.error("\n❌ Backend Firestore Error:", err.code);
    console.error("Message:", err.message);
    if (err.code === 'permission-denied') {
        console.error("👉 FIX: Update your Firestore Security Rules in the Firebase Console to allow reads on the 'orders' collection.");
    }
});

const PORT = 5000;

app.get('/api/status', (req, res) => {
    res.json({ status: 'Admin Backend is running' });
});

// Route to get all orders
app.get('/api/orders', async (req, res) => {
    try {
        const snapshot = await getDocs(collection(db, 'orders'));
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Admin Backend running on http://localhost:${PORT}`);
});
