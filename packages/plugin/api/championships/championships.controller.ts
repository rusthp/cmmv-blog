import { Controller, Get, Post, Param, Query } from '@cmmv/http';
import { Auth } from '@cmmv/auth';
import { ChampionshipsService } from './championships.service';
import { RankingsService } from './rankings.service';
import { LolEsportsService } from './lolesports.service';
import { LolRankingsService } from './lol-rankings.service';
import { Draft5Service } from './draft5.service';
import { VlrService } from './vlr.service';
import { ValorantRankingsService } from './valorant-rankings.service';
import { LolGprService } from './lol-gpr.service';

@Controller('esports')
export class ChampionshipsController {
  constructor(
    private readonly service: ChampionshipsService,
    private readonly rankingsService: RankingsService,
    private readonly lolService: LolEsportsService,
    private readonly lolRankingsService: LolRankingsService,
    private readonly draft5Service: Draft5Service,
    private readonly vlrService: VlrService,
    private readonly valorantRankingsService: ValorantRankingsService,
    private readonly lolGprService: LolGprService,
  ) {}

  @Get('tournaments')
  async getTournaments(
    @Query('status') status?: string,
    @Query('game') game?: string,
    @Query('region') region?: string
  ) {
    const result = await this.service.getTournamentsWithCount(status, game, region);

    // Auto-sync if the new table is completely empty
    if (result.data.length === 0) {
      await this.service.syncAll();
      const retryResult = await this.service.getTournamentsWithCount(status, game, region);
      return retryResult;
    }

    return result;
  }

  @Get('tournaments/counts')
  async getTournamentCounts(@Query('game') game?: string, @Query('region') region?: string) {
    return this.service.getStatusCounts(game, region);
  }

  @Get('tournaments/:slug')
  async getTournament(@Param('slug') slug: string) {
    const tournament = await this.service.getTournamentBySlug(slug);
    if (!tournament) return { error: 'Not found' };
    return tournament;
  }

  @Get('tournaments/:slug/matches')
  async getTournamentMatches(@Param('slug') slug: string, @Query('status') status?: string) {
    const matches = await this.service.getTournamentMatches(slug, status);
    return { data: matches, total: matches.length };
  }

  @Get('tournaments/:slug/brackets')
  async getTournamentBrackets(@Param('slug') slug: string) {
    // Determine game from slug prefix or tournament record
    const tournament = await this.service.getTournamentBySlug(slug);
    const game = (tournament as any)?.game || '';

    if (game === 'lol' || slug.startsWith('lol-')) {
      return this.lolService.getTournamentBracket(slug);
    }

    return this.service.getTournamentBrackets(slug);
  }

  @Get('matches/upcoming')
  async getUpcomingMatches(@Query('limit') limit?: string, @Query('game') game?: string) {
    const matches = await this.service.getUpcomingMatches(game, parseInt(limit || '20'));
    return { data: matches, total: matches.length };
  }

  @Get('matches/results')
  async getRecentResults(@Query('limit') limit?: string, @Query('game') game?: string) {
    const matches = await this.service.getRecentResults(game, parseInt(limit || '20'));
    return { data: matches, total: matches.length };
  }

  @Get('teams')
  async getTeams(@Query('limit') limit?: string, @Query('game') game?: string) {
    const teams = await this.service.getTeams(game, parseInt(limit || '50'));
    return { data: teams, total: teams.length };
  }

  // ─── Rankings (Valve Major Standings) ────────────────────────

  @Get('rankings')
  async getRankings(@Query('region') region?: string, @Query('limit') limit?: string) {
    const data = await this.rankingsService.getRankings(
      region || 'global',
      parseInt(limit || '200')
    );
    return { data, total: data.length };
  }

  @Get('rankings/status')
  async getRankingsStatus() {
    const status = await this.rankingsService.getSyncStatus();
    return status;
  }

  @Get('rankings/sync-now')
  async syncRankingsNow() {
    const stats = await this.rankingsService.syncAll();
    return { success: true, stats };
  }

