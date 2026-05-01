import { PatientIntake, RiskLevel } from '../types';

export function checkCriticalOverride(patient: PatientIntake): boolean {
  if (patient.vitals.oxygenSaturation !== undefined && !isNaN(patient.vitals.oxygenSaturation) && patient.vitals.oxygenSaturation < 90) return true;
  if (patient.symptoms.some(s => s.toLowerCase().includes('severe chest pain'))) return true;
  if (patient.symptoms.some(s => s.toLowerCase().includes('stroke'))) return true;
  if (patient.symptoms.some(s => s.toLowerCase().includes('unconscious'))) return true;
  
  if (patient.vitals.heartRate !== undefined && !isNaN(patient.vitals.heartRate) && patient.vitals.heartRate > 140) {
    if (patient.symptoms.some(s => ['distress', 'shortness of breath', 'pain'].some(w => s.toLowerCase().includes(w)))) return true;
  }
  return false;
}

export function computeBaseScore(patient: PatientIntake): number {
  let score = 0;
  if (patient.age > 50) score += 15;
  if (patient.vitals.heartRate && !isNaN(patient.vitals.heartRate) && patient.vitals.heartRate > 100) score += 20;
  if (patient.vitals.oxygenSaturation !== undefined && !isNaN(patient.vitals.oxygenSaturation) && patient.vitals.oxygenSaturation < 94 && patient.vitals.oxygenSaturation >= 90) score += 30;
  
  const hasChestPain = patient.symptoms.some(s => s.toLowerCase().includes('chest pain'));
  if (hasChestPain) score += 30;
  
  const hasNeuro = patient.symptoms.some(s => ['numbness', 'confusion', 'weakness', 'slurred'].some(w => s.toLowerCase().includes(w)));
  if (hasNeuro) score += 30;
  
  if (patient.symptoms.length > 2) score += 10;
  
  return score;
}

export function evaluateRiskLevel(score: number): RiskLevel {
  if (score >= 70) return 'CRITICAL';
  if (score >= 40) return 'HIGH';
  if (score >= 20) return 'MODERATE';
  return 'LOW';
}
