import { Service } from "@cmmv/core";
import { Repository } from "@cmmv/repository";
import { Buffer } from 'buffer';
import { OddsTeamsContract } from "../../contracts/odds-teams.contract";
import { Logger } from "@cmmv/core";

// Interface para o progresso da sincronização
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
        this.syncProgressStore[syncId] = {
            totalItems: 0,
            processedItems: 0,
            currentItem: 'Iniciando...',
            totalCreated: 0,
            totalUpdated: 0,
            status: 'running',
            percentage: 0
        };
        
        // Iniciar a sincronização em background
        this.syncTeamsFromAPI(settingId, "/teams", params, syncId)
            .then(result => {
                // Atualizar o status quando concluir
                if (this.syncProgressStore[syncId]) {
                    this.syncProgressStore[syncId].status = 'completed';
                    this.syncProgressStore[syncId].percentage = 100;
                    
                    // Remover o progresso após 5 minutos
                    setTimeout(() => {
                        delete this.syncProgressStore[syncId];
                    }, 5 * 60 * 1000);
                }
            })
            .catch(error => {
                // Atualizar o status em caso de erro
                if (this.syncProgressStore[syncId]) {
                    this.syncProgressStore[syncId].status = 'error';
                    this.syncProgressStore[syncId].error = error.message;
                }
            });
        
        // Retornar imediatamente o ID da sincronização
        return {
            success: true,
            message: 'Synchronization started',
            syncId
        };
    }
    
    /**
     * Obtém o progresso atual de uma sincronização
     * @param syncId ID da sincronização
     * @returns Progresso da sincronização ou erro se não encontrado
     */
    getSyncProgress(syncId: string) {
        const progress = this.syncProgressStore[syncId];
        if (!progress) {
            return { error: 'Sync process not found' };
        }
        return progress;
    }

    /**
     * Sincroniza times da API externa
     * @param settingId ID da configuração da API
     * @param endpoint Endpoint da API
     * @param params Parâmetros de busca (country, league, season, etc.)
     * @param syncId ID da sincronização para rastrear o progresso
     * @returns Resultado da sincronização
     */
    async syncTeamsFromAPI(
        settingId: string, 
        endpoint: string,
        params: Record<string, string> = {},
        syncId?: string
    ) {
        this.logger.log(`Iniciando sincronização de times. SettingId: ${settingId}, Endpoint: ${endpoint}`);
        
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
            
            const queryParams = new URLSearchParams();
            
            // Adicionar todos os parâmetros de busca fornecidos
            Object.entries(params).forEach(([key, value]) => {
                if (value) {
                    queryParams.append(key, value);
                }
            });
            
            // Se nenhum parâmetro foi fornecido, use um padrão
            if (queryParams.toString() === '') {
                queryParams.append('country', 'England');
                this.logger.log(`Nenhum parâmetro fornecido, usando busca padrão: país='England'`);
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
            
            const teamsFromAPI = data.response;

            if (!Array.isArray(teamsFromAPI)) {
                throw new Error("Invalid response format from external API. Expected a 'response' array.");
            }

            this.logger.log(`Total de times recebidos da API: ${teamsFromAPI.length}`);
            
            if (teamsFromAPI.length === 0) {
                return {
                    success: true,
                    message: `No teams found for the provided parameters.`,
                    created: 0,
                    updated: 0
                };
            }

            // Atualizar progresso inicial se estivermos rastreando
            if (syncId && this.syncProgressStore[syncId]) {
                this.syncProgressStore[syncId].totalItems = teamsFromAPI.length;
                this.syncProgressStore[syncId].percentage = 0;
            }

            let createdCount = 0;
            let updatedCount = 0;
            let processedItems = 0;

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
            
            // Buscar venues uma única vez antes do loop
            const venuesResult = await Repository.findAll(OddsVenuesEntity, { limit: 10000 }, [], { select: ["id", "external_id"] });
            const venuesArray = (venuesResult && venuesResult.data) ? venuesResult.data : [];
            
            // Criar mapa de venues para busca eficiente
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

                    // Atualizar progresso
                    processedItems++;
                    if (syncId && this.syncProgressStore[syncId]) {
                        this.syncProgressStore[syncId].processedItems = processedItems;
                        this.syncProgressStore[syncId].currentItem = team.name;
                        this.syncProgressStore[syncId].percentage = Math.round((processedItems / teamsFromAPI.length) * 100);
                    }

                    // Buscar país pelo nome
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
                    
                    // Buscar venue pelo ID externo
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

                    // Preparar dados para inserção/atualização
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
} 