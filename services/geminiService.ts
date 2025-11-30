import { GoogleGenAI, Chat, Schema, Type } from "@google/genai";
import { UserProfile, ApplicationRecord, MatchMetrics } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using Gemini 3.0 Pro for complex reasoning and vision capabilities
const MODEL_NAME = 'gemini-3-pro-preview';

/**
 * Converts a File object to a Base64 string for the API.
 */
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64 = base64String.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Main workflow manager. 
 * Creates a chat session and executes the 6-step process sequentially to maintain context.
 */
export const processApplication = async (
  file: File, 
  profile: UserProfile, 
  onProgress: (step: string) => void
): Promise<ApplicationRecord> => {
  
  const base64Image = await fileToGenerativePart(file);

  // System Instruction: Define the persona and task
  // CRITICAL: Enforce usage of real data and ban placeholders
  const systemInstruction = `
    You are Ramon, an expert Career Assistant. You are acting on behalf of a candidate named ${profile.name}.
    
    CANDIDATE PROFILE (SOURCE OF TRUTH):
    Name: ${profile.name}
    Email: ${profile.email}
    Phone: ${profile.phone}
    LinkedIn: ${profile.linkedin}
    Website: ${profile.website}
    GitHub: ${profile.github}
    
    BACKGROUND / EXPERIENCE DATA:
    ${profile.extraInfo}

    YOUR GOAL:
    Analyze the provided Job Description (JD) image and generate specific application materials.
    
    CRITICAL RULES:
    1. NEVER use placeholders like "[Insert Date]", "[Company Name]", or "Your Name Here". 
    2. USE the Candidate Profile and Background Data provided above to fill out Experience, Skills, and Projects.
    3. If a specific detail (like an exact date) is missing in the background data, infer a reasonable one or use general terms (e.g., "2020 - Present") but DO NOT leave it as a placeholder.
    4. Maintain a professional yet innovative tone.
  `;

  // Start Chat Session
  const chat: Chat = ai.chats.create({
    model: MODEL_NAME,
    config: {
      systemInstruction: systemInstruction,
    },
  });

  const artifacts: any = {};

  // --- Step 1: Analyze Image & Generate Resume JSON ---
  onProgress('analyzing_image');
  
  const resumePrompt = `
    I am sending you a screenshot of a Job Description. 
    
    HERE IS MY BACKGROUND DATA AGAIN. USE THIS TO POPULATE THE RESUME CONTENT. DO NOT HALLUCINATE GENERIC INFO:
    """
    ${profile.extraInfo}
    """
    
    TASKS:
    1. Extract the Company Name from the image.
    2. Write a short 2-sentence summary of the JD.
    3. Generate a tailored Resume in JSON format based on my BACKGROUND DATA and this JD.
       * CRITICAL: The JSON 'resume' object MUST start with a 'personalDetails' object containing my real Name, Email, Phone, LinkedIn, Website, and GitHub.
       * CRITICAL: The 'experience' and 'projects' arrays MUST be populated with MY actual information from the background data, tailored to match the JD keywords.
    4. Generate a 'resumeDoc' string which is the fully formatted Resume text (Markdown).
       * CRITICAL: The Markdown document MUST start with a clear header containing: ${profile.name} | ${profile.email} | ${profile.phone} | ${profile.linkedin} | ${profile.website} | ${profile.github}
       * CRITICAL: The body of the markdown must contain the same real experience data as the JSON.
    
    Return ONLY a JSON object with this exact structure:
    {
      "companyName": "Extracted Company Name",
      "summary": "JD Summary",
      "resume": { 
        "personalDetails": {
           "name": "${profile.name}",
           "email": "${profile.email}",
           "phone": "${profile.phone}",
           "linkedin": "${profile.linkedin}",
           "website": "${profile.website}",
           "github": "${profile.github}"
        },
        "professionalSummary": " tailored summary...",
        "skills": ["skill1", "skill2"],
        "experience": [
          { "title": "Real Role Title", "company": "Real Company", "period": "Real Dates", "achievements": ["Real achievement 1", "Real achievement 2"] }
        ],
        "education": [
          { "degree": "Degree Name", "school": "School Name", "year": "Year" }
        ],
        "projects": [
          { "name": "Project Name", "description": "Description", "link": "URL" }
        ]
      },
      "resumeDoc": "Full markdown resume content starting with header..."
    }
  `;

  const step1Response = await chat.sendMessage({
    message: {
        role: 'user',
        parts: [
            { inlineData: { mimeType: file.type, data: base64Image } },
            { text: resumePrompt }
        ]
    },
    config: {
      responseMimeType: "application/json",
    }
  });

  const step1Data = JSON.parse(step1Response.text || '{}');
  artifacts.companyName = step1Data.companyName || "Unknown Company";
  artifacts.summary = step1Data.summary || "No summary available";
  artifacts.resumeJson = JSON.stringify(step1Data.resume, null, 2);
  artifacts.resumeDoc = step1Data.resumeDoc || "Resume generation failed.";

  // --- Step 2: Cover Letter ---
  onProgress('generating_cl');
  const clResponse = await chat.sendMessage({
    message: "Based on the resume you just generated and the JD, write a compelling Cover Letter. Use my real contact info in the header.",
  });
  artifacts.coverLetter = clResponse.text || "";

  // --- Step 3: Recruiter Email ---
  onProgress('generating_emails');
  const recruiterResponse = await chat.sendMessage({
    message: "Draft a short, punchy email to the Recruiter attaching the application. Sign off with my real name.",
  });
  artifacts.recruiterEmail = recruiterResponse.text || "";

  // --- Step 4: Hiring Manager Email ---
  const hmResponse = await chat.sendMessage({
    message: "Draft a slightly more technical email to the Hiring Manager focusing on my R&D value. Sign off with my real name.",
  });
  artifacts.hmEmail = hmResponse.text || "";

  // --- Step 5: DM Message ---
  onProgress('generating_dm');
  const dmResponse = await chat.sendMessage({
    message: "Draft a short LinkedIn DM (under 300 chars) to connect with a peer at the company.",
  });
  artifacts.dmMessage = dmResponse.text || "";

  // --- Step 6: Dashboard Metrics ---
  onProgress('calculating_metrics');
  
  // Define Schema for strict scoring
  const metricsSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      skillsMatch: { type: Type.NUMBER, description: "Score out of 60 based on skills match" },
      roleSimilarities: { type: Type.NUMBER, description: "Score out of 20 based on previous role similarity" },
      remotePolicy: { type: Type.NUMBER, description: "10 for Remote, 5 for Hybrid, 0 for Onsite" },
      rndFocus: { type: Type.NUMBER, description: "Score out of 10. Higher if role is R&D oriented rather than just Dev." },
      startupBonus: { type: Type.NUMBER, description: "5 if it is a startup, 0 otherwise" },
      automationBonus: { type: Type.NUMBER, description: "10 if the role involves automation, 0 otherwise" }
    },
    required: ["skillsMatch", "roleSimilarities", "remotePolicy", "rndFocus", "startupBonus", "automationBonus"]
  };

  const metricsPrompt = `
    Analyze the JD again for the dashboard statistics. Calculate the match percentage based on these EXACT rules:
    1. Skills Match: Up to 60 points.
    2. Role Similarity: Up to 20 points.
    3. Remote Policy: 10 points for Remote, 5 for Hybrid, 0 for Onsite.
    4. R&D Focus: Up to 10 points if the role is more R&D/Innovation than standard Dev maintenance.
    5. Startup Bonus: 5 points if it looks like a startup.
    6. Automation Bonus: 10 points if I can automate parts of the job.
    
    Return JSON only.
  `;

  const metricsResponse = await chat.sendMessage({
    message: metricsPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: metricsSchema
    }
  });

  const metricsData = JSON.parse(metricsResponse.text || '{}');
  const metrics: MatchMetrics = {
    skillsMatch: metricsData.skillsMatch || 0,
    roleSimilarities: metricsData.roleSimilarities || 0,
    remotePolicy: metricsData.remotePolicy || 0,
    rndFocus: metricsData.rndFocus || 0,
    startupBonus: metricsData.startupBonus || 0,
    automationBonus: metricsData.automationBonus || 0,
    totalScore: (metricsData.skillsMatch || 0) + 
                (metricsData.roleSimilarities || 0) + 
                (metricsData.remotePolicy || 0) + 
                (metricsData.rndFocus || 0) + 
                (metricsData.startupBonus || 0) + 
                (metricsData.automationBonus || 0)
  };

  // Construct Final Record
  const newRecord: ApplicationRecord = {
    id: crypto.randomUUID(),
    companyName: artifacts.companyName,
    jobSummary: artifacts.summary,
    dateCreated: new Date().toISOString(),
    status: 'Draft',
    metrics: metrics,
    artifacts: {
      resumeJson: artifacts.resumeJson,
      resumeDoc: artifacts.resumeDoc,
      coverLetter: artifacts.coverLetter,
      recruiterEmail: artifacts.recruiterEmail,
      hmEmail: artifacts.hmEmail,
      dmMessage: artifacts.dmMessage
    }
  };

  onProgress('complete');
  return newRecord;
};