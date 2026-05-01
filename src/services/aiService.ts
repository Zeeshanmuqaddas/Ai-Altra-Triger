import { PatientIntake, RiskLevel } from '../types';
import { GoogleGenAI, Type, Schema } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateTriageAnalysis(patient: PatientIntake, isOverride: boolean, currentScore: number, currentLevel: RiskLevel) {
  const fhirSchema = {
    type: Type.OBJECT,
    properties: {
      patient: {
        type: Type.OBJECT,
        properties: {
          age: { type: Type.INTEGER },
          gender: { type: Type.STRING },
          vitals: {
            type: Type.OBJECT,
            properties: {
              heart_rate: { type: Type.NUMBER },
              oxygen_saturation: { type: Type.NUMBER },
              blood_pressure: { type: Type.STRING }
            }
          },
          symptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
          history: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  };

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      fhir_bundle: fhirSchema,
      symptom_analysis: {
        type: Type.OBJECT,
        properties: {
          symptom_map: { type: Type.ARRAY, items: { type: Type.STRING } },
          severity_signals: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      },
      risk_assessment: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.INTEGER },
          level: { type: Type.STRING }
        }
      },
      possible_conditions: { type: Type.ARRAY, items: { type: Type.STRING } },
      hospital_routing: {
        type: Type.OBJECT,
        properties: {
          recommended_facility: { type: Type.STRING },
          urgency: { type: Type.STRING }
        }
      },
      emergency_action: {
        type: Type.OBJECT,
        properties: {
          action: { type: Type.STRING }
        }
      },
      explanation: {
        type: Type.OBJECT,
        properties: {
          reasoning: { type: Type.STRING },
          key_factors: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      },
      medical_warning: { type: Type.STRING }
    },
    required: ["fhir_bundle", "symptom_analysis", "risk_assessment", "possible_conditions", "hospital_routing", "emergency_action", "explanation", "medical_warning"]
  };

  const prompt = `
You are AI Emergency Triage Orchestrator v2, a production-grade multi-agent healthcare decision support system.
Analyze the following patient data.

Patient Intake:
Age: ${patient.age}
Gender: ${patient.gender}
Vitals: HR ${patient.vitals.heartRate ?? 'N/A'}, SpO2 ${patient.vitals.oxygenSaturation ?? 'N/A'}%, BP ${patient.vitals.bloodPressure || 'N/A'}
Symptoms: ${patient.symptoms.join(', ')}
History: ${patient.history || 'None'}

Note: The deterministic risk engine has already evaluated this patient.
Is Critical Override trigger? ${isOverride ? 'YES' : 'NO'}
Base Rule Score: ${currentScore}
Rule Risk Level: ${currentLevel}

If YES to Critical Override, risk level MUST be CRITICAL, action MUST be CALL AMBULANCE IMMEDIATELY and routing EMERGENCY ICU.
Provide clinical reasoning in 3-5 bullets. Ensure no emotional language. Include uncertainty disclaimer for possible conditions.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema
      }
    });

    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Generation Error", error);
    throw error;
  }
}
