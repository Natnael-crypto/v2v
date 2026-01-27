'use client'

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TranslationCard from '@/components/TranslationCard';
import TranscriptionCard from '@/components/TranscriptionCard';
import VoiceRecorder from '@/components/VoiceRecorder';
import { ProcessResponse } from '@/types/api';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { User } from '@/types/user';

const LANGUAGE_MAP: Record<string, { name: string; flag: string }> = {
  en: { name: 'English', flag: '🇺🇸' },
  es: { name: 'Spanish', flag: '🇪🇸' },
  fr: { name: 'French', flag: '🇫🇷' },
  de: { name: 'German', flag: '🇩🇪' },
  it: { name: 'Italian', flag: '🇮🇹' },
  pt: { name: 'Portuguese', flag: '🇵🇹' },
  nl: { name: 'Dutch', flag: '🇳🇱' },
  pl: { name: 'Polish', flag: '🇵🇱' },
  ru: { name: 'Russian', flag: '🇷🇺' },
  ja: { name: 'Japanese', flag: '🇯🇵' },
  zh: { name: 'Chinese', flag: '🇨🇳' },
  ko: { name: 'Korean', flag: '🇰🇷' },
  hi: { name: 'Hindi', flag: '🇮🇳' },
  ar: { name: 'Arabic', flag: '🇸🇦' },
  tr: { name: 'Turkish', flag: '🇹🇷' },
  id: { name: 'Indonesian', flag: '🇮🇩' },
  vi: { name: 'Vietnamese', flag: '🇻🇳' },
  th: { name: 'Thai', flag: '🇹🇭' },
  cs: { name: 'Czech', flag: '🇨🇿' },
  da: { name: 'Danish', flag: '🇩🇰' },
  fi: { name: 'Finnish', flag: '🇫🇮' },
  el: { name: 'Greek', flag: '🇬🇷' },
  hu: { name: 'Hungarian', flag: '🇭🇺' },
  no: { name: 'Norwegian', flag: '🇳🇴' },
  ro: { name: 'Romanian', flag: '🇷🇴' },
  sk: { name: 'Slovak', flag: '🇸🇰' },
  sv: { name: 'Swedish', flag: '🇸🇪' },
  uk: { name: 'Ukrainian', flag: '🇺🇦' },
};


// Demo translations data


