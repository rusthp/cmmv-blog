import {
    Service, Config
} from "@cmmv/core";

import {
    Repository
} from "@cmmv/repository";

export interface Theme {
    namespace: string;
    name: string;
    description: string;
    author: string;
    version: string;
    preview: string;
    installed: boolean;
    lastCheck: Date;
    url: string;
}

import { SettingsService } from "../settings/settings.service";

@Service('blog_themes_public')
export class ThemesPublicService {

    constructor(private readonly settingsService: SettingsService) {}

    /**
     * Get all installed themes
     * @returns List of themes
     */
    async getInstalledThemes() {
        try {
            const themeCurrentName = Config.get("blog.theme", "default");

            // Garantir que a URL tenha um protocolo válido
            let frontendUrl = process.env.FRONTEND_URL || '';
            if (frontendUrl && !frontendUrl.startsWith('http')) {
                frontendUrl = `http://${frontendUrl}`;
            }

            // Verificar se temos uma URL válida
            if (!frontendUrl) {
                console.warn('FRONTEND_URL not defined, returning default theme only');
                return {
                    data: [{
                        namespace: 'default',
                        name: 'Default',
                        active: true,
                        description: 'Default theme',
                        author: 'CMMV',
                        version: '1.0.0',
                        preview: null,
                    }]
                };
            }

            const themes = await fetch(`${frontendUrl}/themas`);
            const themeList: any[] = await themes.json();
            let themesData: any[] = [];

            themeList?.map(theme => {
                themesData.push({
                    namespace: theme.namespace,
                    name: theme.name,
                    active: (theme.name.toLowerCase() === themeCurrentName.toLowerCase()),
                    description: theme.description,
                    author: theme.author,
                    version: theme.version,
                    preview: theme.preview,
                });

                return theme;
            });

            return { data: themesData };
        } catch (error) {
            console.error('Error fetching themes:', error);

            // Retornar pelo menos o tema padrão para não quebrar a interface
            return {
                data: [{
                    namespace: 'default',
                    name: 'Default',
                    active: true,
                    description: 'Default theme',
                    author: 'CMMV',
                    version: '1.0.0',
                    preview: null,
                }]
            };
        }
    }

    /**
     * Upsert a theme
     * @param themes List of themes to upsert
     * @returns
     */
    async upsertTheme(themes: Theme[]) {
        const ThemesEntity = Repository.getEntity("ThemesEntity");

        for (const theme of Object.values(themes)) {
            const existingTheme = await Repository.findOne(ThemesEntity, {
                name: theme.name
            });

            const themeData = {
                namespace: theme.namespace,
                name: theme.name,
                description: theme.description,
                author: theme.author,
                version: theme.version,
                preview: theme.preview,
            }

            if (existingTheme)
                await Repository.update(ThemesEntity, existingTheme.id, themeData);
            else
                await Repository.insert(ThemesEntity, themeData);
        }

        return {
            success: true,
            message: "Themes upserted successfully"
        };
    }

    /**
     * Set the active theme
     * @param themeName - The name of the theme to set as active
     * @returns {Promise<{ message: string }>}
     */
    async setActiveTheme(themeName: string) {
        try {
            Config.set("blog.theme", themeName.toLowerCase());
            await this.settingsService.updateSetting("blog.theme", themeName.toLowerCase());

            let frontendUrl = process.env.FRONTEND_URL || '';
            if (frontendUrl && !frontendUrl.startsWith('http'))
                frontendUrl = `http://${frontendUrl}`;

            if (frontendUrl) {
                await fetch(`${frontendUrl}/set-thema`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.API_SIGNATURE}`
                    },
                    body: JSON.stringify({
                        theme: themeName.toLowerCase()
                    })
                });
            }

            return { message: "Theme set as active" };
        } catch (error) {
            return { message: "Theme set as active (frontend sync failed)" };
        }
    }
}
