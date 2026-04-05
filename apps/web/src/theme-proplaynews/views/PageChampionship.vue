<template>
    <div class="championship-page" v-if="tournament">
        <!-- Header -->
        <div class="champ-header">
            <div class="champ-logo-wrap">
                <img v-if="tournament.logoUrl" :src="tournament.logoUrl" :alt="tournament.name" class="champ-logo" />
                <div v-else class="champ-logo-placeholder">{{ tournament.name?.substring(0,2) }}</div>
            </div>
            <div class="champ-header-info">
                <div class="champ-badges">
                    <span class="badge" :class="tournament.online ? 'online' : 'lan'">
                        {{ tournament.online ? 'ONLINE' : 'LAN' }}
                    </span>
                    <span class="badge status" :class="tournament.status">
                        <span v-if="tournament.status === 'ongoing'" class="live-dot"></span>
                        {{ statusLabel(tournament.status) }}
                    </span>
                    <span v-if="tournament.tier" class="badge tier" :class="`tier-${tournament.tier}`">
                        TIER {{ tournament.tier?.toUpperCase() }}
                    </span>
                </div>
                <h1 class="champ-title">{{ tournament.name }}</h1>
                <div class="champ-meta-row">
                    <span v-if="tournament.leagueName">🏟️ {{ tournament.leagueName }}</span>
                    <span v-if="!tournament.online && tournament.location">📍 {{ tournament.location }}</span>
                    <span>📅 {{ formatDate(tournament.startDate) }} — {{ formatDate(tournament.endDate) }}</span>
                    <span v-if="tournament.prizePool">🏆 {{ tournament.prizePool }}</span>
                </div>
            </div>
        </div>

        <!-- Tabs -->
        <div class="champ-tabs">
            <button
                v-for="tab in tabs"
                :key="tab.value"
                class="champ-tab"
                :class="{ active: activeTab === tab.value }"
                @click="activeTab = tab.value"
            >{{ tab.label }}</button>
        </div>

        <!-- Tab: Resumo -->
        <div v-if="activeTab === 'summary'" class="tab-content">
            <!-- Ongoing/upcoming matches -->
            <section v-if="liveMatches.length > 0">
                <h2 class="section-title">
                    <span class="live-dot"></span> AO VIVO
                </h2>
                <div class="matches-list">
                    <MatchCard v-for="m in liveMatches" :key="m.id" :match="m" live />
                </div>
            </section>

            <section v-if="upcomingMatches.length > 0">
                <h2 class="section-title">PRÓXIMAS PARTIDAS</h2>
                <div class="matches-list">
                    <MatchCard v-for="m in upcomingMatches.slice(0, 5)" :key="m.id" :match="m" />
                </div>
            </section>

            <!-- Teams -->
            <section v-if="teams.length > 0">
                <h2 class="section-title">EQUIPES PARTICIPANTES</h2>
                <div class="teams-grid">
                    <div v-for="t in teams" :key="t.id" class="team-card">
                        <img v-if="t.logoUrl" :src="t.logoUrl" :alt="t.name" class="team-logo" />
                        <div v-else class="team-logo-placeholder">{{ t.name?.substring(0,2) }}</div>
                        <span class="team-name">{{ t.name }}</span>
                    </div>
                </div>
            </section>
        </div>

        <!-- Tab: Próximas Partidas -->
        <div v-if="activeTab === 'upcoming'" class="tab-content">
            <div v-if="upcomingMatches.length === 0" class="empty-state">Sem partidas agendadas.</div>
            <div class="matches-list">
                <MatchCard v-for="m in upcomingMatches" :key="m.id" :match="m" />
            </div>
        </div>

        <!-- Tab: Resultados -->
        <div v-if="activeTab === 'results'" class="tab-content">
            <div v-if="finishedMatches.length === 0" class="empty-state">Sem resultados ainda.</div>
            <div class="matches-list">
                <MatchCard v-for="m in finishedMatches" :key="m.id" :match="m" />
            </div>
        </div>

        <!-- Tab: Equipes -->
        <div v-if="activeTab === 'teams'" class="tab-content">
            <div v-if="teams.length === 0" class="empty-state">Informação de equipes não disponível.</div>
            <div class="teams-grid large">
                <div v-for="t in teams" :key="t.id" class="team-card large">
                    <img v-if="t.logoUrl" :src="t.logoUrl" :alt="t.name" class="team-logo" />
                    <div v-else class="team-logo-placeholder">{{ t.name?.substring(0,2) }}</div>
                    <span class="team-name">{{ t.name }}</span>
                    <span v-if="t.nationality" class="team-meta">{{ t.nationality }}</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Loading -->
    <div v-else-if="loading" class="loading-page">
        <div class="spinner"></div>
    </div>

    <!-- Not found -->
    <div v-else class="not-found">
        <h2>Campeonato não encontrado</h2>
        <a href="/campeonatos">← Voltar para campeonatos</a>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useHead } from '@unhead/vue';

