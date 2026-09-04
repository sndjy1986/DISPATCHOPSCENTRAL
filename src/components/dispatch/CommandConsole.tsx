import React, { useState } from 'react';
import { Terminal } from 'lucide-react';

interface CommandConsoleProps {
  onCommand: (cmd: string) => void;
}

export default function CommandConsole({ onCommand }: CommandConsoleProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onCommand(input.trim());
    setInput('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3 w-full">
      <Terminal className="w-4 h-4 text-slate-500" />
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter command (e.g. status Med-1 ready)..."
        className="flex-1 bg-transparent border-none text-[11px] font-mono text-white focus:ring-0 placeholder:text-slate-700"
        autoFocus
      />
    </form>
  );
}
