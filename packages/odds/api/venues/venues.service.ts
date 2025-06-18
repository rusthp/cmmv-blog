import { Service } from "@cmmv/core";
import { Repository } from "@cmmv/repository";
import { Buffer } from 'buffer';
import { OddsVenuesContract } from "../../contracts/odds-venues.contract";
import { Logger } from "@cmmv/core";

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

@Service()
export class OddsSyncVenuesService {
    private readonly logger = new Logger("OddsSyncVenuesService");
    
    // Armazenamento do progresso da sincronização
    private syncProgressStore: Record<string, SyncProgress> = {};
    
    /**
     * Inicia a sincronização de venues de todos os países e retorna um ID para acompanhar o progresso
     * @param settingId ID da configuração da API
     * @returns ID da sincronização para acompanhar o progresso
     */
    async startSyncAllVenuesByCountries(settingId: string) {
        // Gerar um ID único para esta sincronização
        const syncId = `sync_${Date.now()}`;
        
        // Inicializar o progresso
        this.syncProgressStore[syncId] = {
            totalCountries: 0,
            processedCountries: 0,
            currentCountry: 'Iniciando...',
            totalCreated: 0,
            totalUpdated: 0,
            status: 'running',
            percentage: 0
        };
        
        // Iniciar a sincronização em background
        this.syncAllVenuesByCountries(settingId, syncId)
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
     * Sincroniza venues de todos os países disponíveis no banco de dados
     * @param settingId ID da configuração da API
     * @param syncId ID da sincronização para rastrear o progresso
     * @returns Resultado da sincronização
     */
    async syncAllVenuesByCountries(
        settingId: string, 
        syncId?: string
    ) {
        this.logger.log(`Iniciando sincronização de venues para todos os países`);

        try {
            // Buscar todos os países
            const OddsCountriesEntity = Repository.getEntity("OddsCountriesEntity");
            const countriesResult = await Repository.findAll(OddsCountriesEntity, { limit: 10000 }, [], { select: ["id", "name"] });
            const countries = (countriesResult && countriesResult.data) ? countriesResult.data : [];
            
            this.logger.log(`Encontrados ${countries.length} países para buscar venues`);

            // Atualizar progresso inicial se estivermos rastreando
            if (syncId && this.syncProgressStore[syncId]) {
                this.syncProgressStore[syncId].totalCountries = countries.length;
                this.syncProgressStore[syncId].percentage = 0;
            }

            let totalCreated = 0;
            let totalUpdated = 0;
            let processedCountries = 0;

            // Processar países em lotes para não sobrecarregar a API
            const batchSize = 5;
            for (let i = 0; i < countries.length; i += batchSize) {
                const batch = countries.slice(i, i + batchSize);
                
                this.logger.log(`Processando lote de países ${i+1} até ${Math.min(i+batchSize, countries.length)} de ${countries.length}`);
                
                // Processar cada país do lote em paralelo
                const results = await Promise.all(
                    batch.map(async (country: { id: string; name: string }) => {
                        try {
                            this.logger.log(`Buscando venues para país: ${country.name}`);
                            
                            // Atualizar progresso se estivermos rastreando
                            if (syncId && this.syncProgressStore[syncId]) {
                                this.syncProgressStore[syncId].currentCountry = country.name;
                            }
                            
                            const result = await this.syncVenuesFromAPI(settingId, "/venues", country.name);
                            processedCountries++;
                            
                            this.logger.log(`Concluído país ${processedCountries}/${countries.length}: ${country.name} - Criados: ${result.created}, Atualizados: ${result.updated}`);
                            
                            // Atualizar progresso se estivermos rastreando
                            if (syncId && this.syncProgressStore[syncId]) {
                                this.syncProgressStore[syncId].processedCountries = processedCountries;
                                this.syncProgressStore[syncId].percentage = Math.round((processedCountries / countries.length) * 100);
                                this.syncProgressStore[syncId].totalCreated += result.created || 0;
                                this.syncProgressStore[syncId].totalUpdated += result.updated || 0;
                            }
                            
                            return result;
                        } catch (error) {
                            this.logger.error(`Erro ao buscar venues para país ${country.name}: ${error instanceof Error ? error.message : String(error)}`);
                            
                            // Ainda assim incrementar o contador de países processados
                            processedCountries++;
                            
                            // Atualizar progresso mesmo em caso de erro
                            if (syncId && this.syncProgressStore[syncId]) {
                                this.syncProgressStore[syncId].processedCountries = processedCountries;
                                this.syncProgressStore[syncId].percentage = Math.round((processedCountries / countries.length) * 100);
                            }
                            
                            return { created: 0, updated: 0 };
                        }
                    })
                );
                
                // Somar resultados
                for (const result of results) {
                    totalCreated += result.created || 0;
                    totalUpdated += result.updated || 0;
                }
                
                // Aguardar um pouco entre lotes para não sobrecarregar a API
                if (i + batchSize < countries.length) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
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
     * Sincroniza venues da API externa
     * @param settingId ID da configuração da API
     * @param endpoint Endpoint da API
     * @param countryName Nome do país (opcional)
     * @param searchTerm Termo de busca (opcional)
     * @param venueId ID do venue (opcional)
     * @param venueName Nome do venue (opcional)
     * @param cityName Nome da cidade (opcional)
     * @returns Resultado da sincronização
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
                        country_id: countryId
                    };

                    // Verificar se o venue já existe
                    const existingVenue = await Repository.findOne(OddsVenuesEntity, { external_id: venueData.id });
                    
                    if (existingVenue) {
                        this.logger.log(`Atualizando venue existente: ${existingVenue.id}`);
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
} 