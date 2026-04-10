<template>
    <!-- Loading -->
    <div v-if="loading" class="loading-page">
        <div class="loading-container">
            <div class="spinner"></div>
            <p>Carregando...</p>
        </div>
    </div>

    <!-- Error -->
    <div v-else-if="loadError" class="error-page">
        <div class="error-container">
            <h2>Erro ao carregar</h2>
            <p>{{ loadError }}</p>
            <button @click="load" class="retry-button">Tentar novamente</button>
        </div>
    </div>

    <!-- Not Found -->
    <div v-else-if="!tournament" class="not-found">
        <h2>Campeonato não encontrado</h2>
        <a href="/campeonatos" class="back-link">← Voltar</a>
    </div>

    <!-- Content -->
    <div v-else class="championship-detail">
        <!-- Header -->
        <div class="champ-header">
            <div class="header-left">
                <div class="logo-box">
                    <img v-if="tournament.logoUrl" :src="tournament.logoUrl" :alt="tournament.name" />
                    <span v-else>{{ getInitials(tournament.name) }}</span>
                </div>
                <div class="title-area">
                    <div class="badges">
                        <span class="badge" :class="tournament.online ? 'online' : 'lan'">
                            {{ tournament.online ? 'Online' : 'LAN' }}
                        </span>
                        <span class="badge" :class="tournament.status">
                            {{ getStatusLabel(tournament.status) }}
                        </span>
                        <span v-if="tournament.tier" class="badge tier">
                            Tier {{ tournament.tier.toUpperCase() }}
                        </span>
                    </div>
                    <h1>{{ getFullTitle(tournament) }}</h1>
                    <div v-if="tournament.serieName" class="subtitle">
                        {{ tournament.serieName }}
                    </div>
                </div>
            </div>
            <div class="header-right">
                <div class="quick-stats">
                    <div v-if="tournament.prizePool" class="stat">
                        <span class="stat-label">Premiação</span>
                        <span class="stat-value" :class="getPrizeStatClass(tournament.prizePool)">
                            <span class="prize-icon-stat">{{ getPrizeIcon(tournament.prizePool) }}</span>
                            {{ tournament.prizePool }}
                        </span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Times</span>
                        <span class="stat-value">{{ getTeamCount(tournament) }}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Partidas</span>
                        <span class="stat-value">{{ matches.length }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tabs -->
        <div class="tabs">
            <button class="tab" :class="{ active: activeTab === 'overview' }" @click="activeTab = 'overview'">Visão Geral</button>
            <button class="tab" :class="{ active: activeTab === 'matches' }" @click="activeTab = 'matches'">Partidas</button>
            <button v-if="brackets.phases.length > 0" class="tab" :class="{ active: activeTab === 'brackets' }" @click="activeTab = 'brackets'">Brackets</button>
            <button class="tab" :class="{ active: activeTab === 'teams' }" @click="activeTab = 'teams'">Equipes</button>
        </div>

        <!-- Tab: Overview -->
        <div v-if="activeTab === 'overview'" class="overview-content">
            <div class="info-section">
                <h3>Informações do Torneio</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Inicio</span>
                        <span class="info-value">{{ formatDate(tournament.startDate) }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Fim</span>
                        <span class="info-value">{{ formatDate(tournament.endDate) }}</span>
                    </div>
                    <div v-if="tournament.prizePool" class="info-item">
                        <span class="info-label">Premiacao</span>
                        <span class="info-value" :class="getPrizeInfoClass(tournament.prizePool)">
                            {{ getPrizeIcon(tournament.prizePool) }} {{ tournament.prizePool }}
                        </span>
                    </div>
                    <div v-if="tournament.region" class="info-item">
                        <span class="info-label">Regiao</span>
                        <span class="info-value">{{ getRegionLabel(tournament.region) }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Times</span>
                        <span class="info-value">{{ getTeamCount(tournament) }}</span>
                    </div>
                    <div v-if="tournament.location" class="info-item">
                        <span class="info-label">Local</span>
                        <span class="info-value">{{ tournament.location }}</span>
                    </div>
                    <div v-if="tournament.leagueName" class="info-item">
                        <span class="info-label">Liga</span>
                        <span class="info-value">{{ tournament.leagueName }}</span>
                    </div>
                </div>
            </div>

            <div v-if="upcomingMatches.length > 0" class="matches-preview">
                <h3>Próximas Partidas</h3>
                <div class="match-list">
                    <div v-for="m in upcomingMatches.slice(0, 5)" :key="m.id" class="match-card-simple">
                        <div class="match-teams-simple">
                            <div class="team-simple">
                                <div class="team-icon-sm">
                                    <img v-if="m.team1Logo" :src="m.team1Logo" />
                                    <span v-else>{{ getInitials(m.team1Name) }}</span>
                                </div>
                                <span>{{ m.team1Name || 'TBA' }}</span>
                            </div>
                            <span class="vs-text">vs</span>
                            <div class="team-simple">
                                <div class="team-icon-sm">
                                    <img v-if="m.team2Logo" :src="m.team2Logo" />
                                    <span v-else>{{ getInitials(m.team2Name) }}</span>
                                </div>
                                <span>{{ m.team2Name || 'TBA' }}</span>
                            </div>
                        </div>
                        <div class="match-meta">
                            <span>{{ formatPhase(m.phase) }}</span>
                            <span>{{ formatTime(m.scheduledAt) }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="finishedMatches.length > 0" class="matches-preview">
                <h3>Resultados Recentes</h3>
                <div class="match-list">
                    <div v-for="m in finishedMatches.slice(0, 5)" :key="m.id" class="match-card-simple">
                        <div class="match-teams-simple">
                            <div class="team-simple" :class="{ winner: m.winnerExternalId === m.team1ExternalId }">
                                <div class="team-icon-sm">
                                    <img v-if="m.team1Logo" :src="m.team1Logo" />
                                    <span v-else>{{ getInitials(m.team1Name) }}</span>
                                </div>
                                <span>{{ m.team1Name || 'TBA' }}</span>
                                <span class="score-sm">{{ m.team1Score ?? 0 }}</span>
                            </div>
                            <span class="vs-text">x</span>
                            <div class="team-simple" :class="{ winner: m.winnerExternalId === m.team2ExternalId }">
                                <div class="team-icon-sm">
                                    <img v-if="m.team2Logo" :src="m.team2Logo" />
                                    <span v-else>{{ getInitials(m.team2Name) }}</span>
                                </div>
                                <span>{{ m.team2Name || 'TBA' }}</span>
                                <span class="score-sm">{{ m.team2Score ?? 0 }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="upcomingMatches.length === 0 && finishedMatches.length === 0" class="empty-tournament">
                <div class="empty-icon">📅</div>
                <h4>Partidas em breve</h4>
                <p>As partidas serão adicionadas conforme o campeonato se aproxima.</p>
            </div>
        </div>

        <!-- Tab: Matches -->
        <div v-if="activeTab === 'matches'" class="tab-content">
            <div v-if="matches.length === 0" class="empty-content">
                <p>Nenhuma partida registrada ainda.</p>
            </div>
            <div v-else class="match-list">
                <div v-for="m in matches" :key="m.id" class="match-card-simple">
                    <div class="match-header-simple">
                        <span>{{ formatPhase(m.phase) }}</span>
                        <span>MD{{ m.numberOfGames }}</span>
                        <span>{{ formatFullDate(m.scheduledAt) }}</span>
                    </div>
                    <div class="match-teams-simple">
                        <div class="team-simple" :class="getTeamClassMatch(m, 1)">
                            <div class="team-icon-sm">
                                <img v-if="m.team1Logo" :src="m.team1Logo" />
                                <span v-else>{{ getInitials(m.team1Name) }}</span>
                            </div>
                            <span>{{ m.team1Name || 'TBA' }}</span>
                            <span class="score-sm">{{ m.team1Score ?? 0 }}</span>
                        </div>
                        <span class="vs-text">x</span>
                        <div class="team-simple" :class="getTeamClassMatch(m, 2)">
                            <div class="team-icon-sm">
                                <img v-if="m.team2Logo" :src="m.team2Logo" />
                                <span v-else>{{ getInitials(m.team2Name) }}</span>
                            </div>
                            <span>{{ m.team2Name || 'TBA' }}</span>
                            <span class="score-sm">{{ m.team2Score ?? 0 }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tab: Brackets -->
        <div v-if="activeTab === 'brackets'" class="tab-content">
            <div v-if="bracketsLoading" class="empty-content">
                <div class="spinner"></div>
            </div>
            <div v-else-if="brackets.phases.length === 0" class="empty-content">
                <p>Sem dados de bracket disponíveis.</p>
            </div>
            <div v-else class="bracket-tree-wrapper">
                <div class="bracket-tree">
                    <div
                        v-for="(phase, colIdx) in brackets.phases"
                        :key="phase"
                        class="bracket-column"
                    >
                        <div class="bracket-column-header">{{ formatPhase(phase) }}</div>
                        <div
                            class="bracket-column-matches"
                            :style="{ '--col': colIdx, '--total-cols': brackets.phases.length }"
                        >
                            <div
                                v-for="(m, matchIdx) in brackets.brackets[phase]"
                                :key="m.id"
                                class="bk-match-wrap"
                                :class="{ 'has-next': colIdx < brackets.phases.length - 1 }"
                            >
                                <div
                                    class="bk-match"
                                    :class="{ 'is-live': m.status === 'running', 'is-done': m.status === 'finished' }"
                                >
                                    <div v-if="m.status === 'running'" class="bk-live-dot"></div>
                                    <div class="bk-team" :class="getBracketTeamClass(m, 1)">
                                        <div class="bk-logo">
                                            <img v-if="m.team1Logo" :src="m.team1Logo" />
                                            <span v-else>{{ getInitials(m.team1Name) }}</span>
                                        </div>
                                        <span class="bk-name">{{ m.team1Name || 'TBA' }}</span>
                                        <span class="bk-score">{{ m.status !== 'not_started' ? (m.team1Score ?? 0) : '—' }}</span>
                                    </div>
                                    <div class="bk-divider"></div>
                                    <div class="bk-team" :class="getBracketTeamClass(m, 2)">
                                        <div class="bk-logo">
                                            <img v-if="m.team2Logo" :src="m.team2Logo" />
                                            <span v-else>{{ getInitials(m.team2Name) }}</span>
                                        </div>
                                        <span class="bk-name">{{ m.team2Name || 'TBA' }}</span>
                                        <span class="bk-score">{{ m.status !== 'not_started' ? (m.team2Score ?? 0) : '—' }}</span>
                                    </div>
                                    <div class="bk-footer">
                                        <span>MD{{ m.numberOfGames }}</span>
                                        <span>{{ formatTime(m.scheduledAt) }}</span>
                                    </div>
                                </div>
                                <!-- Connector lines to next round -->
                                <div v-if="colIdx < brackets.phases.length - 1" class="bk-connector">
                                    <svg class="connector-svg" viewBox="0 0 40 100" preserveAspectRatio="none">
                                        <path
                                            d="M0,50 C20,50 20,50 40,50"
                                            fill="none"
                                            stroke="#2d3748"
                                            stroke-width="1.5"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tab: Teams -->
        <div v-if="activeTab === 'teams'" class="tab-content">
            <div v-if="teams.length === 0" class="empty-content">
                <p>Nenhuma equipe registrada ainda.</p>
            </div>
            <div v-else class="teams-grid-simple">
                <div v-for="t in teams" :key="t.id" class="team-card-simple">
                    <div class="team-logo-sm">
                        <img v-if="t.logoUrl" :src="t.logoUrl" />
                        <span v-else>{{ getInitials(t.name) }}</span>
                    </div>
                    <span>{{ t.name }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const slug = computed(() => route.params.slug as string);

const tournament = ref<any>(null);
const matches = ref<any[]>([]);
const brackets = ref<{ phases: string[]; brackets: Record<string, any[]>; hasPlayoffs: boolean }>({
    phases: [],
    brackets: {},
    hasPlayoffs: false,
});
const loading = ref(true);
const bracketsLoading = ref(false);
const loadError = ref<string | null>(null);
const activeTab = ref('overview');

const teams = computed(() => {
    const t = tournament.value;
    if (!t) return [];
    return t.teams || (t.teamsJson ? JSON.parse(t.teamsJson) : []);
});
const upcomingMatches = computed(() => matches.value.filter(m => m.status === 'not_started'));
const finishedMatches = computed(() => matches.value.filter(m => m.status === 'finished'));

async function load() {
    loading.value = true;
    loadError.value = null;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const [tRes, mRes] = await Promise.all([
            fetch(`/api/esports/tournaments/${slug.value}`, { signal: controller.signal }),
            fetch(`/api/esports/tournaments/${slug.value}/matches`, { signal: controller.signal }),
        ]);

        clearTimeout(timeoutId);

        if (!tRes.ok) throw new Error('Tournament not found');

        const tData = await tRes.json();
        const mData = await mRes.json();

        const tResult = tData.result || tData;
        const mResult = mData.result?.data || mData.data || [];

        if (!tResult || !tResult.id) {
            throw new Error('Invalid tournament data');
        }

        tournament.value = tResult;
        matches.value = mResult;

        // Load brackets in background (non-blocking)
        loadBrackets();
    } catch (error: any) {
        console.error('Error loading championship:', error);
        if (error.name === 'AbortError') {
            loadError.value = 'Tempo de carregamento excedido. Tente novamente.';
        } else {
            loadError.value = error.message || 'Erro ao carregar campeonato';
        }
    } finally {
        loading.value = false;
    }
}

async function loadBrackets() {
    bracketsLoading.value = true;
    try {
        const res = await fetch(`/api/esports/tournaments/${slug.value}/brackets`);
        if (res.ok) {
            const data = await res.json();
            brackets.value = data.result || data;
        }
    } catch {
        // non-critical
    } finally {
        bracketsLoading.value = false;
    }
}

function getInitials(name?: string): string {
    if (!name) return '?';
    return name.substring(0, 2).toUpperCase();
}

function getFullTitle(t: any): string {
    if (!t) return '';
    const league = t.leagueName || '';
    const name = t.name || '';
    if (name.toLowerCase() === 'playoffs' || name.toLowerCase() === 'group stage' || name.toLowerCase() === 'regular season') {
        return league ? `${league} — ${name}` : name;
    }
    return name;
}

function getStatusLabel(status: string): string {
    const map: Record<string, string> = { ongoing: 'Ao vivo', upcoming: 'Em breve', finished: 'Encerrado' };
    return map[status] || status;
}

function formatPhase(phase?: string): string {
    const map: Record<string, string> = {
        grand_final: 'Grande Final',
        semi_final: 'Semifinal',
        quarter_final: 'Quartas de Final',
        playoffs: 'Playoffs',
        group_stage: 'Fase de Grupos',
        qualifier: 'Qualificatória',
    };
    return map[phase || ''] || phase || '';
}

function formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function formatTime(dateStr?: string): string {
    if (!dateStr) return 'TBD';
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function formatFullDate(dateStr?: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function getRegionLabel(region: string): string {
    const map: Record<string, string> = { NA: 'America do Norte', EU: 'Europa', BR: 'Brasil', SA: 'America do Sul', APAC: 'Asia-Pacifico', global: 'Global' };
    return map[region] || region || '—';
}

function getPrizeIcon(prizePool: string): string {
    if (!prizePool) return '';
    const lower = prizePool.toLowerCase();
    if (lower.includes('vaga') || lower.includes('slot') || lower.includes('berth')) return '\uD83C\uDFC6';
    return '\uD83D\uDCB0';
}

function getPrizeStatClass(prizePool: string): string {
    if (!prizePool) return '';
    const lower = prizePool.toLowerCase();
    return (lower.includes('vaga') || lower.includes('slot') || lower.includes('berth')) ? 'prize-slot' : '';
}

function getPrizeInfoClass(prizePool: string): string {
    if (!prizePool) return '';
    const lower = prizePool.toLowerCase();
    return (lower.includes('vaga') || lower.includes('slot') || lower.includes('berth')) ? 'prize-slot-info' : 'prize';
}

function getTeamCount(t: any): number {
    if (t.numberOfTeams && t.numberOfTeams > 0) return t.numberOfTeams;
    return (t.teams || []).length;
}

function getTeamClassMatch(match: any, teamNumber: number): string {
    if (!match.winnerExternalId || match.status === 'not_started') return '';
    const teamId = teamNumber === 1 ? match.team1ExternalId : match.team2ExternalId;
    return teamId === match.winnerExternalId ? 'winner' : 'loser';
}

function getBracketTeamClass(match: any, teamNumber: number): string {
    if (match.status === 'running') return 'live';
    if (match.status === 'not_started' || !match.winnerExternalId) return '';
    const teamId = teamNumber === 1 ? match.team1ExternalId : match.team2ExternalId;
    return teamId === match.winnerExternalId ? 'winner' : 'loser';
}

onMounted(load);
</script>

<style scoped>
.championship-detail {
    max-width: 1000px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.champ-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 2rem;
    margin-bottom: 2rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid #1a202c;
}

.header-left { display: flex; align-items: center; gap: 1.5rem; flex: 1; }

.logo-box {
    width: 80px; height: 80px; border-radius: 8px; background: #1a202c;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; flex-shrink: 0;
}
.logo-box img { width: 100%; height: 100%; object-fit: contain; }
.logo-box span { font-size: 1.25rem; font-weight: 700; color: #4a5568; }

.title-area { display: flex; flex-direction: column; gap: 0.5rem; }
.badges { display: flex; gap: 0.5rem; flex-wrap: wrap; }

.badge { font-size: 0.6875rem; font-weight: 600; padding: 0.25rem 0.5rem; border-radius: 4px; text-transform: uppercase; }
.badge.lan { background: #2d3748; color: #a0aec0; }
.badge.online { background: #276749; color: #68d391; }
.badge.ongoing { background: #9b2c2c; color: #fc8181; }
.badge.upcoming { background: #2b6cb0; color: #63b3ed; }
.badge.finished { background: #4a5568; color: #a0aec0; }
.badge.tier { background: #975a16; color: #fbd38d; }

.title-area h1 { font-size: 1.75rem; font-weight: 700; color: #ffffff; margin: 0; }
.subtitle { font-size: 0.875rem; color: #718096; }
.header-right { flex-shrink: 0; }
.quick-stats { display: flex; gap: 2rem; }
.stat { display: flex; flex-direction: column; align-items: center; text-align: center; }
.stat-label { font-size: 0.6875rem; color: #718096; text-transform: uppercase; margin-bottom: 0.25rem; }
.stat-value { font-size: 1.125rem; font-weight: 700; color: #e2e8f0; }

.tabs { display: flex; margin-bottom: 2rem; border-bottom: 2px solid #1a202c; }
.tab { padding: 0.75rem 1.25rem; font-weight: 600; font-size: 0.875rem; color: #718096; background: none; border: none; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; }
.tab:hover { color: #e2e8f0; }
.tab.active { color: #3182ce; border-bottom-color: #3182ce; }

.overview-content { display: flex; flex-direction: column; gap: 2rem; }

.info-section { background: #1a202c; border: 1px solid #2d3748; border-radius: 8px; padding: 1.5rem; }
.info-section h3 { font-size: 0.875rem; font-weight: 700; color: #a0aec0; text-transform: uppercase; margin: 0 0 1rem; }
.info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
.info-item { display: flex; flex-direction: column; gap: 0.25rem; }
.info-label { font-size: 0.75rem; color: #718096; }
.info-value { font-size: 0.9375rem; color: #e2e8f0; font-weight: 600; }
.info-value.prize { color: #ecc94b; }
.info-value.prize-slot-info { color: #63b3ed; }
.stat-value.prize-slot { color: #63b3ed; }
.prize-icon-stat { font-size: 0.875rem; margin-right: 0.125rem; }

.matches-preview h3 { font-size: 0.875rem; font-weight: 700; color: #a0aec0; text-transform: uppercase; margin: 0 0 1rem; }
.match-list { display: flex; flex-direction: column; gap: 0.75rem; }

.match-card-simple { background: #1a202c; border: 1px solid #2d3748; border-radius: 6px; padding: 1rem; }
.match-header-simple { display: flex; justify-content: space-between; font-size: 0.6875rem; color: #718096; margin-bottom: 0.75rem; text-transform: uppercase; }
.match-teams-simple { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }

.team-simple { display: flex; align-items: center; gap: 0.625rem; flex: 1; font-size: 0.875rem; color: #cbd5e0; }
.team-simple.winner { color: #ffffff; font-weight: 600; }
.team-simple.loser { opacity: 0.5; }

.team-icon-sm { width: 28px; height: 28px; border-radius: 4px; background: #2d3748; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; }
.team-icon-sm img { width: 100%; height: 100%; object-fit: contain; }
.team-icon-sm span { font-size: 0.625rem; font-weight: 700; color: #718096; }

.vs-text { font-size: 0.75rem; color: #4a5568; font-weight: 600; }
.score-sm { font-weight: 700; color: #4a5568; margin-left: auto; }
.team-simple.winner .score-sm { color: #68d391; }
.match-meta { display: flex; justify-content: space-between; font-size: 0.6875rem; color: #718096; margin-top: 0.5rem; }

/* ─── Visual Bracket Tree ─── */
.bracket-tree-wrapper {
    overflow-x: auto;
    padding-bottom: 1rem;
}

.bracket-tree {
    display: flex;
    gap: 0;
    align-items: flex-start;
    min-width: max-content;
}

.bracket-column {
    display: flex;
    flex-direction: column;
    min-width: 240px;
}

.bracket-column-header {
    font-size: 0.6875rem;
    font-weight: 700;
    color: #718096;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    text-align: center;
    padding: 0.5rem 0.75rem 0.75rem;
    border-bottom: 1px solid #1a202c;
    margin-bottom: 0.5rem;
}

.bracket-column-matches {
    display: flex;
    flex-direction: column;
    gap: 0;
    flex: 1;
}

/* Each match + its connector line */
.bk-match-wrap {
    display: flex;
    align-items: center;
    position: relative;
    padding: 0.5rem 0;
}

/* Connector on the right side of each match */
.bk-connector {
    flex-shrink: 0;
    width: 40px;
    height: 100%;
    display: flex;
    align-items: center;
}

.connector-svg {
    width: 40px;
    height: 80px;
}

.bk-match {
    position: relative;
    background: #1a202c;
    border: 1px solid #2d3748;
    border-radius: 6px;
    overflow: hidden;
    flex: 1;
    transition: border-color 0.15s;
}

.bk-match:hover { border-color: #4a5568; }
.bk-match.is-live { border-color: #9b2c2c; box-shadow: 0 0 0 1px #9b2c2c44; }
.bk-match.is-done { border-color: #2d3748; }

.bk-live-dot {
    position: absolute;
    top: 6px; right: 8px;
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #fc8181;
    animation: pulse-dot 1.2s ease-in-out infinite;
}

@keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
}

.bk-team {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    font-size: 0.8125rem;
    color: #a0aec0;
}

.bk-team.winner {
    color: #ffffff;
    font-weight: 600;
    background: rgba(255,255,255,0.04);
}

.bk-team.loser {
    color: #4a5568;
}

.bk-team.live {
    color: #fc8181;
}

.bk-logo {
    width: 22px; height: 22px;
    border-radius: 3px;
    background: #2d3748;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; flex-shrink: 0;
}

.bk-logo img { width: 100%; height: 100%; object-fit: contain; }
.bk-logo span { font-size: 0.5rem; font-weight: 700; color: #718096; }

.bk-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.bk-score {
    font-weight: 700;
    font-size: 0.9375rem;
    min-width: 1.25rem;
    text-align: right;
    color: #4a5568;
}

.bk-team.winner .bk-score { color: #68d391; }
.bk-team.loser .bk-score { color: #4a5568; }

.bk-divider { height: 1px; background: #2d3748; }

.bk-footer {
    display: flex;
    justify-content: space-between;
    padding: 0.25rem 0.75rem;
    font-size: 0.5625rem;
    color: #4a5568;
    border-top: 1px solid #1a202c;
}

/* Empty */
.empty-tournament { text-align: center; padding: 3rem 2rem; background: #1a202c; border: 1px solid #2d3748; border-radius: 8px; }
.empty-icon { font-size: 3rem; margin-bottom: 1rem; opacity: 0.5; }
.empty-tournament h4 { font-size: 1.125rem; color: #e2e8f0; margin: 0 0 0.5rem; }
.empty-tournament p { font-size: 0.875rem; color: #718096; margin: 0; }
.empty-content { text-align: center; padding: 3rem; color: #718096; }

/* Teams */
.teams-grid-simple { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 0.75rem; }
.team-card-simple { display: flex; align-items: center; gap: 0.625rem; padding: 0.75rem; background: #1a202c; border: 1px solid #2d3748; border-radius: 6px; font-size: 0.8125rem; color: #cbd5e0; }
.team-logo-sm { width: 32px; height: 32px; border-radius: 4px; background: #2d3748; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; }
.team-logo-sm img { width: 100%; height: 100%; object-fit: contain; }
.team-logo-sm span { font-size: 0.6875rem; font-weight: 700; color: #718096; }

/* Loading/Error */
.loading-page, .error-page, .not-found { display: flex; align-items: center; justify-content: center; min-height: 60vh; text-align: center; }
.loading-container, .error-container { display: flex; flex-direction: column; align-items: center; gap: 1rem; }

.spinner { width: 48px; height: 48px; border: 4px solid #2d3748; border-top-color: #3182ce; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.loading-container p, .error-container p { color: #718096; font-size: 0.875rem; margin: 0; }
.retry-button { background: #3182ce; color: white; border: none; padding: 0.5rem 1.5rem; border-radius: 6px; font-weight: 600; cursor: pointer; }
.retry-button:hover { background: #2c5282; }
.not-found h2 { color: #e2e8f0; margin: 0 0 1rem; }
.back-link { color: #3182ce; text-decoration: none; font-weight: 600; }
.back-link:hover { text-decoration: underline; }

@media (max-width: 768px) {
    .champ-header { flex-direction: column; align-items: flex-start; }
    .header-right { width: 100%; }
    .quick-stats { justify-content: space-around; }
    .info-grid { grid-template-columns: 1fr; }
    .bracket-tree { gap: 0; }
    .bracket-column { min-width: 200px; }
}
</style>
