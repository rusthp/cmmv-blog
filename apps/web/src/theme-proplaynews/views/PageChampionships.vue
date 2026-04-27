<template>
  <div class="championships-page">
    <!-- HEADER -->
    <div class="page-header">
      <h1 class="page-title">Campeonatos</h1>
      <p class="page-subtitle">Acompanhe os principais torneios e competições de e-Sports.</p>
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
        {{ g.label }}
      </button>
    </div>

    <!-- REGION FILTER -->
    <div class="region-nav">
      <button
        v-for="r in regions"
        :key="r.value"
        class="region-tab"
        :class="{ active: activeRegion === r.value }"
        @click="setRegion(r.value)"
      >
        {{ r.label }}
      </button>
    </div>

    <!-- TIER FILTER -->
    <div class="tier-nav">
      <span class="tier-nav-label">TIER</span>
      <button
        v-for="t in tiers"
        :key="t.value"
        class="tier-tab"
        :class="[`tier-${t.value}`, { active: activeTier === t.value }]"
        @click="setTier(t.value)"
      >
        {{ t.label }}
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
      <div v-if="loading" class="cards-grid-loading">
        <div v-for="n in 8" :key="n" class="skeleton-card"></div>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredTournaments.length === 0" class="empty-state">
        <h3>Nenhum campeonato encontrado</h3>
        <p>Não há eventos nesta categoria para os filtros selecionados.</p>
      </div>

      <!-- CARDS GRID (Draft5 Style) -->
      <div v-else class="cards-grid">
        <a
          v-for="t in filteredTournaments"
          :key="t.id"
          :href="`/campeonatos/${t.slug}`"
          class="tournament-card"
        >
          <!-- Banner/Image Area -->
          <div class="card-banner">
            <template v-if="t.bannerUrl">
              <img
                :src="t.bannerUrl"
                :alt="t.name"
                class="banner-image"
                @error="handleImageError"
              />
            </template>
            <template v-else-if="t.leagueLogo">
              <div class="banner-placeholder banner-with-logo" :class="`game-${t.game}`">
                <img
                  :src="t.leagueLogo"
                  :alt="t.name"
                  class="banner-logo-bg"
                  @error="handleImageError"
                />
                <span class="game-label">{{ getGameShortLabel(t.game) }}</span>
              </div>
            </template>
            <template v-else-if="t.logoUrl">
              <div class="banner-placeholder banner-with-logo" :class="`game-${t.game}`">
                <img
                  :src="t.logoUrl"
                  :alt="t.name"
                  class="banner-logo-bg"
                  @error="handleImageError"
                />
                <span class="game-label">{{ getGameShortLabel(t.game) }}</span>
              </div>
            </template>
            <div v-else class="banner-placeholder" :class="`game-${t.game}`">
              <span class="game-label">{{ getGameShortLabel(t.game) }}</span>
              <span v-if="t.tier" class="tier-badge-placeholder"
                >Tier {{ t.tier.toUpperCase() }}</span
              >
            </div>

            <!-- Top Badges -->
            <div class="card-badges">
              <span class="badge badge-type" :class="t.online ? 'online' : 'lan'">
                {{ t.online ? 'Online' : 'LAN' }}
              </span>
              <div class="card-badges-right">
                <span v-if="t.tier" class="badge badge-tier">
                  Tier {{ t.tier.toUpperCase() }}
                </span>
                <span class="badge badge-status" :class="t.status">
                  {{ statusLabel(t.status) }}
                </span>
              </div>
            </div>

            <!-- Progress bar for ongoing -->
            <div v-if="t.status === 'ongoing'" class="progress-bar">
              <div class="progress-fill" :style="{ width: getProgress(t) + '%' }"></div>
            </div>
          </div>

          <!-- Info Area -->
          <div class="card-info">
            <div class="card-logo">
              <img v-if="t.logoUrl" :src="t.logoUrl" :alt="t.name" @error="handleLogoError" />
              <div class="logo-placeholder" :style="t.logoUrl ? 'display:none' : ''">
                {{ getInitials(t.name) }}
              </div>
            </div>
            <h3 class="card-title">{{ getCardTitle(t) }}</h3>
            <p class="card-date">{{ formatCardDate(t.startDate, t.endDate) }}</p>
            <div class="card-bottom-row">
              <div v-if="t.prizePool" class="card-prize" :class="getPrizeClass(t.prizePool)">
                <span class="prize-icon">{{ getPrizeIcon(t.prizePool) }}</span>
                {{ t.prizePool }}
              </div>
              <div v-if="getTeamCount(t) > 0" class="card-teams">
                {{ getTeamCount(t) }} times
              </div>
            </div>
          </div>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onServerPrefetch, watch } from 'vue';
