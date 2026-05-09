import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Download, Check } from 'lucide-react';

interface CodeViewerProps {
  code: string;
  filename: string;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ code, filename }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden shadow-xl border border-slate-700">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <span className="text-xs font-mono text-slate-400">{filename}</span>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-slate-700 rounded-md transition-colors text-slate-300 flex items-center justify-center"
            title="Copy to clipboard"
          >
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 hover:bg-slate-700 rounded-md transition-colors text-slate-300 flex items-center justify-center"
            title="Download SCAD file"
          >
            <Download size={16} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto custom-scrollbar bg-slate-900">
        <SyntaxHighlighter
          language="cpp"
          style={tomorrow}
          customStyle={{
            margin: 0,
            padding: '1.5rem',
            background: 'transparent',
            fontSize: '13px',
            lineHeight: '1.6',
          }}
          codeTagProps={{
            style: {
              fontFamily: 'var(--font-mono)',
            }
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};
