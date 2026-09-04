import React, { useState, useRef } from "react";
import { Download, Upload, HardDrive, ShieldCheck, Check, AlertCircle, X, FileText, Database } from "lucide-react";

interface BackupControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData?: () => void;
}

export const BackupControlModal: React.FC<BackupControlModalProps> = ({
  isOpen,
  onClose,
  onRefreshData,
}) => {
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleExportBackup = async () => {
    try {
      const reports = JSON.parse(localStorage.getItem("cached_local_reports") || "[]");
      const turnovers = JSON.parse(localStorage.getItem("cached_local_turnovers") || "[]");
      const settings = JSON.parse(localStorage.getItem("cached_global_settings") || "{}");

      const backup = {
        app: "Medshore Central Hub",
        exportedAt: new Date().toISOString(),
        reports,
        turnovers,
        settings,
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement("a");
      downloadAnchor.href = url;
      downloadAnchor.download = `medshore_reports_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(url);
      setStatusMsg("Backup downloaded successfully!");
    } catch (e) {
      setStatusMsg("Error exporting backup file.");
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setStatusMsg(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);

        // 1. Restore to LocalStorage
        if (Array.isArray(data.reports)) {
          const existing = JSON.parse(localStorage.getItem("cached_local_reports") || "[]");
          const merged = [...data.reports, ...existing];
          const uniqueMap = new Map(merged.map((r: any) => [r.id, r]));
          localStorage.setItem("cached_local_reports", JSON.stringify(Array.from(uniqueMap.values())));
        }

        if (Array.isArray(data.turnovers)) {
          const existing = JSON.parse(localStorage.getItem("cached_local_turnovers") || "[]");
          const merged = [...data.turnovers, ...existing];
          const uniqueMap = new Map(merged.map((t: any) => [t.id, t]));
          localStorage.setItem("cached_local_turnovers", JSON.stringify(Array.from(uniqueMap.values())));
        }

        if (data.settings && typeof data.settings === "object") {
          const existing = JSON.parse(localStorage.getItem("cached_global_settings") || "{}");
          localStorage.setItem("cached_global_settings", JSON.stringify({ ...existing, ...data.settings }));
        }

        setStatusMsg("Backup imported successfully into local storage!");
        if (onRefreshData) onRefreshData();
      } catch (err) {
        setStatusMsg("Invalid backup JSON file.");
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <div onClick={onClose} className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" />
      <div className="relative w-full max-w-xl bg-[#0f1118] border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden text-left">
        <div className="flex items-center justify-between pb-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
              <HardDrive className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">Data Backup & Sync</h3>
              <p className="text-[10px] text-emerald-400 font-mono uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> High-Reliability Local Storage Active
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="py-6 space-y-4">
          <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl text-xs text-emerald-200/90 leading-relaxed space-y-2">
            <p className="font-bold flex items-center gap-2 text-emerald-400">
              <Check className="w-4 h-4" /> Bypasses Network & Firewall Restrictions
            </p>
            <p className="text-[11px] text-slate-300">
              Your reports and turnover logs are saved continuously into your browser local storage cache (`localStorage`) and cloud database. You can export or restore complete offline backups at any time.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <button
              type="button"
              onClick={handleExportBackup}
              className="p-5 bg-white/5 border border-white/10 hover:border-indigo-500/50 hover:bg-white/10 rounded-2xl flex flex-col items-start gap-3 transition-all group"
            >
              <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl group-hover:scale-110 transition-transform">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider">Export Backup (.json)</h4>
                <p className="text-[10px] text-slate-400 mt-1">Save copy of all reports to your computer</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="p-5 bg-white/5 border border-white/10 hover:border-emerald-500/50 hover:bg-white/10 rounded-2xl flex flex-col items-start gap-3 transition-all group"
            >
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl group-hover:scale-110 transition-transform">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider">
                  {isImporting ? "Importing..." : "Import Backup (.json)"}
                </h4>
                <p className="text-[10px] text-slate-400 mt-1">Restore saved reports from file</p>
              </div>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportFile}
              accept=".json"
              className="hidden"
            />
          </div>

          {statusMsg && (
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-xs font-mono text-indigo-300 flex items-center gap-2">
              <Database className="w-4 h-4 shrink-0 text-indigo-400" />
              <span>{statusMsg}</span>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-white/5 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all uppercase tracking-wider"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
