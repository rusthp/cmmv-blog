import { describe, it, expect } from 'vitest';
import {
    isSameTournament,
    mergeTournaments,
    mergeExternalIds,
    TournamentData,
} from '../packages/plugin/api/championships/tournament-merger.utils';

describe('mergeExternalIds', () => {
    it('adds new source entry', () => {
        const result = mergeExternalIds(null, { source: 'pandascore', id: 'serie_123' });
        expect(result).toEqual([{ source: 'pandascore', id: 'serie_123' }]);
    });

    it('updates existing source entry', () => {
        const existing = JSON.stringify([{ source: 'pandascore', id: 'serie_123' }]);
        const result = mergeExternalIds(existing, { source: 'pandascore', id: 'serie_456' });
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('serie_456');
    });

    it('appends new source without replacing existing', () => {
        const existing = JSON.stringify([{ source: 'pandascore', id: 'serie_123' }]);
        const result = mergeExternalIds(existing, { source: 'liquipedia', id: 'PGL/2026/Astana' });
        expect(result).toHaveLength(2);
        expect(result.find(e => e.source === 'pandascore')?.id).toBe('serie_123');
        expect(result.find(e => e.source === 'liquipedia')?.id).toBe('PGL/2026/Astana');
    });

    it('handles invalid existing JSON gracefully', () => {
        const result = mergeExternalIds('invalid-json', { source: 'hltv', id: '123' });
        expect(result).toEqual([{ source: 'hltv', id: '123' }]);
    });
});

describe('isSameTournament', () => {
    it('matches by identical slug', () => {
        const a: TournamentData = { slug: 'pgl-2026-astana', startDate: '2026-05-09' };
        const b: TournamentData = { slug: 'pgl-2026-astana', startDate: '2026-05-09' };
        expect(isSameTournament(a, b)).toBe(true);
    });

    it('matches by slug normalization', () => {
        const a: TournamentData = { slug: 'PGL Astana 2026', startDate: '2026-05-09' };
        const b: TournamentData = { slug: 'pgl-astana-2026', startDate: '2026-05-09' };
        expect(isSameTournament(a, b)).toBe(true);
    });

    it('matches by game+name+overlapping dates', () => {
        const a: TournamentData = { game: 'csgo', name: 'PGL Astana 2026', startDate: '2026-05-09' };
        const b: TournamentData = { game: 'csgo', name: 'PGL Astana 2026', startDate: '2026-05-09' };
        expect(isSameTournament(a, b)).toBe(true);
    });

    it('does not match different names', () => {
        const a: TournamentData = { game: 'csgo', name: 'PGL Astana 2026', startDate: '2026-05-09' };
        const b: TournamentData = { game: 'csgo', name: 'IEM Cologne 2026', startDate: '2026-06-02' };
        expect(isSameTournament(a, b)).toBe(false);
    });

    it('does not match same name but dates too far apart', () => {
        const a: TournamentData = { game: 'csgo', name: 'PGL Astana 2026', startDate: '2026-05-09' };
        const b: TournamentData = { game: 'csgo', name: 'PGL Astana 2026', startDate: '2026-06-09' };
        expect(isSameTournament(a, b)).toBe(false);
    });
});