// Inline MatchCard component
const MatchCard = {
    props: ['match', 'live'],
    template: `
    <div class="match-card" :class="{ live: live || match.status === 'running' }">
        <div class="match-phase">{{ phaseLabel(match.phase) }} · MD{{ match.numberOfGames }}</div>
        <div class="match-teams">
            <div class="match-team" :class="{ winner: match.winnerExternalId === match.team1ExternalId }">
                <img v-if="match.team1Logo" :src="match.team1Logo" :alt="match.team1Name" class="team-img" />
                <div v-else class="team-img-placeholder">{{ match.team1Name?.substring(0,2) }}</div>
                <span class="team-name-sm">{{ match.team1Name }}</span>
                <span class="score" :class="{ winner: match.winnerExternalId === match.team1ExternalId }">
                    {{ match.status === 'not_started' ? '' : match.team1Score }}
                </span>
            </div>
            <div class="match-vs">
                <span v-if="match.status === 'running'" class="live-badge">AO VIVO</span>
                <span v-else-if="match.status === 'not_started'" class="match-time">{{ formatTime(match.scheduledAt) }}</span>
                <span v-else class="match-ended">ENCERRADO</span>
            </div>
            <div class="match-team right" :class="{ winner: match.winnerExternalId === match.team2ExternalId }">
                <span class="score right" :class="{ winner: match.winnerExternalId === match.team2ExternalId }">
                    {{ match.status === 'not_started' ? '' : match.team2Score }}
                </span>
                <span class="team-name-sm right">{{ match.team2Name }}</span>
                <img v-if="match.team2Logo" :src="match.team2Logo" :alt="match.team2Name" class="team-img" />
                <div v-else class="team-img-placeholder">{{ match.team2Name?.substring(0,2) }}</div>
            </div>
        </div>
        <div v-if="match.scheduledAt && match.status !== 'running'" class="match-date">
            {{ formatDateFull(match.scheduledAt) }}
        </div>
    </div>`,
    methods: {
        phaseLabel(phase: string): string {
            const map: Record<string, string> = {
                grand_final: 'Grande Final',
                semi_final: 'Semifinal',
                quarter_final: 'Quartas de Final',
                playoffs: 'Playoffs',
                group_stage: 'Fase de Grupos',
                qualifier: 'Qualificatória',
            };
            return map[phase] || phase || 'Partida';
        },
        formatTime(dateStr: string): string {
            if (!dateStr) return 'TBD';
            return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        },
        formatDateFull(dateStr: string): string {
            if (!dateStr) return '';
            return new Date(dateStr).toLocaleDateString('pt-BR', {
                weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
            });
        },
    },
};

const route = useRoute();
const slug = computed(() => route.params.slug as string);

const tournament = ref<any>(null);
const matches = ref<any[]>([]);
const loading = ref(true);
const activeTab = ref('summary');

const tabs = [
    { label: 'Resumo', value: 'summary' },
    { label: 'Próximas Partidas', value: 'upcoming' },
    { label: 'Resultados', value: 'results' },
    { label: 'Equipes', value: 'teams' },
];