import { useHead } from '@unhead/vue';

useHead({ title: 'Campeonatos — ProPlay News' });

const isSSR = import.meta.env.SSR;
const apiBase = isSSR ? (import.meta.env.VITE_API_URL || 'http://localhost:5000') : '';

const games = [
  { label: 'Todos', value: 'all' },
  { label: 'CS2', value: 'csgo' },
  { label: 'Valorant', value: 'valorant' },
  { label: 'League of Legends', value: 'lol' },
  { label: 'Dota 2', value: 'dota2' },
  { label: 'Rainbow 6', value: 'r6siege' },
];

const statusTabs = [
  { label: 'Todos', value: 'all' },
  { label: 'Em andamento', value: 'ongoing' },
  { label: 'Proximos', value: 'upcoming' },
  { label: 'Encerrados', value: 'finished' },
];

const regions = [
  { label: 'Todos', value: 'all' },
  { label: 'Brasil', value: 'BR' },
  { label: 'Am. do Sul', value: 'SA' },
  { label: 'Europa', value: 'EU' },
  { label: 'Am. do Norte', value: 'NA' },
  { label: 'Asia', value: 'APAC' },
];

const tiers = [
  { label: 'Todos', value: 'all' },
  { label: 'S', value: 's' },
  { label: 'A', value: 'a' },
  { label: 'B', value: 'b' },
  { label: 'C', value: 'c' },
  { label: 'D', value: 'd' },
];

const activeGame = ref('all');
const activeStatus = ref('all');
const activeRegion = ref('all');
const activeTier = ref('all');

const tournaments = ref<any[]>([]);
const loading = ref(!import.meta.env.SSR);

// Status counts - fetched from backend
const statusCounts = ref({ all: 0, ongoing: 0, upcoming: 0, finished: 0 });

const filteredTournaments = computed(() => {
  if (activeTier.value === 'all') return tournaments.value;
  return tournaments.value.filter(
    (t: any) => (t.tier || '').toLowerCase() === activeTier.value,
  );
});

function getCount(status: string) {
  return statusCounts.value[status] || 0;
}

watch([activeGame, activeStatus, activeRegion], () => {
  load();
});

async function load() {
  try {
    loading.value = true;

    const params = new URLSearchParams();
    if (activeStatus.value !== 'all') params.append('status', activeStatus.value);
    if (activeGame.value !== 'all') params.append('game', activeGame.value);
    if (activeRegion.value !== 'all') params.append('region', activeRegion.value);
    params.append('limit', '200');

    const base = isSSR ? `${apiBase}/esports` : '/api/esports';
    const url = `${base}/tournaments?${params.toString()}`;

    const res = await fetch(url);
    const json = await res.json();

    tournaments.value = json.data || json.result?.data || [];

    // Fetch counts for all statuses from the optimized endpoint
    await updateAllStatusCounts();
  } catch (error) {
    console.error('[Championships] Error loading tournaments:', error);
    tournaments.value = [];
  } finally {
    loading.value = false;
  }
}

async function updateAllStatusCounts() {
  try {
    const countParams = new URLSearchParams();
    if (activeGame.value !== 'all') countParams.append('game', activeGame.value);
    if (activeRegion.value !== 'all') countParams.append('region', activeRegion.value);
    const countQuery = countParams.toString() ? `?${countParams.toString()}` : '';

    const base = isSSR ? `${apiBase}/esports` : '/api/esports';
    const res = await fetch(`${base}/tournaments/counts${countQuery}`);
    const json = await res.json();

    const counts = json.result || json;
    statusCounts.value = {
      all: counts.all || 0,
      ongoing: counts.ongoing || 0,
      upcoming: counts.upcoming || 0,
      finished: counts.finished || 0,
    };
  } catch (error) {
    console.error('[Championships] Error fetching status counts:', error);
  }
}

