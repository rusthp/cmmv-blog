#!/usr/bin/env node
/**
 * Boots the CMMV application once in "build" mode so the framework's
 * transpile step regenerates `.generated/` (app.module.ts, controllers,
 * services, entities, models) from the current source tree.
 *
 * This is required before `tsup` runs, because tsup only bundles
 * `.generated/app.module.ts` as-is — it never regenerates it. Without this
 * step, `dist/app.module.js` silently goes stale relative to the actual
 * controllers/services in `src` and `packages/*`.
 *
 * The app is booted with the exact same runner/env used by `cmmv dev`
 * (`node -r @swc-node/register src/main.ts`, NODE_ENV=build) so path
 * aliases, decorators, etc. resolve identically. It is killed as soon as
 * the transpile step finishes (it would otherwise keep listening as a
 * live HTTP server forever).
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const cwd = process.cwd();
const mainPath = path.resolve(cwd, 'src/main.ts');
const tsConfigPath = path.resolve(cwd, 'tsconfig.json');
const appModulePath = path.resolve(cwd, '.generated/app.module.ts');

const TIMEOUT_MS = 60_000;
const POLL_INTERVAL_MS = 200;
const startedAt = Date.now();

const child = spawn(
    process.execPath,
    ['-r', '@swc-node/register', mainPath],
    {
        cwd,
        env: {
            ...process.env,
            NODE_ENV: 'build',
            TS_NODE_PROJECT: tsConfigPath,
        },
        stdio: ['ignore', 'pipe', 'pipe'],
    },
);

let settled = false;
let output = '';

function finish(err) {
    if (settled) return;
    settled = true;
    clearTimeout(timeout);
    if (!child.killed) child.kill('SIGTERM');
    setTimeout(() => {
        if (!child.killed) child.kill('SIGKILL');
    }, 3000).unref();
    if (err) {
        console.error('[generate-app-module] Failed to regenerate .generated/:');
        console.error(output);
        console.error(err.message);
        process.exitCode = 1;
    } else {
        console.log('[generate-app-module] .generated/ regenerated successfully.');
    }
}

const timeout = setTimeout(() => {
    finish(new Error(`Timed out after ${TIMEOUT_MS}ms waiting for transpile step`));
}, TIMEOUT_MS);

function onChunk(chunk) {
    const text = chunk.toString();
    output += text;
    process.stdout.write(text);
}

child.stdout.on('data', onChunk);
child.stderr.on('data', onChunk);

child.on('error', (err) => finish(err));
child.on('exit', (code) => {
    if (!settled) {
        finish(new Error(`Process exited early with code ${code} before .generated/app.module.ts was (re)written`));
    }
});

// `Application.generateModule()` (@cmmv/core) writes `.generated/app.module.ts`
// from scratch on every boot in dev/build mode, *after* the transpile step
// logs "All transpilers executed successfully." — so we can't rely on that
// log line as our "done" signal. Instead, poll for the file itself being
// (re)written with real content after this process started.
const poller = setInterval(() => {
    if (settled) {
        clearInterval(poller);
        return;
    }
    fs.stat(appModulePath, (err, stat) => {
        if (settled || err) return;
        if (stat.mtimeMs < startedAt) return;
        fs.readFile(appModulePath, 'utf-8', (readErr, content) => {
            if (settled || readErr) return;
            if (content.includes('export let ApplicationModule')) {
                clearInterval(poller);
                finish(null);
            }
        });
    });
}, POLL_INTERVAL_MS);
