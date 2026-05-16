"use client";

import { useState, useRef } from "react";
import LinkInput from "@/components/LinkInput";
import MediaPreview, { MediaMetadata } from "@/components/MediaPreview";
import DownloadQueue, { QueueItem } from "@/components/DownloadQueue";
import { ArrowDownToLine, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

export default function Home() {
  const [metadata, setMetadata] = useState<MediaMetadata | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  const eventSourcesRef = useRef<Record<string, EventSource>>({});

  const handleFetchInfo = async (url: string) => {
    setCurrentUrl(url);
    setIsFetchingInfo(true);
    try {
      const res = await axios.post(
  "https://vincex-universal-downloader-production.up.railway.app/api/info",
  { url }
);
      setMetadata(res.data);
    } catch (error: any) {
      console.error("Failed to fetch info:", error);
      alert(error.response?.data?.error || "Failed to extract metadata. Check link.");
    } finally {
      setIsFetchingInfo(false);
    }
  };

  const handleAddToQueue = (format: string) => {
    if (!metadata || !currentUrl) return;

    // Create unique ID for the queue item
    const id = `${metadata.id}-${Math.floor(Math.random() * 1000000)}`;

    // Add to local state queue
    setQueue(prev => [...prev, {
      id,
      title: metadata.title,
      progress: 0,
      status: "downloading",
      thumbnail: metadata.thumbnail
    }]);

    connectSSEProgress(id, currentUrl, format);
  };

  const handleCancelDownload = (id: string) => {
    // Close the SSE stream to abort the server-side process
    if (eventSourcesRef.current[id]) {
      eventSourcesRef.current[id].close();
      delete eventSourcesRef.current[id];
    }

    // Remove from the queue UI entirely
    setQueue(prev => prev.filter(q => q.id !== id));
  };

  const connectSSEProgress = (id: string, url: string, format: string) => {
    const sseUrl = `https://vincex-universal-downloader-production.up.railway.app/api/download?url=${encodeURIComponent(url)}&format=${encodeURIComponent(format)}&id=${encodeURIComponent(id)}`;
    const eventSource = new EventSource(sseUrl);

    // Store reference so we can cancel later
    eventSourcesRef.current[id] = eventSource;

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.progress !== undefined) {
        setQueue(prev => prev.map(q => q.id === id ? { ...q, progress: data.progress, size: data.size || q.size } : q));
      }

      if (data.status === 'completed') {
        setQueue(prev => prev.map(q => q.id === id ? { ...q, progress: 100, status: 'completed' } : q));
        eventSource.close();
        delete eventSourcesRef.current[id];

        // Trigger the native file download via the serve endpoint
        const downloadUrl = `https://vincex-universal-downloader-production.up.railway.app/api/serve?id=${encodeURIComponent(data.id)}&filename=${encodeURIComponent(data.filename)}`;
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = data.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      if (data.error) {
        console.error("Download Error from Server:", data.error);
        setQueue(prev => prev.map(q => q.id === id ? { ...q, status: 'error' } : q));
        eventSource.close();
        delete eventSourcesRef.current[id];
      }
    };

    eventSource.onerror = (error) => {
      console.error("EventSource Error:", error);
      setQueue(prev => prev.map(q => q.id === id && q.status !== 'completed' ? { ...q, status: 'error' } : q));
      eventSource.close();
      delete eventSourcesRef.current[id];
    };
  };

  const activeDownloads = queue.filter(q => q.status === 'downloading').length;

  return (
    <main className="min-h-screen relative flex flex-col items-center pt-24 pb-12 px-4 selection:bg-purple-500/30">

      {/* Top Right Navigation Downloads Button */}
      <div className="absolute top-6 right-6 z-50 flex flex-col items-end">
        <button
          onClick={() => setIsQueueOpen(!isQueueOpen)}
          className="relative p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all backdrop-blur-md shadow-lg"
          title="Active Downloads"
        >
          <ArrowDownToLine size={24} className="text-white" />
          {activeDownloads > 0 && (
            <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white border-2 border-[#13112E]">
              {activeDownloads}
            </span>
          )}
        </button>

        <AnimatePresence>
          {isQueueOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-16 right-0 w-80 sm:w-96 glass-panel overflow-hidden shadow-2xl flex flex-col max-h-[60vh] z-50"
            >
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  Downloads <span className="text-white/50 text-sm font-normal">({queue.length})</span>
                </h3>
                <button onClick={() => setIsQueueOpen(false)} className="text-white/50 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 custom-scrollbar">
                <DownloadQueue queue={queue} onCancel={handleCancelDownload} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Header text */}
      <div className="text-center space-y-6 z-10 max-w-2xl mt-8">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white via-purple-100 to-white/60 drop-shadow-sm pb-2">
          Universal Downloader
        </h1>
        <p className="text-lg md:text-xl text-white/60 font-light max-w-lg mx-auto">
          Instantly save high-quality videos and audio from YouTube, Instagram, and Facebook.
        </p>
      </div>

      {/* Main interactive area */}
      <div className="w-full z-10 flex flex-col items-center">
        <LinkInput onProcess={handleFetchInfo} isLoading={isFetchingInfo} />

        {metadata && (
          <MediaPreview metadata={metadata} onAddQueue={handleAddToQueue} />
        )}
      </div>

      {/* Made By Watermark */}
      <div className="fixed bottom-4 right-4 text-white/50 text-sm font-bold italic z-10 pointer-events-none">
        MADE BY SUMAN ADHIKARI
      </div>

    </main>
  );
}
