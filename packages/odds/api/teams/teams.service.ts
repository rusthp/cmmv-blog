import { Service } from "@cmmv/core";
<<<<<<< HEAD
import { Repository } from "@cmmv/repository";
import { Buffer } from 'buffer';
import { OddsTeamsContract } from "../../contracts/odds-teams.contract";
import { Logger } from "@cmmv/core";

// Interface para o progresso da sincronização
=======
import { Repository, Not, IsNull } from "@cmmv/repository";
import { Buffer } from 'buffer';
import { OddsTeamsContract } from "../../contracts/odds-teams.contract";
import { Logger } from "@cmmv/core";
//@ts-ignore
import { MediasService } from "@cmmv/blog";
import { randomUUID } from "crypto";
const sharp = require('sharp');

>>>>>>> upstream/main
export interface SyncProgress {
    totalItems: number;
    processedItems: number;
    currentItem: string;
    totalCreated: number;
    totalUpdated: number;
    status: 'running' | 'completed' | 'error';
    error?: string;
    percentage: number;
}

<<<<<<< HEAD
@Service()
export class OddsSyncTeamsService {
    private readonly logger = new Logger("OddsSyncTeamsService");
    
    // Armazenamento do progresso da sincronização
    private syncProgressStore: Record<string, SyncProgress> = {};
    
