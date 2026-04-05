<template>
    <div class="championships-page">
        <div class="page-header">
            <h1 class="page-title">Campeonatos CS2</h1>
            <p class="page-subtitle">Acompanhe os torneios em andamento, próximos e passados</p>
        </div>

        <!-- Status Filter -->
        <div class="filter-tabs">
            <button
                v-for="tab in tabs"
                :key="tab.value"
                class="filter-tab"
                :class="{ active: activeTab === tab.value }"
                @click="setTab(tab.value)"
            >
                <span v-if="tab.value === 'ongoing'" class="live-dot"></span>
                {{ tab.label }}
                <span class="tab-count">{{ counts[tab.value] }}</span>
            </button>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="loading-grid">
            <div v-for="n in 8" :key="n" class="skeleton-card"></div>
        </div>

        <!-- Empty -->
        <div v-else-if="filtered.length === 0" class="empty-state">
            <p>Nenhum campeonato encontrado nesta categoria.</p>
        </div>

        <!-- Grid -->
        <div v-else class="tournaments-grid">
            <a
                v-for="t in filtered"
                :key="t.id"
                :href="`/campeonatos/${t.slug}`"
                class="tournament-card"
                :class="{ featured: t.featured }"
            >
                <!-- Badges -->
                <div class="card-badges">
                    <span class="badge type-badge" :class="t.online ? 'online' : 'lan'">
                        {{ t.online ? 'ONLINE' : 'LAN' }}
                    </span>
                    <span class="badge status-badge" :class="t.status">
                        <span v-if="t.status === 'ongoing'" class="live-dot small"></span>
                        {{ statusLabel(t.status) }}
                    </span>
                </div>

                <!-- Logo -->
                <div class="card-logo">
                    <img v-if="t.logoUrl" :src="t.logoUrl" :alt="t.name" />
                    <div v-else class="logo-placeholder">
                        <span>{{ t.name?.substring(0, 2).toUpperCase() }}</span>
                    </div>
                </div>

                <!-- Info -->
                <div class="card-info">
                    <h3 class="card-name">{{ t.name }}</h3>
                    <p class="card-dates">
                        {{ formatDate(t.startDate) }} — {{ formatDate(t.endDate) }}
                    </p>
                    <div class="card-meta">
                        <span v-if="t.prizePool" class="prize">🏆 {{ t.prizePool }}</span>
                        <span v-if="t.location && !t.online" class="location">📍 {{ t.location }}</span>
                    </div>
                </div>
            </a>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useHead } from '@unhead/vue';

useHead({ title: 'Campeonatos CS2 — ProPlay News' });

const tabs = [
    { label: 'Em Andamento', value: 'ongoing' },
    { label: 'Próximos', value: 'upcoming' },
    { label: 'Encerrados', value: 'finished' },
    { label: 'Todos', value: 'all' },
];

const activeTab = ref('ongoing');
const tournaments = ref<any[]>([]);
const loading = ref(true);

const filtered = computed(() => {
    if (activeTab.value === 'all') return tournaments.value;
    return tournaments.value.filter(t => t.status === activeTab.value);
});

const counts = computed(() => ({
    ongoing: tournaments.value.filter(t => t.status === 'ongoing').length,
    upcoming: tournaments.value.filter(t => t.status === 'upcoming').length,
    finished: tournaments.value.filter(t => t.status === 'finished').length,
    all: tournaments.value.length,
}));

async function load() {
    try {
        loading.value = true;
        const res = await fetch('/api/cs2/tournaments');
        const json = await res.json();
        tournaments.value = json.data || [];
    } catch {
        tournaments.value = [];
    } finally {
        loading.value = false;
    }
}

function setTab(value: string) {
    activeTab.value = value;
}

function statusLabel(status: string): string {
    const map: Record<string, string> = {
        ongoing: 'EM ANDAMENTO',
        upcoming: 'EM BREVE',
        finished: 'ENCERRADO',
        cancelled: 'CANCELADO',
    };
    return map[status] || status.toUpperCase();
}

function formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

onMounted(load);
</script>

<style scoped>
.championships-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1rem;
}

