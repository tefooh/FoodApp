import React, { useState, useEffect } from 'react';
import AdminDashboard from './AdminDashboard';
import logo from './logo.png';
import { LogIn, Shield, Loader2, UserPlus, ArrowLeft, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

// Professional Velocity Transition (Non-bouncy)
const velocityTransition = {
    type: "tween",
    ease: [0.16, 1, 0.3, 1],
    duration: 0.6
};

function App() {
    const [user, setUser] = useState(null);
    const [isSignUp, setIsSignUp] = useState(false);

    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');

    // UI States
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                    if (userDoc.exists() && userDoc.data().admin === true) {
                        setUser(firebaseUser);
                    } else {
                        await signOut(auth);
                        setUser(null);
                        if (!isSignUp) setError('Your account is awaiting admin approval.');
                    }
                } catch (err) {
                    await signOut(auth);
                    setUser(null);
                    setError('Connection failed. Please check your internet.');
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [isSignUp]);

    const handleAuth = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setError('');
        setSuccessMessage('');

        try {
            if (isSignUp) {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const newUser = userCredential.user;

                await setDoc(doc(db, 'users', newUser.uid), {
                    fullName: fullName,
                    email: email,
                    admin: false,
                    createdAt: serverTimestamp(),
                    role: 'pending_admin'
                });

                setSuccessMessage('Registration successful! Please wait for a manager to approve your account.');
                await signOut(auth);
                setIsSignUp(false);
            } else {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const firebaseUser = userCredential.user;

                const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                if (!userDoc.exists() || userDoc.data().admin !== true) {
                    await signOut(auth);
                    setError('You do not have permission to access the admin panel.');
                }
            }
        } catch (err) {
            setError(err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' ? 'Invalid email or password.' : 'Could not sign in. Please try again.');
            console.error(err);
        } finally {
            setProcessing(false);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        setUser(null);
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg)' }}>
            <motion.div animate={{ rotate: 360, scale: [1, 0.9, 1] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}>
                <Shield size={40} color="#000" strokeWidth={2} />
            </motion.div>
        </div>
    );

    if (!user) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg)', padding: '20px' }}>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="card"
                    style={{ width: '100%', maxWidth: '440px', textAlign: 'center', padding: '4rem 3rem' }}
                >
                    <div style={{ marginBottom: '3.5rem' }}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
                            }}
                        >
                            <img src={logo} alt="Admin Logo" style={{ maxHeight: '80px', width: 'auto' }} />
                        </motion.div>
                        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, letterSpacing: '-0.04em' }}>
                            {isSignUp ? 'Create Admin Account' : 'Admin Login'}
                        </h1>
                        <p style={{ color: 'var(--text-dim)', marginTop: '0.4rem', fontSize: '0.9rem', fontWeight: 600 }}>
                            {isSignUp ? 'Apply for staff access' : 'Manage your restaurant'}
                        </p>
                    </div>

                    <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={isSignUp ? 'signup' : 'login'}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
                            >
                                {isSignUp && (
                                    <div style={{ textAlign: 'left' }}>
                                        <label style={labelStyle}>FULL NAME</label>
                                        <input type="text" placeholder="Your name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" style={inputStyle} required />
                                    </div>
                                )}
                                <div style={{ textAlign: 'left' }}>
                                    <label style={labelStyle}>EMAIL ADDRESS</label>
                                    <input type="email" placeholder="email@admin.com" value={email} onChange={(e) => setEmail(e.target.value)} className="input" style={inputStyle} required />
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <label style={labelStyle}>PASSWORD</label>
                                    <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="input" style={inputStyle} required />
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        <AnimatePresence>
                            {(error || successMessage) && (
                                <motion.p
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    style={{
                                        background: error ? '#FFF1F1' : '#F2FBF6',
                                        color: error ? '#FF3B30' : '#34C759',
                                        padding: '1rem',
                                        borderRadius: '16px',
                                        fontSize: '0.85rem',
                                        margin: 0,
                                        fontWeight: 700,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    {error ? <Shield size={14} /> : null}
                                    {error || successMessage}
                                </motion.p>
                            )}
                        </AnimatePresence>

                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            transition={velocityTransition}
                            type="submit" disabled={processing}
                            style={{
                                padding: '1.25rem', borderRadius: '9999px', background: '#000', color: 'white',
                                fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                                marginTop: '1rem', boxShadow: '0 12px 24px rgba(0,0,0,0.15)', opacity: processing ? 0.7 : 1,
                                fontSize: '1rem'
                            }}
                        >
                            {processing ? <Loader2 size={20} className="animate-spin" /> : (isSignUp ? <UserPlus size={20} /> : <LogIn size={20} />)}
                            {processing ? 'Signing in...' : (isSignUp ? 'Create Account' : 'Sign In')}
                        </motion.button>
                    </form>

                    <div style={{ marginTop: '2.5rem', borderTop: '1px solid #F0F0F0', paddingTop: '1.5rem' }}>
                        <button
                            onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccessMessage(''); }}
                            style={{ background: 'none', border: 'none', color: '#000', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto', cursor: 'pointer', opacity: 0.5 }}
                        >
                            {isSignUp ? <><ArrowLeft size={16} strokeWidth={2.5} /> Back to Login</> : <>New Admin? Register Here</>}
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return <AdminDashboard user={user} onLogout={handleLogout} />;
}

const labelStyle = { display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#000', marginBottom: '0.6rem', marginLeft: '0.5rem', opacity: 0.4, letterSpacing: '0.05em' };
const inputStyle = { width: '100%', background: '#F9F9F9', border: '1px solid #EDEDED', borderRadius: '18px', padding: '1.1rem 1.4rem', fontFamily: 'inherit' };

export default App;
