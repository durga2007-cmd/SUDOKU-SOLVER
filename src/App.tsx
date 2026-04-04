/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  RotateCcw, 
  Play, 
  Trash2, 
  Shuffle, 
  CheckCircle2, 
  AlertCircle,
  Info,
  Pause,
  FastForward,
  Settings2,
  Trophy
} from 'lucide-react';

type CellValue = number | null;
type Grid = CellValue[][];
type Difficulty = 'Easy' | 'Medium' | 'Hard';

const GRID_SIZE = 9;
const BOX_SIZE = 3;

const DIFFICULTY_SETTINGS = {
  Easy: 35,
  Medium: 45,
  Hard: 55
};

export default function App() {
  const [grid, setGrid] = useState<Grid>(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null)));
  const [initial, setInitial] = useState<Grid>(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null)));
  const [solving, setSolving] = useState(false);
  const [speed, setSpeed] = useState(20);
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
  const [status, setStatus] = useState<{ text: string; type: 'info' | 'success' | 'error' } | null>(null);
  const [activeCell, setActiveCell] = useState<{ r: number; c: number; type: 'trying' | 'backtrack' } | null>(null);
  
  const stopRef = useRef(false);

  const isValid = (g: Grid, r: number, c: number, n: number): boolean => {
    for (let x = 0; x < GRID_SIZE; x++) if (g[r][x] === n && x !== c) return false;
    for (let x = 0; x < GRID_SIZE; x++) if (g[x][c] === n && x !== r) return false;
    const sr = r - (r % BOX_SIZE), sc = c - (c % BOX_SIZE);
    for (let i = 0; i < BOX_SIZE; i++) {
      for (let j = 0; j < BOX_SIZE; j++) {
        if (g[i + sr][j + sc] === n && (i + sr !== r || j + sc !== c)) return false;
      }
    }
    return true;
  };

  const validateAll = (g: Grid): boolean => {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (g[r][c] !== null && !isValid(g, r, c, g[r][c] as number)) return false;
      }
    }
    return true;
  };

  const solve = async () => {
    if (solving) { stopRef.current = true; return; }
    if (!validateAll(grid)) { setStatus({ text: 'Invalid puzzle configuration!', type: 'error' }); return; }
    
    setStatus({ text: 'Solving puzzle...', type: 'info' });
    setSolving(true);
    stopRef.current = false;
    const g = grid.map(row => [...row]);

    const findEmpty = () => {
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) if (g[r][c] === null) return { r, c };
      }
      return null;
    };

    const run = async (): Promise<boolean> => {
      if (stopRef.current) return false;
      const empty = findEmpty();
      if (!empty) return true;
      const { r, c } = empty;

      for (let n = 1; n <= 9; n++) {
        if (stopRef.current) return false;
        if (isValid(g, r, c, n)) {
          g[r][c] = n;
          setGrid(g.map(row => [...row]));
          setActiveCell({ r, c, type: 'trying' });
          if (speed > 0) await new Promise(res => setTimeout(res, speed));
          
          if (await run()) return true;
          
          g[r][c] = null;
          setGrid(g.map(row => [...row]));
          setActiveCell({ r, c, type: 'backtrack' });
          if (speed > 0) await new Promise(res => setTimeout(res, speed));
        }
      }
      return false;
    };

    const success = await run();
    setSolving(false);
    setActiveCell(null);
    if (success) setStatus({ text: 'Puzzle solved successfully!', type: 'success' });
    else if (!stopRef.current) setStatus({ text: 'No solution exists for this puzzle.', type: 'error' });
    else setStatus(null);
  };

  const generate = () => {
    if (solving) return;
    setStatus({ text: `Generating ${difficulty} puzzle...`, type: 'info' });
    const g: Grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    
    const fill = (gr: Grid): boolean => {
      const empty = (() => {
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) if (gr[r][c] === null) return { r, c };
        }
        return null;
      })();
      if (!empty) return true;
      const { r, c } = empty;
      const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
      for (const n of nums) {
        if (isValid(gr, r, c, n)) {
          gr[r][c] = n;
          if (fill(gr)) return true;
          gr[r][c] = null;
        }
      }
      return false;
    };

    fill(g);
    const holes = DIFFICULTY_SETTINGS[difficulty];
    let count = 0;
    while (count < holes) {
      const r = Math.floor(Math.random() * GRID_SIZE);
      const c = Math.floor(Math.random() * GRID_SIZE);
      if (g[r][c] !== null) {
        g[r][c] = null;
        count++;
      }
    }

    setGrid(g);
    setInitial(g.map(row => [...row]));
    setStatus({ text: `${difficulty} puzzle generated!`, type: 'success' });
  };

  const clear = () => {
    if (solving) { stopRef.current = true; return; }
    setGrid(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null)));
    setInitial(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null)));
    setStatus(null);
    setActiveCell(null);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans p-4 md:p-8 flex flex-col items-center selection:bg-indigo-500/30">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full text-center mb-8"
      >
        <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
          SUDOKU PRO
        </h1>
        <p className="text-slate-400 font-medium">Advanced Backtracking Algorithm Visualizer</p>
      </motion.div>

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Panel: Controls */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-3 space-y-6"
        >
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-6 rounded-3xl shadow-2xl">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
              <Settings2 className="w-4 h-4" /> Configuration
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-3 block">Difficulty</label>
                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-900/50 rounded-xl border border-slate-700/30">
                  {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      disabled={solving}
                      className={`py-2 px-1 rounded-lg text-xs font-bold transition-all ${
                        difficulty === d 
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                          : 'text-slate-500 hover:text-slate-300'
                      } disabled:opacity-50`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-3 block flex justify-between">
                  Speed <span>{speed === 0 ? 'Instant' : `${speed}ms`}</span>
                </label>
                <input 
                  type="range" min="0" max="200" step="10"
                  value={speed} onChange={(e) => setSpeed(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <button
                onClick={generate}
                disabled={solving}
                className="w-full bg-slate-700/50 hover:bg-slate-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border border-slate-600/50 active:scale-95 disabled:opacity-50"
              >
                <Shuffle className="w-4 h-4" /> Generate Puzzle
              </button>
            </div>
          </div>
        </motion.div>

        {/* Center Panel: Grid */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <motion.div 
            layout
            className="relative p-2 bg-slate-800 rounded-3xl shadow-2xl border-4 border-slate-700/50 overflow-hidden"
          >
            <div className="grid grid-cols-9 gap-1 bg-slate-700/30">
              {grid.map((row, ri) => row.map((val, ci) => {
                const isInitial = initial[ri][ci] !== null;
                const isActive = activeCell?.r === ri && activeCell?.c === ci;
                const isBacktrack = isActive && activeCell?.type === 'backtrack';
                const isTrying = isActive && activeCell?.type === 'trying';
                
                const borderR = (ci + 1) % 3 === 0 && ci !== 8 ? 'mr-1' : '';
                const borderB = (ri + 1) % 3 === 0 && ri !== 8 ? 'mb-1' : '';

                return (
                  <motion.div 
                    key={`${ri}-${ci}`}
                    initial={false}
                    animate={{
                      backgroundColor: isInitial ? '#1e293b' : 
                                       isTrying ? '#4f46e5' : 
                                       isBacktrack ? '#ef4444' : '#0f172a'
                    }}
                    className={`relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center rounded-md ${borderR} ${borderB}`}
                  >
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={val || ''}
                      disabled={solving || isInitial}
                      onChange={(e) => {
                        const v = e.target.value.slice(-1);
                        if (/^[1-9]$/.test(v) || v === '') {
                          const ng = grid.map((r, rIdx) => r.map((c, cIdx) => (rIdx === ri && cIdx === ci ? (v ? parseInt(v) : null) : c)));
                          setGrid(ng);
                        }
                      }}
                      className={`w-full h-full text-center text-xl md:text-2xl font-black outline-none bg-transparent transition-colors
                        ${isInitial ? 'text-slate-400' : 'text-indigo-400'}
                        disabled:cursor-default
                      `}
                    />
                    {isInitial && (
                      <div className="absolute top-1 left-1 w-1 h-1 bg-slate-600 rounded-full" />
                    )}
                  </motion.div>
                );
              }))}
            </div>
          </motion.div>

          <div className="mt-8 flex gap-4 w-full max-w-md">
            <button
              onClick={solve}
              className={`flex-1 py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl ${
                solving 
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20' 
                  : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-500/20'
              }`}
            >
              {solving ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              {solving ? 'STOP' : 'SOLVE'}
            </button>
            <button
              onClick={clear}
              className="px-8 bg-slate-800 hover:bg-slate-700 text-slate-300 py-4 rounded-2xl font-black border border-slate-700 transition-all active:scale-95"
            >
              <Trash2 className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Right Panel: Legend & Status */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-3 space-y-6"
        >
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-6 rounded-3xl shadow-2xl">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
              <FastForward className="w-4 h-4" /> Visual Guide
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-slate-800 border border-slate-700 rounded" />
                <span className="text-xs font-bold text-slate-400">Empty Cell</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-slate-700 rounded" />
                <span className="text-xs font-bold text-slate-400">Initial Number</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-indigo-600 rounded shadow-lg shadow-indigo-500/50" />
                <span className="text-xs font-bold text-slate-400">Algorithm Trying</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-rose-500 rounded shadow-lg shadow-rose-500/50" />
                <span className="text-xs font-bold text-slate-400">Backtracking</span>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {status && (
              <motion.div
                key={status.text}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`p-6 rounded-3xl border flex items-start gap-4 ${
                  status.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                  status.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                  'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                }`}
              >
                {status.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> :
                 status.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> :
                 <Info className="w-5 h-5 shrink-0" />}
                <p className="text-xs font-bold leading-relaxed">{status.text}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <footer className="mt-16 text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">
        Backtracking Visualizer • v2.0 • Educational Tool
      </footer>
    </div>
  );
}
