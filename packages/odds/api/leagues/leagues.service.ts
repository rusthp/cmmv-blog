import {
    Service
} from "@cmmv/core";

import {
    Repository
} from "@cmmv/repository";
import { Buffer } from 'buffer';
import { OddsLeaguesContract } from "../../contracts/odds-leagues.contract";

@Service()
export class OddsSyncLeaguesService {
    async syncLeaguesFromAPI(settingId: string, endpoint: string) {
        const OddsSettingsEntity = Repository.getEntity("OddsSettingsEntity");
        const OddsCountriesEntity = Repository.getEntity("OddsCountriesEntity");
        const OddsLeaguesEntity = Repository.getEntity("OddsLeaguesEntity");

        const setting = await Repository.findOne(OddsSettingsEntity, { id: settingId });
        if (!setting) {
            throw new Error("API Setting not found");
        }

        const url = `${setting.baseUrl.replace(/\/$/, '')}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
        const headers: Record<string, string> = {};

        if (setting.authType === 'API Key' || setting.authType === 'Bearer Token') {
            const customHeaders = JSON.parse(setting.headers || '{}');
            for (const key in customHeaders) {
                headers[key] = customHeaders[key].replace('{{apiKey}}', setting.apiKey);
            }
        } else if (setting.authType === 'Basic Auth') {
            const token = Buffer.from(`${setting.username}:${setting.password}`).toString('base64');
            headers['Authorization'] = `Basic ${token}`;
        }
        
        const response = await fetch(url, { headers });
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`External API request failed with status ${response.status}: ${errorBody}`);
        }

        const data = await response.json();
        const leaguesFromAPI = data.response;

        if (!Array.isArray(leaguesFromAPI)) {
            throw new Error("Invalid response format from external API. Expected a 'response' array.");
        }

        let createdCount = 0;
        let updatedCount = 0;

        for (const leagueData of leaguesFromAPI) {
            const { league, country, seasons } = leagueData;
            if (!league || !league.id || !seasons || !seasons[0]) {
                continue; // Skip invalid entries
            }

            const season = seasons[0];
            
            let countryEntity = null;
            if (country && country.code) {
                countryEntity = await Repository.findOne(OddsCountriesEntity, { code: country.code });
            }

            const leaguePayload: Partial<OddsLeaguesContract> = {
                external_id: league.id,
                name: league.name,
                type: league.type,
                logo: league.logo,
                odds: season.coverage.odds,
                year: season.year,
                start_date: new Date(season.start),
                end_date: new Date(season.end),
                current: season.current,
                country_id: countryEntity ? countryEntity.id : null,
            };

            const existingLeague = await Repository.findOne(OddsLeaguesEntity, { external_id: league.id });

            if (existingLeague) {
                await Repository.update(OddsLeaguesEntity, existingLeague.id, leaguePayload);
                updatedCount++;
            } else {
                await Repository.insert(OddsLeaguesEntity, leaguePayload);
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