  // ─── Valorant Rankings (VCT Circuit Points) ──────────────────

  @Get('rankings/valorant')
  async getValorantRankings(@Query('region') region?: string, @Query('limit') limit?: string) {
    const data = await this.valorantRankingsService.getRankings(
      region || 'americas',
      parseInt(limit || '30')
    );
    return { data, total: data.length };
  }

  @Get('rankings/valorant/regions')
  async getValorantRegions() {
    const regions = await this.valorantRankingsService.getAvailableRegions();
    return { data: regions };
  }

  @Get('rankings/valorant/status')
  async getValorantRankingsStatus() {
    return this.valorantRankingsService.getSyncStatus();
  }

  @Get('rankings/valorant/sync-now')
  async syncValorantRankingsNow() {
    const stats = await this.valorantRankingsService.syncAll();
    return { success: true, stats };
  }

  // ─── LoL Rankings (League Standings) ─────────────────────────

  @Get('rankings/lol')
  async getLolRankings(@Query('league') league?: string, @Query('region') region?: string, @Query('limit') limit?: string) {
    if (league) {
      const data = await this.lolRankingsService.getRankings(league, parseInt(limit || '20'));
      return { data, total: data.length };
    }
    const byLeague = await this.lolRankingsService.getRankingsByRegion(region || 'global', parseInt(limit || '20'));
    return { data: byLeague };
  }

  @Get('rankings/lol/leagues')
  async getLolLeagues() {
    const leagues = await this.lolRankingsService.getLeagues();
    return { data: leagues };
  }

  @Get('rankings/lol/gpr')
  async getLolGpr() {
    const data = await this.lolGprService.getGpr();
    return { data, total: data.length };
  }

  @Get('rankings/lol/status')
  async getLolRankingsStatus() {
    return this.lolRankingsService.getSyncStatus();
  }

  @Get('rankings/lol/sync-now')
  async syncLolRankingsNow() {
    const stats = await this.lolRankingsService.syncAll();
    return { success: true, stats };
  }

  @Get('sync-now')
  async syncNow() {
    const [pandaStats, rankingStats, valorantStats, lolStats] = await Promise.all([
      this.service.syncAll(),
      this.rankingsService.syncAll(),
      this.valorantRankingsService.syncAll(),
      this.lolRankingsService.syncAll(),
    ]);
    return { success: true, pandascore: pandaStats, rankings: rankingStats, valorant: valorantStats, lol: lolStats };
  }

  @Get('sync-lol')
  async syncLol() {
    const stats = await this.lolService.syncAll();
    return { success: true, lolesports: stats };
  }

  @Get('sync-draft5')
  async syncDraft5() {
    const stats = await this.draft5Service.syncAll();
    return { success: true, draft5: stats };
  }

  @Get('sync-vlr')
  async syncVlr() {
    const stats = await this.vlrService.syncAll();
    return { success: true, vlr: stats };
  }

  @Get('sync-stale')
  async syncStale() {
    const stats = await this.service.syncStale();
    return { success: true, ...stats };
  }

  @Get('migrate-to-series')
  async migrateToSeries() {
    const stats = await this.service.migrateToSeries();
    return { success: true, ...stats };
  }

  @Get('sync-missing-teams')
  async syncMissingTeams() {
    const stats = await this.service.syncMissingTeams();
    return { success: true, ...stats };
  }

  // ─── Sync ─────────────────────────────────────────────────────

  @Post('sync')
  @Auth()
  async syncAll() {
    const [pandaStats, rankingStats] = await Promise.all([
      this.service.syncAll(),
      this.rankingsService.syncAll(),
    ]);
    return { success: true, pandascore: pandaStats, rankings: rankingStats };
  }

  @Post('sync/rankings')
  @Auth()
  async syncRankings() {
    const stats = await this.rankingsService.syncAll();
    return { success: true, stats };
  }
}
