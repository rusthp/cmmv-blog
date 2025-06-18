import * as xml2js from 'xml2js';

import {
    Service, Cron,
    CronExpression, Application
} from "@cmmv/core";

import {
    Repository, LessThan
} from "@cmmv/repository";

//@ts-ignore
// import { MediasService } from "@cmmv/blog"; // Removido pois não será mais usado
import { Buffer } from 'buffer';

@Service()
export class OddsSyncCountriesService {
    /**
     * Syncs countries from a configured third-party API.
     * @param settingId - The ID of the API setting to use.
     * @param endpoint - The endpoint to fetch countries from (e.g., /countries).
     * @returns A summary of the synchronization result.
     */
    async syncCountriesFromAPI(settingId: string, endpoint: string) {
        const OddsSettingsEntity = Repository.getEntity("OddsSettingsEntity");
        const OddsCountriesEntity = Repository.getEntity("OddsCountriesEntity");

        const setting = await Repository.findOne(OddsSettingsEntity, { id: settingId });
        if (!setting) {
            throw new Error("API Setting not found");
        }

        const url = `${setting.baseUrl.replace(/\/$/, '')}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
        const headers: Record<string, string> = {};

        // Build authentication and custom headers
        if (setting.authType === 'API Key' || setting.authType === 'Bearer Token') {
            const customHeaders = JSON.parse(setting.headers || '{}');
            for (const key in customHeaders) {
                headers[key] = customHeaders[key].replace('{{apiKey}}', setting.apiKey);
            }
        } else if (setting.authType === 'Basic Auth') {
            const token = Buffer.from(`${setting.username}:${setting.password}`).toString('base64');
            headers['Authorization'] = `Basic ${token}`;
            const customHeaders = JSON.parse(setting.headers || '{}');
            for (const key in customHeaders) {
                headers[key] = customHeaders[key];
            }
        } else {
             const customHeaders = JSON.parse(setting.headers || '{}');
            for (const key in customHeaders) {
                headers[key] = customHeaders[key];
            }
        }

        const response = await fetch(url, { headers });
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`External API request failed with status ${response.status}: ${errorBody}`);
        }

        const data = await response.json();
        const countriesFromAPI = data.response;

        if (!Array.isArray(countriesFromAPI)) {
            throw new Error("Invalid response format from external API. Expected a 'response' array.");
        }

        let createdCount = 0;
        let updatedCount = 0;
        // const mediasService: any = Application.resolveProvider(MediasService); // Removido pois não será mais usado

        for (const country of countriesFromAPI) {
            if (!country.name || !country.code) {
                continue; // Skip entries without name or code
            }

            let localFlagUrl = null;
            if (country.flag && country.flag.startsWith('http')) {
                // Salva diretamente a URL da API, como solicitado.
                localFlagUrl = country.flag;
            }

            const existingCountry = await Repository.findOne(OddsCountriesEntity, { code: country.code });

            const countryData = {
                name: country.name,
                code: country.code,
                flag: localFlagUrl || (existingCountry ? existingCountry.flag : null)
            };

            if (existingCountry) {
                await Repository.update(OddsCountriesEntity, existingCountry.id, countryData);
                updatedCount++;
            } else {
                await Repository.insert(OddsCountriesEntity, countryData);
                createdCount++;
            }
        }

        return {
            success: true,
            message: `Synchronization complete. Created: ${createdCount}, Updated: ${updatedCount}.`,
            created: createdCount,
            updated: updatedCount
        };
    }
}
