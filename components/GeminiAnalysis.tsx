import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, Shield, FileText } from 'lucide-react';

interface GeminiAnalysisProps {
  title?: string;
  description?: string;
}

const GeminiAnalysis: React.FC<GeminiAnalysisProps> = ({ title, description }) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!process.env.API_KEY) {
        setAnalysis("API Key is missing. Cannot run Gemini.");
        return;
    }

    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Analyze the following video metadata and provide a short, safe summary of what the user can expect. 
        Also, provide a safety rating (Safe/Unsure/Risky) based on the textual context.
        
        Title: ${title || 'Unknown'}
        Description: ${description || 'None'}
        
        Format as: 
        **Summary:** [Your summary]
        **Safety Context:** [Your assessment]
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-latest',
        contents: prompt,
      });

      setAnalysis(response.text || "Could not generate analysis.");
    } catch (error) {
      console.error(error);
      setAnalysis("Failed to consult Gemini. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/30 rounded-xl p-5 flex flex-col">
      <div className="flex items-center space-x-2 mb-4 text-indigo-300">
        <Sparkles className="w-5 h-5" />
        <h3 className="font-semibold">AI Context</h3>
      </div>
      
      {!analysis ? (
        <div className="flex-grow flex flex-col items-center justify-center text-center space-y-4">
            <p className="text-sm text-slate-400">
                Use Gemini to assess the content safety and summarize the context based on metadata.
            </p>
            <button
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
                {loading ? 'Consulting Gemini...' : 'Ask Gemini'}
            </button>
        </div>
      ) : (
        <div className="prose prose-invert prose-sm text-slate-300 animate-in fade-in">
            <div className="whitespace-pre-wrap">{analysis}</div>
             <button
                onClick={() => setAnalysis('')}
                className="mt-4 text-xs text-indigo-400 hover:text-indigo-300 underline"
            >
                Clear Analysis
            </button>
        </div>
      )}
    </div>
  );
};

export default GeminiAnalysis;