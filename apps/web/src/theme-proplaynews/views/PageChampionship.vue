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
                    <img v-if="tournament.logoUrl" :src="tournament.logoUrl" :alt="tournament.name" @error="imgError" />
                    <span :style="tournament.logoUrl ? 'display:none' : ''">{{ getInitials(tournament.name) }}</span>
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
            <button class="tab" :class="{ active: activeTab === 'teams' }" @click="activeTab = 'teams'">Equipes</button>
        </div>

        <!-- Tab: Overview -->
        <div v-if="activeTab === 'overview'" class="overview-content">

            <!-- FASES section (bracket phases) -->
            <div v-if="hasAnyMatches" class="phases-section">
                <div class="section-title">FASES</div>

                <!-- Phase sub-tabs -->
                <div class="phase-tabs" v-if="brackets.phases.length > 0">
                    <button
                        v-for="ph in brackets.phases"
                        :key="ph"
                        class="phase-tab"
                        :class="{ active: activePhase === ph }"
                        @click="activePhase = ph"
                    >{{ formatPhase(ph) }}</button>
                </div>

                <!-- Bracket phases: show match cards for the active phase only -->
                <div v-if="isPlayoffPhase(activePhase)" class="bracket-phase-view">
                    <div class="bk-matches-grid">
                        <div
                            v-for="m in (brackets.brackets[activePhase] || [])"
                            :key="m.id"
                            class="bk-match"
                            :class="{ 'is-live': m.status === 'running', 'is-done': m.status === 'finished' }"
                        >
                            <div v-if="m.status === 'running'" class="bk-live-dot"></div>
                            <div class="bk-team" :class="getBracketTeamClass(m, 1)">
                                <div class="bk-logo">
                                    <img v-if="m.team1Logo" :src="m.team1Logo" @error="imgError" />
                                    <span :style="m.team1Logo ? 'display:none' : ''">{{ getInitials(m.team1Name) }}</span>
                                </div>
                                <span class="bk-name">{{ m.team1Name || 'TBA' }}</span>
                                <span class="bk-score">{{ m.status !== 'not_started' ? (m.team1Score ?? 0) : '—' }}</span>
                            </div>
                            <div class="bk-divider"></div>
                            <div class="bk-team" :class="getBracketTeamClass(m, 2)">
                                <div class="bk-logo">
                                    <img v-if="m.team2Logo" :src="m.team2Logo" @error="imgError" />
                                    <span :style="m.team2Logo ? 'display:none' : ''">{{ getInitials(m.team2Name) }}</span>
                                </div>
                                <span class="bk-name">{{ m.team2Name || 'TBA' }}</span>
                                <span class="bk-score">{{ m.status !== 'not_started' ? (m.team2Score ?? 0) : '—' }}</span>
                            </div>
                            <div class="bk-footer">
                                <span>MD{{ m.numberOfGames }}</span>
                                <span>{{ formatTime(m.scheduledAt) }}</span>
                            </div>
                        </div>
                        <div v-if="!(brackets.brackets[activePhase] || []).length" class="empty-phase">
                            <p>Partidas em breve</p>
                        </div>
                    </div>
                </div>

                <!-- Group standings for group phase -->
                <div v-else-if="activePhase === 'group_stage'" class="groups-area">
                    <div v-for="(groupMatches, groupName) in groupedByGroup" :key="groupName" class="group-block">
                        <div class="group-title">{{ groupName }}</div>
                        <table class="standings-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Equipes</th>
                                    <th title="Pontos">P</th>
                                    <th title="Jogos">J</th>
                                    <th title="Vitórias">V</th>
                                    <th title="Empates">E</th>
                                    <th title="Derrotas">D</th>
                                    <th title="Saldo de Rounds">SR</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(row, idx) in computeStandings(groupMatches, teams)" :key="row.id" :class="getStandingsRowClass(idx, computeStandings(groupMatches, teams).length)">
                                    <td class="rank">{{ idx + 1 }}</td>
                                    <td class="team-cell">
                                        <div class="team-icon-sm">
                                            <img v-if="row.logo" :src="row.logo" @error="imgError" />
                                            <span :style="row.logo ? 'display:none' : ''">{{ getInitials(row.name) }}</span>
                                        </div>
                                        {{ row.name }}
                                    </td>
                                    <td class="pts">{{ row.points }}</td>
                                    <td>{{ row.played }}</td>
                                    <td class="win">{{ row.wins }}</td>
                                    <td>{{ row.draws }}</td>
                                    <td class="loss">{{ row.losses }}</td>
                                    <td :class="row.roundDiff >= 0 ? 'sr-pos' : 'sr-neg'">{{ row.roundDiff > 0 ? '+' : '' }}{{ row.roundDiff }}</td>
                                </tr>
                            </tbody>
                        </table>
                        <div class="standings-legend">
                            <span class="legend-promote">&#9679; 1º a 2º - Classificados aos playoffs</span>
                            <span class="legend-elim">&#9679; 3º a 4º - Eliminados</span>
                        </div>
                    </div>
                </div>

                <!-- Generic match list for other phases -->
                <div v-else class="phase-match-list">
                    <div v-for="m in (brackets.brackets[activePhase] || [])" :key="m.id" class="match-row">
                        <div class="mr-phase">{{ formatPhase(m.phase) }}</div>
                        <div class="mr-format">MD{{ m.numberOfGames }}</div>
                        <div class="mr-teams">
                            <div class="mr-team" :class="getTeamClassMatch(m, 1)">
                                <div class="team-icon-sm">
                                    <img v-if="m.team1Logo" :src="m.team1Logo" @error="imgError" />
                                    <span :style="m.team1Logo ? 'display:none' : ''">{{ getInitials(m.team1Name) }}</span>
                                </div>
                                <span>{{ m.team1Name || 'TBA' }}</span>
                                <span class="mr-score">{{ m.team1Score ?? 0 }}</span>
                            </div>
                            <span class="mr-sep">x</span>
                            <div class="mr-team right" :class="getTeamClassMatch(m, 2)">
                                <span class="mr-score">{{ m.team2Score ?? 0 }}</span>
                                <span>{{ m.team2Name || 'TBA' }}</span>
                                <div class="team-icon-sm">
                                    <img v-if="m.team2Logo" :src="m.team2Logo" @error="imgError" />
                                    <span :style="m.team2Logo ? 'display:none' : ''">{{ getInitials(m.team2Name) }}</span>
                                </div>
                            </div>
                        </div>
                        <div class="mr-date">{{ formatTime(m.scheduledAt) }}</div>
                    </div>
                </div>
            </div>

            <!-- INFORMAÇÕES side block (always visible) -->
            <div class="info-card">
                <div class="section-title">INFORMAÇÕES</div>
                <div v-if="tournament.prizePool" class="info-row">
                    <span class="info-label-sm">Premiação:</span>
                    <span class="info-val-prize">{{ getPrizeIcon(tournament.prizePool) }} {{ tournament.prizePool }}</span>
                </div>
                <div class="section-title mt">DATAS</div>
                <div class="info-dates">
                    <div>
                        <div class="info-label-sm">INICIO</div>
                        <div class="info-date">{{ formatDateLong(tournament.startDate) }}</div>
                    </div>
                    <div>
                        <div class="info-label-sm">FINAL</div>
                        <div class="info-date">{{ formatDateLong(tournament.endDate) }}</div>
                    </div>
                </div>
                <div v-if="tournament.location" class="section-title mt">LOCAL</div>
                <div v-if="tournament.location" class="info-location">{{ tournament.location }}</div>
                <div v-if="tournament.region" class="section-title mt">REGIÃO</div>
                <div v-if="tournament.region" class="info-location">{{ getRegionLabel(tournament.region) }}</div>
            </div>

            <!-- CALENDÁRIO -->
            <div v-if="hasAnyMatches" class="calendar-section">
                <div class="section-title">CALENDÁRIO</div>

                <div v-if="upcomingMatches.length > 0" class="cal-group">
                    <div class="cal-group-label">PRÓXIMAS PARTIDAS</div>
                    <div v-for="(dayGroup, day) in groupByDay(upcomingMatches.slice(0, 10))" :key="day" class="cal-day">
                        <div class="cal-day-header">&#128197; {{ day }}</div>
                        <div v-for="m in dayGroup" :key="m.id" class="cal-match" :class="{ 'cal-match-live': m.status === 'running' }">
                            <div class="cal-time" :class="{ 'cal-time-live': m.status === 'running' }">
                                <span v-if="m.status === 'running'" class="live-badge">AO VIVO</span>
                                <span v-else>{{ formatTimeOnly(m.scheduledAt) }}</span>
                            </div>
                            <div class="cal-teams">
                                <div class="cal-team">
                                    <div class="team-icon-sm">
                                        <img v-if="m.team1Logo" :src="m.team1Logo" />
                                        <span v-else>{{ getInitials(m.team1Name) }}</span>
                                    </div>
                                    {{ m.team1Name || 'TBA' }}
                                </div>
                                <span class="cal-score">{{ m.team1Score ?? 0 }}</span>
                                <span class="cal-format">MD{{ m.numberOfGames }}</span>
                                <span class="cal-score">{{ m.team2Score ?? 0 }}</span>
                                <div class="cal-team right">
                                    {{ m.team2Name || 'TBA' }}
                                    <div class="team-icon-sm">
                                        <img v-if="m.team2Logo" :src="m.team2Logo" />
                                        <span v-else>{{ getInitials(m.team2Name) }}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="cal-league">{{ tournament.leagueName || tournament.name }}</div>
                        </div>
                    </div>
                </div>

                <div v-if="finishedMatches.length > 0" class="cal-group">
                    <div class="cal-group-label">RESULTADOS RECENTES</div>
                    <div v-for="(dayGroup, day) in groupByDay(finishedMatches.slice(0, 10))" :key="day" class="cal-day">
                        <div class="cal-day-header">&#128197; {{ day }}</div>
                        <div v-for="m in dayGroup" :key="m.id" class="cal-match">
                            <div class="cal-time">{{ formatTimeOnly(m.scheduledAt) }}</div>
                            <div class="cal-teams">
                                <div class="cal-team" :class="{ 'cal-winner': m.winnerExternalId === m.team1ExternalId, 'cal-loser': m.winnerExternalId && m.winnerExternalId !== m.team1ExternalId }">
                                    <div class="team-icon-sm">
                                        <img v-if="m.team1Logo" :src="m.team1Logo" @error="imgError" />
                                        <span :style="m.team1Logo ? 'display:none' : ''">{{ getInitials(m.team1Name) }}</span>
                                    </div>
                                    {{ m.team1Name || 'TBA' }}
                                </div>
                                <span class="cal-score" :class="{ win: m.winnerExternalId === m.team1ExternalId, loss: m.winnerExternalId && m.winnerExternalId !== m.team1ExternalId }">{{ m.team1Score ?? 0 }}</span>
                                <span class="cal-format">MD{{ m.numberOfGames }}</span>
                                <span class="cal-score" :class="{ win: m.winnerExternalId === m.team2ExternalId, loss: m.winnerExternalId && m.winnerExternalId !== m.team2ExternalId }">{{ m.team2Score ?? 0 }}</span>
                                <div class="cal-team right" :class="{ 'cal-winner': m.winnerExternalId === m.team2ExternalId, 'cal-loser': m.winnerExternalId && m.winnerExternalId !== m.team2ExternalId }">
                                    {{ m.team2Name || 'TBA' }}
                                    <div class="team-icon-sm">
                                        <img v-if="m.team2Logo" :src="m.team2Logo" @error="imgError" />
                                        <span :style="m.team2Logo ? 'display:none' : ''">{{ getInitials(m.team2Name) }}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="cal-league">{{ tournament.leagueName || tournament.name }}</div>
                        </div>
                    </div>
                </div>

                <div v-if="upcomingMatches.length === 0 && finishedMatches.length === 0" class="empty-tournament">
                    <div class="empty-icon">📅</div>
                    <h4>Partidas em breve</h4>
                    <p>As partidas serão adicionadas conforme o campeonato se aproxima.</p>
                </div>
            </div>
            <div v-else class="empty-tournament">
                <div class="empty-icon">📅</div>
                <h4>Partidas em breve</h4>
                <p>As partidas serão adicionadas conforme o campeonato se aproxima.</p>
            </div>
        </div>

        <!-- Tab: Matches (full list) -->
        <div v-if="activeTab === 'matches'" class="tab-content">
            <div v-if="matches.length === 0" class="empty-content">
                <p>Nenhuma partida registrada ainda.</p>
            </div>
            <div v-else>
                <div v-for="(dayGroup, day) in groupByDay(matches)" :key="day" class="cal-day">
                    <div class="cal-day-header">&#128197; {{ day }}</div>
                    <div v-for="m in dayGroup" :key="m.id" class="cal-match">
                        <div class="cal-time">{{ formatTimeOnly(m.scheduledAt) }}</div>
                        <div class="cal-teams">
                            <div class="cal-team" :class="{ 'cal-winner': m.winnerExternalId === m.team1ExternalId && m.status === 'finished', 'cal-loser': m.status === 'finished' && m.winnerExternalId && m.winnerExternalId !== m.team1ExternalId }">
                                <div class="team-icon-sm">
                                    <img v-if="m.team1Logo" :src="m.team1Logo" @error="imgError" />
                                    <span :style="m.team1Logo ? 'display:none' : ''">{{ getInitials(m.team1Name) }}</span>
                                </div>
                                {{ m.team1Name || 'TBA' }}
                            </div>
                            <span class="cal-score" :class="{ win: m.status === 'finished' && m.winnerExternalId === m.team1ExternalId, loss: m.status === 'finished' && m.winnerExternalId && m.winnerExternalId !== m.team1ExternalId }">{{ m.team1Score ?? 0 }}</span>
                            <span class="cal-format">MD{{ m.numberOfGames }}</span>
                            <span class="cal-score" :class="{ win: m.status === 'finished' && m.winnerExternalId === m.team2ExternalId, loss: m.status === 'finished' && m.winnerExternalId && m.winnerExternalId !== m.team2ExternalId }">{{ m.team2Score ?? 0 }}</span>
                            <div class="cal-team right" :class="{ 'cal-winner': m.winnerExternalId === m.team2ExternalId && m.status === 'finished', 'cal-loser': m.status === 'finished' && m.winnerExternalId && m.winnerExternalId !== m.team2ExternalId }">
                                {{ m.team2Name || 'TBA' }}
                                <div class="team-icon-sm">
                                    <img v-if="m.team2Logo" :src="m.team2Logo" @error="imgError" />
                                    <span :style="m.team2Logo ? 'display:none' : ''">{{ getInitials(m.team2Name) }}</span>
                                </div>
                            </div>
                        </div>
                        <div class="cal-phase">{{ formatPhase(m.phase) }}</div>
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
                        <img v-if="t.logoUrl" :src="t.logoUrl" @error="imgError" />
                        <span :style="t.logoUrl ? 'display:none' : ''">{{ getInitials(t.name) }}</span>
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
const activePhase = ref('');

