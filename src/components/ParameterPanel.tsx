import React from 'react';
import { ModelParameter } from '../types';
import { RotateCcw } from 'lucide-react';

interface ParameterPanelProps {
  parameters: ModelParameter[];
  onChange: (name: string, value: any) => void;
  onReset: () => void;
  isUpdating: boolean;
}

export const ParameterPanel: React.FC<ParameterPanelProps> = ({ parameters, onChange, onReset, isUpdating }) => {
  return (
    <div className="flex flex-col gap-4 p-4 bg-slate-800 rounded-xl border border-slate-700 shadow-lg h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-200">Customizer</h3>
        <button 
          onClick={onReset}
          className="p-1.5 hover:bg-slate-700 rounded-md text-slate-400 transition-colors"
          title="Reset to defaults"
        >
          <RotateCcw size={14} />
        </button>
      </div>
      
      <div className="space-y-4">
        {parameters.map((param) => (
          <div key={param.name} className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-400">
              {param.label}
              {param.type === 'number' && typeof param.value === 'number' && (
                <span className="ml-2 text-slate-500 font-mono">{param.value}</span>
              )}
            </label>
            
            {param.type === 'number' ? (
              <input
                type="range"
                min={param.min ?? 0}
                max={param.max ?? 100}
                step={param.step ?? 1}
                value={param.value}
                disabled={isUpdating}
                onChange={(e) => onChange(param.name, Number(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-50"
              />
            ) : param.type === 'boolean' ? (
              <div className="flex items-center">
                 <input
                  type="checkbox"
                  checked={Boolean(param.value)}
                  disabled={isUpdating}
                  onChange={(e) => onChange(param.name, e.target.checked)}
                  className="w-4 h-4 bg-slate-700 border-slate-600 rounded text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                />
              </div>
            ) : (
              <input
                type="text"
                value={param.value}
                disabled={isUpdating}
                onChange={(e) => onChange(param.name, e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-md px-2 py-1 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
              />
            )}
          </div>
        ))}

        {parameters.length === 0 && (
          <p className="text-xs text-slate-500 italic">No adjustable parameters found for this model.</p>
        )}
      </div>
      
      {isUpdating && (
        <div className="mt-auto py-2">
          <div className="flex items-center gap-2 text-[10px] text-indigo-400">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            Updating model...
          </div>
        </div>
      )}
    </div>
  );
};
