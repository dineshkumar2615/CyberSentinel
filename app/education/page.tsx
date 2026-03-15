'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, BookOpen, Shield, Zap, AlertTriangle, Info, Lock, Cpu, Code, Hash, ChevronRight, Search, Activity, Eye, Bug, Server, Network, FileCode, Database, Globe, History, Layers, Share2, AlertCircle } from 'lucide-react';
import { useState, useMemo } from 'react';

// --- DATA STRUCTURES ---

interface Dossier {
    id: string;
    title: string;
    category: 'Network' | 'Application' | 'Identity' | 'System';
    description: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    complexity: 'ADVANCED' | 'INTERMEDIATE' | 'BASIC';
    mechanism: string;
    lifecycle: string[];
    forensics: {
        title: string;
        details: string;
    }[];
    mitigation: {
        layer: string;
        control: string;
    }[];
}

const DOSSIERS: Dossier[] = [
    {
        id: 'ddos-arch',
        title: 'DDoS Architecture',
        category: 'Network',
        description: 'Distributed Denial of Service attacks designed to overwhelm infrastructure capacity.',
        severity: 'HIGH',
        complexity: 'BASIC',
        mechanism: 'DDoS attacks leverage botnets (thousands of compromised IoT devices) to flood a target with more traffic than it can handle. This can occur at the Network layer (UDP/ICMP floods) or the Application layer (HTTP GET/POST floods).',
        lifecycle: [
            'Botnet Recruitment: Compromising devices via vulnerabilities or default credentials.',
            'Command & Control (C2): Master server sends an attack signal to all bots.',
            'Target Inundation: Bots direct simultaneous traffic to a single IP/Service.',
            'Service Degradation: Legitimate requests are dropped due to resource exhaustion.'
        ],
        forensics: [
            { title: 'Inbound Traffic Spike', details: 'Unusual, rapid growth in bits-per-second (bps) or packets-per-second (pps) from diverse global IPs.' },
            { title: 'Protocol Anomalies', details: 'High volume of SYN packets without completing the TCP handshake, or excessive UDP traffic on random ports.' }
        ],
        mitigation: [
            { layer: 'Network', control: 'BGP Anycast routing to distribute traffic across a global CDN.' },
            { layer: 'Infrastructure', control: 'Cloud-based scrubbing centers to filter malicious packets before they reach the origin.' }
        ]
    },
    {
        id: 'mitm-arp',
        title: 'MITM / ARP Spoofing',
        category: 'Network',
        description: 'Interception of data between two nodes by manipulating local network protocols.',
        severity: 'CRITICAL',
        complexity: 'INTERMEDIATE',
        mechanism: 'The attacker sends falsified ARP (Address Resolution Protocol) messages onto a local network. This links the attacker\'s MAC address with the IP address of a legitimate server or gateway, causing traffic to be routed through the attacker\'s machine.',
        lifecycle: [
            'Network Entry: Attacker gains access to a local wireless or wired segment.',
            'ARP Infusion: Sending unsolicited ARP replies to the victim and the gateway.',
            'Traffic Interception: Data packets are routed to the attacker for inspection or modification.',
            'Data Forwarding: Re-routing traffic to the original destination to avoid detection.'
        ],
        forensics: [
            { title: 'MAC Address Conflict', details: 'Monitoring tools show multiple IP addresses assigned to a single MAC address, or vice versa.' },
            { title: 'Latency Jitter', details: 'Sudden increases in round-trip time (RTT) as traffic is processed by an intermediate hop.' }
        ],
        mitigation: [
            { layer: 'Network', control: 'Dynamic ARP Inspection (DAI) on managed switches.' },
            { layer: 'Transport', control: 'Forced use of HTTPS/TLS to encrypt data payload, making interception less effective.' }
        ]
    },
    {
        id: 'ransomware-vector',
        title: 'Ransomware Mechanics',
        category: 'System',
        description: 'Advanced cryptoviral extortion that locks data and demands payment.',
        severity: 'CRITICAL',
        complexity: 'ADVANCED',
        mechanism: 'Modern ransomware (e.g., LockBit, Conti) uses asymmetric encryption (RSA/ECC) to encrypt files. It often target Shadow Copies and backups first to prevent recovery without keys. It may also exfiltrate data (Double Extortion) before encryption.',
        lifecycle: [
            'Initial Access: Phishing, RDP exploitation, or supply-chain compromise.',
            'Lateral Movement: Spreading within the network using harvested credentials.',
            'Exfiltration: Stealing sensitive data to use as secondary leverage.',
            'Encryption: Rapid payload execution using multi-threaded cryptographic modules.'
        ],
        forensics: [
            { title: 'High Entropy File I/O', details: 'Sudden surge in file renaming/writing operations with high Shannon entropy (encrypted data).' },
            { title: 'VSS Deletion', details: 'System logs indicating the deletion of Volume Shadow Copies via vssadmin or PowerShell.' }
        ],
        mitigation: [
            { layer: 'System', control: 'Endpoint Detection & Response (EDR) with behavioral blocking.' },
            { layer: 'Strategy', control: 'Offline, immutable backups following the 3-2-1 rule.' }
        ]
    },
    {
        id: 'zeroday-lifecycle',
        title: 'Zero-Day Lifecycle',
        category: 'Application',
        description: 'Exploitation of vulnerabilities unknown to researchers or software vendors.',
        severity: 'CRITICAL',
        complexity: 'ADVANCED',
        mechanism: 'A Zero-Day is a hardware or software flaw for which there is "zero days" of protection or awareness. These are often memory corruption bugs (Use-After-Free, Type Confusion) or logical bypasses.',
        lifecycle: [
            'Discovery: Flaw identified by researchers or malicious actors.',
            'Exploit Development: Writing stable code to weaponize the vulnerability.',
            'Campaign: Silent use against high-value targets.',
            'Disclosure: Vulnerability becomes public through discovery by security vendors.'
        ],
        forensics: [
            { title: 'Unknown Vectors', details: 'System compromise without any known CVE signatures or log triggers.' },
            { title: 'Heap Manipulation', details: 'Unusual memory allocations that do not follow the application\'s standard execution path.' }
        ],
        mitigation: [
            { layer: 'Application', control: 'Fuzzing and rigorous Secure SDLC with static/dynamic analysis (SAST/DAST).' },
            { layer: 'System', control: 'Micro-segmentation to contain the impact of an unknown breach.' }
        ]
    },
    {
        id: 'sqli-deep',
        title: 'SQL Injection Logic',
        category: 'Application',
        description: 'Structured Query Language injection for database exfiltration.',
        severity: 'CRITICAL',
        complexity: 'INTERMEDIATE',
        mechanism: 'An application takes user input and concatenates it directly into an SQL string without sanitization. This allows an attacker to alter the query logic to bypass authentication or dump entire tables.',
        lifecycle: [
            'Input Testing: Finding fields that respond differently to single quotes (\').',
            'Logic Injection: Injecting tautologies (e.g., OR 1=1) to force TRUE results.',
            'Schema Discovery: Using UNION-based queries to map database structure.',
            'Data Extraction: Systematic dumping of usernames, hashes, or records.'
        ],
        forensics: [
            { title: 'Query Logs', details: 'Database logs containing UNION, SELECT, or sleep() commands from public-facing inputs.' },
            { title: 'Error Frequency', details: 'Audit logs showing 500 Internal Server Errors with SQL syntax messages.' }
        ],
        mitigation: [
            { layer: 'Application', control: 'Mandatory use of Prepared Statements and Parameterized Queries.' },
            { layer: 'Application', control: 'Input validation using strict allow-listing (e.g., regex for Alphanumeric only).' }
        ]
    },
    {
        id: 'csrf-tokens',
        title: 'CSRF & Session Hijacking',
        category: 'Identity',
        description: 'Forcing authenticated users to perform unwanted actions on a web application.',
        severity: 'HIGH',
        complexity: 'INTERMEDIATE',
        mechanism: 'Cross-Site Request Forgery (CSRF) exploits the trust a site has in a user\'s browser. If a user is logged into Site A, an attacker can trick them into clicking a link that triggers a hidden request to Site A (e.g., /transfer-funds).',
        lifecycle: [
            'Target Identification: Locating sensitive state-changing endpoints.',
            'Payload Hosting: Creating a malicious page with a hidden form or image tag.',
            'Baiting: Trick the victim into visiting the malicious page while authenticated.',
            'Execution: The browser automatically includes Site A cookies, validating the forged request.'
        ],
        forensics: [
            { title: 'Referer Anomalies', details: 'Sensitive POST requests originating from external or unexpected domains.' },
            { title: 'User Behavior', details: 'Audit logs showing sensitive actions (password change, fund transfer) without a corresponding UI flow.' }
        ],
        mitigation: [
            { layer: 'Transport', control: 'SameSite=Strict cookie attributes to prevent cross-site sharing.' },
            { layer: 'Application', control: 'Implementation of unique, per-session Anti-CSRF tokens for all state-changing requests.' }
        ]
    }
];

