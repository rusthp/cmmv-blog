<template>
    <div class="ranking-page">
        <!-- Game Selector -->
        <div class="game-selector">
            <button
                v-for="g in gameTabs"
                :key="g.value"
                class="game-tab"
                :class="{ active: activeGame === g.value }"
                @click="setGame(g.value)"
            >
                <span class="game-icon">{{ g.icon }}</span>
                <span>{{ g.label }}</span>
            </button>
        </div>

        <!-- Hero Header (CS2 only) -->
        <div v-if="activeGame === 'cs2'" class="ranking-hero">
            <div class="hero-glow"></div>
            <div class="hero-content">
                <div class="hero-badge">
                    <div class="badge-ring">
                        <span class="badge-icon">🏆</span>
                    </div>
                </div>
                <div class="hero-text">
                    <h1 class="hero-title">
                        Ranking Mundial
                        <span class="title-accent">CS2</span>
                    </h1>
                    <p class="hero-subtitle">
                        Standings oficiais da Valve para o próximo Major
                        <span v-if="snapshotDate" class="snapshot-pill">
                            📅
                            {{ formatSnapshotDate(snapshotDate) }}
                        </span>
                    </p>
                </div>
                <div class="hero-stats" v-if="rankings.length > 0" style="display:flex;align-items:center;gap:1rem;margin-left:auto;flex-shrink:0;">
                    <div class="stat-box" style="display:flex;flex-direction:column;align-items:center;gap:0.1rem;">
                        <span class="stat-value" style="font-size:1.35rem;font-weight:800;color:#e2e8f0;line-height:1.2;">{{ rankings.length }}</span>
                        <span class="stat-label" style="font-size:0.68rem;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Times</span>
                    </div>
                    <div class="stat-divider" style="width:1px;height:32px;background:rgba(148,163,184,0.15);flex-shrink:0;"></div>
                    <div class="stat-box" style="display:flex;flex-direction:column;align-items:center;gap:0.1rem;">
                        <span class="stat-value" style="font-size:1.35rem;font-weight:800;color:#e2e8f0;line-height:1.2;">{{ majorSlots }}</span>
                        <span class="stat-label" style="font-size:0.68rem;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Major Slots</span>
                    </div>
                    <div class="stat-divider" style="width:1px;height:32px;background:rgba(148,163,184,0.15);flex-shrink:0;"></div>
                    <div class="stat-box" style="display:flex;flex-direction:column;align-items:center;gap:0.1rem;">
                        <span class="stat-value" style="font-size:1.35rem;font-weight:800;color:#e2e8f0;line-height:1.2;">4</span>
                        <span class="stat-label" style="font-size:0.68rem;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Regiões</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Region Tabs (CS2) -->
        <div v-if="activeGame === 'cs2'" class="region-section">
            <div class="region-tabs" style="display:flex;gap:0.4rem;flex-wrap:wrap;">
                <button
                    v-for="tab in regionTabs"
                    :key="tab.value"
                    class="region-tab"
                    :class="{ active: activeRegion === tab.value }"
                    @click="setRegion(tab.value)"
                    style="position:relative;display:inline-flex;align-items:center;gap:0.4rem;padding:0.55rem 1.15rem;border-radius:10px;border:1px solid rgba(148,163,184,0.1);background:rgba(15,23,42,0.6);color:#64748b;font-weight:600;font-size:0.85rem;cursor:pointer;"
                >
                    <span class="tab-indicator"></span>
                    <span class="tab-emoji" style="font-size:1rem;line-height:1;">{{ tab.flag }}</span>
                    <span class="tab-text">{{ tab.label }}</span>
                </button>
            </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="loading-state">
            <div class="skeleton-header">
                <div class="skeleton-pulse sk-rank"></div>
                <div class="skeleton-pulse sk-team"></div>
                <div class="skeleton-pulse sk-roster"></div>
                <div class="skeleton-pulse sk-points"></div>
            </div>
            <div v-for="n in 14" :key="n" class="skeleton-row" :style="{ animationDelay: `${n * 0.04}s` }">
                <div class="skeleton-pulse sk-rank"></div>
                <div class="skeleton-pulse sk-team"></div>
                <div class="skeleton-pulse sk-roster"></div>
                <div class="skeleton-pulse sk-points"></div>
            </div>
        </div>

        <!-- Empty -->
        <div v-else-if="rankings.length === 0" class="empty-state">
            <div class="empty-visual">
                <div class="empty-ring">
                    <span class="empty-icon">⭐</span>
                </div>
            </div>
            <h3 class="empty-title">Ranking ainda não sincronizado</h3>
            <p class="empty-desc">
                Os dados são obtidos do repositório oficial da Valve e atualizados mensalmente.
            </p>
            <button class="empty-retry" @click="load(activeRegion)">
                🔄 Tentar novamente
            </button>
        </div>

        <!-- Ranking Table -->
        <div v-else class="ranking-container">
            <!-- Major Qualification Line Legend -->
            <div class="legend-bar" style="display:flex;gap:1.5rem;padding:0.75rem 1rem;margin-bottom:0.75rem;border-radius:10px;background:rgba(15,23,42,0.5);border:1px solid rgba(148,163,184,0.06);">
                <div class="legend-item" style="display:flex;align-items:center;gap:0.35rem;font-size:0.75rem;color:#64748b;font-weight:500;">
                    <span class="legend-dot legend-gold" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:linear-gradient(135deg,#fbbf24,#f59e0b);flex-shrink:0;"></span>
                    <span>Pódio</span>
                </div>
                <div class="legend-item" style="display:flex;align-items:center;gap:0.35rem;font-size:0.75rem;color:#64748b;font-weight:500;">
                    <span class="legend-dot legend-qualified" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:linear-gradient(135deg,#4ade80,#22c55e);flex-shrink:0;"></span>
                    <span>Classificado Major</span>
                </div>
                <div class="legend-item" style="display:flex;align-items:center;gap:0.35rem;font-size:0.75rem;color:#64748b;font-weight:500;">
                    <span class="legend-dot legend-contender" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:rgba(100,116,139,0.5);flex-shrink:0;"></span>
                    <span>Contender</span>
                </div>
            </div>

            <div class="table-wrapper">
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
                        <template v-for="(entry, idx) in displayedRankings" :key="entry.id">
                            <tr
                                class="ranking-row"
                                :class="getRowClass(entry.standing)"
                                :style="{ animationDelay: `${idx * 0.02}s` }"
                            >
                                <!-- Rank -->
                                <td class="col-rank">
                                    <div class="rank-cell" style="display:flex;align-items:center;gap:0.25rem;">
                                        <span v-if="entry.standing === 1" class="rank-crown">👑</span>
                                        <span v-else-if="entry.standing === 2" class="rank-medal silver">🥈</span>
                                        <span v-else-if="entry.standing === 3" class="rank-medal bronze">🥉</span>
                                        <span
                                            class="rank-number"
                                            :class="{
                                                'rank-top1': entry.standing === 1,
                                                'rank-top3': entry.standing <= 3,
                                                'rank-top8': entry.standing > 3 && entry.standing <= 8,
                                                'rank-top16': entry.standing > 8 && entry.standing <= majorSlots,
                                            }"
                                        >{{ entry.standing }}</span>
                                    </div>
                                </td>

                                <!-- Team -->
                                <td class="col-team">
                                    <div class="team-cell" style="display:flex;align-items:center;gap:0.65rem;">
                                        <div class="team-avatar" :class="getAvatarClass(entry.standing)" style="width:32px;height:32px;border-radius:8px;background:rgba(100,116,139,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid rgba(148,163,184,0.08);overflow:hidden;">
                                            <img
                                                v-if="getTeamLogoSrc(entry) && !entry.logoError"
                                                :src="getTeamLogoSrc(entry)"
                                                :alt="entry.teamName"
                                                loading="lazy"
                                                @error="entry.logoError = true"
                                            />
                                            <span v-else class="avatar-initials">{{ getInitials(entry.teamName) }}</span>
                                        </div>
                                        <div class="team-info" style="display:flex;align-items:center;gap:0.4rem;min-width:0;">
                                            <span class="team-name" :class="{ 'team-elite': entry.standing <= 3 }" style="display:inline-flex;align-items:center;gap:0.35rem;font-weight:700;font-size:0.88rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px;">
                                                <span v-if="getTeamFlag(entry)" class="team-flag" style="font-size:1rem;line-height:1;flex-shrink:0;">{{ getTeamFlag(entry) }}</span>
                                                {{ entry.teamName }}
                                            </span>
                                            <span v-if="entry.standing <= majorSlots" class="major-badge" style="display:inline-flex;align-items:center;font-size:0.58rem;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;color:#4ade80;background:rgba(74,222,128,0.1);border:1px solid rgba(74,222,128,0.2);padding:0.1rem 0.35rem;border-radius:4px;flex-shrink:0;white-space:nowrap;">
                                                Major
                                            </span>
                                        </div>
                                    </div>
                                </td>

                                <!-- Roster -->
                                <td class="col-roster">
                                    <div class="roster-cell" style="display:flex;flex-wrap:wrap;gap:0.25rem;">
                                        <span
                                            v-for="(player, i) in parsePlayers(entry.roster)"
                                            :key="i"
                                            class="player-chip"
                                            :class="{ 'player-star': i === 0 && entry.standing <= 10 }"
                                            style="display:inline-block;font-size:0.7rem;color:#94a3b8;background:rgba(100,116,139,0.08);border:1px solid rgba(100,116,139,0.08);border-radius:4px;padding:0.12rem 0.4rem;white-space:nowrap;"
                                        >{{ player }}</span>
                                    </div>
                                </td>

                                <!-- Points -->
                                <td class="col-points">
                                    <div class="points-cell" style="display:flex;align-items:center;gap:0.6rem;">
                                        <div class="points-bar-track">
                                            <div
                                                class="points-bar-fill"
                                                :class="getBarClass(entry.standing)"
                                                :style="{ width: getBarWidth(entry.points) + '%' }"
                                            ></div>
                                        </div>
                                        <span class="points-value" :class="{ 'points-elite': entry.standing <= 3 }">
                                            {{ entry.points.toLocaleString('pt-BR') }}
                                        </span>
                                    </div>
                                </td>
                            </tr>

                            <!-- Major Cutoff Line -->
                            <tr v-if="entry.standing === majorSlots && rankings.length > majorSlots" class="major-cutoff-row">
                                <td colspan="4">
                                    <div class="cutoff-line">
                                        <span class="cutoff-label">▲ Classificados para o Major ▲</span>
                                    </div>
                                </td>
                            </tr>
                        </template>
                    </tbody>
                </table>
            </div>

            <!-- Load More Button -->
            <div v-if="displayLimit < rankings.length" class="flex justify-center py-12">
                <button
                    @click="displayLimit += 50"
                    class="flex items-center justify-center px-8 py-3 text-sm font-bold uppercase tracking-wider text-slate-300 transition-all duration-300 bg-slate-800/60 border border-slate-700/60 rounded-full hover:bg-slate-800 hover:text-white hover:border-purple-500/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.2)] hover:-translate-y-1 cursor-pointer"
                >
                    <svg class="w-4 h-4 mr-2 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                    </svg>
                    Ver mais times
                </button>
            </div>
        </div>

        <!-- Source -->
        <div v-if="activeGame === 'cs2'" class="source-footer">
            <span class="source-icon-emoji">ℹ️</span>
            <span>
                Dados oficiais da Valve Software via
                <a href="https://github.com/ValveSoftware/counter-strike_regional_standings" target="_blank" rel="noopener">
                    counter-strike_regional_standings
                </a>
                · Top {{ majorSlots }} se classificam para o Major
            </span>
        </div>

        <!-- ─── VALORANT SECTION ─── -->
        <div v-if="activeGame === 'valorant'" class="game-section">
            <div class="game-section-header">
                <h2 class="game-section-title">VCT Circuit Points</h2>
                <p class="game-section-sub">Pontos acumulados para classificação aos Internationals</p>
            </div>
            <div class="region-section">
                <div class="region-tabs" style="display:flex;gap:0.4rem;flex-wrap:wrap;">
                    <button
                        v-for="tab in vctRegionTabs"
                        :key="tab.value"
                        class="region-tab"
                        :class="{ active: activeVctRegion === tab.value }"
                        @click="setVctRegion(tab.value)"
                        style="position:relative;display:inline-flex;align-items:center;gap:0.4rem;padding:0.55rem 1.15rem;border-radius:10px;border:1px solid rgba(148,163,184,0.1);background:rgba(15,23,42,0.6);color:#64748b;font-weight:600;font-size:0.85rem;cursor:pointer;"
                    >
                        <span>{{ tab.flag }}</span>
                        <span>{{ tab.label }}</span>
                    </button>
                </div>
            </div>

            <div v-if="vctLoading" class="loading-state">
                <div v-for="n in 10" :key="n" class="skeleton-row">
                    <div class="skeleton-pulse sk-rank"></div>
                    <div class="skeleton-pulse sk-team"></div>
                    <div class="skeleton-pulse sk-points"></div>
                </div>
            </div>
            <div v-else-if="vctRankings.length === 0" class="empty-state">
                <div class="empty-visual"><div class="empty-ring"><span class="empty-icon">🎯</span></div></div>
                <h3 class="empty-title">Dados em sincronização</h3>
                <p class="empty-desc">Os circuit points serão carregados em breve.</p>
                <button class="empty-retry" @click="loadVct(activeVctRegion)">🔄 Tentar novamente</button>
            </div>
            <div v-else class="ranking-container">
                <div class="table-wrapper">
                    <table class="ranking-table">
                        <thead>
                            <tr>
                                <th class="col-rank">#</th>
                                <th class="col-team">Time</th>
                                <th class="col-points">Circuit Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="(entry, idx) in vctRankings"
                                :key="entry.id || idx"
                                class="ranking-row"
                                :class="idx < 3 ? (idx === 0 ? 'row-champion' : 'row-podium') : idx < 7 ? 'row-qualified' : ''"
                            >
                                <td class="col-rank">
                                    <div class="rank-cell" style="display:flex;align-items:center;gap:0.25rem;">
                                        <span v-if="entry.standing === 1">👑</span>
                                        <span v-else-if="entry.standing === 2">🥈</span>
                                        <span v-else-if="entry.standing === 3">🥉</span>
                                        <span class="rank-number" :class="{ 'rank-top1': entry.standing === 1, 'rank-top3': entry.standing <= 3, 'rank-top8': entry.standing > 3 && entry.standing <= 7 }">{{ entry.standing }}</span>
                                    </div>
                                </td>
                                <td class="col-team">
                                    <div class="team-cell" style="display:flex;align-items:center;gap:0.65rem;">
                                        <div class="team-avatar" style="width:32px;height:32px;border-radius:8px;background:rgba(100,116,139,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid rgba(148,163,184,0.08);overflow:hidden;">
                                            <img v-if="entry.logoUrl && !entry.logoError" :src="entry.logoUrl" :alt="entry.teamName" loading="lazy" @error="entry.logoError = true" />
                                            <span v-else class="avatar-initials">{{ getInitials(entry.teamName) }}</span>
                                        </div>
                                        <span class="team-name" style="font-weight:700;font-size:0.88rem;color:#e2e8f0;">
                                            <span v-if="entry.teamCode" style="color:#64748b;font-size:0.75rem;margin-right:0.35rem;">{{ entry.teamCode }}</span>
                                            {{ entry.teamName }}
                                        </span>
                                    </div>
                                </td>
                                <td class="col-points">
                                    <div class="points-cell" style="display:flex;align-items:center;gap:0.6rem;">
                                        <div class="points-bar-track" style="flex:1;height:5px;background:rgba(255,255,255,0.04);border-radius:3px;overflow:hidden;">
                                            <div class="points-bar-fill" :class="idx < 3 ? 'bar-gold' : idx < 7 ? 'bar-green' : 'bar-default'" :style="{ width: vctRankings[0]?.points ? Math.round((entry.points / vctRankings[0].points) * 100) + '%' : '0%' }"></div>
                                        </div>
                                        <span class="points-value" :class="{ 'points-elite': entry.standing <= 3 }">{{ entry.points.toLocaleString('pt-BR') }}</span>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="source-footer" style="margin-top:1rem;">
                <span class="source-icon-emoji">ℹ️</span>
                <span>Dados via <a href="https://www.vlr.gg/rankings" target="_blank" rel="noopener">vlr.gg</a> · Top 7 por região classificam para os Internationals</span>
            </div>
        </div>

        <!-- ─── LOL SECTION ─── -->
        <div v-if="activeGame === 'lol'" class="game-section">
            <div class="game-section-header">
                <h2 class="game-section-title">Standings por Liga</h2>
                <p class="game-section-sub">Classificação atual em cada liga regional</p>
            </div>
            <div class="region-section">
                <div class="region-tabs" style="display:flex;gap:0.4rem;flex-wrap:wrap;">
                    <button
                        v-for="tab in lolLeagueTabs"
                        :key="tab.value"
                        class="region-tab"
                        :class="{ active: activeLolLeague === tab.value }"
                        @click="setLolLeague(tab.value)"
                        style="position:relative;display:inline-flex;align-items:center;gap:0.4rem;padding:0.55rem 1.15rem;border-radius:10px;border:1px solid rgba(148,163,184,0.1);background:rgba(15,23,42,0.6);color:#64748b;font-weight:600;font-size:0.85rem;cursor:pointer;"
                    >
                        <span>{{ tab.flag }}</span>
                        <span>{{ tab.label }}</span>
                    </button>
                </div>
            </div>

            <div v-if="lolLoading" class="loading-state">
                <div v-for="n in 10" :key="n" class="skeleton-row">
                    <div class="skeleton-pulse sk-rank"></div>
                    <div class="skeleton-pulse sk-team"></div>
                    <div class="skeleton-pulse sk-points"></div>
                </div>
            </div>
            <div v-else-if="lolRankings.length === 0" class="empty-state">
                <div class="empty-visual"><div class="empty-ring"><span class="empty-icon">⚔️</span></div></div>
                <h3 class="empty-title">Dados em sincronização</h3>
                <p class="empty-desc">Os standings serão carregados em breve.</p>
                <button class="empty-retry" @click="loadLol(activeLolLeague)">🔄 Tentar novamente</button>
            </div>
            <div v-else class="ranking-container">
                <div class="table-wrapper">
                    <table class="ranking-table">
                        <thead>
                            <tr>
                                <th class="col-rank">#</th>
                                <th class="col-team">Time</th>
                                <th style="width:60px;text-align:center;">V</th>
                                <th style="width:60px;text-align:center;">D</th>
                                <th style="width:80px;text-align:center;">% Vitórias</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="(entry, idx) in lolRankings"
                                :key="entry.id || idx"
                                class="ranking-row"
                                :class="idx === 0 ? 'row-champion' : idx < 3 ? 'row-podium' : idx < 6 ? 'row-qualified' : ''"
                            >
                                <td class="col-rank">
                                    <div class="rank-cell" style="display:flex;align-items:center;gap:0.25rem;">
                                        <span v-if="entry.standing === 1">👑</span>
                                        <span v-else-if="entry.standing === 2">🥈</span>
                                        <span v-else-if="entry.standing === 3">🥉</span>
                                        <span class="rank-number" :class="{ 'rank-top1': entry.standing === 1, 'rank-top3': entry.standing <= 3, 'rank-top8': entry.standing > 3 && entry.standing <= 6 }">{{ entry.standing }}</span>
                                    </div>
                                </td>
                                <td class="col-team">
                                    <div class="team-cell" style="display:flex;align-items:center;gap:0.65rem;">
                                        <div class="team-avatar" style="width:32px;height:32px;border-radius:8px;background:rgba(100,116,139,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid rgba(148,163,184,0.08);overflow:hidden;">
                                            <img v-if="entry.logoUrl && !entry.logoError" :src="entry.logoUrl" :alt="entry.teamName" loading="lazy" @error="entry.logoError = true" />
                                            <span v-else class="avatar-initials">{{ getInitials(entry.teamName) }}</span>
                                        </div>
                                        <span class="team-name" style="font-weight:700;font-size:0.88rem;color:#e2e8f0;">
                                            <span v-if="entry.teamCode" style="color:#64748b;font-size:0.75rem;margin-right:0.35rem;">{{ entry.teamCode }}</span>
                                            {{ entry.teamName }}
                                        </span>
                                    </div>
                                </td>
                                <td style="text-align:center;font-weight:700;color:#68d391;font-size:0.9rem;">{{ entry.wins }}</td>
                                <td style="text-align:center;font-weight:700;color:#fc8181;font-size:0.9rem;">{{ entry.losses }}</td>
                                <td style="text-align:center;">
                                    <span style="font-size:0.82rem;color:#94a3b8;font-weight:600;">
                                        {{ entry.wins + entry.losses > 0 ? Math.round((entry.wins / (entry.wins + entry.losses)) * 100) : 0 }}%
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="source-footer" style="margin-top:1rem;">
                <span class="source-icon-emoji">ℹ️</span>
                <span>Dados via <a href="https://lolesports.com" target="_blank" rel="noopener">LoL Esports API</a></span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onServerPrefetch } from 'vue';
