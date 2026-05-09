import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Box, Code, Settings, Sparkles, Send, BoxSelect, Cpu, Download, Info, Image as ImageIcon, Upload, X } from 'lucide-react';
import { generateSCADModel, updateModelWithParameters } from './services/geminiService';
import { GeneratedModel } from './types';
import { Preview3D } from './components/Preview3D';
import { CodeViewer } from './components/CodeViewer';
import { ParameterPanel } from './components/ParameterPanel';

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [selectedImage, setSelectedImage] = useState<{ data: string; mimeType: string, preview: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [model, setModel] = useState<GeneratedModel | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      setSelectedImage({
        data: base64String,
        mimeType: file.type,
        preview: reader.result as string
      });
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!prompt.trim() && !selectedImage) return;

    setIsGenerating(true);
    setError(null);
    try {
      const newModel = await generateSCADModel(
        prompt || (selectedImage ? "Generate a 3D model based on this image." : ""), 
        selectedImage ? { data: selectedImage.data, mimeType: selectedImage.mimeType } : undefined
      );
      setModel(newModel);
      setActiveTab('preview');
    } catch (err) {
      console.error(err);
      setError('Failed to generate model. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleParamChange = useCallback(async (name: string, value: any) => {
    if (!model) return;
    
    // Update local state first for responsiveness
    const updatedParameters = model.parameters.map(p => 
      p.name === name ? { ...p, value } : p
    );
    
    setIsUpdating(true);
    try {
      const updatedModel = await updateModelWithParameters(
        { ...model, parameters: updatedParameters },
        { [name]: value }
      );
      setModel(updatedModel);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  }, [model]);

  const handleReset = () => {
    // In a real app, we'd keep original defaults, but for now we just re-generate
    handleGenerate();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500 rounded-lg shadow-lg shadow-indigo-500/20">
              <Box className="text-white" size={20} />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">SCAD<span className="text-indigo-400">Gen</span></h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">OpenSCAD Assistant</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 flex-1 max-w-2xl mx-8">
            <form onSubmit={handleGenerate} className="flex-1">
              <div className="relative group flex items-center">
                <div className="relative flex-1">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`p-1.5 rounded-md transition-colors ${selectedImage ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-slate-800 text-slate-500'}`}
                      title="Upload reference image"
                    >
                      <ImageIcon size={18} />
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                  
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={selectedImage ? "What should I do with this image?" : "Describe a 3D model or upload an image..."}
                    className="w-full bg-slate-900 border border-slate-700 rounded-full pl-12 pr-12 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-600"
                  />
                  
                  <button
                    type="submit"
                    disabled={isGenerating || (!prompt.trim() && !selectedImage)}
                    className="absolute right-1.5 top-1.5 p-1 bg-indigo-500 hover:bg-indigo-400 disabled:bg-slate-700 rounded-full text-white transition-colors"
                  >
                    {isGenerating ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
                </div>

                <AnimatePresence>
                  {selectedImage && (
                    <motion.div
                      initial={{ opacity: 0, x: -10, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -10, scale: 0.95 }}
                      className="absolute -bottom-16 left-0 flex items-center gap-2 p-2 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="relative w-12 h-12 rounded border border-slate-700 overflow-hidden bg-slate-800">
                        <img src={selectedImage.preview} alt="Reference" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setSelectedImage(null)}
                          className="absolute -top-1 -right-1 p-0.5 bg-red-500 rounded-full text-white hover:bg-red-400 transition-colors shadow-lg"
                        >
                          <X size={10} />
                        </button>
                      </div>
                      <div className="pr-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Reference Image</p>
                        <p className="text-[9px] text-slate-500 truncate max-w-[80px]">Ready to process</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </form>
          </div>

          <div className="flex items-center gap-3">
             <a href="https://openscad.org/" target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
               <Info size={20} />
             </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {!model && !isGenerating ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-indigo-500/10 blur-3xl rounded-full" />
              <Cpu size={80} className="text-indigo-500 relative" strokeWidth={1} />
            </motion.div>
            
            <div className="space-y-4 max-w-lg">
              <h2 className="text-3xl font-bold tracking-tight text-white">Create anything with code.</h2>
              <p className="text-slate-400">
                SCADGen uses Gemini 3.1 to translate your visual ideas into precise OpenSCAD scripts. Perfect for 3D printing and procedural modeling.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
              {[
                { title: 'Parametric Box', desc: 'A cube with adjustable walls and lid', prompt: 'A simple electronic enclosure with screw holes' },
                { title: 'Gears', desc: 'Custom spur gears for mechanical systems', prompt: 'A set of two interlocking spur gears' },
                { title: 'Architecture', desc: 'Low-poly buildings for tabletop games', prompt: 'A cyberpunk style apartment tower' }
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => { setPrompt(item.prompt); handleGenerate(); }}
                  className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-left hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all group"
                >
                  <Sparkles size={16} className="text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
                  <h3 className="text-sm font-semibold mb-1">{item.title}</h3>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[80vh]">
            {/* Left Sidebar - Parameters */}
            <div className="lg:col-span-3 h-full">
              {model ? (
                <ParameterPanel 
                  parameters={model.parameters} 
                  onChange={handleParamChange}
                  onReset={handleReset}
                  isUpdating={isUpdating}
                />
              ) : (
                <div className="h-full bg-slate-900/50 animate-pulse rounded-xl border border-slate-800" />
              )}
            </div>

            {/* Middle - Viewport */}
            <div className="lg:col-span-6 flex flex-col gap-4 h-full">
              <div className="flex bg-slate-900 rounded-xl p-1 w-fit border border-slate-800">
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'preview' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'}`}
                >
                  <BoxSelect size={16} /> Preview
                </button>
                <button
                  onClick={() => setActiveTab('code')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'code' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'}`}
                >
                  <Code size={16} /> Code
                </button>
              </div>

              <div className="flex-1 relative">
                {isGenerating ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 rounded-xl z-20 backdrop-blur-sm border border-slate-800">
                    <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
                    <p className="text-slate-400 font-medium">Architecting the SCAD model...</p>
                  </div>
                ) : null}

                <AnimatePresence mode="wait">
                  {activeTab === 'preview' ? (
                    <motion.div
                      key="preview"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="h-full"
                    >
                      {model && <Preview3D objects={model.preview} title={model.title} scadCode={model.scadCode} />}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="code"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="h-full"
                    >
                      {model && <CodeViewer code={model.scadCode} filename={`${model.title.toLowerCase().replace(/\s+/g, '_')}.scad`} />}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right Sidebar - Info/Details */}
            <div className="lg:col-span-3 h-full flex flex-col gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
                {model ? (
                  <>
                    <h2 className="text-xl font-bold text-white mb-2">{model.title}</h2>
                    <p className="text-sm text-slate-400 leading-relaxed italic border-l-2 border-indigo-500 pl-4 py-1">
                      {model.description}
                    </p>
                    <div className="pt-4 border-t border-slate-800">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-slate-500">File Type</span>
                        <span className="text-slate-300 font-mono">.scad</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Lines of Code</span>
                        <span className="text-slate-300 font-mono">{model.scadCode.split('\n').length}</span>
                      </div>
                    </div>
                  </>
                ) : (
                   <div className="space-y-4">
                      <div className="h-6 w-3/4 bg-slate-800 rounded animate-pulse" />
                      <div className="h-20 w-full bg-slate-800 rounded animate-pulse" />
                   </div>
                )}
              </div>

              <div className="mt-auto bg-indigo-500/10 border border-indigo-500/20 p-5 rounded-xl">
                <h4 className="text-sm font-semibold text-indigo-300 flex items-center gap-2 mb-2 uppercase tracking-wider text-[10px]">
                  <Download size={14} /> Quick Start
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Copy the code or download the file to use it in OpenSCAD. You can also further refine the model by changing the prompt.
                </p>
                <button 
                  onClick={() => setActiveTab('code')}
                  className="w-full py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
                >
                  View Full Code
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {error && (
        <div className="fixed bottom-6 right-6 bg-red-500/90 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom border border-red-400">
          <Info size={20} />
          <span className="text-sm font-medium">{error}</span>
          <button onClick={() => setError(null)} className="ml-2 hover:bg-white/20 rounded p-1">
            <BoxSelect size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

