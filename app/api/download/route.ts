import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { getBinPaths } from '@/lib/binaries';

// Helper to stream progress
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const format = searchParams.get('format') || 'best';

    const id = searchParams.get('id') || Date.now().toString();

    if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
        start(controller) {
            // Define a downloads directory deep in OS temp space to avoid Next.js HMR Turbopack explosions
            const baseDir = path.join(os.tmpdir(), 'stellar-downloads');
            const downloadDir = path.join(baseDir, id);

            let isClosed = false;

            if (!fs.existsSync(baseDir)) {
                fs.mkdirSync(baseDir);
            }
            if (!fs.existsSync(downloadDir)) {
                fs.mkdirSync(downloadDir);
            }

            // Centralized cross-platform binary resolution
            const { ytDlpPath, ffmpegPath } = getBinPaths();
            const outputPath = path.join(downloadDir, '%(title)s.%(ext)s');

            const ytProcess = spawn(ytDlpPath, [
                "--ffmpeg-location", ffmpegPath,
                "-f", format,
                "-o", outputPath,
                url
            ]);

            ytProcess.stdout?.on('data', (data: Buffer) => {
                const strData = data.toString();
                // Look for the progress string, e.g. "[download]  45.3% of ~325.21MiB"
                const progressMatch = strData.match(/\[download\]\s+([\d\.]+)\%/);
                const sizeMatch = strData.match(/of\s+(~?[\d\.]+([a-zA-Z]+))/);
                if (progressMatch && !isClosed) {
                    const percentage = parseFloat(progressMatch[1]);
                    const size = sizeMatch ? sizeMatch[1].replace('~', '') : undefined;
                    try { controller.enqueue(encoder.encode(`data: ${JSON.stringify({ progress: percentage, size })}\n\n`)); } catch (e) { }
                }
            });

            ytProcess.stderr?.on('data', (data: Buffer) => {
                console.warn(`yt-dlp warning: ${data.toString()}`);
            });

            ytProcess.on('close', (code: number | null) => {
                if (isClosed) return; // Prevent Invalid State crash
                isClosed = true;

                if (code === 0) {
                    try {
                        const files = fs.readdirSync(downloadDir);
                        if (files.length > 0) {
                            const filename = files[0];
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'completed', filename, id })}\n\n`));
                        } else {
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Download completed but file not found' })}\n\n`));
                        }
                    } catch (err) {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Failed to read downloaded file' })}\n\n`));
                    }
                } else if (code === null) {
                    // Process was killed before completion
                    console.log(`Download process for ${id} was cancelled.`);
                } else {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Download failed' })}\n\n`));
                }

                try {
                    controller.close();
                } catch (e) { }
            });

            // Listen for connection aborted by client
            request.signal.addEventListener('abort', () => {
                if (isClosed) return;
                isClosed = true;
                console.log(`Client disconnected, cancelling download ${id}...`);
                if (ytProcess && ytProcess.pid) {
                    ytProcess.kill('SIGKILL');
                }
            });
        }
    });

    return new Response(readable, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
