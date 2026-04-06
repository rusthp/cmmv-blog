<template>
    <div class="championships-page">
        <!-- HEADER -->
        <div class="page-header">
            <h1 class="page-title">Campeonatos de e-Sports</h1>
            <p class="page-subtitle">O seu portal central de cobertura mundial. Acompanhe os torneios de seus jogos favoritos.</p>
        </div>

        <!-- PRIMARY GAMES TABS -->
        <div class="games-nav">
            <button 
                v-for="g in games" 
                :key="g.value" 
                class="game-tab"
                :class="{ active: activeGame === g.value }"
                @click="setGame(g.value)"
            >
                <img v-if="g.icon" :src="g.icon" class="game-icon" width="20" height="20" alt="" />
                <span v-else class="game-icon-emoji">{{ g.emoji }}</span>
                {{ g.label }}
            </button>
        </div>

        <!-- CONTENT AREA -->
        <div class="championships-content">
            <!-- Secondary Status Tabs -->
            <div class="status-tabs-container">
                <div class="status-tabs">
                    <button 
                        v-for="tab in statusTabs" 
                        :key="tab.value"
                        class="status-tab"
                        :class="{ active: activeStatus === tab.value }"
                        @click="setStatus(tab.value)"
                    >
                        {{ tab.label }}
                        <span class="tab-count">{{ getCount(tab.value) }}</span>
                    </button>
                </div>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="timeline-loading">
                <div v-for="n in 6" :key="n" class="skeleton-list-item"></div>
            </div>

            <!-- Empty State -->
            <div v-else-if="filteredTournaments.length === 0" class="empty-state">
                <div class="empty-icon">🎮</div>
                <h3>Nenhum campeonato encontrado</h3>
                <p>Não há eventos nesta categoria para os filtros selecionados.</p>
            </div>

            <!-- TIMELINE LIST (Draft5 Style) -->
            <div v-else class="timeline-list">
                <a 
                    v-for="t in filteredTournaments" 
                    :key="t.id" 
                    :href="`/campeonatos/${t.slug}`"
                    class="timeline-card"
                    :class="{ featured: t.featured, ongoing: t.status === 'ongoing' }"
                >
                    <!-- Status / Identity -->
                    <div class="tl-identity">
                        <div class="tl-logo-box">
                            <img v-if="t.logoUrl" :src="t.logoUrl" :alt="t.name" />
                            <span v-else>{{ t.name?.substring(0, 2).toUpperCase() }}</span>
                        </div>
                        <div class="tl-game-badge" :title="getGameLabel(t.game)">
                            {{ getGameEmoji(t.game) }}
                        </div>
                    </div>

                    <!-- Details -->
                    <div class="tl-details">
                        <div class="tl-header">
                            <h3 class="tl-name">{{ t.name }}</h3>
                            <div class="tl-badges">
                                <span v-if="t.tier" class="badge tier-badge dark">Tier {{ t.tier.toUpperCase() }}</span>
                                <span class="badge type-badge" :class="t.online ? 'online' : 'lan'">
                                    {{ t.online ? 'Online' : 'LAN' }}
                                </span>
                            </div>
                        </div>
                        <div class="tl-meta">
                            <span class="meta-item dates">
                                📅 {{ formatTimelineDate(t.startDate, t.endDate) }}
                            </span>
                            <span v-if="t.prizePool" class="meta-item prize">
                                🏆 {{ t.prizePool }}
                            </span>
                            <span v-if="t.location && !t.online" class="meta-item location">
                                📍 {{ t.location }}
                            </span>
                        </div>
                    </div>

                    <!-- Status Tag -->
                    <div class="tl-status-col">
                        <span class="status-pill" :class="t.status">
                            <span v-if="t.status === 'ongoing'" class="live-dot"></span>
                            {{ statusLabel(t.status) }}
                        </span>
                    </div>
                </a>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useHead } from '@unhead/vue';

useHead({ title: 'Campeonatos de e-Sports — ProPlay News' });

