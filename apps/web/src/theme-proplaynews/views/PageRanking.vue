<template>
    <div class="ranking-page">
        <!-- Header -->
        <div class="page-header">
            <div class="header-content">
                <div class="header-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                </div>
                <div>
                    <h1 class="page-title">Ranking Mundial CS2</h1>
                    <p class="page-subtitle">
                        Standings oficiais da Valve para o próximo Major
                        <span v-if="snapshotDate" class="snapshot-date">· {{ formatSnapshotDate(snapshotDate) }}</span>
                    </p>
                </div>
            </div>
        </div>

        <!-- Region Tabs -->
        <div class="region-tabs">
            <button
                v-for="tab in regionTabs"
                :key="tab.value"
                class="region-tab"
                :class="{ active: activeRegion === tab.value }"
                @click="setRegion(tab.value)"
            >
                <span class="tab-flag">{{ tab.flag }}</span>
                {{ tab.label }}
            </button>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="loading-state">
            <div v-for="n in 20" :key="n" class="skeleton-row"></div>
        </div>

        <!-- Empty -->
        <div v-else-if="rankings.length === 0" class="empty-state">
            <div class="empty-icon">📊</div>
            <p>Ranking ainda não sincronizado.</p>
            <p class="empty-sub">Os dados são atualizados mensalmente pela Valve.</p>
        </div>

        <!-- Table -->
        <div v-else class="ranking-table-wrapper">
            <table class="ranking-table">
                <thead>
                    <tr>
                        <th class="col-rank">#</th>
                        <th class="col-team">Time</th>
                        <th class="col-roster">Jogadores</th>
                        <th class="col-points">Pontos</th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="entry in rankings"
                        :key="entry.id"
                        class="ranking-row"
                        :class="getRowClass(entry.standing)"
                    >
                        <!-- Rank -->
                        <td class="col-rank">
                            <div class="rank-cell">
                                <span class="rank-medal" v-if="entry.standing <= 3">
                                    {{ entry.standing === 1 ? '🥇' : entry.standing === 2 ? '🥈' : '🥉' }}
                                </span>
                                <span class="rank-number" :class="{ 'top16': entry.standing <= 16 }">
                                    {{ entry.standing }}
                                </span>
                            </div>
                        </td>

                        <!-- Team -->
                        <td class="col-team">
                            <div class="team-cell">
                                <div class="team-logo" v-if="entry.logoUrl">
                                    <img :src="entry.logoUrl" :alt="entry.teamName" />
                                </div>
                                <div class="team-logo-placeholder" v-else>
                                    {{ entry.teamName.substring(0, 2).toUpperCase() }}
                                </div>
                                <span class="team-name">{{ entry.teamName }}</span>
                            </div>
                        </td>

                        <!-- Roster -->
                        <td class="col-roster">
                            <div class="roster-cell">
                                <span
                                    v-for="(player, i) in parsePlayers(entry.roster)"
                                    :key="i"
                                    class="player-tag"
                                >{{ player }}</span>
                            </div>
                        </td>

                        <!-- Points -->
                        <td class="col-points">
                            <div class="points-cell">
                                <div class="points-bar-wrap">
                                    <div
                                        class="points-bar"
                                        :style="{ width: getBarWidth(entry.points) + '%' }"
                                        :class="getBarClass(entry.standing)"
                                    ></div>
                                </div>
                                <span class="points-value">{{ entry.points.toLocaleString() }}</span>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Source note -->
        <div class="source-note">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="info-icon">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Dados oficiais da Valve Software via
            <a href="https://github.com/ValveSoftware/counter-strike_regional_standings" target="_blank" rel="noopener">
                counter-strike_regional_standings
            </a>
            · Top 16 se classificam para o Major
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useHead } from '@unhead/vue';

useHead({ title: 'Ranking Mundial CS2 — ProPlay News' });

const regionTabs = [
    { label: 'Global', value: 'global', flag: '🌍' },
    { label: 'Américas', value: 'americas', flag: '🌎' },
    { label: 'Europa', value: 'europe', flag: '🌍' },
    { label: 'Ásia', value: 'asia', flag: '🌏' },
];

const activeRegion = ref('global');
const rankings = ref<any[]>([]);
const snapshotDate = ref('');
const loading = ref(true);

const maxPoints = computed(() =>
    rankings.value.length > 0 ? rankings.value[0].points : 1
);

async function load(region: string) {
    loading.value = true;
    try {
        const res = await fetch(`/api/cs2/rankings?region=${region}&limit=200`);
        const json = await res.json();
        rankings.value = json.data || [];
        snapshotDate.value = rankings.value[0]?.snapshotDate || '';
    } catch {
        rankings.value = [];
    } finally {
        loading.value = false;
    }
}

function setRegion(region: string) {
    activeRegion.value = region;
    load(region);
}

function parsePlayers(roster: string): string[] {
    if (!roster) return [];
    return roster.split(',').map(p => p.trim()).filter(Boolean);
}

function getBarWidth(points: number): number {
    return Math.round((points / maxPoints.value) * 100);
}

function getBarClass(standing: number): string {
    if (standing <= 3) return 'bar-gold';
    if (standing <= 8) return 'bar-blue';
    if (standing <= 16) return 'bar-green';
    return 'bar-gray';
}

function getRowClass(standing: number): string {
    if (standing <= 3) return 'row-podium';
    if (standing <= 16) return 'row-qualified';
    return '';
}

