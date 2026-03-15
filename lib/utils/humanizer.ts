/**
 * Utility to simplify technical cybersecurity headlines for non-technical users.
 */
const glossary: Record<string, string> = {
    'APT group': 'State-sponsored hackers',
    'APT': 'Advanced hackers',
    'modular malware framework': 'malware toolkit',
    'telecom infrastructure': 'phone and internet networks',
    'zero-day': 'previously unknown',
    'vulnerability': 'security flaw',
    'vulnerabilities': 'security flaws',
    'exploit': 'attack',
    'exploits': 'attacks',
    'ransomware': 'data-locking virus',
    'phishing': 'scam',
    'spear-phishing': 'targeted scam',
    'credential harvesting': 'password stealing',
    'exfiltrating': 'stealing',
    'exfiltrated': 'stole',
    'lateral movement': 'spreading through the network',
    'RCE': 'remote control flaw',
    'Privilege Escalation': 'taking control of admin accounts',
    'DDoS': 'service disruption attack',
    'botnet': 'network of hijacked devices',
    'backdoor': 'secret entry point',
    'C2 server': 'hacker control center',
    'Command and Control': 'hacker control',
    'supply chain attack': 'software provider attack',
    'malicious actor': 'hacker',
    'threat actor': 'hacker',
    'adversary': 'attacker',
};

export function humanizeHeadline(text: string): string {
    let simplified = text;

    // Sort keys by length descending to match longer phrases first
    const sortedKeys = Object.keys(glossary).sort((a, b) => b.length - a.length);

    for (const term of sortedKeys) {
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        simplified = simplified.replace(regex, glossary[term]);
    }

    // Capitalize first letter if it's not already
    return simplified.charAt(0).toUpperCase() + simplified.slice(1);
}