const games = [
    { label: 'Geral', value: 'all', emoji: '🌐' },
    { label: 'CS2', value: 'csgo', emoji: '🔫' },
    { label: 'Valorant', value: 'valorant', emoji: '🎯' },
    { label: 'League of Legends', value: 'lol', emoji: '⚔️' },
    { label: 'Dota 2', value: 'dota2', emoji: '🛡️' },
    { label: 'Rainbow 6', value: 'r6siege', emoji: '🧨' },
];

const statusTabs = [
    { label: 'Todos', value: 'all' },
    { label: 'Em Andamento', value: 'ongoing' },
    { label: 'Próximos', value: 'upcoming' },
    { label: 'Encerrados', value: 'finished' },
];

const activeGame = ref('all');
const activeStatus = ref('all');

const tournaments = ref<any[]>([]);
const loading = ref(true);

const filteredTournaments = computed(() => {
    return tournaments.value;
});

function getCount(status: string) {
    if (status === 'all') return tournaments.value.length;
    return tournaments.value.filter(t => t.status === status).length;
}

// Watch both game and status to trigger reactive fetch
watch([activeGame, activeStatus], () => {
    load();
});

async function load() {
    try {
        loading.value = true;
        
        const params = new URLSearchParams();
        if (activeStatus.value !== 'all') params.append('status', activeStatus.value);
        if (activeGame.value !== 'all') params.append('game', activeGame.value);

        const res = await fetch(`/api/esports/tournaments?${params.toString()}`);
        const json = await res.json();
        tournaments.value = json.data || [];
    } catch {
        tournaments.value = [];
    } finally {
        loading.value = false;
    }
}

function setGame(value: string) { activeGame.value = value; }
function setStatus(value: string) { activeStatus.value = value; }

function getGameLabel(gameSlug: string): string {
    const item = games.find(g => g.value === gameSlug);
    return item ? item.label : gameSlug;
}

function getGameEmoji(gameSlug: string): string {
    const item = games.find(g => g.value === gameSlug);
    return item ? item.emoji : '🎮';
}

function statusLabel(status: string): string {
    const map: Record<string, string> = {
        ongoing: '🔴 AO VIVO',
        upcoming: 'EM BREVE',
        finished: 'ENCERRADO',
        cancelled: 'CANCELADO',
    };
    return map[status] || status.toUpperCase();
}

function formatTimelineDate(startStr: string, endStr: string): string {
    if (!startStr) return 'TBA';
    const s = new Date(startStr);
    const e = endStr ? new Date(endStr) : null;
    
    const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' };
    const sStr = s.toLocaleDateString('pt-BR', opts);
    
    if (!e || s.getTime() === e.getTime()) return sStr;
    const eStr = e.toLocaleDateString('pt-BR', opts);
    return `${sStr} — ${eStr}`;
}

onMounted(load);
</script>

<style scoped>
.championships-page {
    max-width: 1100px;
    margin: 0 auto;
    padding: 2.5rem 1.5rem;
    font-family: 'Inter', sans-serif;
}

.page-header {
    margin-bottom: 2.5rem;
}

.page-title {
    font-size: 2.5rem;
    font-weight: 900;
    color: #f8fafc;
    margin-bottom: 0.5rem;
    letter-spacing: -0.02em;
}

.page-subtitle {
    color: #94a3b8;
    font-size: 1.1rem;
}

/* Games Navigation (Pills) */
.games-nav {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    background: rgba(15, 23, 42, 0.4);
    padding: 1rem;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.05);
}

.game-tab {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1.25rem;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.03);
    color: #cbd5e1;
    font-weight: 600;
    font-size: 0.95rem;
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.game-tab:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-2px);
}

.game-tab.active {
    background: linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(59, 130, 246, 0.15));
    border-color: rgba(56, 189, 248, 0.4);
    color: #e0f2fe;
    box-shadow: 0 4px 12px rgba(56, 189, 248, 0.1);
}

.game-icon-emoji {
    font-size: 1.2rem;
}

/* Content Area */
.championships-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

/* Secondary Status Tabs */
.status-tabs-container {
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding-bottom: 1rem;
}

.status-tabs {
    display: flex;
    gap: 1.5rem;
}

.status-tab {
    background: transparent;
    border: none;
    color: #64748b;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    padding: 0.5rem 0;
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: color 0.2s;
}

.status-tab:hover {
    color: #cbd5e1;
}

.status-tab.active {
    color: #38bdf8;
}