// --- COMPONENTS ---

const NavItem = ({ dossier, active, onClick }: { dossier: Dossier, active: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`w-full p-4 rounded-xl text-left transition-all border flex items-center justify-between group ${active
            ? 'bg-neon-blue/10 border-neon-blue/30 shadow-[0_0_20px_rgba(0,210,255,0.1)]'
            : 'border-transparent hover:bg-[var(--glass-bg)]/80 opacity-60 hover:opacity-100'
            }`}
    >
        <div className="flex flex-col">
            <span className={`text-[10px] font-mono mb-1 ${active ? 'text-neon-blue' : 'text-[var(--text-dim)]'}`}>
                {dossier.category.toUpperCase()} // 0{DOSSIERS.indexOf(dossier) + 1}
            </span>
            <span className={`text-sm font-bold uppercase tracking-tight ${active ? 'text-[var(--foreground)]' : 'text-[var(--text-muted)]'}`}>
                {dossier.title}
            </span>
        </div>
        <ChevronRight size={16} className={`${active ? 'text-neon-blue translate-x-1' : 'text-[var(--text-dim)] opacity-0 group-hover:opacity-100'} transition-all`} />
    </button>
);

const SectionHeader = ({ title, icon: Icon, color = 'text-neon-blue' }: { title: string, icon: any, color?: string }) => (
    <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-lg bg-[var(--background)]/40 border border-[var(--glass-border)] ${color}`}>
            <Icon size={18} />
        </div>
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--foreground)]">{title}</h3>
        <div className="flex-1 h-px bg-gradient-to-r from-[var(--glass-border)] to-transparent ml-4" />
    </div>
);

export default function EducationArchives() {
    const [selectedId, setSelectedId] = useState(DOSSIERS[0].id);
    const [search, setSearch] = useState('');

    const filteredDossiers = useMemo(() =>
        DOSSIERS.filter(d =>
            d.title.toLowerCase().includes(search.toLowerCase()) ||
            d.category.toLowerCase().includes(search.toLowerCase())
        ), [search]
    );

    const activeDossier = DOSSIERS.find(d => d.id === selectedId) || DOSSIERS[0];

    return (
        <main className="min-h-screen pt-0 pb-5 px-4 md:px-8 max-w-[1600px] mx-auto flex flex-col items-center">

            {/* Refractive Command Portal (Header v4) */}
            <header className="w-full mb-8 sticky top-0 bg-[var(--background)]/60 backdrop-blur-2xl z-30 border-b border-[var(--glass-border)] rounded-b-3xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.05)]">
                {/* Scanning Laser Animation */}
                <motion.div
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-0 h-[1px] w-48 bg-gradient-to-r from-transparent via-neon-blue to-transparent filter blur-[1px] opacity-70"
                />

                <div className="p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3 group cursor-pointer">
                        <div className="w-10 h-10 rounded-xl bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center text-neon-blue group-hover:scale-110 transition-transform">
                            <BookOpen size={20} />
                        </div>
                        <div className="flex flex-col items-center md:items-start text-center md:text-left">
                            <h1 className="text-xl font-black italic tracking-tighter text-[var(--foreground)] uppercase leading-none">
                                Security <span className="text-neon-blue">Library</span>
                            </h1>
                            <p className="text-[9px] font-bold text-[var(--text-dim)] uppercase tracking-[0.2em] mt-1">Education_Center // ACTIVE</p>
                        </div>
                    </div>

                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" size={14} />
                        <input
                            type="text"
                            placeholder="Find a lesson..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-[var(--background)]/40 border border-[var(--glass-border)] rounded-xl py-2.5 pl-10 pr-4 text-[11px] font-medium outline-none focus:border-neon-blue/50 transition-all placeholder:text-[var(--text-dim)] text-[var(--foreground)]"
                        />
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 w-full h-full">

                {/* 1. Sidebar Explorer 
                    Mobile: Horizontal Scroll
                    Desktop: Vertical Sidebar
                */}
                <aside className="xl:col-span-1 flex flex-row overflow-x-auto xl:flex-col gap-4 xl:gap-0 xl:space-y-6 pb-2 xl:pb-0 scrollbar-hide snap-x">
                    <div className="flex xl:block gap-4 xl:space-y-2 max-h-[none] xl:max-h-[70vh] xl:overflow-y-auto scrollbar-hide w-full">
                        {filteredDossiers.map(d => (
                            <div key={d.id} className="min-w-[280px] xl:min-w-0 snap-center">
                                <NavItem
                                    dossier={d}
                                    active={selectedId === d.id}
                                    onClick={() => setSelectedId(d.id)}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Stats & Metadata - Hidden on mobile to save space */}
                    <div className="hidden xl:block p-6 rounded-3xl bg-[var(--card-bg)] border border-[var(--glass-border)]">
                        <div className="flex items-center gap-2 mb-4">
                            <Layers size={14} className="text-neon-purple" />
                            <span className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest">Archive Metadata</span>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-[11px] font-mono">
                                <span className="text-[var(--text-muted)]">RECORDS_COUNT</span>
                                <span className="text-[var(--foreground)]">{DOSSIERS.length}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] font-mono">
                                <span className="text-[var(--text-muted)]">SECURITY_LEVEL</span>
                                <span className="text-neon-red font-black">UNRESTRICTED</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] font-mono">
                                <span className="text-[var(--text-muted)]">SYNC_STATUS</span>
                                <span className="text-neon-green">REAL_TIME</span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* 2. Content Dossier */}
                <div className="xl:col-span-3">
                    <AnimatePresence mode="wait">
                        <motion.article
                            key={activeDossier.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden"
                        >
                            {/* Decorative Grid Lines */}
                            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(var(--foreground)_1px,transparent_1px),linear-gradient(90deg,var(--foreground)_1px,transparent_1px)] bg-[size:50px_50px]" />

                            <div className="relative z-10">
                                {/* Article Header */}
                                <div className="flex flex-wrap items-center justify-between gap-6 mb-12">
                                    <div className="flex items-center gap-6">
                                        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center border-2 ${activeDossier.severity === 'CRITICAL' ? 'bg-neon-red/10 border-neon-red/40 text-neon-red' : 'bg-neon-blue/10 border-neon-blue/40 text-neon-blue'
                                            }`}>
                                            <Shield size={32} />
                                        </div>
                                        <div>
                                            <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter text-[var(--foreground)] uppercase mb-2 break-words">
                                                {activeDossier.title}
                                            </h2>
                                            <div className="flex gap-3">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">CAT: {activeDossier.category}</span>
                                                <span className="text-[var(--glass-border)]">|</span>
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">CMX: {activeDossier.complexity}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
                                    {/* Left: Mechanism & Lifecycle */}
                                    <div className="space-y-12">
                                        <section>
                                            <SectionHeader title="Mechanism" icon={Server} />
                                            <p className="text-[var(--text-muted)] text-sm leading-relaxed font-medium">
                                                {activeDossier.mechanism}
                                            </p>
                                        </section>

                                        <section>
                                            <SectionHeader title="Attack Lifecycle" icon={Activity} color="text-neon-purple" />
                                            <div className="space-y-6">
                                                {activeDossier.lifecycle.map((step, i) => (
                                                    <div key={i} className="flex gap-4 group">
                                                        <div className="flex flex-col items-center">
                                                            <div className="w-8 h-8 rounded-full bg-[var(--background)]/60 border border-[var(--glass-border)] flex items-center justify-center text-[10px] font-bold text-neon-purple group-hover:border-neon-purple/50 transition-colors">
                                                                0{i + 1}
                                                            </div>
                                                            {i !== activeDossier.lifecycle.length - 1 && (
                                                                <div className="w-px h-full bg-gradient-to-b from-[var(--glass-border)] to-transparent my-1" />
                                                            )}
                                                        </div>
                                                        <div className="pt-1 select-none">
                                                            <p className="text-xs text-[var(--text-muted)] font-medium leading-relaxed group-hover:text-[var(--foreground)] transition-colors">
                                                                {step}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    </div>

                                    {/* Right: Forensics & Mitigation */}
                                    <div className="space-y-12">
                                        <section>
                                            <SectionHeader title="Packet & Log Forensics" icon={Eye} color="text-neon-green" />
                                            <div className="space-y-4">
                                                {activeDossier.forensics.map((f, i) => (
                                                    <div key={i} className="p-5 rounded-2xl bg-[var(--background)]/40 border border-[var(--glass-border)] group hover:border-neon-green/30 transition-all">
                                                        <div className="text-[10px] font-bold text-neon-green uppercase mb-2 flex items-center gap-2">
                                                            <Info size={12} /> {f.title}
                                                        </div>
                                                        <p className="text-xs text-[var(--text-dim)] leading-relaxed italic group-hover:text-[var(--foreground)] transition-colors">
                                                            {f.details}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>

                                        <section>
                                            <SectionHeader title="Layered Mitigation" icon={Shield} color="text-neon-blue" />
                                            <div className="grid grid-cols-1 gap-3">
                                                {activeDossier.mitigation.map((m, i) => (
                                                    <div key={i} className="flex items-center justify-between px-5 py-4 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)]">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-neon-blue" />
                                                            <span className="text-xs font-bold text-[var(--foreground)]">{m.control}</span>
                                                        </div>
                                                        <span className="text-[9px] font-mono text-[var(--text-dim)] uppercase opacity-50">{m.layer}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    </div>
                                </div>

                                {/* Warning / Ethics Footer */}
                                <div className="mt-12 p-8 rounded-3xl bg-neon-red/5 border border-neon-red/10 flex items-start gap-6">
                                    <div className="p-3 rounded-2xl bg-neon-red/10 text-neon-red mt-1">
                                        <AlertCircle size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-neon-red font-black uppercase tracking-widest text-sm mb-2">Ethics & Compliance Protocol</h4>
                                        <p className="text-xs text-[var(--text-dim)] leading-relaxed max-w-3xl">
                                            This dossier is intended for educational and defensive auditing purposes only.
                                            Unauthorized access to computer systems is illegal and violates global cybersecurity ethics.
                                            The data provided here excludes functional payloads to maintain system integrity.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* HUD Scanline Effect */}
                            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[2.5rem]">
                                <div className="w-full h-1 bg-[var(--foreground)]/5 absolute top-0 animate-[scanline_8s_linear_infinite]" />
                            </div>
                        </motion.article>
                    </AnimatePresence>
                </div>
            </div>
        </main>
    );
}

// --- TAILWIND ANIMATIONS (Add to globals.css if needed) ---
// @keyframes scanline { 0% { top: 0% } 100% { top: 100% } }
// @keyframes spin-slow { from { rotate: 0deg } to { rotate: 360deg } }
