import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, User, HeartPulse, Brain, Cross, Hospital, FileJson, ArrowRight } from 'lucide-react';
import { checkCriticalOverride, computeBaseScore, evaluateRiskLevel } from './lib/triage-engine';
import { generateTriageAnalysis } from './services/aiService';
import { PatientIntake, RiskLevel } from './types';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [patient, setPatient] = useState<PatientIntake>({
    age: 45,
    gender: 'Male',
    vitals: { heartRate: 85, oxygenSaturation: 98, bloodPressure: '120/80' },
    symptoms: [],
    history: ''
  });

  const [symptomInput, setSymptomInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localRisk, setLocalRisk] = useState<{ isOverride: boolean, score: number, level: RiskLevel } | null>(null);
  const [aiResult, setAiResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);

  const addSymptom = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && symptomInput.trim()) {
      e.preventDefault();
      const newSymptoms = symptomInput.split(',').map(s => s.trim()).filter(Boolean);
      setPatient(p => ({ ...p, symptoms: [...p.symptoms, ...newSymptoms] }));
      setSymptomInput('');
    }
  };

  const removeSymptom = (index: number) => {
    setPatient(p => ({ ...p, symptoms: p.symptoms.filter((_, i) => i !== index) }));
  };

  const runTriage = async () => {
    setIsLoading(true);
    setError(null);
    setAiResult(null);
    try {
      const isOverride = checkCriticalOverride(patient);
      const score = computeBaseScore(patient);
      const level = isOverride ? 'CRITICAL' : evaluateRiskLevel(score);
      setLocalRisk({ isOverride, score, level });
      
      const result = await generateTriageAnalysis(patient, isOverride, score, level);
      setAiResult(result);
    } catch (err: any) {
      setError(err.message || 'Failed to run triage analysis.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111111] text-[#E4E3E0] font-sans">
      <header className="border-b border-[#333] bg-[#161616] p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-emerald-400" />
          <h1 className="text-xl font-bold tracking-tight">AI EMERGENCY TRIAGE <span className="text-[#888] font-mono text-sm ml-2">v2.0</span></h1>
        </div>
        <div className="text-xs font-mono px-3 py-1 bg-[#222] rounded border border-[#333] text-[#888]">
          SYSTEM STATUS: ONLINE
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* INTAKE FORM */}
        <section className="lg:col-span-4 space-y-6">
          <div className="border border-[#333] bg-[#1A1A1A] rounded-lg overflow-hidden">
            <div className="bg-[#222] border-b border-[#333] px-4 py-3 font-mono text-xs uppercase tracking-wider text-[#888] flex items-center gap-2">
              <User className="w-4 h-4" /> Patient Intake
            </div>
            
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase text-[#666]">Age</label>
                  <input type="number" 
                    value={patient.age || ''} 
                    onChange={e => setPatient({ ...patient, age: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[#111] border border-[#333] p-2 text-sm rounded focus:border-emerald-500 outline-none transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase text-[#666]">Gender</label>
                  <select 
                    value={patient.gender} 
                    onChange={e => setPatient({ ...patient, gender: e.target.value })}
                    className="w-full bg-[#111] border border-[#333] p-2 text-sm rounded focus:border-emerald-500 outline-none transition-colors">
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div className="p-4 border border-[#333] bg-[#141414] rounded space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <HeartPulse className="w-4 h-4 text-[#888]" />
                  <span className="text-xs font-mono text-[#888] uppercase">Vitals</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-[#666]">HR (bpm)</label>
                    <input type="number" 
                      value={patient.vitals.heartRate || ''} 
                      onChange={e => setPatient({ ...patient, vitals: { ...patient.vitals, heartRate: parseInt(e.target.value) || undefined } })}
                      className="w-full bg-[#111] border border-[#333] px-2 py-1.5 text-sm rounded focus:border-emerald-500 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-[#666]">SpO2 (%)</label>
                    <input type="number" 
                      value={patient.vitals.oxygenSaturation || ''} 
                      onChange={e => setPatient({ ...patient, vitals: { ...patient.vitals, oxygenSaturation: parseInt(e.target.value) || undefined } })}
                      className="w-full bg-[#111] border border-[#333] px-2 py-1.5 text-sm rounded focus:border-emerald-500 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-[#666]">BP</label>
                    <input type="text" placeholder="120/80"
                      value={patient.vitals.bloodPressure || ''} 
                      onChange={e => setPatient({ ...patient, vitals: { ...patient.vitals, bloodPressure: e.target.value } })}
                      className="w-full bg-[#111] border border-[#333] px-2 py-1.5 text-sm rounded focus:border-emerald-500 outline-none" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase text-[#666]">Symptoms (Press Enter & comma separated)</label>
                <div className="w-full bg-[#111] border border-[#333] rounded p-2 focus-within:border-emerald-500 transition-colors flex flex-wrap gap-2">
                  {patient.symptoms.map((s, i) => (
                    <span key={i} className="px-2 py-1 bg-[#222] text-xs border border-[#444] rounded-md flex items-center gap-1">
                      {s} <button onClick={() => removeSymptom(i)} className="text-[#888] hover:text-white">&times;</button>
                    </span>
                  ))}
                  <input type="text" 
                    value={symptomInput}
                    onChange={e => setSymptomInput(e.target.value)}
                    onKeyDown={addSymptom}
                    className="flex-1 bg-transparent min-w-[120px] outline-none text-sm placeholder:text-[#555]" placeholder="Type symptom..." />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase text-[#666]">Medical History</label>
                <textarea 
                  value={patient.history}
                  onChange={e => setPatient({ ...patient, history: e.target.value })}
                  className="w-full bg-[#111] border border-[#333] p-2 text-sm rounded h-24 focus:border-emerald-500 outline-none resize-none" placeholder="Past conditions..." />
              </div>

              <button 
                onClick={runTriage}
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded uppercase tracking-wider text-sm transition-colors flex items-center justify-center gap-2">
                {isLoading ? <span className="animate-pulse">Processing...</span> : <><Brain className="w-4 h-4" /> Run AI Triage</>}
              </button>
            </div>
          </div>
        </section>

        {/* RESULTS PANEL */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          {error && (
             <div className="bg-red-950/40 border border-red-900/50 p-4 rounded text-red-400 text-sm flex items-center gap-2">
               <AlertTriangle className="w-4 h-4" /> {error}
             </div>
          )}

          {!aiResult && !isLoading && !error && (
            <div className="h-full border border-dashed border-[#333] rounded-lg flex flex-col items-center justify-center text-[#555] p-12 text-center min-h-[400px]">
              <Activity className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-mono text-sm uppercase tracking-widest">Awaiting Patient Data</p>
              <p className="mt-2 text-xs max-w-sm">Enter vitals and symptoms to initiate multi-agent risk analysis and FHIR structurization.</p>
            </div>
          )}

          {isLoading && !aiResult && (
            <div className="h-full border border-dashed border-emerald-900/30 rounded-lg flex flex-col items-center justify-center text-emerald-500/50 p-12 min-h-[400px]">
              <div className="animate-spin mb-4 border-2 border-emerald-500/20 border-t-emerald-500/80 rounded-full w-8 h-8"></div>
              <p className="font-mono text-xs uppercase tracking-widest animate-pulse">Running Multi-Agent Workflows...</p>
            </div>
          )}

          {aiResult && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-300">
              {/* PRIMARY RISK CARD */}
              <div className={cn(
                "col-span-full border rounded-lg p-6 relative overflow-hidden",
                aiResult.risk_assessment?.level === 'CRITICAL' ? 'bg-red-950/20 border-red-900/50' :
                aiResult.risk_assessment?.level === 'HIGH' ? 'bg-orange-950/20 border-orange-900/50' :
                aiResult.risk_assessment?.level === 'MODERATE' ? 'bg-amber-950/20 border-amber-900/50' :
                'bg-emerald-950/20 border-emerald-900/50'
              )}>
                {localRisk?.isOverride && (
                  <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold px-3 py-1 uppercase tracking-widest rounded-bl-lg">
                    Safety Override Engaged
                  </div>
                )}
                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start justify-between">
                  <div>
                    <h2 className="text-xs font-mono uppercase tracking-widest text-[#888] mb-1">Assessed Risk Level</h2>
                    <div className={cn(
                      "text-5xl font-bold font-mono tracking-tighter mb-4",
                      aiResult.risk_assessment?.level === 'CRITICAL' ? 'text-red-500' :
                      aiResult.risk_assessment?.level === 'HIGH' ? 'text-orange-500' :
                      aiResult.risk_assessment?.level === 'MODERATE' ? 'text-amber-500' :
                      'text-emerald-500'
                    )}>
                      {aiResult.risk_assessment?.level || 'UNKNOWN'}
                    </div>
                    {aiResult.emergency_action?.action && (
                      <div className="inline-flex items-center gap-2 bg-[#1A1A1A] border border-[#333] px-4 py-2 rounded-full text-sm font-semibold">
                        <AlertTriangle className={cn("w-4 h-4", aiResult.risk_assessment?.level === 'CRITICAL' ? 'text-red-500' : 'text-emerald-500')} />
                        {aiResult.emergency_action.action}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-center bg-[#111] border border-[#222] rounded-full w-32 h-32 flex flex-col items-center justify-center shadow-inner">
                    <span className="text-3xl font-mono">{aiResult.risk_assessment?.score ?? '--'}</span>
                    <span className="text-[10px] font-mono uppercase text-[#666] tracking-widest">Risk Score</span>
                  </div>
                </div>
              </div>

              {/* HOSPITAL ROUTING */}
              <div className="border border-[#333] bg-[#1A1A1A] rounded-lg p-5">
                 <h3 className="text-xs font-mono uppercase tracking-widest text-[#888] mb-4 flex items-center gap-2">
                   <Hospital className="w-4 h-4" /> Routing Optimization
                 </h3>
                 <div className="space-y-4">
                   <div>
                     <p className="text-[10px] uppercase text-[#666] mb-1">Recommended Facility</p>
                     <p className="font-semibold text-lg">{aiResult.hospital_routing?.recommended_facility}</p>
                   </div>
                   <div>
                     <p className="text-[10px] uppercase text-[#666] mb-1">Urgency</p>
                     <p className="text-sm font-mono text-gray-300">{aiResult.hospital_routing?.urgency}</p>
                   </div>
                 </div>
              </div>

              {/* CONDITIONS */}
              <div className="border border-[#333] bg-[#1A1A1A] rounded-lg p-5">
                 <h3 className="text-xs font-mono uppercase tracking-widest text-[#888] mb-4 flex items-center gap-2">
                   <Brain className="w-4 h-4" /> Diagnostic Reasoning
                 </h3>
                 <ul className="space-y-3">
                   {aiResult.possible_conditions?.map((c: string, i: number) => (
                     <li key={i} className="flex gap-3 text-sm px-3 py-2 bg-[#111] border border-[#222] rounded">
                       <span className="text-[#555] font-mono">0{i+1}</span>
                       <span>{c}</span>
                     </li>
                   ))}
                 </ul>
                 <p className="text-[10px] text-[#666] mt-4 italic">
                   {aiResult.medical_warning}
                 </p>
              </div>

              {/* EXPLANATION */}
              <div className="col-span-full border border-[#333] bg-[#1A1A1A] rounded-lg p-5">
                 <h3 className="text-xs font-mono uppercase tracking-widest text-[#888] mb-4 flex items-center gap-2">
                   <Cross className="w-4 h-4" /> Clinical Explanation
                 </h3>
                 <p className="text-sm text-gray-300 leading-relaxed mb-4">{aiResult.explanation?.reasoning}</p>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                   {aiResult.explanation?.key_factors?.map((f: string, i: number) => (
                     <div key={i} className="flex items-start gap-2 text-sm text-gray-400">
                       <ArrowRight className="w-4 h-4 text-[#555] mt-0.5 shrink-0" />
                       <span>{f}</span>
                     </div>
                   ))}
                 </div>
              </div>

              {/* DEVELOPER TOGGLE */}
              <div className="col-span-full">
                <button onClick={() => setShowJson(!showJson)} className="text-xs font-mono text-[#666] hover:text-[#aaa] flex items-center gap-2">
                  <FileJson className="w-4 h-4" /> {showJson ? 'Hide' : 'Show'} Agent Output Schema
                </button>
                {showJson && (
                  <pre className="mt-4 p-4 bg-[#0a0a0a] border border-[#222] rounded-lg overflow-x-auto text-[11px] font-mono text-emerald-500/80">
                    {JSON.stringify(aiResult, null, 2)}
                  </pre>
                )}
              </div>

            </div>
          )}

        </section>
      </main>
    </div>
  );
}

