import React, { useState } from 'react';
import { ProcessingStep } from '../types';
import { processApplication } from '../services/geminiService';
import { getProfile, saveApplication } from '../services/storageService';

interface JobUploaderProps {
  onComplete: () => void;
}

const JobUploader: React.FC<JobUploaderProps> = ({ onComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<ProcessingStep>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleStart = async () => {
    if (!file) return;

    const profile = getProfile();
    if (!profile.name) {
      setError("Please set up your Persona in the Profile tab first.");
      return;
    }

    try {
      setStep('analyzing_image');
      const record = await processApplication(file, profile, (s) => setStep(s as ProcessingStep));
      saveApplication(record);
      setStep('complete');
      setTimeout(onComplete, 1500); // Wait a bit before redirecting
    } catch (err: any) {
      console.error(err);
      setError("Analysis failed. Please try again. Ensure your API Key is valid.");
      setStep('error');
    }
  };

  const getStepStatus = (current: ProcessingStep, target: ProcessingStep, label: string) => {
    const stepsOrder: ProcessingStep[] = ['idle', 'analyzing_image', 'generating_resume', 'generating_cl', 'generating_emails', 'generating_dm', 'calculating_metrics', 'complete'];
    const currentIndex = stepsOrder.indexOf(current);
    const targetIndex = stepsOrder.indexOf(target);

    if (current === 'error') return <div className="text-gray-400">{label}</div>;

    if (currentIndex > targetIndex) {
      return (
        <div className="flex items-center text-green-600">
           <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
           {label}
        </div>
      );
    }
    if (currentIndex === targetIndex) {
      return (
        <div className="flex items-center text-indigo-600 font-bold animate-pulse">
           <svg className="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
           {label}
        </div>
      );
    }
    return <div className="text-gray-400 pl-7">{label}</div>;
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg border border-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">New Application Agent</h2>
      
      {step === 'idle' || step === 'error' ? (
        <div className="space-y-6">
           <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-indigo-500 transition-colors">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                className="hidden" 
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                <span className="text-lg font-medium text-gray-600">
                  {file ? file.name : "Click to upload JD Screenshot"}
                </span>
                <span className="text-sm text-gray-500 mt-1">Supports PNG, JPG</span>
              </label>
           </div>
           
           {error && (
             <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm text-center">
               {error}
             </div>
           )}

           <button
             onClick={handleStart}
             disabled={!file}
             className={`w-full py-3 rounded-md text-white font-medium text-lg transition-colors ${
               file ? 'bg-indigo-600 hover:bg-indigo-700 shadow-md' : 'bg-gray-300 cursor-not-allowed'
             }`}
           >
             Analyze & Generate Documents
           </button>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">
             Ramon is working on your application...
          </h3>
          <div className="bg-gray-50 rounded-lg p-6 space-y-3 border border-gray-200">
            {getStepStatus(step, 'analyzing_image', 'Reading Job Description...')}
            {getStepStatus(step, 'generating_resume', 'Drafting Tailored Resume...')}
            {getStepStatus(step, 'generating_cl', 'Writing Cover Letter...')}
            {getStepStatus(step, 'generating_emails', 'Drafting Emails to Recruiter & HM...')}
            {getStepStatus(step, 'generating_dm', 'Composing LinkedIn Message...')}
            {getStepStatus(step, 'calculating_metrics', 'Calculating Match Score & Dashboard Data...')}
          </div>
          {step === 'complete' && (
            <div className="text-center text-green-600 font-bold mt-4 animate-bounce">
              All Done! Redirecting to Dashboard...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JobUploader;
