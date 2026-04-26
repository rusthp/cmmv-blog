import { Controller, Get, Post, Param, Query } from '@cmmv/http';
import { Auth } from '@cmmv/auth';
import { ChampionshipsService } from './championships.service';
import { RankingsService } from './rankings.service';
import { LolEsportsService } from './lolesports.service';
import { Draft5Service } from './draft5.service';
import { VlrService } from './vlr.service';

@Controller('esports')
export class ChampionshipsController {
  constructor(
    private readonly service: ChampionshipsService,
    private readonly rankingsService: RankingsService,
    private readonly lolService: LolEsportsService,
    private readonly draft5Service: Draft5Service,
    private readonly vlrService: VlrService,
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

  @Get('sync-now')
  async syncNow() {
    const [pandaStats, rankingStats] = await Promise.all([
      this.service.syncAll(),
      this.rankingsService.syncAll(),
    ]);
    return { success: true, pandascore: pandaStats, rankings: rankingStats };
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
