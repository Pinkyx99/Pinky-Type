import React, { useRef, useLayoutEffect } from 'react';
import { motion } from 'framer-motion';

const MotionDiv = motion.div;

const Caret: React.FC = () => {
    return <motion.div layoutId="caret" className="caret" transition={{ type: 'spring', stiffness: 1200, damping: 80 }} />;
};

type CharacterState = 'correct' | 'incorrect' | 'untyped' | 'extra' | 'missed';

const Character: React.FC<{
    char: string;
    state: CharacterState;
}> = React.memo(({ char, state }) => {
    let content: React.ReactNode = char;
    let className = 'transition-colors duration-150 relative';

    switch (state) {
        case 'correct':
            className += ' text-green-400';
            break;
        case 'incorrect':
            className += ' text-slate-300';
            content = (
                <>
                    <span className="absolute inset-0 bg-red-600/50 rounded-sm -mx-px"></span>
                    <span className="relative">{char}</span>
                </>
            );
            break;
        case 'untyped':
            className += ' text-slate-500';
            break;
        case 'extra':
            className += ' text-red-500';
            break;
        case 'missed':
            className += ' text-red-500/60';
            break;
    }

    return <span className={className}>{content}</span>;
});


const WordDisplay: React.FC<{
    words: string[];
    currentWordIndex: number;
    userInput: string;
    wordHistory: Record<number, string>;
}> = ({ words, currentWordIndex, userInput, wordHistory }) => {
    const activeWordRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        activeWordRef.current?.scrollIntoView({
            block: 'center',
            behavior: 'smooth',
        });
    }, [currentWordIndex]);

    return (
        <div className="h-32 md:h-40 w-full max-w-5xl overflow-hidden relative leading-relaxed cursor-text">
            <div className="absolute inset-0 flex items-center justify-center text-2xl md:text-3xl font-bold tracking-wider word-stream flex-wrap gap-x-2 gap-y-3 md:gap-y-4 p-4">
                {words.map((word, w_idx) => {
                    const isCurrentWord = w_idx === currentWordIndex;
                    const isPastWord = w_idx < currentWordIndex;
                    const wordRef = isCurrentWord ? activeWordRef : null;

                    const renderElements: React.ReactNode[] = [];

                    if (isCurrentWord) {
                        const loopLength = Math.max(word.length, userInput.length);
                        for (let i = 0; i < loopLength; i++) {
                            if (i === userInput.length) {
                                renderElements.push(<Caret key="caret" />);
                            }
                            if (i < word.length) {
                                const state: CharacterState = i < userInput.length
                                    ? (userInput[i] === word[i] ? 'correct' : 'incorrect')
                                    : 'untyped';
                                renderElements.push(<Character key={i} char={word[i]} state={state} />);
                            } else if (i < userInput.length) {
                                renderElements.push(<Character key={`extra-${i}`} char={userInput[i]} state="extra" />);
                            }
                        }
                         if (userInput.length >= word.length) {
                             renderElements.push(<Caret key="caret-end" />);
                        }

                    } else if (isPastWord) {
                        const historyInput = wordHistory[w_idx] || '';
                        const loopLength = Math.max(word.length, historyInput.length);
                        for (let i = 0; i < loopLength; i++) {
                            if (i < word.length && i < historyInput.length) {
                                const state = historyInput[i] === word[i] ? 'correct' : 'incorrect';
                                renderElements.push(<Character key={i} char={word[i]} state={state} />);
                            } else if (i < word.length) {
                                renderElements.push(<Character key={i} char={word[i]} state="missed" />);
                            } else if (i < historyInput.length) {
                                renderElements.push(<Character key={`extra-${i}`} char={historyInput[i]} state="extra" />);
                            }
                        }
                    } else { // Future word
                        for (let i = 0; i < word.length; i++) {
                            renderElements.push(<Character key={i} char={word[i]} state="untyped" />);
                        }
                    }

                    return (
                        <div key={w_idx} ref={wordRef} className="whitespace-nowrap">
                            {renderElements}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default React.memo(WordDisplay);