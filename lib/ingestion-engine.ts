import { Threat } from './types';
import ThreatModel from './models/Threat';
import dbConnect from './db';

const NEWS_API_KEY = process.env.NEWS_API_KEY;

export async function ingestCISAThreats() {
    try {
        await dbConnect();

        const url = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';
        const response = await fetch(url);
        if (!response.ok) throw new Error('CISA KEV request failed');

        const data = await response.json();
        const vulnerabilities = data.vulnerabilities || [];

        // We'll take the 20 most recent ones to keep it manageable
        const recentVulnerabilities = vulnerabilities.slice(-20).reverse();

        let ingestedCount = 0;

        for (const v of recentVulnerabilities) {
            const originalId = `CISA-${v.cveID}`;

            // Check if already exists
            const existing = await ThreatModel.findOne({ originalId });
            if (existing) continue;

            const newThreat = {
                id: v.cveID,
                title: simplifyTitle(v.vulnerabilityName),
                description: v.shortDescription || `Vulnerability in ${v.product} ${v.vendorProject}. ${v.requiredAction}`,
                severity: determineCISASeverity(v),
                imageUrl: '/images/threat-cisa.png',
                source: 'CISA KEV',
                referenceLink: `https://nvd.nist.gov/vuln/detail/${v.cveID}`,
                timestamp: v.dateAdded, // Use the real historical date
                affectedSystems: [v.product, v.vendorProject],
                prevention: [
                    { title: 'Required Action', description: v.requiredAction },
                    { title: 'Patch Management', description: 'Apply the latest security updates from the vendor immediately.' }
                ],
                recoverySteps: [
                    { title: 'Incident Response', description: 'Consult the NVD advisory for specific mitigation steps and IOCs.' }
                ],
                confidenceScore: generateStableScore(originalId),
                sourceType: 'portal',
                originalId: originalId
            };

            await ThreatModel.create(newThreat);
            ingestedCount++;
        }

        return ingestedCount;

    } catch (error) {
        console.error('CISA Ingestion Error:', error);
        return 0;
    }
}

