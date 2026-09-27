/**
 * Operational alerts to Discord channel webhooks.
 *
 * Webhook URLs come from the environment (apps/api/.env):
 *   DISCORD_WEBHOOK_PROPLAY -> content/pipeline alerts and the daily report
 *   DISCORD_WEBHOOK_INFRA   -> backups and infrastructure
 * An unset variable disables that channel silently.
 *
 * Never throws and never blocks the caller for more than a few seconds: an alert
 * failing must not break the pipeline or the backup that triggered it.
 */

export type DiscordChannel = 'proplay' | 'infra';

export const DISCORD_COLOR = {
    OK: 0x57f287,
    WARN: 0xfee75c,
    ERROR: 0xed4245,
    INFO: 0x5865f2,
} as const;

export interface DiscordAlert {
    title: string;
    description?: string;
    color?: number;
    url?: string;
    fields?: { name: string; value: string; inline?: boolean }[];
}

const WEBHOOK_ENV: Record<DiscordChannel, string> = {
    proplay: 'DISCORD_WEBHOOK_PROPLAY',
    infra: 'DISCORD_WEBHOOK_INFRA',
};

const USERNAME: Record<DiscordChannel, string> = {
    proplay: 'ProPlay News',
    infra: 'Infra',
};

// Discord embed limits: title 256, description 4096, field value 1024, 25 fields.
const clip = (text: string, max: number) => (text.length > max ? `${text.substring(0, max - 1)}…` : text);

export async function notifyDiscord(channel: DiscordChannel, alert: DiscordAlert): Promise<boolean> {
    const webhookUrl = process.env[WEBHOOK_ENV[channel]];
    if (!webhookUrl) return false;

    const embed = {
        title: clip(alert.title, 256),
        description: alert.description ? clip(alert.description, 4096) : undefined,
        color: alert.color ?? DISCORD_COLOR.INFO,
        url: alert.url || undefined,
        fields: (alert.fields || []).slice(0, 25).map((f) => ({
            name: clip(f.name, 256),
            value: clip(f.value || '—', 1024),
            inline: f.inline ?? false,
        })),
        timestamp: new Date().toISOString(),
    };

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: USERNAME[channel], embeds: [embed] }),
            signal: AbortSignal.timeout(8000),
        });

        if (!response.ok) {
            console.error(`[discord] ${channel} webhook returned ${response.status}`);
            return false;
        }
        return true;
    } catch (error) {
        console.error(`[discord] ${channel} webhook failed: ${error instanceof Error ? error.message : String(error)}`);
        return false;
    }
}
