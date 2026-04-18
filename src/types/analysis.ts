export type RiskSeverity = "low" | "medium" | "high";

export interface KeyFact {
  label: string;
  value: string;
}

export interface Risk {
  title: string;
  severity: RiskSeverity;
  quote: string;
  explanation: string;
}

export interface Right {
  title: string;
  explanation: string;
}

export interface DraftResponse {
  applicable: boolean;
  subject: string;
  body: string;
}

export interface LegalAnalysis {
  documentType: string;
  severity: RiskSeverity;
  urgencySummary: string;
  plainSummary: string;
  keyFacts: KeyFact[];
  risks: Risk[];
  rights: Right[];
  nextSteps: string[];
  draftResponse: DraftResponse;
  disclaimer: string;
}
