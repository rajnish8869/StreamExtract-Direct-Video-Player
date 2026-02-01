import React, { useState } from 'react';
import { Play, AlertCircle, Server, ShieldCheck, Video, Info } from 'lucide-react';
import { AppState, StreamResult } from './types';
import InputSection from './components/InputSection';
import VideoPlayer from './components/VideoPlayer';
import GeminiAnalysis from './components/GeminiAnalysis';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [streamData, setStreamData] = useState<StreamResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [backendUrl] = useState<string>('http://localhost:3001'); // Default local backend

  const handleAnalyze = async (url: string) => {
    setAppState(AppState.ANALYZING);
    setErrorMsg('');
    setStreamData(null);

    try {
      // In a real deployed environment, this would point to the actual backend URL
      const response = await fetch(`${backendUrl}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      // Try to parse JSON response first, regardless of status code
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        // If the backend sent a specific error message (even with 404), use it.
        if (data && data.error) {
           throw new Error(data.error);
        }

        // Only throw generic "route not found" if we didn't get a JSON error response
        if (response.status === 404) {
             throw new Error("Backend route not found. Is the server running?");
        }
        
        throw new Error((data && data.error) || `Server error: ${response.status}`);
      }

      if (data.success && data.data) {
        setStreamData(data.data);
        setAppState(AppState.PLAYING);
      } else {
        throw new Error(data.error || 'No compatible video stream found.');
      }

    } catch (err: any) {
      console.error(err);
      setAppState(AppState.ERROR);
      
      if (err.message && err.message.includes('Failed to fetch')) {
        setErrorMsg('Cannot connect to backend server. Please run the Node.js server locally on port 3001 (see README).');
      } else {
        setErrorMsg(err.message || 'An unexpected error occurred during analysis.');
      }
    }
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setStreamData(null);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20">
              <Video className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
              StreamExtract
            </h1>
          </div>
          <div className="flex items-center space-x-4 text-sm font-medium text-slate-400">
            <div className="hidden md:flex items-center space-x-1">
              <Server size={14} />
              <span>Backend: {backendUrl}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-start pt-12 px-4 pb-20">
        <div className="w-full max-w-4xl space-y-8">
          
          {/* Hero / Input Section */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
              Play Public Videos <span className="text-indigo-400">Directly</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Paste a link to a public video page. We'll attempt to extract the direct stream (MP4/HLS) and play it here, bypassing clutter.
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 p-6 rounded-2xl shadow-xl">
            <InputSection 
              onAnalyze={handleAnalyze} 
              isLoading={appState === AppState.ANALYZING} 
              disabled={appState === AppState.PLAYING}
            />
          </div>

          {/* Error State */}
          {appState === AppState.ERROR && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 flex items-start space-x-4 animate-in fade-in slide-in-from-bottom-4">
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-red-400 font-semibold mb-1">Analysis Failed</h3>
                <p className="text-red-200/80">{errorMsg}</p>
                {errorMsg.includes('Node.js') && (
                  <div className="mt-4 p-3 bg-slate-900 rounded border border-slate-700 text-sm font-mono text-slate-300">
                    npm install<br/>
                    npm run start:server
                  </div>
                )}
                <button 
                  onClick={handleReset}
                  className="mt-4 text-sm font-medium text-red-400 hover:text-red-300 underline"
                >
                  Try another URL
                </button>
              </div>
            </div>
          )}

          {/* Player State */}
          {appState === AppState.PLAYING && streamData && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/50 bg-black aspect-video border border-slate-700">
                 <VideoPlayer 
                    src={streamData.url} 
                    poster={streamData.poster} 
                    type={streamData.contentType || 'video/mp4'} 
                 />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Meta Information */}
                <div className="md:col-span-2 bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
                        {streamData.title || 'Unknown Title'}
                      </h3>
                      <p className="text-indigo-400 text-sm font-medium">
                        {streamData.siteName || 'Detected Source'}
                      </p>
                    </div>
                    <button 
                      onClick={handleReset}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-400 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed mb-6">
                    {streamData.description || 'No description available for this video.'}
                  </p>
                  
                  {/* Tech Info */}
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 rounded bg-slate-900 text-xs text-slate-500 font-mono border border-slate-700">
                      Format: {streamData.contentType || 'Unknown'}
                    </span>
                    <span className="px-2 py-1 rounded bg-slate-900 text-xs text-slate-500 font-mono border border-slate-700 truncate max-w-xs">
                      Stream: {streamData.url}
                    </span>
                  </div>
                </div>

                {/* Gemini AI Context */}
                <div className="md:col-span-1">
                  <GeminiAnalysis 
                    title={streamData.title} 
                    description={streamData.description}
                  />
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      <footer className="py-6 border-t border-slate-800 text-center text-slate-500 text-sm">
        <p>© 2025 StreamExtract. Educational demonstration only. Respect copyright.</p>
      </footer>
    </div>
  );
};

export default App;