function formatSnapshotDate(date: string): string {
    // "2026_03_02" → "02/03/2026"
    const parts = date.split('_');
    if (parts.length !== 3) return date;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

onMounted(() => load('global'));
</script>

<style scoped>
.ranking-page {
    max-width: 1100px;
    margin: 0 auto;
    padding: 2rem 1rem;
}

/* Header */
.page-header {
    margin-bottom: 1.5rem;
}

.header-content {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.header-icon {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #f59e0b, #fbbf24);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.header-icon svg {
    width: 28px;
    height: 28px;
    color: #1a1a2e;
}

.page-title {
    font-size: 1.75rem;
    font-weight: 800;
    color: #f1f5f9;
    margin: 0 0 0.25rem;
}

.page-subtitle {
    color: #64748b;
    font-size: 0.9rem;
    margin: 0;
}

.snapshot-date {
    color: #87ceeb;
}

/* Region Tabs */
.region-tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
}

.region-tab {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.45rem 1.1rem;
    border-radius: 8px;
    border: 1px solid rgba(135, 206, 235, 0.2);
    background: rgba(135, 206, 235, 0.04);
    color: #64748b;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.15s;
}

.region-tab:hover {
    border-color: rgba(135, 206, 235, 0.4);
    color: #94a3b8;
}

.region-tab.active {
    background: rgba(135, 206, 235, 0.12);
    border-color: #87ceeb;
    color: #87ceeb;
}

/* Table */
.ranking-table-wrapper {
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(135, 206, 235, 0.12);
}

.ranking-table {
    width: 100%;
    border-collapse: collapse;
}

.ranking-table thead tr {
    background: rgba(135, 206, 235, 0.08);
}

.ranking-table th {
    padding: 0.75rem 1rem;
    text-align: left;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #64748b;
    border-bottom: 1px solid rgba(135, 206, 235, 0.1);
}

.ranking-row {
    border-bottom: 1px solid rgba(135, 206, 235, 0.06);
    transition: background 0.15s;
}

.ranking-row:hover {
    background: rgba(135, 206, 235, 0.05);
}

.ranking-row:last-child {
    border-bottom: none;
}

.ranking-row.row-podium {
    background: rgba(251, 191, 36, 0.04);
}

.ranking-row.row-qualified {
    border-left: 2px solid rgba(74, 222, 128, 0.3);
}

.ranking-table td {
    padding: 0.65rem 1rem;
    vertical-align: middle;
}

/* Rank column */
.col-rank { width: 60px; }

.rank-cell {
    display: flex;
    align-items: center;
    gap: 0.3rem;
}

.rank-medal {
    font-size: 1.1rem;
}

.rank-number {
    font-size: 0.9rem;
    font-weight: 700;
    color: #475569;
    min-width: 24px;
}

.rank-number.top16 {
    color: #4ade80;
}

/* Team column */
.col-team { width: 200px; }

.team-cell {
    display: flex;
    align-items: center;
    gap: 0.6rem;
}

.team-logo {
    width: 28px;
    height: 28px;
    flex-shrink: 0;
}

.team-logo img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.team-logo-placeholder {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: rgba(135, 206, 235, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.6rem;
    font-weight: 800;
    color: #87ceeb;
    flex-shrink: 0;
}

.team-name {
    font-weight: 700;
    color: #e2e8f0;
    font-size: 0.9rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 160px;
}

/* Roster column */
.col-roster { width: auto; }

.roster-cell {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
}

.player-tag {
    font-size: 0.72rem;
    color: #64748b;
    background: rgba(100, 116, 139, 0.12);
    border-radius: 4px;
    padding: 0.15rem 0.4rem;
    white-space: nowrap;
}

/* Points column */
.col-points { width: 160px; }

.points-cell {
    display: flex;
    align-items: center;
    gap: 0.6rem;
}

.points-bar-wrap {
    flex: 1;
    height: 4px;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 2px;
    overflow: hidden;
}

.points-bar {
    height: 100%;
    border-radius: 2px;
    transition: width 0.4s ease;
}

.bar-gold { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.bar-blue { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
.bar-green { background: linear-gradient(90deg, #10b981, #4ade80); }
.bar-gray { background: rgba(100, 116, 139, 0.4); }

.points-value {
    font-size: 0.85rem;
    font-weight: 700;
    color: #94a3b8;
    min-width: 48px;
    text-align: right;
}

/* Skeleton */
.loading-state {
    display: flex;
    flex-direction: column;
    gap: 2px;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(135, 206, 235, 0.1);
}

.skeleton-row {
    height: 52px;
    background: linear-gradient(90deg,
        rgba(135,206,235,0.03) 25%,
        rgba(135,206,235,0.08) 50%,
        rgba(135,206,235,0.03) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}

/* Empty */
.empty-state {
    text-align: center;
    padding: 5rem 0;
    color: #475569;
}

.empty-icon { font-size: 3rem; margin-bottom: 1rem; }
.empty-sub { font-size: 0.85rem; color: #334155; margin-top: 0.3rem; }

/* Source note */
.source-note {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-top: 1.5rem;
    font-size: 0.78rem;
    color: #475569;
}

.info-icon {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
}

.source-note a {
    color: #87ceeb;
    text-decoration: none;
}

.source-note a:hover { text-decoration: underline; }

/* Responsive */
@media (max-width: 768px) {
    .col-roster { display: none; }
    .team-name { max-width: 120px; }
    .page-title { font-size: 1.4rem; }
}

@media (max-width: 480px) {
    .ranking-table th,
    .ranking-table td {
        padding: 0.5rem 0.6rem;
    }
    .col-points { width: 100px; }
    .points-bar-wrap { display: none; }
}
</style>
