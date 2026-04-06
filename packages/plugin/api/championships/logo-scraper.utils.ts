import * as fs from 'fs';
import * as path from 'path';
const ASSETS_DIR = path.join(process.cwd(), 'apps', 'web', 'public', 'assets', 'teams');

const KNOWN_LOGOS: Record<string, string> = {
    'vitality': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/vitality/vitality-logo.png',
    'furia': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/furia/furia-logo.png',
    'mouz': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/mousesports/mousesports-logo.png',
    'natus vincere': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/natus-vincere/natus-vincere-logo.png',
    'navi': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/natus-vincere/natus-vincere-logo.png',
    'faze': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/faze/faze-logo.png',
    'faze clan': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/faze/faze-logo.png',
    'g2': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/g2/g2-logo.png',
    'liquid': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/liquid/liquid-logo.png',
    'team liquid': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/liquid/liquid-logo.png',
    'astralis': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/astralis/astralis-logo.png',
    'heroic': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/heroic/heroic-logo.png',
    'virtus.pro': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/virtus-pro/virtus-pro-logo.png',
    'complexity': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/complexity/complexity-logo.png',
    'nip': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/ninjas-in-pyjamas/ninjas-in-pyjamas-logo.png',
    'ninjas in pyjamas': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/ninjas-in-pyjamas/ninjas-in-pyjamas-logo.png',
    'fnatic': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/fnatic/fnatic-logo.png',
    'cloud9': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/cloud9/cloud9-logo.png',
    'big': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/big/big-logo.png',
    'ence': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/ence/ence-logo.png',
    'mibr': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/mibr/mibr-logo.png'
};

// Additional team logo mappings
const ADDITIONAL_TEAM_LOGOS: Record<string, string> = {
    '9ine': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/9ine/9ine-logo.png',
    'betboom': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/betboom/betboom-logo.png',
    'the mongolz': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/the-mongolz/the-mongolz-logo.png',
    'bestia': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/bestia/bestia-logo.png',
    'paiN gaming': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/pain-gaming/pain-gaming-logo.png',
    'sharks': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/sharks/sharks-logo.png',
    'monte': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/monte/monte-logo.png',
    'falcons': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/falcons/falcons-logo.png',
    'flyquest': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/flyquest/flyquest-logo.png',
    'ecstatic': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/ecstatic/ecstatic-logo.png',
    'gentle mates': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/gentle-mates/gentle-mates-logo.png',
    'b8': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/b8/b8-logo.png',
    'bc.game': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/bc-game/bc-game-logo.png',
    'k27': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/k27/k27-logo.png',
    'spirit': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/spirit/spirit-logo.png',
    'aurora': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/aurora/aurora-logo.png',
    'nrg': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/nrg/nrg-logo.png',
    '3dmax': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/3dmax/3dmax-logo.png',
    'illwill': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/illwill/illwill-logo.png',
    'm80': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/m80/m80-logo.png',
    'hotu': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/hotu/hotu-logo.png',
    'red canids': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/red-canids/red-canids-logo.png',
    'legacy': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/legacy/legacy-logo.png',
    'alliance': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/alliance/alliance-logo.png',
    'nemiga': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/nemiga/nemiga-logo.png',
    'parivision': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/parivision/parivision-logo.png',
    'imperial': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/imperial/imperial-logo.png',
    'furia': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/furia/furia-logo.png',
    'gamerlegion': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/gamerlegion/gamerlegion-logo.png',
    '100 thieves': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/100-thieves/100-thieves-logo.png',
    'whitebird': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/whitebird/whitebird-logo.png',
    'nuclear tigeres': 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/nuclear-tigeres/nuclear-tigeres-logo.png',
};

export class LogoScraperService {
    constructor() {
        if (!fs.existsSync(ASSETS_DIR)) {
            try {
                fs.mkdirSync(ASSETS_DIR, { recursive: true });
            } catch (e) {
                console.error('[LogoScraper] Error creating assets directory:', e);
            }
        }
    }

    private async sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    public async findAndDownloadLogo(teamName: string, fallbackUrl?: string | null): Promise<string | null> {
        if (!teamName) return null;

        const safeName = teamName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        // Check if ANY extension exists locally
        const exts = ['.svg', '.png', '.jpg', '.webp'];
        for (const ext of exts) {
            const checkPath = path.join(ASSETS_DIR, `${safeName}${ext}`);
            if (fs.existsSync(checkPath)) {
                return `/assets/teams/${safeName}${ext}`;
            }
        }

        console.log(`[LogoScraper] Attempting to find logo for: ${teamName}`);

        // Try sources in order: 1) KNOWN_LOGOS, 2) ADDITIONAL logos, 3) fallbackUrl
        let targetImageUrl: string | null = null;
        const key = teamName.toLowerCase().trim();
        targetImageUrl = KNOWN_LOGOS[key] || ADDITIONAL_TEAM_LOGOS[key] || fallbackUrl || null;

        if (!targetImageUrl) {
            console.log(`[LogoScraper] No logo source available for ${teamName}`);
            return null;
        }

        console.log(`[LogoScraper] Found source URL: ${targetImageUrl}, downloading...`);

        try {
            let fileExt = '.png';
            if (targetImageUrl.endsWith('.svg') || targetImageUrl.includes('.svg?')) fileExt = '.svg';
            if (targetImageUrl.endsWith('.jpg') || targetImageUrl.includes('.jpg?')) fileExt = '.jpg';
            if (targetImageUrl.endsWith('.webp') || targetImageUrl.includes('.webp?')) fileExt = '.webp';

            const finalFilename = `${safeName}${fileExt}`;
            const localPath = path.join(ASSETS_DIR, finalFilename);

            const response = await fetch(targetImageUrl, {
                headers: {
                    'User-Agent': 'ProPlayNews-Ranking-Bot/1.0 (info@proplaynews.com)',
                    'Accept': 'image/avif,image/webp,*/*;q=0.8'
                },
                signal: AbortSignal.timeout(10000)
            });

            if (!response.ok) {
                console.log(`[LogoScraper] Download failed with status ${response.status}`);
                return null;
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            fs.writeFileSync(localPath, buffer);
            console.log(`[LogoScraper] Saved ${teamName} logo to ${localPath}`);

            await this.sleep(1000);

            return `/assets/teams/${finalFilename}`;

        } catch (error: any) {
            console.log(`[LogoScraper] Download failed: ${error.message}`);
        }

        return null;
    }
}
