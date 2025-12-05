import React, { useState } from 'react';
import ProfileForm from './components/ProfileForm';
import JobUploader from './components/JobUploader';
import Dashboard from './components/Dashboard';
import Chatbot from './components/Chatbot';

enum View {
  DASHBOARD,
  UPLOAD,
  PROFILE
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
      {/* Sidebar / Navigation */}
      <div className="fixed inset-y-0 left-0 w-64 bg-slate-900 text-white shadow-xl flex flex-col z-10 hidden md:flex">
        <div className="p-6">
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center">
            <span className="text-indigo-400 mr-2">✦</span> AutoCV
          </h1>
          <p className="text-slate-500 text-xs mt-1">AI Career Agent "Ramon"</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavButton 
            active={currentView === View.DASHBOARD} 
            onClick={() => setCurrentView(View.DASHBOARD)}
            icon="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
            label="Dashboard"
          />
          <NavButton 
            active={currentView === View.UPLOAD} 
            onClick={() => setCurrentView(View.UPLOAD)}
            icon="M12 4v16m8-8H4"
            label="New Application"
          />
          <NavButton 
            active={currentView === View.PROFILE} 
            onClick={() => setCurrentView(View.PROFILE)}
            icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            label="My Persona"
          />
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
           Powered by Gemini 3.0 Pro
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center shadow-md">
         <span className="font-bold text-xl">AutoCV</span>
         <div className="space-x-4 text-sm">
           <button onClick={() => setCurrentView(View.DASHBOARD)} className={currentView === View.DASHBOARD ? "text-indigo-400" : ""}>Dash</button>
           <button onClick={() => setCurrentView(View.UPLOAD)} className={currentView === View.UPLOAD ? "text-indigo-400" : ""}>New</button>
           <button onClick={() => setCurrentView(View.PROFILE)} className={currentView === View.PROFILE ? "text-indigo-400" : ""}>Profile</button>
         </div>
      </div>

      {/* Main Content */}
      <main className="md:ml-64 p-4 md:p-8 min-h-screen">
        {currentView === View.DASHBOARD && <Dashboard />}
        {currentView === View.UPLOAD && <JobUploader onComplete={() => setCurrentView(View.DASHBOARD)} />}
        {currentView === View.PROFILE && <ProfileForm />}
      </main>

      {/* Chatbot Overlay */}
      <Chatbot />
    </div>
  );
};

const NavButton = ({active, onClick, icon, label}: {active: boolean, onClick: () => void, icon: string, label: string}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center px-4 py-3 rounded-md transition-colors ${
      active ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800'
    }`}
  >
    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon}></path>
    </svg>
    <span className="font-medium">{label}</span>
  </button>
);

export default App;