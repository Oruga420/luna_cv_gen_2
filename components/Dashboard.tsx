import React, { useEffect, useState } from 'react';
import { getApplications, deleteApplication } from '../services/storageService';
import { ApplicationRecord } from '../types';

const Dashboard: React.FC = () => {
  const [apps, setApps] = useState<ApplicationRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setApps(getApplications());
  }, [refreshKey]);

  const filteredApps = apps.filter(app => 
    app.companyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this application?")) {
      deleteApplication(id);
      setRefreshKey(prev => prev + 1);
    }
  };

  // Helper to download text as file
  const downloadFile = (filename: string, content: string) => {
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
    document.body.removeChild(element);
  };

  // Match Color Logic
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-indigo-600 bg-indigo-100';
    if (score >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Applications Dashboard</h1>
        <div className="relative">
          <input
            type="text"
            placeholder="Search by Company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-full shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-64"
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>
      </div>

      {apps.length === 0 ? (
        <div className="text-center text-gray-500 py-20 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          No applications found. Go to "New Application" to start.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredApps.map(app => (
            <div key={app.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
              {/* Header Section */}
              <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{app.companyName}</h3>
                  <div className="text-sm text-gray-500 mt-1">
                    Created: {new Date(app.dateCreated).toLocaleDateString()} | Status: <span className="font-medium text-indigo-600">{app.status}</span>
                  </div>
                </div>
                <div className={`mt-4 md:mt-0 px-4 py-2 rounded-full font-bold text-lg flex items-center ${getScoreColor(app.metrics.totalScore)}`}>
                  <span className="mr-2 text-sm font-normal text-gray-600 uppercase tracking-wide">Match</span>
                  {app.metrics.totalScore}%
                </div>
              </div>

              {/* Content Section */}
              <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Summary & Metrics */}
                <div className="lg:col-span-2 space-y-4">
                   <div>
                     <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">JD Summary (by Ramon)</h4>
                     <p className="text-gray-700 leading-relaxed text-sm">{app.jobSummary}</p>
                   </div>
                   
                   <div>
                     <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Match Breakdown</h4>
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <MetricBadge label="Skills" value={app.metrics.skillsMatch} max={60} />
                        <MetricBadge label="Role Sim." value={app.metrics.roleSimilarities} max={20} />
                        <MetricBadge label="Remote" value={app.metrics.remotePolicy} max={10} />
                        <MetricBadge label="R&D Focus" value={app.metrics.rndFocus} max={10} />
                        <MetricBadge label="Startup" value={app.metrics.startupBonus} max={5} />
                        <MetricBadge label="Automation" value={app.metrics.automationBonus} max={10} />
                     </div>
                   </div>
                </div>

                {/* Actions / Downloads */}
                <div className="bg-indigo-50 rounded-lg p-5 flex flex-col space-y-3 justify-center">
                  <h4 className="text-sm font-bold text-indigo-900 mb-2 text-center">Generated Documents</h4>
                  
                  <DownloadButton 
                    label="Resume (Doc)" 
                    iconPath="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    onClick={() => downloadFile(`${app.companyName}_Resume.md`, app.artifacts.resumeDoc || '')}
                  />

                  <DownloadButton 
                    label="Cover Letter" 
                    iconPath="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    onClick={() => downloadFile(`${app.companyName}_CoverLetter.txt`, app.artifacts.coverLetter)}
                  />
                  
                  <DownloadButton 
                    label="Email to Recruiter" 
                    iconPath="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    onClick={() => downloadFile(`${app.companyName}_RecruiterEmail.txt`, app.artifacts.recruiterEmail)}
                  />

                  <DownloadButton 
                    label="Email to Hiring Manager" 
                    iconPath="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    onClick={() => downloadFile(`${app.companyName}_HMEmail.txt`, app.artifacts.hmEmail)}
                  />

                  <DownloadButton 
                    label="LinkedIn DM" 
                    iconPath="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                    onClick={() => downloadFile(`${app.companyName}_DM.txt`, app.artifacts.dmMessage)}
                  />

                  <button 
                    onClick={() => downloadFile(`${app.companyName}_Resume.json`, app.artifacts.resumeJson)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 underline mt-2 text-center"
                  >
                    Download Resume JSON
                  </button>

                   <button 
                    onClick={() => handleDelete(app.id)}
                    className="text-xs text-red-500 hover:text-red-700 mt-4 text-center"
                  >
                    Delete Application
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const MetricBadge = ({label, value, max}: {label: string, value: number, max: number}) => (
  <div className="bg-white border border-gray-200 rounded p-2 text-center">
    <div className="text-xs text-gray-500">{label}</div>
    <div className="font-bold text-gray-800"><span className={value > 0 ? "text-indigo-600" : "text-gray-400"}>{value}</span> <span className="text-gray-400 text-xs">/ {max}</span></div>
  </div>
);

const DownloadButton = ({label, iconPath, onClick}: {label: string, iconPath: string, onClick: () => void}) => (
  <button 
    onClick={onClick}
    className="flex items-center justify-center w-full px-4 py-2 bg-white border border-indigo-200 rounded-md text-sm font-medium text-indigo-700 hover:bg-indigo-50 transition-colors shadow-sm"
  >
    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={iconPath}></path></svg>
    {label}
  </button>
);

export default Dashboard;