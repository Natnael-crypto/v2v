'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function AudioWaveform({ isPlaying = false, isRecording = false, className = "" }) {
    const [bars, setBars] = useState(() => Array(40).fill(0).map(() => Math.random() * 0.3 + 0.1));

    useEffect(() => {
        if (!isPlaying && !isRecording) return;

        const interval = setInterval(() => {
            setBars(prev => prev.map(() => Math.random() * 0.8 + 0.2));
        }, 100);

        return () => clearInterval(interval);
    }, [isPlaying, isRecording]);

    return (
        <div className={`flex items-center justify-center gap-[2px] h-full ${className}`}>
            {bars.map((height, i) => (
                <motion.div
                    key={i}
                    className="w-[3px] rounded-full bg-white"
                    animate={{
                        height: (isPlaying || isRecording) ? `${height * 100}%` : '15%',
                        opacity: (isPlaying || isRecording) ? 0.8 + height * 0.2 : 0.3,
                    }}
                    transition={{
                        duration: 0.1,
                        ease: "easeInOut"
                    }}
                />
            ))}
        </div>
    );
}