function imgError(e: Event) {
    const img = e.target as HTMLImageElement;
    img.style.display = 'none';
    const sib = img.nextElementSibling as HTMLElement | null;
    if (sib) sib.style.display = '';
}

const GROUP_PHASES = ['group_stage'];

const teams = computed(() => {
    const t = tournament.value;
    if (!t) return [];
    return t.teams || (t.teamsJson ? JSON.parse(t.teamsJson) : []);
});
const liveMatches = computed(() => matches.value.filter(m => m.status === 'running'));
const upcomingMatches = computed(() => matches.value.filter(m => m.status === 'not_started' || m.status === 'running'));
const finishedMatches = computed(() => matches.value.filter(m => m.status === 'finished'));
const hasAnyMatches = computed(() => matches.value.length > 0);

// Preserve the date-ordered sequence returned by the API; exclude group stage (shown separately)
const playoffPhases = computed(() =>
    brackets.value.phases.filter(p => !GROUP_PHASES.includes(p))
);

const groupedByGroup = computed(() => {
    const phaseMatches = brackets.value.brackets['group_stage'] || [];
    const groups: Record<string, any[]> = {};
    phaseMatches.forEach(m => {
        const key = m.groupName || 'Grupo A';
        if (!groups[key]) groups[key] = [];
        groups[key].push(m);
    });
    if (Object.keys(groups).length === 0 && phaseMatches.length > 0) {
        groups['Grupo A'] = phaseMatches;
    }
    return groups;
});

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

        // Set default active phase
        if (brackets.value.phases.length > 0) {
            activePhase.value = brackets.value.phases[0];
        }
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
            const raw = data.result || data;
            brackets.value = {
                phases: Array.isArray(raw.phases) ? raw.phases : [],
                brackets: raw.brackets && typeof raw.brackets === 'object' ? raw.brackets : {},
                hasPlayoffs: !!raw.hasPlayoffs,
            };
            if (brackets.value.phases.length > 0 && !activePhase.value) {
                activePhase.value = brackets.value.phases[0];
            }
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

