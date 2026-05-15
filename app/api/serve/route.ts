import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import os from 'os';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const filename = searchParams.get('filename');

    if (!id || !filename) {
        return new NextResponse('Missing parameters', { status: 400 });
    }

    const filePath = path.join(os.tmpdir(), 'stellar-downloads', id, filename);

    if (!fs.existsSync(filePath)) {
        return new NextResponse('File not found', { status: 404 });
    }

    // Attempt to stat the file to get size for Content-Length
    const stat = fs.statSync(filePath);

    // Create a readable stream from the file
    const stream = fs.createReadStream(filePath);

    // Encode filename for Content-Disposition (handles non-ASCII characters)
    const encodedFilename = encodeURIComponent(filename);

    return new NextResponse(stream as any, {
        headers: {
            'Content-Disposition': `attachment; filename*=UTF-8''${encodedFilename}`,
            'Content-Type': 'application/octet-stream',
            'Content-Length': stat.size.toString(),
        },
    });
}