.status-tab.active::after {
    content: '';
    position: absolute;
    bottom: -1rem;
    left: 0;
    right: 0;
    height: 3px;
    background: #38bdf8;
    border-radius: 3px 3px 0 0;
}

.tab-count {
    background: rgba(255, 255, 255, 0.1);
    color: #94a3b8;
    font-size: 0.75rem;
    padding: 0.1rem 0.5rem;
    border-radius: 999px;
}

.status-tab.active .tab-count {
    background: rgba(56, 189, 248, 0.2);
    color: #38bdf8;
}

/* TIMELINE LIST (Draft5 Style) */
.timeline-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.timeline-card {
    display: flex;
    align-items: center;
    background: rgba(30, 41, 59, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-left: 4px solid #475569;
    border-radius: 12px;
    padding: 1.25rem;
    text-decoration: none;
    transition: all 0.2s ease;
    gap: 1.5rem;
}

.timeline-card:hover {
    background: rgba(30, 41, 59, 0.7);
    border-color: rgba(255, 255, 255, 0.1);
    transform: translateX(4px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.timeline-card.ongoing {
    border-left-color: #ef4444; /* Red for live */
}

.timeline-card.featured {
    border-left-color: #f59e0b; /* Gold for featured */
}

/* Identity / Logo */
.tl-identity {
    position: relative;
    width: 90px;
    height: 60px;
    flex-shrink: 0;
}

.tl-logo-box {
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    color: #64748b;
    font-weight: bold;
    font-size: 1.2rem;
}

.tl-logo-box img {
    max-width: 80%;
    max-height: 80%;
    object-fit: contain;
}

.tl-game-badge {
    position: absolute;
    bottom: -8px;
    right: -8px;
    background: #1e293b;
    border: 2px solid #0f172a;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* Details */
.tl-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.tl-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
}

.tl-name {
    font-size: 1.15rem;
    font-weight: 700;
    color: #f8fafc;
    margin: 0;
}

.tl-badges {
    display: flex;
    gap: 0.5rem;
}

.badge {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    padding: 0.2rem 0.5rem;
    border-radius: 6px;
}

.tier-badge.dark { background: #334155; color: #cbd5e1; }
.type-badge.lan { background: rgba(56, 189, 248, 0.15); color: #38bdf8; }
.type-badge.online { background: rgba(74, 222, 128, 0.15); color: #4ade80; }

/* Meta */
.tl-meta {
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
}

.meta-item {
    font-size: 0.85rem;
    color: #94a3b8;
    display: flex;
    align-items: center;
}

.meta-item.prize { color: #fcd34d; font-weight: 600; }

/* Status Col */
.tl-status-col {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}

.status-pill {
    padding: 0.4rem 0.8rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    letter-spacing: 0.05em;
}

.status-pill.ongoing { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); }
.status-pill.upcoming { background: rgba(56, 189, 248, 0.1); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.2); }
.status-pill.finished { background: rgba(148, 163, 184, 0.1); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.2); }

.live-dot {
    width: 6px;
    height: 6px;
    background: currentColor;
    border-radius: 50%;
    animation: blink 1.5s infinite;
}

@keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
}

/* Empty & Loading */
.empty-state {
    text-align: center;
    padding: 5rem 0;
    background: rgba(30, 41, 59, 0.3);
    border-radius: 16px;
    border: 1px dashed rgba(255, 255, 255, 0.1);
}

.empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
}

.empty-state h3 {
    color: #e2e8f0;
    margin-bottom: 0.5rem;
    font-size: 1.25rem;
}

.empty-state p {
    color: #64748b;
}

.timeline-loading {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.skeleton-list-item {
    height: 100px;
    border-radius: 12px;
    background: linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.02) 75%);
    background-size: 200% 100%;
    animation: placeholder-shimmer 2s infinite linear;
}

@keyframes placeholder-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}

@media (max-width: 768px) {
    .timeline-card {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
    }
    .tl-status-col {
        width: 100%;
        align-items: flex-start;
    }
    .status-tabs {
        width: 100%;
        overflow-x: auto;
        padding-bottom: 0.5rem;
    }
    .status-tab {
        white-space: nowrap;
    }
}
</style>
