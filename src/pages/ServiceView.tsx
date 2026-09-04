import React from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';

interface ServiceViewProps {
  title: string;
  url: string;
  description?: string;
  toolType: 'tone' | 'unit' | 'map' | 'camera' | 'report';
}

export function ServiceView({ title, url, description, toolType }: ServiceViewProps) {
  const [key, setKey] = React.useState(0);
  const refresh = () => setKey(prev => prev + 1);

  const renderTool = () => {
    return (
      <div className="flex-1 w-full h-full">
        <iframe
          key={key}
          src={url.startsWith('http') ? url : `https://${url}`}
          className="w-full h-full border-none"
          title={title}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col animate-in fade-in duration-500">
      <div className="flex-1 h-full min-h-0">
        {renderTool()}
      </div>
    </div>
  );
}