function setGame(value: string) {
  activeGame.value = value;
}
function setStatus(value: string) {
  activeStatus.value = value;
}
function setRegion(value: string) {
  activeRegion.value = value;
}
function setTier(value: string) {
  activeTier.value = value;
}

function getPrizeClass(prizePool: string): string {
  if (!prizePool) return '';
  const lower = prizePool.toLowerCase();
  if (lower.includes('vaga') || lower.includes('slot') || lower.includes('berth')) {
    return 'prize-slot';
  }
  return 'prize-money';
}

function getPrizeIcon(prizePool: string): string {
  if (!prizePool) return '';
  const lower = prizePool.toLowerCase();
  if (lower.includes('vaga') || lower.includes('slot') || lower.includes('berth')) {
    return '\uD83C\uDFC6'; // trophy
  }
  return '\uD83D\uDCB0'; // money bag
}

function getTeamCount(t: any): number {
  if (t.numberOfTeams && t.numberOfTeams > 0) return t.numberOfTeams;
  if (t.teams && t.teams.length > 0) return t.teams.length;
  if (t.teamsJson) {
    try {
      const parsed = JSON.parse(t.teamsJson);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.length;
    } catch {}
  }
  return 0;
}

function getGameShortLabel(gameSlug: string): string {
  const map: Record<string, string> = {
    csgo: 'CS2',
    valorant: 'VAL',
    lol: 'LoL',
    dota2: 'D2',
    r6siege: 'R6',
  };
  return map[gameSlug] || gameSlug.toUpperCase();
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    ongoing: 'Ao vivo',
    upcoming: 'Em breve',
    finished: 'Encerrado',
    cancelled: 'Cancelado',
  };
  return map[status] || status.toUpperCase();
}

function formatCardDate(startStr: string, endStr: string): string {
  if (!startStr) return 'Data a definir';
  const s = new Date(startStr);
  const e = endStr ? new Date(endStr) : null;

  const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: '2-digit' };
  const sStr = s.toLocaleDateString('pt-BR', opts);

  if (!e || s.getTime() === e.getTime()) return sStr;
  const eStr = e.toLocaleDateString('pt-BR', opts);
  return `${sStr} - ${eStr}`;
}

function getProgress(tournament: any): number {
  if (!tournament.startDate || !tournament.endDate) return 50;
  const start = new Date(tournament.startDate).getTime();
  const end = new Date(tournament.endDate).getTime();
  const now = Date.now();

  if (now < start) return 0;
  if (now > end) return 100;

  return Math.round(((now - start) / (end - start)) * 100);
}

function getInitials(name?: string): string {
  if (!name) return '?';
  return name.substring(0, 2).toUpperCase();
}

function getCardTitle(t: any): string {
  if (!t) return '';
  const league = t.leagueName || '';
  const name = t.name || '';
  // If name is generic, prefix with league
  if (
    name.toLowerCase() === 'playoffs' ||
    name.toLowerCase() === 'group stage' ||
    name.toLowerCase() === 'regular season'
  ) {
    return league ? `${league} — ${name}` : name;
  }
  return name;
}

function handleImageError(e: Event) {
  const img = e.target as HTMLImageElement;
  if (img) img.style.display = 'none';
}

function handleLogoError(e: Event) {
  const img = e.target as HTMLImageElement;
  if (img) {
    img.style.display = 'none';
    const placeholder = img.parentElement?.querySelector('.logo-placeholder');
    if (placeholder) placeholder.style.display = 'flex';
  }
}

onServerPrefetch(async () => {
  await load();
});

onMounted(() => {
  if (tournaments.value.length === 0) load();
  else loading.value = false;
});
</script>

