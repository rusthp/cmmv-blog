import { Service } from "@cmmv/core";
import { Repository, Not, IsNull } from "@cmmv/repository";
import { Buffer } from 'buffer';
import { OddsVenuesContract } from "../../contracts/odds-venues.contract";
import { Logger } from "@cmmv/core";
//@ts-ignore
import { MediasService } from "@cmmv/blog";
import { randomUUID } from "crypto";
const sharp = require('sharp');

// Interface para o progresso da sincronização
export interface SyncProgress {
    totalCountries: number;
    processedCountries: number;
    currentCountry: string;
    totalCreated: number;
    totalUpdated: number;
    status: 'running' | 'completed' | 'error';
    error?: string;
    percentage: number;
}

// Interface para o progresso do processamento de imagens
export interface ImageJobStatus {
    total: number;
    processed: number;
    failed: number;
    status: 'running' | 'completed' | 'error';
    errors: Array<{ id: string, error: string }>;
}

@Service()
export class OddsSyncVenuesService {
    private readonly logger = new Logger("OddsSyncVenuesService");

    // Armazenamento do progresso da sincronização
    private syncProgressStore: Record<string, SyncProgress> = {};
    private imageJobs = new Map<string, ImageJobStatus>();

    constructor(private readonly mediasService: MediasService) {}

    /**
     * Start the synchronization of venues by countries
     * @param settingId The ID of the setting
     * @returns The synchronization result
     */
    async startSyncAllVenuesByCountries(settingId: string) {
        const syncId = `sync_${Date.now()}`;

        this.syncProgressStore[syncId] = {
            totalCountries: 0,
            processedCountries: 0,
            currentCountry: 'Iniciando...',
            totalCreated: 0,
            totalUpdated: 0,
            status: 'running',
            percentage: 0
        };

        this.syncAllVenuesByCountries(settingId, syncId)
            .then(result => {
                if (this.syncProgressStore[syncId]) {
                    this.syncProgressStore[syncId].status = 'completed';
                    this.syncProgressStore[syncId].percentage = 100;

                    setTimeout(() => {
                        delete this.syncProgressStore[syncId];
                    }, 5 * 60 * 1000);
                }
            })
            .catch(error => {
                if (this.syncProgressStore[syncId]) {
                    this.syncProgressStore[syncId].status = 'error';
                    this.syncProgressStore[syncId].error = error.message;
                }
            });

        return {
            success: true,
            message: 'Synchronization started',
            syncId
        };
    }

    /**
     * Get the progress of the synchronization
     * @param syncId The ID of the synchronization
     * @returns The progress of the synchronization
     */
    getSyncProgress(syncId: string) {
        const progress = this.syncProgressStore[syncId];
        if (!progress) {
            return { error: 'Sync process not found' };
        }
        return progress;
    }

