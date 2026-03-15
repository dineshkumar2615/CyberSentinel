export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface PreventionStep {
  title: string;
  description: string;
}

export interface Threat {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  imageUrl: string; // We'll mock this with images or generated gradients
  source: string; // e.g. "DarkWeb Monitor", "CISA Feed"
  referenceLink?: string; // URL to original source
  timestamp: string; // ISO date
  prevention: PreventionStep[];
  recoverySteps: PreventionStep[]; // Steps to take if already affected
  causes?: PreventionStep[]; // Potential causes for breaches/incidents
  risks?: PreventionStep[]; // Potential risks for breaches/incidents
  affectedSystems: string[]; // e.g. "Windows", "iOS", "Chrome"
  usefulVotes?: number; // Count of users who found this helpful
  confidenceScore?: number; // Deterministic AI confidence score
  sourceType?: 'mock' | 'news' | 'twitter' | 'alienvault' | 'portal';
  originalId?: string;
  isHighlighted?: boolean;
  isHidden?: boolean;
}

