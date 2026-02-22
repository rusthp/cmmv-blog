import { test, expect } from 'vitest';
import * as Resolver from '../scripts/test-image-resolver.js';
import fs from 'fs';
import path from 'path';

test('Resolves valid Google image to download', async () => {
    const res = await Resolver.resolveImage("https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png", "Google");
    expect(res.source).toBe('download');
    expect(res.localPath).toContain('/uploads/news/');

    // Check local file exists
    const absolute = path.join(process.cwd(), 'public', res.localPath);
    expect(fs.existsSync(absolute)).toBe(true);
});

test('Blocks private IPs', async () => {
    const res = await Resolver.resolveImage("http://192.168.1.1/test.jpg", "Hack");
    expect(res.source).toBe('placeholder'); // Should fallback
});

test('Generates placeholder for empty URL', async () => {
    const res = await Resolver.resolveImage("", "Empty test title with some words");
    expect(res.source).toBe('placeholder');
    expect(res.localPath).toContain('.svg');
});