function isPlayoffPhase(phase: string): boolean {
    return !GROUP_PHASES.includes(phase);
}

function formatDateLong(dateStr?: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatTimeOnly(dateStr?: string): string {
    if (!dateStr) return 'TBA';
    const d = new Date(dateStr);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
}

function groupByDay(list: any[]): Record<string, any[]> {
    const result: Record<string, any[]> = {};
    const sorted = [...list].sort((a, b) => {
        if (!a.scheduledAt) return 1;
        if (!b.scheduledAt) return -1;
        return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
    });
    for (const m of sorted) {
        if (!m.scheduledAt) {
            const key = 'Data a definir';
            if (!result[key]) result[key] = [];
            result[key].push(m);
            continue;
        }
        const d = new Date(m.scheduledAt);
        const key = d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase();
        if (!result[key]) result[key] = [];
        result[key].push(m);
    }
    return result;
}

function computeStandings(phaseMatches: any[], allTeams: any[] = []): any[] {
    const teams: Record<string, any> = {};

    // Seed with all known registered teams so they appear even without matches
    for (const t of allTeams) {
        const key = t.id || t.name;
        if (key && !teams[key]) {
            teams[key] = { id: key, name: t.name, logo: t.logoUrl || t.logo || '', points: 0, played: 0, wins: 0, draws: 0, losses: 0, roundDiff: 0 };
        }
    }

    for (const m of phaseMatches) {
        if (m.status !== 'finished') {
            for (const [id, name, logo] of [[m.team1ExternalId, m.team1Name, m.team1Logo], [m.team2ExternalId, m.team2Name, m.team2Logo]]) {
                if (id && !teams[id]) teams[id] = { id, name, logo, points: 0, played: 0, wins: 0, draws: 0, losses: 0, roundDiff: 0 };
            }
            continue;
        }

        const t1 = m.team1ExternalId || m.team1Name;
        const t2 = m.team2ExternalId || m.team2Name;
        if (!teams[t1]) teams[t1] = { id: t1, name: m.team1Name, logo: m.team1Logo, points: 0, played: 0, wins: 0, draws: 0, losses: 0, roundDiff: 0 };
        if (!teams[t2]) teams[t2] = { id: t2, name: m.team2Name, logo: m.team2Logo, points: 0, played: 0, wins: 0, draws: 0, losses: 0, roundDiff: 0 };

        teams[t1].played++;
        teams[t2].played++;

        const s1 = m.team1Score ?? 0;
        const s2 = m.team2Score ?? 0;
        teams[t1].roundDiff += s1 - s2;
        teams[t2].roundDiff += s2 - s1;

        if (m.winnerExternalId === t1) {
            teams[t1].wins++; teams[t1].points += 3;
            teams[t2].losses++;
        } else if (m.winnerExternalId === t2) {
            teams[t2].wins++; teams[t2].points += 3;
            teams[t1].losses++;
        } else {
            teams[t1].draws++; teams[t1].points++;
            teams[t2].draws++; teams[t2].points++;
        }
    }

    return Object.values(teams).sort((a, b) => b.points - a.points || b.wins - a.wins || b.roundDiff - a.roundDiff);
}

function getStandingsRowClass(idx: number, total: number): string {
    if (idx < 2) return 'row-promote';
    if (idx >= total - 2) return 'row-elim';
    return '';
}

onMounted(load);
</script>

<style scoped>
.championship-detail {
    width: 100%;
    padding: 1.5rem 0;
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

/* ─── OVERVIEW LAYOUT ─── */
.overview-content {
    display: grid;
    grid-template-columns: 1fr 260px;
    grid-template-rows: auto auto;
    gap: 1.5rem;
    align-items: start;
}

.phases-section {
    grid-column: 1;
    background: #161b22;
    border: 1px solid #2d3748;
    border-radius: 8px;
    overflow: hidden;
}

.info-card {
    grid-column: 2;
    grid-row: 1 / 3;
    background: #161b22;
    border: 1px solid #2d3748;
    border-radius: 8px;
    padding: 1.25rem;
}

.calendar-section {
    grid-column: 1;
    background: #161b22;
    border: 1px solid #2d3748;
    border-radius: 8px;
    overflow: hidden;
}

/* Section title */
.section-title {
    font-size: 0.75rem;
    font-weight: 800;
    color: #a0aec0;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 1rem 1.25rem 0.5rem;
}
.section-title.mt { padding-top: 1.25rem; border-top: 1px solid #2d3748; margin-top: 1rem; }

/* Phase sub-tabs */
.phase-tabs {
    display: flex;
    border-bottom: 2px solid #2d3748;
    padding: 0 1.25rem;
    gap: 0;
}

.phase-tab {
    padding: 0.625rem 1rem;
    font-size: 0.8125rem;
    font-weight: 600;
    color: #718096;
    background: none;
    border: none;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    white-space: nowrap;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    transition: color 0.15s;
}
.phase-tab:hover { color: #e2e8f0; }
.phase-tab.active { color: #3182ce; border-bottom-color: #3182ce; }

/* ─── BRACKET PHASE VIEW ─── */
.bracket-phase-view { padding: 0.75rem 0.75rem 1.25rem; }

.bk-matches-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 0.75rem;
}

.empty-phase {
    grid-column: 1 / -1;
    text-align: center;
    padding: 2rem;
    color: #4a5568;
    font-size: 0.875rem;
}

.bk-match {
    position: relative;
    background: #1a202c;
    border: 1px solid #2d3748;
    border-radius: 6px;
    overflow: hidden;
    flex: 1;
    min-width: 180px;
    transition: border-color 0.15s;
}
.bk-match:hover { border-color: #4a5568; }
.bk-match.is-live { border-color: #e53e3e; box-shadow: 0 0 0 1px #e53e3e33; }

.bk-live-dot {
    position: absolute; top: 6px; right: 8px;
    width: 6px; height: 6px; border-radius: 50%;
    background: #fc8181;
    animation: pulse-dot 1.2s ease-in-out infinite;
}
@keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
}

.bk-team {
    display: flex; align-items: center; gap: 0.5rem;
    padding: 0.5rem 0.75rem; font-size: 0.8125rem; color: #a0aec0;
}
.bk-team.winner { color: #fff; font-weight: 600; background: rgba(255,255,255,0.04); }
.bk-team.loser { color: #4a5568; }
.bk-team.live { color: #fc8181; }

.bk-logo {
    width: 22px; height: 22px; border-radius: 3px; background: #2d3748;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; flex-shrink: 0;
}
.bk-logo img { width: 100%; height: 100%; object-fit: contain; }
.bk-logo span { font-size: 0.5rem; font-weight: 700; color: #718096; }

.bk-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bk-score { font-weight: 700; font-size: 0.9375rem; min-width: 1.25rem; text-align: right; color: #4a5568; }
.bk-team.winner .bk-score { color: #68d391; }
.bk-divider { height: 1px; background: #2d3748; }
.bk-footer { display: flex; justify-content: space-between; padding: 0.25rem 0.75rem; font-size: 0.5625rem; color: #4a5568; border-top: 1px solid #1a202c; }

/* ─── STANDINGS TABLE ─── */
.groups-area {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
    padding: 1rem 1.25rem;
}

.group-block {}

.group-title {
    font-size: 0.75rem;
    font-weight: 800;
    color: #a0aec0;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 0.625rem;
}

.standings-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8125rem;
}

.standings-table th {
    color: #718096;
    font-size: 0.6875rem;
    font-weight: 700;
    text-transform: uppercase;
    padding: 0.375rem 0.5rem;
    text-align: center;
    border-bottom: 1px solid #2d3748;
}

.standings-table th:first-child,
.standings-table th:nth-child(2) { text-align: left; }

.standings-table td {
    padding: 0.5rem 0.5rem;
    color: #cbd5e0;
    text-align: center;
    border-bottom: 1px solid #1a202c;
}

.standings-table .rank { color: #718096; font-weight: 700; font-size: 0.75rem; }
.standings-table .team-cell { display: flex; align-items: center; gap: 0.5rem; font-weight: 600; color: #e2e8f0; text-align: left; white-space: nowrap; }
.standings-table .pts { font-weight: 700; color: #e2e8f0; }
.standings-table .win { color: #68d391; }
.standings-table .loss { color: #fc8181; }
.standings-table .sr-pos { color: #68d391; font-weight: 600; }
.standings-table .sr-neg { color: #fc8181; font-weight: 600; }

.row-promote td:first-child { border-left: 3px solid #3182ce; }
.row-elim td:first-child { border-left: 3px solid #e53e3e; }

.standings-legend {
    margin-top: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.6875rem;
}
.legend-promote { color: #3182ce; }
.legend-elim { color: #e53e3e; }

/* ─── MATCH ROW (generic phase) ─── */
.phase-match-list { padding: 0.5rem 0; }

.match-row {
    display: grid;
    grid-template-columns: 80px 40px 1fr 90px;
    align-items: center;
    gap: 0.75rem;
    padding: 0.625rem 1.25rem;
    border-bottom: 1px solid #1a202c;
    font-size: 0.8125rem;
}
.match-row:last-child { border-bottom: none; }

.mr-phase { font-size: 0.6875rem; color: #718096; text-transform: uppercase; font-weight: 600; }
.mr-format { font-size: 0.6875rem; color: #4a5568; text-align: center; background: #1a202c; padding: 0.125rem 0.375rem; border-radius: 3px; }
.mr-teams { display: flex; align-items: center; gap: 0.5rem; }
.mr-team { display: flex; align-items: center; gap: 0.375rem; flex: 1; color: #a0aec0; }
.mr-team.right { flex-direction: row-reverse; }
.mr-team.winner { color: #e2e8f0; font-weight: 600; }
.mr-team.loser { color: #4a5568; }
.mr-score { font-weight: 700; font-size: 1rem; color: #e2e8f0; min-width: 1.25rem; text-align: center; }
.mr-sep { color: #4a5568; font-size: 0.75rem; }
.mr-date { font-size: 0.6875rem; color: #718096; text-align: right; }

/* ─── INFO CARD ─── */
.info-row { padding: 0.5rem 0; font-size: 0.875rem; }
.info-label-sm { font-size: 0.6875rem; color: #718096; font-weight: 700; text-transform: uppercase; }
.info-val-prize { font-size: 0.9375rem; font-weight: 700; color: #ecc94b; display: block; margin-top: 0.25rem; }
.info-dates { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; padding: 0.5rem 0; }
.info-date { font-size: 0.875rem; font-weight: 600; color: #3182ce; margin-top: 0.25rem; }
.info-location { font-size: 0.875rem; color: #a0aec0; padding: 0.375rem 0 0.25rem; }

/* ─── CALENDAR ─── */
.cal-group { }
.cal-group-label {
    font-size: 0.6875rem; font-weight: 800; color: #a0aec0;
    text-transform: uppercase; letter-spacing: 0.08em;
    padding: 0.75rem 1.25rem 0.5rem;
}

.cal-day { }

.cal-day-header {
    font-size: 0.75rem; font-weight: 700; color: #718096;
    text-transform: uppercase; background: #0d1117;
    padding: 0.5rem 1.25rem; letter-spacing: 0.04em;
    border-top: 1px solid #2d3748; border-bottom: 1px solid #2d3748;
}

.cal-match {
    display: grid;
    grid-template-columns: 48px 1fr 120px;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1.25rem;
    border-bottom: 1px solid #1a202c;
    transition: background 0.1s;
}
.cal-match:hover { background: #1a202c; }
.cal-match:last-child { border-bottom: none; }

.cal-time { font-size: 0.75rem; color: #718096; font-weight: 600; text-align: center; }
.cal-time-live { color: #fc8181; }
.cal-match-live { border-left: 2px solid #e53e3e; background: rgba(229,62,62,0.04); }
.live-badge {
    display: inline-block; font-size: 0.5625rem; font-weight: 800;
    color: #fff; background: #e53e3e; padding: 0.15rem 0.35rem;
    border-radius: 3px; text-transform: uppercase; letter-spacing: 0.05em;
    animation: live-pulse 1.5s ease-in-out infinite;
}
@keyframes live-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.65; } }

.cal-teams {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    justify-content: center;
}

.cal-team {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    width: 38%;
    min-width: 0;
    font-size: 0.8125rem;
    color: #a0aec0;
    font-weight: 500;
    overflow: hidden;
    white-space: nowrap;
    padding: 0.2rem 0.375rem;
    border-radius: 4px;
    transition: background 0.15s;
}
.cal-team.right { flex-direction: row-reverse; justify-content: flex-start; }
.cal-winner {
    color: #e2e8f0;
    font-weight: 700;
    border-left: 3px solid rgba(104, 211, 145, 0.7);
}
.cal-team.right.cal-winner {
    border-left: none;
    border-right: 3px solid rgba(104, 211, 145, 0.7);
}
.cal-loser {
    color: #718096;
    border-left: 3px solid rgba(252, 129, 129, 0.45);
}
.cal-team.right.cal-loser {
    border-left: none;
    border-right: 3px solid rgba(252, 129, 129, 0.45);
}

.cal-score {
    font-weight: 700;
    font-size: 0.9375rem;
    color: #4a5568;
    min-width: 1.5rem;
    text-align: center;
    border-radius: 4px;
    padding: 0.1rem 0.25rem;
}
.cal-score.done { color: #e2e8f0; }
.cal-score.win {
    color: #68d391;
    background: rgba(104, 211, 145, 0.12);
}
.cal-score.loss {
    color: #fc8181;
    background: rgba(252, 129, 129, 0.1);
}

.cal-format {
    font-size: 0.6875rem;
    color: #4a5568;
    background: #1a202c;
    border: 1px solid #2d3748;
    padding: 0.125rem 0.4rem;
    border-radius: 3px;
    white-space: nowrap;
    flex-shrink: 0;
}

.cal-league {
    font-size: 0.6875rem; color: #718096;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.cal-phase { font-size: 0.6875rem; color: #718096; text-align: right; }

/* ─── COMMON ─── */
.team-icon-sm {
    width: 24px; height: 24px; border-radius: 3px; background: #2d3748;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; flex-shrink: 0;
}
.team-icon-sm img { width: 100%; height: 100%; object-fit: contain; }
.team-icon-sm span { font-size: 0.5625rem; font-weight: 700; color: #718096; }

.empty-tournament {
    text-align: center; padding: 3rem 2rem;
    color: #718096;
}
.empty-icon { font-size: 2.5rem; margin-bottom: 1rem; opacity: 0.4; }
.empty-tournament h4 { font-size: 1rem; color: #e2e8f0; margin: 0 0 0.5rem; }
.empty-tournament p { font-size: 0.875rem; margin: 0; }
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

/* Tab content */
.tab-content { padding: 0; }

@media (max-width: 900px) {
    .overview-content {
        grid-template-columns: 1fr;
    }
    .info-card { grid-row: auto; grid-column: 1; }
    .calendar-section { grid-column: 1; }
}

@media (max-width: 768px) {
    .champ-header { flex-direction: column; align-items: flex-start; }
    .header-right { width: 100%; }
    .quick-stats { justify-content: space-around; }
    .groups-area { grid-template-columns: 1fr; }
    .match-row { grid-template-columns: 1fr; }
    .cal-match { grid-template-columns: 40px 1fr; }
    .cal-league { display: none; }
}
</style>
