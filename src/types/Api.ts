'use server'

import { getCachedLesserLeagues, getCachedLiteTeams } from "@/lib/cache";
import { CashewsGame } from "./FreeCashews";
import { League } from "./League";
import { Team, MapAPILeagueTeamResponse } from "./Team";
import { Time } from "./Time";

export async function fetchLeague(id: string): Promise<League> {
    const res = await fetch(`https://mmolb.com/api/league/${id}`);
    if (!res.ok) throw new Error('Failed to load league data');
    const data = await res.json();
    return {
        color: data.Color,
        emoji: data.Emoji,
        league_type: data.LeagueType,
        name: data.Name,
        teams: data.Teams,
        id: data._id,
    };
}

function parsePlayerRecords(data: any): any {
    if (!data || !data.records) return [];
    
    // Define all possible stat keys
    const allStatKeys = [
        'allowed_stolen_bases', 'allowed_stolen_bases_risp', 'assists', 'assists_risp',
        'at_bats', 'at_bats_risp', 'caught_double_play', 'caught_double_play_risp',
        'caught_stealing', 'caught_stealing_risp', 'double_plays', 'double_plays_risp',
        'doubles', 'doubles_risp', 'errors', 'errors_risp', 'field_out', 'field_out_risp',
        'fielders_choice', 'fielders_choice_risp', 'flyouts', 'flyouts_risp',
        'force_outs', 'force_outs_risp', 'grounded_into_double_play', 'grounded_into_double_play_risp',
        'groundouts', 'groundouts_risp', 'hit_by_pitch', 'hit_by_pitch_risp',
        'home_runs', 'home_runs_risp', 'left_on_base', 'left_on_base_risp',
        'lineouts', 'lineouts_risp', 'plate_appearances', 'plate_appearances_risp',
        'popouts', 'popouts_risp', 'putouts', 'putouts_risp',
        'reached_on_error', 'reached_on_error_risp', 'runners_caught_stealing', 'runners_caught_stealing_risp',
        'runs', 'runs_batted_in', 'runs_batted_in_risp', 'runs_risp',
        'sac_flies', 'singles', 'singles_risp', 'stolen_bases', 'stolen_bases_risp',
        'struck_out', 'struck_out_risp', 'triples', 'triples_risp', 'walked', 'walked_risp',
        'ejected', 'hits', 'total_bases'
    ];
    
    // Group records by season number
    const seasonGroups = new Map<number, any[]>();
    
    for (const record of data.records) {
        const season = record.Season;
        if (!seasonGroups.has(season)) {
            seasonGroups.set(season, []);
        }
        seasonGroups.get(season)!.push(record);
    }
    
    // Combine stats for each season
    const combinedSeasons = Array.from(seasonGroups.entries()).map(([season, records]) => {
        // Combine all stats from all records in this season
        const combinedStats: any = {};
        
        for (const record of records) {
            if (!record.Stats) continue;
            
            // Iterate through each team's stats
            for (const [teamId, teamStats] of Object.entries(record.Stats)) {
                if (!combinedStats[teamId]) {
                    combinedStats[teamId] = {};
                }
                
                // Add up all numeric stats
                for (const [statKey, statValue] of Object.entries(teamStats as any)) {
                    if (typeof statValue === 'number') {
                        combinedStats[teamId][statKey] = (combinedStats[teamId][statKey] || 0) + statValue;
                    }
                }
            }
        }
        
        // Ensure all stat keys exist with default value of 0
        for (const teamId in combinedStats) {
            for (const statKey of allStatKeys) {
                if (!(statKey in combinedStats[teamId])) {
                    combinedStats[teamId][statKey] = 0;
                }
            }
        }

        // // Calculate derived stats
        // for (const teamId in combinedStats) {
        //     const stats = combinedStats[teamId];
        //     // Calculate hits
        //     stats['hits'] = (stats.singles || 0) + (stats.doubles || 0) + (stats.triples || 0) + (stats.home_runs || 0);
        //     // Calculate total bases
        //     stats['total_bases'] = (stats.singles || 0) + (2 * (stats.doubles || 0)) + (3 * (stats.triples || 0)) + (4 * (stats.home_runs || 0));
        //     combinedStats[teamId] = stats;
        // }

        // Use the most recent record's player info (last in the array)
        const latestRecord = records[records.length - 1];
        
        return {
            Season: season,
            SeasonID: records[0].SeasonID,
            FirstName: latestRecord.FirstName,
            LastName: latestRecord.LastName,
            PlayerID: records[0].PlayerID,
            Stats: combinedStats
        };
    });
    
    return combinedSeasons;
}

export async function fetchPlayerRecords(playerId: string) {
    // 	https://mmolb.com/api/playerrecord/68ea9398d834c6992b5c5210
    const res = await fetch(`https://mmolb.com/api/playerrecord/${playerId}`);
    if (!res.ok) throw new Error('Failed to load player records');
    const data = await res.json();
    return parsePlayerRecords(data);
}

export async function fetchTeamGames(id: string, season: number): Promise<CashewsGame[]> {
    const apiUrl = new URL(`https://freecashe.ws/api/games`);
    if (season) apiUrl.searchParams.set('season', String(season));
    if (id) apiUrl.searchParams.set('team', id);

    const response = await fetch(apiUrl.toString(), {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 0 },
    });

    if (!response.ok) throw new Error('Failed to load games');
    const data = await response.json();

    if (!Array.isArray(data.items)) throw new Error('Games response was not an array');
    return data.items as CashewsGame[];
}

export async function fetchCachedLesserLeagues(): Promise<League[]> {
    return await getCachedLesserLeagues();
}

export async function fetchTopTeamsFromLeague(id: string): Promise<Team[]> {
    const teamsRes = await fetch(`https://mmolb.com/api/league-top-teams/${id}`);
    if (!teamsRes.ok) throw new Error('Failed to load teams');
    const json = await teamsRes.json();

    if (!Array.isArray(json.teams)) throw new Error('Teams response was not an array');
    return json.teams.map((team: any) => MapAPILeagueTeamResponse(team));
}

export async function fetchTime(): Promise<Time> {
    const res = await fetch(`https://mmolb.com/api/time`);
    if (!res.ok) throw new Error('Failed to load time');
    const data = await res.json();
    return {
        seasonDay: data.season_day,
        seasonNumber: data.season_number,
        seasonStatus: data.season_status,
        phaseTimes: {
            electionStart: data.phase_timesElectionStart,
            holidayStart: data.phase_timesHolidayStart,
            homeRunChallenge: data.phase_timesHomeRunChallenge,
            openingDay: data.phase_timesOpeningDay,
            postseasonPreview: data.phase_timesPostseasonPreview,
            postseasonRound1: data.phase_timesPostseasonRound1,
            postseasonRound2: data.phase_timesPostseasonRound2,
            postseasonRound3: data.phase_timesPostseasonRound3,
            preseason: data.phase_timesPreseason,
            regularSeasonResume: data.phase_timesRegularSeasonResume,
            superstarBreakStart: data.phase_timesSuperstarBreakStart,
            superstarGame: data.phase_timesSuperstarGame,
        },
    };
}
