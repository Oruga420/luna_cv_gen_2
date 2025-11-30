export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  website: string;
  github: string;
  extraInfo: string;
}

export interface MatchMetrics {
  skillsMatch: number; // Max 60
  roleSimilarities: number; // Max 20
  remotePolicy: number; // Max 10 (Remote 10, Hybrid 5, Onsite 0)
  rndFocus: number; // Max 10 (More R&D than Dev)
  startupBonus: number; // Max 5
  automationBonus: number; // Max 10
  totalScore: number;
}

export interface ApplicationArtifacts {
  resumeJson: string; // JSON string
  resumeDoc: string; // Markdown/Text content of the resume
  coverLetter: string;
  recruiterEmail: string;
  hmEmail: string;
  dmMessage: string;
}

export interface ApplicationRecord {
  id: string;
  companyName: string;
  jobSummary: string;
  dateCreated: string; // ISO string
  status: 'Draft' | 'Applied' | 'Interviewing' | 'Rejected' | 'Offer';
  metrics: MatchMetrics;
  artifacts: ApplicationArtifacts;
}

export type ProcessingStep = 
  | 'idle' 
  | 'analyzing_image' 
  | 'generating_resume' 
  | 'generating_cl' 
  | 'generating_emails' 
  | 'generating_dm' 
  | 'calculating_metrics' 
  | 'complete' 
  | 'error';