    /**
     * Inicia a sincronização de times e retorna um ID para acompanhar o progresso
     * @param settingId ID da configuração da API
     * @param params Parâmetros de busca (country, league, season, etc.)
     * @returns ID da sincronização para acompanhar o progresso
     */
    async startSyncTeams(settingId: string, params: Record<string, string>) {
        // Gerar um ID único para esta sincronização
        const syncId = `sync_${Date.now()}`;
        
        // Inicializar o progresso
=======
export interface ImageJobStatus {
    total: number;
    processed: number;
    failed: number;
    status: 'running' | 'completed' | 'error';
    errors: Array<{ id: string, error: string }>;
}

@Service()
export class OddsSyncTeamsService {
    private readonly logger = new Logger("OddsSyncTeamsService");
    private syncProgressStore: Record<string, SyncProgress> = {};
    private imageJobs = new Map<string, ImageJobStatus>();

    constructor(private readonly mediasService: MediasService) {}

    /**
     * Start the synchronization of teams
     * @param settingId The ID of the setting
     * @param params The parameters to filter the teams
     * @returns The synchronization result
     */
    async startSyncTeams(settingId: string, params: Record<string, string>) {
        const syncId = `sync_${Date.now()}`;

>>>>>>> upstream/main
        this.syncProgressStore[syncId] = {
            totalItems: 0,
            processedItems: 0,
            currentItem: 'Iniciando...',
            totalCreated: 0,
            totalUpdated: 0,
            status: 'running',
            percentage: 0
        };
<<<<<<< HEAD
        
        // Iniciar a sincronização em background
        this.syncTeamsFromAPI(settingId, "/teams", params, syncId)
            .then(result => {
                // Atualizar o status quando concluir
                if (this.syncProgressStore[syncId]) {
                    this.syncProgressStore[syncId].status = 'completed';
                    this.syncProgressStore[syncId].percentage = 100;
                    
                    // Remover o progresso após 5 minutos
=======

        this.syncTeamsFromAPI(settingId, "/teams", params, syncId)
            .then(result => {
                if (this.syncProgressStore[syncId]) {
                    this.syncProgressStore[syncId].status = 'completed';
                    this.syncProgressStore[syncId].percentage = 100;

>>>>>>> upstream/main
                    setTimeout(() => {
                        delete this.syncProgressStore[syncId];
                    }, 5 * 60 * 1000);
                }
            })
            .catch(error => {
<<<<<<< HEAD
                // Atualizar o status em caso de erro
=======
>>>>>>> upstream/main
                if (this.syncProgressStore[syncId]) {
                    this.syncProgressStore[syncId].status = 'error';
                    this.syncProgressStore[syncId].error = error.message;
                }
            });
<<<<<<< HEAD
        
        // Retornar imediatamente o ID da sincronização
=======

>>>>>>> upstream/main
        return {
            success: true,
            message: 'Synchronization started',
            syncId
        };
    }
<<<<<<< HEAD
    
    /**
     * Obtém o progresso atual de uma sincronização
     * @param syncId ID da sincronização
     * @returns Progresso da sincronização ou erro se não encontrado
=======

    /**
     * Get the progress of the synchronization
     * @param syncId The ID of the synchronization
     * @returns The progress of the synchronization
>>>>>>> upstream/main
     */
    getSyncProgress(syncId: string) {
        const progress = this.syncProgressStore[syncId];
        if (!progress) {
            return { error: 'Sync process not found' };
        }
        return progress;
    }

    /**
<<<<<<< HEAD
     * Sincroniza times da API externa
     * @param settingId ID da configuração da API
     * @param endpoint Endpoint da API
     * @param params Parâmetros de busca (country, league, season, etc.)
     * @param syncId ID da sincronização para rastrear o progresso
     * @returns Resultado da sincronização
     */
    async syncTeamsFromAPI(
        settingId: string, 
=======
     * Sync teams from API
     * @param settingId The ID of the setting
     * @param endpoint The endpoint to sync teams from
     * @param params The parameters to filter the teams
     * @param syncId The ID of the synchronization
     * @returns The synchronization result
     */
    async syncTeamsFromAPI(
        settingId: string,
>>>>>>> upstream/main
        endpoint: string,
        params: Record<string, string> = {},
        syncId?: string
    ) {
        this.logger.log(`Iniciando sincronização de times. SettingId: ${settingId}, Endpoint: ${endpoint}`);
<<<<<<< HEAD
        
=======

>>>>>>> upstream/main
        try {
            const OddsSettingsEntity = Repository.getEntity("OddsSettingsEntity");
            const OddsCountriesEntity = Repository.getEntity("OddsCountriesEntity");
            const OddsVenuesEntity = Repository.getEntity("OddsVenuesEntity");
            const OddsTeamsEntity = Repository.getEntity("OddsTeamsEntity");

            const setting = await Repository.findOne(OddsSettingsEntity, { id: settingId });
            if (!setting) {
                throw new Error("API Setting not found");
            }

            let url = `${setting.baseUrl.replace(/\/$/, '')}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
<<<<<<< HEAD
            
            const queryParams = new URLSearchParams();
            
            // Adicionar todos os parâmetros de busca fornecidos
=======

            const queryParams = new URLSearchParams();

>>>>>>> upstream/main
            Object.entries(params).forEach(([key, value]) => {
                if (value) {
                    queryParams.append(key, value);
                }
            });
<<<<<<< HEAD
            
            // Se nenhum parâmetro foi fornecido, use um padrão
=======

>>>>>>> upstream/main
            if (queryParams.toString() === '') {
                queryParams.append('country', 'England');
                this.logger.log(`Nenhum parâmetro fornecido, usando busca padrão: país='England'`);
            }
<<<<<<< HEAD
            
=======

>>>>>>> upstream/main
            const queryString = queryParams.toString();
            if (queryString) {
                url += `?${queryString}`;
            }
<<<<<<< HEAD
            
            this.logger.log(`Fazendo requisição para: ${url}`);
            
=======

            this.logger.log(`Fazendo requisição para: ${url}`);

>>>>>>> upstream/main
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
<<<<<<< HEAD
            
            const response = await fetch(url, { headers });
            
=======

            const response = await fetch(url, { headers });

>>>>>>> upstream/main
            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`External API request failed with status ${response.status}: ${errorBody}`);
            }

            const data = await response.json();
            this.logger.log(`Resposta da API recebida. Estrutura: ${JSON.stringify(Object.keys(data))}`);
<<<<<<< HEAD
            
=======

>>>>>>> upstream/main
            const teamsFromAPI = data.response;

            if (!Array.isArray(teamsFromAPI)) {
                throw new Error("Invalid response format from external API. Expected a 'response' array.");
            }

            this.logger.log(`Total de times recebidos da API: ${teamsFromAPI.length}`);
<<<<<<< HEAD
            
=======

>>>>>>> upstream/main
            if (teamsFromAPI.length === 0) {
                return {
                    success: true,
                    message: `No teams found for the provided parameters.`,
                    created: 0,
                    updated: 0
                };
            }

<<<<<<< HEAD
            // Atualizar progresso inicial se estivermos rastreando
=======
>>>>>>> upstream/main
            if (syncId && this.syncProgressStore[syncId]) {
                this.syncProgressStore[syncId].totalItems = teamsFromAPI.length;
                this.syncProgressStore[syncId].percentage = 0;
            }

            let createdCount = 0;
            let updatedCount = 0;
            let processedItems = 0;

<<<<<<< HEAD
            // Buscar países uma única vez antes do loop
            const countriesResult = await Repository.findAll(OddsCountriesEntity, { limit: 10000 }, [], { select: ["id", "name"] });
            const countriesArray = (countriesResult && countriesResult.data) ? countriesResult.data : [];
            
            // Criar mapa de países para busca eficiente
=======
            const countriesResult = await Repository.findAll(OddsCountriesEntity, { limit: 10000 }, [], { select: ["id", "name"] });
            const countriesArray = (countriesResult && countriesResult.data) ? countriesResult.data : [];

>>>>>>> upstream/main
            const countriesMapByName = new Map();
            countriesArray.forEach((country: any) => {
                if (country && country.name) {
                    const normalizedName = String(country.name).toLowerCase().trim();
                    countriesMapByName.set(normalizedName, country);
                }
            });
<<<<<<< HEAD
            
            // Buscar venues uma única vez antes do loop
            const venuesResult = await Repository.findAll(OddsVenuesEntity, { limit: 10000 }, [], { select: ["id", "external_id"] });
            const venuesArray = (venuesResult && venuesResult.data) ? venuesResult.data : [];
            
            // Criar mapa de venues para busca eficiente
=======

            const venuesResult = await Repository.findAll(OddsVenuesEntity, { limit: 10000 }, [], { select: ["id", "external_id"] });
            const venuesArray = (venuesResult && venuesResult.data) ? venuesResult.data : [];

>>>>>>> upstream/main
            const venuesMapById = new Map();
            venuesArray.forEach((venue: any) => {
                if (venue && venue.external_id) {
                    venuesMapById.set(venue.external_id, venue);
                }
            });

            for (const teamData of teamsFromAPI) {
                try {
                    if (!teamData || !teamData.team || !teamData.team.id) {
                        this.logger.error(`Time inválido ou sem ID: ${JSON.stringify(teamData)}`);
                        continue;
                    }

                    const team = teamData.team;
                    this.logger.log(`Processando time: ${team.name} (ID: ${team.id})`);

<<<<<<< HEAD
                    // Atualizar progresso
=======
>>>>>>> upstream/main
                    processedItems++;
                    if (syncId && this.syncProgressStore[syncId]) {
                        this.syncProgressStore[syncId].processedItems = processedItems;
                        this.syncProgressStore[syncId].currentItem = team.name;
                        this.syncProgressStore[syncId].percentage = Math.round((processedItems / teamsFromAPI.length) * 100);
                    }

<<<<<<< HEAD
                    // Buscar país pelo nome
=======
>>>>>>> upstream/main
                    let countryId = null;
                    if (team.country) {
                        const countryName = String(team.country).toLowerCase().trim();
                        const country = countriesMapByName.get(countryName);
                        if (country) {
                            countryId = country.id;
                            this.logger.log(`País encontrado: ${team.country} -> ID: ${countryId}`);
                        } else {
                            this.logger.error(`País não encontrado: ${team.country}`);
                        }
                    }
<<<<<<< HEAD
                    
                    // Buscar venue pelo ID externo
=======

>>>>>>> upstream/main
                    let venueId = null;
                    if (teamData.venue && teamData.venue.id) {
                        const venue = venuesMapById.get(teamData.venue.id);
                        if (venue) {
                            venueId = venue.id;
                            this.logger.log(`Venue encontrado: ${teamData.venue.name} -> ID: ${venueId}`);
                        } else {
                            this.logger.error(`Venue não encontrado: ID ${teamData.venue.id}`);
                        }
                    }

<<<<<<< HEAD
                    // Preparar dados para inserção/atualização
=======
>>>>>>> upstream/main
                    const teamPayload: Partial<OddsTeamsContract> = {
                        external_id: team.id,
                        name: team.name,
                        code: team.code,
                        country_id: countryId,
                        country_name: team.country,
                        founded: team.founded,
                        national: team.national,
                        logo: team.logo,
                        venue_id: venueId
                    };

<<<<<<< HEAD
                    // Verificar se o time já existe
                    const existingTeam = await Repository.findOne(OddsTeamsEntity, { external_id: team.id });
                    
                    if (existingTeam) {
                        this.logger.log(`Atualizando time existente: ${existingTeam.id}`);
                        await Repository.update(OddsTeamsEntity, existingTeam.id, teamPayload);
                        updatedCount++;
                        
                        // Atualizar contadores de progresso
                        if (syncId && this.syncProgressStore[syncId]) {
                            this.syncProgressStore[syncId].totalUpdated++;
                        }
                    } else {
                        this.logger.log(`Criando novo time: ${team.name}`);
                        await Repository.insert(OddsTeamsEntity, teamPayload);
                        createdCount++;
                        
                        // Atualizar contadores de progresso
                        if (syncId && this.syncProgressStore[syncId]) {
                            this.syncProgressStore[syncId].totalCreated++;
                        }
=======
                    const existingTeam = await Repository.findOne(OddsTeamsEntity, { external_id: team.id });

                    if (existingTeam) {
                        this.logger.log(`Atualizando time existente: ${existingTeam.id}`);
                        if(existingTeam.logo === team.logo) {
                            teamPayload.imageProcessed = existingTeam.imageProcessed;
                            teamPayload.processedImageUrl = existingTeam.processedImageUrl;
                        } else {
                            teamPayload.imageProcessed = false;
                            teamPayload.processedImageUrl = undefined;
                        }
                        await Repository.update(OddsTeamsEntity, existingTeam.id, teamPayload);
                        updatedCount++;

                        if (syncId && this.syncProgressStore[syncId])
                            this.syncProgressStore[syncId].totalUpdated++;
                    } else {
                        this.logger.log(`Criando novo time: ${team.name}`);
                        teamPayload.imageProcessed = false;
                        teamPayload.processedImageUrl = undefined;
                        await Repository.insert(OddsTeamsEntity, teamPayload);
                        createdCount++;

                        if (syncId && this.syncProgressStore[syncId])
                            this.syncProgressStore[syncId].totalCreated++;
>>>>>>> upstream/main
                    }
                } catch (error) {
                    this.logger.error(`Erro ao processar time ${teamData?.team?.name || 'desconhecido'}: ${error instanceof Error ? error.message : String(error)}`);
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
<<<<<<< HEAD
} 
=======

    /**
     * Process a team image
     * @param teamId The ID of the team
     * @returns The processing result
     */
    async processTeamImage(teamId: string) {
        try {
            const OddsTeamsEntity = Repository.getEntity("OddsTeamsEntity");
            const team = await Repository.findOne(OddsTeamsEntity, { id: teamId });

            if (!team) throw new Error("Team not found");
            if (!team.logo) throw new Error("Team has no logo URL to process");

            const response = await fetch(team.logo);
            if (!response.ok) throw new Error(`Failed to download image from ${team.logo}. Status: ${response.status}`);

            let imageBuffer = Buffer.from(await response.arrayBuffer());
            const isSvg = (response.headers.get('content-type') || '').includes('svg') || team.logo.endsWith('.svg');

            if (isSvg)
                imageBuffer = await sharp(imageBuffer).webp().toBuffer();

            const dataUrl = `data:image/webp;base64,${imageBuffer.toString('base64')}`;
            const processedUrl = await this.mediasService.getImageUrl(dataUrl, "webp", 100, 100, 80, team.name);

            if (!processedUrl) throw new Error("Failed to process image with MediasService");

            await Repository.updateOne(OddsTeamsEntity, { id: teamId }, {
                imageProcessed: true,
                processedImageUrl: processedUrl,
            });

            return { success: true, message: "Image processed and updated successfully", url: processedUrl };

        } catch (error: any) {
            this.logger.error(`Error processing team image for ID ${teamId}:`, error.message);
            return { success: false, message: error.message };
        }
    }

    /**
     * Start the process of all images
     * @returns The job ID
     */
    async startProcessAllImages(): Promise<{ jobId: string }> {
        const OddsTeamsEntity = Repository.getEntity("OddsTeamsEntity");
        const allUnprocessed = await Repository.findAll(OddsTeamsEntity, {
            logo: Not(IsNull()),
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
        const OddsTeamsEntity = Repository.getEntity("OddsTeamsEntity");
        const jobState = this.imageJobs.get(jobId);

        if (!jobState) return;

        try {
            while (jobState.processed + jobState.failed < jobState.total) {
                const teamsToProcess = await Repository.findAll(OddsTeamsEntity, {
                    logo: Not(IsNull()),
                    imageProcessed: false,
                    limit: BATCH_SIZE
                });

                if (!teamsToProcess?.data || teamsToProcess.data.length === 0) {
                    break;
                }

                for (const team of teamsToProcess.data) {
                    try {
                        await this.processTeamImage(team.id);
                        jobState.processed++;
                    } catch (error: any) {
                        jobState.failed++;
                        jobState.errors.push({ id: team.id, error: error.message });
                    }
                }
            }
            jobState.status = 'completed';
        } catch (error: any) {
            jobState.status = 'error';
        }
    }
}
>>>>>>> upstream/main