const teams = computed(() => tournament.value?.teams || []);
const liveMatches = computed(() => matches.value.filter(m => m.status === 'running'));
const upcomingMatches = computed(() => matches.value.filter(m => m.status === 'not_started'));
const finishedMatches = computed(() => matches.value.filter(m => m.status === 'finished'));

async function load() {
    try {
        loading.value = true;
        const [tRes, mRes] = await Promise.all([
            fetch(`/api/cs2/tournaments/${slug.value}`),
            fetch(`/api/cs2/tournaments/${slug.value}/matches`),
        ]);
        tournament.value = await tRes.json();
        const matchData = await mRes.json();
        matches.value = matchData.data || [];

        if (tournament.value?.name) {
            useHead({ title: `${tournament.value.name} — ProPlay News` });
        }
    } catch {
        tournament.value = null;
    } finally {
        loading.value = false;
    }
}

function statusLabel(status: string): string {
    const map: Record<string, string> = {
        ongoing: 'EM ANDAMENTO',
        upcoming: 'EM BREVE',
        finished: 'ENCERRADO',
        cancelled: 'CANCELADO',
    };
    return map[status] || status?.toUpperCase();
}

function formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: '2-digit'
    });
}

onMounted(load);
</script>

<style scoped>
.championship-page {
    max-width: 1000px;
    margin: 0 auto;
    padding: 2rem 1rem;
}

/* Header */
.champ-header {
    display: flex;
    align-items: center;
    gap: 2rem;
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: rgba(135, 206, 235, 0.07);
    border: 1px solid rgba(135, 206, 235, 0.2);
    border-radius: 16px;
}

.champ-logo { max-width: 120px; max-height: 80px; object-fit: contain; }
.champ-logo-placeholder {
    width: 80px; height: 80px;
    border-radius: 50%;
    background: rgba(135, 206, 235, 0.2);
    display: flex; align-items: center; justify-content: center;
    font-size: 1.5rem; font-weight: 800; color: #87ceeb;
}

.champ-badges { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.5rem; }

