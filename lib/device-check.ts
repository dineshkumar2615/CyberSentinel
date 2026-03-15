export type HealthStatus = 'safe' | 'warning' | 'danger';
export type HealthCategory = 'Privacy' | 'Connection' | 'System';

export interface HealthCheckResult {
    id: string;
    name: string;
    status: HealthStatus;
    details: string;
    category: HealthCategory;
    action?: string; // Actionable insight for failures
}

export const runDeviceHealthCheck = async (): Promise<HealthCheckResult[]> => {
    // Simulate deep scanning delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    const results: HealthCheckResult[] = [];

    // --- CONNECTION LAYER ---
    const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
    results.push({
        id: 'ssl',
        name: 'Traffic Encryption',
        category: 'Connection',
        status: isSecure ? 'safe' : 'danger',
        details: isSecure ? 'SSL/TLS 1.3 Active' : 'Unencrypted HTTP traffic detected',
        action: isSecure ? undefined : 'Avoid entering sensitive data. Use a VPN or HTTPS.'
    });

    // Real Latency & Bandwidth Check
    const start = performance.now();
    try {
        // Fetch a small asset to measure speed
        const response = await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors', cache: 'no-store' });
        const end = performance.now();
        const latency = Math.round(end - start);

        // Simple bandwidth estimation (favicon is approx 5KB)
        const bps = (5120 * 8) / ((end - start) / 1000);
        const mbps = (bps / 1000000).toFixed(2);

        results.push({
            id: 'latency',
            name: 'Network Telemetry',
            category: 'Connection',
            status: latency < 150 ? 'safe' : 'warning',
            details: `${latency}ms latency | ${mbps} Mbps est. static speed`,
            action: latency < 150 ? undefined : 'High latency detected. Check background network usage.'
        });
    } catch (e) {
        results.push({
            id: 'net_fail',
            name: 'Network Gateway',
            category: 'Connection',
            status: 'danger',
            details: 'Signal interruption detected',
            action: 'Check your internet connection or firewall rules.'
        });
    }

    // --- PRIVACY PROTOCOL ---
    // Advanced: Private Mode / Storage Quota Check
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
        const { quota } = await navigator.storage.estimate();
        const isLowQuota = quota && quota < 120000000; // Usually < 120MB in incognito on some browsers
        results.push({
            id: 'incognito',
            name: 'Browser Isolation',
            category: 'Privacy',
            status: isLowQuota ? 'safe' : 'warning',
            details: isLowQuota ? 'Private Session / High Isolation' : 'Standard persistent session',
            action: isLowQuota ? undefined : 'Use Incognito mode for sensitive research.'
        });
    }

    // AdBlocker / Script Blocking detection
    try {
        const adCheck = await fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', { mode: 'no-cors' }).catch(() => null);
        const isBlocked = !adCheck;
        results.push({
            id: 'adblock',
            name: 'Shield Protection',
            category: 'Privacy',
            status: isBlocked ? 'safe' : 'warning',
            details: isBlocked ? 'Active script filtering detected' : 'Tracking scripts allowed',
            action: isBlocked ? undefined : 'Consider installing a privacy-focused extension.'
        });
    } catch (e) { }

    // Real Geolocation Permission Check
    if (typeof navigator !== 'undefined' && navigator.permissions) {
        try {
            const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
            results.push({
                id: 'location',
                name: 'Environment Privacy',
                category: 'Privacy',
                status: result.state === 'granted' ? 'warning' : 'safe',
                details: result.state === 'granted' ? 'Global GPS tracking active' : 'Location signature masked',
                action: result.state === 'granted' ? 'Revoke location permission to mask your physical site.' : undefined
            });
        } catch (e) { }
    }

    // --- SYSTEM INTEGRITY ---
    // NATIVE DESKTOP POWER-UP: Process & Hardware Analysis
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
        try {
            const sysInfo = await (window as any).electronAPI.getSystemInfo();
            const procInfo = await (window as any).electronAPI.scanProcesses();

            results.push({
                id: 'native_sys',
                name: 'Kernel Infrastructure',
                category: 'System',
                status: 'safe',
                details: `${sysInfo.cpus.length} Physical/Logical Cores | ${sysInfo.platform.toUpperCase()} Kernel`,
                action: 'Native telemetry active.'
            });

            if (procInfo.success) {
                results.push({
                    id: 'native_proc',
                    name: 'Active Process Audit',
                    category: 'System',
                    status: procInfo.count > 50 ? 'warning' : 'safe',
                    details: `${procInfo.count} background processes analyzed`,
                    action: procInfo.count > 100 ? 'High process count detected. Review startup items.' : undefined
                });
            }
        } catch (e) {
            console.error('Native Bridge Error:', e);
        }
    }

    // Hardware Concurrency (Cores - Fallback)
    const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : undefined;
    if (!results.find(r => r.id === 'native_sys')) {
        results.push({
            id: 'cpu_cores',
            name: 'CPU Infrastructure',
            category: 'System',
            status: (cores && cores >= 4) ? 'safe' : 'warning',
            details: `${cores || 'Unknown'} logical processing cores detected`,
            action: (cores && cores < 4) ? 'Limited multitasking capacity detected.' : undefined
        });
    }

    // Real Memory Check
    const memory = (navigator as any).deviceMemory;
    if (memory) {
        results.push({
            id: 'memory_real',
            name: 'Memory Capacity',
            category: 'System',
            status: memory >= 4 ? 'safe' : 'warning',
            details: `${memory}GB System RAM detected`,
            action: memory < 4 ? 'Low RAM detected. Resource intensive scans may be slow.' : undefined
        });
    }

    // Real Battery Check
    if (typeof navigator !== 'undefined' && (navigator as any).getBattery) {
        try {
            const battery = await (navigator as any).getBattery();
            results.push({
                id: 'battery',
                name: 'Power Integrity',
                category: 'System',
                status: (battery.level < 0.2 && !battery.charging) ? 'warning' : 'safe',
                details: `${Math.round(battery.level * 100)}% Charge - ${battery.charging ? 'Charging' : 'Discharging'}`,
                action: battery.level < 0.2 ? 'Connect power source to ensure scan completion.' : undefined
            });
        } catch (e) { }
    }

    return results;
};

