import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface InputSectionProps {
  onAnalyze: (url: string) => void;
  isLoading: boolean;
  disabled: boolean;
}

const InputSection: React.FC<InputSectionProps> = ({ onAnalyze, isLoading, disabled }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onAnalyze(url.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-xl opacity-30 group-hover:opacity-60 transition duration-300 blur-md"></div>
      <div className="relative flex items-center">
        <input
          type="url"
          required
          placeholder="Paste public video link (e.g., https://site.com/video/123)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isLoading || disabled}
          className="w-full bg-slate-900 text-white placeholder-slate-500 border border-slate-700 rounded-xl py-4 pl-6 pr-36 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-inner text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <div className="absolute right-2">
          <button
            type="submit"
            disabled={isLoading || disabled || !url}
            className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:hover:bg-indigo-600 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Scanning</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>Play</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default InputSection;