describe('mergeTournaments', () => {
    const base: TournamentData = {
        externalId: 'serie_123',
        externalIds: JSON.stringify([{ source: 'pandascore', id: 'serie_123' }]),
        dataSource: 'pandascore',
        game: 'csgo',
        name: 'PGL Astana 2026',
        slug: 'pgl-2026-astana',
        status: 'upcoming',
        startDate: '2026-05-09',
        endDate: '2026-05-17',
        prizePool: '$800,000',
        tier: 's',
        numberOfTeams: 16,
        featured: true,
    };

    it('fills empty fields from lower-trust source without overwriting', () => {
        const incoming: TournamentData = {
            externalId: 'draft5_pgl-2026-astana',
            dataSource: 'draft5',
            game: 'csgo',
            name: 'PGL Astana 2026',
            location: 'Astana',
            logoUrl: 'https://example.com/logo.png',
        };

        const result = mergeTournaments(base, incoming, 'draft5');
        expect(result.location).toBe('Astana');
        expect(result.logoUrl).toBe('https://example.com/logo.png');
        // PandaScore fields untouched (draft5 trust=0 < pandascore trust=1)
        expect(result.prizePool).toBe('$800,000');
        expect(result.tier).toBe('s');
        // dataSource stays pandascore (lower trust source doesn't overwrite)
        expect(result.dataSource).toBe('pandascore');
    });

    it('overwrites fields when incoming source has higher trust', () => {
        const lowTrustBase: TournamentData = {
            ...base,
            dataSource: 'pandascore',
            name: 'PGL Astana',
        };

        const hltvIncoming: TournamentData = {
            externalId: 'hltv_123',
            dataSource: 'hltv',
            name: 'PGL Astana 2026',
            location: 'Astana, Kazakhstan',
        };

        const result = mergeTournaments(lowTrustBase, hltvIncoming, 'hltv');
        expect(result.name).toBe('PGL Astana 2026');
        expect(result.location).toBe('Astana, Kazakhstan');
        expect(result.dataSource).toBe('hltv');
    });

    it('merges externalIds from both sources', () => {
        const incoming: TournamentData = {
            externalId: 'liq_pgl-2026-astana',
            externalIds: JSON.stringify([{ source: 'liquipedia', id: 'PGL/2026/Astana' }]),
            dataSource: 'liquipedia',
            game: 'csgo',
        };

        const result = mergeTournaments(base, incoming, 'liquipedia');
        const ids = JSON.parse(result.externalIds || '[]');
        expect(ids.find((e: any) => e.source === 'pandascore')?.id).toBe('serie_123');
        expect(ids.find((e: any) => e.source === 'liquipedia')?.id).toBe('PGL/2026/Astana');
    });

    it('prefers source with more teams', () => {
        const incomingWithTeams: TournamentData = {
            externalId: 'liq_pgl-2026-astana',
            dataSource: 'liquipedia',
            teamsJson: JSON.stringify(new Array(16).fill({ name: 'Team', id: '1' })),
            numberOfTeams: 16,
        };

        const baseNoTeams: TournamentData = { ...base, teamsJson: '[]', numberOfTeams: 0 };
        const result = mergeTournaments(baseNoTeams, incomingWithTeams, 'liquipedia');
        expect(result.numberOfTeams).toBe(16);
    });
});

describe('LiquipediaService date parsing (via pure functions)', () => {
    // Test date range patterns used in Liquipedia HTML
    const parseMonths: Record<string, string> = {
        January: '01', February: '02', March: '03', April: '04',
        May: '05', June: '06', July: '07', August: '08',
        September: '09', October: '10', November: '11', December: '12',
    };

    function parseDate(text: string, fallbackYear: string): string | null {
        text = text.replace(/,/g, '').trim();
        const parts = text.split(/\s+/);
        let month: string | undefined;
        let day: string | undefined;
        let year = fallbackYear;
        for (const p of parts) {
            if (parseMonths[p]) month = parseMonths[p];
            else if (/^\d{4}$/.test(p)) year = p;
            else if (/^\d{1,2}$/.test(p)) day = p.padStart(2, '0');
        }
        if (!month || !day) return null;
        return `${year}-${month}-${day}`;
    }

    it('parses "May 09, 2026" correctly', () => {
        expect(parseDate('May 09, 2026', '2026')).toBe('2026-05-09');
    });

    it('parses "May 17, 2026" correctly', () => {
        expect(parseDate('May 17, 2026', '2026')).toBe('2026-05-17');
    });

    it('parses "December 28, 2025" correctly', () => {
        expect(parseDate('December 28, 2025', '2026')).toBe('2025-12-28');
    });

    it('returns null for invalid date', () => {
        expect(parseDate('invalid text', '2026')).toBeNull();
    });
});

describe('HltvService match result detection (pattern logic)', () => {
    const WIN_VERBS = /\b(beat|defeat(?:ed)?|eliminate(?:d)?|move(?:d)? past|advance(?:d)? over|outclass(?:ed)?|oust(?:ed)?|knock(?:ed)? out|def\.|overpower(?:ed)?|crush(?:ed)?|outlast(?:ed)?|topped?)\b/i;

    it('detects "beat" verb in title', () => {
        expect(WIN_VERBS.test('HEROIC beat Aurora 2-0')).toBe(true);
    });

    it('detects "move past" in title', () => {
        expect(WIN_VERBS.test('Falcons move past K27 on karrigan debut')).toBe(true);
    });

    it('detects "defeat" in title', () => {
        expect(WIN_VERBS.test('MOUZ defeat Gentle Mates in round 1')).toBe(true);
    });

    it('does not false-positive on interview titles', () => {
        const interviewTitle = 'BIT: It\'s good to be here, we never know how good we\'ll be';
        expect(WIN_VERBS.test(interviewTitle)).toBe(false);
    });

    it('extracts team names from "HEROIC beat Aurora 2-0"', () => {
        const title = 'HEROIC beat Aurora in Astana';
        const verbMatch = title.match(WIN_VERBS);
        expect(verbMatch).not.toBeNull();
        const team1 = title.substring(0, verbMatch!.index!).trim();
        const afterVerb = title.substring(verbMatch!.index! + verbMatch![0].length).trim();
        const team2 = afterVerb.split(/\s+(?:in|on|at|after)\s+/i)[0].trim();
        expect(team1).toBe('HEROIC');
        expect(team2).toBe('Aurora');
    });
});
