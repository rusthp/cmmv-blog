import * as fs from "node:fs";
import * as path from "node:path";
import { cwd } from "node:process";

import {
    Service, Cron, CronExpression,
    Config, Logger
} from "@cmmv/core";

import {
    Repository, MoreThanOrEqual, Between
} from "@cmmv/repository";

import { notifyDiscord, DISCORD_COLOR } from "../utils/discord.utils";

const DAY_MS = 24 * 60 * 60 * 1000;
const BACKUP_MAX_AGE_HOURS = 26;
const DISK_WARN_PERCENT = 90;

/**
 * Daily operational report for #proplay: what was published, pipeline items
 * waiting for a human, traffic vs the previous day, backup freshness and disk.
 * Static methods: @Cron handlers may run without the service instance.
 */
@Service('blog_daily_report')
export class DailyReportService {
    public static readonly logger = new Logger(DailyReportService.name);

    @Cron(CronExpression.EVERY_DAY_AT_9AM)
    async handleDailyReport() {
        await DailyReportService.sendDailyReport();
    }

    static async sendDailyReport(): Promise<boolean> {
        try {
            const now = Date.now();
            const [published, pipeline, traffic] = await Promise.all([
                DailyReportService.publishedSince(now - DAY_MS),
                DailyReportService.pipelineCounts(),
                DailyReportService.trafficCounts(now),
            ]);
            const backup = DailyReportService.latestBackup(now);
            const disk = DailyReportService.diskUsage();

            const siteUrl = Config.get<string>("blog.url", "");
            const warnings: string[] = [];
            if (published.length === 0) warnings.push('nenhuma matéria publicada');
            if (pipeline.needsReview > 0) warnings.push(`${pipeline.needsReview} matéria(s) esperando revisão`);
            if (!backup || backup.ageHours > BACKUP_MAX_AGE_HOURS) warnings.push('backup SQLite atrasado');
            if (disk && disk.usedPercent >= DISK_WARN_PERCENT) warnings.push(`disco em ${disk.usedPercent}%`);

            const postsList = published.length > 0
                ? published.map((p) => `• [${p.title}](${siteUrl}/post/${p.slug})${p.noindex ? ' _(noindex)_' : ''}`).join('\n')
                : 'Nenhuma.';

            const trafficDelta = traffic.previous > 0
                ? ` (${traffic.current >= traffic.previous ? '+' : ''}${Math.round(((traffic.current - traffic.previous) / traffic.previous) * 100)}% vs dia anterior)`
                : '';

            return await notifyDiscord('proplay', {
                title: '📊 ProPlay News — últimas 24h',
                description: warnings.length > 0 ? `⚠️ ${warnings.join(' · ')}` : '✅ Tudo em ordem',
                color: warnings.length > 0 ? DISCORD_COLOR.WARN : DISCORD_COLOR.OK,
                fields: [
                    { name: `Publicadas (${published.length})`, value: postsList },
                    { name: 'Acessos registrados', value: `${traffic.current.toLocaleString('pt-BR')}${trafficDelta}`, inline: true },
                    { name: 'Esperando revisão', value: String(pipeline.needsReview), inline: true },
                    { name: 'Prontas p/ publicar', value: String(pipeline.generated), inline: true },
                    {
                        name: 'Último backup',
                        value: backup ? `há ${backup.ageHours}h (${backup.sizeMb} MB)` : 'nenhum encontrado',
                        inline: true,
                    },
                    { name: 'Disco', value: disk ? `${disk.usedPercent}% usado` : 'indisponível', inline: true },
                ],
            });
        } catch (error) {
            DailyReportService.logger.error(`Daily report failed: ${error instanceof Error ? error.message : String(error)}`);
            return false;
        }
    }

    private static async publishedSince(since: number) {
        const PostsEntity = Repository.getEntity("PostsEntity");
        const result = await Repository.findAll(PostsEntity, {
            status: 'published',
            publishedAt: MoreThanOrEqual(new Date(since).toISOString()),
            limit: 25,
            sortBy: 'publishedAt',
            sort: 'DESC',
        }, [], {
            select: ['id', 'title', 'slug', 'type', 'noindex', 'deleted', 'publishedAt'],
        } as any);

        return (result?.data || [])
            .filter((p: any) => p.type === 'post' && !p.deleted)
            .map((p: any) => ({ title: String(p.title || ''), slug: String(p.slug || ''), noindex: !!p.noindex }));
    }

    private static async pipelineCounts() {
        const FeedRawEntity = Repository.getEntity("FeedRawEntity");
        const [needsReview, generated] = await Promise.all([
            Repository.count(FeedRawEntity, { pipelineState: 'needs_review' }),
            Repository.count(FeedRawEntity, { pipelineState: 'generated' }),
        ]);
        return { needsReview: needsReview || 0, generated: generated || 0 };
    }

    private static async trafficCounts(now: number) {
        const AnalyticsAccessEntity = Repository.getEntity("AnalyticsAccessEntity");
        const [current, previous] = await Promise.all([
            Repository.count(AnalyticsAccessEntity, { startTime: MoreThanOrEqual(now - DAY_MS) }),
            Repository.count(AnalyticsAccessEntity, { startTime: Between(now - 2 * DAY_MS, now - DAY_MS) }),
        ]);
        return { current: current || 0, previous: previous || 0 };
    }

    private static latestBackup(now: number) {
        const backupDir = path.join(cwd(), "medias", "backup");
        if (!fs.existsSync(backupDir)) return null;

        const latest = fs.readdirSync(backupDir)
            .filter((f) => f.startsWith('sqlite_backup_') && f.endsWith('.tar.gz'))
            .map((f) => fs.statSync(path.join(backupDir, f)))
            .sort((a, b) => b.mtimeMs - a.mtimeMs)[0];
        if (!latest) return null;

        return {
            ageHours: Math.floor((now - latest.mtimeMs) / 3600000),
            sizeMb: Math.round(latest.size / 1024 / 1024),
        };
    }

    private static diskUsage() {
        try {
            const stats = fs.statfsSync(cwd());
            const usedPercent = Math.round((1 - stats.bavail / stats.blocks) * 100);
            return { usedPercent };
        } catch {
            return null;
        }
    }
}
