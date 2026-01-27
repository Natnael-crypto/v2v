'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export default function AudioVisualizer({ audioElement, isPlaying, barCount = 40 }: { audioElement: HTMLAudioElement | null, isPlaying: boolean, barCount?: number }) {
    const [bars, setBars] = useState(Array(barCount).fill(0.1));
    const contextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        if (!audioElement) return;

        // Initialize context and source only once for this element
        if (!contextRef.current) {
            const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            const context = new AudioContextClass();
            const analyser = context.createAnalyser();
            const source = context.createMediaElementSource(audioElement);

            source.connect(analyser);
            analyser.connect(context.destination);

            analyser.fftSize = 256;

            contextRef.current = context;
            sourceRef.current = source;
            analyserRef.current = analyser;
            dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
        }

        const context = contextRef.current;
        const analyser = analyserRef.current;
        const dataArray = dataArrayRef.current;

        if (!isPlaying || !context || !analyser || !dataArray) {
            // Use setTimeout to avoid synchronous state update warning
            setTimeout(() => {
                setBars(Array(barCount).fill(0.1));
            }, 0);

            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null; // Reset animation ref
            }
            return;
        }

        // Ensure context is running when we want to play
        if (context.state === 'suspended') {
            context.resume();
        }

        const updateBars = () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            analyser.getByteFrequencyData(dataArray as any);

            const step = Math.floor(dataArray.length / barCount);
            const newBars = [];

            for (let i = 0; i < barCount; i++) {
                const index = i * step;
                // dataArray is Uint8Array, values are 0-255
                const value = dataArray[index] / 255;
                newBars.push(value || 0.1);
            }

            setBars(newBars);
            animationRef.current = requestAnimationFrame(updateBars);
        };

        updateBars();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null; // Reset animation ref
            }
        };
    }, [audioElement, isPlaying, barCount]);

    // Cleanup context on unmount
    useEffect(() => {
        return () => {
            if (contextRef.current && contextRef.current.state !== 'closed') {
                contextRef.current.close();
            }
        };
    }, []);

    return (
        <div className="flex items-center justify-center gap-[2px] h-full">
            {bars.map((height, i) => (
                <motion.div
                    key={i}
                    className="w-[3px] rounded-full bg-white"
                    animate={{
                        height: `${Math.max(height * 100, 10)}%`,
                        opacity: 0.3 + height * 0.7,
                    }}
                    transition={{
                        duration: 0.05,
                        ease: "linear"
                    }}
                />
            ))}
        </div>
    );
}