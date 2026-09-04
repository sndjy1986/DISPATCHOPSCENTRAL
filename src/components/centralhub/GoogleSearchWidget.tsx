import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, ExternalLink, Globe, Sparkles } from 'lucide-react';

export interface SearchEngine {
  id: string;
  name: string;
  url: string;
  placeholder: string;
  color: string;
  logo: React.ReactNode;
}

// Google 4-Color SVG Logo
export function GoogleLogo({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

// DuckDuckGo Duck Logo
export function DuckDuckGoLogo({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#DE5833" />
      <path d="M12 6c-2.5 0-4 1.5-4 3.5 0 1.2.6 2.2 1.5 2.8-.2.8-.8 1.7-1.5 2.2 1.8 0 3.5-.8 4.5-2 .5.1 1 .2 1.5.2 3 0 5-2 5-4.5S16 6 12 6z" fill="#FFF" />
      <circle cx="10" cy="9" r="1" fill="#000" />
      <path d="M11 11.5c1 .5 2.5.5 3.5 0" stroke="#000" strokeWidth="0.75" strokeLinecap="round" />
    </svg>
  );
}

// Bing / Microsoft Logo
export function BingLogo({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M5 3v18l6-3.5 7 2.5V13l-4-2-3 1.5V6.5L5 3z" fill="#00809D" />
    </svg>
  );
}

// Yahoo Logo
export function YahooLogo({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="5" fill="#6001D2" />
      <text x="12" y="16" fontSize="13" fontWeight="900" fill="#FFF" textAnchor="middle" fontFamily="sans-serif">Y!</text>
    </svg>
  );
}

// Ecosia Logo
export function EcosiaLogo({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#00A877" />
      <path d="M12 6v12M8 10l4-4 4 4M8 14l4 4 4-4" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Wikipedia Logo
export function WikipediaLogo({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="5" fill="#333333" />
      <text x="12" y="17" fontSize="14" fontWeight="800" fill="#FFF" textAnchor="middle" fontFamily="serif">W</text>
    </svg>
  );
}

const SEARCH_ENGINES: SearchEngine[] = [
  {
    id: 'google',
    name: 'Google',
    url: 'https://www.google.com/search?q=',
    placeholder: 'Search Google...',
    color: 'from-blue-500/20 to-red-500/20',
    logo: <GoogleLogo className="w-5 h-5 shrink-0" />
  },
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    url: 'https://duckduckgo.com/?q=',
    placeholder: 'Search privately with DuckDuckGo...',
    color: 'from-orange-500/20 to-amber-500/20',
    logo: <DuckDuckGoLogo className="w-5 h-5 shrink-0" />
  },
  {
    id: 'bing',
    name: 'Bing',
    url: 'https://www.bing.com/search?q=',
    placeholder: 'Search Microsoft Bing...',
    color: 'from-teal-500/20 to-cyan-500/20',
    logo: <BingLogo className="w-5 h-5 shrink-0" />
  },
  {
    id: 'yahoo',
    name: 'Yahoo!',
    url: 'https://search.yahoo.com/search?q=',
    placeholder: 'Search Yahoo!...',
    color: 'from-purple-500/20 to-indigo-500/20',
    logo: <YahooLogo className="w-5 h-5 shrink-0" />
  },
  {
    id: 'ecosia',
    name: 'Ecosia',
    url: 'https://www.ecosia.org/search?q=',
    placeholder: 'Plant trees with Ecosia search...',
    color: 'from-emerald-500/20 to-green-500/20',
    logo: <EcosiaLogo className="w-5 h-5 shrink-0" />
  },
  {
    id: 'wikipedia',
    name: 'Wikipedia',
    url: 'https://en.wikipedia.org/wiki/Special:Search?search=',
    placeholder: 'Search Wikipedia Encyclopedia...',
    color: 'from-slate-500/20 to-zinc-500/20',
    logo: <WikipediaLogo className="w-5 h-5 shrink-0" />
  }
];

export function GoogleSearchWidget() {
  const [query, setQuery] = useState('');
  const [selectedEngineId, setSelectedEngineId] = useState<string>(() => {
    try {
      return localStorage.getItem('preferred_search_engine') || 'google';
    } catch (e) {
      return 'google';
    }
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const activeEngine = SEARCH_ENGINES.find(e => e.id === selectedEngineId) || SEARCH_ENGINES[0];

  const handleSelectEngine = (engineId: string) => {
    setSelectedEngineId(engineId);
    setIsDropdownOpen(false);
    try {
      localStorage.setItem('preferred_search_engine', engineId);
    } catch (e) {
      console.warn('Failed to save search engine preference:', e);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      window.open(`${activeEngine.url}${encodeURIComponent(query.trim())}`, '_blank');
      setQuery('');
    }
  };

  return (
    <div className="h-full flex flex-col justify-center items-center p-6 bg-black/30 relative select-none">
      <div className="w-full max-w-lg mx-auto space-y-5">
        
        {/* Header & Logo Section */}
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/5 border border-white/10 shadow-inner flex items-center justify-center">
              {activeEngine.logo}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-white uppercase tracking-wider">
                  {activeEngine.name} Search
                </h2>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Global Query
                </span>
              </div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                Web & Intelligence Lookup Engine
              </p>
            </div>
          </div>

          {/* Google Quick Badge / Logo display */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-300">
            <GoogleLogo className="w-4 h-4" />
            <span className="text-[10px] text-slate-400 font-mono">Google Engine</span>
          </div>
        </div>

        {/* Search Engine Quick Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {SEARCH_ENGINES.map((engine) => {
            const isSelected = engine.id === activeEngine.id;
            return (
              <button
                key={engine.id}
                type="button"
                onClick={() => handleSelectEngine(engine.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/40'
                    : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  {engine.logo}
                </div>
                <span>{engine.name}</span>
              </button>
            );
          })}
        </div>

        {/* Main Search Input Form */}
        <form onSubmit={handleSearch} className="relative group">
          <div className="flex items-center bg-black/50 border-2 border-white/10 group-focus-within:border-indigo-500/60 rounded-2xl p-1.5 transition-all shadow-xl">
            
            {/* Search Engine Dropdown Toggle */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all border border-white/5"
                title="Change Search Engine"
              >
                {activeEngine.logo}
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Engine Selector Dropdown Menu */}
              {isDropdownOpen && (
                <div 
                  className="absolute left-0 mt-2 w-56 bg-[#0f1118] border border-white/15 rounded-2xl shadow-2xl z-50 p-1.5 space-y-1 backdrop-blur-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-3 py-2 border-b border-white/5 text-[9px] font-black uppercase text-slate-500 tracking-wider">
                    Select Search Engine
                  </div>
                  {SEARCH_ENGINES.map((engine) => (
                    <button
                      key={engine.id}
                      type="button"
                      onClick={() => handleSelectEngine(engine.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                        engine.id === activeEngine.id
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <div className="w-5 h-5 flex items-center justify-center shrink-0">
                        {engine.logo}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{engine.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input Field */}
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={activeEngine.placeholder}
              className="w-full bg-transparent px-3 py-2.5 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none"
            />

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!query.trim()}
              className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:opacity-40 text-white rounded-xl transition-all shrink-0 font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline text-xs uppercase tracking-wider font-black">Search</span>
            </button>
          </div>
        </form>

        {/* Footer info */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 font-mono">
          <span className="flex items-center gap-1">
            <Globe className="w-3 h-3 text-indigo-400" />
            Active: <strong className="text-slate-300 uppercase">{activeEngine.name}</strong>
          </span>
          <span className="flex items-center gap-1">
            <ExternalLink className="w-3 h-3 text-slate-500" /> Opens in New Tab
          </span>
        </div>

      </div>
    </div>
  );
}