export async function ingestMediaNews() {
    try {
        await dbConnect();

        const newsSources = [
            { name: 'GBHackers', rss: 'https://gbhackers.com/feed/' },
            { name: 'The Cyber Express', rss: 'https://thecyberexpress.com/feed/' },
            { name: 'Cybersecurity News', rss: 'https://cybersecuritynews.com/feed/' },
            { name: 'HackRead', rss: 'https://hackread.com/feed/' },
            { name: 'Cybersecurity Dive', rss: 'https://www.cybersecuritydive.com/feeds/news/' },
            { name: 'Cyberscoop', rss: 'https://cyberscoop.com/feed/' },
            { name: 'BleepingComputer', rss: 'https://www.bleepingcomputer.com/feed/' },
            { name: 'SecurityWeek', rss: 'https://www.securityweek.com/feed/' }
        ];

        let allItems: any[] = [];

        for (const source of newsSources) {
            try {
                const rssUrl = encodeURIComponent(source.rss);
                const url = `https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}&api_key=${NEWS_API_KEY || ''}`;

                const response = await fetch(url);
                if (!response.ok) continue;

                const data = await response.json();
                if (data.status !== 'ok') continue;

                const processedItems = data.items.map((item: any) => ({
                    ...item,
                    sourceName: source.name,
                    normalizedTitle: item.title.toLowerCase().replace(/[^a-z0-9]/g, '')
                }));

                allItems = [...allItems, ...processedItems];
            } catch (err) {
                console.error(`Failed to fetch from ${source.name}:`, err);
            }
        }

        // De-duplication Logic: Keep the one with the most data (longest description)
        const uniqueItemsMap = new Map<string, any>();

        for (const item of allItems) {
            const existing = uniqueItemsMap.get(item.normalizedTitle);
            if (!existing || item.description.length > existing.description.length) {
                uniqueItemsMap.set(item.normalizedTitle, item);
            }
        }

        const filteredItems = Array.from(uniqueItemsMap.values());
        let ingestedCount = 0;

        for (const item of filteredItems) {
            const originalId = `NEWS-${item.guid || item.link}`;

            // Check if already exists
            const existing = await ThreatModel.findOne({ originalId });
            if (existing) continue;

            // Extract Image - Improved Logic
            let imageUrl = item.thumbnail || '/images/threat-news.png';

            // 1. Try enclosure
            if (item.enclosure && item.enclosure.link && item.enclosure.type?.includes('image')) {
                imageUrl = item.enclosure.link;
            }
            // 2. Try parsing description/content for <img> tags
            else if (!item.thumbnail) {
                const imgMatch = (item.description + (item.content || '')).match(/<img[^>]+src="([^">]+)"/);
                if (imgMatch && imgMatch[1]) {
                    imageUrl = imgMatch[1];
                }
            }

            const isIncident = (item.title + item.description).toLowerCase().match(/breach|attack|incident|hacked|stolen|leak|exposed/);
            const severity = determineNewsSeverity(item);
            const isHighlighted = severity === 'critical';

            const newThreat = {
                id: `NEWS-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                title: simplifyTitle(item.title),
                description: item.description.replace(/<[^>]*>?/gm, '').substring(0, 300) + '...',
                severity: severity,
                isHighlighted: isHighlighted,
                imageUrl: imageUrl,
                source: item.sourceName,
                referenceLink: item.link,
                timestamp: item.pubDate,
                affectedSystems: ['General Systems', 'Web Infrastructure'],
                // If it's a breach/attack, we show Causes/Risks instead of Prevention/Recovery
                prevention: (isIncident || severity === 'low') ? [] : [
                    { title: 'Awareness', description: 'Monitor the linked report for specific technical details and IOCs.' },
                    { title: 'Policy Update', description: 'Update security policies if the threat applies to your environment.' }
                ],
                recoverySteps: (isIncident || severity === 'low') ? [] : [
                    { title: 'Review Logs', description: 'Analyze organizational logs for indicators of compromise mentioned in the report.' }
                ],
                causes: isIncident ? [
                    { title: 'Entry Vector', description: 'Likely exploited a vulnerability or used stolen credentials as an entry point.' },
                    { title: 'Infrastructure Weakness', description: 'Could be due to unpatched systems or misconfigured cloud security.' }
                ] : [],
                risks: isIncident ? [
                    { title: 'Data Exposure', description: 'Sensitive company or user information might be traded on underground forums.' },
                    { title: 'Operational Impact', description: 'Potential downtime or reputational damage resulting from the public disclosure.' }
                ] : [],
                confidenceScore: generateStableScore(originalId),
                sourceType: 'news',
                originalId: originalId
            };

            await ThreatModel.create(newThreat);
            ingestedCount++;
        }

        return ingestedCount;
    } catch (error) {
        console.error('Media News Ingestion Error:', error);
        return 0;
    }
}

export function determineNewsSeverity(item: any): 'low' | 'medium' | 'high' | 'critical' {
    const text = (item.title + item.description).toLowerCase();

    // Critical: Devastating impact or active exploitation of zero-days
    if (text.includes('ransomware') || text.includes('zero-day') || text.includes('0-day') ||
        text.includes('state-sponsored') || text.includes('apt') || text.includes('critical infrastructure')) {
        return 'critical';
    }

    // High: Direct attacks, significant leaks, or major vulnerabilities
    if (text.includes('breach') || text.includes('cyberattack') || text.includes('exploit') ||
        text.includes('malware') || text.includes('vulnerability') || text.includes('hacked')) {
        return 'high';
    }

    // Medium: Phishing, minor leaks, or generic security warnings
    if (text.includes('phishing') || text.includes('leak') || text.includes('scam') ||
        text.includes('exposed') || text.includes('alert') || text.includes('update')) {
        return 'medium';
    }

    // Low: Best practices, research, or patch announcements
    return 'low';
}

export function determineCISASeverity(v: any): 'low' | 'medium' | 'high' | 'critical' {
    const text = (v.vulnerabilityName + v.shortDescription).toLowerCase();

    // Remote Code Execution is always top priority
    if (text.includes('remote code execution') || text.includes('rce') || text.includes('critical')) return 'critical';

    // Privilege escalation or direct data destruction
    if (text.includes('privilege escalation') || text.includes('overwrite') || text.includes('bypass')) return 'high';

    // DoS or general info leaks are significant but often less critical than RCE
    if (text.includes('denial of service') || text.includes('dos') || text.includes('information disclosure')) return 'medium';

    return 'low';
}

function simplifyTitle(title: string): string {
    let simple = title;

    // Remove common technical prefixes like "CISA Adds One Known Exploited Vulnerability to Catalog"
    simple = simple.replace(/CISA Adds .* Vulnerability to Catalog/i, '').trim();

    // Remove CVE numbers from titles to keep them clean
    simple = simple.replace(/CVE-\d{4}-\d{4,7}/g, '').trim();

    // Map technical terms to simpler ones
    const mappings: Record<string, string> = {
        'Remote Code Execution': 'Full Control Risk',
        'RCE': 'Full Control Risk',
        'Privilege Escalation': 'Unauthorized Access',
        'Escalation of Privilege': 'Unauthorized Access',
        'Buffer Overflow': 'Memory System Error',
        'SQL Injection': 'Database Takeover',
        'Cross-Site Scripting': 'Web Identity Risk',
        'XSS': 'Web Identity Risk',
        'Information Disclosure': 'Data Leak Risk',
        'Denial of Service': 'System Shutdown Risk',
        'DoS': 'System Shutdown Risk',
        'Path Traversal': 'Folder Access Risk',
        'Zero-Day': 'New Unpatched Threat',
        'Vulnerability': 'Security Flaw',
        'Vulnerabilities': 'Security Flaws',
        'Arbitrary File Read': 'File Theft Risk',
        'Command Injection': 'System Command Risk'
    };

    // Apply mappings (case-insensitive)
    Object.entries(mappings).forEach(([tech, simpleTerm]) => {
        const regex = new RegExp(tech, 'gi');
        simple = simple.replace(regex, simpleTerm);
    });

    // Final cleanup
    simple = simple.replace(/\s+/g, ' ').trim();

    // Capitalize first letter
    if (simple.length > 0) {
        simple = simple.charAt(0).toUpperCase() + simple.slice(1);
    }

    // If title becomes empty or just noise, return original (truncated)
    if (simple.length < 5) return title.length > 50 ? title.substring(0, 47) + '...' : title;

    return simple;
}

function generateStableScore(id: string): number {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        const char = id.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }

    // Map hash to a number between 94.0 and 99.5
    const absHash = Math.abs(hash);
    const score = 94 + (absHash % 56) / 10;
    return parseFloat(score.toFixed(1));
}
