import { Controller, Get, Post, Param, Query } from '@cmmv/http';
import { Auth } from '@cmmv/auth';
import { ChampionshipsService } from './championships.service';
import { RankingsService } from './rankings.service';

@Controller('esports')
export class ChampionshipsController {
  constructor(
    private readonly service: ChampionshipsService,
    private readonly rankingsService: RankingsService
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
