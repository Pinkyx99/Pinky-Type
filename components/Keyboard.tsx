import React from 'react';
import { motion } from 'framer-motion';
import { KEYBOARD_LAYOUT, KEY_TO_EVENT_CODE } from '../constants';
import { CornerDownLeft, ChevronsRight, ArrowUp, Lock } from 'lucide-react';

const MotionDiv = motion.div;

const getKeyStyle = (key: string) => {
    const baseClasses = "flex items-center justify-center rounded-lg h-9 md:h-10 lg:h-11 font-bold uppercase transition-colors duration-100 border-b-4 border-black/30 shadow-md";
    let widthClass = "flex-1";
    
    const specialKeys: {[key:string]: string} = {
        'Backspace': 'w-24', 'Tab': 'w-20', 'CapsLock': 'w-24', 
        'Enter': 'w-28', 'Shift': 'w-32', 'ShiftR': 'w-36', 'Space': 'flex-1'
    };
    if (specialKeys[key]) {
        widthClass = specialKeys[key];
    }

    // New dark grey theme
    let colorClass = "bg-gray-800 text-gray-200"; // Base key
    if (['Backspace', 'Tab', 'CapsLock', 'Enter', 'Shift', 'ShiftR'].includes(key)) {
        colorClass = "bg-gray-700 text-gray-100"; // Special key
    }
    if (key === 'Space') {
        colorClass = "bg-black/50 text-gray-300"; // Space bar
    }

    return `${baseClasses} ${widthClass} ${colorClass}`;
};

const Key: React.FC<{
    char: string;
    isNext: boolean;
    isPressed: boolean;
}> = ({ char, isNext, isPressed }) => {
    const keyStyle = getKeyStyle(char);
    const keyContent: {[key: string]: React.ReactNode} = {
        'Backspace': <CornerDownLeft size={20} />, 'Tab': <ChevronsRight size={20} />, 'CapsLock': <Lock size={20} />,
        'Enter': <span className="text-sm">ENTER</span>, 'Shift': <ArrowUp size={20} />, 'ShiftR': <ArrowUp size={20} />,
        'Space': <span className="text-sm">SPACE</span>
    };
    
    return (
        <MotionDiv
            animate={{ 
                scale: isPressed ? 1.05 : 1,
                y: isPressed ? -3 : 0,
                backgroundColor: isNext ? '#0ea5e9' : undefined,
                color: isNext ? '#111827' : undefined,
                boxShadow: isNext ? "0 0 20px #0ea5e9" : "0 2px 5px rgba(0,0,0,0.2)",
            }}
            transition={{ type: 'spring', stiffness: 600, damping: 25 }}
            className={`${keyStyle}`}
        >
            {keyContent[char] || char}
        </MotionDiv>
    );
};

const Keyboard: React.FC<{ nextChar: string, pressedKey: string }> = ({ nextChar, pressedKey }) => {
    const pressedEventCode = pressedKey.startsWith('Key') || pressedKey.startsWith('Digit') ? pressedKey : pressedKey.toUpperCase();

    return (
        <div className="w-full max-w-5xl p-2 space-y-1.5 mx-auto hidden md:block">
            {KEYBOARD_LAYOUT.map((row, rowIndex) => (
                <div key={rowIndex} className="flex w-full space-x-1.5">
                    {row.map((char, colIndex) => {
                        const eventCode = KEY_TO_EVENT_CODE[char.toUpperCase()] || char;
                        const isNext = nextChar.toUpperCase() === char.toUpperCase() || (nextChar === ' ' && char === 'Space');
                        const isPressed = pressedEventCode === eventCode || 
                            (char === 'Shift' && pressedKey === 'ShiftLeft') ||
                            (char === 'Space' && pressedKey === 'Space');

                        return (
                            <Key 
                                key={`${rowIndex}-${colIndex}`} 
                                char={char} 
                                isNext={isNext} 
                                isPressed={isPressed}
                            />
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

export default React.memo(Keyboard);