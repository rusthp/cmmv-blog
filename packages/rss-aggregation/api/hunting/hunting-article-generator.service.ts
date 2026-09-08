import * as path from "node:path";
import * as fs from "node:fs";

import {
    Service, Logger, Config
} from "@cmmv/core";

export interface HuntingGenerationPayload {
    title: string;
    link: string;
    source: string;
    keyword: string;
    summary?: string;
}

export interface HuntingGenerationResult {
    success: boolean;
    postId: string | null;
    title: string | null;
    error: string | null;
}

/**
 * Bridge between the hunting validation queue and ContentMind.
 *
 * ContentMind (repository root `content-mind/`, deployed standalone to
 * `/root/content-mind` on the VM) is a Python service, not a CMMV provider —
 * it authenticates against this same API over HTTP to create posts. So the
 * integration is a one-shot CLI invocation: `content_mind.py --hunting-result`
 * reads the approved news item as JSON on stdin and answers with a JSON line
 * on stdout.
 *
 * ContentMind always creates the post as a DRAFT here; nothing on this path
 * publishes automatically, the draft still needs manual editorial review.
 */
@Service()
export class HuntingArticleGeneratorService {
    private static readonly logger = new Logger("HuntingArticleGeneratorService");

    private static readonly RESULT_MARKER = "CONTENTMIND_RESULT";

    /**
     * Resolve the ContentMind installation directory, when configured and valid
     * @returns The directory containing content_mind.py, or null
     */
    private resolveContentMindDir(): string | null {
        const configured = Config.get<string>("blog.contentMindPath", "");

        if (!configured)
            return null;

        const dir = path.resolve(configured);

        return fs.existsSync(path.join(dir, "content_mind.py")) ? dir : null;
    }

    /**
     * Generate a ContentMind draft from an approved hunting result.
     * Never throws: failures are returned so the approval flow can record them.
     * @param payload - The approved news item and its originating keyword
     * @returns The generation outcome
     */
    async generateDraft(payload: HuntingGenerationPayload): Promise<HuntingGenerationResult> {
        const dir = this.resolveContentMindDir();

        if (!dir) {
            return {
                success: false,
                postId: null,
                title: null,
                error: "ContentMind is not available: set blog.contentMindPath (CONTENT_MIND_PATH) to the directory containing content_mind.py"
            };
        }

        const python = Config.get<string>("blog.contentMindPython", "python3");
        const timeout = Config.get<number>("blog.contentMindTimeout", 300000);

        try {
            return await this.runContentMind(dir, python, timeout, payload);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);

            return { success: false, postId: null, title: null, error: errorMessage };
        }
    }

    /**
     * Spawn the ContentMind CLI and collect its JSON result line
     * @param dir - The ContentMind directory
     * @param python - The Python interpreter to use
     * @param timeout - Maximum time to wait for the generation, in ms
     * @param payload - The payload written to the process stdin
     * @returns The generation outcome
     */
    private runContentMind(
        dir: string,
        python: string,
        timeout: number,
        payload: HuntingGenerationPayload
    ): Promise<HuntingGenerationResult> {
        return new Promise<HuntingGenerationResult>((resolve) => {
            const { spawn } = require('child_process');

            let stdout = "";
            let stderr = "";
            let settled = false;

            const child = spawn(python, ["content_mind.py", "--hunting-result"], {
                cwd: dir,
                windowsHide: true
            });

            const finish = (result: HuntingGenerationResult) => {
                if (settled)
                    return;

                settled = true;
                clearTimeout(timer);
                resolve(result);
            };

            const timer = setTimeout(() => {
                child.kill();

                finish({
                    success: false,
                    postId: null,
                    title: null,
                    error: `ContentMind generation timed out after ${timeout}ms`
                });
            }, timeout);

            child.stdout.on('data', (data: Buffer) => { stdout += data.toString(); });
            child.stderr.on('data', (data: Buffer) => { stderr += data.toString(); });

            child.on('error', (error: Error) => {
                finish({
                    success: false,
                    postId: null,
                    title: null,
                    error: `Failed to start ContentMind (${python}): ${error.message}`
                });
            });

            child.on('close', (code: number) => {
                const parsed = HuntingArticleGeneratorService.parseResult(stdout);

                if (parsed) {
                    finish(parsed);
                    return;
                }

                const detail = (stderr.trim() || stdout.trim()).slice(-500);

                finish({
                    success: false,
                    postId: null,
                    title: null,
                    error: `ContentMind exited with code ${code} without a readable result. ${detail}`.trim()
                });
            });

            try {
                child.stdin.write(JSON.stringify(payload));
                child.stdin.end();
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);

                child.kill();
                finish({ success: false, postId: null, title: null, error: `Failed to send payload to ContentMind: ${errorMessage}` });
            }
        });
    }

    /**
     * Extract the JSON result line ContentMind prints on stdout
     * @param stdout - The captured stdout
     * @returns The parsed result, or null when no valid line was found
     */
    private static parseResult(stdout: string): HuntingGenerationResult | null {
        const lines = stdout.split(/\r?\n/).reverse();

        for (const line of lines) {
            const trimmed = line.trim();

            if (!trimmed.startsWith(HuntingArticleGeneratorService.RESULT_MARKER))
                continue;

            const json = trimmed.slice(HuntingArticleGeneratorService.RESULT_MARKER.length).trim();

            try {
                const data = JSON.parse(json);

                return {
                    success: data.success === true,
                    postId: data.postId ? String(data.postId) : null,
                    title: data.title ? String(data.title) : null,
                    error: data.error ? String(data.error) : null
                };
            } catch (error) {
                HuntingArticleGeneratorService.logger.error(`Unparseable ContentMind result line: ${json.slice(0, 300)}`);

                return null;
            }
        }

        return null;
    }
}