.page-header {
    text-align: center;
    margin-bottom: 2rem;
}

.page-title {
    font-size: 2rem;
    font-weight: 800;
    color: #87ceeb;
    margin-bottom: 0.5rem;
}

.page-subtitle {
    color: #94a3b8;
    font-size: 1rem;
}

/* Tabs */
.filter-tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
}

.filter-tab {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 1.2rem;
    border-radius: 9999px;
    border: 2px solid rgba(135, 206, 235, 0.3);
    background: rgba(135, 206, 235, 0.05);
    color: #94a3b8;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;
}

.filter-tab:hover {
    border-color: rgba(135, 206, 235, 0.6);
    color: #87ceeb;
}

.filter-tab.active {
    background: rgba(135, 206, 235, 0.15);
    border-color: #87ceeb;
    color: #87ceeb;
}

.tab-count {
    background: rgba(135, 206, 235, 0.2);
    border-radius: 9999px;
    padding: 0 0.4rem;
    font-size: 0.75rem;
}

/* Grid */
.tournaments-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1.25rem;
}

/* Card */
.tournament-card {
    display: flex;
    flex-direction: column;
    background: rgba(135, 206, 235, 0.07);
    border: 1px solid rgba(135, 206, 235, 0.2);
    border-radius: 12px;
    overflow: hidden;
    text-decoration: none;
    transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
    cursor: pointer;
}

.tournament-card:hover {
    transform: translateY(-4px);
    border-color: rgba(135, 206, 235, 0.5);
    box-shadow: 0 8px 24px rgba(135, 206, 235, 0.15);
}

.tournament-card.featured {
    border-color: rgba(255, 204, 0, 0.3);
}

.tournament-card.featured:hover {
    border-color: rgba(255, 204, 0, 0.6);
    box-shadow: 0 8px 24px rgba(255, 204, 0, 0.15);
}

/* Badges */
.card-badges {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    background: rgba(0, 0, 0, 0.3);
}

.badge {
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 0.3rem;
}

.type-badge.lan { background: #1a1a2e; color: #87ceeb; border: 1px solid #87ceeb40; }
.type-badge.online { background: #1a2e1a; color: #4ade80; border: 1px solid #4ade8040; }

.status-badge.ongoing { background: #2e1a1a; color: #f87171; border: 1px solid #f8717140; }
.status-badge.upcoming { background: #1a2433; color: #60a5fa; border: 1px solid #60a5fa40; }
.status-badge.finished { background: #1e1e1e; color: #94a3b8; border: 1px solid #94a3b840; }

/* Logo */
.card-logo {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    min-height: 120px;
    background: rgba(0, 0, 0, 0.2);
}

.card-logo img {
    max-width: 160px;
    max-height: 90px;
    object-fit: contain;
}

.logo-placeholder {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: rgba(135, 206, 235, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: 800;
    color: #87ceeb;
}

/* Info */
.card-info {
    padding: 1rem;
    flex: 1;
}

.card-name {
    font-size: 0.95rem;
    font-weight: 700;
    color: #f1f5f9;
    margin-bottom: 0.4rem;
    line-height: 1.3;
}

.card-dates {
    font-size: 0.8rem;
    color: #64748b;
    margin-bottom: 0.5rem;
}

.card-meta {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    font-size: 0.8rem;
    color: #94a3b8;
}

.prize { color: #fbbf24; }

/* Live dot */
.live-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    background: #f87171;
    border-radius: 50%;
    animation: pulse 1.5s infinite;
}

.live-dot.small { width: 6px; height: 6px; }

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
}

/* Skeleton */
.loading-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1.25rem;
}

.skeleton-card {
    height: 260px;
    border-radius: 12px;
    background: linear-gradient(90deg, rgba(135,206,235,0.05) 25%, rgba(135,206,235,0.1) 50%, rgba(135,206,235,0.05) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}

.empty-state {
    text-align: center;
    padding: 4rem 0;
    color: #64748b;
}

@media (max-width: 640px) {
    .page-title { font-size: 1.5rem; }
    .tournaments-grid { grid-template-columns: 1fr 1fr; }
}
</style>
