"use client";

import { X, CheckCircle, FileDown, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type QueueItem = {
    id: string;
    title: string;
    progress: number;
    status: "downloading" | "completed" | "error";
    thumbnail: string;
    size?: string;
}

export default function DownloadQueue({ queue, onCancel }: { queue: QueueItem[], onCancel: (id: string) => void }) {
    if (queue.length === 0) return (
        <div className="p-8 text-center text-white/50 text-sm">
            No active downloads
        </div>
    );

    return (
        <div className="w-full space-y-2 p-2">
            <AnimatePresence>
                {queue.map((item) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="glass-panel p-4 flex items-center gap-4 relative overflow-hidden"
                    >
                        {/* Background Progress Fill */}
                        {item.status === 'downloading' && (
                            <div
                                className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 -z-10 transition-all duration-300 ease-linear"
                                style={{ width: `${item.progress}%` }}
                            />
                        )}

                        <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="w-14 h-10 object-cover rounded-md border border-white/10 shrink-0"
                        />

                        <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate text-sm">{item.title}</p>
                            <div className="flex items-center justify-between mt-1">
                                <div className="text-xs text-white/70 flex items-center gap-2 whitespace-nowrap">
                                    {item.status === 'downloading' && (
                                        <>
                                            <span className="text-purple-300 font-medium">{item.progress.toFixed(1)}%</span>
                                            {item.size && <span>• {item.size}</span>}
                                        </>
                                    )}
                                    {item.status === 'completed' && (
                                        <span className="text-green-400 flex items-center gap-1"><CheckCircle size={14} /> Completed</span>
                                    )}
                                    {item.status === 'error' && (
                                        <span className="text-red-400 flex items-center gap-1"><XCircle size={14} /> Failed</span>
                                    )}
                                </div>

                                {item.status === 'downloading' && (
                                    <div className="w-full max-w-[150px] h-1.5 bg-white/10 rounded-full overflow-hidden ml-4">
                                        <div
                                            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
                                            style={{ width: `${item.progress}%` }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => onCancel(item.id)}
                            className="p-2 text-white/50 hover:text-white/90 hover:bg-white/10 rounded-lg transition-colors shrink-0"
                        >
                            <X size={20} />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
