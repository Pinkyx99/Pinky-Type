import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Zap, Target, Timer, BarChart, AlertTriangle, CheckCircle, LoaderCircle, UserPlus } from 'lucide-react';
import { GameConfig, GameMode, SessionStats } from '../types';
import { getPersonalBest, saveScoreToLeaderboard, getLeaderboardCategoryKey, isUsernameTaken } from '../lib/leaderboard';

const MotionDiv = motion.div;
const MotionButton = motion.button;

interface ResultsScreenProps {
    stats: SessionStats;
    config: GameConfig;
    onRestart: () => void;
    username: string | null;
    onUsernameSet: (name: string) => Promise<{success: boolean, error?: string}>;
}

const StatCard: React.FC<{ icon: React.ReactNode, label: string, value: string, delay: number, size?: 'large' | 'normal' }> = ({ icon, label, value, delay, size = 'normal' }) => {
    const isLarge = size === 'large';
    const valueTextSize = isLarge ? 'text-5xl md:text-7xl' : 'text-4xl';
    const labelTextSize = isLarge ? 'text-sm md:text-lg' : 'text-sm';
    const iconContainerSize = isLarge ? 'mb-4' : 'mb-2';
    const padding = isLarge ? 'p-6 md:p-8' : 'p-6';
    
    return (
        <MotionDiv 
            className={`bg-gray-800/50 ${padding} rounded-lg flex flex-col items-center justify-center text-center backdrop-blur-sm border border-gray-700 w-full`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', delay: delay * 0.15 }}
        >
            <div className={`text-sky-400 ${iconContainerSize}`}>{icon}</div>
            <div className={`${valueTextSize} font-bold text-white`}>{value}</div>
            <div className={`${labelTextSize} text-gray-400 uppercase tracking-widest`}>{label}</div>
        </MotionDiv>
    );
};

const BANNED_NAMES = ['admin', 'anon', 'user', 'test', 'player', 'aaa', 'bbb', 'ccc', '123'];

const ResultsScreen: React.FC<ResultsScreenProps> = ({ stats, config, onRestart, username, onUsernameSet }) => {
    type Status = 'idle' | 'checking' | 'prompt_for_name' | 'checking_name' | 'submitting' | 'new_record' | 'no_record' | 'error';
    const [status, setStatus] = useState<Status>('idle');
    const [error, setError] = useState<string | null>(null);
    const [nameInput, setNameInput] = useState('');

    const processScore = async (currentUsername: string) => {
        setError(null);
        // The username passed here is expected to be lowercase
        if (!currentUsername) return;

        setStatus('checking');
        try {
            const categoryKey = getLeaderboardCategoryKey(config);
            const personalBest = await getPersonalBest(currentUsername, categoryKey);
            const newWpm = Math.round(stats.wpm);

            // Use >= to update scores that are equal (e.g., to update accuracy/timestamp) or better.
            if (newWpm >= (personalBest || 0)) {
                setStatus('submitting');
                await saveScoreToLeaderboard({
                    name: currentUsername,
                    wpm: newWpm,
                    accuracy: stats.accuracy,
                    category: categoryKey,
                });
                setStatus('new_record');
            } else {
                setStatus('no_record');
            }
        } catch (err) {
            setStatus('error');
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        }
    };

    useEffect(() => {
        if (config.mode === 'zen' || stats.wpm < 10) {
            setStatus('idle');
            return;
        }

        if (username) {
            // username from props is already normalized to lowercase
            processScore(username);
        } else {
            // If there's no username, wait for them to submit one.
            setStatus('prompt_for_name');
        }
    }, []); // Run only once on mount

    const handleNameSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const cleanedName = nameInput.trim();
        const lowerCaseName = cleanedName.toLowerCase();

        if (BANNED_NAMES.includes(lowerCaseName) || cleanedName.length < 3) {
            setError("Please choose a more original username (at least 3 characters).");
            return;
        }
        
        setStatus('checking_name');
        try {
            // Use the onUsernameSet function which now handles checking
            const { success, error: checkError } = await onUsernameSet(cleanedName);

            if (success) {
                // Name is available and has been set in App state.
                // Now process the score with the normalized (lowercase) name.
                await processScore(lowerCaseName);
            } else {
                setStatus('prompt_for_name');
                setError(checkError || "That username is already taken.");
            }
        } catch (err) {
            setStatus('error');
            setError(err instanceof Error ? err.message : 'Could not verify username.');
        }
    };
    
    return (
        <MotionDiv
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center text-white p-4"
        >
            <h2 className="text-4xl md:text-6xl font-bold mb-2 text-center">
                {config.mode === GameMode.TIME ? "Time's Up!" : "Session Complete!"}
            </h2>
            <p className="text-gray-300 text-md md:text-lg mb-8 text-center">Fantastic effort. Here's your performance breakdown:</p>
            
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 w-full max-w-2xl mb-8">
                <StatCard icon={<Zap size={40} />} label="WPM" value={stats.wpm.toFixed(0)} delay={0} size="large" />
                <StatCard icon={<Target size={40} />} label="Accuracy" value={`${stats.accuracy.toFixed(1)}%`} delay={1} size="large" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl mb-10">
                <StatCard icon={<Timer size={24} />} label="Time" value={`${stats.timeElapsed.toFixed(1)}s`} delay={2} />
                <StatCard icon={<BarChart size={24} />} label="Characters" value={`${stats.charStats.correct} / ${stats.charStats.total}`} delay={3}/>
                <StatCard icon={<AlertTriangle size={24} />} label="Errors" value={`${stats.charStats.incorrect}`} delay={4} />
            </div>

            <div className="w-full max-w-md text-center mb-8 min-h-[90px] flex items-center justify-center">
                <AnimatePresence mode="wait">
                     {status === 'prompt_for_name' && (
                        <motion.div key="prompt" initial={{opacity:0}} animate={{opacity:1}} className="w-full">
                            <p className="mb-2 text-sky-300 font-semibold">Set a username to save your score!</p>
                            <form onSubmit={handleNameSubmit} className="flex gap-2">
                                <input
                                    type="text"
                                    value={nameInput}
                                    onChange={(e) => setNameInput(e.target.value)}
                                    placeholder="Enter your name..."
                                    minLength={3}
                                    maxLength={15}
                                    className="flex-grow bg-gray-900/80 border border-gray-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                                    required
                                />
                                <MotionButton type="submit" whileHover={{scale:1.05}} className="p-3 bg-sky-500 rounded-lg font-bold"><UserPlus/></MotionButton>
                            </form>
                             {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                        </motion.div>
                    )}
                    {(status === 'checking' || status === 'submitting' || status === 'checking_name') && (
                        <motion.div key="checking" className="text-slate-500 flex flex-col items-center gap-2" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                            <LoaderCircle className="w-8 h-8 animate-spin" />
                            <span>
                                {status === 'checking_name' ? 'Checking username...' :
                                 status === 'submitting' ? 'Saving new record...' : 
                                 'Checking for personal best...'}
                            </span>
                        </motion.div>
                    )}
                    {status === 'new_record' && (
                        <motion.div key="new_record" initial={{opacity:0, scale: 0.8}} animate={{opacity:1, scale: 1}} className="w-full max-w-md bg-green-900/30 border border-green-500/50 p-4 rounded-lg flex items-center gap-4">
                            <CheckCircle className="w-10 h-10 text-green-400 shrink-0" />
                            <div>
                                <h4 className="font-bold text-green-300 text-left">New Personal Record!</h4>
                                <p className="text-sm text-green-400/80 text-left">Your score has been automatically saved.</p>
                            </div>
                        </motion.div>
                    )}
                    {(status === 'error' && error) && (
                         <motion.div key="error" initial={{opacity:0, scale: 0.8}} animate={{opacity:1, scale: 1}} className="w-full max-w-md bg-yellow-900/30 border border-yellow-500/50 p-4 rounded-lg flex items-center gap-4">
                             <AlertTriangle className="w-8 h-8 text-yellow-400 shrink-0" />
                             <div>
                                <h4 className="font-bold text-yellow-300 text-left">Error</h4>
                                <p className="text-sm text-yellow-400/80 text-left">{error}</p>
                             </div>
                         </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <MotionButton
                whileHover={{ scale: 1.05, boxShadow: "0px 0px 20px rgba(14, 165, 233, 0.5)" }}
                whileTap={{ scale: 0.95 }}
                onClick={onRestart}
                className="bg-sky-500 text-white font-bold py-3 px-6 text-lg md:py-4 md:px-8 md:text-xl flex items-center space-x-2"
            >
                <RefreshCw size={24} />
                <span>Play Again</span>
            </MotionButton>
        </MotionDiv>
    );
};

export default React.memo(ResultsScreen);