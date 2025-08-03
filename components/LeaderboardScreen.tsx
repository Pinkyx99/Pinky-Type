import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Crown, LoaderCircle, AlertTriangle } from 'lucide-react';
import { TIME_OPTIONS, WORD_COUNT_OPTIONS } from '../constants';
import { GameMode, LeaderboardEntry } from '../types';
import { getScoresForCategory, getLeaderboardCategoryKey } from '../lib/leaderboard';

const MotionDiv = motion.div;
const MotionButton = motion.button;

const LeaderboardScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [mode, setMode] = useState<GameMode>(GameMode.WORDS);
    const [value, setValue] = useState(25);
    const [scores, setScores] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchScores = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const categoryKey = getLeaderboardCategoryKey({ mode, value });
                const fetchedScores = await getScoresForCategory(categoryKey);
                setScores(fetchedScores);
            } catch (err) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('An unknown error occurred while fetching scores.');
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchScores();
    }, [mode, value]);

    const categoryKey = getLeaderboardCategoryKey({ mode, value });
    const options = mode === GameMode.TIME ? TIME_OPTIONS : WORD_COUNT_OPTIONS;

    return (
        <MotionDiv
            key="leaderboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-4xl mx-auto flex flex-col items-center text-white p-4"
        >
            <h1 className="text-6xl font-black mb-4 text-glow text-sky-300">Leaderboard</h1>
            <p className="text-xl text-slate-400 mb-8">Global high scores.</p>

            <div className="flex gap-4 mb-4">
                <MotionButton onClick={() => { setMode(GameMode.WORDS); setValue(10); }} className={`px-5 py-2 rounded-md font-semibold transition-colors text-lg ${mode === GameMode.WORDS ? 'bg-sky-500' : 'bg-slate-800'}`}>Words</MotionButton>
                <MotionButton onClick={() => { setMode(GameMode.TIME); setValue(15); }} className={`px-5 py-2 rounded-md font-semibold transition-colors text-lg ${mode === GameMode.TIME ? 'bg-sky-500' : 'bg-slate-800'}`}>Time</MotionButton>
            </div>
            
            <AnimatePresence mode="wait">
                 <motion.div key={mode} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex gap-3 mb-8">
                    {options.map(opt => (
                        <MotionButton key={opt} onClick={() => setValue(opt)} className={`px-4 py-2 rounded-md font-semibold transition-colors ${value === opt ? 'bg-sky-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                            {opt} {mode === 'time' && 's'}
                        </MotionButton>
                    ))}
                 </motion.div>
             </AnimatePresence>

            <div className="w-full max-w-2xl bg-gray-800/50 rounded-lg p-6 border border-gray-700 min-h-[300px]">
                <AnimatePresence mode="wait">
                    <motion.div key={categoryKey} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 py-10">
                                <LoaderCircle className="animate-spin w-12 h-12 mb-4" />
                                <p className="text-xl">Fetching scores...</p>
                            </div>
                        ) : error ? (
                             <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 py-10">
                                <AlertTriangle className="w-12 h-12 mb-4 text-red-500" />
                                <p className="text-xl font-semibold text-red-400">Error Loading Scores</p>
                                <p className="text-sm mt-2">{error}</p>
                            </div>
                        ) : scores.length > 0 ? (
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-600 text-sm text-gray-400 uppercase">
                                        <th className="p-3 w-1/12 text-center">#</th>
                                        <th className="p-3 w-4/12">Name</th>
                                        <th className="p-3 w-2/12 text-center">WPM</th>
                                        <th className="p-3 w-2/12 text-center">Acc</th>
                                        <th className="p-3 w-3/12 text-right">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {scores.map((score, index) => (
                                        <tr key={score.id} className="border-b border-gray-700/50 last:border-b-0">
                                            <td className="p-3 text-center font-bold text-lg">{index === 0 ? <Crown className="inline-block text-yellow-400" size={20}/> : index + 1}</td>
                                            <td className="p-3 font-semibold">{score.name}</td>
                                            <td className="p-3 text-center text-sky-400 font-bold">{score.wpm.toFixed(0)}</td>
                                            <td className="p-3 text-center">{score.accuracy.toFixed(1)}%</td>
                                            <td className="p-3 text-right text-sm text-gray-500">{new Date(score.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 py-10">
                                <p className="text-xl">No scores yet for this category.</p>
                                <p>Be the first to set a record!</p>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

             <MotionButton
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onBack}
                className="mt-8 bg-slate-700 text-white font-bold py-3 px-6 rounded-lg text-lg flex items-center space-x-2"
            >
                <ArrowLeft size={20} />
                <span>Back to Lobby</span>
            </MotionButton>
        </MotionDiv>
    );
};

export default LeaderboardScreen;
