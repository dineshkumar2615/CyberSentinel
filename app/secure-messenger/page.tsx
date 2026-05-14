'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Key, Shield, MessageSquare, Trash2, Copy, Check, Eye, EyeOff, Save, RefreshCw, Smartphone, Send, ArrowRight, Star, X, Zap, Image as ImageIcon, ImagePlus, Maximize2, KeyRound } from 'lucide-react';
import { generateSessionKey, encryptMessage, decryptMessage } from '@/lib/encryption';
import { saveSession, loadSession, deleteSession, ChatMessage, nukeAllData } from '@/lib/local-storage';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { saveFavorite, removeFavorite, isFavorite, getRecents, addRecentSession, RecentSession } from '@/lib/local-storage';

function SecureMessengerContent() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const urlTag = searchParams.get('tag'); // whatsapp, instagram, etc.

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
    
    // Image support state
    const [isProcessingImage, setIsProcessingImage] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const hashString = async (str: string) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    // Initialize Device ID
    useEffect(() => {
        const initDeviceId = async () => {
            if (status === 'loading') return;

            let id = '';
            if (session?.user?.email) {
                // Use hashed email for stable, cross-device ID
                id = await hashString(session.user.email);
            } else {
                // Persistent ID for guest users (persists across tab closes)
                id = localStorage.getItem('secure_messenger_deviceId') || '';
                if (!id) {
                    id = `guest_${Math.random().toString(36).substring(2, 10)}`;
                    localStorage.setItem('secure_messenger_deviceId', id);
                }
            }
            deviceIdRef.current = id;
        };
        initDeviceId();
    }, [session, status]);

    // --- UI State ---
    const [showKey, setShowKey] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isSaving, setIsSaving] = useState(true); // Default to save, can toggle off
    const [showFavModal, setShowFavModal] = useState(false);
    const [favAliasInput, setFavAliasInput] = useState('');
    const [showExtensionModal, setShowExtensionModal] = useState(false);
    const [showEmailPrompt, setShowEmailPrompt] = useState(false);
    const [recipientEmail, setRecipientEmail] = useState('');
    const [isSharingKey, setIsSharingKey] = useState(false);
    const [hideKeyInHeader, setHideKeyInHeader] = useState(true);
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

        if (keyParam && keyParam !== lastJoinedKey.current) {
            lastJoinedKey.current = keyParam;
            setTempKeyInput(keyParam);
            // Small delay to allow state update before joining
            setTimeout(() => {
                handleJoinSession(keyParam);
            }, 100);
        }
    }, [searchParams, isSessionActive]);

    // Polling removed in favor of Dashboard Notifications
    // --- Session Management ---

    const handleGenerateKey = async () => {
        if (status !== 'authenticated') {
            router.push('/login');
            return;
        }
        const key = await generateSessionKey();
        setTempKeyInput(key);
        setShowKey(true);
        setShowEmailPrompt(true); // Ask for second person email
    };

    const shareKey = async (key: string, email: string) => {
        setIsSharingKey(true);
        try {
            const normalizedEmail = email.toLowerCase().trim();
            const res = await fetch('/api/messenger/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, recipientEmail: normalizedEmail })
            });
            if (!res.ok) throw new Error("Sharing failed");
            console.log(`[shareKey] Successfully shared key with ${normalizedEmail}`);
            alert(`Key shared successfully with ${normalizedEmail}`);
        } catch (err) {
            console.error("[shareKey] Key sharing failed:", err);
            alert("Failed to share key. Please check the recipient's email.");
        } finally {
            setIsSharingKey(false);
            setRecipientEmail('');
            setShowEmailPrompt(false);
        }
    };

    const handleJoinSession = async (manualKey?: string) => {
        if (status !== 'authenticated') {
            router.push('/login');
            return;
        }
        const keyToUse = manualKey || tempKeyInput;

        if (!keyToUse.trim() || keyToUse.length < 4) {
            if (!manualKey) alert("Invalid Key Format (min 4 chars)");
            return;
        }

        const key = keyToUse.trim();
        setSessionKey(key);
        setIsSessionActive(true);
        setMessages([]); // Clear previous messages for session isolation
        setEncryptedOutput(''); // Clear any pending encrypted output
        
        // Reset sync state for new channel
        lastSyncTimeRef.current = 0;
        channelIdRef.current = null;
        
        // Handle key sharing if email was provided
        if (recipientEmail && !isSharingKey) {
            shareKey(key, recipientEmail);
        }

        // Initialize Channel ID immediately
        const encoder = new TextEncoder();
        const data = encoder.encode(key);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        channelIdRef.current = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // Ensure deviceId is computed before processing messages
        if (!deviceIdRef.current && session?.user?.email) {
            const emailEncoder = new TextEncoder();
            const emailData = emailEncoder.encode(session.user.email.toLowerCase());
            const emailHash = await crypto.subtle.digest('SHA-256', emailData);
            deviceIdRef.current = Array.from(new Uint8Array(emailHash)).map(b => b.toString(16).padStart(2, '0')).join('');
        }
        // Check favorites async
        const favStatus = await isFavorite(key, status === 'authenticated');
        setIsFav(favStatus);

        // Always fetch full server history (since=0) first so extension messages
        // (which may have older timestamps than localStorage web messages) are never missed.
        const channelId = channelIdRef.current;
        let serverMessages: ChatMessage[] = [];
        try {
            const res = await fetch(`/api/messenger/messages?channelId=${channelId}&since=0`);
            if (res.ok) {
                const data = await res.json();
                if (data.messages && data.messages.length > 0) {
                    const decoded: ChatMessage[] = [];
                    let maxTs = 0;
                    for (const msg of data.messages) {
                        if (msg.timestamp > maxTs) maxTs = msg.timestamp;
                        const isMe = msg.senderId === deviceIdRef.current;
                        let displayedText = msg.encryptedPayload;
                        let isAutoDecrypted = false;
                        let isError = false;
                        try {
                            displayedText = await decryptMessage(msg.encryptedPayload, key);
                            isAutoDecrypted = true;
                        } catch {
                            displayedText = '[Encrypted - Key Mismatch]';
                            isError = true;
                        }
                        decoded.push({
                            id: msg._id || msg.timestamp.toString(),
                            sender: isMe ? 'me' : 'them',
                            text: displayedText,
                            timestamp: msg.timestamp,
                            senderId: msg.senderId,
                            isDecrypted: isAutoDecrypted,
                            isError,
                            clientMessageId: msg.clientMessageId
                        });
                    }
                    serverMessages = decoded;
                    lastSyncTimeRef.current = maxTs;
                }
            }
        } catch (err) {
            console.error('[Join] Failed to fetch server history:', err);
        }

        // Load localStorage history and merge, deduplicate, sort
        const sessionData = await loadSession(key);
        const localMessages = sessionData?.messages || [];
        const merged = Array.from(
            new Map([...serverMessages, ...localMessages].map(m => [m.clientMessageId || m.id, m])).values()
        ).sort((a, b) => a.timestamp - b.timestamp);

        // If local has messages newer than server, track the true max
        if (localMessages.length > 0) {
            const localMax = Math.max(...localMessages.map(m => m.timestamp));
            if (localMax > lastSyncTimeRef.current) {
                lastSyncTimeRef.current = localMax;
            }
        }

        setMessages(merged);
        if (isSaving && merged.length > 0) {
            saveSession(key, merged).catch(e => console.error(e));
        }

        // Mark as accepted in the background
        fetch('/api/messenger/accept', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key })
        }).catch(err => console.error("Failed to mark key as accepted", err));
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
        const confirmMsg = isSaving 
            ? "Persistence is ON. This will clear your current view but KEEP your history in storage. Proceed?" 
            : "WARNING: This will permanently erase this chat history from this device. Proceed?";

        if (confirm(confirmMsg)) {
            if (!isSaving) {
                await deleteSession(sessionKey);
            }
            
            // Note: We no longer remove from favorites here as requested.
            setMessages([]);
            setIsSessionActive(false);
            setSessionKey('');
            setTempKeyInput('');
            channelIdRef.current = null;
            lastSyncTimeRef.current = 0;
            router.replace('/secure-messenger');
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

    const compressImage = (base64: string): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Max dimensions 1200px
                const maxDim = 1200;
                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = (height / width) * maxDim;
                        width = maxDim;
                    } else {
                        width = (width / height) * maxDim;
                        height = maxDim;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                // Compress to JPEG with 0.7 quality
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.src = base64;
        });
    };

    const sendEncryptedMessage = async (content: string, isImage: boolean = false) => {
        if (!content.trim()) return;

        try {
            const ciphertext = await encryptMessage(content, sessionKey);
            
            const clientMessageId = Date.now().toString() + '_' + Math.random().toString(36).substring(2, 9);
            const newMessage: ChatMessage = {
                id: clientMessageId,
                sender: 'me',
                text: content,
                timestamp: Date.now(),
                senderId: deviceIdRef.current,
                isDecrypted: true,
                clientMessageId: clientMessageId
            };

            setMessages(prev => {
                const updated = [...prev, newMessage];
                if (isSaving) {
                    saveSession(sessionKey, updated).catch(e => console.error(e));
                }
                return updated;
            });

            if (!isImage) setInputText('');

            if (channelIdRef.current) {
                fetch('/api/messenger/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        channelId: channelIdRef.current,
                        senderId: deviceIdRef.current,
                        senderEmail: session?.user?.email,
                        encryptedPayload: ciphertext,
                        clientMessageId: clientMessageId,
                        tag: urlTag || 'app'
                    })
                }).then(res => {
                    if (!res.ok) throw new Error(`API error: ${res.status}`);
                }).catch(err => console.error("Failed to sync message", err));
            }
        } catch (e: any) {
            console.error("Encryption/Transmission error:", e);
            alert(`Transmission Failed: ${e.message || 'Unknown Error'}`);
        }
    };

    const handleEncrypt = async () => {
        await sendEncryptedMessage(inputText);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert("Please select an image file.");
            return;
        }

        // Limit raw file size to 10MB before processing
        if (file.size > 10 * 1024 * 1024) {
            alert("File too large. Max 10MB.");
            return;
        }

        setIsProcessingImage(true);
        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const imgData = event.target?.result as string;
                const compressed = await compressImage(imgData);
                await sendEncryptedMessage(compressed, true);
                setIsProcessingImage(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            };
            reader.readAsDataURL(file);
        } catch (err) {
            console.error("Image processing failed", err);
            setIsProcessingImage(false);
            alert("Failed to process image.");
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

            setMessages(prev => {
                const updated = [...prev, newMessage];
                if (isSaving) {
                    saveSession(sessionKey, updated).catch(e => console.error(e));
                }
                return updated;
            });
            
            setDecryptInput('');
        } catch (e: any) {
            console.error("Manual Decryption Error:", e);
            alert(`Decryption Failed: ${e.message || 'Check your Session Key'}`);
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
                    if (session?.user?.email) {
                        const encoder = new TextEncoder();
                        const data = encoder.encode(session.user.email.toLowerCase());
                        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                        const hashArray = Array.from(new Uint8Array(hashBuffer));
                        deviceIdRef.current = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                    }

                    const encoder = new TextEncoder();
                    const data = encoder.encode(sessionKey);
                    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                    const hashArray = Array.from(new Uint8Array(hashBuffer));
                    channelIdRef.current = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                }

                // Fetch ALL messages for this channel regardless of platform tag
                // The Secure Messenger is the unified hub — messages from extension (instagram/whatsapp) and web all show here
                const res = await fetch(`/api/messenger/messages?channelId=${channelIdRef.current}&since=${lastSyncTimeRef.current}`);
                
                if (res.ok && isPolling) {
                    const data = await res.json();
                    if (data.messages && data.messages.length > 0) {
                        const newItems: ChatMessage[] = [];
                        let maxTimestamp = lastSyncTimeRef.current;

                        for (const msg of data.messages) {
                            if (msg.timestamp > maxTimestamp) maxTimestamp = msg.timestamp;
                            
                            const isMe = msg.senderId === deviceIdRef.current;
                            let displayedText = msg.encryptedPayload;
                            let isAutoDecrypted = false;
                            let isError = false;

                            try {
                                if (sessionKey) {
                                    displayedText = await decryptMessage(msg.encryptedPayload, sessionKey);
                                    isAutoDecrypted = true;
                                }
                            } catch (err) {
                                displayedText = "[Encrypted Message - Key Mismatch]";
                                isError = true;
                            }

                            newItems.push({
                                id: msg._id || msg.timestamp.toString(),
                                sender: isMe ? 'me' : 'them',
                                text: displayedText,
                                timestamp: msg.timestamp,
                                senderId: msg.senderId,
                                isDecrypted: isAutoDecrypted,
                                isError: isError,
                                clientMessageId: msg.clientMessageId
                            });
                        }

                        setMessages(prev => {
                            const combined = [...prev, ...newItems];
                            return Array.from(new Map(combined.map(m => [m.clientMessageId || m.id, m])).values())
                                .sort((a, b) => a.timestamp - b.timestamp);
                        });
                        lastSyncTimeRef.current = maxTimestamp;
                        
                        if (isSaving && newItems.length > 0) {
                            // Fetch full state for saving
                            setMessages(prev => {
                                saveSession(sessionKey, prev).catch(e => console.error(e));
                                return prev;
                            });
                        }
                    }
                } else if (!res.ok) {
                    console.warn(`Sync failed with status: ${res.status}`);
                }
            } catch (err) {
                console.error("Live Sync Error:", err);
            }
        };

        const interval = setInterval(syncMessages, 3000);
        syncMessages();

        return () => {
            isPolling = false;
            clearInterval(interval);
        };
    }, [isSessionActive, sessionKey, status, urlTag, isSaving]);


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
        <main className="h-[100dvh] flex flex-col pt-8 md:pt-12 px-4 md:px-8 max-w-[1600px] mx-auto relative overflow-hidden font-sans">
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

            {/* Extension Modal */}
            <AnimatePresence>
                {showExtensionModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[var(--card-bg)] border border-neon-green/30 rounded-2xl p-6 w-full max-w-md shadow-[0_0_30px_rgba(0,255,157,0.1)] relative overflow-hidden"
                        >
                            <div className="absolute top-0 inset-x-0 h-1 bg-neon-green/50" />
                            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                <Zap size={80} className="text-neon-green" />
                            </div>

                            <h3 className="text-xl font-black italic uppercase text-[var(--foreground)] mb-2 flex items-center gap-2">
                                <Zap className="text-neon-green" fill="currentColor" size={24} />
                                Permission Request
                            </h3>
                            <p className="text-xs text-[var(--text-dim)] mb-6 leading-relaxed">
                                To use CyberSentinel Cipher across your favorite messengers, we request your permission to download the secure browser extension directly to your device. This extension operates entirely locally.
                            </p>

                            <div className="flex gap-3 pt-2 border-t border-[var(--glass-border)]">
                                <button
                                    onClick={() => setShowExtensionModal(false)}
                                    className="flex-1 py-3 rounded-xl border border-[var(--glass-border)] text-[var(--text-dim)] font-bold uppercase text-xs hover:bg-[var(--glass-bg)] transition-colors"
                                >
                                    Deny
                                </button>
                                <a
                                    href="/api/download/extension"
                                    download
                                    onClick={() => setShowExtensionModal(false)}
                                    className="flex-1 py-3 rounded-xl bg-neon-green text-black font-black uppercase text-[10px] sm:text-xs hover:bg-neon-green/90 transition-colors shadow-lg shadow-neon-green/20 text-center flex items-center justify-center"
                                >
                                    Grant & Download
                                </a>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Email Prompt Modal */}
            <AnimatePresence>
                {showEmailPrompt && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="bg-[var(--card-bg)] border border-neon-blue/30 rounded-2xl p-6 w-full max-w-md shadow-[0_0_40px_rgba(0,210,255,0.15)] relative overflow-hidden"
                        >
                            <div className="absolute top-0 inset-x-0 h-1 bg-neon-blue" />
                            <h3 className="text-xl font-black italic uppercase text-[var(--foreground)] mb-2 flex items-center gap-2">
                                <Send className="text-neon-blue" size={24} />
                                Key Sharing
                            </h3>
                            <p className="text-xs text-[var(--text-dim)] mb-6 leading-relaxed">
                                To automatically transmit this key to your contact, please enter their registered email address. This key will appear in their dashboard notifications.
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-[var(--text-dim)] block mb-2">Recipient Email (Optional)</label>
                                    <input
                                        type="email"
                                        placeholder="user@cybersentinel.ai"
                                        value={recipientEmail}
                                        onChange={(e) => setRecipientEmail(e.target.value)}
                                        className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-sm text-[var(--foreground)] focus:border-neon-blue outline-none transition-colors"
                                        autoFocus
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => { setShowEmailPrompt(false); setRecipientEmail(''); }}
                                        className="flex-1 py-3 rounded-xl border border-[var(--glass-border)] text-[var(--text-dim)] font-bold uppercase text-xs hover:bg-[var(--glass-bg)] transition-colors"
                                    >
                                        Skip Sharing
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (recipientEmail) {
                                                shareKey(tempKeyInput || sessionKey, recipientEmail);
                                            } else {
                                                setShowEmailPrompt(false);
                                            }
                                        }}
                                        disabled={isSharingKey}
                                        className="flex-1 py-3 rounded-xl bg-neon-blue text-black font-black uppercase text-xs hover:bg-neon-blue/90 transition-colors shadow-lg shadow-neon-blue/20 disabled:opacity-50"
                                    >
                                        {isSharingKey ? 'Sharing...' : 'Share Key Now'}
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

            <div className={`relative z-10 gap-8 min-h-0 w-full ${!isSessionActive ? 'flex flex-col items-center justify-center py-10 max-w-lg mx-auto' : 'flex flex-col lg:grid lg:grid-cols-20 flex-1 h-full max-w-[1400px] mx-auto overflow-hidden'}`}>

                {/* LEFT PANEL: Session Control */}
                <div className={`${isSessionActive ? 'lg:col-span-7 order-2 lg:order-1 lg:h-full lg:pr-2 justify-center' : 'w-full'} flex flex-col min-h-0`}>
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

                        <div className="flex justify-between items-center mb-6">
                            <p className="text-[10px] font-mono text-[var(--text-dim)] uppercase tracking-widest leading-none">
                                Zero-Knowledge
                            </p>
                            <button 
                                onClick={() => {
                                    if (status !== 'authenticated') {
                                        router.push('/login');
                                        return;
                                    }
                                    setShowExtensionModal(true);
                                }}
                                className="text-[10px] font-bold text-neon-green uppercase flex items-center gap-1 hover:underline"
                            >
                                <Zap size={12} /> Browser Extension
                            </button>
                        </div>

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
                                            className="flex-1 py-2 rounded-lg border border-neon-green/20 bg-neon-green/5 text-neon-green text-[10px] font-bold uppercase hover:bg-neon-green/10 transition-all flex items-center justify-center gap-2 group hover:scale-[1.02] active:scale-95"
                                        >
                                            <KeyRound size={12} className="group-hover:rotate-12 transition-transform duration-300" /> Generate New
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
                                        <div className="text-xs font-bold text-neon-green uppercase flex items-center gap-2">
                                            Channel Active
                                            {channelIdRef.current && (
                                                <span className="text-[8px] px-1.5 py-0.5 rounded bg-neon-green/20 border border-neon-green/30 font-mono">
                                                    ID: {channelIdRef.current.substring(0, 6)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-[var(--text-dim)] font-mono flex items-center gap-2">
                                            <span className="break-all">
                                                {hideKeyInHeader ? `${sessionKey.substring(0, 8)}...${sessionKey.substring(sessionKey.length - 8)}` : sessionKey}
                                            </span>
                                            <button onClick={() => setHideKeyInHeader(!hideKeyInHeader)} className="p-1 hover:text-neon-green transition-colors">
                                                {hideKeyInHeader ? <Eye size={12} /> : <EyeOff size={12} />}
                                            </button>
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
                                    <div 
                                        className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${isSaving ? 'bg-neon-green' : 'bg-[var(--glass-border)]'}`} 
                                        onClick={async () => {
                                            const newSaving = !isSaving;
                                            setIsSaving(newSaving);
                                            if (!newSaving) {
                                                await deleteSession(sessionKey);
                                            } else {
                                                await saveSession(sessionKey, messages);
                                            }
                                        }}
                                    >
                                        <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${isSaving ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase text-[var(--text-dim)]">Persistence {isSaving ? 'ON' : 'OFF'}</span>
                                </div>
                            </div>
                        )}
                    </div>
            </div>

                {/* RIGHT PANEL: Chat Interface */}
                <div className={`lg:col-span-13 order-1 lg:order-2 flex flex-col h-full bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-[2rem] overflow-hidden relative ${!isSessionActive ? 'hidden' : 'flex'}`}>

                    {!isSessionActive ? (
                        <div className="absolute inset-0 hidden md:flex flex-col items-center justify-center text-[var(--text-dim)] opacity-50 pointer-events-none">
                            <Shield size={96} className="mb-4 text-[var(--glass-border)]" />
                            <p className="text-xs font-mono uppercase tracking-widest">Awaiting Secure Handshake...</p>
                        </div>
                    ) : (
                        <>
                             {/* Mobile Header (Active Session Only) */}
                            <div className="md:hidden flex items-center justify-between p-4 border-b border-[var(--glass-border)] bg-[var(--background)]/30 backdrop-blur-md">
                                <div className="flex items-center gap-3 flex-1">
                                    <button
                                        onClick={handleToggleFavorite}
                                        className={`p-2 rounded-xl border transition-all active:scale-95 flex items-center justify-center shrink-0 ${
                                            isFav 
                                            ? 'bg-neon-yellow/20 border-neon-yellow/40 text-neon-yellow shadow-[0_0_15px_rgba(234,179,8,0.2)]' 
                                            : 'bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--text-muted)] hover:text-[var(--foreground)]'
                                        }`}
                                        title={isFav ? "Remove from favorites" : "Add to favorites"}
                                    >
                                        <Star size={18} fill={isFav ? "currentColor" : "none"} />
                                    </button>

                                    <div className="flex flex-col flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <div className="w-5 h-5 rounded-md bg-neon-green/10 border border-neon-green/20 flex items-center justify-center text-neon-green">
                                                <Lock size={10} />
                                            </div>
                                            <div className="text-[10px] text-[var(--text-muted)] font-mono uppercase tracking-wider">Session Key</div>
                                        </div>
                                        <div className="text-[11px] text-[var(--foreground)] font-mono font-bold leading-none flex items-center gap-2">
                                            <span className="break-all">
                                                {hideKeyInHeader ? `${sessionKey.substring(0, 10)}...${sessionKey.substring(sessionKey.length - 8)}` : sessionKey}
                                            </span>
                                            <button onClick={() => setHideKeyInHeader(!hideKeyInHeader)} className="p-1 hover:text-neon-green transition-colors">
                                                {hideKeyInHeader ? <Eye size={12} /> : <EyeOff size={12} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 ml-4">
                                    <button
                                        onClick={handleLeaveSession}
                                        className="p-2.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--foreground)] active:scale-95 transition-all flex items-center justify-center"
                                        title="Close Channel"
                                    >
                                        <X size={18} />
                                    </button>
                                    <button
                                        onClick={handleNuke}
                                        className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 active:scale-95 transition-all flex items-center justify-center"
                                        title="Nuke Session"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 flex flex-col max-w-[1200px] mx-auto w-full min-h-0 overflow-hidden">
                                <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-4 scrollbar-thin scrollbar-thumb-neon-green/20 scrollbar-track-transparent">
                                {messages.length === 0 && (
                                    <div className="text-center py-20 text-[var(--text-dim)]">
                                        <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
                                        <p className="text-xs uppercase tracking-widest">Channel Empty. Begin Transmission.</p>
                                    </div>
                                )}

                                {messages.map((msg) => {
                                    const isMe = msg.sender === 'me';
                                    return (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[90%] md:max-w-[85%] p-3 md:p-4 rounded-2xl border ${isMe
                                            ? 'bg-neon-green/10 border-neon-green/30 text-neon-green rounded-tr-none'
                                            : 'bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--foreground)] rounded-tl-none'
                                            } relative break-words overflow-hidden`}
                                        >
                                            <div className="font-mono text-sm whitespace-pre-wrap break-words leading-relaxed overflow-hidden">
                                                {msg.isDecrypted ? (
                                                    msg.text.startsWith('data:image/') ? (
                                                        <div className="relative group/img cursor-zoom-in" onClick={() => setPreviewImage(msg.text)}>
                                                            <img 
                                                                src={msg.text} 
                                                                alt="Encrypted Transmission" 
                                                                className="rounded-lg max-w-full h-auto border border-[var(--glass-border)]"
                                                            />
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                                                <Maximize2 size={24} className="text-white" />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs md:text-sm font-mono leading-relaxed whitespace-pre-wrap mt-1 break-words">{msg.text}</p>
                                                    )
                                                ) : msg.isError ? (
                                                    <div className="flex items-center gap-2 p-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] md:text-xs text-red-400 font-bold uppercase">
                                                        <Shield size={12} />
                                                        Key Mismatch / Legacy
                                                    </div>
                                                ) : (
                                                    <div className="flex items-start gap-3">
                                                        <div className="text-[var(--text-muted)] flex-1 break-all blur-[3px] select-none text-[10px] md:text-xs">
                                                            {msg.text.substring(0, 150)}...
                                                        </div>
                                                        <div className="shrink-0 p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                                            <Lock size={14} />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-[8px] md:text-[9px] opacity-40 mt-1 md:mt-2 block font-mono text-right">
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </motion.div>
                                    );
                                })}


                                <div ref={messagesEndRef} className="h-4" />
                            </div>



                            {/* Main Input Area */}
                            <div className="p-3 md:p-6 space-y-3 md:space-y-4 border-t border-[var(--glass-border)] bg-[var(--background)]/30 backdrop-blur-md">

                                {/* 1. Encrypt / Send Flow */}
                                <div className="flex items-end gap-2 md:gap-4">
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
                                            placeholder="MESSAGE..."
                                            rows={1}
                                            className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-2xl px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm text-neon-green font-mono placeholder:text-[var(--text-dim)] outline-none focus:border-neon-green/50 transition-all relative z-10 resize-none min-h-[48px] md:min-h-[56px] max-h-[150px] md:max-h-[200px] overflow-y-auto"
                                            style={{
                                                height: inputText.split('\n').length > 1 ? `${Math.min(150, inputText.split('\n').length * 20 + 24)}px` : '48px'
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
                                        className={`w-12 md:w-14 h-12 md:h-14 rounded-2xl flex items-center justify-center transition-all shrink-0 border border-neon-green/30 hover:bg-neon-green/10 ${inputText.trim() ? 'text-neon-green' : 'text-[var(--text-dim)] opacity-50'}`}
                                        title="Preview Ciphertext"
                                    >
                                        <Shield size={20} className="md:w-6 md:h-6" />
                                    </button>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        accept="image/*" 
                                        onChange={handleFileChange}
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isProcessingImage}
                                        className={`w-12 md:w-14 h-12 md:h-14 rounded-2xl flex items-center justify-center transition-all shrink-0 border border-neon-green/30 hover:bg-neon-green/10 ${isProcessingImage ? 'opacity-50' : 'text-neon-green active:scale-95'}`}
                                        title="Send Image"
                                    >
                                        {isProcessingImage ? (
                                            <RefreshCw size={20} className="animate-spin" />
                                        ) : (
                                            <ImagePlus size={20} className="md:w-6 md:h-6" />
                                        )}
                                    </button>
                                    <button
                                        onClick={handleEncrypt}
                                        disabled={!inputText.trim() || isProcessingImage}
                                        className={`w-12 md:w-14 h-12 md:h-14 rounded-2xl flex items-center justify-center transition-all shrink-0 ${inputText.trim() && !isProcessingImage
                                            ? 'bg-neon-green text-black shadow-[0_0_20px_rgba(0,255,157,0.4)] hover:scale-105 active:scale-95'
                                            : 'bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-dim)]'
                                            }`}
                                    >
                                        <Send size={20} className="md:w-6 md:h-6" />
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
                        </div>
                    </>
                    )}
                </div>
            </div>

            {/* Image Preview Modal */}
            <AnimatePresence>
                {previewImage && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-black/95 backdrop-blur-xl" onClick={() => setPreviewImage(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="relative max-w-full max-h-full flex items-center justify-center"
                            onClick={e => e.stopPropagation()}
                        >
                            <img 
                                src={previewImage} 
                                alt="Full Resolution" 
                                className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl border border-white/10"
                            />
                            <button
                                onClick={() => setPreviewImage(null)}
                                className="absolute -top-4 -right-4 md:-top-10 md:-right-10 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors"
                            >
                                <X size={24} />
                            </button>
                            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 text-white/60 font-mono text-[10px] uppercase tracking-widest whitespace-nowrap">
                                <Shield size={12} className="text-neon-green" /> End-to-End Encrypted Transmission
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
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
