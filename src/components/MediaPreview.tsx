"use client";

import { useState } from "react";
import { Download, MonitorPlay, Headphones, Plus } from "lucide-react";
import { motion } from "framer-motion";

// Defines the data structure
export type MediaFormat = {
    format_id: string;
    ext: string;
    resolution: string | null;
    filesize: number | null;
    video_ext: string;
    audio_ext: string;
    format_note: string;
}

export type MediaMetadata = {
    id: string;
    title: string;
    thumbnail: string;
    duration_string: string;
    extractor: string;
    formats: MediaFormat[];
}

export default function MediaPreview({
    metadata,
    onAddQueue
}: {
    metadata: MediaMetadata | null;
    onAddQueue: (format: string) => void;
}) {
    const [selectedFormat, setSelectedFormat] = useState<string>("");

    if (!metadata) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel w-full max-w-3xl mx-auto mt-8 p-6"
        >
            <div className="flex flex-col md:flex-row gap-6">
                {/* Thumbnail Area */}
                <div className="w-full md:w-5/12 aspect-video relative rounded-xl overflow-hidden shadow-lg border border-white/10 bg-black/40">
                    <img
                        src={metadata.thumbnail}
                        alt={metadata.title}
                        className="w-full h-full object-contain"
                    />
                    <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded text-xs">
                        {metadata.duration_string || "Unknown"}
                    </div>
                </div>

                {/* Info Area */}
                <div className="flex-1 flex flex-col justify-between py-2">
                    <div>
                        <h2 className="text-xl font-bold line-clamp-2 text-white/90">
                            {metadata.title}
                        </h2>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-purple-300 border border-purple-500/30 capitalize">
                                {metadata.extractor}
                            </span>
                        </div>
                    </div>

                    <div className="mt-6 space-y-4">
                        <div className="relative">
                            <select
                                value={selectedFormat}
                                onChange={(e) => setSelectedFormat(e.target.value)}
                                className="w-full appearance-none bg-white/5 border border-white/20 text-white py-3 pl-4 pr-12 rounded-xl focus:outline-none focus:border-purple-500"
                            >
                                <option value="" disabled className="text-gray-900">Select Format Quality</option>
                                <optgroup label="Video" className="text-gray-900">
                                    <option value="bestvideo+bestaudio/best">Highest Quality Auto-Container (MKV/WEBM/MP4)</option>
                                    <option value="bestvideo[vcodec^=avc]+bestaudio[ext=m4a]/best[ext=mp4]/best">Maximum Compatibility (H.264 MP4)</option>
                                    <option value="bestvideo[height<=720][vcodec^=avc]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best">720p Compatible (H.264 MP4)</option>
                                </optgroup>
                                <optgroup label="Audio Only" className="text-gray-900">
                                    <option value="bestaudio/best">Best Audio (MP3/M4A)</option>
                                </optgroup>
                            </select>
                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                <MonitorPlay size={18} className="text-white/50" />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => onAddQueue(selectedFormat)}
                                disabled={!selectedFormat}
                                className="glass-button flex-1 py-3 justify-center items-center gap-2 disabled:opacity-50"
                            >
                                <Download size={20} />
                                Download Now
                            </button>
                            <button
                                onClick={() => onAddQueue(selectedFormat)}
                                disabled={!selectedFormat}
                                className="bg-white/5 hover:bg-white/10 border border-white/20 px-4 rounded-xl transition-colors disabled:opacity-50"
                                title="Add to Batch Queue"
                            >
                                <Plus size={24} />
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </motion.div>
    );
}