import { useHead } from '@unhead/vue';

const isSSR = import.meta.env.SSR;
const apiBase = isSSR
    ? (import.meta.env.VITE_API_URL || 'http://localhost:5000')
    : '';

// ─── Game tabs ────────────────────────────────────────────
const gameTabs = [
    { label: 'CS2', value: 'cs2', icon: '🔫' },
    { label: 'Valorant', value: 'valorant', icon: '🎯' },
    { label: 'League of Legends', value: 'lol', icon: '⚔️' },
];
const activeGame = ref('cs2');

const gameTitle = computed(() => {
    if (activeGame.value === 'valorant') return 'Ranking Valorant — ProPlay News';
    if (activeGame.value === 'lol') return 'Ranking League of Legends — ProPlay News';
    return 'Ranking Mundial CS2 — ProPlay News';
});
useHead({ title: gameTitle });

// ─── CS2 ──────────────────────────────────────────────────
const regionTabs = [
    { label: 'Global', value: 'global', flag: '🌍' },
    { label: 'Américas', value: 'americas', flag: '🌎' },
    { label: 'Europa', value: 'europe', flag: '🌍' },
    { label: 'Ásia', value: 'asia', flag: '🌏' },
];

const activeRegion = ref('global');
const rankings = ref<any[]>([]);
const displayLimit = ref(50);
const snapshotDate = ref('');
const loading = ref(!import.meta.env.SSR);

