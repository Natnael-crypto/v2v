import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import AudioVisualizer from './AudioVisualizer';

export default function TranslationCard({ language, flag, translatedText, audioUrl, index }: { language: string, flag: string, translatedText: string, audioUrl: string, index: number }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [copied, setCopied] = useState(false);
    const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        setAudioElement(audioRef.current);
    }, []);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => {
            setProgress((audio.currentTime / audio.duration) * 100);
        };

        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setProgress(0);
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = audioUrl;
        link.download = `translation-${language.toLowerCase()}.mp3`;
        link.click();
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(translatedText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="relative group"
        >
            {/* Card */}
            <div className="relative rounded-xl p-5 border border-white/10 bg-black/40 backdrop-blur-xl hover:border-white/30 transition-all">
                {/* Language header */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">{flag}</span>
                        <h3 className="text-white font-medium uppercase tracking-wide text-sm">{language}</h3>
                    </div>

                    <button
                        onClick={handleCopy}
                        className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all flex items-center gap-2 group/copy"
                        title="Copy to clipboard"
                    >
                        {copied ? (
                            <span className="text-[10px] uppercase tracking-wider text-green-400 font-medium">Copied!</span>
                        ) : null}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="opacity-60 group-hover/copy:opacity-100 transition-opacity"
                        >
                            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                        </svg>
                    </button>
                </div>

                {/* Translated text */}
                <p className="text-gray-400 text-sm leading-relaxed mb-5 line-clamp-3">
                    {translatedText}
                </p>

                {/* Audio player */}
                <div className="space-y-3">
                    {/* Waveform visualization */}
                    <div className="h-12 rounded-lg overflow-hidden bg-white/5 border border-white/10 p-2">
                        <AudioVisualizer
                            audioElement={audioElement}
                            isPlaying={isPlaying}
                        />
                    </div>

                    {/* Progress bar */}
                    <div className="relative h-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            className="absolute inset-y-0 left-0 rounded-full bg-white"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {/* Play/Pause button */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={togglePlay}
                                className="px-4 py-2 bg-white text-black font-medium text-xs uppercase tracking-wider hover:bg-gray-200 transition-colors"
                            >
                                {isPlaying ? 'Pause' : 'Play'}
                            </motion.button>

                            {/* Time */}
                            <span className="text-gray-500 text-xs font-mono">
                                {formatTime((progress / 100) * duration)} / {formatTime(duration)}
                            </span>
                        </div>

                        {/* Download button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleDownload}
                            className="px-3 py-2 text-xs font-medium border border-white/20 hover:border-white/40 hover:bg-white/5 text-gray-400 hover:text-white transition-colors uppercase tracking-wider"
                        >
                            Download
                        </motion.button>
                    </div>
                </div>

                {/* Hidden audio element */}
                <audio ref={audioRef} src={audioUrl} preload="metadata" crossOrigin="anonymous" />
            </div>
        </motion.div>
    );
}