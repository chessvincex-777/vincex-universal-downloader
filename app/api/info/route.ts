import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import { getBinPaths } from '@/lib/binaries';

const execPromise = util.promisify(exec);

export async function POST(request: Request) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        const { ytDlpPath } = getBinPaths();

        // Execute yt-dlp directly
        const { stdout, stderr } = await execPromise(
  `"${ytDlpPath}" --dump-json --no-warnings --no-playlist "${url}"`
);
        const output = JSON.parse(stdout);

        // Simplify the format data for the frontend
        const formats = output.formats?.map((f: any) => ({
            format_id: f.format_id,
            ext: f.ext,
            resolution: f.resolution || (f.height ? `${f.height}p` : 'audio'),
            filesize: f.filesize,
            video_ext: f.video_ext,
            audio_ext: f.audio_ext,
            format_note: f.format_note,
        })).filter((f: any) => f.format_note !== 'storyboard') || []; // Filter out junk formats

        return NextResponse.json({
            id: output.id,
            title: output.title,
            thumbnail: output.thumbnail,
            duration_string: output.duration_string,
            extractor: output.extractor,
            formats: formats,
        });

    } catch (error: any) {
        console.error('Info fetching error:', error);

        let errorMsg = 'Failed to fetch video information. Ensure the link is valid and public.';
        if (error.stderr && error.stderr.includes('Sign in to confirm')) {
            errorMsg = 'YouTube anti-bot block: "Sign in to confirm you\'re not a bot". Please try a different link or configure yt-dlp cookies on your backend.';
        } else if (error.stderr) {
            errorMsg = error.stderr.split('\n')[0].replace('ERROR: ', '');
        }

        return NextResponse.json({ error: errorMsg, details: error.message }, { status: 500 });
    }
}
