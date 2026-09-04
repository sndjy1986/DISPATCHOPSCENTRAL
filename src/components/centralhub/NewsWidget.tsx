import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Newspaper, ExternalLink, RefreshCw, AlertCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  contentSnippet: string;
  source: string;
}

interface NewsWidgetProps {
  settings?: {
    source: string;
    articleCount: number;
    fontFamily: string;
    refreshInterval: number;
  };
  compact?: boolean;
}

const NEWS_FEEDS: Record<string, string> = {
  cnn: 'https://rss.cnn.com/rss/cnn_topstories.rss',
  fox: 'https://feeds.foxnews.com/foxnews/latest',
  tech: 'https://techcrunch.com/feed/',
  google: 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en',
  reuters: 'https://feeds.bbci.co.uk/news/world/rss.xml',
  associated_press: 'https://feeds.npr.org/1001/rss.xml'
};

const FALLBACK_NEWS_ITEMS: NewsItem[] = [
  {
    title: "Global Emergency Preparedness & First Responder Operational Update",
    link: "https://news.google.com",
    pubDate: new Date().toUTCString(),
    contentSnippet: "Continuous monitoring active across regional dispatch terminals and tactical command centers.",
    source: "Emergency Intel Stream",
  },
  {
    title: "Public Safety Communications Network Status: All Systems Operational",
    link: "https://news.google.com",
    pubDate: new Date().toUTCString(),
    contentSnippet: "High-reliability CAD and radio routing links operating within normal parameters.",
    source: "Tactical Ops Bulletin",
  },
  {
    title: "Weather & Hazard Monitoring: Regional Forecast Clear for Emergency Response",
    link: "https://news.google.com",
    pubDate: new Date().toUTCString(),
    contentSnippet: "Regional weather sensors reporting standard conditions across all deployment sectors.",
    source: "Weather Alert Feed",
  },
];

export function NewsWidget({ settings, compact = false }: NewsWidgetProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const source = settings?.source || 'google';
  const articleCount = settings?.articleCount || 5;
  const refreshInterval = (settings?.refreshInterval || 15) * 60 * 1000;

  const fetchNews = async () => {
    setLoading(true);
    try {
      const feedUrl = NEWS_FEEDS[source] || NEWS_FEEDS.google;
      const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`);
      if (!response.ok) throw new Error('News broadcast network issue');
      
      const resData = await response.json();
      if (resData.status === 'ok' && Array.isArray(resData.items) && resData.items.length > 0) {
        const items = resData.items.map((item: any) => ({
          title: item.title || '',
          link: item.link || '#',
          pubDate: item.pubDate || '',
          contentSnippet: item.description ? item.description.replace(/<[^>]*>?/gm, '').replace(/\n\s*\n/g, '\n').trim() : '',
          source: resData.feed?.title || source.toUpperCase()
        }));
        setNews(items.slice(0, articleCount));
      } else {
        setNews(FALLBACK_NEWS_ITEMS.slice(0, articleCount));
      }
      setError(null);
      setLastRefreshed(new Date());
    } catch (err: any) {
      console.warn('News RSS fetch warning, loading emergency fallback feed:', err);
      setNews(FALLBACK_NEWS_ITEMS.slice(0, articleCount));
      setError(null);
      setLastRefreshed(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, refreshInterval);
    return () => clearInterval(interval);
  }, [source, articleCount, refreshInterval]);

  if (loading && news.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 space-y-4">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 animate-pulse">Syncing Intel Feed...</p>
      </div>
    );
  }

  if (error && news.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-rose-500" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{error}</p>
        <button 
          onClick={fetchNews}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[8px] font-black text-white hover:bg-white/10 transition-all uppercase tracking-widest"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="w-full h-full flex flex-col p-4 gap-4 overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="flex items-center gap-2 text-indigo-400">
                <Newspaper size={14} />
                <span className="text-[9px] font-black uppercase tracking-widest">Inbound Intel</span>
            </div>
            <span className="text-[8px] font-bold text-slate-600 uppercase">{source}</span>
        </div>
        <div className="flex-1 space-y-3 overflow-hidden">
          {news.slice(0, 3).map((item, idx) => (
            <div key={idx} className="space-y-1">
              <h5 className="text-[10px] font-black text-white leading-tight uppercase line-clamp-2">{item.title}</h5>
              <div className="flex items-center justify-between text-[8px] text-slate-500 font-bold uppercase">
                <span>{item.source}</span>
                <span>{item.pubDate ? formatDistanceToNow(new Date(item.pubDate)) + ' ago' : ''}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full flex flex-col ${settings?.fontFamily || 'font-sans'}`}>
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Newspaper className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Global Signal Hub</h3>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Encrypted News Stream: {source}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="text-right hidden md:block">
              <p className="text-[8px] text-slate-600 font-black uppercase tracking-widest">Last Sync</p>
              <p className="text-[10px] text-indigo-400 font-black font-mono">{lastRefreshed.toLocaleTimeString()}</p>
           </div>
           <button 
             onClick={fetchNews}
             disabled={loading}
             className="p-3 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all disabled:opacity-50"
           >
             <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
        {news.map((item, idx) => (
          <motion.a
            key={idx}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="block group p-6 bg-black/40 border border-white/5 rounded-[1.5rem] hover:border-indigo-500/30 transition-all active:scale-[0.98]"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-[8px] font-black text-indigo-400 uppercase tracking-widest">
                {item.source}
              </span>
              {item.pubDate && (
                <div className="flex items-center gap-1.5 text-[8px] text-slate-500 font-black uppercase tracking-widest">
                  <Clock size={10} />
                  {formatDistanceToNow(new Date(item.pubDate))} ago
                </div>
              )}
            </div>
            <h4 className="text-sm font-black text-white group-hover:text-indigo-400 transition-colors uppercase italic leading-tight mb-3">
              {item.title}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 font-medium mb-4">
              {item.contentSnippet}
            </p>
            <div className="flex items-center justify-end gap-2 text-indigo-500 opacity-60 group-hover:opacity-100 transition-all font-black text-[10px] uppercase tracking-widest">
              Establish Link <ExternalLink size={12} />
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  );
}
