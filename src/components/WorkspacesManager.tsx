import React, { useState } from 'react';
import { FolderKanban, Plus, Trash2, Edit3, Save, Sparkles, FileText, Check, MemoryStick } from 'lucide-react';
import { Workspace } from '../types';

interface WorkspacesManagerProps {
  workspaces: Workspace[];
  currentWorkspace: Workspace;
  onSelectWorkspace: (id: string) => void;
  onCreateWorkspace: (name: string, desc: string) => void;
  onUpdateWorkspaceNotes: (id: string, notes: string) => void;
  onUpdateContextMemory: (id: string, memory: Record<string, string | number>) => void;
  onDeleteWorkspace: (id: string) => void;
  onInsertToCalculator: (expr: string) => void;
}

export const WorkspacesManager: React.FC<WorkspacesManagerProps> = ({
  workspaces,
  currentWorkspace,
  onSelectWorkspace,
  onCreateWorkspace,
  onUpdateWorkspaceNotes,
  onUpdateContextMemory,
  onDeleteWorkspace,
  onInsertToCalculator
}) => {
  const [newWsName, setNewWsName] = useState('');
  const [newWsDesc, setNewWsDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [notes, setNotes] = useState(currentWorkspace.notes || '');
  const [newKey, setNewKey] = useState('');
  const [newVal, setNewVal] = useState('');
  const [savedNotesMessage, setSavedNotesMessage] = useState(false);

  const handleSaveNotes = () => {
    onUpdateWorkspaceNotes(currentWorkspace.id, notes);
    setSavedNotesMessage(true);
    setTimeout(() => setSavedNotesMessage(false), 1200);
  };

  const handleAddContextVar = () => {
    if (!newKey.trim() || !newVal.trim()) return;
    const updated = {
      ...currentWorkspace.contextMemory,
      [newKey.trim()]: newVal.trim()
    };
    onUpdateContextMemory(currentWorkspace.id, updated);
    setNewKey('');
    setNewVal('');
  };

  const handleRemoveContextVar = (k: string) => {
    const updated = { ...currentWorkspace.contextMemory };
    delete updated[k];
    onUpdateContextMemory(currentWorkspace.id, updated);
  };

  const handleCreate = () => {
    if (!newWsName.trim()) return;
    onCreateWorkspace(newWsName.trim(), newWsDesc.trim() || 'Custom calculation workspace');
    setNewWsName('');
    setNewWsDesc('');
    setIsCreating(false);
  };

  return (
    <div className="flex flex-col bg-slate-900/40 rounded-2xl border border-white/10 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <FolderKanban size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-mono">Workspaces & AI Memory</h3>
            <p className="text-xs text-slate-400 font-mono">Organize calculations, notes, and AI context for projects</p>
          </div>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer"
        >
          <Plus size={14} /> New Workspace
        </button>
      </div>

      {/* New Workspace Creation Modal Inline */}
      {isCreating && (
        <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl space-y-2">
          <span className="text-xs font-bold font-mono text-indigo-300">Create New Project Workspace</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Workspace Name (e.g. Taxes 2026, Physics Lab)"
              value={newWsName}
              onChange={(e) => setNewWsName(e.target.value)}
              className="px-3 py-1.5 bg-black/50 border border-white/10 rounded-lg text-xs font-mono text-white outline-none"
            />
            <input
              type="text"
              placeholder="Description (Optional)"
              value={newWsDesc}
              onChange={(e) => setNewWsDesc(e.target.value)}
              className="px-3 py-1.5 bg-black/50 border border-white/10 rounded-lg text-xs font-mono text-white outline-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsCreating(false)}
              className="px-3 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-xs font-mono"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className="px-3 py-1 bg-indigo-500 text-white font-bold rounded-lg text-xs font-mono"
            >
              Save Workspace
            </button>
          </div>
        </div>
      )}

      {/* Workspace Switcher Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {workspaces.map((ws) => (
          <div
            key={ws.id}
            onClick={() => {
              onSelectWorkspace(ws.id);
              setNotes(ws.notes || '');
            }}
            className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
              ws.id === currentWorkspace.id
                ? 'bg-indigo-950/50 border-indigo-500 text-white shadow-lg'
                : 'bg-white/5 border-white/5 hover:bg-white/10 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between font-mono">
              <span className="text-xs font-bold truncate">{ws.name}</span>
              {ws.id === currentWorkspace.id && <span className="text-[9px] bg-indigo-500/30 text-indigo-300 px-1.5 py-0.2 rounded">Active</span>}
            </div>
            <p className="text-[10px] text-slate-400 truncate mt-0.5">{ws.description}</p>
          </div>
        ))}
      </div>

      {/* Active Workspace Notes & AI Context Memory */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
        {/* Workspace Scratchpad Notes */}
        <div className="space-y-2 bg-slate-950/80 rounded-xl border border-white/10 p-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <FileText size={14} className="text-indigo-400" /> Project Scratchpad
            </span>
            <button
              onClick={handleSaveNotes}
              className="text-[11px] text-indigo-300 hover:text-white flex items-center gap-1 cursor-pointer font-bold"
            >
              {savedNotesMessage ? <Check size={12} className="text-emerald-400" /> : <Save size={12} />}
              <span>{savedNotesMessage ? 'Saved' : 'Save Notes'}</span>
            </button>
          </div>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Write calculation steps, project goals, formulas, or reminders for this workspace..."
            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs font-mono text-white outline-none resize-none"
          />
        </div>

        {/* AI Memory Key-Value Store */}
        <div className="space-y-2 bg-slate-950/80 rounded-xl border border-white/10 p-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <MemoryStick size={14} className="text-indigo-400" /> AI Context Memory
            </span>
            <span className="text-[10px] text-slate-500">Variables AI remembers</span>
          </div>

          <div className="flex items-center gap-1.5">
            <input
              type="text"
              placeholder="Name (e.g. Salary)"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="w-1/2 px-2 py-1 bg-black/50 border border-white/10 rounded-lg text-xs font-mono text-white outline-none"
            />
            <input
              type="text"
              placeholder="Value (e.g. $5000)"
              value={newVal}
              onChange={(e) => setNewVal(e.target.value)}
              className="w-1/2 px-2 py-1 bg-black/50 border border-white/10 rounded-lg text-xs font-mono text-white outline-none"
            />
            <button
              onClick={handleAddContextVar}
              className="p-1 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg transition-all cursor-pointer"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
            {Object.entries(currentWorkspace.contextMemory || {}).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between p-1.5 bg-white/5 rounded-lg text-xs font-mono">
                <span className="text-indigo-300 font-bold">{k}: <span className="text-white font-normal">{v}</span></span>
                <button
                  onClick={() => handleRemoveContextVar(k)}
                  className="text-slate-500 hover:text-red-400 cursor-pointer"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