// ─── Valorant ─────────────────────────────────────────────
const vctRegionTabs = [
    { label: 'Américas', value: 'americas', flag: '🌎' },
    { label: 'EMEA', value: 'emea', flag: '🌍' },
    { label: 'Pacific', value: 'pacific', flag: '🌏' },
    { label: 'China', value: 'china', flag: '🇨🇳' },
];
const activeVctRegion = ref('americas');
const vctRankings = ref<any[]>([]);
const vctLoading = ref(false);

// ─── LoL ──────────────────────────────────────────────────
const lolLeagueTabs = [
    { label: 'LCK', value: 'lck', flag: '🇰🇷' },
    { label: 'LEC', value: 'lec', flag: '🇪🇺' },
    { label: 'LCS', value: 'lcs', flag: '🇺🇸' },
    { label: 'LPL', value: 'lpl', flag: '🇨🇳' },
    { label: 'CBLOL', value: 'cblol-brazil', flag: '🇧🇷' },
    { label: 'LCP', value: 'lcp', flag: '🌏' },
];
const activeLolLeague = ref('lck');
const lolRankings = ref<any[]>([]);
const lolLoading = ref(false);

const majorSlots = computed(() => {
    switch (activeRegion.value) {
        case 'europe': return 14;
        case 'americas': return 7;
        case 'asia': return 3;
        case 'global': return 24;
        default: return 16;
    }
});

