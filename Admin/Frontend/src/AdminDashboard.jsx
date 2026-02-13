import React, { useState, useEffect } from 'react';
import {
    collection,
    query,
    onSnapshot,
    updateDoc,
    doc,
    orderBy,
    addDoc,
    deleteDoc,
    serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import logo from './logo.png';

import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    ShoppingBag,
    Package,
    Settings,
    LogOut,
    CheckCircle,
    XCircle,
    Clock,
    TrendingUp,
    Users,
    Edit3,
    Trash2,
    Eye,
    Plus,
    Megaphone,
    MessageSquare,
    ChevronRight,
    Search
} from 'lucide-react';

const velocityTransition = {
    type: "tween",
    ease: [0.16, 1, 0.3, 1],
    duration: 0.6
};

const AdminDashboard = ({ user, onLogout }) => {
    const [activeTab, setActiveTab] = useState('orders');
    const [orders, setOrders] = useState([]);
    const [stock, setStock] = useState([]);
    const [tickets, setTickets] = useState([]);

    // UI States
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [editingPromo, setEditingPromo] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [filter, setFilter] = useState('all');

    // Loading States
    const [uploading, setUploading] = useState(false);
    const [savingProduct, setSavingProduct] = useState(false);
    const [savingPromo, setSavingPromo] = useState(false);

    // Form States
    const [productForm, setProductForm] = useState({
        name: '', price: '', category: '', stock: '',
        description: '', ingredients: '', allergies: '', image: '',
        options: [] // Array of {name, choices: [{label, price}]}
    });

    const [promotions, setPromotions] = useState([]);
    const [promoForm, setPromoForm] = useState({ title: '', price: '', originalPrice: '', image: '', description: '', linkedProductIds: [] });

    const openProductModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setProductForm(product);
        } else {
            setEditingProduct(null);
            setProductForm({ name: '', price: '', category: '', stock: '', description: '', ingredients: '', allergies: '', image: '', options: [] });
        }
        setIsProductModalOpen(true);
    };

    const openPromoModal = (promo = null) => {
        if (promo) {
            setEditingPromo(promo);
            setPromoForm({
                title: promo.title || '',
                price: promo.price || '',
                originalPrice: promo.originalPrice || '',
                image: promo.image || '',
                description: promo.description || '',
                linkedProductIds: promo.linkedProductIds || []
            });
        } else {
            setEditingPromo(null);
            setPromoForm({ title: '', price: '', originalPrice: '', image: '', description: '', linkedProductIds: [] });
        }
        setIsPromoModalOpen(true);
    };

    const handleImageUpload = async (e, formSetter, currentForm) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (max 5MB before compression)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should be less than 5MB');
            return;
        }

        setUploading(true);
        try {
            // Create a canvas to compress the image
            const img = new Image();
            const reader = new FileReader();

            reader.onload = (event) => {
                img.onload = () => {
                    // Create canvas for compression
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // Calculate new dimensions (max 800x800 to keep size small)
                    let width = img.width;
                    let height = img.height;
                    const maxSize = 800;

                    if (width > height) {
                        if (width > maxSize) {
                            height = (height * maxSize) / width;
                            width = maxSize;
                        }
                    } else {
                        if (height > maxSize) {
                            width = (width * maxSize) / height;
                            height = maxSize;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    // Draw and compress
                    ctx.drawImage(img, 0, 0, width, height);

                    // Convert to base64 with compression (0.7 quality for JPEG)
                    const base64String = canvas.toDataURL('image/jpeg', 0.7);

                    // Check if compressed size is reasonable (base64 adds ~33% overhead)
                    // Firestore has 1MB document limit, so we aim for ~500KB base64
                    if (base64String.length > 700000) {
                        // Try with lower quality
                        const lowerQuality = canvas.toDataURL('image/jpeg', 0.5);
                        if (lowerQuality.length > 700000) {
                            alert('Image is too large even after compression. Please use a smaller image.');
                            setUploading(false);
                            return;
                        }
                        formSetter({ ...currentForm, image: lowerQuality });
                    } else {
                        formSetter({ ...currentForm, image: base64String });
                    }

                    setUploading(false);
                };

                img.src = event.target.result;
            };

            reader.onerror = () => {
                alert('Error reading image file');
                setUploading(false);
            };

            reader.readAsDataURL(file);
        } catch (error) {
            console.error("Error processing image: ", error);
            alert("Error processing image");
            setUploading(false);
        }
    };

    useEffect(() => {
        const fetchOrders = (withSort = true) => {
            const collectionRef = collection(db, 'orders');
            const q = withSort ? query(collectionRef, orderBy('timestamp', 'desc')) : collectionRef;

            return onSnapshot(q, (snapshot) => {
                const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setOrders(ordersData);
            }, (err) => {
                console.error("Orders sync error:", err);
                if (withSort) {
                    console.log("Retrying without sort...");
                    fetchOrders(false);
                }
            });
        };

        const unsubscribe = fetchOrders(true);

        const qStock = query(collection(db, 'products'));
        const unsubscribeStock = onSnapshot(qStock, (snapshot) => {
            const stockData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setStock(stockData);
        });

        const unsubscribePromotions = onSnapshot(collection(db, 'promotions'), (snapshot) => {
            setPromotions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const unsubscribeTickets = onSnapshot(query(collection(db, 'tickets'), orderBy('timestamp', 'desc')), (snapshot) => {
            setTickets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            if (unsubscribe) unsubscribe();
            unsubscribeStock();
            unsubscribePromotions();
            unsubscribeTickets();
        };
    }, []);

    const handleUpdateStatus = async (orderId, status) => {
        try {
            const orderRef = doc(db, 'orders', orderId);
            await updateDoc(orderRef, { status });
        } catch (err) {
            console.error("Error updating status:", err);
        }
    };

    const handleSaveProduct = async (e) => {
        e.preventDefault();
        setSavingProduct(true);
        try {
            // Strip the ID from the data as Firestore updateDoc doesn't allow it in the object
            const { id, ...cleanData } = productForm;
            const data = {
                ...cleanData,
                price: parseFloat(productForm.price) || 0,
                stock: parseInt(productForm.stock) || 0
            };

            if (editingProduct) {
                await updateDoc(doc(db, 'products', editingProduct.id), data);
            } else {
                await addDoc(collection(db, 'products'), data);
            }

            setIsProductModalOpen(false);
            setEditingProduct(null);
            setProductForm({ name: '', price: '', category: '', stock: '', description: '', ingredients: '', allergies: '', image: '', options: [] });
            alert("Product saved successfully!");
        } catch (err) {
            console.error("Save error:", err);
            alert("Error saving product: " + err.message);
        } finally {
            setSavingProduct(false);
        }
    };

    const handleSavePromo = async (e) => {
        e.preventDefault();
        setSavingPromo(true);
        try {
            if (editingPromo) {
                // Update existing promotion
                const { id, ...cleanData } = promoForm;
                await updateDoc(doc(db, 'promotions', editingPromo.id), cleanData);
                alert("Promotion updated successfully!");
            } else {
                // Create new promotion
                await addDoc(collection(db, 'promotions'), {
                    ...promoForm,
                    createdAt: serverTimestamp(),
                    active: true
                });
                alert("Promotion created successfully!");
            }
            setPromoForm({ title: '', price: '', originalPrice: '', image: '', description: '', linkedProductIds: [] });
            setIsPromoModalOpen(false);
            setEditingPromo(null);
        } catch (err) {
            console.error(err);
            alert("Error saving promotion: " + err.message);
        } finally {
            setSavingPromo(false);
        }
    };

    const handleDeletePromo = async (id) => {
        if (window.confirm("Delete this promotion?")) await deleteDoc(doc(db, 'promotions', id));
    };

    const handleDeleteProduct = async (id) => {
        if (window.confirm("Are you sure you want to delete this product?")) {
            await deleteDoc(doc(db, 'products', id));
        }
    };

    const populateStock = async () => {
        if (!window.confirm("This will add sample products to your inventory. Continue?")) return;

        const sampleProducts = [
            {
                name: "Panadol Extra",
                category: "Pain Relief",
                price: 15.00,
                stock: 50,
                description: "Effective relief for headaches, muscle aches, and fever.",
                ingredients: "Paracetamol 500mg, Caffeine 65mg",
                allergies: "Do not exceed stated dose",
                image: "https://placehold.co/400x400/png?text=Panadol"
            },
            {
                name: "Augmentin 1g",
                category: "Antibiotics",
                price: 45.00,
                stock: 20,
                description: "Broad-spectrum antibiotic for bacterial infections.",
                ingredients: "Amoxicillin, Clavulanic Acid",
                allergies: "Prescription only. Check for penicillin allergy.",
                image: "https://placehold.co/400x400/png?text=Augmentin"
            },
            {
                name: "Vitamin C 1000mg",
                category: "Vitamins",
                price: 35.00,
                stock: 100,
                description: "Immune system support effervescent tablets.",
                ingredients: "Ascorbic Acid",
                allergies: "None",
                image: "https://placehold.co/400x400/png?text=Vit+C"
            },
            {
                name: "Band-Aid Pack",
                category: "First Aid",
                price: 8.50,
                stock: 200,
                description: "Assorted adhesive bandages for minor cuts.",
                ingredients: "Latex-free material",
                allergies: "None",
                image: "https://placehold.co/400x400/png?text=BandAid"
            },
            {
                name: "Cough Syrup",
                category: "Cold & Flu",
                price: 18.00,
                stock: 45,
                description: "Soothing relief for dry and chesty coughs.",
                ingredients: "Dextromethorphan, Guaifenesin",
                allergies: "May cause drowsiness",
                image: "https://placehold.co/400x400/png?text=Cough+Syrup"
            },
            {
                name: "Omeprazole 20mg",
                category: "Digestive Health",
                price: 25.00,
                stock: 30,
                description: "Relief for heartburn and acid reflux.",
                ingredients: "Omeprazole",
                allergies: "Consult doctor if pregnant",
                image: "https://placehold.co/400x400/png?text=Omeprazole"
            }
        ];

        try {
            setSavingProduct(true);
            for (const product of sampleProducts) {
                await addDoc(collection(db, 'products'), product);
            }
            alert("Sample products added successfully!");
        } catch (err) {
            console.error("Error populating stock:", err);
            alert("Failed to populate stock.");
        } finally {
            setSavingProduct(false);
        }
    };

    const menuItems = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'orders', icon: ShoppingBag, label: 'Live Orders' },
        { id: 'stock', icon: Package, label: 'Stock Control' },
        { id: 'promotions', icon: Megaphone, label: 'Promotions' },
        { id: 'support', icon: MessageSquare, label: 'Support Tickets' },
    ];

    return (
        <div className="dashboard-container">
            <aside className="sidebar">
                <div style={{ marginBottom: '4rem', paddingLeft: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <img src={logo} alt="Admin Logo" style={{ maxHeight: '60px', width: 'auto' }} />
                    </div>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.2em', opacity: 0.3, marginTop: '0.5rem' }}>FOODAPP ADMIN</p>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    {menuItems.map((item) => (
                        <motion.button
                            key={item.id}
                            whileHover={{ x: 4 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setActiveTab(item.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '0.85rem 1rem',
                                borderRadius: '14px',
                                border: 'none',
                                background: activeTab === item.id ? '#000' : 'transparent',
                                color: activeTab === item.id ? '#FFF' : '#666',
                                textAlign: 'left',
                                width: '100%',
                                fontWeight: activeTab === item.id ? '600' : '500',
                                fontSize: '0.95rem',
                                boxShadow: activeTab === item.id ? '0 8px 16px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                            {item.label}
                        </motion.button>
                    ))}
                </nav>

                <motion.button
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onLogout}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem',
                        borderRadius: '14px',
                        border: 'none',
                        background: '#FFF1F1',
                        color: '#FF3B30',
                        marginTop: 'auto',
                        fontWeight: '600',
                        fontSize: '0.9rem'
                    }}
                >
                    <LogOut size={20} /> Sign Out
                </motion.button>
            </aside>

            <main className="main-content">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em' }}>
                            {menuItems.find(m => m.id === activeTab)?.label}
                        </h1>
                        <p style={{ color: 'var(--text-dim)', margin: '0.25rem 0 0', fontWeight: 500 }}>
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                </header>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {activeTab === 'dashboard' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                <div className="order-grid">
                                    <StatCard label="Live Orders" value={orders.filter(o => o.status === 'pending').length} icon={Clock} trend="+2.5%" />
                                    <StatCard label="Total Stock" value={stock.length} icon={Package} />
                                    <StatCard label="Revenue Today" value={`${orders.filter(o => {
                                        if (!o.timestamp || o.status !== 'completed') return false;
                                        const date = o.timestamp.toDate ? o.timestamp.toDate() : new Date();
                                        return date.toDateString() === new Date().toDateString();
                                    }).reduce((acc, o) => acc + (parseFloat(o.total) || 0), 0).toFixed(0)} LYD`} icon={TrendingUp} highlighted />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                                    <div className="card" style={{ border: 'none', background: '#FFF' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                            <h3 style={{ margin: 0, fontWeight: 700 }}>Revenue Overview</h3>
                                            <div style={{ background: '#F2F2F7', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, color: '#000', opacity: 0.6 }}>LAST 7 DAYS (LYD)</div>
                                        </div>
                                        <div style={{ height: '220px', width: '100%', position: 'relative', padding: '0 20px 40px' }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '100%', gap: '15px' }}>
                                                {/* Dynamic Revenue Columns */}
                                                {[...Array(7)].map((_, i) => {
                                                    const date = new Date();
                                                    date.setDate(date.getDate() - (6 - i));
                                                    const dayTotal = orders.filter(o => {
                                                        if (!o.timestamp || o.status !== 'completed') return false;
                                                        const oDate = o.timestamp.toDate ? o.timestamp.toDate() : new Date();
                                                        return oDate.toDateString() === date.toDateString();
                                                    }).reduce((acc, o) => acc + (parseFloat(o.total) || 0), 0);

                                                    const maxRef = Math.max(...[...Array(7)].map((_, j) => {
                                                        const d = new Date(); d.setDate(d.getDate() - (6 - j));
                                                        return orders.filter(ord => {
                                                            if (!ord.timestamp || ord.status !== 'completed') return false;
                                                            const oD = ord.timestamp.toDate ? ord.timestamp.toDate() : new Date();
                                                            return oD.toDateString() === d.toDateString();
                                                        }).reduce((a, b) => a + (parseFloat(b.total) || 0), 0);
                                                    }), 100);

                                                    const height = (dayTotal / maxRef) * 100;

                                                    return (
                                                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                                            <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                                                                <motion.div
                                                                    initial={{ height: 0 }}
                                                                    animate={{ height: `${Math.max(height, 5)}%` }}
                                                                    transition={{ ...velocityTransition, delay: i * 0.05 }}
                                                                    style={{
                                                                        width: '100%',
                                                                        background: dayTotal > 0 ? '#000' : '#F2F2F7',
                                                                        borderRadius: '6px 6px 4px 4px',
                                                                        minHeight: '4px'
                                                                    }}
                                                                />
                                                                {dayTotal > 0 && (
                                                                    <span style={{ position: 'absolute', top: '-20px', fontSize: '0.65rem', fontWeight: 700 }}>{dayTotal.toFixed(0)}</span>
                                                                )}
                                                            </div>
                                                            <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase' }}>
                                                                {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card" style={{ border: 'none', background: '#FFF' }}>
                                        <h3 style={{ margin: '0 0 1.5rem', fontWeight: 700 }}>Recent Activity</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                            {orders.slice(0, 5).map((order, i) => (
                                                <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: order.status === 'completed' ? '#34C759' : '#FFCC00' }} />
                                                    <div style={{ flex: 1 }}>
                                                        <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>Order #{order.id.slice(-4)}</p>
                                                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-dim)' }}>{order.userName} • {order.total} LYD</p>
                                                    </div>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{order.timestamp?.toDate ? order.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'orders' && (
                            <section>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                    <div style={{ display: 'flex', gap: '0.75rem', background: '#E5E5EA', padding: '4px', borderRadius: '14px' }}>
                                        {['all', 'pending', 'completed'].map(status => (
                                            <button
                                                key={status}
                                                onClick={() => setFilter(status)}
                                                style={{
                                                    background: filter === status ? '#FFF' : 'transparent',
                                                    color: '#000',
                                                    border: 'none',
                                                    padding: '0.6rem 1.25rem',
                                                    borderRadius: '11px',
                                                    fontSize: '0.85rem',
                                                    fontWeight: '600',
                                                    textTransform: 'capitalize',
                                                    boxShadow: filter === status ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
                                                }}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="order-grid">
                                    <AnimatePresence mode="popLayout">
                                        {orders.filter(o => filter === 'all' || o.status === filter).length === 0 ? (
                                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ gridColumn: '1/-1', padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-dim)', background: '#FFF', borderRadius: '24px', border: '2px dashed #E5E5EA' }}>
                                                <Package size={48} style={{ opacity: 0.2, marginBottom: '1.5rem' }} />
                                                <p style={{ fontWeight: 600 }}>No {filter !== 'all' ? filter : ''} orders found.</p>
                                            </motion.div>
                                        ) : (
                                            orders.filter(o => filter === 'all' || o.status === filter).map((order) => (
                                                <motion.div
                                                    layout
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    className="card"
                                                    key={order.id}
                                                    style={{ border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                                                        <div>
                                                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>ID #{order.id.slice(-6)}</span>
                                                            <h4 style={{ margin: '0.25rem 0 0', fontSize: '1.2rem', fontWeight: 700 }}>{order.userName || 'Guest'}</h4>
                                                        </div>
                                                        <span className={`status-badge status-${order.status || 'pending'}`}>{order.status || 'pending'}</span>
                                                    </div>

                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                                                        <Clock size={14} />
                                                        <span>{order.timestamp?.toDate ? order.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}</span>
                                                    </div>

                                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                        <motion.button
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={() => setSelectedOrder(order)}
                                                            style={{ flex: 1, background: '#F2F2F7', color: '#000', padding: '0.85rem', borderRadius: 'var(--radius-btn)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                                        >
                                                            <Eye size={16} /> Details
                                                        </motion.button>
                                                        {order.status === 'pending' && (
                                                            <motion.button
                                                                whileHover={{ scale: 1.02 }}
                                                                whileTap={{ scale: 0.98 }}
                                                                onClick={() => handleUpdateStatus(order.id, 'completed')}
                                                                style={{ flex: 1, background: '#000', color: '#FFF', padding: '0.85rem', borderRadius: 'var(--radius-btn)', fontSize: '0.85rem', fontWeight: 600 }}
                                                            >
                                                                Complete
                                                            </motion.button>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ))
                                        )}
                                    </AnimatePresence>
                                </div>
                            </section>
                        )}

                        {activeTab === 'stock' && (
                            <section>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                    <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                                        <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#8E8E93' }} size={18} />
                                        <input className="input" placeholder="Search inventory..." style={{ width: '100%', paddingLeft: '3rem', borderRadius: 'var(--radius-btn)', border: 'none', background: '#FFF', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={populateStock}
                                            style={{ padding: '0.85rem 1.5rem', background: '#F2F2F7', color: '#000', borderRadius: 'var(--radius-btn)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}
                                        >
                                            <Package size={20} /> Auto Refill
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => openProductModal()}
                                            style={{ padding: '0.85rem 1.5rem', background: '#000', color: '#FFF', borderRadius: 'var(--radius-btn)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}
                                        >
                                            <Plus size={20} /> New Product
                                        </motion.button>
                                    </div>
                                </div>
                                <div className="card" style={{ padding: '0', overflow: 'hidden', border: 'none' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                        <thead>
                                            <tr style={{ background: '#F9F9F9', borderBottom: '1px solid #EEE' }}>
                                                <th style={tableHeaderStyle}>PRODUCT</th>
                                                <th style={tableHeaderStyle}>CATEGORY</th>
                                                <th style={tableHeaderStyle}>STOCK</th>
                                                <th style={tableHeaderStyle}>PRICE</th>
                                                <th style={tableHeaderStyle}>ACTIONS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stock.map(item => (
                                                <tr key={item.id} style={{ borderBottom: '1px solid #F2F2F7' }}>
                                                    <td style={tableCellStyle}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                            {item.image && <img src={item.image} style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }} />}
                                                            <span style={{ fontWeight: 600 }}>{item.name}</span>
                                                        </div>
                                                    </td>
                                                    <td style={tableCellStyle}>{item.category}</td>
                                                    <td style={tableCellStyle}>
                                                        <span style={{
                                                            padding: '0.25rem 0.75rem',
                                                            borderRadius: '8px',
                                                            background: item.stock < 10 ? '#FFF1F1' : '#F2F2F7',
                                                            color: item.stock < 10 ? '#FF3B30' : '#000',
                                                            fontSize: '0.85rem',
                                                            fontWeight: 600
                                                        }}>
                                                            {item.stock} in stock
                                                        </span>
                                                    </td>
                                                    <td style={tableCellStyle}><span style={{ fontWeight: 700 }}>{item.price} LYD</span></td>
                                                    <td style={tableCellStyle}>
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <button onClick={() => openProductModal(item)} style={actionButtonStyle}><Edit3 size={18} /></button>
                                                            <button onClick={() => handleDeleteProduct(item.id)} style={{ ...actionButtonStyle, color: '#FF3B30' }}><Trash2 size={18} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        )}

                        {activeTab === 'promotions' && (
                            <section>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Active Campaigns</h3>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => openPromoModal()}
                                        style={{ padding: '0.85rem 1.5rem', background: '#000', color: '#FFF', borderRadius: 'var(--radius-btn)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}
                                    >
                                        <Plus size={20} /> New Campaign
                                    </motion.button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                    {promotions.length === 0 ? (
                                        <div style={{ gridColumn: '1/-1', padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-dim)', background: '#FFF', borderRadius: '24px', border: '2px dashed #E5E5EA' }}>
                                            <Megaphone size={48} style={{ opacity: 0.2, marginBottom: '1.5rem' }} />
                                            <p style={{ fontWeight: 600 }}>No active campaigns. Create one to get started!</p>
                                        </div>
                                    ) : promotions.map(promo => (
                                        <motion.div layout key={promo.id} className="card" style={{ padding: '0', overflow: 'hidden', border: 'none' }}>
                                            {promo.image && <img src={promo.image} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />}
                                            <div style={{ padding: '1.5rem' }}>
                                                <h4 style={{ margin: '0 0 0.75rem', fontSize: '1.1rem', fontWeight: 700 }}>{promo.title}</h4>
                                                {promo.description && <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: '1.4' }}>{promo.description}</p>}
                                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '1.25rem' }}>
                                                    <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{promo.price}<span style={{ fontSize: '0.8rem', fontWeight: 600, marginLeft: '2px' }}>LYD</span></span>
                                                    {promo.originalPrice && <span style={{ textDecoration: 'line-through', color: 'var(--text-dim)', fontSize: '0.9rem' }}>{promo.originalPrice} LYD</span>}
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                    <button onClick={() => openPromoModal(promo)} style={{ flex: 1, color: '#000', background: '#F2F2F7', border: 'none', padding: '0.75rem', borderRadius: 'var(--radius-btn)', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                                        <Edit3 size={16} /> Edit
                                                    </button>
                                                    <button onClick={() => handleDeletePromo(promo.id)} style={{ flex: 1, color: '#FF3B30', background: '#FFF1F1', border: 'none', padding: '0.75rem', borderRadius: 'var(--radius-btn)', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                                        <Trash2 size={16} /> Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {activeTab === 'support' && (
                            <section>
                                <div style={{ display: 'grid', gap: '1.25rem' }}>
                                    {/* Open Tickets */}
                                    <h4 style={{ margin: '1rem 0 0.5rem', opacity: 0.5, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Pending Tickets</h4>
                                    {tickets.filter(t => t.status === 'open').length === 0 ? (
                                        <p style={{ color: '#8E8E93', fontStyle: 'italic', fontSize: '0.9rem' }}>No pending tickets.</p>
                                    ) : tickets.filter(t => t.status === 'open').map(ticket => (
                                        <motion.div layout key={ticket.id} className="card" style={{ borderLeft: '6px solid #000', border: 'none' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                                <div>
                                                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{ticket.subject}</h4>
                                                    <p style={{ margin: '0.25rem 0 0', color: 'var(--text-dim)', fontSize: '0.85rem' }}>From {ticket.userName} • {ticket.userEmail}</p>
                                                </div>
                                            </div>
                                            <div style={{ background: '#F2F2F7', padding: '1.25rem', borderRadius: '16px', marginBottom: '1.5rem', color: '#444' }}>
                                                {ticket.message}
                                            </div>
                                            <div style={{ display: 'flex', gap: '1rem' }}>
                                                <motion.a whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} href={`mailto:${ticket.userEmail}?subject=Re: ${ticket.subject}`} style={{ textDecoration: 'none', background: '#000', color: '#FFF', padding: '0.85rem 1.5rem', borderRadius: 'var(--radius-btn)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', fontWeight: 600 }}>
                                                    <MessageSquare size={16} /> Reply
                                                </motion.a>
                                                <button onClick={async () => await updateDoc(doc(db, 'tickets', ticket.id), { status: 'resolved' })} style={{ background: 'transparent', border: '1px solid #EEE', color: '#666', padding: '0.85rem 1.5rem', borderRadius: 'var(--radius-btn)', fontSize: '0.9rem', fontWeight: 600 }}>
                                                    Mark Solved
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}

                                    {/* Solved Tickets */}
                                    <h4 style={{ margin: '2rem 0 0.5rem', opacity: 0.5, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Resolved History</h4>
                                    {tickets.filter(t => t.status !== 'open').length === 0 ? (
                                        <p style={{ color: '#8E8E93', fontStyle: 'italic', fontSize: '0.9rem' }}>No resolved tickets yet.</p>
                                    ) : tickets.filter(t => t.status !== 'open').map(ticket => (
                                        <motion.div layout key={ticket.id} className="card" style={{ borderLeft: '6px solid #34C759', border: 'none', opacity: 0.8 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                                <div>
                                                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, textDecoration: 'line-through' }}>{ticket.subject}</h4>
                                                    <p style={{ margin: '0.25rem 0 0', color: 'var(--text-dim)', fontSize: '0.85rem' }}>From {ticket.userName}</p>
                                                </div>
                                                <span className="status-badge status-completed">Resolved</span>
                                            </div>
                                            <div style={{ background: '#F9F9F9', padding: '1rem', borderRadius: '16px', color: '#888', fontStyle: 'italic' }}>
                                                {ticket.message}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Product Modal */}
            <AnimatePresence>
                {isProductModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={modalOverlayStyle}
                    >
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h2 style={{ margin: 0, fontWeight: 700 }}>{editingProduct ? 'Edit Product' : 'New Product'}</h2>
                                <button onClick={() => setIsProductModalOpen(false)} style={{ background: '#F2F2F7', border: 'none', padding: '0.5rem', borderRadius: '12px' }}><XCircle /></button>
                            </div>

                            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={labelStyle}>PRODUCT NAME</label>
                                        <input className="input" style={{ width: '100%' }} value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} required />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={labelStyle}>CATEGORY</label>
                                        <input className="input" style={{ width: '100%' }} value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value })} required />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={labelStyle}>BASE PRICE (LYD)</label>
                                        <input className="input" style={{ width: '100%' }} type="number" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} required />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={labelStyle}>STOCK QUANTITY</label>
                                        <input className="input" style={{ width: '100%' }} type="number" value={productForm.stock} onChange={e => setProductForm({ ...productForm, stock: e.target.value })} required />
                                    </div>
                                </div>

                                <div>
                                    <label style={labelStyle}>DESCRIPTION</label>
                                    <textarea className="input" style={{ width: '100%', minHeight: '100px', resize: 'vertical' }} value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} />
                                </div>

                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>DETAILS / COMPOSITION</label>
                                    <input className="input" style={{ width: '100%' }} value={productForm.ingredients} onChange={e => setProductForm({ ...productForm, ingredients: e.target.value })} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>ALLERGIES / WARNINGS</label>
                                    <input className="input" style={{ width: '100%' }} value={productForm.allergies} onChange={e => setProductForm({ ...productForm, allergies: e.target.value })} />
                                </div>

                                <div>
                                    <label style={labelStyle}>PRODUCT IMAGE</label>
                                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', background: '#F9F9F9', padding: '1.5rem', borderRadius: '20px', border: '2px dashed #E5E5EA' }}>
                                        <div style={{ width: '100px', height: '100px', borderRadius: '16px', background: '#FFF', border: '1px solid #EEE', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                            {productForm.image ? <img src={productForm.image} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <Package size={32} style={{ opacity: 0.2 }} />}
                                        </div>
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.75rem 1rem', background: '#000', color: '#FFF', alignSelf: 'flex-start', borderRadius: '12px', fontWeight: 600, fontSize: '0.85rem' }}>
                                                <span>Upload Product Photo</span>
                                                <input type="file" onChange={(e) => handleImageUpload(e, setProductForm, productForm)} hidden />
                                            </label>
                                            {uploading && <p style={{ color: '#000', fontSize: '0.75rem', fontWeight: 700, margin: 0 }}>Uploading image...</p>}
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#8E8E93' }}>Recommmended size: 500x500px </p>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ background: '#F2F2F7', padding: '1.5rem', borderRadius: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>PRODUCT CUSTOMIZATIONS</h4>
                                        <button type="button" onClick={() => {
                                            const newOption = { name: '', type: 'single', required: true, choices: [{ label: '', price: 0 }] };
                                            setProductForm({ ...productForm, options: [...(productForm.options || []), newOption] });
                                        }} style={{ background: '#000', color: '#FFF', padding: '0.5rem 1rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>+ Group</button>
                                    </div>

                                    {(productForm.options || []).map((option, oIdx) => (
                                        <div key={oIdx} style={{ marginBottom: '1.5rem', background: '#FFF', padding: '1.25rem', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                                            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                                                <input placeholder="Group Name (e.g. Size)" className="input" style={{ flex: 2, padding: '0.6rem 1rem' }} value={option.name} onChange={e => {
                                                    const newOpts = [...productForm.options];
                                                    newOpts[oIdx].name = e.target.value;
                                                    setProductForm({ ...productForm, options: newOpts });
                                                }} />
                                                <select
                                                    className="input"
                                                    style={{ flex: 1, padding: '0.6rem 1rem' }}
                                                    value={option.type || 'single'}
                                                    onChange={e => {
                                                        const newOpts = [...productForm.options];
                                                        newOpts[oIdx].type = e.target.value;
                                                        setProductForm({ ...productForm, options: newOpts });
                                                    }}
                                                >
                                                    <option value="single">Single Choice</option>
                                                    <option value="multiple">Multiple Choice</option>
                                                </select>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={option.required !== false} // Default to true if undefined
                                                        onChange={e => {
                                                            const newOpts = [...productForm.options];
                                                            newOpts[oIdx].required = e.target.checked;
                                                            setProductForm({ ...productForm, options: newOpts });
                                                        }}
                                                    />
                                                    Required
                                                </label>
                                                <button type="button" onClick={() => {
                                                    const newOpts = productForm.options.filter((_, i) => i !== oIdx);
                                                    setProductForm({ ...productForm, options: newOpts });
                                                }} style={{ color: '#FF3B30', padding: '0.5rem' }}><Trash2 size={18} /></button>
                                            </div>

                                            {option.choices.map((choice, cIdx) => (
                                                <div key={cIdx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                    <input placeholder="Label" className="input" style={{ flex: 2, padding: '0.5rem 0.75rem' }} value={choice.label} onChange={e => {
                                                        const newOpts = [...productForm.options];
                                                        newOpts[oIdx].choices[cIdx].label = e.target.value;
                                                        setProductForm({ ...productForm, options: newOpts });
                                                    }} />
                                                    <input placeholder="+ Price" type="number" className="input" style={{ flex: 1, padding: '0.5rem 0.75rem' }} value={choice.price} onChange={e => {
                                                        const newOpts = [...productForm.options];
                                                        newOpts[oIdx].choices[cIdx].price = parseFloat(e.target.value) || 0;
                                                        setProductForm({ ...productForm, options: newOpts });
                                                    }} />
                                                    <button type="button" onClick={() => {
                                                        const newOpts = [...productForm.options];
                                                        newOpts[oIdx].choices = newOpts[oIdx].choices.filter((_, i) => i !== cIdx);
                                                        setProductForm({ ...productForm, options: newOpts });
                                                    }} style={{ color: '#8E8E93' }}>−</button>
                                                </div>
                                            ))}
                                            <button type="button" onClick={() => {
                                                const newOpts = [...productForm.options];
                                                newOpts[oIdx].choices.push({ label: '', price: 0 });
                                                setProductForm({ ...productForm, options: newOpts });
                                            }} style={{ background: 'none', border: '1px dashed #CCC', width: '100%', padding: '0.5rem', borderRadius: '10px', fontSize: '0.75rem', color: '#8E8E93', marginTop: '0.5rem' }}>+ Choice</button>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <button type="button" onClick={() => setIsProductModalOpen(false)} style={{ flex: 1, padding: '1rem', borderRadius: 'var(--radius-btn)', border: 'none', background: '#F2F2F7', fontWeight: 600 }}>Cancel</button>
                                    <button type="submit" disabled={uploading || savingProduct} style={{ flex: 2, padding: '1rem', borderRadius: 'var(--radius-btn)', border: 'none', background: savingProduct ? '#666' : '#000', color: '#FFF', fontWeight: 700, cursor: savingProduct ? 'not-allowed' : 'pointer' }}>
                                        {savingProduct ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Promotion Modal */}
            <AnimatePresence>
                {isPromoModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={modalOverlayStyle}
                    >
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h2 style={{ margin: 0, fontWeight: 700 }}>{editingPromo ? 'Edit Campaign' : 'New Campaign'}</h2>
                                <button onClick={() => { setIsPromoModalOpen(false); setEditingPromo(null); }} style={{ background: '#F2F2F7', border: 'none', padding: '0.5rem', borderRadius: '12px' }}><XCircle /></button>
                            </div>

                            <form onSubmit={handleSavePromo} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div>
                                    <label style={labelStyle}>CAMPAIGN TITLE</label>
                                    <input className="input" style={{ width: '100%' }} placeholder="e.g., Summer Special Offer" value={promoForm.title} onChange={e => setPromoForm({ ...promoForm, title: e.target.value })} required />
                                </div>

                                <div>
                                    <label style={labelStyle}>DESCRIPTION</label>
                                    <textarea className="input" style={{ width: '100%', minHeight: '80px', resize: 'vertical' }} placeholder="Describe your promotional offer..." value={promoForm.description} onChange={e => setPromoForm({ ...promoForm, description: e.target.value })} />
                                </div>

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={labelStyle}>OFFER PRICE (LYD)</label>
                                        <input className="input" style={{ width: '100%' }} type="number" placeholder="99" value={promoForm.price} onChange={e => setPromoForm({ ...promoForm, price: e.target.value })} required />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={labelStyle}>ORIGINAL PRICE (LYD)</label>
                                        <input className="input" style={{ width: '100%' }} type="number" placeholder="149" value={promoForm.originalPrice} onChange={e => setPromoForm({ ...promoForm, originalPrice: e.target.value })} />
                                    </div>
                                </div>

                                <div>
                                    <label style={labelStyle}>LINKED PRODUCTS</label>
                                    <div style={{ background: '#F9F9F9', padding: '1rem', borderRadius: '16px', border: '2px dashed #E5E5EA' }}>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            {stock.length === 0 ? (
                                                <p style={{ margin: 0, color: '#8E8E93', fontSize: '0.85rem' }}>No products available. Create products first.</p>
                                            ) : stock.map(p => {
                                                const isSelected = (promoForm.linkedProductIds || []).includes(p.id);
                                                return (
                                                    <div
                                                        key={p.id}
                                                        onClick={() => {
                                                            const current = promoForm.linkedProductIds || [];
                                                            const nxt = isSelected ? current.filter(id => id !== p.id) : [...current, p.id];
                                                            setPromoForm({ ...promoForm, linkedProductIds: nxt });
                                                        }}
                                                        style={{
                                                            background: isSelected ? '#000' : '#FFF',
                                                            color: isSelected ? '#FFF' : '#000',
                                                            padding: '0.5rem 0.75rem',
                                                            borderRadius: '10px',
                                                            fontSize: '0.8rem',
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                            border: isSelected ? 'none' : '1px solid #E5E5EA',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.25rem'
                                                        }}
                                                    >
                                                        {isSelected && <CheckCircle size={14} />} {p.name}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label style={labelStyle}>CAMPAIGN IMAGE</label>
                                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', background: '#F9F9F9', padding: '1.5rem', borderRadius: '20px', border: '2px dashed #E5E5EA' }}>
                                        <div style={{ width: '120px', height: '120px', borderRadius: '16px', background: '#FFF', border: '1px solid #EEE', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                            {promoForm.image ? <img src={promoForm.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Megaphone size={32} style={{ opacity: 0.2 }} />}
                                        </div>
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.75rem 1rem', background: '#000', color: '#FFF', alignSelf: 'flex-start', borderRadius: '12px', fontWeight: 600, fontSize: '0.85rem' }}>
                                                <span>Upload Image</span>
                                                <input type="file" onChange={(e) => handleImageUpload(e, setPromoForm, promoForm)} hidden accept="image/*" />
                                            </label>
                                            {uploading && <p style={{ color: '#000', fontSize: '0.75rem', fontWeight: 700, margin: 0 }}>Compressing image...</p>}
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#8E8E93' }}>Recommended: 1200x600px</p>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <button type="button" onClick={() => { setIsPromoModalOpen(false); setEditingPromo(null); }} style={{ flex: 1, padding: '1rem', borderRadius: 'var(--radius-btn)', border: 'none', background: '#F2F2F7', fontWeight: 600 }}>Cancel</button>
                                    <button type="submit" disabled={uploading || savingPromo} style={{ flex: 2, padding: '1rem', borderRadius: 'var(--radius-btn)', border: 'none', background: savingPromo ? '#666' : '#000', color: '#FFF', fontWeight: 700, cursor: savingPromo ? 'not-allowed' : 'pointer' }}>
                                        {savingPromo ? 'Saving...' : (editingPromo ? 'Update Campaign' : 'Launch Campaign')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Order Details Sheet (iOS Style) */}
            <AnimatePresence>
                {selectedOrder && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={modalOverlayStyle}
                    >
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} style={{ position: 'absolute', bottom: 0, width: '100%', maxWidth: '600px', background: '#FFF', borderTopLeftRadius: '32px', borderTopRightRadius: '32px', padding: '2.5rem', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 -20px 50px rgba(0,0,0,0.1)' }}>
                            <div style={{ width: '40px', height: '5px', background: '#E5E5EA', borderRadius: '10px', margin: '-1rem auto 2rem' }} />

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <div>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#8E8E93' }}>ORDER DETAILS</span>
                                    <h2 style={{ margin: 0, fontWeight: 800 }}>#{selectedOrder.id.slice(-6)}</h2>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '2.5rem' }}>
                                <div>
                                    <label style={labelStyle}>CUSTOMER INFO</label>
                                    <div style={{ background: '#F9F9F9', padding: '1rem', borderRadius: '16px' }}>
                                        <p style={{ margin: '0 0 0.5rem', fontWeight: 700, fontSize: '1.1rem' }}>{selectedOrder.userName}</p>
                                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.9rem', color: '#444' }}>
                                                <span style={{ fontWeight: 600, width: '60px' }}>Email:</span>
                                                <span>{selectedOrder.userEmail || 'N/A'}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.9rem', color: '#444' }}>
                                                <span style={{ fontWeight: 600, width: '60px' }}>Phone:</span>
                                                <span>{selectedOrder.userPhone || 'N/A'}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.9rem', color: '#444' }}>
                                                <span style={{ fontWeight: 600, width: '60px' }}>Address:</span>
                                                <span>{selectedOrder.location || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <label style={labelStyle}>ORDERED ITEMS</label>
                            <div style={{ background: '#F9F9F9', borderRadius: '24px', padding: '1.5rem', marginTop: '0.75rem' }}>
                                {selectedOrder.items?.map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', borderBottom: idx === selectedOrder.items.length - 1 ? 'none' : '1px solid #EEE' }}>
                                        <div>
                                            <span style={{ fontWeight: 700, marginRight: '1rem' }}>{item.quantity}x</span>
                                            <span style={{ fontWeight: 500 }}>{item.name}</span>
                                            {item.selectedOptions && Object.entries(item.selectedOptions).map(([key, val]) => (
                                                <div key={key} style={{ fontSize: '0.75rem', color: '#8E8E93', marginLeft: '2.5rem' }}>+ {val.label}</div>
                                            ))}
                                        </div>
                                        <span style={{ fontWeight: 600 }}>{item.price * item.quantity} LYD</span>
                                    </div>
                                ))}
                                <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '2px solid #FFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 700, fontSize: '1.25rem' }}>Total</span>
                                    <span style={{ fontWeight: 800, fontSize: '1.5rem' }}>{selectedOrder.total} LYD</span>
                                </div>
                            </div>

                            <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem' }}>
                                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setSelectedOrder(null)} style={{ flex: 1, padding: '1.15rem', borderRadius: 'var(--radius-btn)', background: '#F2F2F7', color: '#000', fontWeight: 600 }}>Close</motion.button>
                                {selectedOrder.status === 'pending' && (
                                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => { handleUpdateStatus(selectedOrder.id, 'completed'); setSelectedOrder(null); }} style={{ flex: 2, padding: '1.15rem', borderRadius: 'var(--radius-btn)', background: '#000', color: '#FFF', fontWeight: 700 }}>Mark as Completed</motion.button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Sub-components & Styles
const StatCard = ({ label, value, icon: Icon, trend, highlighted }) => (
    <motion.div whileHover={{ y: -5 }} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', border: 'none', background: highlighted ? 'var(--gradient)' : '#FFF', color: highlighted ? '#FFF' : '#000' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: highlighted ? 'rgba(255,255,255,0.2)' : '#F2F2F7', color: highlighted ? '#FFF' : '#000' }}>
            <Icon size={28} />
        </div>
        <div>
            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: highlighted ? 'rgba(255,255,255,0.7)' : 'var(--text-dim)' }}>{label}</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <h3 style={{ margin: '0.2rem 0 0', fontSize: '1.6rem', fontWeight: 800 }}>{value}</h3>
                {trend && <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34C759' }}>{trend}</span>}
            </div>
        </div>
    </motion.div>
);

const tableHeaderStyle = { padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 800, color: '#8E8E93', letterSpacing: '0.05em' };
const tableCellStyle = { padding: '1.5rem', fontSize: '0.95rem' };
const actionButtonStyle = { background: '#F2F2F7', border: 'none', padding: '0.6rem', borderRadius: '12px', color: '#000', transition: 'all 0.2s' };
const promoInputStyle = { padding: '0.85rem 1.25rem', borderRadius: '16px', border: 'none', background: 'rgba(255,255,255,0.15)', color: '#FFF', fontWeight: 500 };
const modalOverlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' };
const labelStyle = { display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#8E8E93', marginBottom: '0.5rem', letterSpacing: '0.05em' };

export default AdminDashboard;
