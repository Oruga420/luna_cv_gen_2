import React, { useState, useEffect, useRef } from 'react';
import { Chat } from "@google/genai";
import { ApplicationRecord, ChatMessage } from '../types';
import { initNanoBananaChat } from '../services/geminiService';
import { getApplications } from '../services/storageService';

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: "Hey! I'm Nano Banana 🍌. Ask me about your applications or for any files you need!", timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const appsRef = useRef<ApplicationRecord[]>([]);

  // Initialize Chat Session
  useEffect(() => {
    if (isOpen && !chatSession) {
      const apps = getApplications();
      appsRef.current = apps;
      const chat = initNanoBananaChat(apps);
      setChatSession(chat);
    }
  }, [isOpen]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !chatSession) return;

    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const result = await chatSession.sendMessage({ message: userMsg.text });
      const responseText = result.text || "Sorry, I slipped on a peel and couldn't think of an answer.";
      
      setMessages(prev => [...prev, { role: 'model', text: responseText, timestamp: new Date() }]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Oops, my brain is offline. Try again later.", timestamp: new Date() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleDownload = (appId: string, artifactKey: string, label: string) => {
    const app = appsRef.current.find(a => a.id === appId);
    if (!app) {
      alert("Application not found!");
      return;
    }

    const content = app.artifacts[artifactKey as keyof typeof app.artifacts];
    if (!content) {
      alert("File not found!");
      return;
    }

    let filename = `${app.companyName}_${label.replace(/\s+/g, '_')}`;
    if (artifactKey === 'resumeJson') filename += '.json';
    else if (artifactKey === 'resumeDoc') filename += '.md';
    else filename += '.txt';

    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Parser for the custom download tags [[DOWNLOAD|ID|KEY|LABEL]]
  const renderMessage = (text: string) => {
    const regex = /\[\[DOWNLOAD\|(.*?)\|(.*?)\|(.*?)\]\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Push preceding text
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      
      const [_, appId, artifactKey, label] = match;
      
      // Push button component
      parts.push(
        <button 
          key={match.index}
          onClick={() => handleDownload(appId, artifactKey, label)}
          className="inline-flex items-center px-3 py-1 my-1 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-full hover:bg-indigo-200 transition-colors border border-indigo-300"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          {label}
        </button>
      );
      
      lastIndex = regex.lastIndex;
    }
    
    // Push remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return <>{parts.map((p, i) => <span key={i}>{p}</span>)}</>;
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 z-50 focus:outline-none focus:ring-4 focus:ring-indigo-300"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        ) : (
          <span className="text-2xl">🍌</span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 md:w-96 h-[500px] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex items-center shadow-md">
            <span className="text-2xl mr-2">🍌</span>
            <div>
              <h3 className="text-white font-bold text-lg">Nano Banana</h3>
              <p className="text-indigo-100 text-xs">Your AutoCV Assistant</p>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] px-4 py-2 rounded-lg text-sm shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                  }`}
                >
                  {msg.role === 'model' ? renderMessage(msg.text) : msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                 <div className="bg-white border border-gray-100 px-4 py-2 rounded-lg rounded-bl-none shadow-sm flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-gray-100 flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about your apps..."
              className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim()}
              className="ml-2 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;