    /**
     * Sync venues by countries
     * @param settingId The ID of the setting
     * @param syncId The ID of the synchronization
     * @returns The synchronization result
     */
    async syncAllVenuesByCountries(
        settingId: string,
        syncId?: string
    ) {
        this.logger.log(`Iniciando sincronização de venues para todos os países`);

        try {
            const OddsCountriesEntity = Repository.getEntity("OddsCountriesEntity");
            const countriesResult = await Repository.findAll(OddsCountriesEntity, { limit: 10000 }, [], { select: ["id", "name"] });
            const countries = (countriesResult && countriesResult.data) ? countriesResult.data : [];

            this.logger.log(`Encontrados ${countries.length} países para buscar venues`);

            if (syncId && this.syncProgressStore[syncId]) {
                this.syncProgressStore[syncId].totalCountries = countries.length;
                this.syncProgressStore[syncId].percentage = 0;
            }

            let totalCreated = 0;
            let totalUpdated = 0;
            let processedCountries = 0;

            const batchSize = 5;
            for (let i = 0; i < countries.length; i += batchSize) {
                const batch = countries.slice(i, i + batchSize);

                this.logger.log(`Processando lote de países ${i+1} até ${Math.min(i+batchSize, countries.length)} de ${countries.length}`);

                const results = await Promise.all(
                    batch.map(async (country: { id: string; name: string }) => {
                        try {
                            this.logger.log(`Buscando venues para país: ${country.name}`);

                            if (syncId && this.syncProgressStore[syncId])
                                this.syncProgressStore[syncId].currentCountry = country.name;

                            const result = await this.syncVenuesFromAPI(settingId, "/venues", country.name);
                            processedCountries++;

                            this.logger.log(`Concluído país ${processedCountries}/${countries.length}: ${country.name} - Criados: ${result.created}, Atualizados: ${result.updated}`);

                            if (syncId && this.syncProgressStore[syncId]) {
                                this.syncProgressStore[syncId].processedCountries = processedCountries;
                                this.syncProgressStore[syncId].percentage = Math.round((processedCountries / countries.length) * 100);
                                this.syncProgressStore[syncId].totalCreated += result.created || 0;
                                this.syncProgressStore[syncId].totalUpdated += result.updated || 0;
                            }

                            return result;
                        } catch (error) {
                            this.logger.error(`Erro ao buscar venues para país ${country.name}: ${error instanceof Error ? error.message : String(error)}`);
                            processedCountries++;

                            if (syncId && this.syncProgressStore[syncId]) {
                                this.syncProgressStore[syncId].processedCountries = processedCountries;
                                this.syncProgressStore[syncId].percentage = Math.round((processedCountries / countries.length) * 100);
                            }

                            return { created: 0, updated: 0 };
                        }
                    })
                );

                for (const result of results) {
                    totalCreated += result.created || 0;
                    totalUpdated += result.updated || 0;
                }

                if (i + batchSize < countries.length)
                    await new Promise(resolve => setTimeout(resolve, 2000));
            }

            this.logger.log(`Sincronização completa para todos os países. Total criados: ${totalCreated}, Total atualizados: ${totalUpdated}`);

            return {
                success: true,
                message: `Synchronization complete for all countries. Created: ${totalCreated}, Updated: ${totalUpdated}.`,
                created: totalCreated,
                updated: totalUpdated
            };
        } catch (error) {
            this.logger.error(`Erro na sincronização de todos os países: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    /**
     * Sync venues from API
     * @param settingId The ID of the setting
     * @param endpoint The endpoint to sync venues from
     * @param countryName The name of the country
     * @param searchTerm The search term
     * @param venueId The ID of the venue
     * @param venueName The name of the venue
     * @param cityName The name of the city
     * @returns The synchronization result
     */
    async syncVenuesFromAPI(
        settingId: string,
        endpoint: string,
        countryName?: string,
        searchTerm?: string,
        venueId?: number,
        venueName?: string,
        cityName?: string
    ) {
        this.logger.log(`Iniciando sincronização de venues. SettingId: ${settingId}, Endpoint: ${endpoint}, Country: ${countryName || 'não especificado'}`);

        try {
            const OddsSettingsEntity = Repository.getEntity("OddsSettingsEntity");
            const OddsCountriesEntity = Repository.getEntity("OddsCountriesEntity");
            const OddsVenuesEntity = Repository.getEntity("OddsVenuesEntity");

            const setting = await Repository.findOne(OddsSettingsEntity, { id: settingId });
            if (!setting) {
                throw new Error("API Setting not found");
            }

            let url = `${setting.baseUrl.replace(/\/$/, '')}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

            const queryParams = new URLSearchParams();

            // Adicionar parâmetros de busca - pelo menos um é necessário
            if (countryName) {
                queryParams.append('country', countryName);
            }

            if (searchTerm) {
                queryParams.append('search', searchTerm);
            }

            if (venueId) {
                queryParams.append('id', venueId.toString());
            }

            if (venueName) {
                queryParams.append('name', venueName);
            }

            if (cityName) {
                queryParams.append('city', cityName);
            }

            // Se nenhum parâmetro foi fornecido, use um padrão
            if (queryParams.toString() === '') {
                if (countryName) {
                    queryParams.append('country', countryName);
                } else {
                    // Se nenhum parâmetro foi fornecido, use um padrão
                    queryParams.append('search', 'stadium');
                    this.logger.log(`Nenhum parâmetro fornecido, usando busca padrão: 'stadium'`);
                }
            }

            const queryString = queryParams.toString();
            if (queryString) {
                url += `?${queryString}`;
            }

            this.logger.log(`Fazendo requisição para: ${url}`);

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
            this.logger.log(`Resposta da API recebida. Estrutura: ${JSON.stringify(Object.keys(data))}`);

            const venuesFromAPI = data.response;

            if (!Array.isArray(venuesFromAPI)) {
                throw new Error("Invalid response format from external API. Expected a 'response' array.");
            }

            this.logger.log(`Total de venues recebidos da API: ${venuesFromAPI.length}`);

            if (venuesFromAPI.length === 0) {
                return {
                    success: true,
                    message: `No venues found for the provided parameters.`,
                    created: 0,
                    updated: 0
                };
            }

            let createdCount = 0;
            let updatedCount = 0;

            // Buscar países uma única vez antes do loop
            const countriesResult = await Repository.findAll(OddsCountriesEntity, { limit: 10000 }, [], { select: ["id", "name"] });
            const countriesArray = (countriesResult && countriesResult.data) ? countriesResult.data : [];

            // Criar mapa de países para busca eficiente
            const countriesMapByName = new Map();
            countriesArray.forEach((country: any) => {
                if (country && country.name) {
                    const normalizedName = String(country.name).toLowerCase().trim();
                    countriesMapByName.set(normalizedName, country);
                }
            });

            for (const venueData of venuesFromAPI) {
                try {
                    if (!venueData || !venueData.id) {
                        this.logger.error(`Venue inválido ou sem ID: ${JSON.stringify(venueData)}`);
                        continue;
                    }

                    this.logger.log(`Processando venue: ${venueData.name} (ID: ${venueData.id})`);

                    // Buscar país pelo nome
                    let countryId = null;
                    if (venueData.country) {
                        const countryName = String(venueData.country).toLowerCase().trim();
                        const country = countriesMapByName.get(countryName);
                        if (country) {
                            countryId = country.id;
                            this.logger.log(`País encontrado: ${venueData.country} -> ID: ${countryId}`);
                        } else {
                            this.logger.error(`País não encontrado: ${venueData.country}`);
                        }
                    }

                    // Preparar dados para inserção/atualização
                    const venuePayload: Partial<OddsVenuesContract> = {
                        external_id: venueData.id,
                        name: venueData.name,
                        address: venueData.address,
                        city: venueData.city,
                        capacity: venueData.capacity,
                        surface: venueData.surface,
                        image: venueData.image,
                        country_id: countryId,
                        imageProcessed: false,
                        processedImageUrl: undefined
                    };

                    // Verificar se o venue já existe
                    const existingVenue = await Repository.findOne(OddsVenuesEntity, { external_id: venueData.id });

                    if (existingVenue) {
                        this.logger.log(`Atualizando venue existente: ${existingVenue.id}`);
                        if(existingVenue.image === venueData.image) {
                            venuePayload.imageProcessed = existingVenue.imageProcessed;
                            venuePayload.processedImageUrl = existingVenue.processedImageUrl;
                        }
                        await Repository.update(OddsVenuesEntity, existingVenue.id, venuePayload);
                        updatedCount++;
                    } else {
                        this.logger.log(`Criando novo venue: ${venueData.name}`);
                        await Repository.insert(OddsVenuesEntity, venuePayload);
                        createdCount++;
                    }
                } catch (error) {
                    this.logger.error(`Erro ao processar venue ${venueData?.name || 'desconhecido'}: ${error instanceof Error ? error.message : String(error)}`);
                }
            }

            this.logger.log(`Sincronização concluída. Criados: ${createdCount}, Atualizados: ${updatedCount}`);

            return {
                success: true,
                message: `Synchronization complete. Created: ${createdCount}, Updated: ${updatedCount}.`,
                created: createdCount,
                updated: updatedCount
            };
        } catch (error) {
            this.logger.error(`Erro geral na sincronização: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    /**
     * Process a venue image
     * @param venueId The ID of the venue
     * @returns The processing result
     */
    async processVenueImage(venueId: string) {
        try {
            const OddsVenuesEntity = Repository.getEntity("OddsVenuesEntity");
            const venue = await Repository.findOne(OddsVenuesEntity, { id: venueId });

            if (!venue) throw new Error("Venue not found");
            if (!venue.image) throw new Error("Venue has no image URL to process");

            const response = await fetch(venue.image);
            if (!response.ok) throw new Error(`Failed to download image from ${venue.image}. Status: ${response.status}`);

            let imageBuffer = Buffer.from(await response.arrayBuffer());
            const isSvg = (response.headers.get('content-type') || '').includes('svg') || venue.image.endsWith('.svg');

            if (isSvg) {
                imageBuffer = await sharp(imageBuffer).webp().toBuffer();
            }

            const dataUrl = `data:image/webp;base64,${imageBuffer.toString('base64')}`;

            const processedUrl = await this.mediasService.getImageUrl(dataUrl, "webp", 400, 300, 80, venue.name);

            if (!processedUrl) throw new Error("Failed to process image with MediasService");

            await Repository.updateOne(OddsVenuesEntity, { id: venueId }, {
                imageProcessed: true,
                processedImageUrl: processedUrl,
            });

            return { success: true, message: "Image processed and updated successfully", url: processedUrl };

        } catch (error: any) {
            this.logger.error(`Error processing venue image for ID ${venueId}:`, error.message);
            return { success: false, message: error.message };
        }
    }

    /**
     * Start the process of all images
     * @returns The job ID
     */
    async startProcessAllImages(): Promise<{ jobId: string }> {
        const OddsVenuesEntity = Repository.getEntity("OddsVenuesEntity");
        const allUnprocessed = await Repository.findAll(OddsVenuesEntity, {
            image: Not(IsNull()),
            imageProcessed: false,
            limit: 100000
        });

        const total = allUnprocessed?.data?.length || 0;

        const jobId = randomUUID();
        this.imageJobs.set(jobId, {
            total,
            processed: 0,
            failed: 0,
            status: 'running',
            errors: []
        });

        this._executeImageProcessingJob(jobId);

        return { jobId };
    }

    /**
     * Get the status of the process of all images
     * @param jobId The ID of the job
     * @returns The job status
     */
    getProcessAllImagesStatus(jobId: string): ImageJobStatus | { status: 'not_found' } {
        const job = this.imageJobs.get(jobId);
        return job || { status: 'not_found' };
    }

    /**
     * Execute the image processing job
     * @param jobId The ID of the job
     */
    private async _executeImageProcessingJob(jobId: string) {
        const BATCH_SIZE = 20;
        const OddsVenuesEntity = Repository.getEntity("OddsVenuesEntity");
        const jobState = this.imageJobs.get(jobId);

        if (!jobState) return;

        try {
            while (jobState.processed + jobState.failed < jobState.total) {
                const venuesToProcess = await Repository.findAll(OddsVenuesEntity, {
                    image: Not(IsNull()),
                    imageProcessed: false,
                    limit: BATCH_SIZE
                });

                if (!venuesToProcess?.data || venuesToProcess.data.length === 0) {
                    break;
                }

                for (const venue of venuesToProcess.data) {
                    try {
                        await this.processVenueImage(venue.id);
                        jobState.processed++;
                    } catch (error: any) {
                        jobState.failed++;
                        jobState.errors.push({ id: venue.id, error: error.message });
                    }
                }
            }
            jobState.status = 'completed';
        } catch (error: any) {
            jobState.status = 'error';
        }
    }
}