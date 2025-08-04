import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameState, GameMode, GameConfig, SessionStats } from './types';
import { WORDS, TIME_OPTIONS, WORD_COUNT_OPTIONS } from './constants';
import { getUsername, setUsername as saveUsername } from './lib/user';
import { isUsernameTaken } from './lib/leaderboard';
import Keyboard from './components/Keyboard';
import WordDisplay from './components/GameUI';
import ResultsScreen from './components/ResultsScreen';
import LeaderboardScreen from './components/LeaderboardScreen';
import ConfettiEffect from './components/ConfettiEffect';
import { Timer, Type, BrainCircuit, Play, Trophy, Edit, Check, LoaderCircle } from 'lucide-react';

const MotionDiv = motion.div;
const MotionButton = motion.button;

// --- Sub-component: Lobby ---
const LobbyScreen: React.FC<{
    onGameStart: (config: GameConfig) => void;
    onShowLeaderboard: () => void;
    username: string | null;
    onUsernameChange: (name: string) => Promise<{success: boolean, error?: string}>;
}> = ({ onGameStart, onShowLeaderboard, username, onUsernameChange }) => {
    const [mode, setMode] = useState<GameMode>(GameMode.WORDS);
    const [value, setValue] = useState(25);
    const [isEditingName, setIsEditingName] = useState(false);
    const [nameInput, setNameInput] = useState(username || '');
    const [nameError, setNameError] = useState('');
    const [isCheckingName, setIsCheckingName] = useState(false);
    const options = mode === GameMode.TIME ? TIME_OPTIONS : WORD_COUNT_OPTIONS;

    const cardVariants = {
        inactive: { scale: 1, backgroundColor: 'rgba(55, 65, 81, 0.4)', borderColor: 'rgba(75, 85, 99, 0.5)' },
        active: { scale: 1.05, backgroundColor: 'rgba(75, 85, 99, 0.7)', borderColor: 'rgba(14, 165, 233, 0.7)' },
    };

    const handleStart = () => {
        onGameStart({ mode, value: mode === GameMode.ZEN ? 0 : value });
    };
    
    const handleNameSave = async () => {
        const newName = nameInput.trim();
        if (newName.toLowerCase() === username) {
            setIsEditingName(false);
            return;
        }

        setIsCheckingName(true);
        setNameError('');

        const { success, error } = await onUsernameChange(newName);

        if (success) {
            setIsEditingName(false);
        } else {
            setNameError(error || 'An error occurred.');
        }
        setIsCheckingName(false);
    };

    const handleEditClick = () => {
        setNameInput(username || '');
        setNameError('');
        setIsEditingName(true);
    }

    return (
        <MotionDiv key="lobby" initial={{ opacity: 0, y:20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center flex flex-col items-center">
             <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-2 text-glow text-sky-300">Pinky Type</h1>
            {username && (
                <div className="flex flex-col items-center gap-2 mb-10 h-16">
                {isEditingName ? (
                    <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2">
                            <input 
                                type="text" 
                                value={nameInput}
                                onChange={(e) => setNameInput(e.target.value)}
                                className="bg-gray-700 text-white rounded-md px-3 py-1 text-lg md:text-xl"
                                minLength={3}
                                maxLength={15}
                            />
                            <MotionButton onClick={handleNameSave} className="p-2 bg-sky-500 rounded-md" disabled={isCheckingName}>
                                {isCheckingName ? <LoaderCircle size={20} className="animate-spin" /> : <Check size={20}/>}
                            </MotionButton>
                        </div>
                        {nameError && <p className="text-red-400 text-sm">{nameError}</p>}
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <p className="text-lg md:text-xl text-slate-400">Welcome, <span className="font-bold text-sky-400">{username}</span>!</p>
                        <MotionButton onClick={handleEditClick} className="p-2 text-slate-500 hover:text-sky-400">
                            <Edit size={16} />
                        </MotionButton>
                    </div>
                )}
                </div>
            )}


             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 w-full max-w-2xl">
                <MotionDiv variants={cardVariants} animate={mode === GameMode.WORDS ? 'active' : 'inactive'} onClick={() => { setMode(GameMode.WORDS); setValue(25); }} className="p-6 rounded-lg border-2 cursor-pointer backdrop-blur-sm transition-colors">
                    <Type className="mx-auto w-10 h-10 mb-3 text-sky-400"/>
                    <h3 className="text-2xl font-bold">Words</h3>
                </MotionDiv>
                <MotionDiv variants={cardVariants} animate={mode === GameMode.TIME ? 'active' : 'inactive'} onClick={() => { setMode(GameMode.TIME); setValue(30); }} className="p-6 rounded-lg border-2 cursor-pointer backdrop-blur-sm transition-colors">
                    <Timer className="mx-auto w-10 h-10 mb-3 text-sky-400"/>
                    <h3 className="text-2xl font-bold">Time</h3>
                </MotionDiv>
                <MotionDiv variants={cardVariants} animate={mode === GameMode.ZEN ? 'active' : 'inactive'} onClick={() => setMode(GameMode.ZEN)} className="p-6 rounded-lg border-2 cursor-pointer backdrop-blur-sm transition-colors">
                    <BrainCircuit className="mx-auto w-10 h-10 mb-3 text-sky-400"/>
                    <h3 className="text-2xl font-bold">Zen</h3>
                </MotionDiv>
             </div>
             
             <AnimatePresence>
             {mode !== GameMode.ZEN && (
                 <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex gap-3 mb-8">
                    {options.map(opt => (
                        <MotionButton key={opt} onClick={() => setValue(opt)} className={`px-4 py-2 rounded-md font-semibold transition-colors ${value === opt ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
                            {opt}
                        </MotionButton>
                    ))}
                 </motion.div>
             )}
             </AnimatePresence>

            <div className="flex items-center gap-4 mt-8">
                <MotionButton whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="bg-sky-500 text-white font-bold py-4 px-12 rounded-lg text-xl md:text-2xl flex items-center gap-3 shadow-lg shadow-sky-500/20">
                    <Play/> Start
                </MotionButton>
                 <MotionButton whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onShowLeaderboard} className="bg-slate-700 text-white font-bold p-4 rounded-lg text-xl md:text-2xl flex items-center gap-3">
                    <Trophy/>
                </MotionButton>
            </div>
        </MotionDiv>
    )
};

// --- Sub-component: Simplified HUD ---
const SimplifiedHUD: React.FC<{ stats: { wpm: number; timer: number; progress: string; errors: number }, config: GameConfig }> = ({ stats, config }) => {
    const wpmDisplay = (
        <div className="text-center">
            <span className="text-lg md:text-xl text-sky-400">WPM</span>
            <p className="text-4xl md:text-5xl font-bold">{stats.wpm.toFixed(0)}</p>
        </div>
    );

    const errorDisplay = (
        <div className="text-center">
            <span className="text-lg md:text-xl text-red-400">ERRORS</span>
            <p className="text-4xl md:text-5xl font-bold">{stats.errors}</p>
        </div>
    );

    const progressDisplay = (
        <>
            {config.mode === GameMode.TIME && (
                <div className="text-center">
                    <span className="text-lg md:text-xl text-sky-400">TIME</span>
                    <p className="text-4xl md:text-5xl font-bold">{stats.timer.toFixed(1)}</p>
                </div>
            )}
            {config.mode === GameMode.WORDS && (
                <div className="text-center">
                    <span className="text-lg md:text-xl text-sky-400">WORDS</span>
                    <p className="text-4xl md:text-5xl font-bold">{stats.progress}</p>
                </div>
            )}
        </>
    );

    const justification = config.mode === GameMode.ZEN ? 'justify-center' : 'justify-around';

    return (
        <div className={`w-full max-w-5xl h-20 md:h-24 flex items-center ${justification} font-mono text-slate-300 px-4 md:px-8`}>
            {config.mode !== GameMode.ZEN && wpmDisplay}
            {config.mode === GameMode.ZEN ? wpmDisplay : errorDisplay}
            {config.mode !== GameMode.ZEN && progressDisplay}
        </div>
    );
};


// --- Main App Component ---
const App: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>(GameState.LOBBY);
    const [gameConfig, setGameConfig] = useState<GameConfig>({ mode: GameMode.WORDS, value: 25 });
    const [wordQueue, setWordQueue] = useState<string[]>([]);
    
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [userInput, setUserInput] = useState('');
    const [wordHistory, setWordHistory] = useState<Record<number, string>>({});
    
    const [stats, setStats] = useState({
        wpm: 0,
        accuracy: 100,
        charStats: { correct: 0, incorrect: 0, total: 0 },
        timeElapsed: 0,
        streak: 0,
    });
    const [sessionTimer, setSessionTimer] = useState(0);
    const [sessionStartTime, setSessionStartTime] = useState(0);
    const [lastPressedKey, setLastPressedKey] = useState('');
    const [showConfetti, setShowConfetti] = useState(false);
    
    const [username, setUsername] = useState<string | null>(null);
    const mobileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const storedUsername = getUsername();
        if (storedUsername) {
            // Ensure any name loaded from storage is also normalized.
            // This handles legacy names that might have been stored with different casing.
            setUsername(storedUsername.toLowerCase().trim());
        }
    }, []);

    const generateWords = useCallback(() => {
        const shuffled = [...WORDS].sort(() => 0.5 - Math.random());
        setWordQueue(shuffled.slice(0, 200)); // A large queue for the session
    }, []);

    const startGame = (config: GameConfig) => {
        setGameConfig(config);
        setGameState(GameState.PLAYING);
        generateWords();
        setCurrentWordIndex(0);
        setUserInput('');
        setWordHistory({});
        setSessionTimer(config.mode === GameMode.TIME ? config.value : 0);
        setSessionStartTime(Date.now());
        setStats({ wpm: 0, accuracy: 100, charStats: { correct: 0, incorrect: 0, total: 0 }, timeElapsed: 0, streak: 0 });
        mobileInputRef.current?.focus();
    };

    const endSession = useCallback(() => {
        if (gameState !== GameState.PLAYING) return;
        setGameState(GameState.RESULTS);
    }, [gameState]);

    // Game loop timer
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (gameState === GameState.PLAYING) {
            interval = setInterval(() => {
                const elapsed = (Date.now() - sessionStartTime) / 1000;
                setStats(s => ({...s, timeElapsed: elapsed}));

                if (gameConfig.mode === GameMode.TIME) {
                    const timeLeft = Math.max(0, gameConfig.value - elapsed);
                    setSessionTimer(timeLeft);
                    if (timeLeft <= 0) {
                        endSession();
                    }
                }
                
                if (elapsed > 0.5) {
                    const wpm = (stats.charStats.correct / 5) / (elapsed / 60);
                    setStats(s => ({ ...s, wpm: Math.max(0, wpm) }));
                }

            }, 100);
        }
        return () => clearInterval(interval);
    }, [gameState, sessionStartTime, gameConfig, endSession, stats.charStats.correct]);

    const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement> | KeyboardEvent) => {
        if (gameState !== GameState.PLAYING) return;

        const { key, code } = event;
        setLastPressedKey(code);
        setTimeout(() => setLastPressedKey(''), 150);
        
        if (key === 'Tab' || event.ctrlKey || event.metaKey) {
            return;
        }
        event.preventDefault();

        const currentWord = wordQueue[currentWordIndex];
        if (!currentWord) return;

        // Unified flexible typing mode
        if (key === 'Backspace') {
            if (userInput.length > 0) {
                 setUserInput(prev => prev.slice(0, -1));
            }
            return;
        }

        if (key.length === 1 && key !== ' ') {
            if (userInput.length >= currentWord.length + 5) { // Limit extra characters
                playSound('error-sound');
                return;
            }
            setUserInput(prev => prev + key);
            playSound('key-press-sound');

        } else if (key === ' ') {
            if (userInput.length === 0) return; // Prevent advancing with empty input

            const typedWord = userInput;
            const expectedWord = currentWord;
            
            let correctInWord = 0;
            let incorrectInWord = 0;

            const typedLength = typedWord.length;
            const expectedLength = expectedWord.length;

            for (let i = 0; i < Math.max(typedLength, expectedLength); i++) {
                if (i < typedLength && i < expectedLength) {
                    if (typedWord[i] === expectedWord[i]) {
                        correctInWord++;
                    } else {
                        incorrectInWord++;
                    }
                } else if (i < typedLength) { // Extra characters
                    incorrectInWord++;
                } else { // Missed characters
                    incorrectInWord++;
                }
            }

            const isPerfect = incorrectInWord === 0 && typedLength === expectedLength;
            
            const newStreak = isPerfect ? stats.streak + 1 : 0;
            if (newStreak > 0 && newStreak % 10 === 0) {
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 2000);
            }

            setStats(s => ({
                ...s,
                streak: newStreak,
                charStats: {
                    ...s.charStats,
                    correct: s.charStats.correct + correctInWord,
                    incorrect: s.charStats.incorrect + incorrectInWord,
                }
            }));

            setWordHistory(prev => ({ ...prev, [currentWordIndex]: userInput }));
            setCurrentWordIndex(prev => prev + 1);
            setUserInput('');
            playSound('key-press-sound');

            if (gameConfig.mode === GameMode.WORDS && currentWordIndex + 1 >= gameConfig.value) {
                endSession();
            }
        }
    }, [gameState, userInput, wordQueue, currentWordIndex, gameConfig, endSession, stats.streak]);
    
    useEffect(() => {
        const globalKeyDown = (e: KeyboardEvent) => handleKeyDown(e);
        window.addEventListener('keydown', globalKeyDown);
        return () => window.removeEventListener('keydown', globalKeyDown);
    }, [handleKeyDown]);

    const playSound = (soundId: string) => {
        const sound = document.getElementById(soundId) as HTMLAudioElement;
        if (sound) { sound.currentTime = 0; sound.play().catch(e => {}); }
    };
    
    const handleUsernameSet = async (name: string): Promise<{success: boolean, error?: string}> => {
        const normalizedName = name.trim().toLowerCase();
        if (normalizedName.length < 3) return { success: false, error: 'Name must be at least 3 characters.' };
        if (normalizedName.length > 15) return { success: false, error: 'Name must be 15 characters or less.' };

        try {
            const taken = await isUsernameTaken(normalizedName);
            if (taken) {
                return { success: false, error: 'This name is already taken.' };
            }
            saveUsername(normalizedName);
            setUsername(normalizedName);
            return { success: true };
        } catch(e) {
            return { success: false, error: e instanceof Error ? e.message : 'Could not verify name.' };
        }
    }
    
    const restartGame = () => setGameState(GameState.LOBBY);
    
    const finalStats = useMemo<SessionStats>(() => {
        if(gameState !== GameState.RESULTS) return { ...stats, wpm: 0, accuracy: 0, rawWpm: 0, consistency: 0 };
        const elapsedMinutes = stats.timeElapsed / 60;
        
        const finalWpm = elapsedMinutes > 0 ? (stats.charStats.correct / 5) / elapsedMinutes : 0;
        
        const totalChars = stats.charStats.correct + stats.charStats.incorrect;
        const finalAccuracy = totalChars > 0 ? (stats.charStats.correct / totalChars) * 100 : 100;

        return { 
            ...stats,
            wpm: Math.max(0, finalWpm), 
            accuracy: Math.max(0, finalAccuracy),
            rawWpm: 0, // Not implemented
            consistency: 0, // Not implemented
            charStats: {
                ...stats.charStats,
                total: totalChars,
            }
        };
    }, [gameState, stats]);


    const nextCharToType = wordQueue[currentWordIndex]?.[userInput.length] || ' ';

    return (
        <div className="min-h-screen flex flex-col items-center justify-between p-4 select-none overflow-hidden">
            <ConfettiEffect launch={showConfetti} />
            
            {/* Hidden input for mobile keyboard */}
            <input 
                ref={mobileInputRef}
                type="text"
                className="absolute top-[-9999px] left-[-9999px] opacity-0"
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
            />

            <div className="flex-grow flex flex-col items-center justify-center w-full">
                <AnimatePresence mode="wait">
                    {gameState === GameState.LOBBY && <LobbyScreen key="lobby" onGameStart={startGame} onShowLeaderboard={() => setGameState(GameState.LEADERBOARD)} username={username} onUsernameChange={handleUsernameSet} />}
                    
                    {gameState === GameState.PLAYING && (
                        <MotionDiv 
                            key="playing" 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            className="w-full flex flex-col items-center h-full justify-center"
                            onClick={() => mobileInputRef.current?.focus()}
                        >
                            <SimplifiedHUD 
                                stats={{wpm: stats.wpm, timer: sessionTimer, progress: `${currentWordIndex}/${gameConfig.value}`, errors: stats.charStats.incorrect}} 
                                config={gameConfig} 
                            />
                            <WordDisplay words={wordQueue} currentWordIndex={currentWordIndex} userInput={userInput} wordHistory={wordHistory} />
                        </MotionDiv>
                    )}

                    {gameState === GameState.RESULTS && <ResultsScreen key="results" stats={finalStats} config={gameConfig} onRestart={restartGame} username={username} onUsernameSet={handleUsernameSet} />}
                    {gameState === GameState.LEADERBOARD && <LeaderboardScreen key="leaderboard" onBack={() => setGameState(GameState.LOBBY)} />}
                </AnimatePresence>
            </div>

            <div className="w-full shrink-0 pt-4">
                 <AnimatePresence>
                    {gameState === GameState.PLAYING && (
                        <motion.div initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1}} exit={{y:20, opacity: 0}}>
                            <Keyboard nextChar={nextCharToType} pressedKey={lastPressedKey} />
                        </motion.div>
                    )}
                 </AnimatePresence>
            </div>
        </div>
    );
};

export default App;