<style scoped>
.championships-page {
  width: 100%;
  padding: 1rem 0;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.page-header {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.01em;
}

.page-subtitle {
  color: #a0aec0;
  font-size: 0.95rem;
  margin: 0;
}

/* Games Navigation */
.games-nav {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.game-tab {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  background: #1a202c;
  color: #a0aec0;
  font-weight: 500;
  font-size: 0.875rem;
  border: 1px solid #2d3748;
  cursor: pointer;
  transition: all 0.15s ease;
}

.game-tab:hover {
  background: #2d3748;
  color: #e2e8f0;
}

.game-tab.active {
  background: #3182ce;
  border-color: #3182ce;
  color: #ffffff;
}

/* Region Navigation */
.region-nav {
  display: flex;
  gap: 0.375rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.region-tab {
  padding: 0.375rem 0.75rem;
  border-radius: 999px;
  background: transparent;
  color: #718096;
  font-weight: 500;
  font-size: 0.8125rem;
  border: 1px solid #2d3748;
  cursor: pointer;
  transition: all 0.15s ease;
}

.region-tab:hover {
  color: #e2e8f0;
  border-color: #4a5568;
}

.region-tab.active {
  background: #2d3748;
  border-color: #4a5568;
  color: #e2e8f0;
}

/* Tier Navigation */
.tier-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.tier-nav-label {
  font-size: 0.6875rem;
  font-weight: 700;
  color: #4a5568;
  letter-spacing: 0.1em;
  margin-right: 0.25rem;
  text-transform: uppercase;
}

.tier-tab {
  padding: 0.3rem 0.875rem;
  border-radius: 6px;
  background: transparent;
  font-weight: 700;
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all 0.15s ease;
  letter-spacing: 0.05em;
}

/* Todos */
.tier-tab.tier-all {
  color: #a0aec0;
  border: 1px solid #4a5568;
}
.tier-tab.tier-all:hover { color: #e2e8f0; border-color: #718096; }
.tier-tab.tier-all.active {
  background: #2d3748;
  border-color: #718096;
  color: #e2e8f0;
}

/* Tier S — gold */
.tier-tab.tier-s {
  border: 1px solid rgba(236, 201, 75, 0.5);
  color: #ecc94b;
}
.tier-tab.tier-s:hover, .tier-tab.tier-s.active {
  background: rgba(236, 201, 75, 0.15);
  border-color: #ecc94b;
  box-shadow: 0 0 8px rgba(236, 201, 75, 0.3);
}

/* Tier A — purple */
.tier-tab.tier-a {
  border: 1px solid rgba(183, 148, 244, 0.5);
  color: #b794f4;
}
.tier-tab.tier-a:hover, .tier-tab.tier-a.active {
  background: rgba(183, 148, 244, 0.15);
  border-color: #b794f4;
  box-shadow: 0 0 8px rgba(183, 148, 244, 0.3);
}

/* Tier B — blue */
.tier-tab.tier-b {
  border: 1px solid rgba(99, 179, 237, 0.5);
  color: #63b3ed;
}
.tier-tab.tier-b:hover, .tier-tab.tier-b.active {
  background: rgba(99, 179, 237, 0.15);
  border-color: #63b3ed;
  box-shadow: 0 0 8px rgba(99, 179, 237, 0.3);
}

/* Tier C — green */
.tier-tab.tier-c {
  border: 1px solid rgba(104, 211, 145, 0.5);
  color: #68d391;
}
.tier-tab.tier-c:hover, .tier-tab.tier-c.active {
  background: rgba(104, 211, 145, 0.15);
  border-color: #68d391;
  box-shadow: 0 0 8px rgba(104, 211, 145, 0.3);
}

/* Tier D — grey */
.tier-tab.tier-d {
  border: 1px solid #4a5568;
  color: #a0aec0;
}
.tier-tab.tier-d:hover, .tier-tab.tier-d.active {
  background: rgba(113, 128, 150, 0.15);
  border-color: #718096;
  color: #cbd5e0;
}

/* Content Area */
.championships-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Status Tabs */
.status-tabs-container {
  border-bottom: 2px solid #1a202c;
}

.status-tabs {
  display: flex;
  gap: 2rem;
}

.status-tab {
  background: transparent;
  border: none;
  color: #718096;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0.75rem 0;
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: color 0.15s;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.status-tab:hover {
  color: #e2e8f0;
}

.status-tab.active {
  color: #3182ce;
}

.status-tab.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: #3182ce;
}

.tab-count {
  background: #2d3748;
  color: #a0aec0;
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
  font-weight: 500;
}

.status-tab.active .tab-count {
  background: #3182ce;
  color: #ffffff;
}

/* CARDS GRID */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
}

.tournament-card {
  display: flex;
  flex-direction: column;
  background: #1a202c;
  border: 1px solid #2d3748;
  border-radius: 8px;
  overflow: hidden;
  text-decoration: none;
  transition: all 0.2s ease;
  min-width: 0;
}

.tournament-card:hover {
  border-color: #4a5568;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* Banner Area */
.card-banner {
  position: relative;
  width: 100%;
  height: 160px;
  background: #0f1419;
  overflow: hidden;
}

.banner-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Banner placeholder with logo background */
.banner-with-logo {
  position: relative;
  overflow: hidden;
}

.banner-logo-bg {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 70%;
  max-height: 70%;
  object-fit: contain;
  opacity: 0.2;
  filter: blur(1px);
}

.banner-with-logo .game-label {
  position: relative;
  z-index: 1;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
}

.banner-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 2rem;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.12);
  letter-spacing: 0.1em;
}

.tier-badge-placeholder {
  font-size: 0.75rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.25);
  background: rgba(0, 0, 0, 0.2);
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.banner-placeholder.game-csgo {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}
.banner-placeholder.game-valorant {
  background: linear-gradient(135deg, #1a1a2e 0%, #2d1b4e 100%);
}
.banner-placeholder.game-lol {
  background: linear-gradient(135deg, #0f2027 0%, #203a43 100%);
}
.banner-placeholder.game-dota2 {
  background: linear-gradient(135deg, #1a1a2e 0%, #3d1f1f 100%);
}
.banner-placeholder.game-r6siege {
  background: linear-gradient(135deg, #1a1a2e 0%, #2e3d1f 100%);
}

/* Card Badges */
.card-badges {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  right: 0.75rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
}

.card-badges-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.3rem;
}

.badge {
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.badge-type {
  background: rgba(0, 0, 0, 0.7);
  color: #ffffff;
  backdrop-filter: blur(4px);
}

.badge-status {
  color: #ffffff;
  backdrop-filter: blur(4px);
}

.badge-status.ongoing {
  background: #e53e3e;
}

.badge-status.upcoming {
  background: #3182ce;
}

.badge-status.finished {
  background: #4a5568;
}

.badge-tier {
  background: rgba(0, 0, 0, 0.7);
  color: #ecc94b;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(236, 201, 75, 0.3);
}

/* Progress Bar */
.progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(255, 255, 255, 0.1);
}

.progress-fill {
  height: 100%;
  background: #e53e3e;
  transition: width 0.3s ease;
}

/* Card Info */
.card-info {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.5rem;
}

.card-logo {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  background: #2d3748;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.logo-placeholder {
  font-size: 0.75rem;
  font-weight: 700;
  color: #718096;
}

.card-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #e2e8f0;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-date {
  font-size: 0.8125rem;
  color: #718096;
  margin: 0;
}

.card-bottom-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.card-prize {
  font-size: 0.875rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.card-prize.prize-money {
  color: #ecc94b;
}

.card-prize.prize-slot {
  color: #63b3ed;
}

.prize-icon {
  font-size: 0.8125rem;
}

.card-teams {
  font-size: 0.75rem;
  color: #718096;
  font-weight: 500;
  white-space: nowrap;
}

/* Loading State */
.cards-grid-loading {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
}

.skeleton-card {
  height: 280px;
  border-radius: 8px;
  background: linear-gradient(90deg, #1a202c 25%, #2d3748 50%, #1a202c 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 0;
  color: #718096;
}

.empty-state h3 {
  color: #e2e8f0;
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.empty-state p {
  margin: 0;
  font-size: 0.875rem;
}

/* Responsive */
@media (max-width: 600px) {
  .championships-page {
    padding: 1.5rem 1rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .cards-grid,
  .cards-grid-loading {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .status-tabs {
    gap: 1rem;
    overflow-x: auto;
    padding-bottom: 0.25rem;
  }

  .status-tab {
    white-space: nowrap;
    font-size: 0.8125rem;
  }
}
</style>
