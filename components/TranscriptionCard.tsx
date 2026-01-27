import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function TranscriptionCard({ text, language = "Original" }: { text: string, language?: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative group"
        >
            {/* Card */}
            <div className="relative rounded-2xl p-8 border border-white/20 bg-black/60 backdrop-blur-xl hover:border-white/40 transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-white font-medium text-lg tracking-wide uppercase mb-1">Original Transcription</h3>
                        <p className="text-gray-500 text-sm">{language}</p>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCopy}
                        className="px-4 py-2 text-xs font-medium border border-white/20 hover:border-white/40 hover:bg-white/5 transition-colors uppercase tracking-wider"
                    >
                        {copied ? 'Copied' : 'Copy'}
                    </motion.button>
                </div>

                {/* Text content */}
                <p className="text-gray-300 leading-relaxed text-xl">
                    &quot;{text}&quot;
                </p>
            </div>
        </motion.div>
    );
}