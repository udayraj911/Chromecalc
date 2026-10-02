import { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  VolumeX, 
  History, 
  Trash2, 
  Sparkles, 
  Delete,
  X,
  HelpCircle,
  TrendingUp,
  Award,
  Mic,
  MicOff,
  Send,
  Cpu,
  Brain,
  MessageSquare,
  ArrowRight,
  Lightbulb,
  ArrowUpRight,
  Copy,
  Download,
  Ruler,
  Coins,
  Calculator,
  Search,
  Wifi,
  Signal,
  Battery,
  BatteryCharging,
  Smartphone,
  Check,
  Undo2,
  Redo2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { ParticlesCanvas, ParticlesCanvasHandle } from './components/ParticlesCanvas';
import { VisualWave } from './components/VisualWave';
import { Header } from './components/Header';
import { CommandPalette } from './components/CommandPalette';
import { Sidebar } from './components/Sidebar';
import { THEMES } from './themes';
import { playTactileClick } from './utils/audio';
import { ThemeId, HistoryItem, SidebarSection, Workspace } from './types';
import { evaluateExpression } from './utils/mathParser';

// Audio helper functions for real-time PCM voice stream
const floatTo16BitPCM = (input: Float32Array): ArrayBuffer => {
  const buffer = new ArrayBuffer(input.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < input.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return buffer;
};

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// Safe evaluation helper for mathematical equation plotting on screen
const generatePlotData = (expr: string) => {
  const points = [];
  const minX = -10;
  const maxX = 10;
  const steps = 40;
  const stepSize = (maxX - minX) / steps;

  // Clean and prepare the user mathematical string to JS-executable form
  const preparedExpr = expr
    .toLowerCase()
    .replace(/π|pi/g, 'Math.PI')
    .replace(/e/g, 'Math.E')
    .replace(/sin/g, 'Math.sin')
    .replace(/cos/g, 'Math.cos')
    .replace(/tan/g, 'Math.tan')
    .replace(/ln/g, 'Math.log')
    .replace(/log/g, 'Math.log10')
    .replace(/sqrt/g, 'Math.sqrt')
    .replace(/abs/g, 'Math.abs');

  for (let i = 0; i <= steps; i++) {
    const x = minX + i * stepSize;
    let y = 0;
    try {
      // Substitute standalone variable 'x' with its current value
      let evalStr = preparedExpr.replace(/\bx\b/g, `(${x})`);
      
      // Convert any power syntax (e.g. x^2 or and base^exponent) to Math.pow(base, exponent)
      let prevStr;
      do {
        prevStr = evalStr;
        evalStr = evalStr.replace(/([a-zA-Z0-9().-]+)\^([a-zA-Z0-9().-]+)/g, 'Math.pow($1,$2)');
      } while (evalStr !== prevStr);

      // Validate characters for standard math evaluations (safety filter)
      const allowedChars = /^[0-9+\-*/().,Mathsincoetanlgpqrtbdxe\s\^]+$/;
      if (allowedChars.test(evalStr)) {
        const result = Function(`"use strict"; return (${evalStr})`)();
        y = typeof result === 'number' && isFinite(result) ? result : 0;
      } else {
        y = 0;
      }
    } catch (e) {
      y = 0;
    }
    
    points.push({ 
      x: parseFloat(x.toFixed(1)), 
      y: parseFloat(y.toFixed(2)) 
    });
  }
  return points;
};


export default function App() {
  const [themeId, setThemeId] = useState<ThemeId>('cyberpunk');
  const [currentInput, setCurrentInput] = useState<string>('0');
  const [previousValue, setPreviousValue] = useState<string>('');
  const [operation, setOperation] = useState<string | null>(null);
  const [formula, setFormula] = useState<string>('');
  const [isNewInput, setIsNewInput] = useState<boolean>(true);
  const [memory, setMemory] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [waveIntensity, setWaveIntensity] = useState<number>(0.1);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [showConverter, setShowConverter] = useState<boolean>(false);
  const [showUnitPopup, setShowUnitPopup] = useState<boolean>(false);
  const [unitPopupTab, setUnitPopupTab] = useState<'units' | 'currency'>('units');
  const [converterVal, setConverterVal] = useState<string>('1');
  const [converterFrom, setConverterFrom] = useState<string>('m');
  const [converterTo, setConverterTo] = useState<string>('ft');
  const [converterSearch, setConverterSearch] = useState<string>('');
  const [lastAction, setLastAction] = useState<string>(''); // For informational overlays
  
  // Undo/Redo & Utility States
  const [undoStack, setUndoStack] = useState<string[]>(['0']);
  const [undoIndex, setUndoIndex] = useState<number>(0);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  
  // ChromaCalc Ecosystem States
  const [activeSection, setActiveSection] = useState<SidebarSection>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);

  const [workspaces, setWorkspaces] = useState<Workspace[]>([
    {
      id: 'default',
      name: 'General Math',
      icon: 'Calculator',
      description: 'Main calculation workspace',
      createdAt: new Date(),
      updatedAt: new Date(),
      notes: 'Welcome to ChromaCalc! Use workspace notes to save steps, formulas, and context.',
      contextMemory: {},
      savedExpressions: []
    },
    {
      id: 'finance_ws',
      name: 'Finance & Budget',
      icon: 'DollarSign',
      description: 'EMI, taxes, investments & monthly spending',
      createdAt: new Date(),
      updatedAt: new Date(),
      notes: 'Monthly Salary = $5000\nRent = $1500\nTarget Savings = $1000',
      contextMemory: { Salary: '$5000', Rent: '$1500', Food: '$600' },
      savedExpressions: []
    },
    {
      id: 'physics_ws',
      name: 'Physics & Lab',
      icon: 'Atom',
      description: 'Constants, kinematics & thermodynamics',
      createdAt: new Date(),
      updatedAt: new Date(),
      notes: 'Gravity g = 9.80665 m/s²\nSpeed of light c = 299792458 m/s',
      contextMemory: { g: 9.81, c: 299792458 },
      savedExpressions: []
    }
  ]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>('default');
  const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId) || workspaces[0];

  const handleInsertToCalculator = (expr: string) => {
    if (!expr) return;
    setCurrentInput(expr);
    setFormula(`Loaded from ${activeSection}`);
    pushToUndoStack(expr);
    setLastAction(`Inserted ${expr}`);
    triggerAudio('number');
  };

  const handleCreateWorkspace = (name: string, desc: string) => {
    const newWs: Workspace = {
      id: Date.now().toString(),
      name,
      icon: 'Folder',
      description: desc,
      createdAt: new Date(),
      updatedAt: new Date(),
      notes: '',
      contextMemory: {},
      savedExpressions: []
    };
    setWorkspaces([...workspaces, newWs]);
    setCurrentWorkspaceId(newWs.id);
    setLastAction(`Created workspace ${name}`);
  };

  const handleUpdateWorkspaceNotes = (wsId: string, notes: string) => {
    setWorkspaces(workspaces.map(w => w.id === wsId ? { ...w, notes, updatedAt: new Date() } : w));
  };

  const handleUpdateContextMemory = (wsId: string, memory: Record<string, string | number>) => {
    setWorkspaces(workspaces.map(w => w.id === wsId ? { ...w, contextMemory: memory, updatedAt: new Date() } : w));
  };

  const handleDeleteWorkspace = (wsId: string) => {
    if (workspaces.length <= 1) return;
    const filtered = workspaces.filter(w => w.id !== wsId);
    setWorkspaces(filtered);
    if (currentWorkspaceId === wsId) {
      setCurrentWorkspaceId(filtered[0].id);
    }
  };
  
  // Natural Language & Speech-to-Text States
  const [naturalInput, setNaturalInput] = useState<string>('');
  const [isNaturalLoading, setIsNaturalLoading] = useState<boolean>(false);
  const [isListeningSpeech, setIsListeningSpeech] = useState<boolean>(false);
  
  // Custom button feedback state
  const [activeButtonId, setActiveButtonId] = useState<string | null>(null);
  const [activeMobileView, setActiveMobileView] = useState<'calculator' | 'companion' | 'converter' | 'history'>('calculator');
  const [showScientificKeypad, setShowScientificKeypad] = useState<boolean>(false);
  const [isDegreeMode, setIsDegreeMode] = useState<boolean>(false);
  const [showPlot, setShowPlot] = useState<boolean>(false);
  const [plotEquation, setPlotEquation] = useState<string>('sin(x)');
  const [currentTime, setCurrentTime] = useState<string>('12:00 PM');
  const [batteryLevel, setBatteryLevel] = useState<number>(88);
  const [isCharging, setIsCharging] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      setCurrentTime(`${hours}:${minutes} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        setIsCharging(battery.charging);
        
        const onLevelChange = () => setBatteryLevel(Math.round(battery.level * 100));
        const onChargingChange = () => setIsCharging(battery.charging);
        
        battery.addEventListener('levelchange', onLevelChange);
        battery.addEventListener('chargingchange', onChargingChange);
        
        return () => {
          battery.removeEventListener('levelchange', onLevelChange);
          battery.removeEventListener('chargingchange', onChargingChange);
        };
      }).catch(() => {});
    }
  }, []);

  const particlesRef = useRef<ParticlesCanvasHandle>(null);
  const currentTheme = THEMES[themeId];

  // AI Companion States
  const [showCompanion, setShowCompanion] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'voice' | 'explain'>('chat');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model', content: string }[]>([
    { role: 'model', content: "Hi there! I'm **Sparky**, your visual AI calculator assistant. You can ask me math questions, tell me to solve complex equations, or toggle **Reasoning Mode** above for High Thinking deep step-by-step logic!" }
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [isThinkingMode, setIsThinkingMode] = useState<boolean>(false);
  const [explanation, setExplanation] = useState<string>('');
  const [isExplainLoading, setIsExplainLoading] = useState<boolean>(false);

  // Live Voice States
  const [isVoiceConnected, setIsVoiceConnected] = useState<boolean>(false);
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking' | 'error'>('idle');
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');

  // Audio & Connection Refs
  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatLoading]);

  // Clean up voice connection on unmount
  useEffect(() => {
    return () => {
      stopVoiceSession();
    };
  }, []);

  // Handler for text chat submissions
  const handleSendChat = async (customMsg?: string) => {
    const textToSend = typeof customMsg === 'string' ? customMsg : chatInput;
    if (!textToSend.trim() || isChatLoading) return;

    const userMsg = textToSend.trim();
    if (typeof customMsg !== 'string') setChatInput('');
    const updatedMessages = [...chatMessages, { role: 'user' as const, content: userMsg }];
    setChatMessages(updatedMessages);
    setIsChatLoading(true);
    triggerAudio('operator');

    try {
      const endpoint = isThinkingMode ? '/api/thinking' : '/api/chat';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await response.json();
      if (response.ok && data.text) {
        setChatMessages([...updatedMessages, { role: 'model', content: data.text }]);
      } else {
        setChatMessages([...updatedMessages, { role: 'model', content: `Error: ${data.error || 'Failed to reach Sparky.'}` }]);
      }
    } catch (err: any) {
      console.error(err);
      setChatMessages([...updatedMessages, { role: 'model', content: "Network Error: Could not connect to the Sparky service. Check your internet or server status!" }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Handler for explaining current calculator formula or input
  const handleExplainCalc = async () => {
    setIsExplainLoading(true);
    triggerAudio('operator');
    setExplanation('');

    const targetExpr = formula || currentInput;
    const isFinished = formula.includes('=');
    const displayVal = currentInput;

    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expression: targetExpr,
          result: displayVal !== '0' && !isFinished ? displayVal : '',
        }),
      });

      const data = await response.json();
      if (response.ok && data.text) {
        setExplanation(data.text);
      } else {
        setExplanation(`Could not explain this calculation: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      setExplanation("Could not reach Sparky's formula explanation engine.");
    } finally {
      setIsExplainLoading(false);
    }
  };

  // Start Voice Session (Microphone stream & 24kHz Audio playback)
  const startVoiceSession = async () => {
    try {
      setVoiceStatus('connecting');
      setVoiceTranscript('Connecting to Sparky voice bridge...');
      triggerAudio('operator');

      // 1. Get microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      // 2. Initialize AudioContexts
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      inputAudioCtxRef.current = inputCtx;
      outputAudioCtxRef.current = outputCtx;

      // 3. Connect WebSocket to local full-stack server
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setVoiceStatus('listening');
        setVoiceTranscript('Connected! Sparky is listening to you...');
        setIsVoiceConnected(true);

        // Capture Mic and Process PCM Audio
        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        source.connect(processor);
        processor.connect(inputCtx.destination);

        processor.onaudioprocess = (e) => {
          if (ws.readyState !== WebSocket.OPEN) return;
          const floatData = e.inputBuffer.getChannelData(0);
          
          // Convert Float32Array to 16-bit PCM buffer and send as Base64
          const pcmBuffer = floatTo16BitPCM(floatData);
          const base64Audio = arrayBufferToBase64(pcmBuffer);
          ws.send(JSON.stringify({ audio: base64Audio }));
        };
      };

      let playStartTime = 0;

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.error) {
          setVoiceStatus('error');
          setVoiceTranscript(`Speech system error: ${data.error}`);
          stopVoiceSession();
          return;
        }

        if (data.interrupted) {
          playStartTime = 0;
          setVoiceStatus('listening');
          setVoiceTranscript('Interrupted! Sparky is listening again...');
          return;
        }

        if (data.transcript) {
          setVoiceTranscript(data.transcript);
        }

        if (data.audio) {
          setVoiceStatus('speaking');
          
          // Convert incoming 16-bit PCM little-endian Base64 back to float32
          const binary = atob(data.audio);
          const len = binary.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binary.charCodeAt(i);
          }

          const numSamples = len / 2;
          const floatData = new Float32Array(numSamples);
          const view = new DataView(bytes.buffer);
          for (let i = 0; i < numSamples; i++) {
            const intSample = view.getInt16(i * 2, true);
            floatData[i] = intSample / 32768;
          }

          const audioBuffer = outputCtx.createBuffer(1, numSamples, 24000);
          audioBuffer.copyToChannel(floatData, 0);

          const now = outputCtx.currentTime;
          if (playStartTime < now) {
            playStartTime = now + 0.05; // 50ms buffer to align chunks seamlessly
          }

          const source = outputCtx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(outputCtx.destination);
          source.start(playStartTime);

          playStartTime += audioBuffer.duration;

          source.onended = () => {
            // Once played completely, revert voice status to listening
            if (outputCtx.currentTime >= playStartTime - 0.1) {
              setVoiceStatus('listening');
            }
          };
        }
      };

      ws.onerror = (err) => {
        console.error("Voice WebSocket error:", err);
        setVoiceStatus('error');
        setVoiceTranscript('Connection error. Re-try starting.');
        stopVoiceSession();
      };

      ws.onclose = () => {
        stopVoiceSession();
      };

    } catch (err: any) {
      console.error(err);
      setVoiceStatus('error');
      setVoiceTranscript(`Permission or access issue: ${err.message || 'Check microphone permission.'}`);
      stopVoiceSession();
    }
  };

  // Stop Voice Session and clean up resources
  const stopVoiceSession = () => {
    setIsVoiceConnected(false);
    setVoiceStatus('idle');

    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      if (inputAudioCtxRef.current.state !== 'closed') {
        inputAudioCtxRef.current.close();
      }
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      if (outputAudioCtxRef.current.state !== 'closed') {
        outputAudioCtxRef.current.close();
      }
      outputAudioCtxRef.current = null;
    }
  };

  const toggleVoiceConnection = () => {
    if (isVoiceConnected) {
      stopVoiceSession();
    } else {
      startVoiceSession();
    }
  };

  // Helper to load formulas directly into calculator
  const loadMathIntoCalculator = (expr: string) => {
    triggerAudio('number');
    setWaveIntensity(0.5);
    
    // Simple filter to strip equal signs or clean strings
    const cleanExpr = expr.split('=')[0].trim();
    setFormula(cleanExpr);
    setCurrentInput('0');
    setIsNewInput(true);
    setLastAction('Loaded from Sparky');
  };


  // Load history from localStorage on startup
  useEffect(() => {
    try {
      const stored = localStorage.getItem('calc_history');
      if (stored) {
        setHistory(JSON.parse(stored).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })));
      }
    } catch (e) {
      console.warn('Could not read history from local storage', e);
    }
  }, []);

  // Save history to localStorage
  const saveHistory = (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    try {
      localStorage.setItem('calc_history', JSON.stringify(newHistory));
    } catch (e) {
      console.warn('Could not write history to local storage', e);
    }
  };

  // Pulse the wave intensity and decay it over time
  useEffect(() => {
    if (waveIntensity > 0.1) {
      const interval = setInterval(() => {
        setWaveIntensity((prev) => {
          if (prev <= 0.1) {
            clearInterval(interval);
            return 0.1;
          }
          return prev - 0.05;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [waveIntensity]);

  const triggerHapticPulse = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(15);
      } catch (err) {
        // Safe catch for iframe / cross-origin context restrictions
      }
    }
  };

  // Handle visual burst for buttons
  const triggerButtonFeedback = (buttonId: string, colorOverride?: string) => {
    triggerHapticPulse();
    const element = document.getElementById(buttonId);
    if (element && particlesRef.current) {
      const rect = element.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const color = colorOverride || currentTheme.accentColor;
      particlesRef.current.triggerBurst(x, y, color);
    }
    
    // Set active button for keyboard animations
    setActiveButtonId(buttonId);
    setTimeout(() => setActiveButtonId(null), 150);
  };

  // Sound & Haptic triggering helper
  const triggerAudio = (toneType: 'number' | 'operator' | 'clear' | 'equals' | 'error') => {
    if (soundEnabled) {
      playTactileClick(currentTheme.audioClickType, toneType);
    }
    // Subtle physical haptic feedback on mobile (vibrate where supported)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (toneType === 'error') {
        navigator.vibrate([40, 40, 40]);
      } else if (toneType === 'equals') {
        navigator.vibrate(18);
      } else {
        navigator.vibrate(8);
      }
    }
  };

  // Calculator engine actions with Undo/Redo tracking
  const pushToUndoStack = (inputState: string) => {
    const newStack = undoStack.slice(0, undoIndex + 1);
    newStack.push(inputState);
    setUndoStack(newStack);
    setUndoIndex(newStack.length - 1);
  };

  const handleUndo = () => {
    if (undoIndex > 0) {
      triggerAudio('operator');
      const prevIndex = undoIndex - 1;
      setUndoIndex(prevIndex);
      setCurrentInput(undoStack[prevIndex]);
      setLastAction('Undo');
    } else {
      triggerErrorShake();
    }
  };

  const handleRedo = () => {
    if (undoIndex < undoStack.length - 1) {
      triggerAudio('operator');
      const nextIndex = undoIndex + 1;
      setUndoIndex(nextIndex);
      setCurrentInput(undoStack[nextIndex]);
      setLastAction('Redo');
    } else {
      triggerErrorShake();
    }
  };

  const triggerErrorShake = () => {
    setIsShaking(true);
    triggerAudio('error');
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleDigit = (digit: string) => {
    triggerAudio('number');
    setWaveIntensity(Math.min(waveIntensity + 0.15, 1.0));

    let newVal = '';
    if (isNewInput) {
      newVal = digit === '.' ? '0.' : digit;
      setCurrentInput(newVal);
      setIsNewInput(false);
    } else {
      if (digit === '.' && currentInput.includes('.')) {
        triggerErrorShake();
        return; // Prevent multiple decimals
      }
      newVal = currentInput === '0' && digit !== '.' ? digit : currentInput + digit;
      setCurrentInput(newVal);
    }
    pushToUndoStack(newVal);
  };

  const handleOperator = (op: string) => {
    triggerAudio('operator');
    setWaveIntensity(Math.min(waveIntensity + 0.3, 1.0));

    // For full PEMDAS and parenthetical support, we let users append operators to build complete expressions!
    let newVal = '';
    if (isNewInput && currentInput === '0') {
      newVal = op;
      setCurrentInput(newVal);
      setIsNewInput(false);
    } else {
      // Append space-separated operator for nice legibility
      newVal = `${currentInput} ${op} `;
      setCurrentInput(newVal);
    }
    pushToUndoStack(newVal);
  };

  const runCalculation = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '×':
      case '*': return a * b;
      case '÷':
      case '/': return b !== 0 ? a / b : NaN;
      case '^': return Math.pow(a, b);
      default: return b;
    }
  };

  const handleEquals = () => {
    triggerAudio('equals');
    setWaveIntensity(1.0); // Maximum visual wave energy!

    try {
      // Clean display expression for evaluation
      let expr = currentInput
        .replace(/×/g, '*')
        .replace(/÷/g, '/');

      // Use the robust math parser we built to handle nested parentheses and order of operations
      const res = evaluateExpression(expr, isDegreeMode);

      if (isNaN(res) || !isFinite(res)) {
        triggerErrorShake();
        setCurrentInput('Error');
        setIsNewInput(true);
        return;
      }

      const formattedResult = formatNumber(res);
      const fullFormula = `${currentInput} =`;

      // Append to history
      const newItem: HistoryItem = {
        id: Math.random().toString(36).substring(2, 9),
        expression: currentInput,
        result: formattedResult,
        timestamp: new Date()
      };
      saveHistory([newItem, ...history]);

      // Update state
      setCurrentInput(formattedResult);
      setFormula(fullFormula);
      setIsNewInput(true);
      setLastAction('Result Evaluated');
      pushToUndoStack(formattedResult);
    } catch (err) {
      triggerErrorShake();
      setCurrentInput('Error');
      setIsNewInput(true);
    }
  };

  const handleClear = () => {
    triggerAudio('clear');
    setWaveIntensity(0.1);
    setCurrentInput('0');
    setPreviousValue('');
    setOperation(null);
    setFormula('');
    setIsNewInput(true);
    setLastAction('All Cleared');
    
    // Reset undo/redo stacks
    setUndoStack(['0']);
    setUndoIndex(0);
  };

  const handleBackspace = () => {
    triggerAudio('number');
    setWaveIntensity(Math.min(waveIntensity + 0.1, 0.8));

    if (isNewInput) return;

    let newVal = '0';
    setCurrentInput((prev) => {
      // Clean up trailing spaces for operators
      let trimmed = prev;
      if (prev.endsWith(' ')) {
        trimmed = prev.trim();
      }
      if (trimmed.length <= 1 || trimmed === 'Error') {
        setIsNewInput(true);
        newVal = '0';
      } else {
        newVal = trimmed.slice(0, -1);
      }
      return newVal;
    });
    pushToUndoStack(newVal);
  };

  // Scientific or quick functions
  const handleSpecial = (type: 'sqrt' | 'sqr' | 'percent' | 'negate' | 'sin' | 'cos' | 'tan' | 'ln' | 'log' | 'exp' | 'pow10' | 'cube' | 'abs' | 'factorial' | 'parentheses_open' | 'parentheses_close') => {
    triggerAudio('operator');
    setWaveIntensity(Math.min(waveIntensity + 0.4, 1.0));

    // Handle parentheses by appending them to the current expression stream for PEMDAS parsing
    if (type === 'parentheses_open') {
      const newVal = isNewInput || currentInput === '0' ? '(' : `${currentInput}(`;
      setCurrentInput(newVal);
      setIsNewInput(false);
      pushToUndoStack(newVal);
      return;
    }
    if (type === 'parentheses_close') {
      const newVal = isNewInput || currentInput === '0' ? ')' : `${currentInput})`;
      setCurrentInput(newVal);
      setIsNewInput(false);
      pushToUndoStack(newVal);
      return;
    }

    const val = parseFloat(currentInput);

    if (isNaN(val)) {
      triggerErrorShake();
      return;
    }

    let result = val;
    let desc = '';

    switch (type) {
      case 'sqrt':
        if (val < 0) {
          triggerErrorShake();
          setCurrentInput('Error');
          setIsNewInput(true);
          return;
        }
        result = Math.sqrt(val);
        desc = `√(${currentInput})`;
        break;
      case 'sqr':
        result = val * val;
        desc = `(${currentInput})²`;
        break;
      case 'percent':
        result = val / 100;
        desc = `${currentInput}%`;
        break;
      case 'negate':
        result = -val;
        desc = `negate(${currentInput})`;
        break;
      case 'sin': {
        const angle = isDegreeMode ? (val * Math.PI) / 180 : val;
        result = Math.sin(angle);
        desc = `sin(${currentInput}${isDegreeMode ? '°' : 'rad'})`;
        break;
      }
      case 'cos': {
        const angle = isDegreeMode ? (val * Math.PI) / 180 : val;
        result = Math.cos(angle);
        desc = `cos(${currentInput}${isDegreeMode ? '°' : 'rad'})`;
        break;
      }
      case 'tan': {
        const angle = isDegreeMode ? (val * Math.PI) / 180 : val;
        result = Math.tan(angle);
        desc = `tan(${currentInput}${isDegreeMode ? '°' : 'rad'})`;
        break;
      }
      case 'ln':
        if (val <= 0) {
          triggerErrorShake();
          setCurrentInput('Error');
          setIsNewInput(true);
          return;
        }
        result = Math.log(val);
        desc = `ln(${currentInput})`;
        break;
      case 'log':
        if (val <= 0) {
          triggerErrorShake();
          setCurrentInput('Error');
          setIsNewInput(true);
          return;
        }
        result = Math.log10(val);
        desc = `log(${currentInput})`;
        break;
      case 'exp':
        result = Math.exp(val);
        desc = `e^(${currentInput})`;
        break;
      case 'pow10':
        result = Math.pow(10, val);
        desc = `10^(${currentInput})`;
        break;
      case 'cube':
        result = val * val * val;
        desc = `(${currentInput})³`;
        break;
      case 'abs':
        result = Math.abs(val);
        desc = `abs(${currentInput})`;
        break;
      case 'factorial': {
        const fact = (n: number): number => {
          if (n < 0 || !Number.isInteger(n)) return NaN;
          if (n === 0 || n === 1) return 1;
          let r = 1;
          for (let i = 2; i <= n; i++) r *= i;
          return r;
        };
        const factResult = fact(val);
        if (isNaN(factResult)) {
          triggerErrorShake();
          setCurrentInput('Error');
          setIsNewInput(true);
          return;
        }
        result = factResult;
        desc = `(${currentInput})!`;
        break;
      }
    }

    const formatted = formatNumber(result);
    setCurrentInput(formatted);
    setFormula(desc);
    setIsNewInput(true);
    setLastAction(`Applied ${type.toUpperCase()}`);
    pushToUndoStack(formatted);
  };

  // Memory functions
  const handleMemory = (type: 'MC' | 'MR' | 'M+' | 'M-') => {
    triggerAudio('operator');
    setWaveIntensity(0.6);
    const val = parseFloat(currentInput);

    switch (type) {
      case 'MC':
        setMemory(0);
        setLastAction('Memory Cleared');
        break;
      case 'MR':
        setCurrentInput(formatNumber(memory));
        setIsNewInput(true);
        setLastAction('Memory Recalled');
        pushToUndoStack(formatNumber(memory));
        break;
      case 'M+':
        if (!isNaN(val)) {
          setMemory((prev) => prev + val);
          setIsNewInput(true);
          setLastAction('Value Added to Memory');
        }
        break;
      case 'M-':
        if (!isNaN(val)) {
          setMemory((prev) => prev - val);
          setIsNewInput(true);
          setLastAction('Value Subtracted from Memory');
        }
        break;
    }
  };

  // Handle insertion of scientific constants
  const handleConstant = (type: 'pi' | 'e' | 'tau' | 'phi' | 'ans' | 'rand') => {
    triggerAudio('number');
    setWaveIntensity(Math.min(waveIntensity + 0.25, 0.9));
    
    let value = 0;
    switch (type) {
      case 'pi':
        value = Math.PI;
        break;
      case 'e':
        value = Math.E;
        break;
      case 'tau':
        value = Math.PI * 2;
        break;
      case 'phi':
        value = 1.618033988749895;
        break;
      case 'ans':
        value = history.length > 0 ? parseFloat(history[0].result.replace(/,/g, '')) : 0;
        if (isNaN(value)) value = 0;
        break;
      case 'rand':
        value = Math.random();
        break;
    }
    
    const formatted = formatNumber(value);
    const newVal = isNewInput || currentInput === '0' ? formatted : currentInput + formatted;
    setCurrentInput(newVal);
    setFormula(
      type === 'pi' ? 'π' : 
      type === 'e' ? 'e' : 
      type === 'tau' ? 'τ' : 
      type === 'phi' ? 'φ' : 
      type === 'ans' ? 'ans' : 'rand'
    );
    setIsNewInput(false);
    setLastAction(`Constant ${type.toUpperCase()} inserted`);
    pushToUndoStack(newVal);
  };

  const handleNaturalCalc = async () => {
    if (!naturalInput.trim()) return;
    setIsNaturalLoading(true);
    triggerAudio('operator');
    setLastAction('AI parsing...');

    try {
      const response = await fetch('/api/natural-calc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sentence: naturalInput }),
      });

      const data = await response.json();
      if (response.ok && data.expression) {
        // Set the current display string to the expression
        setCurrentInput(data.expression);
        setFormula(naturalInput);
        setIsNewInput(false);
        setLastAction('Parsed by AI!');
        pushToUndoStack(data.expression);
        
        // Show explanation inside companion / toast!
        if (data.explanation) {
          setExplanation(data.explanation);
          setChatMessages((prev) => [
            ...prev,
            { role: 'user', content: `Solve in natural language: ${naturalInput}` },
            { role: 'model', content: `**AI Translation:** \`${data.expression}\`\n\n**Step Explanation:** ${data.explanation}` }
          ]);
          // Open the AI companion panel automatically to show Sparky's conversational result explanation!
          setShowCompanion(true);
        }
        
        // Trigger calculation evaluation!
        setTimeout(() => {
          handleEquals();
        }, 100);
      } else {
        setLastAction('AI error');
        triggerErrorShake();
        setCurrentInput('Error: AI parsing failed');
      }
    } catch (err) {
      console.error(err);
      setLastAction('AI error');
      triggerErrorShake();
      setCurrentInput('Error: AI network error');
    } finally {
      setIsNaturalLoading(false);
    }
  };

  const startVoiceToText = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setLastAction('Speech not supported');
      triggerErrorShake();
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListeningSpeech(true);
      triggerAudio('operator');
      setLastAction('Listening to voice...');
    };

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setNaturalInput(speechToText);
      setLastAction('Voice received!');
      triggerAudio('number');
    };

    recognition.onerror = (event: any) => {
      console.error(event.error);
      setIsListeningSpeech(false);
      setLastAction('Voice error');
      triggerErrorShake();
    };

    recognition.onend = () => {
      setIsListeningSpeech(false);
    };

    recognition.start();
  };

  // Download calculation history as a JSON file
  const handleDownloadHistory = () => {
    try {
      triggerAudio('operator');
      setLastAction('History Download Initiated');
      
      const fileData = history.map(item => ({
        id: item.id,
        expression: item.expression,
        result: item.result,
        timestamp: item.timestamp
      }));
      
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fileData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `calculator_history_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setLastAction('Downloaded history JSON!');
    } catch (error) {
      console.error('Failed to download history', error);
      setLastAction('Download failed');
    }
  };

  // Fetch trend line data for the last 10 calculations
  const getTrendData = () => {
    const last10 = [...history].slice(0, 10).reverse();
    return last10.map((item, index) => {
      let val = parseFloat(item.result.replace(/,/g, ''));
      if (isNaN(val)) val = 0;
      return {
        index: index + 1,
        expression: item.expression,
        value: val,
        displayResult: item.result
      };
    });
  };

  // Fuzzy search matching function for unit labels
  const fuzzyMatch = (text: string | undefined | null, query: string | undefined | null): { matches: boolean; highlightedHtml: string } => {
    const safeText = typeof text === 'string' ? text : '';
    const safeQuery = typeof query === 'string' ? query : '';

    if (!safeQuery) {
      return { matches: true, highlightedHtml: safeText };
    }
    const cleanQuery = safeQuery.toLowerCase().trim();
    if (!cleanQuery) {
      return { matches: true, highlightedHtml: safeText };
    }

    const textLower = safeText.toLowerCase();
    
    // Check if exact substring match first for a cleaner visual highlight
    const index = textLower.indexOf(cleanQuery);
    if (index !== -1) {
      const part1 = safeText.substring(0, index);
      const part2 = safeText.substring(index, index + cleanQuery.length);
      const part3 = safeText.substring(index + cleanQuery.length);
      return {
        matches: true,
        highlightedHtml: `${part1}<span class="text-yellow-400 font-bold underline bg-yellow-500/20 rounded px-0.5">${part2}</span>${part3}`
      };
    }

    // Otherwise, check if characters exist sequentially in order (fuzzy match)
    let htmlResult = '';
    let lastFoundIdx = -1;
    let isFuzzyMatch = true;

    for (let i = 0; i < cleanQuery.length; i++) {
      const char = cleanQuery[i];
      const foundIdx = textLower.indexOf(char, lastFoundIdx + 1);
      if (foundIdx === -1) {
        isFuzzyMatch = false;
        break;
      }
      lastFoundIdx = foundIdx;
    }

    if (isFuzzyMatch) {
      // Reconstruct the text highlighting matching chars
      let currentQueryCharIdx = 0;
      for (let j = 0; j < safeText.length; j++) {
        const textChar = safeText[j];
        if (currentQueryCharIdx < cleanQuery.length && textChar.toLowerCase() === cleanQuery[currentQueryCharIdx]) {
          htmlResult += `<span class="text-yellow-400 font-bold underline bg-yellow-500/20 rounded px-0.5">${textChar}</span>`;
          currentQueryCharIdx++;
        } else {
          htmlResult += textChar;
        }
      }
      return { matches: true, highlightedHtml: htmlResult };
    }

    return { matches: false, highlightedHtml: safeText };
  };

  // Unit conversion configuration and calculation
  const LENGTH_UNITS = [
    { value: 'm', label: 'Meters (m)', ratio: 1 },
    { value: 'ft', label: 'Feet (ft)', ratio: 0.3048 },
    { value: 'in', label: 'Inches (in)', ratio: 0.0254 },
    { value: 'cm', label: 'Centimeters (cm)', ratio: 0.01 },
    { value: 'km', label: 'Kilometers (km)', ratio: 1000 },
    { value: 'mi', label: 'Miles (mi)', ratio: 1609.344 }
  ];

  const getConverterResult = (): string => {
    const numericVal = parseFloat(converterVal);
    if (isNaN(numericVal)) return '0';
    
    const fromFactor = LENGTH_UNITS.find(u => u.value === converterFrom)?.ratio || 1;
    const toFactor = LENGTH_UNITS.find(u => u.value === converterTo)?.ratio || 1;
    
    const inMeters = numericVal * fromFactor;
    const converted = inMeters / toFactor;
    
    if (isNaN(converted)) return 'Error';
    if (!isFinite(converted)) return 'Infinity';
    
    const str = converted.toString();
    if (str.includes('.') && str.split('.')[1].length > 6) {
      return parseFloat(converted.toFixed(6)).toString();
    }
    return str;
  };

  const handleLoadConverterResult = () => {
    const res = getConverterResult();
    triggerAudio('number');
    setWaveIntensity(0.6);
    setCurrentInput(res);
    setFormula(`${converterVal}${converterFrom} ➔ ${res}${converterTo}`);
    setIsNewInput(true);
    setLastAction('Loaded conversion to LCD');
  };

  const handleUnitShortcut = (type: string) => {
    const num = parseFloat(currentInput);
    if (isNaN(num)) {
      triggerAudio('error');
      setLastAction('Error: Enter a valid number first');
      return;
    }

    let result = 0;
    let desc = '';
    let unitFrom = '';
    let unitTo = '';

    switch (type) {
      case 'in_to_cm':
        result = num * 2.54;
        unitFrom = 'in';
        unitTo = 'cm';
        desc = `${num} ${unitFrom} ➔ ${parseFloat(result.toFixed(4))} ${unitTo}`;
        break;
      case 'cm_to_in':
        result = num / 2.54;
        unitFrom = 'cm';
        unitTo = 'in';
        desc = `${num} ${unitFrom} ➔ ${parseFloat(result.toFixed(4))} ${unitTo}`;
        break;
      case 'ft_to_m':
        result = num * 0.3048;
        unitFrom = 'ft';
        unitTo = 'm';
        desc = `${num} ${unitFrom} ➔ ${parseFloat(result.toFixed(4))} ${unitTo}`;
        break;
      case 'm_to_ft':
        result = num / 0.3048;
        unitFrom = 'm';
        unitTo = 'ft';
        desc = `${num} ${unitFrom} ➔ ${parseFloat(result.toFixed(4))} ${unitTo}`;
        break;
      case 'mi_to_km':
        result = num * 1.609344;
        unitFrom = 'mi';
        unitTo = 'km';
        desc = `${num} ${unitFrom} ➔ ${parseFloat(result.toFixed(4))} ${unitTo}`;
        break;
      case 'km_to_mi':
        result = num / 1.609344;
        unitFrom = 'km';
        unitTo = 'mi';
        desc = `${num} ${unitFrom} ➔ ${parseFloat(result.toFixed(4))} ${unitTo}`;
        break;
      case 'lbs_to_kg':
        result = num * 0.45359237;
        unitFrom = 'lbs';
        unitTo = 'kg';
        desc = `${num} ${unitFrom} ➔ ${parseFloat(result.toFixed(4))} ${unitTo}`;
        break;
      case 'kg_to_lbs':
        result = num / 0.45359237;
        unitFrom = 'kg';
        unitTo = 'lbs';
        desc = `${num} ${unitFrom} ➔ ${parseFloat(result.toFixed(4))} ${unitTo}`;
        break;
      case 'c_to_f':
        result = (num * 9/5) + 32;
        unitFrom = '°C';
        unitTo = '°F';
        desc = `${num}${unitFrom} ➔ ${parseFloat(result.toFixed(4))}${unitTo}`;
        break;
      case 'f_to_c':
        result = (num - 32) * 5/9;
        unitFrom = '°F';
        unitTo = '°C';
        desc = `${num}${unitFrom} ➔ ${parseFloat(result.toFixed(4))}${unitTo}`;
        break;
      case 'usd_to_eur':
        result = num * 0.92;
        unitFrom = 'USD';
        unitTo = 'EUR';
        desc = `$${num} ➔ €${parseFloat(result.toFixed(2))}`;
        break;
      case 'eur_to_usd':
        result = num * 1.09;
        unitFrom = 'EUR';
        unitTo = 'USD';
        desc = `€${num} ➔ $${parseFloat(result.toFixed(2))}`;
        break;
      case 'usd_to_gbp':
        result = num * 0.78;
        unitFrom = 'USD';
        unitTo = 'GBP';
        desc = `$${num} ➔ £${parseFloat(result.toFixed(2))}`;
        break;
      case 'gbp_to_usd':
        result = num * 1.28;
        unitFrom = 'GBP';
        unitTo = 'USD';
        desc = `£${num} ➔ $${parseFloat(result.toFixed(2))}`;
        break;
      case 'eur_to_gbp':
        result = num * 0.85;
        unitFrom = 'EUR';
        unitTo = 'GBP';
        desc = `€${num} ➔ £${parseFloat(result.toFixed(2))}`;
        break;
      case 'gbp_to_eur':
        result = num * 1.18;
        unitFrom = 'GBP';
        unitTo = 'EUR';
        desc = `£${num} ➔ €${parseFloat(result.toFixed(2))}`;
        break;
      default:
        return;
    }

    triggerAudio('equals');
    const formattedResult = parseFloat(result.toFixed(6)).toString();
    setCurrentInput(formattedResult);
    setFormula(desc);
    setIsNewInput(true);
    setWaveIntensity(0.8);
    setLastAction(`Converted ${desc}`);

    const newItem: HistoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      expression: `${num} ${unitFrom} ➔ ${unitTo}`,
      result: formattedResult,
      timestamp: new Date()
    };
    saveHistory([newItem, ...history]);
    setShowUnitPopup(false);
  };

  // Dynamic formatting of results (limits floating point issues)
  const formatNumber = (num: number): string => {
    if (isNaN(num)) return 'Error';
    if (!isFinite(num)) return 'Infinity';
    
    // If value is too big, use scientific notation
    if (Math.abs(num) > 1e12) {
      return num.toExponential(6);
    }
    
    // Avoid floating point inaccuracies like 0.1 + 0.2 = 0.30000000000000004
    const str = num.toString();
    if (str.includes('.') && str.split('.')[1].length > 8) {
      return parseFloat(num.toFixed(8)).toString();
    }
    
    return str;
  };

  // Trigger keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent standard browser actions for calculator keys ONLY if not typing in other inputs
      const isInputFocused = document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA';
      
      if (isInputFocused) {
        return;
      }

      // Undo/Redo & Clear-history (Global key combos)
      const isCtrl = e.ctrlKey || e.metaKey;
      
      // Command Palette (Ctrl/Cmd + K) & Sidebar (Ctrl/Cmd + B)
      if (isCtrl && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
        return;
      }
      if (isCtrl && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarOpen(prev => !prev);
        return;
      }

      if (isCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
        return;
      }
      if (isCtrl && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }
      if (isCtrl && e.shiftKey && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        clearHistory();
        setLastAction('History Cleared');
        return;
      }

      if (['/', '*', '-', '+', 'Enter', 'Backspace', 'Escape', '(', ')'].includes(e.key)) {
        e.preventDefault();
      }

      const key = e.key;

      // Map physical keyboard keys to DOM elements IDs to trigger bursts
      let targetId = '';
      if (key >= '0' && key <= '9') {
        targetId = `btn-${key}`;
        handleDigit(key);
      } else if (key === '.') {
        targetId = 'btn-dot';
        handleDigit('.');
      } else if (key === '+') {
        targetId = 'btn-plus';
        handleOperator('+');
      } else if (key === '-') {
        targetId = 'btn-minus';
        handleOperator('-');
      } else if (key === '*') {
        targetId = 'btn-multiply';
        handleOperator('×');
      } else if (key === '/') {
        targetId = 'btn-divide';
        handleOperator('÷');
      } else if (key === '^') {
        targetId = 'btn-sqr';
        handleSpecial('sqr');
      } else if (key === '(') {
        targetId = 'btn-parentheses-open';
        handleSpecial('parentheses_open');
      } else if (key === ')') {
        targetId = 'btn-parentheses-close';
        handleSpecial('parentheses_close');
      } else if (key === 'Enter' || key === '=') {
        targetId = 'btn-equals';
        handleEquals();
      } else if (key === 'Backspace') {
        targetId = 'btn-backspace';
        handleBackspace();
      } else if (key === 'Escape') {
        targetId = 'btn-ac';
        handleClear();
      } else if (key === '%') {
        targetId = 'btn-percent';
        handleSpecial('percent');
      } else if (key.toLowerCase() === 'p') {
        targetId = 'btn-const-pi';
        handleConstant('pi');
      } else if (key.toLowerCase() === 'e') {
        targetId = 'btn-const-e';
        handleConstant('e');
      }

      if (targetId) {
        // Highlight active keys and trigger click sounds
        triggerButtonFeedback(targetId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentInput, previousValue, operation, isNewInput, themeId, soundEnabled, memory, undoStack, undoIndex, history]);

  const clearHistory = () => {
    saveHistory([]);
    triggerAudio('clear');
  };

  const loadHistoryItem = (item: HistoryItem) => {
    triggerAudio('number');
    setCurrentInput(item.result);
    setFormula(item.expression);
    setIsNewInput(true);
    setLastAction('Loaded from history');
  };

  const isDark = themeId !== 'aurora';

  // Pronounced keypad buttons with spring animations using Framer Motion
  const KeypadButton = ({ 
    id, 
    onClick, 
    className, 
    children, 
    title 
  }: { 
    id: string; 
    onClick: () => void; 
    className: string; 
    children: React.ReactNode; 
    title?: string;
  }) => {
    return (
      <motion.button
        id={id}
        onClick={onClick}
        className={`${className} focus:outline-none`}
        title={title}
        whileHover={{ scale: 1.04, y: -1 }}
        whileTap={{ 
          scale: 0.95, 
          y: 0.5,
          boxShadow: `0 0 20px ${currentTheme.accentColor}55, inset 0 0 10px rgba(255, 255, 255, 0.25)`,
          textShadow: `0 0 8px ${currentTheme.accentColor}`
        }}
        animate={activeButtonId === id ? { 
          scale: 0.95, 
          y: 0.5, 
          boxShadow: `0 0 20px ${currentTheme.accentColor}55, inset 0 0 10px rgba(255, 255, 255, 0.25)`,
          filter: 'brightness(1.2)' 
        } : { 
          scale: 1, 
          y: 0, 
          boxShadow: 'none',
          filter: 'brightness(1)' 
        }}
        transition={{ 
          type: "spring", 
          stiffness: 550, 
          damping: 14,
          mass: 0.7
        }}
      >
        {children}
      </motion.button>
    );
  };

  return (
    <div className={`min-h-screen ${currentTheme.bgColor} flex flex-col relative overflow-x-hidden`} id="app-root">
      {/* Background Interactive Canvas for particles */}
      <ParticlesCanvas ref={particlesRef} />

      {/* Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectSection={(sec) => {
          setActiveSection(sec);
          setIsSidebarOpen(true);
        }}
        onInsertToCalculator={handleInsertToCalculator}
        history={history}
        workspaces={workspaces}
        onSelectWorkspace={(id) => setCurrentWorkspaceId(id)}
      />

      {/* Global Header */}
      <Header
        workspaces={workspaces}
        currentWorkspace={currentWorkspace}
        onSelectWorkspace={(id) => setCurrentWorkspaceId(id)}
        onCreateWorkspace={handleCreateWorkspace}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        sidebarOpen={isSidebarOpen}
        themeId={themeId}
        onSelectTheme={(t) => setThemeId(t)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:flex-row w-full max-w-[1600px] mx-auto relative z-20 overflow-hidden" id="main-container">
        
        {/* Central Stage: Main Calculator */}
        <main className="flex-1 flex flex-col items-center justify-start p-4 lg:p-6 overflow-y-auto" id="calculator-stage">
          
          {/* Dynamic Notification Bubble */}
          <AnimatePresence mode="wait">
            {lastAction && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 0.8, y: 0 }}
                exit={{ opacity: 0 }}
                onAnimationComplete={() => {
                  setTimeout(() => setLastAction(''), 1500);
                }}
                className="mb-3 px-3 py-1 text-xs font-mono rounded bg-white/5 border border-white/10 text-white/60 tracking-wider flex items-center gap-1.5 select-none animate-pulse"
                id="action-notifier"
              >
                <Sparkles size={11} className={currentTheme.textColor.accent} />
                {lastAction}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Calculator Card */}
          <div 
            id="calculator-body" 
            className={`${currentTheme.calculatorBg} max-w-md w-full shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden border border-white/10`}
          >
            {/* Graphic Ambient Light Top Bar */}
            <div className="h-1.5 w-full bg-[linear-gradient(90deg,#06b6d4,#ec4899,#f59e0b,#10b981)] animate-gradient bg-[size:300%_100%]" />

            <div className="p-5 flex flex-col flex-1 h-full" id="calculator-inner">
              
              {/* LCD Screen Display Container */}
              <motion.div 
                className={`${currentTheme.displayBg} relative overflow-hidden`} 
                id="lcd-display"
                animate={isShaking ? {
                  x: [0, -6, 6, -6, 6, -4, 4, 0],
                  transition: { duration: 0.45, ease: "easeInOut" }
                } : {}}
              >
                {/* Modern Glass Reflection Overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none rounded-2xl z-20 mix-blend-overlay" />
                <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/15 to-transparent pointer-events-none rounded-t-2xl z-20" />

                {/* Visual Grid Lines overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:100%_6px] pointer-events-none z-0" />
                
                {/* LCD Status Indicators */}
                <div className="w-full flex items-center justify-between mb-2 text-xs font-mono tracking-wider z-10" id="lcd-status">
                  {/* Memory Register status */}
                  <div className="flex items-center gap-1.5" id="memory-status">
                    {memory !== 0 ? (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[10px] animate-pulse">
                        M
                      </span>
                    ) : (
                      <span className="text-white/10 text-[10px]">NO_MEM</span>
                    )}
                    <span className="text-white/20 text-[10px]">R_AUTO</span>
                  </div>

                  <div className="flex items-center gap-1.5 z-10">
                    {/* Explain Button */}
                    <button
                      id="btn-explain-lcd"
                      onClick={() => {
                        setActiveTab('explain');
                        setShowCompanion(true);
                        handleExplainCalc();
                      }}
                      className="p-1.5 rounded-lg hover:bg-white/15 active:scale-90 text-yellow-400 hover:text-yellow-300 transition-all cursor-pointer border border-transparent hover:border-yellow-500/20"
                      title="Explain LCD formula with Sparky"
                    >
                      <Sparkles size={14} />
                    </button>

                    {/* Copy Result Button with Toast Bubble */}
                    <button
                      id="btn-copy-result"
                      onClick={() => {
                        triggerButtonFeedback('btn-copy-result', currentTheme.accentColor);
                        navigator.clipboard.writeText(currentInput);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                        setLastAction('Copied!');
                        triggerAudio('number');
                      }}
                      className="p-1.5 rounded-lg hover:bg-white/15 active:scale-90 text-cyan-400 hover:text-cyan-300 transition-all cursor-pointer border border-transparent hover:border-cyan-500/20 flex items-center justify-center gap-1 relative"
                      title="Copy displayed value to clipboard"
                    >
                      {copied ? <Check size={14} className="text-emerald-400 animate-bounce" /> : <Copy size={14} />}
                      {copied && (
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-emerald-500/95 backdrop-blur text-white text-[10px] px-1.5 py-0.5 rounded font-mono shadow border border-emerald-400/30 whitespace-nowrap z-30 animate-fade-in">
                          Copied ✓
                        </span>
                      )}
                    </button>

                    {/* Tactile Backspace inside LCD */}
                    <button
                      id="btn-backspace"
                      onClick={(e) => {
                        triggerButtonFeedback('btn-backspace', currentTheme.accentColor);
                        handleBackspace();
                      }}
                      className="p-1.5 rounded-lg hover:bg-white/15 active:scale-90 text-white/50 hover:text-white/80 transition-all cursor-pointer border border-transparent hover:border-white/10"
                      title="Backspace"
                    >
                      <Delete size={15} />
                    </button>
                  </div>
                </div>

                {/* Calculation Formula Tape (Upper Line) */}
                <div 
                  className={`${currentTheme.textColor.secondary} mb-1 h-6 w-full text-right overflow-x-auto select-all whitespace-nowrap scrollbar-none z-10`}
                  id="formula-tape"
                >
                  {formula || <span className="opacity-0">0</span>}
                </div>

                {/* Current Value / Final Result (Main Display Area with Smooth Digit Transitions) */}
                <div 
                  className={`${currentTheme.textColor.primary} w-full text-right overflow-x-auto select-all whitespace-nowrap scrollbar-none z-10`}
                  id="main-result"
                  style={{
                    fontSize: currentInput.length > 12 ? '1.8rem' : currentInput.length > 8 ? '2.4rem' : '2.8rem',
                    transition: 'font-size 0.1s ease-in-out'
                  }}
                >
                  <AnimatePresence mode="popLayout">
                    <motion.div
                      key={currentInput}
                      initial={{ opacity: 0, y: 3 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -3 }}
                      transition={{ duration: 0.1, ease: "easeOut" }}
                      className="w-full text-right inline-block font-mono"
                    >
                      {currentInput}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Integrated Glowing Sine Wave - Amazing graphics feedback! */}
                <div className="w-full mt-4 border-t border-white/5 pt-2 z-10" id="lcd-wave-wrapper">
                  <VisualWave intensity={waveIntensity} color={currentTheme.textColor.accent} theme={themeId} />
                </div>
              </motion.div>

              {/* AI Natural Language Input Field (Standard sentence calculation) */}
              <div className="mb-4 relative z-20 px-1" id="natural-lang-container">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Sparkles size={14} className="text-yellow-400 animate-pulse animate-duration-[2000ms]" />
                </div>
                <input
                  id="natural-lang-input"
                  type="text"
                  placeholder="Ask AI: 'twenty five percent of 120 plus 12'..."
                  value={naturalInput}
                  onChange={(e) => setNaturalInput(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') {
                      await handleNaturalCalc();
                    }
                  }}
                  className="w-full pl-9 pr-24 py-2.5 bg-black/40 hover:bg-black/50 focus:bg-black/60 text-xs font-mono rounded-xl border border-white/10 hover:border-white/20 focus:border-yellow-500/40 focus:ring-1 focus:ring-yellow-500/20 text-white outline-none placeholder:text-white/30 transition-all duration-300"
                />
                <div className="absolute inset-y-0 right-1.5 flex items-center gap-1">
                  {/* Voice mic button */}
                  <button
                    id="btn-voice-to-text"
                    onClick={startVoiceToText}
                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                      isListeningSpeech 
                        ? 'bg-red-500/20 border-red-500/40 text-red-400 animate-pulse' 
                        : 'bg-white/5 border-white/5 hover:bg-white/10 text-white/50 hover:text-white/80'
                    }`}
                    title="Speak mathematical sentence"
                  >
                    <Mic size={12} />
                  </button>

                  <button
                    id="btn-submit-natural"
                    onClick={handleNaturalCalc}
                    disabled={isNaturalLoading}
                    className="h-7 px-3 bg-gradient-to-r from-yellow-500/20 to-pink-500/20 hover:from-yellow-500/30 hover:to-pink-500/30 border border-yellow-500/30 hover:border-yellow-500/50 text-yellow-300 rounded-lg text-[10px] font-mono tracking-wider transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    {isNaturalLoading ? (
                      <span className="w-2.5 h-2.5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>SOLVE</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Keypad Layout sliding toggle with Undo/Redo integration */}
              <div className="flex items-center bg-slate-900/85 rounded-xl p-1 mb-3 border border-white/5 gap-1" id="keypad-mode-toggle">
                <button
                  onClick={() => {
                    triggerHapticPulse();
                    setShowScientificKeypad(false);
                    setLastAction('Layout: Standard Keypad');
                  }}
                  className={`flex-1 py-1.5 text-[10px] font-mono font-bold rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                    !showScientificKeypad
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  Standard
                </button>
                <button
                  onClick={() => {
                    triggerHapticPulse();
                    setShowScientificKeypad(true);
                    setLastAction('Layout: Scientific Keypad');
                  }}
                  className={`flex-1 py-1.5 text-[10px] font-mono font-bold rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                    showScientificKeypad
                      ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30 shadow-[0_0_15px_rgba(236,72,153,0.1)]'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  Scientific
                </button>

                {/* Vertical Separator */}
                <div className="w-[1px] h-4 bg-white/10 mx-1" />

                {/* Undo Button */}
                <button
                  id="btn-undo-ui"
                  onClick={() => {
                    triggerHapticPulse();
                    handleUndo();
                  }}
                  disabled={undoIndex <= 0}
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                    undoIndex > 0
                      ? 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:text-white'
                      : 'border-transparent text-white/20 cursor-not-allowed opacity-50'
                  }`}
                  title="Undo last input (Ctrl+Z)"
                >
                  <Undo2 size={13} />
                </button>

                {/* Redo Button */}
                <button
                  id="btn-redo-ui"
                  onClick={() => {
                    triggerHapticPulse();
                    handleRedo();
                  }}
                  disabled={undoIndex >= undoStack.length - 1}
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                    undoIndex < undoStack.length - 1
                      ? 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:text-white'
                      : 'border-transparent text-white/20 cursor-not-allowed opacity-50'
                  }`}
                  title="Redo input (Ctrl+Y)"
                >
                  <Redo2 size={13} />
                </button>
              </div>

              {/* Memory Command Rails */}
              <div className="grid grid-cols-4 gap-2 mb-3" id="memory-grid">
                {(['MC', 'MR', 'M+', 'M-'] as const).map((memOp) => (
                  <KeypadButton
                    key={memOp}
                    id={`btn-mem-${memOp.toLowerCase()}`}
                    onClick={() => {
                      triggerButtonFeedback(`btn-mem-${memOp.toLowerCase()}`);
                      handleMemory(memOp);
                    }}
                    className="bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-white/60 font-mono text-xs rounded-xl py-2 flex justify-center items-center transition-all duration-150 cursor-pointer"
                  >
                    {memOp}
                  </KeypadButton>
                ))}
              </div>

              {/* Scientific Constants Row */}
              <div className="grid grid-cols-4 gap-2 mb-3" id="constants-grid">
                <KeypadButton
                  id="btn-const-pi"
                  onClick={() => {
                    triggerButtonFeedback('btn-const-pi', currentTheme.accentColor);
                    handleConstant('pi');
                  }}
                  className="bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-cyan-400 font-mono text-xs rounded-xl py-2 flex justify-center items-center transition-all duration-150 cursor-pointer"
                  title="Pi constant (π)"
                >
                  π
                </KeypadButton>
                <KeypadButton
                  id="btn-const-e"
                  onClick={() => {
                    triggerButtonFeedback('btn-const-e', currentTheme.accentColor);
                    handleConstant('e');
                  }}
                  className="bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-cyan-400 font-mono text-xs rounded-xl py-2 flex justify-center items-center transition-all duration-150 cursor-pointer"
                  title="Euler's constant (e)"
                >
                  e
                </KeypadButton>
                <KeypadButton
                  id="btn-const-tau"
                  onClick={() => {
                    triggerButtonFeedback('btn-const-tau', currentTheme.accentColor);
                    handleConstant('tau');
                  }}
                  className="bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-cyan-400/85 font-mono text-xs rounded-xl py-2 flex justify-center items-center transition-all duration-150 cursor-pointer"
                  title="Tau constant (τ = 2π)"
                >
                  τ
                </KeypadButton>
                <KeypadButton
                  id="btn-const-phi"
                  onClick={() => {
                    triggerButtonFeedback('btn-const-phi', currentTheme.accentColor);
                    handleConstant('phi');
                  }}
                  className="bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-cyan-400/85 font-mono text-xs rounded-xl py-2 flex justify-center items-center transition-all duration-150 cursor-pointer"
                  title="Golden Ratio constant (φ)"
                >
                  φ
                </KeypadButton>
              </div>

              {/* Primary Keypad Grid */}
              {!showScientificKeypad ? (
                <div className="grid grid-cols-4 gap-2.5 flex-1" id="keypad-grid">
                
                {/* Row 1: AC, Scientific, division */}
                <KeypadButton
                  id="btn-ac"
                  onClick={() => {
                    triggerButtonFeedback('btn-ac', '#ef4444');
                    handleClear();
                  }}
                  className={`${currentTheme.buttonClass.special}`}
                >
                  AC
                </KeypadButton>
                <KeypadButton
                  id="btn-sqrt"
                  onClick={() => {
                    triggerButtonFeedback('btn-sqrt');
                    handleSpecial('sqrt');
                  }}
                  className={`${currentTheme.buttonClass.special}`}
                  title="Square Root"
                >
                  √
                </KeypadButton>
                <KeypadButton
                  id="btn-sqr"
                  onClick={() => {
                    triggerButtonFeedback('btn-sqr');
                    handleSpecial('sqr');
                  }}
                  className={`${currentTheme.buttonClass.special}`}
                  title="Square"
                >
                  x²
                </KeypadButton>
                <KeypadButton
                  id="btn-divide"
                  onClick={() => {
                    triggerButtonFeedback('btn-divide', currentTheme.accentColor);
                    handleOperator('÷');
                  }}
                  className={`${currentTheme.buttonClass.operator}`}
                >
                  ÷
                </KeypadButton>

                {/* Row 2: 7, 8, 9, Multiply */}
                <KeypadButton
                  id="btn-7"
                  onClick={() => {
                    triggerButtonFeedback('btn-7');
                    handleDigit('7');
                  }}
                  className={`${currentTheme.buttonClass.number}`}
                >
                  7
                </KeypadButton>
                <KeypadButton
                  id="btn-8"
                  onClick={() => {
                    triggerButtonFeedback('btn-8');
                    handleDigit('8');
                  }}
                  className={`${currentTheme.buttonClass.number}`}
                >
                  8
                </KeypadButton>
                <KeypadButton
                  id="btn-9"
                  onClick={() => {
                    triggerButtonFeedback('btn-9');
                    handleDigit('9');
                  }}
                  className={`${currentTheme.buttonClass.number}`}
                >
                  9
                </KeypadButton>
                <KeypadButton
                  id="btn-multiply"
                  onClick={() => {
                    triggerButtonFeedback('btn-multiply', currentTheme.accentColor);
                    handleOperator('×');
                  }}
                  className={`${currentTheme.buttonClass.operator}`}
                >
                  ×
                </KeypadButton>

                {/* Row 3: 4, 5, 6, Subtract */}
                <KeypadButton
                  id="btn-4"
                  onClick={() => {
                    triggerButtonFeedback('btn-4');
                    handleDigit('4');
                  }}
                  className={`${currentTheme.buttonClass.number}`}
                >
                  4
                </KeypadButton>
                <KeypadButton
                  id="btn-5"
                  onClick={() => {
                    triggerButtonFeedback('btn-5');
                    handleDigit('5');
                  }}
                  className={`${currentTheme.buttonClass.number}`}
                >
                  5
                </KeypadButton>
                <KeypadButton
                  id="btn-6"
                  onClick={() => {
                    triggerButtonFeedback('btn-6');
                    handleDigit('6');
                  }}
                  className={`${currentTheme.buttonClass.number}`}
                >
                  6
                </KeypadButton>
                <KeypadButton
                  id="btn-minus"
                  onClick={() => {
                    triggerButtonFeedback('btn-minus', currentTheme.accentColor);
                    handleOperator('-');
                  }}
                  className={`${currentTheme.buttonClass.operator}`}
                >
                  -
                </KeypadButton>

                {/* Row 4: 1, 2, 3, Add */}
                <KeypadButton
                  id="btn-1"
                  onClick={() => {
                    triggerButtonFeedback('btn-1');
                    handleDigit('1');
                  }}
                  className={`${currentTheme.buttonClass.number}`}
                >
                  1
                </KeypadButton>
                <KeypadButton
                  id="btn-2"
                  onClick={() => {
                    triggerButtonFeedback('btn-2');
                    handleDigit('2');
                  }}
                  className={`${currentTheme.buttonClass.number}`}
                >
                  2
                </KeypadButton>
                <KeypadButton
                  id="btn-3"
                  onClick={() => {
                    triggerButtonFeedback('btn-3');
                    handleDigit('3');
                  }}
                  className={`${currentTheme.buttonClass.number}`}
                >
                  3
                </KeypadButton>
                <KeypadButton
                  id="btn-plus"
                  onClick={() => {
                    triggerButtonFeedback('btn-plus', currentTheme.accentColor);
                    handleOperator('+');
                  }}
                  className={`${currentTheme.buttonClass.operator}`}
                >
                  +
                </KeypadButton>

                {/* Row 5: Plus/Minus, 0, Dot, Equals */}
                <KeypadButton
                  id="btn-negate"
                  onClick={() => {
                    triggerButtonFeedback('btn-negate');
                    handleSpecial('negate');
                  }}
                  className={`${currentTheme.buttonClass.number} text-lg`}
                >
                  +/-
                </KeypadButton>
                <KeypadButton
                  id="btn-0"
                  onClick={() => {
                    triggerButtonFeedback('btn-0');
                    handleDigit('0');
                  }}
                  className={`${currentTheme.buttonClass.number}`}
                >
                  0
                </KeypadButton>
                <KeypadButton
                  id="btn-dot"
                  onClick={() => {
                    triggerButtonFeedback('btn-dot');
                    handleDigit('.');
                  }}
                  className={`${currentTheme.buttonClass.number}`}
                >
                  .
                </KeypadButton>
                <KeypadButton
                  id="btn-equals"
                  onClick={() => {
                    triggerButtonFeedback('btn-equals', '#10b981');
                    handleEquals();
                  }}
                  className={`${currentTheme.buttonClass.operator} bg-emerald-500/25 border-emerald-500/50 hover:bg-emerald-500/35 text-emerald-400 font-bold`}
                >
                  =
                </KeypadButton>
              </div>
              ) : (
                <div className="grid grid-cols-4 gap-1.5 border border-white/5 bg-black/25 rounded-2xl p-2 flex-1 animate-fade-in relative" id="scientific-keypad-grid">
                  {showUnitPopup && (
                    <div 
                      className="absolute inset-x-2 bottom-12 bg-slate-950/95 border border-amber-500/30 shadow-[0_-10px_30px_rgba(245,158,11,0.25)] rounded-2xl p-3 z-30 animate-slide-up backdrop-blur-md flex flex-col"
                      id="unit-popup-overlay"
                    >
                      {/* Popup Header */}
                      <div className="flex items-center justify-between pb-1.5 border-b border-white/10 mb-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1">
                          {unitPopupTab === 'units' ? (
                            <Ruler size={10} className="animate-pulse text-amber-500" />
                          ) : (
                            <Coins size={10} className="animate-pulse text-amber-500" />
                          )}
                          One-Tap Conversion
                        </span>
                        <button
                          onClick={() => {
                            triggerHapticPulse();
                            setShowUnitPopup(false);
                            setLastAction('Unit popup closed');
                          }}
                          className="text-white/40 hover:text-white/80 p-0.5 rounded transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>

                      {/* Display what we're converting */}
                      <div className="text-[9px] font-mono text-white/50 mb-2 flex justify-between bg-black/40 px-2 py-1 rounded">
                        <span>Input: <strong className="text-white">{currentInput}</strong></span>
                        {isNaN(parseFloat(currentInput)) && (
                          <span className="text-rose-400">Enter a number first!</span>
                        )}
                      </div>

                      {/* Tabs */}
                      <div className="grid grid-cols-2 bg-black/50 border border-white/5 p-0.5 rounded-lg mb-2 text-[10px] font-mono gap-1">
                        <button
                          onClick={() => {
                            triggerHapticPulse();
                            setUnitPopupTab('units');
                          }}
                          className={`py-1 rounded-md text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
                            unitPopupTab === 'units'
                              ? 'bg-amber-500/25 text-amber-300 font-bold border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.1)]'
                              : 'text-white/40 hover:text-white/70'
                          }`}
                        >
                          <Ruler size={10} />
                          Units
                        </button>
                        <button
                          onClick={() => {
                            triggerHapticPulse();
                            setUnitPopupTab('currency');
                          }}
                          className={`py-1 rounded-md text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
                            unitPopupTab === 'currency'
                              ? 'bg-amber-500/25 text-amber-300 font-bold border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.1)]'
                              : 'text-white/40 hover:text-white/70'
                          }`}
                        >
                          <Coins size={10} />
                          Currency
                        </button>
                      </div>

                      {/* Grid of conversions */}
                      <div className="grid grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto pr-1 select-none scrollbar-none">
                        {(unitPopupTab === 'units' ? [
                          { id: 'in_to_cm', label: 'in ➔ cm', title: 'Inches to Centimeters', from: 'Inches', to: 'Centimeters' },
                          { id: 'cm_to_in', label: 'cm ➔ in', title: 'Centimeters to Inches', from: 'Centimeters', to: 'Inches' },
                          { id: 'ft_to_m', label: 'ft ➔ m', title: 'Feet to Meters', from: 'Feet', to: 'Meters' },
                          { id: 'm_to_ft', label: 'm ➔ ft', title: 'Meters to Feet', from: 'Meters', to: 'Feet' },
                          { id: 'mi_to_km', label: 'mi ➔ km', title: 'Miles to Kilometers', from: 'Miles', to: 'Kilometers' },
                          { id: 'km_to_mi', label: 'km ➔ mi', title: 'Kilometers to Miles', from: 'Kilometers', to: 'Miles' },
                          { id: 'lbs_to_kg', label: 'lbs ➔ kg', title: 'Pounds to Kilograms', from: 'Pounds', to: 'Kilograms' },
                          { id: 'kg_to_lbs', label: 'kg ➔ lbs', title: 'Kilograms to Pounds', from: 'Kilograms', to: 'Pounds' },
                          { id: 'c_to_f', label: '°C ➔ °F', title: 'Celsius to Fahrenheit', from: 'Celsius', to: 'Fahrenheit' },
                          { id: 'f_to_c', label: '°F ➔ °C', title: 'Fahrenheit to Celsius', from: 'Fahrenheit', to: 'Celsius' },
                        ] : [
                          { id: 'usd_to_eur', label: 'USD ➔ EUR', title: 'USD to EUR', from: 'USD ($)', to: 'EUR (€)' },
                          { id: 'eur_to_usd', label: 'EUR ➔ USD', title: 'EUR to USD', from: 'EUR (€)', to: 'USD ($)' },
                          { id: 'usd_to_gbp', label: 'USD ➔ GBP', title: 'USD to GBP', from: 'USD ($)', to: 'GBP (£)' },
                          { id: 'gbp_to_usd', label: 'GBP ➔ USD', title: 'GBP to USD', from: 'GBP (£)', to: 'USD ($)' },
                          { id: 'eur_to_gbp', label: 'EUR ➔ GBP', title: 'EUR to GBP', from: 'EUR (€)', to: 'GBP (£)' },
                          { id: 'gbp_to_eur', label: 'GBP ➔ EUR', title: 'GBP to EUR', from: 'GBP (£)', to: 'EUR (€)' },
                        ]).map((conv) => (
                          <button
                            key={conv.id}
                            onClick={() => {
                              triggerHapticPulse();
                              handleUnitShortcut(conv.id);
                            }}
                            className="bg-slate-900 hover:bg-slate-800 border border-white/5 hover:border-amber-500/20 text-white hover:text-amber-300 font-mono text-[10px] rounded-lg py-1.5 px-2 text-center transition-all duration-150 cursor-pointer flex flex-col justify-center items-center active:scale-95 group shadow-sm"
                            title={conv.title}
                          >
                            <span className="font-bold">{conv.label}</span>
                            <span className="text-[7px] text-white/30 group-hover:text-amber-400/50 transition-colors uppercase leading-tight font-sans">
                              {conv.from} ➔ {conv.to}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Row 1: sin, cos, tan, AC */}
                  <KeypadButton
                    id="btn-sci-sin"
                    onClick={() => {
                      triggerButtonFeedback('btn-sci-sin');
                      handleSpecial('sin');
                    }}
                    className="bg-slate-800/40 border border-slate-700/30 text-violet-300 font-mono rounded-lg py-2 text-xs flex justify-center items-center cursor-pointer active:scale-95"
                  >
                    sin
                  </KeypadButton>
                  <KeypadButton
                    id="btn-sci-cos"
                    onClick={() => {
                      triggerButtonFeedback('btn-sci-cos');
                      handleSpecial('cos');
                    }}
                    className="bg-slate-800/40 border border-slate-700/30 text-violet-300 font-mono rounded-lg py-2 text-xs flex justify-center items-center cursor-pointer active:scale-95"
                  >
                    cos
                  </KeypadButton>
                  <KeypadButton
                    id="btn-sci-tan"
                    onClick={() => {
                      triggerButtonFeedback('btn-sci-tan');
                      handleSpecial('tan');
                    }}
                    className="bg-slate-800/40 border border-slate-700/30 text-violet-300 font-mono rounded-lg py-2 text-xs flex justify-center items-center cursor-pointer active:scale-95"
                  >
                    tan
                  </KeypadButton>
                  <KeypadButton
                    id="btn-sci-ac"
                    onClick={() => {
                      triggerButtonFeedback('btn-sci-ac', '#ef4444');
                      handleClear();
                    }}
                    className="bg-rose-500/15 border border-rose-500/20 hover:bg-rose-500/25 text-rose-400 font-bold rounded-lg py-2 text-xs flex justify-center items-center cursor-pointer active:scale-95"
                  >
                    AC
                  </KeypadButton>

                  {/* Row 2: ln, log, x^y, ÷ */}
                  <KeypadButton
                    id="btn-sci-ln"
                    onClick={() => {
                      triggerButtonFeedback('btn-sci-ln');
                      handleSpecial('ln');
                    }}
                    className="bg-slate-800/40 border border-slate-700/30 text-violet-300 font-mono rounded-lg py-2 text-xs flex justify-center items-center cursor-pointer active:scale-95"
                  >
                    ln
                  </KeypadButton>
                  <KeypadButton
                    id="btn-sci-log"
                    onClick={() => {
                      triggerButtonFeedback('btn-sci-log');
                      handleSpecial('log');
                    }}
                    className="bg-slate-800/40 border border-slate-700/30 text-violet-300 font-mono rounded-lg py-2 text-xs flex justify-center items-center cursor-pointer active:scale-95"
                  >
                    log
                  </KeypadButton>
                  <KeypadButton
                    id="btn-sci-pow"
                    onClick={() => {
                      triggerButtonFeedback('btn-sci-pow', currentTheme.accentColor);
                      handleOperator('^');
                    }}
                    className="bg-pink-950/20 border border-pink-500/30 text-pink-400 font-mono rounded-lg py-2 text-xs flex justify-center items-center cursor-pointer active:scale-95"
                  >
                    x^y
                  </KeypadButton>
                  <KeypadButton
                    id="btn-sci-divide"
                    onClick={() => {
                      triggerButtonFeedback('btn-sci-divide', currentTheme.accentColor);
                      handleOperator('/');
                    }}
                    className="bg-pink-950/20 border border-pink-500/30 text-pink-400 font-bold rounded-lg py-2 text-xs flex justify-center items-center cursor-pointer active:scale-95"
                  >
                    ÷
                  </KeypadButton>

                  {/* Row 3: e^x, 10^x, x³, × */}
                  <KeypadButton
                    id="btn-sci-exp"
                    onClick={() => {
                      triggerButtonFeedback('btn-sci-exp');
                      handleSpecial('exp');
                    }}
                    className="bg-slate-800/40 border border-slate-700/30 text-cyan-300 font-mono rounded-lg py-2 text-xs flex justify-center items-center cursor-pointer active:scale-95"
                  >
                    e^x
                  </KeypadButton>
                  <KeypadButton
                    id="btn-sci-pow10"
                    onClick={() => {
                      triggerButtonFeedback('btn-sci-pow10');
                      handleSpecial('pow10');
                    }}
                    className="bg-slate-800/40 border border-slate-700/30 text-cyan-300 font-mono rounded-lg py-2 text-xs flex justify-center items-center cursor-pointer active:scale-95"
                  >
                    10^x
                  </KeypadButton>
                  <KeypadButton
                    id="btn-sci-cube"
                    onClick={() => {
                      triggerButtonFeedback('btn-sci-cube');
                      handleSpecial('cube');
                    }}
                    className="bg-slate-800/40 border border-slate-700/30 text-cyan-300 font-mono rounded-lg py-2 text-xs flex justify-center items-center cursor-pointer active:scale-95"
                  >
                    x³
                  </KeypadButton>
                  <KeypadButton
                    id="btn-sci-multiply"
                    onClick={() => {
                      triggerButtonFeedback('btn-sci-multiply', currentTheme.accentColor);
                      handleOperator('*');
                    }}
                    className="bg-pink-950/20 border border-pink-500/30 text-pink-400 font-bold rounded-lg py-2 text-xs flex justify-center items-center cursor-pointer active:scale-95"
                  >
                    ×
                  </KeypadButton>

                  {/* Row 4: DEG/RAD, !, abs, - */}
                  <KeypadButton
                    id="btn-sci-degrad"
                    onClick={() => {
                      triggerButtonFeedback('btn-sci-degrad');
                      setIsDegreeMode(!isDegreeMode);
                      setLastAction(`Mode: ${!isDegreeMode ? 'DEGREES' : 'RADIANS'}`);
                    }}
                    className="bg-slate-800/40 border border-slate-700/30 text-amber-300 font-mono rounded-lg py-2 text-[10px] flex justify-center items-center cursor-pointer active:scale-95"
                  >
                    {isDegreeMode ? 'DEG' : 'RAD'}
                  </KeypadButton>
                  <KeypadButton
                    id="btn-sci-fact"
                    onClick={() => {
                      triggerButtonFeedback('btn-sci-fact');
                      handleSpecial('factorial');
                    }}
                    className="bg-slate-800/40 border border-slate-700/30 text-cyan-300 font-mono rounded-lg py-2 text-xs flex justify-center items-center cursor-pointer active:scale-95"
                  >
                    x!
                  </KeypadButton>
                  <KeypadButton
                    id="btn-sci-abs"
                    onClick={() => {
                      triggerButtonFeedback('btn-sci-abs');
                      handleSpecial('abs');
                    }}
                    className="bg-slate-800/40 border border-slate-700/30 text-cyan-300 font-mono rounded-lg py-2 text-xs flex justify-center items-center cursor-pointer active:scale-95"
                  >
                    abs
                  </KeypadButton>
                  <KeypadButton
                    id="btn-sci-minus"
                    onClick={() => {
                      triggerButtonFeedback('btn-sci-minus', currentTheme.accentColor);
                      handleOperator('-');
                    }}
                    className="bg-pink-950/20 border border-pink-500/30 text-pink-400 font-bold rounded-lg py-2 text-xs flex justify-center items-center cursor-pointer active:scale-95"
                  >
                    -
                  </KeypadButton>

                  {/* Row 5: (, ), Backspace, + */}
                  <KeypadButton
                    id="btn-sci-openparen"
                    onClick={() => {
                      triggerButtonFeedback('btn-sci-openparen');
                      handleDigit('(');
                    }}
                    className="bg-slate-800/40 border border-slate-700/30 text-white/70 font-mono rounded-lg py-2 text-xs flex justify-center items-center cursor-pointer active:scale-95"
                  >
                    (
                  </KeypadButton>
                  <KeypadButton
                    id="btn-sci-closeparen"
                    onClick={() => {
                      triggerButtonFeedback('btn-sci-closeparen');
                      handleDigit(')');
                    }}
                    className="bg-slate-800/40 border border-slate-700/30 text-white/70 font-mono rounded-lg py-2 text-xs flex justify-center items-center cursor-pointer active:scale-95"
                  >
                    )
                  </KeypadButton>
                  <KeypadButton
                    id="btn-sci-backspace"
                    onClick={() => {
                      triggerButtonFeedback('btn-sci-backspace');
                      handleBackspace();
                    }}
                    className="bg-slate-800/40 border border-slate-700/30 text-white/50 rounded-lg py-2 text-xs flex justify-center items-center cursor-pointer active:scale-95"
                  >
                    <Delete size={14} />
                  </KeypadButton>
                  <KeypadButton
                    id="btn-sci-plus"
                    onClick={() => {
                      triggerButtonFeedback('btn-sci-plus', currentTheme.accentColor);
                      handleOperator('+');
                    }}
                    className="bg-pink-950/20 border border-pink-500/30 text-pink-400 font-bold rounded-lg py-2 text-xs flex justify-center items-center cursor-pointer active:scale-95"
                  >
                    +
                  </KeypadButton>

                  {/* Row 6: 7, 8, 9, PLOT */}
                  <KeypadButton
                    id="btn-sci-7"
                    onClick={() => {
                      triggerButtonFeedback('btn-sci-7');
                      handleDigit('7');
                    }}
                    className={`${currentTheme.buttonClass.number} py-2 text-xs`}
                  >
                    7
                  </KeypadButton>
                  <KeypadButton
                    id="btn-sci-8"
                    onClick={() => {
                      triggerButtonFeedback('btn-sci-8');
                      handleDigit('8');
                    }}
                    className={`${currentTheme.buttonClass.number} py-2 text-xs`}
                  >
                    8
                  </KeypadButton>
                  <KeypadButton
                    id="btn-sci-9"
                    onClick={() => {
                      triggerButtonFeedback('btn-sci-9');
                      handleDigit('9');
                    }}
                    className={`${currentTheme.buttonClass.number} py-2 text-xs`}
                  >
                    9
                  </KeypadButton>
                  <KeypadButton
                    id="btn-sci-plot"
                    onClick={() => {
                      triggerButtonFeedback('btn-sci-plot', '#06b6d4');
                      setShowPlot(true);
                      const possibleFunc = currentInput.includes('x') ? currentInput : formula ? formula.split('=')[0].trim() : 'sin(x)';
                      setPlotEquation(possibleFunc || 'sin(x)');
                      setLastAction('Plot Mode Enabled');
                    }}
                    className="bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-mono font-bold rounded-lg py-2 text-xs flex justify-center items-center cursor-pointer active:scale-95 animate-pulse"
                    title="Plot Mathematical Equation"
                  >
                    PLOT
                  </KeypadButton>

                  {/* Row 7: 4, 5, 6, . */}
                  <KeypadButton
                    id="btn-sci-4"
                    onClick={() => {
                      triggerButtonFeedback('btn-sci-4');
                      handleDigit('4');
                    }}
                    className={`${currentTheme.buttonClass.number} py-2 text-xs`}
                  >
                    4
                  </KeypadButton>
                  <KeypadButton
                    id="btn-sci-5"
                    onClick={() => {
                      triggerButtonFeedback('btn-sci-5');
                      handleDigit('5');
                    }}
                    className={`${currentTheme.buttonClass.number} py-2 text-xs`}
                  >
                    5
                  </KeypadButton>
                  <KeypadButton
                    id="btn-sci-6"
                    onClick={() => {
                      triggerButtonFeedback('btn-sci-6');
                      handleDigit('6');
                    }}
                    className={`${currentTheme.buttonClass.number} py-2 text-xs`}
                  >
                    6
                  </KeypadButton>
                  <KeypadButton
                    id="btn-sci-dot"
                    onClick={() => {
                      triggerButtonFeedback('btn-sci-dot');
                      handleDigit('.');
                    }}
                    className={`${currentTheme.buttonClass.number} py-2 text-xs`}
                  >
                    .
                  </KeypadButton>

                  {/* Row 8: 1, 2, 3, = */}
                  <KeypadButton
                    id="btn-sci-1"
                    onClick={() => {
                      triggerButtonFeedback('btn-sci-1');
                      handleDigit('1');
                    }}
                    className={`${currentTheme.buttonClass.number} py-2 text-xs`}
                  >
                    1
                  </KeypadButton>
                  <KeypadButton
                    id="btn-sci-2"
                    onClick={() => {
                      triggerButtonFeedback('btn-sci-2');
                      handleDigit('2');
                    }}
                    className={`${currentTheme.buttonClass.number} py-2 text-xs`}
                  >
                    2
                  </KeypadButton>
                  <KeypadButton
                    id="btn-sci-3"
                    onClick={() => {
                      triggerButtonFeedback('btn-sci-3');
                      handleDigit('3');
                    }}
                    className={`${currentTheme.buttonClass.number} py-2 text-xs`}
                  >
                    3
                  </KeypadButton>
                  <KeypadButton
                    id="btn-sci-equals"
                    onClick={() => {
                      triggerButtonFeedback('btn-sci-equals', '#10b981');
                      handleEquals();
                    }}
                    className={`${currentTheme.buttonClass.operator} bg-emerald-500/25 border-emerald-500/50 hover:bg-emerald-500/35 text-emerald-400 font-bold rounded-lg py-2 text-xs flex justify-center items-center cursor-pointer active:scale-95`}
                  >
                    =
                  </KeypadButton>

                  {/* Row 9: +/- and 0 and UNIT keys */}
                  <KeypadButton
                    id="btn-sci-negate"
                    onClick={() => {
                      triggerButtonFeedback('btn-sci-negate');
                      handleSpecial('negate');
                    }}
                    className={`${currentTheme.buttonClass.number} py-2 text-xs col-span-1`}
                  >
                    +/-
                  </KeypadButton>
                  <KeypadButton
                    id="btn-sci-0"
                    onClick={() => {
                      triggerButtonFeedback('btn-sci-0');
                      handleDigit('0');
                    }}
                    className={`${currentTheme.buttonClass.number} py-2 text-xs col-span-2`}
                  >
                    0
                  </KeypadButton>
                  <KeypadButton
                    id="btn-sci-unit"
                    onClick={() => {
                      triggerButtonFeedback('btn-sci-unit', '#f59e0b');
                      setShowUnitPopup(prev => !prev);
                      setLastAction(showUnitPopup ? 'Unit shortcuts closed' : 'Unit shortcuts opened');
                    }}
                    className="bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-400 font-bold font-mono rounded-lg py-2 text-[10px] flex justify-center items-center cursor-pointer active:scale-95 transition-all shadow-[0_0_10px_rgba(245,158,11,0.05)] col-span-1"
                    title="Toggle Unit Conversion Shortcuts"
                  >
                    <Ruler size={10} className="mr-1 inline-block" />
                    UNIT
                  </KeypadButton>
                </div>
              )}

            </div>
          </div>

          {/* Column 2: Sparky AI Companion Card */}
          <AnimatePresence>
            {showCompanion && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`flex flex-col border rounded-3xl p-5 flex-1 min-h-[500px] max-h-[620px] transition-all duration-300 w-full max-w-md mx-auto lg:mx-0 ${
                  activeMobileView === 'companion' ? 'flex' : 'hidden lg:flex'
                } ${
                  isDark 
                    ? 'bg-slate-900/85 backdrop-blur-xl border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.15)] text-white' 
                    : 'bg-white border-emerald-100/80 shadow-[0_20px_50px_rgba(16,185,129,0.08)] text-slate-800'
                }`}
                id="ai-companion-card"
              >
                {/* Companion Header */}
                <div className="flex items-center justify-between mb-4 border-b pb-3 border-white/5" id="companion-header">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-xl ${isDark ? 'bg-cyan-500/10 text-cyan-400' : 'bg-emerald-100 text-emerald-600'}`}>
                      <Brain size={18} className="animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold tracking-wider uppercase font-mono flex items-center gap-1.5">
                        Sparky Companion
                      </h3>
                      <p className="text-[10px] opacity-50 font-mono">GEMINI MULTI-INTELLIGENCE</p>
                    </div>
                  </div>

                  {/* Reasoning Toggle & Close Button */}
                  <div className="flex items-center gap-2">
                    {activeTab === 'chat' && (
                      <button
                        id="btn-reasoning-toggle"
                        onClick={() => {
                          setIsThinkingMode(!isThinkingMode);
                          triggerAudio('operator');
                          setLastAction(isThinkingMode ? "Reasoning Mode Disabled" : "Reasoning (High Thinking) Mode Enabled");
                        }}
                        className={`px-2 py-1 rounded-lg border text-[10px] font-mono flex items-center gap-1 transition-all ${
                          isThinkingMode
                            ? 'border-pink-500 bg-pink-500/10 text-pink-400 font-bold shadow-[0_0_15px_rgba(236,72,153,0.15)]'
                            : 'border-white/10 hover:border-white/20 text-white/40'
                        }`}
                        title="Toggle High-Thinking Reasoning Mode"
                      >
                        <Cpu size={11} className={isThinkingMode ? 'animate-spin' : ''} />
                        {isThinkingMode ? 'REASONING ON' : 'REASONING OFF'}
                      </button>
                    )}
                    
                    <button
                      id="btn-close-companion"
                      onClick={() => {
                        setShowCompanion(false);
                        triggerAudio('clear');
                      }}
                      className="text-white/40 hover:text-white/70 p-1 cursor-pointer transition-colors"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>

                {/* Tabs Selector */}
                <div className="flex gap-1 bg-black/30 rounded-xl p-1 mb-4 border border-white/5" id="companion-tabs">
                  {(['chat', 'voice', 'explain'] as const).map((tab) => {
                    const isActive = activeTab === tab;
                    return (
                      <button
                        key={tab}
                        id={`companion-tab-${tab}`}
                        onClick={() => {
                          setActiveTab(tab);
                          triggerAudio('operator');
                          if (tab === 'explain') {
                            handleExplainCalc();
                          }
                        }}
                        className={`flex-1 py-1.5 text-[11px] font-mono font-bold rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                          isActive
                            ? (isDark 
                              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/25' 
                              : 'bg-emerald-50 text-emerald-600 border border-emerald-100')
                            : 'text-white/40 hover:text-white/70'
                        }`}
                      >
                        {tab === 'chat' && 'Chat'}
                        {tab === 'voice' && 'Voice'}
                        {tab === 'explain' && 'Explain'}
                      </button>
                    );
                  })}
                </div>

                {/* Tab Contents */}
                <div className="flex-1 flex flex-col overflow-hidden" id="companion-tab-content">
                  {activeTab === 'chat' && (
                    <div className="flex-1 flex flex-col overflow-hidden" id="chat-tab-panel">
                      {/* Messages Area */}
                      <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1 scrollbar-thin scrollbar-thumb-white/10 flex flex-col" id="chat-messages-container">
                        {chatMessages.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`flex flex-col max-w-[85%] rounded-2xl p-3 border text-xs leading-relaxed ${
                              msg.role === 'user'
                                ? `self-end ${isDark ? 'bg-cyan-950/40 border-cyan-500/20 text-cyan-200' : 'bg-emerald-50 border-emerald-100 text-emerald-800'}`
                                : `self-start ${isDark ? 'bg-white/5 border-white/5 text-white/90' : 'bg-slate-50 border-slate-100 text-slate-700'}`
                            }`}
                          >
                            <div className="markdown-body select-text">
                              <Markdown>{msg.content}</Markdown>
                            </div>
                            
                            {/* If message has equations/numbers offer a button to apply to LCD */}
                            {msg.role === 'model' && idx > 0 && (
                              <button
                                onClick={() => {
                                  // Find the first formula block or expression in the text
                                  const expressions = msg.content.match(/[0-9+\-*/()×÷]{3,}/g);
                                  if (expressions && expressions.length > 0) {
                                    loadMathIntoCalculator(expressions[0]);
                                  } else {
                                    loadMathIntoCalculator(msg.content);
                                  }
                                }}
                                className="mt-2 text-[9px] font-mono border border-white/5 hover:border-white/15 bg-white/5 hover:bg-white/10 px-1.5 py-0.5 rounded flex items-center gap-1 w-max self-end text-white/50 hover:text-white/80 transition-all cursor-pointer"
                                title="Load this mathematical content to your calculator display"
                              >
                                <ArrowUpRight size={10} />
                                Apply to LCD
                              </button>
                            )}
                          </div>
                        ))}
                        
                        {isChatLoading && (
                          <div className="self-start bg-white/5 border border-white/5 rounded-2xl p-3 flex items-center gap-2 text-xs text-white/40 font-mono animate-pulse">
                            <Cpu size={12} className="animate-spin text-cyan-400" />
                            {isThinkingMode ? 'Sparky is reasoning (deep thinking)...' : 'Sparky is analyzing...'}
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>

                      {/* Input bar */}
                      <form onSubmit={(e) => { e.preventDefault(); handleSendChat(); }} className="flex gap-2" id="chat-input-form">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder={isThinkingMode ? "Ask a complex math proof..." : "Type math query..."}
                          className={`flex-1 px-3 py-2 text-xs border rounded-xl outline-none transition-all ${
                            isDark 
                              ? 'bg-black/50 border-white/10 text-white focus:border-cyan-500/40' 
                              : 'bg-slate-100 border-slate-200 text-slate-800 focus:border-emerald-400'
                          }`}
                          disabled={isChatLoading}
                          id="chat-text-input"
                        />
                        <button
                          type="submit"
                          disabled={isChatLoading || !chatInput.trim()}
                          className={`p-2 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                            isDark
                              ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30'
                              : 'bg-emerald-500 text-white border-emerald-400 hover:bg-emerald-600'
                          } disabled:opacity-30 disabled:pointer-events-none`}
                          id="btn-send-chat"
                        >
                          <Send size={14} />
                        </button>
                      </form>
                    </div>
                  )}

                  {activeTab === 'voice' && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-4 overflow-hidden" id="voice-tab-panel">
                      {/* Audio Orb Animation */}
                      <div className="relative mb-6" id="audio-orb-container">
                        {/* Animated background rings */}
                        <AnimatePresence>
                          {(voiceStatus === 'listening' || voiceStatus === 'speaking') && (
                            <>
                              <motion.div
                                initial={{ scale: 0.8, opacity: 0.5 }}
                                animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
                                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                                className={`absolute inset-0 rounded-full filter blur-md ${
                                  voiceStatus === 'listening' ? 'bg-cyan-500/30' : 'bg-pink-500/30'
                                }`}
                              />
                              <motion.div
                                initial={{ scale: 0.8, opacity: 0.3 }}
                                animate={{ scale: [1, 2.4, 1], opacity: [0.3, 0, 0.3] }}
                                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut', delay: 0.5 }}
                                className={`absolute inset-0 rounded-full filter blur-lg ${
                                  voiceStatus === 'listening' ? 'bg-cyan-400/20' : 'bg-pink-400/20'
                                }`}
                              />
                            </>
                          )}
                        </AnimatePresence>

                        {/* Center Button Orb */}
                        <button
                          id="btn-voice-microphone"
                          onClick={() => {
                            if (isVoiceConnected) {
                              stopVoiceSession();
                            } else {
                              startVoiceSession();
                            }
                          }}
                          className={`w-20 h-20 rounded-full border flex items-center justify-center shadow-lg transition-all duration-300 relative z-10 cursor-pointer ${
                            isVoiceConnected
                              ? (voiceStatus === 'speaking'
                                ? 'bg-pink-500/20 border-pink-400 shadow-[0_0_30px_rgba(236,72,153,0.3)]'
                                : 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.3)] animate-pulse')
                              : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                          }`}
                        >
                          {isVoiceConnected ? (
                            voiceStatus === 'speaking' ? (
                              <Cpu size={28} className="text-pink-400 animate-spin" />
                            ) : (
                              <Mic size={28} className="text-cyan-400 animate-pulse" />
                            )
                          ) : (
                            <MicOff size={28} className="text-white/40" />
                          )}
                        </button>
                      </div>

                      {/* Status Message */}
                      <div className="space-y-2 max-w-xs" id="voice-status-block">
                        <p className="text-xs font-mono font-bold uppercase tracking-widest text-white/50">
                          {voiceStatus === 'idle' && 'VOICE OFFLINE'}
                          {voiceStatus === 'connecting' && 'CONNECTING SPEECH...'}
                          {voiceStatus === 'listening' && '👂 SPARKY IS LISTENING'}
                          {voiceStatus === 'speaking' && '🗣️ SPARKY IS SPEAKING'}
                          {voiceStatus === 'error' && '❌ VOICE ERROR'}
                        </p>

                        <div className={`text-xs select-text rounded-xl p-3 border font-sans leading-relaxed min-h-[60px] flex items-center justify-center ${
                          isDark ? 'bg-black/25 border-white/5 text-white/75' : 'bg-slate-50 border-slate-100 text-slate-600'
                        }`}>
                          {voiceTranscript || "Press the microphone to start a dynamic voice conversation with Sparky. Ask 'what is five times ten?' or discuss formulas!"}
                        </div>

                        {isVoiceConnected && (
                          <button
                            id="btn-stop-voice"
                            onClick={stopVoiceSession}
                            className="text-[10px] font-mono tracking-wider px-3 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all cursor-pointer mx-auto block"
                          >
                            DISCONNECT
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'explain' && (
                    <div className="flex-1 flex flex-col justify-between" id="explain-tab-panel">
                      <div className={`flex-1 overflow-y-auto rounded-2xl p-4 border text-xs leading-relaxed ${
                        isDark ? 'bg-black/30 border-white/5 text-white/90' : 'bg-slate-50 border-slate-100 text-slate-700'
                      }`} id="explanation-text-container">
                        {isExplainLoading ? (
                          <div className="h-full flex flex-col items-center justify-center text-center gap-2 text-white/40 font-mono animate-pulse" id="explain-loading">
                            <Sparkles size={20} className="animate-spin text-yellow-400" />
                            <span>Asking mathematical gods...</span>
                          </div>
                        ) : explanation ? (
                          <div className="markdown-body select-text" id="explanation-body">
                            <Markdown>{explanation}</Markdown>
                          </div>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-white/30" id="explain-empty">
                            <Lightbulb size={24} className="mb-2 text-yellow-400/50" />
                            <p className="font-mono">No expression explained yet</p>
                            <p className="text-[10px] opacity-75 mt-1">Click the button below or the sparkle inside the LCD to analyze the current math formula conceptually!</p>
                          </div>
                        )}
                      </div>

                      <button
                        id="btn-trigger-explanation"
                        onClick={handleExplainCalc}
                        disabled={isExplainLoading || currentInput === 'Error'}
                        className={`mt-3 w-full py-2 border rounded-xl font-mono text-xs font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          isDark
                            ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20'
                            : 'bg-amber-500 border-amber-400 text-white hover:bg-amber-600'
                        } disabled:opacity-40 disabled:pointer-events-none`}
                      >
                        <Sparkles size={13} />
                        Explain "{formula || currentInput}"
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Column 3: Interactive Side Panels Container (History + Help) */}
          <div 
            className={`flex flex-col gap-4 w-full max-w-sm mx-auto lg:mx-0 lg:w-80 ${
              (activeMobileView === 'history' || activeMobileView === 'converter') ? 'flex' : 'hidden lg:flex'
            }`} 
            id="side-panels"
          >
            {/* History Panel (Glassmorphic) */}
            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-black/30 backdrop-blur-md border border-white/10 rounded-3xl p-5 flex-1 flex flex-col min-h-[300px] max-h-[500px]"
                  id="history-panel"
                >
                  <div className="flex items-center justify-between mb-4" id="history-header">
                    <h3 className="text-sm font-bold tracking-wider text-white/80 uppercase flex items-center gap-1.5 font-mono">
                      <History size={14} className={currentTheme.textColor.accent} />
                      History
                    </h3>
                    
                    {history.length > 0 && (
                      <div className="flex items-center gap-1.5" id="history-actions">
                        {/* Download JSON Button */}
                        <button
                          id="download-history-btn"
                          onClick={handleDownloadHistory}
                          className="text-[10px] text-white/40 hover:text-cyan-400 font-mono tracking-wider hover:border-cyan-500/20 border border-transparent hover:bg-cyan-500/5 rounded-lg px-2 py-1 flex items-center gap-1 cursor-pointer transition-all"
                          title="Download History as JSON"
                        >
                          <Download size={11} />
                          DOWNLOAD
                        </button>

                        <button
                          id="clear-history-btn"
                          onClick={clearHistory}
                          className="text-[10px] text-white/40 hover:text-red-400 font-mono tracking-wider hover:border-red-500/20 border border-transparent hover:bg-red-500/5 rounded-lg px-2 py-1 flex items-center gap-1 cursor-pointer transition-all"
                          title="Clear History Log"
                        >
                          <Trash2 size={11} />
                          CLEAR
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent animate-fade-in" id="history-list">
                    {history.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-white/30" id="empty-history-state">
                        <span className="text-2xl mb-1 select-none">🗂️</span>
                        <p className="text-xs font-mono">Tape is empty</p>
                      </div>
                    ) : (
                      history.map((item) => (
                        <div 
                          key={item.id}
                          id={`history-item-${item.id}`}
                          onClick={() => loadHistoryItem(item)}
                          className="bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl p-3 text-right cursor-pointer group transition-all duration-150 select-none active:scale-[0.98]"
                        >
                          <div className="text-xs text-white/40 font-mono truncate mb-1 group-hover:text-white/60">
                            {item.expression}
                          </div>
                          <div className={`text-base font-bold ${currentTheme.textColor.primary} font-mono truncate`}>
                            {item.result}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Trend Chart Panel (Glassmorphic) */}
            <AnimatePresence>
              {history.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-black/30 backdrop-blur-md border border-white/10 rounded-3xl p-5 flex flex-col"
                  id="trend-chart-panel"
                >
                  <div className="flex items-center justify-between mb-3" id="trend-header">
                    <h3 className="text-sm font-bold tracking-wider text-white/80 uppercase flex items-center gap-1.5 font-mono">
                      <TrendingUp size={14} className={currentTheme.textColor.accent} />
                      Result Trends
                    </h3>
                    <span className="text-[10px] font-mono text-white/40">LAST {Math.min(history.length, 10)} CALCS</span>
                  </div>

                  <div className="h-32 w-full mt-2" id="trend-chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getTrendData()} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                        <XAxis dataKey="index" stroke="rgba(255,255,255,0.2)" fontSize={9} tickLine={false} />
                        <YAxis stroke="rgba(255,255,255,0.2)" fontSize={9} tickLine={false} domain={['auto', 'auto']} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-slate-900/90 border border-white/10 p-2 rounded-xl text-[10px] font-mono shadow-md text-white">
                                  <div className="opacity-50 truncate max-w-[150px]">{data.expression}</div>
                                  <div className="font-bold text-cyan-400 mt-0.5">{data.displayResult}</div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke={currentTheme.accentColor}
                          strokeWidth={2}
                          dot={{ r: 2.5, stroke: currentTheme.accentColor, strokeWidth: 1, fill: '#0c0f17' }}
                          activeDot={{ r: 4.5, stroke: '#fff', strokeWidth: 1, fill: currentTheme.accentColor }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Unit Converter Panel (Glassmorphic) */}
            <AnimatePresence>
              {showConverter && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-black/30 backdrop-blur-md border border-white/10 rounded-3xl p-5 flex flex-col min-h-[300px]"
                  id="converter-panel"
                >
                  <div className="flex items-center justify-between mb-4" id="converter-header">
                    <h3 className="text-sm font-bold tracking-wider text-white/80 uppercase flex items-center gap-1.5 font-mono">
                      <Ruler size={14} className="text-yellow-400 animate-pulse" />
                      Length Converter
                    </h3>
                    
                    <button 
                      id="close-converter-btn"
                      onClick={() => setShowConverter(false)}
                      className="text-white/40 hover:text-white/70 p-1 cursor-pointer transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="flex-1 flex flex-col gap-3.5" id="converter-content">
                    {/* Value Input */}
                    <div className="flex flex-col gap-1.5" id="converter-input-group">
                      <label htmlFor="converter-input-field" className="text-[10px] font-mono tracking-wider text-white/40 uppercase">Value to Convert</label>
                      <input
                        type="number"
                        id="converter-input-field"
                        value={converterVal}
                        onChange={(e) => setConverterVal(e.target.value)}
                        placeholder="Enter value..."
                        className={`w-full px-3 py-2 text-sm border rounded-xl outline-none font-mono transition-all ${
                          isDark 
                            ? 'bg-black/50 border-white/10 text-white focus:border-yellow-500/45' 
                            : 'bg-slate-100 border-slate-200 text-slate-800 focus:border-emerald-400'
                        }`}
                      />
                    </div>

                    {/* Search / Filter Input */}
                    <div className="flex flex-col gap-1.5" id="converter-search-group">
                      <label htmlFor="converter-search-field" className="text-[10px] font-mono tracking-wider text-white/40 uppercase flex items-center gap-1">
                        <Search size={10} className="text-yellow-400" />
                        Search & Filter Units
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="converter-search-field"
                          value={converterSearch}
                          onChange={(e) => setConverterSearch(e.target.value)}
                          placeholder="Type unit code or name (e.g. 'm', 'feet')..."
                          className={`w-full pl-8 pr-8 py-2 text-xs border rounded-xl outline-none font-mono transition-all ${
                            isDark 
                              ? 'bg-black/50 border-white/10 text-white focus:border-yellow-500/45' 
                              : 'bg-slate-100 border-slate-200 text-slate-800 focus:border-emerald-400'
                          }`}
                        />
                        <Search size={12} className="absolute left-2.5 top-3 text-white/30" />
                        {converterSearch && (
                          <button
                            onClick={() => setConverterSearch('')}
                            className="absolute right-2.5 top-2.5 text-white/40 hover:text-white/70 p-0.5 cursor-pointer transition-colors"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Selection Summary / Current Units Display */}
                    <div className="p-2.5 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between" id="converter-current-selection">
                      <div className="flex flex-col text-left">
                        <span className="text-[9px] font-mono tracking-wider text-white/30 uppercase">From</span>
                        <span className="text-xs font-bold text-yellow-400">
                          {LENGTH_UNITS.find(u => u.value === converterFrom)?.label}
                        </span>
                      </div>

                      {/* Quick Swap Button */}
                      <button
                        id="btn-swap-converter-units"
                        onClick={() => {
                          triggerButtonFeedback('btn-swap-converter-units', '#eab308');
                          triggerAudio('operator');
                          const temp = converterFrom;
                          setConverterFrom(converterTo);
                          setConverterTo(temp);
                        }}
                        className="p-1.5 border border-white/10 hover:border-yellow-500/30 bg-white/5 hover:bg-yellow-500/10 rounded-lg text-white/50 hover:text-yellow-400 transition-all cursor-pointer flex items-center justify-center"
                        title="Swap Units"
                      >
                        ⇄
                      </button>

                      <div className="flex flex-col text-right">
                        <span className="text-[9px] font-mono tracking-wider text-white/30 uppercase">To</span>
                        <span className="text-xs font-bold text-emerald-400">
                          {LENGTH_UNITS.find(u => u.value === converterTo)?.label}
                        </span>
                      </div>
                    </div>

                    {/* Scrollable list of fuzzy filtered units */}
                    <div className="flex flex-col gap-1.5 max-h-[170px] overflow-y-auto pr-1" id="converter-units-list">
                      {LENGTH_UNITS.map(unit => {
                        const matchLabel = fuzzyMatch(unit.label, converterSearch);
                        const matchVal = fuzzyMatch(unit.value, converterSearch);
                        const isMatch = matchLabel.matches || matchVal.matches;
                        
                        if (!isMatch && converterSearch.trim() !== '') return null;
                        
                        const isFrom = converterFrom === unit.value;
                        const isTo = converterTo === unit.value;
                        
                        return (
                          <div 
                            key={unit.value}
                            className={`flex items-center justify-between p-2 rounded-xl transition-all border ${
                              isFrom || isTo 
                                ? 'bg-white/10 border-white/20 shadow-sm' 
                                : 'bg-white/5 border-white/5 hover:bg-white/8'
                            }`}
                          >
                            <div className="flex flex-col text-left max-w-[60%]">
                              <span 
                                className="text-xs font-semibold text-white/95 truncate"
                                dangerouslySetInnerHTML={{ __html: matchLabel.highlightedHtml }}
                              />
                              <span 
                                className="text-[9px] font-mono text-white/40 flex items-center gap-1"
                              >
                                Code: <span dangerouslySetInnerHTML={{ __html: matchVal.highlightedHtml }} />
                              </span>
                            </div>
                            
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  setConverterFrom(unit.value);
                                  triggerAudio('operator');
                                }}
                                className={`px-2 py-1 text-[9px] font-mono font-bold tracking-wider rounded-lg transition-all cursor-pointer ${
                                  isFrom
                                    ? 'bg-yellow-500/25 border border-yellow-500/50 text-yellow-400 font-bold'
                                    : 'bg-white/5 border border-transparent text-white/40 hover:text-white/70'
                                }`}
                              >
                                FROM
                              </button>
                              <button
                                onClick={() => {
                                  setConverterTo(unit.value);
                                  triggerAudio('operator');
                                }}
                                className={`px-2 py-1 text-[9px] font-mono font-bold tracking-wider rounded-lg transition-all cursor-pointer ${
                                  isTo
                                    ? 'bg-emerald-500/25 border border-emerald-500/50 text-emerald-400 font-bold'
                                    : 'bg-white/5 border border-transparent text-white/40 hover:text-white/70'
                                }`}
                              >
                                TO
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {LENGTH_UNITS.filter(unit => {
                        const matchLabel = fuzzyMatch(unit.label, converterSearch);
                        const matchVal = fuzzyMatch(unit.value, converterSearch);
                        return matchLabel.matches || matchVal.matches;
                      }).length === 0 && (
                        <div className="text-center py-4 text-xs font-mono text-white/30" id="converter-no-results">
                          No matching units found
                        </div>
                      )}
                    </div>

                    {/* Result Display */}
                    <motion.div 
                      layout
                      className="mt-1 p-3 bg-white/5 border border-white/5 rounded-2xl flex flex-col items-end justify-center text-right font-mono" 
                      id="converter-result-box"
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    >
                      <span className="text-[9px] opacity-40 uppercase tracking-wider">Converted Result</span>
                      <motion.span 
                        layout="position"
                        key={`${converterVal}-${converterFrom}-${converterTo}`}
                        initial={{ opacity: 0.8, y: -2 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xl font-bold text-yellow-400 mt-1 select-all truncate max-w-full"
                      >
                        {getConverterResult()}
                      </motion.span>
                      <motion.span 
                        layout="position"
                        className="text-[10px] opacity-35 mt-0.5"
                      >
                        {LENGTH_UNITS.find(u => u.value === converterTo)?.label.split(' ')[0]}
                      </motion.span>
                    </motion.div>

                    {/* Action button to load to LCD */}
                    <button
                      id="btn-load-converter-lcd"
                      onClick={() => {
                        triggerButtonFeedback('btn-load-converter-lcd', '#eab308');
                        handleLoadConverterResult();
                      }}
                      className={`w-full py-2 border rounded-xl font-mono text-xs font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        isDark
                          ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]'
                          : 'bg-amber-500 border-amber-400 text-white hover:bg-amber-600'
                      }`}
                    >
                      <ArrowUpRight size={13} />
                      LOAD TO CALCULATOR
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Help / Keyboard shortcuts panel (Glassmorphic) */}
            <AnimatePresence>
              {showHelp && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  className="bg-black/35 backdrop-blur-md border border-white/10 rounded-3xl p-5 flex flex-col justify-between"
                  id="help-panel"
                >
                  <div className="flex items-center justify-between mb-3" id="help-header">
                    <h3 className="text-sm font-bold tracking-wider text-white/80 uppercase font-mono flex items-center gap-1.5">
                      ⌨️ Key Bindings
                    </h3>
                    <button 
                      id="close-help-btn"
                      onClick={() => setShowHelp(false)}
                      className="text-white/40 hover:text-white/70 p-1 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs font-mono text-white/50" id="shortcuts-grid">
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span>Numbers</span> <kbd className="px-1.5 bg-white/10 rounded text-white font-bold">0-9</kbd>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span>Decimal</span> <kbd className="px-1.5 bg-white/10 rounded text-white font-bold">.</kbd>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span>Add / Sub</span> <kbd className="px-1.5 bg-white/10 rounded text-white font-bold">+</kbd> <kbd className="px-1.5 bg-white/10 rounded text-white font-bold">-</kbd>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span>Mult / Div</span> <kbd className="px-1.5 bg-white/10 rounded text-white font-bold">*</kbd> <kbd className="px-1.5 bg-white/10 rounded text-white font-bold">/</kbd>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span>Evaluate</span> <kbd className="px-1.5 bg-white/10 rounded text-white font-bold">Enter</kbd>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span>All Clear</span> <kbd className="px-1.5 bg-white/10 rounded text-white font-bold">Esc</kbd>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span>Backspace</span> <kbd className="px-1.5 bg-white/10 rounded text-white font-bold">←</kbd>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span>Percent</span> <kbd className="px-1.5 bg-white/10 rounded text-white font-bold">%</kbd>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Aesthetic Stats / Graphic Badge Container to make graphics look even more premium */}
            <div className="bg-black/20 backdrop-blur-sm border border-white/5 rounded-3xl p-4 flex items-center justify-between shadow-sm" id="graphic-badge">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400" id="badge-icon">
                  <TrendingUp size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-mono text-white/40 tracking-wider">GRAPHICS ACCELERATED</h4>
                  <p className="text-xs font-semibold text-white/85">60 FPS Particle Canvas</p>
                </div>
              </div>
              <div className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-mono animate-pulse" id="gpu-status">
                WEB_GL
              </div>
            </div>

          </div>
        </main>

        {/* Intelligence Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          activeSection={activeSection}
          onSelectSection={(sec) => setActiveSection(sec)}
          onInsertToCalculator={handleInsertToCalculator}
          currentInput={currentInput}
          history={history}
          onToggleStar={(id) => {
            saveHistory(history.map(h => h.id === id ? { ...h, starred: !h.starred } : h));
          }}
          onDeleteHistoryItem={(id) => {
            saveHistory(history.filter(h => h.id !== id));
          }}
          onClearHistory={clearHistory}
          workspaces={workspaces}
          currentWorkspace={currentWorkspace}
          onSelectWorkspace={(id) => setCurrentWorkspaceId(id)}
          onCreateWorkspace={handleCreateWorkspace}
          onUpdateWorkspaceNotes={handleUpdateWorkspaceNotes}
          onUpdateContextMemory={handleUpdateContextMemory}
          onDeleteWorkspace={handleDeleteWorkspace}
          themeId={themeId}
          onSelectTheme={(t: any) => setThemeId(t)}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          accentColor={currentTheme.accentColor}
          chatMessages={chatMessages}
          onSendMessage={handleSendChat}
          chatLoading={isChatLoading}
          liveVoiceActive={isVoiceConnected}
          onToggleVoice={() => {
            if (isVoiceConnected) {
              stopVoiceSession();
            } else {
              startVoiceSession();
            }
          }}
        />

      </div>

      {/* Mobile Sticky Bottom Tab Bar */}
      <div 
        className={`fixed bottom-4 left-4 right-4 backdrop-blur-xl border p-2 rounded-2xl flex justify-around items-center z-50 shadow-2xl lg:hidden ${
          isDark 
            ? 'bg-slate-950/85 border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]' 
            : 'bg-white/95 border-slate-200/80 shadow-[0_10px_30px_rgba(0,0,0,0.08)]'
        }`}
        id="mobile-bottom-nav"
      >
        <button
          onClick={() => {
            setActiveMobileView('calculator');
            triggerAudio('number');
          }}
          className={`flex flex-col items-center gap-1 py-1.5 px-3.5 rounded-xl transition-all cursor-pointer ${
            activeMobileView === 'calculator'
              ? (themeId === 'aurora' ? 'text-emerald-600 bg-slate-100 font-bold border border-emerald-200/50' : 'text-cyan-400 bg-white/5 font-bold border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]')
              : (isDark ? 'text-white/40 hover:text-white/60' : 'text-slate-400 hover:text-slate-600')
          }`}
          id="btn-nav-calculator"
        >
          <Calculator size={18} />
          <span className="text-[9px] font-mono tracking-wider font-semibold">CALC</span>
        </button>

        <button
          onClick={() => {
            setActiveMobileView('companion');
            setShowCompanion(true);
            triggerAudio('number');
          }}
          className={`flex flex-col items-center gap-1 py-1.5 px-3.5 rounded-xl transition-all cursor-pointer relative ${
            activeMobileView === 'companion'
              ? (themeId === 'aurora' ? 'text-teal-600 bg-slate-100 font-bold border border-teal-200/50' : 'text-pink-400 bg-white/5 font-bold border border-pink-500/20 shadow-[0_0_15px_rgba(236,72,153,0.1)]')
              : (isDark ? 'text-white/40 hover:text-white/60' : 'text-slate-400 hover:text-slate-600')
          }`}
          id="btn-nav-companion"
        >
          <Brain size={18} className={isChatLoading || voiceStatus === 'listening' || voiceStatus === 'speaking' ? 'animate-pulse' : ''} />
          <span className="text-[9px] font-mono tracking-wider font-semibold">SPARKY AI</span>
          {(isChatLoading || voiceStatus === 'listening' || voiceStatus === 'speaking') && (
            <span className="absolute top-1 right-2.5 w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => {
            setActiveMobileView('converter');
            setShowConverter(true);
            triggerAudio('number');
          }}
          className={`flex flex-col items-center gap-1 py-1.5 px-3.5 rounded-xl transition-all cursor-pointer ${
            activeMobileView === 'converter'
              ? (themeId === 'aurora' ? 'text-amber-600 bg-slate-100 font-bold border border-amber-200/50' : 'text-yellow-400 bg-white/5 font-bold border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]')
              : (isDark ? 'text-white/40 hover:text-white/60' : 'text-slate-400 hover:text-slate-600')
          }`}
          id="btn-nav-converter"
        >
          <Ruler size={18} />
          <span className="text-[9px] font-mono tracking-wider font-semibold">CONVERT</span>
        </button>

        <button
          onClick={() => {
            setActiveMobileView('history');
            setShowHistory(true);
            triggerAudio('number');
          }}
          className={`flex flex-col items-center gap-1 py-1.5 px-3.5 rounded-xl transition-all cursor-pointer ${
            activeMobileView === 'history'
              ? (themeId === 'aurora' ? 'text-emerald-600 bg-slate-100 font-bold border border-emerald-200/50' : 'text-emerald-400 bg-white/5 font-bold border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]')
              : (isDark ? 'text-white/40 hover:text-white/60' : 'text-slate-400 hover:text-slate-600')
          }`}
          id="btn-nav-history"
        >
          <History size={18} />
          <span className="text-[9px] font-mono tracking-wider font-semibold">HISTORY</span>
        </button>
      </div>

      {/* Global CSS animation for sliding color gradient top line */}
      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 300% 300%;
          animation: gradient 6s ease infinite;
        }
        /* Custom scrollbar hides */
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        /* Markdown rendering inside chat */
        .markdown-body h1, .markdown-body h2, .markdown-body h3 {
          font-weight: bold;
          margin-top: 0.5em;
          margin-bottom: 0.25em;
        }
        .markdown-body p {
          margin-bottom: 0.5em;
        }
        .markdown-body ul, .markdown-body ol {
          padding-left: 1.25rem;
          list-style-type: decimal;
          margin-bottom: 0.5em;
        }
        .markdown-body ul {
          list-style-type: disc;
        }
        .markdown-body code {
          background-color: rgba(255,255,255,0.1);
          padding: 0.1rem 0.25rem;
          border-radius: 0.25rem;
          font-family: monospace;
        }
      `}</style>
    </div>
  );
}

