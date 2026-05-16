import path from 'path';
import os from 'os';
// @ts-ignore
import ffmpegPathFromStatic from 'ffmpeg-static';

export function getBinPaths() {
    const isWindows = process.platform === 'win32';

    // Base path for yt-dlp
    const ytDlpBase = path.join(process.cwd(), 'node_modules', 'youtube-dl-exec', 'bin');
    const ytDlpPath = isWindows
        ? path.join(ytDlpBase, 'yt-dlp.exe')
        : path.join(ytDlpBase, 'yt-dlp');

    // FFmpeg path
    // ffmpeg-static usually handles this well, but we provide a fallback for manual paths if needed
    let ffmpegPath = ffmpegPathFromStatic;

    // If ffmpeg-static fails or returns relative path on some platforms, we can try to resolve it
    if (!ffmpegPath || typeof ffmpegPath !== 'string') {
        const ffmpegBase = path.join(process.cwd(), 'node_modules', 'ffmpeg-static');
        ffmpegPath = isWindows
            ? path.join(ffmpegBase, 'ffmpeg.exe')
            : path.join(ffmpegBase, 'ffmpeg');
    }

    return {
        ytDlpPath,
        ffmpegPath
    };
}
