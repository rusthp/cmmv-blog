import {
    Service
} from "@cmmv/core";

import {
    Repository, Not, IsNull
} from "@cmmv/repository";
//@ts-ignore
import { MediasService } from "@cmmv/blog";
import { Buffer } from 'buffer';
import { OddsLeaguesContract } from "../../contracts/odds-leagues.contract";
import { randomUUID } from "crypto";
const sharp = require('sharp');

export interface JobStatus {
    total: number;
    processed: number;
    failed: number;
    status: 'running' | 'completed' | 'error';
    errors: Array<{ id: string, error: string }>;
}

@Service()
export class OddsSyncLeaguesService {
    private jobs = new Map<string, JobStatus>();
    constructor(private readonly mediasService: MediasService) {}

    /**
     * Sync leagues from API
     * @param settingId The ID of the setting
     * @param endpoint The endpoint to sync leagues from
     * @returns The synchronization result
     */
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

            const existingLeague = await Repository.findOne(OddsLeaguesEntity, { external_id: league.id });

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
                country_id: countryEntity ? countryEntity.id : undefined,
                logoProcessed: false, // Reset on sync
                processedLogoUrl: undefined,
            };

            if (existingLeague) {
                if (existingLeague.logo === league.logo) {
                    // if logo is the same, keep the processed state
                    leaguePayload.logoProcessed = existingLeague.logoProcessed;
                    leaguePayload.processedLogoUrl = existingLeague.processedLogoUrl;
                }
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

    /**
     * Process a league logo
     * @param leagueId The ID of the league
     * @returns The processing result
     */
    async processLeagueLogo(leagueId: string) {
        try {
            const OddsLeaguesEntity = Repository.getEntity("OddsLeaguesEntity");
            const league = await Repository.findOne(OddsLeaguesEntity, { id: leagueId });

            if (!league) {
                throw new Error("League not found");
            }

            if (!league.logo) {
                throw new Error("League has no logo URL to process");
            }

            const response = await fetch(league.logo);
            if (!response.ok) {
                throw new Error(`Failed to download image from ${league.logo}. Status: ${response.status}`);
            }

            let imageBuffer = Buffer.from(await response.arrayBuffer());
            let contentType = 'image/webp';

            const isSvg = (response.headers.get('content-type') || '').includes('svg') || league.logo.endsWith('.svg');
            if (isSvg) {
                const webpBuffer = await sharp(imageBuffer).webp().toBuffer();
                imageBuffer = Buffer.from(webpBuffer);
            }

            const base64 = imageBuffer.toString('base64');
            const dataUrl = `data:${contentType};base64,${base64}`;

            const processedUrl = await this.mediasService.getImageUrl(
                dataUrl,
                "webp",
                64,
                64,
                80,
                league.name
            );

            if (!processedUrl) {
                throw new Error("Failed to process image with MediasService");
            }

            await Repository.updateOne(OddsLeaguesEntity, { id: leagueId }, {
                logoProcessed: true,
                processedLogoUrl: processedUrl,
            });

            return {
                success: true,
                message: "Logo processed and updated successfully",
                url: processedUrl
            };
        } catch (error: any) {
            console.error('Error processing logo:', error.message);
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Start the process of all logos
     * @returns The job ID
     */
    async startProcessAllLogos(): Promise<{ jobId: string }> {
        const OddsLeaguesEntity = Repository.getEntity("OddsLeaguesEntity");
        const allUnprocessed = await Repository.findAll(OddsLeaguesEntity, {
            logo: Not(IsNull()),
            logoProcessed: false,
            limit: 10000
        });

        const total = allUnprocessed?.data?.length || 0;

        const jobId = randomUUID();
        this.jobs.set(jobId, {
            total,
            processed: 0,
            failed: 0,
            status: 'running',
            errors: []
        });

        // Não aguarde aqui! Deixe rodar em segundo plano.
        this._executeLogoProcessingJob(jobId);

        return { jobId };
    }

    /**
     * Get the status of the process of all logos
     * @param jobId The ID of the job
     * @returns The job status
     */
    getProcessAllLogosStatus(jobId: string): JobStatus | { status: 'not_found' } {
        const job = this.jobs.get(jobId);
        if (!job) {
            return { status: 'not_found' };
        }
        return job;
    }

    /**
     * Execute the logo processing job
     * @param jobId The ID of the job
     */
    private async _executeLogoProcessingJob(jobId: string) {
        const BATCH_SIZE = 20;
        const OddsLeaguesEntity = Repository.getEntity("OddsLeaguesEntity");
        const jobState = this.jobs.get(jobId);

        if (!jobState) return;

        try {
            while (jobState.processed + jobState.failed < jobState.total) {
                const leaguesToProcess = await Repository.findAll(OddsLeaguesEntity, {
                    logo: Not(IsNull()),
                    logoProcessed: false,
                    limit: BATCH_SIZE
                });

                if (!leaguesToProcess?.data || leaguesToProcess.data.length === 0) {
                    // Se não houver mais itens, encerre
                    break;
                }

                for (const league of leaguesToProcess.data) {
                    try {
                        await this.processLeagueLogo(league.id);
                        jobState.processed++;
                    } catch (error: any) {
                        jobState.failed++;
                        jobState.errors.push({ id: league.id, error: error.message });
                    }
                }
            }
            jobState.status = 'completed';
        } catch (error: any) {
            jobState.status = 'error';
        }
    }

    /**
     * Get leagues
     * @param queries The queries to filter the leagues
     * @returns The leagues
     */
    async getLeagues(queries: any) {
        const OddsLeaguesEntity = Repository.getEntity("OddsLeaguesEntity");
        const leagues = await Repository.findAll(OddsLeaguesEntity, queries);
        return leagues;
    }
}