export default function Home() {
  const [transcription, setTranscription] = useState<string | null>(null);
  const [translations, setTranslations] = useState<{ language: string; flag: string; text: string; audioUrl: string }[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
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
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await axios.delete('/api/auth/login');
    router.push('/login');
  };

  const handleRecordingComplete = async (data: ProcessResponse) => {
    try {
      setTranscription(data.originalTranscript);

      const processedTranslations = await Promise.all(data.translations.map(async (t) => {
        const langInfo = LANGUAGE_MAP[t.language] || { name: t.language, flag: '🌐' };

        // Convert base64 to Blob and then to URL
        let audioUrl = '';
        try {
          const res = await fetch(`data:audio/mpeg;base64,${t.audioBase64}`);
          const blob = await res.blob();
          audioUrl = URL.createObjectURL(blob);
        } catch (err) {
          console.error(`Error generating audio URL for ${t.language}:`, err);
        }

        return {
          language: langInfo.name,
          flag: langInfo.flag,
          text: t.text,
          audioUrl: audioUrl,
        };
      }));

      // Add original audio if available
      if (data.originalAudioBase64) {
        try {
          const res = await fetch(`data:audio/webm;base64,${data.originalAudioBase64}`);
          const blob = await res.blob();
          const originalAudioUrl = URL.createObjectURL(blob);
          processedTranslations.unshift({
            language: 'Original',
            flag: '🎙️',
            text: data.originalTranscript,
            audioUrl: originalAudioUrl,
          });
        } catch (err) {
          console.error('Error processing original audio:', err);
        }
      }

      setTranslations(processedTranslations);
      setShowResults(true);
    } catch (err) {
      console.error('Error processing translations:', err);
    }
  };

  const scrollToRecorder = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    document.getElementById('recorder')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Background image */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/60 to-black" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-6 md:px-12 py-8 border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold tracking-tighter">V2V</div>
        </div>

        <div className="flex items-center gap-6">
          {user ? (
            <>
              <div className="hidden lg:flex flex-col items-end mr-4">
                <span className="text-sm font-medium text-white">{user.name}</span>
                <span className="text-[10px] text-gray-400 uppercase tracking-widest">
                  {(user.totalSeconds / 3600).toFixed(2)}h / {(user.usageLimitSeconds / 3600).toFixed(0)}h used
                </span>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className="hidden md:flex px-6 py-2.5 bg-white/10 border border-white/20 text-white font-medium text-sm uppercase tracking-wider hover:bg-white/20 transition-colors"
              >
                Logout
              </motion.button>
            </>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/login')}
              className="hidden md:flex px-6 py-2.5 bg-white/10 border border-white/20 text-white font-medium text-sm uppercase tracking-wider hover:bg-white/20 transition-colors"
            >
              Login
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={scrollToRecorder}
            className="hidden md:flex px-6 py-2.5 bg-white text-black font-medium text-sm uppercase tracking-wider hover:bg-gray-200 transition-colors"
          >
            Get Started
          </motion.button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 md:px-12 pt-20 md:pt-32 pb-24">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-5 py-2 border border-white/30 bg-white/5 backdrop-blur-sm text-white text-xs uppercase tracking-widest font-medium mb-10"
          >
            AI-Powered Translation
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.1] mb-8 tracking-tight"
          >
            <span className="text-white">Break language</span>
            <br />
            <span className="text-white">barriers instantly</span>
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-400 text-xl md:text-2xl mb-14 max-w-3xl mx-auto tracking-wide"
          >
            Record. Transcribe. Translate. Listen.
          </motion.p>

          {/* CTA Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={scrollToRecorder}
            className="inline-flex px-10 py-4 bg-white text-black font-bold text-sm uppercase tracking-widest hover:bg-gray-200 transition-colors"
          >
            Start Translating
          </motion.button>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-6 mt-16"
          >
            {['100+ Languages', 'Instant Processing', 'Natural Audio'].map((text, i) => (
              <div
                key={i}
                className="px-4 py-2 border border-white/20 bg-white/5 backdrop-blur-sm text-gray-400 text-xs uppercase tracking-wider font-medium"
              >
                {text}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Recorder Section */}
      <section id="recorder" className="relative z-10 px-6 md:px-12 py-24">
        <div className="max-w-4xl mx-auto">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
              Record Your Voice
            </h2>
            <p className="text-gray-500 text-sm uppercase tracking-widest">
              Click the button below to start recording
            </p>
          </motion.div>

          {/* Recorder component */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1614851099175-e5b30eb6f696?w=1200&q=80)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <div className="relative p-12 md:p-20 border border-white/10">
              <VoiceRecorder
                onRecordingComplete={handleRecordingComplete}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Results Section */}
      <AnimatePresence>
        {showResults && (
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 px-6 md:px-12 py-10 pb-32"
          >
            <div className="max-w-5xl mx-auto space-y-12">
              {/* Original Transcription */}
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-8 tracking-tight uppercase">Your Recording</h2>
                <TranscriptionCard text={transcription!} language="English (Detected)" />
              </div>

              {/* Translations */}
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-8 tracking-tight uppercase">Translations</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {translations.map((translation, index) => (
                    <TranslationCard
                      key={translation.language}
                      language={translation.language}
                      flag={translation.flag}
                      translatedText={translation.text}
                      audioUrl={translation.audioUrl}
                      index={index}
                    />
                  ))}
                </div>
              </div>

              {/* New Recording Button */}
              <div className="text-center">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowResults(false);
                    setTranscription(null);
                    setTranslations([]);
                  }}
                  className="inline-flex px-8 py-3 border border-white/30 text-white font-medium text-sm uppercase tracking-widest hover:bg-white/5 transition-colors"
                >
                  Record New Message
                </motion.button>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 mt-32">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-black/70" />

        <div className="relative max-w-6xl mx-auto px-6 md:px-12 py-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Logo */}
            <div className="text-2xl font-bold tracking-tighter" onClick={() => window.location.replace("/")}>
              V2V
            </div>

            {/* Links */}
            <div className="flex items-center gap-8 text-xs text-gray-500 uppercase tracking-widest">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>

            {/* Social */}
            <div className="flex items-center gap-4 text-xs text-gray-500 uppercase tracking-widest">
              <a href="#" className="hover:text-white transition-colors">Twitter</a>
              <a href="#" className="hover:text-white transition-colors">Github</a>
              <a href="#" className="hover:text-white transition-colors">Linkedin</a>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-12 pt-8 border-t border-white/10 text-center text-gray-600 text-xs uppercase tracking-widest">
            © 2026 V2V. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}