const maxPoints = computed(() =>
    rankings.value.length > 0 ? rankings.value[0].points : 1
);

const displayedRankings = computed(() => {
    const seen = new Set<string>();
    return rankings.value
        .filter(entry => {
            const key = `${entry.standing}-${entry.teamName}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .slice(0, displayLimit.value);
});

async function load(region: string) {
    loading.value = true;
    displayLimit.value = 50;
    try {
        // In SSR: use absolute URL to backend API (no /api prefix — goes direct)
        // In client: use relative URL with /api prefix (Vite proxy strips it)
        const url = isSSR
            ? `${apiBase}/esports/rankings?region=${region}&limit=200`
            : `/api/esports/rankings?region=${region}&limit=200`;

        const res = await fetch(url);
        const json = await res.json();
        const result = json.result || json;
        rankings.value = result.data || json.data || [];
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

function setGame(game: string) {
    activeGame.value = game;
    if (game === 'cs2' && rankings.value.length === 0) load(activeRegion.value);
    if (game === 'valorant' && vctRankings.value.length === 0) loadVct(activeVctRegion.value);
    if (game === 'lol' && lolRankings.value.length === 0) loadLol(activeLolLeague.value);
}

function setVctRegion(region: string) {
    activeVctRegion.value = region;
    loadVct(region);
}

function setLolLeague(league: string) {
    activeLolLeague.value = league;
    loadLol(league);
}

async function loadVct(region: string) {
    vctLoading.value = true;
    try {
        const url = isSSR
            ? `${apiBase}/esports/rankings/valorant?region=${region}&limit=30`
            : `/api/esports/rankings/valorant?region=${region}&limit=30`;
        const res = await fetch(url);
        const json = await res.json();
        const result = json.result || json;
        vctRankings.value = result.data || [];
    } catch {
        vctRankings.value = [];
    } finally {
        vctLoading.value = false;
    }
}

async function loadLol(league: string) {
    lolLoading.value = true;
    try {
        const url = isSSR
            ? `${apiBase}/esports/rankings/lol?league=${league}&limit=20`
            : `/api/esports/rankings/lol?league=${league}&limit=20`;
        const res = await fetch(url);
        const json = await res.json();
        const result = json.result || json;
        lolRankings.value = result.data || [];
    } catch {
        lolRankings.value = [];
    } finally {
        lolLoading.value = false;
    }
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
    if (standing <= 8) return 'bar-cyan';
    if (standing <= majorSlots.value) return 'bar-green';
    return 'bar-default';
}

function getRowClass(standing: number): string {
    if (standing === 1) return 'row-champion';
    if (standing <= 3) return 'row-podium';
    if (standing <= majorSlots.value) return 'row-qualified';
    return '';
}

function getAvatarClass(standing: number): string {
    if (standing === 1) return 'avatar-champion';
    if (standing <= 3) return 'avatar-podium';
    if (standing <= 8) return 'avatar-elite';
    if (standing <= majorSlots.value) return 'avatar-qualified';
    return '';
}

function getInitials(name: string): string {
    if (!name) return '??';
    const words = name.split(/[\s.-]+/).filter(Boolean);
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
}

// Player nationality mapping — used to determine team nationality from roster
const PLAYER_COUNTRY: Record<string, string> = {
    'fer': 'BR', 'fnx': 'BR', 'taco': 'BR', 'drop': 'BR', 'trk': 'BR',
    'heat': 'BR', 'qck': 'BR', 'nython': 'BR', 'bzka': 'BR', 'lukxo': 'BR',
    'dtxz': 'BR', 'spike': 'BR', 'khalil': 'BR', 'raafa': 'BR', 'jzz': 'BR',
    'pilot': 'BR', 'murizzum': 'BR', 'n3k4y': 'BR', 'v$': 'BR', 'hardzao': 'BR',
    'zevy': 'BR', 'mazin': 'BR', 'chelo': 'BR', 'crisby': 'BR', 'tuyz': 'BR',
    'mwzera': 'BR', 'nbl': 'BR', 'shz': 'BR', 'dgzin': 'BR', 'fastdrawn': 'BR',
    'pax': 'BR', 'nqz': 'BR', 'raizen': 'BR', 'dav1de': 'BR', 'hnt': 'BR',
    // Denmark
    'device': 'DK', 'magisk': 'DK', 'blamef': 'DK', 'karrigan': 'DK',
    'br0': 'DK', 'jabbi': 'DK', 'stavn': 'DK', 'nicoodoz': 'DK', 'sjuush': 'DK',
    'farlig': 'DK', 'roej': 'DK', 'b1n0': 'DK', 'kyxsan': 'DK',
    // France
    'apoka': 'FR', 'shox': 'FR', 'kioresh': 'FR', 'xms': 'FR', 'bodyy': 'FR',
    'z3hr': 'FR', 'misutaaa': 'FR', 'r3salt': 'FR', 's1ren': 'FR', 'mezii': 'FR',
    'flameZ': 'FR', 'afro': 'FR', 'vsm': 'FR', 'blix': 'FR', 'xertioN': 'FR',
    'dumau': 'FR', 'penn': 'FR', 'nK': 'FR', 'hAdji': 'FR', 'woro2k': 'FR',
    'to1nou': 'FR', 'tex': 'FR', 'sixer': 'FR', 'eksem': 'FR', 's1N': 'FR',
    // Germany
    'syrsoN': 'DE', 'krimbo': 'DE', 'tiziaN': 'DE', 'prosus': 'DE', 'cmzn': 'DE',
    'reecky': 'DE', 'deq': 'DE', 'blowzy': 'DE', 'tabseN': 'DE', 'isak': 'DE',
    // United Kingdom
    'harry': 'GB', 'imoRR': 'GB', 'hades': 'GB',
    // Poland
    'furlan': 'PL', 'mwlky': 'PL', 'innocent': 'PL', 'siuhy': 'PL',
    'karol': 'PL', 'mynio': 'PL', 'michu': 'PL', 'kapsien': 'PL',
    'phr': 'PL', 'zedo': 'PL', 'reiko': 'PL', 'dycha': 'PL',
    'keiko': 'PL', 'nawrot': 'PL', 'gryzhyn': 'PL', 'davuuf': 'PL',
    // Sweden
    'friberg': 'SE', 'twist': 'SE', 'leX': 'SE', 's3pt3ri0n': 'SE', 'phzy': 'SE',
    'nicoo': 'SE', 'plopski': 'SE', 'headtr1ck': 'SE', 'zet': 'SE',
    'peppzor': 'SE', 'f1n': 'SE', 'n3z': 'SE',
    // Russia
    'sh1ro': 'RU', 'ax1Le': 'RU', 'perfecto': 'RU', 'electroNic': 'RU', 'nafany': 'RU',
    'interz': 'RU', 'fame': 'RU', 'flamus': 'RU', 'jame': 'RU', 'buster': 'RU',
    'qikert': 'RU', 'zorte': 'RU', 'norwi': 'RU', 'forester': 'RU', 'zont1x': 'RU',
    'rmn': 'RU', 's1leNt': 'RU', 'chopper': 'RU', 's0me': 'RU', 'notineki': 'RU',
    // Ukraine
    'b1t': 'UA', 'npl': 'UA', 'demho': 'UA', 'w0nderful': 'UA', 'ducha': 'UA',
    'kapacho': 'UA', 'anarkez': 'UA', 'kade0': 'UA', 'krizzeN': 'UA', 'kvik': 'UA',
    '777': 'UA', 'bondik': 'UA', 'kory': 'UA', 'kizZz': 'UA', 'shadiy': 'UA',
    'sp3ktre': 'UA', 'magixx': 'UA', // Belarus
    'prophecy': 'BY', 'g3nism': 'BY', 'v4lk': 'BY', // Kazakhstan
    'aff1N1ty': 'KZ', 'seized': 'KZ', // Serbia
    'hugo': 'RS', 'LETN1': 'RS', 's1NNer': 'RS', 'torres': 'RS', 'd0c': 'RS',
    'k1ll': 'RS', // Czech
    'nbK': 'CZ', 'forsyy': 'CZ', 'beastik': 'CZ', 'daduke': 'CZ',
    'lack1': 'CZ', // Finland
    'allu': 'FI', 'sergej': 'FI', 'suNny': 'FI', 'zehN': 'FI', 'k1to': 'FI',
    // Austria
    'zero': 'AT', 'cromen': 'AT', 'starxo': 'AT', // Netherlands
    'denis': 'NL', 'devoduveka': 'NL', 'vexite': 'NL', 'jayzhard': 'NL',
    // Belgium
    'exeter': 'BE', // Norway
    'jkaem': 'NO', 'k0nfig': 'NO', 'rain': 'NO', 'torben': 'NO',
    // Latvia
    'snatchie': 'LV', // Lithuania
    'nuko': 'LT', 'nukkye': 'LT', // Portugal
    'forjj': 'PT', 'suspicious': 'PT', 'zeek': 'PT', 's1nnfer': 'PT',
    'exp': 'PT', 'sicko': 'PT', 'cortez': 'PT', // Spain
    'alex': 'ES', 'mixwell': 'ES', 'koldamenta': 'ES', 'sheyo': 'ES', 'barbarr': 'ES',
    // Turkey
    'woxic': 'TR', 'calm': 'TR', 'ruxic': 'TR', // Estonia
    // Australia
    'liazz': 'AU', 'hazrd': 'AU', 'sico': 'AU', 'aliStair': 'AU',
    'pan': 'AU', 'dexter': 'AU', 'gratisfaction': 'AU', 'insight': 'AU',
    // New Zealand
    'dexter': 'NZ', // USA
    'stanislaw': 'US', 'shahZaM': 'US', 'autimatic': 'US', 'reltuC': 'US',
    'Brehze': 'US', 'oSee': 'US', 'viz': 'US', 'crashies': 'US',
    'Foxy': 'US', 'leaf': 'US', 'daps': 'US', 'marved': 'US',
    // Canada
    'nafoo': 'CA', 'EZ': 'CA', 'FASHR': 'CA', // Argentina
    'dgt': 'AR', 'malbs': 'AR', 'bravinn': 'AR', 'jks': 'AR', 'rigo': 'AR', 'n1k3n': 'AR',
    // Chile
    'kiNgg': 'CL', // Colombia
    'krii': 'CO', // Mongolia
    'bLaz1ng': 'MN', 'techno4k': 'MN', '910': 'MN', 'adik': 'MN', 'sk0R': 'MN',
    'shine': 'MN', 'bodya': 'MN', 'pure': 'MN', // Japan
    'Meiy': 'JP', 'StyuN': 'JP', 'Astar': 'JP', // China
    'advent': 'CN', 'qzr': 'CN', 'somebody': 'CN', 'danking': 'CN', 'summer': 'CN',
    'kaze': 'CN', 'tb': 'CN', 'mercury': 'CN', 'z4kr': 'CN',
    // Slovakia
    'oskar': 'SK', // Israel
    'r1cky': 'IL', // Georgia
    'hooch': 'GE', // Romania
    'h1gg3r': 'RO', // Israel
    // Australia
    'insight': 'AU',
};

function detectTeamNationalityFromRoster(roster: string): string | null {
    if (!roster) return null;
    const players = roster.split(',').map(p => p.trim()).filter(Boolean);
    const countryCounts: Record<string, number> = {};
    for (const player of players) {
        const code = PLAYER_COUNTRY[player];
        if (code) countryCounts[code] = (countryCounts[code] || 0) + 1;
    }
    let bestCode: string | null = null;
    let bestCount = 0;
    for (const [code, count] of Object.entries(countryCounts)) {
        if (count >= 3 && count > bestCount) {
            bestCode = code;
            bestCount = count;
        }
    }
    return bestCode;
}

const KNOWN_LOGOS: Record<string, string> = {
    'vitality': 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Team_Vitality_logo.svg',
    'furia': 'https://upload.wikimedia.org/wikipedia/pt/4/4b/Furia_Esports_logo.png',
    'mouz': 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Mouz_logo.svg',
    'natus vincere': 'https://upload.wikimedia.org/wikipedia/en/a/a3/Natus_Vincere_logo.svg',
    'navi': 'https://upload.wikimedia.org/wikipedia/en/a/a3/Natus_Vincere_logo.svg',
    'faze': 'https://upload.wikimedia.org/wikipedia/commons/9/90/FaZe_Clan_logo.svg',
    'faze clan': 'https://upload.wikimedia.org/wikipedia/commons/9/90/FaZe_Clan_logo.svg',
    'spirit': 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Team_Spirit_logo.svg',
    'team spirit': 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Team_Spirit_logo.svg',
    'g2': 'https://upload.wikimedia.org/wikipedia/en/3/3c/G2_Esports_logo.svg',
    'liquid': 'https://upload.wikimedia.org/wikipedia/en/f/f1/Team_Liquid_logo.svg',
    'team liquid': 'https://upload.wikimedia.org/wikipedia/en/f/f1/Team_Liquid_logo.svg',
    'astralis': 'https://upload.wikimedia.org/wikipedia/en/3/33/Astralis_logo.svg',
    'heroic': 'https://upload.wikimedia.org/wikipedia/commons/1/12/Heroic_logo.svg',
    'virtus.pro': 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Virtus.pro_logo.svg',
    'the mongolz': 'https://upload.wikimedia.org/wikipedia/commons/8/87/The_Mongolz_logo.png',
    'complexity': 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Complexity_Gaming_logo.svg',
    'nip': 'https://upload.wikimedia.org/wikipedia/en/6/60/Ninjas_in_Pyjamas_logo.svg',
    'ninjas in pyjamas': 'https://upload.wikimedia.org/wikipedia/en/6/60/Ninjas_in_Pyjamas_logo.svg',
    'fnatic': 'https://upload.wikimedia.org/wikipedia/en/4/43/Fnatic_logo.svg',
    'cloud9': 'https://upload.wikimedia.org/wikipedia/commons/f/f7/Cloud9_logo.svg',
    'big': 'https://upload.wikimedia.org/wikipedia/commons/8/87/BIG_logo.svg',
    'ence': 'https://upload.wikimedia.org/wikipedia/en/1/1e/ENCE_logo.svg',
    'imperial': 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Imperial_Esports_logo.svg',
    'mibr': 'https://upload.wikimedia.org/wikipedia/en/2/2b/Made_in_Brazil_logo.svg',
    'pain': 'https://upload.wikimedia.org/wikipedia/en/3/3f/PaiN_Gaming_logo.svg',
    'gamerlegion': 'https://upload.wikimedia.org/wikipedia/commons/8/8a/GamerLegion_logo.svg',
    'parivision': 'https://upload.wikimedia.org/wikipedia/commons/a/af/PARIVISION_Logo.png'
};

function getTeamLogo(teamName: string): string {
    if (!teamName) return '';
    const key = teamName.toLowerCase().trim();
    return KNOWN_LOGOS[key] || '';
}

function getTeamLogoSrc(entry: any): string {
    const known = getTeamLogo(entry.teamName);
    if (known) return known;
    // Only use logoUrl if it's an absolute URL (http/https) — ignore relative paths that 404
    const url = entry.logoUrl || '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return '';
}

function formatSnapshotDate(date: string): string {
    const parts = date.split('_');
    if (parts.length !== 3) return date;
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthIdx = parseInt(parts[1]) - 1;
    return `${parts[2]} ${months[monthIdx] || parts[1]} ${parts[0]}`;
}

// Country code to flag emoji using Unicode regional indicators
function countryCodeToFlag(countryCode: string): string {
    if (!countryCode || countryCode.length !== 2) return '';
    const base = 127397; // 0x1F1E6 - 'A' offset
    const codePoints = [...countryCode.toUpperCase()].map(c =>
        String.fromCodePoint(base + c.charCodeAt(0))
    );
    return codePoints.join('');
}

// Parse team country — first from detailsSlug (backend-set), fallback to roster detection
function getTeamCountryCode(entry: any): string | null {
    // Try detailsSlug prefix first (format: "CC/slug" set by backend)
    const slug = entry.detailsSlug || '';
    const slugMatch = slug.match(/^([A-Z]{2})(?:\/.*)?$/i);
    if (slugMatch) return slugMatch[1];
    // Fallback: detect from roster
    return detectTeamNationalityFromRoster(entry.roster);
}

function getTeamFlag(entry: any): string {
    const code = getTeamCountryCode(entry);
    return code ? countryCodeToFlag(code) : '';
}

// SSR: pre-fetch ranking data on server so HTML includes the table
onServerPrefetch(async () => {
    await load('global');
});

// Client: also load data on mount (for hydration and region switching)
onMounted(() => {
    if (rankings.value.length === 0) {
        load('global');
    } else {
        loading.value = false;
    }
});
</script>

<style scoped>
/* ─── Base ─────────────────────────────────────────── */
.ranking-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem 3rem;
}

/* ─── Game Selector ────────────────────────────────── */
.game-selector {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
}

.game-tab {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1.25rem;
    border-radius: 10px;
    border: 1px solid rgba(148,163,184,0.12);
    background: rgba(15,23,42,0.5);
    color: #64748b;
    font-weight: 700;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
}
.game-tab:hover { color: #94a3b8; border-color: rgba(139,92,246,0.3); }
.game-tab.active {
    background: rgba(139,92,246,0.1);
    border-color: rgba(139,92,246,0.45);
    color: #c4b5fd;
}
.game-icon { font-size: 1rem; }

/* ─── Game Section ─────────────────────────────────── */
.game-section { }
.game-section-header { margin-bottom: 1.25rem; }
.game-section-title { font-size: 1.5rem; font-weight: 800; color: #f1f5f9; margin: 0 0 0.3rem; }
.game-section-sub { font-size: 0.875rem; color: #64748b; margin: 0; }

/* ─── Hero Header ──────────────────────────────────── */
.ranking-hero {
    position: relative;
    padding: 2.5rem 2rem 2rem;
    margin-bottom: 1.5rem;
    border-radius: 16px;
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 27, 75, 0.9) 50%, rgba(15, 23, 42, 0.95) 100%);
    border: 1px solid rgba(139, 92, 246, 0.2);
    overflow: hidden;
}

.hero-glow {
    position: absolute;
    top: -60%;
    left: 50%;
    transform: translateX(-50%);
    width: 500px;
    height: 300px;
    background: radial-gradient(ellipse, rgba(139, 92, 246, 0.15) 0%, transparent 70%);
    pointer-events: none;
}

.hero-content {
    position: relative;
    display: flex;
    align-items: center;
    gap: 1.25rem;
    flex-wrap: wrap;
    justify-content: space-between;
}

.hero-badge {
    flex-shrink: 0;
}

.badge-ring {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 165, 0, 0.08));
    border: 1px solid rgba(255, 215, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: badge-pulse 3s ease-in-out infinite;
    overflow: hidden;
}

.badge-icon {
    font-size: 28px;
    line-height: 1;
}

@keyframes badge-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); }
    50% { box-shadow: 0 0 20px 4px rgba(255, 215, 0, 0.15); }
}

.hero-text {
    flex: 1;
    min-width: 200px;
}

.hero-title {
    font-size: 1.85rem;
    font-weight: 900;
    color: #f1f5f9;
    margin: 0 0 0.35rem;
    letter-spacing: -0.02em;
    line-height: 1.2;
}

.title-accent {
    background: linear-gradient(90deg, #8b5cf6, #a78bfa, #c4b5fd);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.hero-subtitle {
    color: #94a3b8;
    font-size: 0.88rem;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
}

.snapshot-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    background: rgba(139, 92, 246, 0.12);
    border: 1px solid rgba(139, 92, 246, 0.25);
    color: #c4b5fd;
    padding: 0.2rem 0.6rem;
    border-radius: 100px;
    font-size: 0.78rem;
    font-weight: 600;
}

.icon-calendar {
    width: 12px;
    height: 12px;
    opacity: 0.7;
}

.hero-stats {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-left: auto;
}

.stat-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.1rem;
}

.stat-value {
    font-size: 1.35rem;
    font-weight: 800;
    color: #e2e8f0;
}

.stat-label {
    font-size: 0.68rem;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
}

.stat-divider {
    width: 1px;
    height: 32px;
    background: rgba(148, 163, 184, 0.15);
}

/* ─── Region Tabs ──────────────────────────────────── */
.region-section {
    margin-bottom: 1.25rem;
}

.region-tabs {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
}

.region-tab {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.55rem 1.15rem;
    border-radius: 10px;
    border: 1px solid rgba(148, 163, 184, 0.1);
    background: rgba(15, 23, 42, 0.6);
    color: #64748b;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s ease;
    overflow: hidden;
}

.tab-indicator {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 2px;
    background: linear-gradient(90deg, #8b5cf6, #a78bfa);
    border-radius: 2px;
    transition: width 0.25s ease;
}

.region-tab:hover {
    border-color: rgba(139, 92, 246, 0.3);
    color: #94a3b8;
    background: rgba(139, 92, 246, 0.05);
}

.region-tab.active {
    background: rgba(139, 92, 246, 0.08);
    border-color: rgba(139, 92, 246, 0.4);
    color: #c4b5fd;
}

.region-tab.active .tab-indicator {
    width: 60%;
}

.tab-emoji {
    font-size: 1rem;
    line-height: 1;
}

/* ─── Legend Bar ───────────────────────────────────── */
.legend-bar {
    display: flex;
    gap: 1.5rem;
    padding: 0.75rem 1rem;
    margin-bottom: 0.75rem;
    border-radius: 10px;
    background: rgba(15, 23, 42, 0.5);
    border: 1px solid rgba(148, 163, 184, 0.06);
}

.legend-item {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.75rem;
    color: #64748b;
    font-weight: 500;
}

.legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
}

.legend-gold {
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    box-shadow: 0 0 6px rgba(251, 191, 36, 0.4);
}

.legend-qualified {
    background: linear-gradient(135deg, #4ade80, #22c55e);
    box-shadow: 0 0 6px rgba(74, 222, 128, 0.4);
}

.legend-contender {
    background: rgba(100, 116, 139, 0.5);
}

/* ─── Table ────────────────────────────────────────── */
.ranking-container {
    animation: fadeInUp 0.4s ease;
}

.table-wrapper {
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid rgba(148, 163, 184, 0.08);
    background: rgba(15, 23, 42, 0.4);
}

.ranking-table {
    width: 100%;
    border-collapse: collapse;
}

.ranking-table thead tr {
    background: linear-gradient(180deg, rgba(139, 92, 246, 0.06) 0%, rgba(15, 23, 42, 0.3) 100%);
}

.ranking-table th {
    padding: 0.8rem 1rem;
    text-align: left;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #64748b;
    border-bottom: 1px solid rgba(148, 163, 184, 0.08);
}

/* ─── Rows ─────────────────────────────────────────── */
.ranking-row {
    border-bottom: 1px solid rgba(148, 163, 184, 0.04);
    transition: all 0.15s ease;
    animation: rowSlideIn 0.3s ease both;
}

.ranking-row:hover {
    background: rgba(139, 92, 246, 0.04);
}

.ranking-row.row-champion {
    background: linear-gradient(90deg, rgba(255, 215, 0, 0.06) 0%, rgba(255, 215, 0, 0.02) 60%, transparent 100%);
    border-left: 3px solid #fbbf24;
}

.ranking-row.row-champion:hover {
    background: linear-gradient(90deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.03) 60%, transparent 100%);
}

.ranking-row.row-podium {
    background: linear-gradient(90deg, rgba(251, 191, 36, 0.04) 0%, transparent 60%);
    border-left: 3px solid rgba(251, 191, 36, 0.5);
}

.ranking-row.row-qualified {
    border-left: 3px solid rgba(74, 222, 128, 0.25);
}

.ranking-row:last-child {
    border-bottom: none;
}

.ranking-table td {
    padding: 0.6rem 1rem;
    vertical-align: middle;
}

/* ─── Rank Column ──────────────────────────────────── */
.col-rank { width: 65px; }

.rank-cell {
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.rank-crown {
    font-size: 1.2rem;
    animation: crownFloat 2s ease-in-out infinite;
}

@keyframes crownFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-2px); }
}

.rank-medal {
    font-size: 1rem;
}

.rank-number {
    font-size: 0.9rem;
    font-weight: 800;
    color: #475569;
    min-width: 24px;
    font-variant-numeric: tabular-nums;
}

.rank-number.rank-top1 {
    color: #fbbf24;
    font-size: 1.1rem;
    text-shadow: 0 0 12px rgba(251, 191, 36, 0.3);
}

.rank-number.rank-top3 { color: #fbbf24; }
.rank-number.rank-top8 { color: #38bdf8; }
.rank-number.rank-top16 { color: #4ade80; }

/* ─── Team Column ──────────────────────────────────── */
.col-team { width: 220px; }

.team-cell {
    display: flex;
    align-items: center;
    gap: 0.65rem;
}

.team-avatar {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(100, 116, 139, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: 1px solid rgba(148, 163, 184, 0.08);
    transition: all 0.2s ease;
    overflow: hidden;
}

.team-avatar img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.avatar-initials {
    font-size: 0.6rem;
    font-weight: 800;
    color: #64748b;
    letter-spacing: -0.03em;
}

.avatar-champion {
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 165, 0, 0.08));
    border-color: rgba(255, 215, 0, 0.3);
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.1);
}

.avatar-champion .avatar-initials { color: #fbbf24; }

.avatar-podium {
    background: linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(251, 191, 36, 0.04));
    border-color: rgba(251, 191, 36, 0.2);
}

.avatar-podium .avatar-initials { color: #fbbf24; }

.avatar-elite {
    background: linear-gradient(135deg, rgba(56, 189, 248, 0.08), rgba(56, 189, 248, 0.03));
    border-color: rgba(56, 189, 248, 0.15);
}

.avatar-elite .avatar-initials { color: #38bdf8; }

.avatar-qualified {
    background: linear-gradient(135deg, rgba(74, 222, 128, 0.08), rgba(74, 222, 128, 0.03));
    border-color: rgba(74, 222, 128, 0.12);
}

.avatar-qualified .avatar-initials { color: #4ade80; }

.team-info {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    min-width: 0;
}

.team-name {
    font-weight: 700;
    color: #e2e8f0;
    font-size: 0.88rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
}

.team-flag {
    font-size: 1rem;
    line-height: 1;
    flex-shrink: 0;
    filter: drop-shadow(0 0 2px rgba(255,255,255,0.15));
}

.team-name.team-elite {
    color: #fbbf24;
}

.major-badge {
    font-size: 0.58rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #4ade80;
    background: rgba(74, 222, 128, 0.1);
    border: 1px solid rgba(74, 222, 128, 0.2);
    padding: 0.1rem 0.35rem;
    border-radius: 4px;
    flex-shrink: 0;
}

/* ─── Roster Column ────────────────────────────────── */
.col-roster { width: auto; }

.roster-cell {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
}

.player-chip {
    font-size: 0.7rem;
    color: #94a3b8;
    background: rgba(100, 116, 139, 0.08);
    border: 1px solid rgba(100, 116, 139, 0.08);
    border-radius: 4px;
    padding: 0.12rem 0.4rem;
    white-space: nowrap;
    transition: all 0.15s ease;
}

.player-chip:hover {
    background: rgba(139, 92, 246, 0.08);
    border-color: rgba(139, 92, 246, 0.15);
    color: #c4b5fd;
}

.player-chip.player-star {
    color: #fbbf24;
    background: rgba(251, 191, 36, 0.06);
    border-color: rgba(251, 191, 36, 0.12);
}

/* ─── Points Column ────────────────────────────────── */
.col-points { width: 170px; }

.points-cell {
    display: flex;
    align-items: center;
    gap: 0.6rem;
}

.points-bar-track {
    flex: 1;
    height: 5px;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 3px;
    overflow: hidden;
}

.points-bar-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

.bar-gold {
    background: linear-gradient(90deg, #f59e0b, #fbbf24);
    box-shadow: 0 0 8px rgba(251, 191, 36, 0.3);
}

.bar-cyan {
    background: linear-gradient(90deg, #0ea5e9, #38bdf8);
    box-shadow: 0 0 6px rgba(56, 189, 248, 0.2);
}

.bar-green {
    background: linear-gradient(90deg, #10b981, #4ade80);
}

.bar-default {
    background: rgba(100, 116, 139, 0.3);
}

.points-value {
    font-size: 0.82rem;
    font-weight: 700;
    color: #94a3b8;
    min-width: 44px;
    text-align: right;
    font-variant-numeric: tabular-nums;
}

.points-value.points-elite {
    color: #fbbf24;
    text-shadow: 0 0 8px rgba(251, 191, 36, 0.15);
}

/* ─── Major Cutoff ─────────────────────────────────── */
.major-cutoff-row td {
    padding: 0 !important;
}

.cutoff-line {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 0;
    position: relative;
}

.cutoff-line::before,
.cutoff-line::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(74, 222, 128, 0.3), transparent);
}

.cutoff-label {
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: rgba(74, 222, 128, 0.5);
    padding: 0 1rem;
    white-space: nowrap;
}

/* ─── Loading ──────────────────────────────────────── */
.loading-state {
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid rgba(148, 163, 184, 0.06);
    background: rgba(15, 23, 42, 0.4);
}

.skeleton-header {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    border-bottom: 1px solid rgba(148, 163, 184, 0.06);
}

.skeleton-row {
    display: flex;
    gap: 1rem;
    padding: 0.8rem 1rem;
    border-bottom: 1px solid rgba(148, 163, 184, 0.03);
    animation: fadeIn 0.3s ease both;
}

.skeleton-pulse {
    border-radius: 6px;
    background: linear-gradient(90deg,
        rgba(139, 92, 246, 0.04) 25%,
        rgba(139, 92, 246, 0.08) 50%,
        rgba(139, 92, 246, 0.04) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.8s infinite;
}

.sk-rank { width: 40px; height: 20px; }
.sk-team { width: 180px; height: 20px; }
.sk-roster { flex: 1; height: 20px; }
.sk-points { width: 120px; height: 20px; }

@keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}

/* ─── Empty ────────────────────────────────────────── */
.empty-state {
    text-align: center;
    padding: 5rem 2rem;
    border-radius: 14px;
    background: rgba(15, 23, 42, 0.4);
    border: 1px solid rgba(148, 163, 184, 0.06);
}

.empty-visual {
    margin-bottom: 1.5rem;
}

.empty-ring {
    width: 72px;
    height: 72px;
    margin: 0 auto;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.03));
    border: 1px solid rgba(139, 92, 246, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: emptyPulse 3s ease-in-out infinite;
    overflow: hidden;
}

.empty-icon {
    font-size: 32px;
    line-height: 1;
    opacity: 0.6;
}

@keyframes emptyPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); }
    50% { box-shadow: 0 0 30px 8px rgba(139, 92, 246, 0.08); }
}

.empty-title {
    font-size: 1.15rem;
    font-weight: 700;
    color: #94a3b8;
    margin: 0 0 0.5rem;
}

.empty-desc {
    font-size: 0.85rem;
    color: #475569;
    margin: 0 0 1.5rem;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
}

.empty-retry {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.6rem 1.5rem;
    border-radius: 10px;
    border: 1px solid rgba(139, 92, 246, 0.3);
    background: rgba(139, 92, 246, 0.08);
    color: #c4b5fd;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s ease;
}

.empty-retry:hover {
    background: rgba(139, 92, 246, 0.15);
    border-color: rgba(139, 92, 246, 0.5);
    box-shadow: 0 0 20px rgba(139, 92, 246, 0.1);
}

.retry-icon {
    width: 16px;
    height: 16px;
}

/* ─── Source Footer ────────────────────────────────── */
.source-footer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 1.5rem;
    padding: 0.85rem 1rem;
    border-radius: 10px;
    background: rgba(15, 23, 42, 0.3);
    border: 1px solid rgba(148, 163, 184, 0.05);
    font-size: 0.76rem;
    color: #475569;
}

.source-icon-emoji {
    font-size: 14px;
    flex-shrink: 0;
    opacity: 0.7;
}

.source-footer a {
    color: #8b5cf6;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.15s;
}

.source-footer a:hover {
    color: #a78bfa;
    text-decoration: underline;
}

/* ─── Animations ───────────────────────────────────── */
@keyframes fadeInUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes rowSlideIn {
    from { opacity: 0; transform: translateX(-8px); }
    to { opacity: 1; transform: translateX(0); }
}

/* ─── Responsive ───────────────────────────────────── */
@media (max-width: 900px) {
    .col-roster { display: none; }
    .hero-stats { display: none; }
    .team-name { max-width: 100px; }
    .col-team { width: 180px; }
}

@media (max-width: 640px) {
    .ranking-hero { padding: 1.5rem 1rem; }
    .hero-title { font-size: 1.4rem; }
    .hero-subtitle { font-size: 0.8rem; }
    .badge-ring { width: 44px; height: 44px; }
    .badge-ring svg { width: 24px; height: 24px; }

    .ranking-table th,
    .ranking-table td {
        padding: 0.45rem 0.6rem;
    }

    .col-points { width: 100px; }
    .points-bar-track { display: none; }
    .team-name { max-width: 80px; font-size: 0.82rem; }
    .major-badge { display: none; }
    .legend-bar { display: none; }
}
</style>
