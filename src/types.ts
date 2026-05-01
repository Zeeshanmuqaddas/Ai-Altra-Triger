export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface Vitals {
  heartRate: number;
  oxygenSaturation: number; // SpO2 %
  bloodPressure: string; // e.g., "120/80"
}

export interface PatientIntake {
  age: number;
  gender: string;
  vitals: Partial<Vitals>;
  symptoms: string[];
  history: string;
}

export interface RiskAssessment {
  score: number;
  level: RiskLevel;
}

export interface Explanation {
  reasoning: string;
  keyFactors: string[];
}

export interface HospitalRouting {
  recommendedFacility: string;
  urgency: string;
}

export interface TriageResponse {
  fhirBundle: any;
  symptomAnalysis: any;
  riskAssessment: RiskAssessment;
  possibleConditions: string[];
  hospitalRouting: HospitalRouting;
  emergencyAction: { action: string };
  explanation: Explanation;
  medicalWarning: string;
}
