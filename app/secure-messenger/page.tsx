'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Key, Shield, MessageSquare, Trash2, Copy, Check, Eye, EyeOff, Save, RefreshCw, Smartphone, Send, ArrowRight, Star, X, Zap } from 'lucide-react';
import { generateSessionKey, encryptMessage, decryptMessage } from '@/lib/encryption';
import { saveSession, loadSession, deleteSession, ChatMessage, nukeAllData } from '@/lib/local-storage';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { saveFavorite, removeFavorite, isFavorite } from '@/lib/local-storage';

function SecureMessengerContent() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Redirect logic removed - using action-based auth instead
    }, [status, router]);

    // --- State ---
    const [sessionKey, setSessionKey] = useState<string>('');
    const [tempKeyInput, setTempKeyInput] = useState('');
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [isFav, setIsFav] = useState(false);

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [encryptedOutput, setEncryptedOutput] = useState('');
    const [decryptInput, setDecryptInput] = useState('');
    const [isManualDecryptOpen, setIsManualDecryptOpen] = useState(false);
    const channelIdRef = useRef<string | null>(null);
    const lastSyncTimeRef = useRef<number>(0);
    const deviceIdRef = useRef<string>('');

    // Initialize Device ID
    useEffect(() => {
        let storedDeviceId = sessionStorage.getItem('secure_messenger_deviceId');
        if (!storedDeviceId) {
            storedDeviceId = `device_${Math.random().toString(36).substring(2, 10)}`;
            sessionStorage.setItem('secure_messenger_deviceId', storedDeviceId);
        }
        deviceIdRef.current = storedDeviceId;
    }, []);

    // --- UI State ---
    const [showKey, setShowKey] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isSaving, setIsSaving] = useState(true); // Default to save, can toggle off
    const [showFavModal, setShowFavModal] = useState(false);
    const [favAliasInput, setFavAliasInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const lastJoinedKey = useRef<string | null>(null);

    // --- Auto-Join from URL ---
    useEffect(() => {
        const keyParam = searchParams.get('key');

        // Reset the tracking ref when the URL is cleared
        if (!keyParam) {
            lastJoinedKey.current = null;
            return;
        }

        if (keyParam && !isSessionActive && keyParam !== lastJoinedKey.current) {
            lastJoinedKey.current = keyParam;
            setTempKeyInput(keyParam);
            // Small delay to allow state update before joining
            setTimeout(() => {
                handleJoinSession(keyParam);
            }, 100);
        }
    }, [searchParams, isSessionActive]);

    // --- Session Management ---

    const handleGenerateKey = async () => {
        if (status !== 'authenticated') {
            router.push('/login');
            return;
        }
        const key = await generateSessionKey();
        setTempKeyInput(key);
        setShowKey(true);
    };

    const handleJoinSession = async (manualKey?: string) => {
        if (status !== 'authenticated') {
            router.push('/login');
            return;
        }
        const keyToUse = manualKey || tempKeyInput;

        if (!keyToUse.trim() || keyToUse.length < 10) {
            if (!manualKey) alert("Invalid Key Format");
            return;
        }

        const key = keyToUse.trim();
        setSessionKey(key);
        setIsSessionActive(true);

        // Check favorites async
        const favStatus = await isFavorite(key, status === 'authenticated');
        setIsFav(favStatus);

        // Try to load existing history
        const sessionData = await loadSession(key);
        if (sessionData) {
            setMessages(sessionData.messages);
        } else {
            setMessages([]);
        }
    };

    const handleLeaveSession = () => {
        setIsSessionActive(false);
        setSessionKey('');
        setMessages([]);
        setTempKeyInput('');
        setEncryptedOutput('');
        setDecryptInput('');
        setIsFav(false);

        // Remove key from URL to prevent auto-rejoin
        if (searchParams.has('key')) {
            router.replace('/secure-messenger');
        }
    };

    const handleNuke = async () => {
        if (confirm("WARNING: This will permanently erase this chat session from this device. Proceed?")) {
            await deleteSession(sessionKey);
            await removeFavorite(sessionKey, status === 'authenticated'); // Also remove from favorites
            handleLeaveSession();
        }
    };

    const handleToggleFavorite = async () => {
        if (status !== 'authenticated') {
            if (confirm("Sign in required to save favorites. Go to login?")) {
                router.push('/login');
            }
            return;
        }

        if (isFav) {
            const success = await removeFavorite(sessionKey, true);
            if (success) setIsFav(false);
        } else {
            setFavAliasInput(`Session ${sessionKey.substring(0, 6)}...`);
            setShowFavModal(true);
        }
    };

    const confirmFavorite = async () => {
        const success = await saveFavorite(sessionKey, favAliasInput || undefined, status === 'authenticated');
        if (success) {
            setIsFav(true);
            setShowFavModal(false);
        }
    };

    // --- Messaging ---

    const handleEncrypt = async () => {
        if (!inputText.trim()) return;

        try {
            const ciphertext = await encryptMessage(inputText, sessionKey);
            setEncryptedOutput('');

            const newMessage: ChatMessage = {
                id: Date.now().toString(),
                sender: 'me',
                text: inputText,
                timestamp: Date.now(),
                senderId: deviceIdRef.current
            };

            const updated = [...messages, newMessage];
            setMessages(updated);
            setInputText('');

            // Also send to database so the other person receives it without refresh
            if (channelIdRef.current) {
                fetch('/api/messenger/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        channelId: channelIdRef.current,
                        senderId: deviceIdRef.current,
                        encryptedPayload: ciphertext
                    })
                }).catch(err => console.error("Failed to sync message", err));
            }

            if (isSaving) {
                await saveSession(sessionKey, updated);
            }
        } catch (e) {
            console.error(e);
            alert("Encryption Failed");
        }
    };

    const handleDecrypt = async () => {
        if (!decryptInput.trim()) return;

        try {
            const plaintext = await decryptMessage(decryptInput, sessionKey);

            // Add to local history ("Received")
            const newMessage: ChatMessage = {
                id: Date.now().toString(),
                sender: 'them',
                text: plaintext,
                timestamp: Date.now(),
                isDecrypted: true
            };

            const updated = [...messages, newMessage];
            setMessages(updated);
            setDecryptInput('');

            if (isSaving) {
                await saveSession(sessionKey, updated);
            }
        } catch (e) {
            console.error(e);
            alert("Decryption Failed. Ensure you are using the correct Session Key.");
        }
    };



    // --- Live Message Polling ---
    useEffect(() => {
        if (!isSessionActive || !sessionKey || status !== 'authenticated') {
            channelIdRef.current = null;
            return;
        }

        let isPolling = true;

        const syncMessages = async () => {
            try {
                if (!channelIdRef.current) {
                    const encoder = new TextEncoder();
                    const data = encoder.encode(sessionKey);
                    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                    const hashArray = Array.from(new Uint8Array(hashBuffer));
                    channelIdRef.current = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                }

                const res = await fetch(`/api/messenger/messages?channelId=${channelIdRef.current}&since=${lastSyncTimeRef.current}`);
                if (res.ok && isPolling) {
                    const data = await res.json();
                    if (data.messages && data.messages.length > 0) {
                        let updatedMessages = [...messages];
                        let hasNew = false;
                        let maxTimestamp = lastSyncTimeRef.current;

                        for (const msg of data.messages) {
                            if (msg.timestamp > maxTimestamp) maxTimestamp = msg.timestamp;
                            
                            // Only add if it's from someone else
                            if (msg.senderId !== deviceIdRef.current) {
                                hasNew = true;
                                let displayedText = msg.encryptedPayload;
                                let isAutoDecrypted = false;

                                // Auto-decrypt if key is available
                                try {
                                    if (sessionKey) {
                                        displayedText = await decryptMessage(msg.encryptedPayload, sessionKey);
                                        isAutoDecrypted = true;
                                    }
                                } catch (err) {
                                    console.warn("Auto-decryption failed for message:", msg.timestamp);
                                    displayedText = "[Encrypted Message - Key Mismatch]";
                                }

                                updatedMessages.push({
                                    id: msg._id || msg.timestamp.toString(),
                                    sender: 'them',
                                    text: displayedText,
                                    timestamp: msg.timestamp,
                                    senderId: msg.senderId,
                                    isDecrypted: isAutoDecrypted
                                });
                            }
                        }

                        lastSyncTimeRef.current = maxTimestamp;

                        if (hasNew) {
                            setMessages(updatedMessages);
                            if (isSaving) {
                                saveSession(sessionKey, updatedMessages).catch(e => console.error(e));
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("Live Sync Error:", err);
            }
        };

        const interval = setInterval(syncMessages, 3000);
        syncMessages(); // Initial run

        return () => {
            isPolling = false;
            clearInterval(interval);
        };
    }, [isSessionActive, sessionKey, status, messages, isSaving]);


    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (status === 'loading') return <div className="min-h-screen bg-[var(--background)]" />;

    return (
        <main className="min-h-screen pt-10 pb-10 px-4 md:px-8 max-w-[1600px] mx-auto relative">
            {/* Favorite Modal */}
            <AnimatePresence>
                {showFavModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[var(--card-bg)] border border-neon-yellow/30 rounded-2xl p-6 w-full max-w-md shadow-[0_0_30px_rgba(255,255,0,0.1)] relative overflow-hidden"
                        >
                            <div className="absolute top-0 inset-x-0 h-1 bg-neon-yellow/50" />

                            <h3 className="text-lg font-black italic uppercase text-[var(--foreground)] mb-4 flex items-center gap-2">
                                <Star className="text-neon-yellow" fill="currentColor" size={20} />
                                Secure Bookmark
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-[var(--text-dim)] block mb-2">Assign Alias</label>
                                    <input
                                        type="text"
                                        value={favAliasInput}
                                        onChange={(e) => setFavAliasInput(e.target.value)}
                                        className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-sm text-[var(--foreground)] focus:border-neon-yellow/50 outline-none transition-colors font-mono"
                                        autoFocus
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setShowFavModal(false)}
                                        className="flex-1 py-3 rounded-xl border border-[var(--glass-border)] text-[var(--text-dim)] font-bold uppercase text-xs hover:bg-[var(--glass-bg)] transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmFavorite}
                                        className="flex-1 py-3 rounded-xl bg-neon-yellow text-black font-black uppercase text-xs hover:bg-neon-yellow/90 transition-colors shadow-lg shadow-neon-yellow/20"
                                    >
                                        Save Uplink
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Background Ambience */}
            <div className="fixed inset-0 pointer-events-none opacity-20 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(0,255,157,0.05),transparent_70%)]" />
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-neon-green/50 to-transparent" />
            </div>

            <div className="relative z-10 grid lg:grid-cols-12 gap-8 h-[calc(100vh-120px)] lg:h-[90vh]">

                {/* LEFT PANEL: Session Control */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* Header Card */}
                    <div className={`bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-[2rem] p-8 relative overflow-hidden ${isSessionActive ? 'hidden md:block' : 'block'}`}>
                        <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
                            <Shield size={64} className="text-neon-green" />
                        </div>
                        <div className="flex items-center justify-between mb-2">
                            <h1 className="text-3xl font-black italic tracking-tighter uppercase">
                                Secure <span className="text-neon-green">Messenger</span>
                            </h1>
                            {isSessionActive && (
                                <button
                                    onClick={handleToggleFavorite}
                                    className={`p-2 rounded-full transition-colors ${isFav ? 'text-neon-yellow' : 'text-[var(--text-dim)] hover:text-neon-yellow'}`}
                                    title={isFav ? "Remove from Favorites" : "Add to Favorites"}
                                >
                                    <Star size={20} fill={isFav ? "currentColor" : "none"} />
                                </button>
                            )}
                        </div>

                        <p className="text-[10px] font-mono text-[var(--text-dim)] uppercase tracking-widest mb-6">
                            Zero-Knowledge
                        </p>

                        {!isSessionActive ? (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-[var(--text-dim)]">Session Key</label>
                                    <div className="relative group">
                                        <input
                                            type={showKey ? "text" : "password"}
                                            value={tempKeyInput}
                                            onChange={(e) => setTempKeyInput(e.target.value)}
                                            placeholder="Enter or Generate Key..."
                                            className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-xs font-mono text-neon-green focus:border-neon-green/50 transition-all outline-none"
                                        />
                                        <button
                                            onClick={() => setShowKey(!showKey)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)] hover:text-neon-green"
                                        >
                                            {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleGenerateKey}
                                            className="flex-1 py-2 rounded-lg border border-neon-green/20 bg-neon-green/5 text-neon-green text-[10px] font-bold uppercase hover:bg-neon-green/10 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <RefreshCw size={12} /> Generate New
                                        </button>
                                        <button
                                            onClick={() => copyToClipboard(tempKeyInput)}
                                            disabled={!tempKeyInput}
                                            className="flex-1 py-2 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--foreground)] text-[10px] font-bold uppercase hover:bg-[var(--glass-border)] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            <Copy size={12} /> Copy Key
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleJoinSession()}
                                    className="w-full py-4 rounded-xl bg-neon-green text-black font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(0,255,157,0.3)] flex items-center justify-center gap-2"
                                >
                                    <Lock size={16} /> Enter Secure Channel
                                </button>

                                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 text-[var(--text-dim)] text-[10px] leading-relaxed">
                                    <span className="text-amber-500 font-bold block mb-1 uppercase">Direction:</span>
                                    Share this key SECURELY via a secondary channel (QR code, physical transfer). Anyone with this key can read your messages.
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="p-4 rounded-xl bg-neon-green/10 border border-neon-green/20 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-neon-green flex items-center justify-center text-black">
                                        <Lock size={20} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-neon-green uppercase">Channel Active</div>
                                        <div className="text-[10px] text-[var(--text-dim)] font-mono">
                                            {sessionKey.substring(0, 8)}...{sessionKey.substring(sessionKey.length - 8)}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={handleLeaveSession}
                                        className="w-full py-3 rounded-lg border border-[var(--glass-border)] hover:bg-[var(--glass-bg)] text-[var(--foreground)] text-xs font-bold uppercase transition-colors"
                                    >
                                        Close Channel
                                    </button>
                                    <button
                                        onClick={handleNuke}
                                        className="w-full py-3 rounded-lg border border-red-500/20 hover:bg-red-500/10 text-red-500 text-xs font-bold uppercase transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Trash2 size={14} /> Nuke Session Data
                                    </button>
                                </div>

                                <div className="flex items-center gap-3 px-2">
                                    <div className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${isSaving ? 'bg-neon-green' : 'bg-[var(--glass-border)]'}`} onClick={() => setIsSaving(!isSaving)}>
                                        <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${isSaving ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase text-[var(--text-dim)]">Persistence {isSaving ? 'ON' : 'OFF'}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT PANEL: Chat Interface */}
                <div className="lg:col-span-8 flex flex-col h-full bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-[2rem] overflow-hidden relative">

                    {!isSessionActive ? (
                        <div className="absolute inset-0 hidden md:flex flex-col items-center justify-center text-[var(--text-dim)] opacity-50 pointer-events-none">
                            <Shield size={96} className="mb-4 text-[var(--glass-border)]" />
                            <p className="text-xs font-mono uppercase tracking-widest">Awaiting Secure Handshake...</p>
                        </div>
                    ) : (
                        <>
                            {/* Mobile Header (Active Session Only) - Removed to maximize space and fix scrolling */}

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scrollbar-thin scrollbar-thumb-neon-green/20">
                                {messages.length === 0 && (
                                    <div className="text-center py-20 text-[var(--text-dim)]">
                                        <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
                                        <p className="text-xs uppercase tracking-widest">Channel Empty. Begin Transmission.</p>
                                    </div>
                                )}

                                {messages.map((msg) => {
                                    const isMe = msg.senderId === deviceIdRef.current || (!msg.senderId && msg.sender === 'me');
                                    return (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[85%] p-4 rounded-2xl border ${isMe
                                            ? 'bg-neon-green/10 border-neon-green/30 text-neon-green rounded-tr-none'
                                            : 'bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--foreground)] rounded-tl-none'
                                            } relative break-words overflow-hidden`}
                                        >
                                            <p className="text-sm font-mono leading-relaxed whitespace-pre-wrap mt-1 break-all md:break-words">{msg.text}</p>
                                            <span className="text-[9px] opacity-40 mt-2 block font-mono text-right">
                                                {new Date(msg.timestamp).toLocaleDateString([], { month: '2-digit', day: '2-digit', year: 'numeric' })} {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </motion.div>
                                    );
                                })}


                                <div ref={messagesEndRef} />
                            </div>



                            {/* Main Input Area */}
                            <div className="p-4 md:p-6 space-y-4 border-t border-[var(--glass-border)] bg-[var(--background)]/30 backdrop-blur-md">

                                {/* 1. Encrypt / Send Flow */}
                                <div className="flex items-end gap-4">
                                    <div className="flex-1 relative group">
                                        <div className="absolute -inset-0.5 bg-neon-green opacity-0 group-focus-within:opacity-20 blur rounded-2xl transition duration-500" />
                                        <textarea
                                            value={inputText}
                                            onChange={(e) => setInputText(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleEncrypt();
                                                }
                                            }}
                                            placeholder="ENCRYPT_MESSAGE..."
                                            rows={1}
                                            className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-2xl px-6 py-4 text-sm text-neon-green font-mono placeholder:text-[var(--text-dim)] outline-none focus:border-neon-green/50 transition-all relative z-10 resize-none min-h-[56px] max-h-[200px] overflow-y-auto"
                                            style={{
                                                height: inputText.split('\n').length > 1 ? `${Math.min(200, inputText.split('\n').length * 24 + 32)}px` : '56px'
                                            }}
                                        />
                                    </div>
                                    <button
                                        onClick={async () => {
                                            if (!inputText.trim()) return;
                                            if (encryptedOutput) {
                                                setEncryptedOutput('');
                                                return;
                                            }
                                            try {
                                                const encrypted = await encryptMessage(inputText.trim(), sessionKey);
                                                setEncryptedOutput(encrypted);
                                            } catch (err) {
                                                console.error("Encryption failed", err);
                                            }
                                        }}
                                        disabled={!inputText.trim()}
                                        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shrink-0 border border-neon-green/30 hover:bg-neon-green/10 ${inputText.trim() ? 'text-neon-green' : 'text-[var(--text-dim)] opacity-50'}`}
                                        title="Preview Ciphertext"
                                    >
                                        <Shield size={22} />
                                    </button>
                                    <button
                                        onClick={handleEncrypt}
                                        disabled={!inputText.trim()}
                                        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shrink-0 ${inputText.trim()
                                            ? 'bg-neon-green text-black shadow-[0_0_20px_rgba(0,255,157,0.4)] hover:scale-105 active:scale-95'
                                            : 'bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-dim)]'
                                            }`}
                                    >
                                        <Send size={24} />
                                    </button>
                                </div>

                                {/* Ciphertext Output (If just generated) */}
                                <AnimatePresence>
                                    {encryptedOutput && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden mt-4"
                                        >
                                            <div className="bg-neon-green/5 border border-neon-green/20 rounded-xl p-3 flex items-center justify-between gap-4">
                                                <div className="font-mono text-[10px] text-neon-green truncate flex-1">
                                                    {encryptedOutput}
                                                </div>
                                                <button
                                                    onClick={() => copyToClipboard(encryptedOutput)}
                                                    className="text-neon-green ml-2 hover:scale-110 transition-transform"
                                                >
                                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* 2. Decrypt Flow Toggle */}
                                <div className="flex justify-center pt-2">
                                    <button 
                                        onClick={() => setIsManualDecryptOpen(!isManualDecryptOpen)}
                                        className="px-6 py-2.5 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-neon-blue hover:bg-neon-blue/10 hover:border-neon-blue/30 transition-all flex items-center gap-3 shadow-[0_0_15px_rgba(0,183,255,0.1)] active:scale-95 group"
                                    >
                                        <div className="p-1 rounded bg-neon-blue/20 text-neon-blue group-hover:scale-110 transition-transform">
                                            {isManualDecryptOpen ? <X size={10} /> : <Zap size={10} />}
                                        </div>
                                        {isManualDecryptOpen ? 'Close Terminal' : 'Decrypt the code'}
                                    </button>
                                </div>

                                <AnimatePresence>
                                    {isManualDecryptOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="flex gap-4 pt-4 mt-2 border-t border-[var(--glass-border)]/50">
                                                <div className="relative flex-1">
                                                    <input
                                                        type="text"
                                                        value={decryptInput}
                                                        onChange={(e) => setDecryptInput(e.target.value)}
                                                        placeholder="Paste encrypted text here..."
                                                        className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-3 pl-10 text-xs font-mono focus:border-neon-blue/50 outline-none transition-colors"
                                                    />
                                                    <Smartphone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
                                                </div>
                                                <button
                                                    onClick={handleDecrypt}
                                                    disabled={!decryptInput}
                                                    className="px-6 py-3 bg-[var(--card-bg)] border border-[var(--glass-border)] text-[var(--foreground)] font-bold uppercase rounded-xl hover:bg-[var(--glass-bg)] active:scale-95 transition-all text-xs flex items-center gap-2 disabled:opacity-50"
                                                >
                                                    <Key size={14} /> Decrypt
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                            </div>
                        </>
                    )}
                </div>
            </div>
        </main>
    );
}

export default function SecureMessenger() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="text-neon-green animate-spin" size={40} />
                    <p className="text-xs font-mono text-neon-green uppercase tracking-widest animate-pulse">Initializing Secure Channel...</p>
                </div>
            </div>
        }>
            <SecureMessengerContent />
        </Suspense>
    );
}
