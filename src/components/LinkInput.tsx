"use client";

import { useState } from "react";
import { Search, Loader2, Link as LinkIcon, Video, Clapperboard, MonitorPlay } from "lucide-react";
import { motion } from "framer-motion";

export default function LinkInput({ onProcess, isLoading }: { onProcess: (url: string) => void, isLoading: boolean }) {
    const [url, setUrl] = useState("");

    const getPlatformIcon = (currentUrl: string) => {
        if (currentUrl.includes("youtube.com") || currentUrl.includes("youtu.be")) {
            return <MonitorPlay className="text-red-500" size={24} />;
        }
        if (currentUrl.includes("instagram.com")) {
            return <Clapperboard className="text-pink-500" size={24} />;
        }
        if (currentUrl.includes("facebook.com") || currentUrl.includes("fb.watch")) {
            return <Video className="text-blue-500" size={24} />;
        }
        return <LinkIcon className="text-gray-400" size={24} />;
    };

    const handleProcessLink = () => {
        if (!url) return;
        onProcess(url);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-3xl mx-auto mt-12 relative"
        >
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                    {getPlatformIcon(url)}
                </div>

                <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleProcessLink(); }}
                    placeholder="Paste YouTube, Instagram, or Facebook link here..."
                    className="glass-input w-full py-5 pl-14 pr-36 text-lg sm:text-xl rounded-2xl bg-white/5 focus:bg-white/10"
                />

                <div className="absolute inset-y-0 right-2 flex items-center">
                    <button
                        onClick={handleProcessLink}
                        disabled={isLoading || !url}
                        className="glass-button px-6 py-3 rounded-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <>
                                <Search size={20} />
                                <span className="hidden sm:inline">Detect</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Glow Effect matching Tailwind */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 pointer-events-none -z-10"></div>
        </motion.div>
    );
}
