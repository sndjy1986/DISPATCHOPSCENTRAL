import React, { useState, useEffect } from 'react';
import { BookOpen, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';

interface WotdData {
  title: string;
  link: string;
  contentSnippet: string;
}

interface WotdWidgetProps {
  compact?: boolean;
}

export function WotdWidget({ compact = false }: WotdWidgetProps) {
  const [data, setData] = useState<WotdData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWotd = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent('https://www.merriam-webster.com/wotd/feed/rss2'));
      if (!response.ok) throw new Error('Failed to fetch data');
      
      const resData = await response.json();
      const item = resData.items[0];
      const wotd = {
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        contentSnippet: item.description ? item.description.replace(/<[^>]*>?/gm, '').replace(/\n\s*\n/g, '\n').trim() : ''
      };
      
      setData(wotd);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Transmission failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWotd();
  }, []);

  if (loading && !data) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 space-y-4">
        <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 animate-pulse">Decoding linguistics...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-4 bg-black/20">
        <AlertCircle className="w-6 h-6 text-rose-500" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{error}</p>
        <button 
          onClick={fetchWotd}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[8px] font-black text-white hover:bg-white/10 transition-all uppercase tracking-widest"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // M-W feed uses format "Word of the Day: paradigm"
  let word = data?.title || 'Unknown';
  if (word.includes(':')) {
    word = word.split(':')[1].trim();
  }
  
  // Format the snippet to grab definitions and part of speech (it usually includes them)
  const content = data?.contentSnippet || '';

  if (compact) {
    return (
      <div className="w-full h-full flex flex-col p-5 overflow-hidden justify-center bg-gradient-to-br from-indigo-500/5 to-transparent">
        <div className="flex items-center gap-2 text-indigo-400 mb-3 opacity-80">
          <BookOpen className="w-3 h-3" />
          <span className="text-[8px] font-black uppercase tracking-[0.2em]">Daily Lexicon</span>
        </div>
        <div>
          <h4 className="text-2xl font-black text-white mb-2 leading-none">{word}</h4>
          <p className="text-[10px] text-slate-400 font-medium leading-relaxed line-clamp-3">
            {content}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase italic tracking-wider">Linguistic Analysis</h3>
            <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Word of the Day</p>
          </div>
        </div>
        <button 
          onClick={() => window.open(data?.link, '_blank')}
          className="text-[9px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest flex items-center gap-1.5 transition-colors"
        >
          Source <ExternalLink className="w-3 h-3" />
        </button>
      </div>
      
      <div className="flex-1 flex flex-col justify-center">
        <div className="mb-4">
          <h4 className="text-4xl font-black text-white italic tracking-tighter shadow-sm">{word}</h4>
        </div>
        <div className="p-4 bg-black/40 border border-white/5 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <BookOpen className="w-16 h-16" />
          </div>
          <p className="text-sm text-slate-400 font-medium leading-relaxed relative z-10 w-full xl:w-5/6 pr-2">
            {content}
          </p>
        </div>
      </div>
    </div>
  );
}
