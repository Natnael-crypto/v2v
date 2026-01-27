'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import AudioWaveform from './AudioWaveform';
import AudioVisualizer from './AudioVisualizer';
import { useRouter } from 'next/navigation';

import { ProcessResponse } from '@/types/api';
import { User } from '@/types/user';

const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
    { code: 'pl', name: 'Polish', flag: '🇵🇱' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
    { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
    { code: 'id', name: 'Indonesian', flag: '🇮🇩' },
    { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
    { code: 'th', name: 'Thai', flag: '🇹🇭' },
    { code: 'cs', name: 'Czech', flag: '🇨🇿' },
    { code: 'da', name: 'Danish', flag: '🇩🇰' },
    { code: 'fi', name: 'Finnish', flag: '🇫🇮' },
    { code: 'el', name: 'Greek', flag: '🇬🇷' },
    { code: 'hu', name: 'Hungarian', flag: '🇭🇺' },
    { code: 'no', name: 'Norwegian', flag: '🇳🇴' },
    { code: 'ro', name: 'Romanian', flag: '🇷🇴' },
    { code: 'sk', name: 'Slovak', flag: '🇸🇰' },
    { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
    { code: 'uk', name: 'Ukrainian', flag: '🇺🇦' },
];

export default function VoiceRecorder({ onRecordingComplete }: { onRecordingComplete: (data: ProcessResponse) => void }) {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const [isPlayingPreview, setIsPlayingPreview] = useState(false);
    const [previewProgress, setPreviewProgress] = useState(0);
    const [previewDuration, setPreviewDuration] = useState(0);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['es']);
    const [user, setUser] = useState<User | null>(null);
    // const [loading, setLoading] = useState(true); // Unused

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const previewAudioRef = useRef<HTMLAudioElement | null>(null);
    const router = useRouter();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const res = await axios.get('/api/auth/me');
            setUser(res.data);
        } catch {
            setUser(null);
        } finally {
            // setLoading(false);
        }
    };

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }, [isRecording]);

    useEffect(() => {
        if (isRecording) {
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    if (prev >= 29) {
                        stopRecording();
                        return 30;
                    }
                    return prev + 1;
                });
            }, 1000);
        } else if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isRecording, stopRecording]);

    useEffect(() => {
        if (recordedBlob) {
            const url = URL.createObjectURL(recordedBlob);
            setPreviewUrl(url);
            return () => {
                URL.revokeObjectURL(url);
                setPreviewUrl(null);
            };
        } else {
            setPreviewUrl(null);
        }
    }, [recordedBlob]);

    useEffect(() => {
        const audio = previewAudioRef.current;
        if (!audio || !previewUrl) return;

        const handleTimeUpdate = () => {
            if (audio.duration) {
                setPreviewProgress((audio.currentTime / audio.duration) * 100);
            }
        };

        const handleLoadedMetadata = () => {
            setPreviewDuration(audio.duration);
        };

        const handleEnded = () => {
            setIsPlayingPreview(false);
            setPreviewProgress(0);
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [previewUrl]);

    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const startRecording = async () => {

        if (!user) {
            router.push('/login');
            return;
        }

        try {
            setError(null);

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                const isSecure = window.isSecureContext;
                if (!isSecure) {
                    throw new Error('Microphone access requires a secure context (HTTPS or localhost).');
                }
                throw new Error('Your browser does not support audio recording.');
            }

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                chunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                stream.getTracks().forEach(track => track.stop());
                setRecordedBlob(blob);
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setRecordingTime(0);
        } catch (err: unknown) {
            console.error('Failed to start recording:', err);
            setError((err as Error).message || 'Failed to access microphone. Please ensure you have granted permission.');
        }
    };



    const togglePreview = () => {
        if (previewAudioRef.current) {
            if (isPlayingPreview) {
                previewAudioRef.current.pause();
            } else {
                previewAudioRef.current.play();
            }
            setIsPlayingPreview(!isPlayingPreview);
        }
    };

    const toggleLanguage = (code: string) => {
        setSelectedLanguages([code]);
    };

    const processMutation = useMutation({
        mutationFn: async (formData: FormData) => {
            const { data } = await axios.post<ProcessResponse>('/api/process', formData);
            return data;
        },
        onSuccess: (data) => {
            onRecordingComplete(data);
            setRecordedBlob(null);
            setRecordingTime(0);
            setPreviewProgress(0);
        },
        onError: (err: unknown) => {
            console.error('Submission failed:', err);
            const axiosError = err as AxiosError<{ message: string }>;
            const errorMessage = axiosError.response?.data?.message || (err as Error).message || 'Failed to process translation. Please try again.';
            setError(errorMessage);
        },
    });

    const isProcessing = processMutation.isPending;

    const handleSubmit = async () => {
        if (recordedBlob && selectedLanguages.length > 0) {
            // Check duration again just in case (though UI should prevent it)
            if (recordingTime > 120) {
                setError('Audio length exceeds the 120-second limit.');
                return;
            }

            const formData = new FormData();
            formData.append('audio', recordedBlob);
            formData.append('targetLanguages', JSON.stringify(selectedLanguages));
            processMutation.mutate(formData);
        }
    };

    const handleReset = () => {
        setRecordedBlob(null);
        setRecordingTime(0);
        setPreviewProgress(0);
        setIsPlayingPreview(false);
    };

    return (
        <div className="relative flex flex-col items-center space-y-8">
            {/* Animated background waveform */}
            <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
                <div className="w-full h-32">
                    <AudioWaveform isRecording={isRecording} />
                </div>
            </div>

            {/* Recording Controls */}
            {!recordedBlob ? (
                <div className="relative z-10 flex flex-col items-center space-y-6">
                    {/* Recording Time Display */}
                    <AnimatePresence>
                        {isRecording && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex items-center gap-3"
                            >
                                <motion.div
                                    className="w-3 h-3 rounded-full bg-white"
                                    animate={{ opacity: [1, 0.3, 1] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                />
                                <span className={`font-mono text-2xl tracking-wider ${recordingTime >= 110 ? 'text-red-500' : 'text-white'}`}>
                                    {formatTime(recordingTime)}
                                </span>
                                {recordingTime >= 120 && (
                                    <span className="text-red-500 text-[10px] uppercase font-bold">Limit Reached</span>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Language Selection */}
                    <div className="w-full max-w-2xl px-4 py-6 border border-white/10 bg-white/5 backdrop-blur-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-white font-bold text-xs uppercase tracking-widest">
                                Select Target Languages (Max 1)
                            </h3>
                            <span className="text-gray-500 text-[10px] uppercase font-medium">
                                {selectedLanguages.length} / 1 Selected
                            </span>
                        </div>
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                            {SUPPORTED_LANGUAGES.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => toggleLanguage(lang.code)}
                                    className={`flex flex-col items-center justify-center p-2 border transition-all ${selectedLanguages.includes(lang.code)
                                        ? 'border-white bg-white text-black'
                                        : 'border-white/10 bg-white/0 text-gray-400 hover:border-white/30'
                                        }`}
                                >
                                    <span className="text-lg mb-1">{lang.flag}</span>
                                    <span className="text-[9px] uppercase tracking-tighter font-bold truncate w-full text-center">
                                        {lang.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Control Buttons */}
                    <div className="flex gap-4">
                        {!isRecording ? (
                            <motion.button
                                onClick={startRecording}
                                disabled={isProcessing}
                                className="px-8 py-4 bg-white text-black font-bold text-sm uppercase tracking-widest hover:bg-gray-200 transition-colors disabled:opacity-50"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Start Recording
                            </motion.button>
                        ) : (
                            <motion.button
                                onClick={stopRecording}
                                className="px-8 py-4 border-2 border-white text-white font-bold text-sm uppercase tracking-widest hover:bg-white/10 transition-colors"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Stop Recording
                            </motion.button>
                        )}
                    </div>

                    {/* Instructions and Errors */}
                    <div className="flex flex-col items-center gap-2">
                        {error && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-red-400 text-[10px] tracking-widest uppercase text-center max-w-xs"
                            >
                                Error: {error}
                            </motion.p>
                        )}
                        <motion.p
                            className="text-gray-500 text-xs tracking-widest uppercase"
                            animate={{ opacity: isRecording ? 0.5 : 1 }}
                        >
                            {isProcessing
                                ? "Processing your voice..."
                                : isRecording
                                    ? "Recording in progress..."
                                    : "Click start to begin recording"}
                        </motion.p>
                    </div>
                </div>
            ) : (
                /* Preview Section */
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative z-10 w-full max-w-2xl space-y-6"
                >
                    {/* Preview Card */}
                    <div className="p-8 border border-white/20 bg-black/60 backdrop-blur-xl">
                        <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-6">
                            Your Recording Preview
                        </h3>

                        {/* Waveform Visualizer */}
                        <div className="h-24 mb-6 border border-white/10 bg-white/5 p-3">
                            <AudioVisualizer
                                audioElement={previewAudioRef.current}
                                isPlaying={isPlayingPreview}
                            />
                        </div>

                        {/* Progress Bar */}
                        <div className="relative h-1 bg-white/10 mb-4">
                            <motion.div
                                className="absolute inset-y-0 left-0 bg-white"
                                style={{ width: `${previewProgress}%` }}
                            />
                        </div>

                        {/* Time Display */}
                        <div className="flex items-center justify-between mb-6">
                            <span className="text-gray-500 text-xs font-mono">
                                {formatTime(previewAudioRef.current?.currentTime || 0)}
                            </span>
                            <span className="text-gray-500 text-xs font-mono">
                                {formatTime(previewDuration)}
                            </span>
                        </div>

                        {/* Playback Controls */}
                        <div className="flex gap-3">
                            <motion.button
                                onClick={togglePreview}
                                className="flex-1 px-6 py-3 border border-white/30 text-white font-medium text-xs uppercase tracking-widest hover:bg-white/5 transition-colors"
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                            >
                                {isPlayingPreview ? 'Pause' : 'Play'}
                            </motion.button>
                            <motion.button
                                onClick={handleReset}
                                className="px-6 py-3 border border-white/30 text-white font-medium text-xs uppercase tracking-widest hover:bg-white/5 transition-colors"
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                            >
                                Re-record
                            </motion.button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <motion.button
                        onClick={handleSubmit}
                        disabled={isProcessing}
                        className="w-full px-8 py-4 bg-white text-black font-bold text-sm uppercase tracking-widest hover:bg-gray-200 transition-colors disabled:opacity-50"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                    >
                        {isProcessing ? 'Processing...' : 'Submit for Translation'}
                    </motion.button>
                </motion.div>
            )}

            {recordedBlob && previewUrl && (
                <audio
                    ref={previewAudioRef}
                    src={previewUrl}
                    preload="metadata"
                />
            )}
        </div>
    );
}