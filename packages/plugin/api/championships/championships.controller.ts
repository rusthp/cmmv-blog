import { Controller, Get, Post, Param, Query } from '@cmmv/http';
import { Auth } from '@cmmv/auth';
import { ChampionshipsService } from './championships.service';

@Controller('cs2')
export class ChampionshipsController {
    constructor(private readonly service: ChampionshipsService) {}

    @Get('tournaments')
    async getTournaments(@Query('status') status?: string) {
        const tournaments = await this.service.getTournaments(status);
        return { data: tournaments, total: tournaments.length };
    }

    @Get('tournaments/:slug')
    async getTournament(@Param('slug') slug: string) {
        const tournament = await this.service.getTournamentBySlug(slug);
        if (!tournament) return { error: 'Not found' };
        return tournament;
    }

    @Get('tournaments/:slug/matches')
    async getTournamentMatches(
        @Param('slug') slug: string,
        @Query('status') status?: string,
    ) {
        const matches = await this.service.getTournamentMatches(slug, status);
        return { data: matches, total: matches.length };
    }

    @Get('matches/upcoming')
    async getUpcomingMatches(@Query('limit') limit?: string) {
        const matches = await this.service.getUpcomingMatches(parseInt(limit || '20'));
        return { data: matches, total: matches.length };
    }

    @Get('matches/results')
    async getRecentResults(@Query('limit') limit?: string) {
        const matches = await this.service.getRecentResults(parseInt(limit || '20'));
        return { data: matches, total: matches.length };
    }

    @Get('teams')
    async getTeams(@Query('limit') limit?: string) {
        const teams = await this.service.getTeams(parseInt(limit || '50'));
        return { data: teams, total: teams.length };
    }

    @Post('sync')
    @Auth()
    async syncAll() {
        const stats = await this.service.syncAll();
        return { success: true, stats };
    }
}
