
import React, { useRef, useState } from 'react';
import { Workout } from '../types';
import { exportToExcel, importFromExcel } from '../services/excelService';
import { Download, Upload, Database, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface DataViewProps {
  workouts: Workout[];
  onImport: (workouts: Workout[]) => void;
}

const DataView: React.FC<DataViewProps> = ({ workouts, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleExport = () => {
    if (workouts.length === 0) {
      alert("目前沒有數據可以匯出。");
      return;
    }
    exportToExcel(workouts);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('loading');
    try {
      const importedData = await importFromExcel(file);
      if (importedData.length === 0) throw new Error("檔案中沒有有效的訓練數據。");
      
      onImport(importedData);
      setStatus('success');
      setMessage(`成功匯入 ${importedData.length} 條訓練紀錄！`);
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage("匯入失敗，請確保檔案格式正確。");
      setTimeout(() => setStatus('idle'), 4000);
    }
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 text-center">
        <div className="w-16 h-16 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Database className="w-8 h-8 text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">數據備份</h2>
        <p className="text-zinc-500 text-sm mb-8 px-4">
          你可以將所有訓練數據匯出為 Excel 檔案，或從舊檔案中還原紀錄。
        </p>

        <div className="space-y-4">
          <button 
            onClick={handleExport}
            className="w-full bg-white text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-3 active:scale-95 transition"
          >
            <Download className="w-5 h-5" /> 匯出 Excel (XLSX)
          </button>

          <button 
            onClick={handleImportClick}
            disabled={status === 'loading'}
            className="w-full bg-zinc-900 border border-zinc-800 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 active:scale-95 transition hover:bg-zinc-800 disabled:opacity-50"
          >
            {status === 'loading' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
            匯入數據
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".xlsx" 
            className="hidden" 
          />
        </div>

        {status !== 'idle' && (
          <div className={`mt-6 p-4 rounded-2xl flex items-center gap-3 animate-in zoom-in-95 duration-200 ${
            status === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
            status === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-zinc-900 text-zinc-400'
          }`}>
            {status === 'success' && <CheckCircle2 className="w-5 h-5" />}
            {status === 'error' && <AlertCircle className="w-5 h-5" />}
            <span className="text-sm font-bold">{message}</span>
          </div>
        )}
      </div>

      <div className="bg-zinc-900/30 p-5 rounded-2xl border border-zinc-800/50">
        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">匯入說明</h4>
        <ul className="text-xs text-zinc-600 space-y-2 list-disc pl-4">
          <li>支援 .xlsx 格式檔案。</li>
          <li>匯入將會與現有數據合併。</li>
          <li>請勿隨意修改匯出檔案中的列名稱。</li>
        </ul>
      </div>
    </div>
  );
};

export default DataView;
