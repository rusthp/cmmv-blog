import {
    Service, Cron,
    CronExpression, Application
} from "@cmmv/core";

import { HttpService } from "@cmmv/http";

import {
    Repository, LessThan,
    IsNull, Not
} from "@cmmv/repository";
//@ts-ignore
import { MediasService } from "@cmmv/blog";

import { Buffer } from 'buffer';
import * as path from "node:path";
import * as xml2js from 'xml2js';
const sharp = require('sharp');

@Service()
export class OddsSyncCountriesService {
    constructor(
        private readonly mediasService: MediasService,
        private readonly httpService: HttpService
    ) {}

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

        for (const country of countriesFromAPI) {
            if (!country.name || !country.code)
                continue;

            let localFlagUrl = null;
            if (country.flag && country.flag.startsWith('http')) {
                localFlagUrl = country.flag;
            }

            const existingCountry = await Repository.findOne(OddsCountriesEntity, { code: country.code });

            const countryData = {
                name: country.name,
                code: country.code,
                flag: localFlagUrl || (existingCountry ? existingCountry.flag : null),
                flagProcessed: false,
                processedFlagUrl: null
            };

            if (existingCountry) {
                if (existingCountry.flag !== localFlagUrl) {
                    countryData.flagProcessed = false;
                    countryData.processedFlagUrl = null;
                } else {
                    countryData.flagProcessed = existingCountry.flagProcessed;
                    countryData.processedFlagUrl = existingCountry.processedFlagUrl;
                }

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

    /**
     * Process a single country flag through the media system
     * @param countryId The ID of the country to process
     * @returns Result of the processing
     */
    async processCountryFlag(countryId: string) {
        try {
            const OddsCountriesEntity = Repository.getEntity("OddsCountriesEntity");
            const country = await Repository.findOne(OddsCountriesEntity, { id: countryId });

            if (!country)
                throw new Error("Country not found");


            if (!country.flag)
                throw new Error("Country has no flag URL to process");

            const response = await fetch(country.flag);
            if (!response.ok) {
                throw new Error(`Failed to download image from ${country.flag}. Status: ${response.status}`);
            }

            let imageBuffer = Buffer.from(await response.arrayBuffer());
            let contentType = 'image/webp';
            const isSvg = (response.headers.get('content-type') || '').includes('svg') || country.flag.endsWith('.svg');

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
                48,
                80,
                country.name
            );

            if (!processedUrl)
                throw new Error("Failed to process image with MediasService");

            console.log(`[DEBUG] Attempting to update country. ID: ${countryId}`);
            console.log(`[DEBUG] New processedFlagUrl: ${processedUrl}`);

            const updateResult = await Repository.updateOne(OddsCountriesEntity, { id: countryId }, {
                flagProcessed: true,
                processedFlagUrl: processedUrl,
            });

            console.log('[DEBUG] Repository.updateOne result:', JSON.stringify(updateResult, null, 2));

            let updateFailed = false;
            if (typeof updateResult === 'object' && updateResult !== null) {
                // @ts-ignore - Confiaremos que o objeto tem a propriedade 'affected'
                if (updateResult.affected === 0) {
                    updateFailed = true;
                }
            } else if (updateResult !== true) {
                updateFailed = true;
            }

            if (updateFailed) {
                console.error(`[DEBUG] Update failed. Result was:`, JSON.stringify(updateResult, null, 2));
                throw new Error("Database update failed: Country record was not updated.");
            }

            return {
                success: true,
                message: "Flag processed and updated successfully",
                url: processedUrl
            };
        } catch (error: any) {
            console.error('Error processing flag:', error.message);
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Process all unprocessed country flags
     * @returns Summary of the processing
     */
    async processAllFlags() {
        const OddsCountriesEntity = Repository.getEntity("OddsCountriesEntity");

        const query = {
            flag: Not(IsNull()),
            flagProcessed: false,
            limit: 1000
        };

        const countries = await Repository.findAll(OddsCountriesEntity, query);

        if (!countries?.data || countries.data.length === 0) {
            return {
                success: true,
                message: "No flags to process",
                processed: 0,
                failed: 0
            };
        }

        let processed = 0;
        let failed = 0;
        const errors: Array<{id: string, error: string}> = [];

        for (const country of countries.data) {
            try {
                await this.processCountryFlag(country.id);
                processed++;
            } catch (error: any) {
                failed++;
                errors.push({
                    id: country.id,
                    error: error.message
                });
            }
        }

        return {
            success: true,
            message: `Processed ${processed} flags, ${failed} failed`,
            processed,
            failed,
            errors
        };
    }

    /**
     * Get countries
     * @param queries The queries to filter the countries
     * @returns The countries
     */
    async getCountries(queries: any) {
        const OddsCountriesEntity = Repository.getEntity("OddsCountriesEntity");
        const countries = await Repository.findAll(OddsCountriesEntity, queries);
        return countries;
    }
}