.badge {
    font-size: 0.7rem; font-weight: 700;
    padding: 0.2rem 0.6rem; border-radius: 4px;
    display: flex; align-items: center; gap: 0.3rem;
}
.badge.lan { background: #0f172a; color: #87ceeb; border: 1px solid #87ceeb40; }
.badge.online { background: #0f1f0f; color: #4ade80; border: 1px solid #4ade8040; }
.badge.status.ongoing { background: #2e1a1a; color: #f87171; border: 1px solid #f8717140; }
.badge.status.upcoming { background: #1a2433; color: #60a5fa; border: 1px solid #60a5fa40; }
.badge.status.finished { background: #1e1e1e; color: #94a3b8; border: 1px solid #94a3b840; }
.badge.tier-s, .badge.tier-a { background: rgba(255,204,0,0.1); color: #fbbf24; border: 1px solid #fbbf2440; }
.badge.tier-b { background: rgba(148,163,184,0.1); color: #94a3b8; border: 1px solid #94a3b840; }

.champ-title { font-size: 1.6rem; font-weight: 800; color: #f1f5f9; margin-bottom: 0.5rem; }
.champ-meta-row { display: flex; flex-wrap: wrap; gap: 1rem; font-size: 0.85rem; color: #64748b; }

/* Tabs */
.champ-tabs {
    display: flex; gap: 0; margin-bottom: 1.5rem;
    border-bottom: 2px solid rgba(135, 206, 235, 0.15);
}
.champ-tab {
    padding: 0.6rem 1.2rem; font-weight: 600; font-size: 0.9rem;
    color: #64748b; background: none; border: none; cursor: pointer;
    border-bottom: 2px solid transparent; margin-bottom: -2px;
    transition: all 0.2s;
}
.champ-tab:hover { color: #87ceeb; }
.champ-tab.active { color: #87ceeb; border-bottom-color: #87ceeb; }

.section-title {
    font-size: 0.8rem; font-weight: 700; letter-spacing: 0.08em;
    color: #64748b; margin: 1.5rem 0 0.75rem;
    display: flex; align-items: center; gap: 0.5rem;
}

/* Matches */
.matches-list { display: flex; flex-direction: column; gap: 0.75rem; }

:deep(.match-card) {
    background: rgba(135, 206, 235, 0.05);
    border: 1px solid rgba(135, 206, 235, 0.15);
    border-radius: 10px;
    padding: 0.75rem 1rem;
    transition: border-color 0.2s;
}
:deep(.match-card:hover) { border-color: rgba(135, 206, 235, 0.35); }
:deep(.match-card.live) { border-color: rgba(248, 113, 113, 0.4); background: rgba(248, 113, 113, 0.05); }

:deep(.match-phase) { font-size: 0.7rem; color: #64748b; font-weight: 600; letter-spacing: 0.05em; margin-bottom: 0.5rem; }

:deep(.match-teams) { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
:deep(.match-team) { display: flex; align-items: center; gap: 0.5rem; flex: 1; }
:deep(.match-team.right) { flex-direction: row-reverse; text-align: right; }

:deep(.team-img) { width: 32px; height: 32px; object-fit: contain; }
:deep(.team-img-placeholder) {
    width: 32px; height: 32px; border-radius: 50%;
    background: rgba(135,206,235,0.15);
    display: flex; align-items: center; justify-content: center;
    font-size: 0.65rem; font-weight: 700; color: #87ceeb;
}
:deep(.team-name-sm) { font-size: 0.9rem; font-weight: 600; color: #e2e8f0; }

:deep(.score) { font-size: 1.2rem; font-weight: 800; color: #64748b; min-width: 24px; text-align: center; }
:deep(.score.winner) { color: #f1f5f9; }

:deep(.match-vs) { text-align: center; min-width: 80px; }
:deep(.live-badge) { background: #f87171; color: white; font-size: 0.7rem; font-weight: 700; padding: 0.2rem 0.5rem; border-radius: 4px; animation: pulse 1.5s infinite; }
:deep(.match-time) { font-size: 1rem; font-weight: 700; color: #87ceeb; }
:deep(.match-ended) { font-size: 0.75rem; color: #64748b; }

:deep(.match-date) { font-size: 0.75rem; color: #64748b; margin-top: 0.4rem; }

/* Teams */
.teams-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 1rem; margin-top: 0.5rem;
}
.teams-grid.large { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); }

.team-card {
    display: flex; flex-direction: column; align-items: center;
    padding: 1rem 0.5rem; gap: 0.5rem;
    background: rgba(135,206,235,0.05);
    border: 1px solid rgba(135,206,235,0.15);
    border-radius: 10px; text-align: center;
    transition: border-color 0.2s;
}
.team-card:hover { border-color: rgba(135,206,235,0.35); }
.team-card.large { padding: 1.25rem; }

.team-logo { width: 48px; height: 48px; object-fit: contain; }
.team-logo-placeholder {
    width: 48px; height: 48px; border-radius: 50%;
    background: rgba(135,206,235,0.15);
    display: flex; align-items: center; justify-content: center;
    font-size: 0.9rem; font-weight: 700; color: #87ceeb;
}
.team-name { font-size: 0.8rem; font-weight: 600; color: #e2e8f0; }
.team-meta { font-size: 0.7rem; color: #64748b; }

/* Live dot */
.live-dot {
    display: inline-block; width: 8px; height: 8px;
    background: #f87171; border-radius: 50%;
    animation: pulse 1.5s infinite;
}
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

/* Loading/states */
.loading-page { display: flex; align-items: center; justify-content: center; min-height: 40vh; }
.spinner { width: 40px; height: 40px; border: 3px solid rgba(135,206,235,0.2); border-top-color: #87ceeb; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.not-found { text-align: center; padding: 4rem; color: #64748b; }
.not-found a { color: #87ceeb; text-decoration: none; }
.empty-state { text-align: center; padding: 3rem; color: #64748b; }
.tab-content { min-height: 200px; }

@media (max-width: 640px) {
    .champ-header { flex-direction: column; text-align: center; }
    .champ-meta-row { justify-content: center; }
    .champ-title { font-size: 1.3rem; }
    .teams-grid { grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); }
}
</style>
