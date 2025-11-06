import { Boon, mapBoon } from "./Player";
import { defaultStats, DerivedPlayerStats, MapAPIPlayerStats, PlayerStats } from "./PlayerStats";


export type TeamPlayer = {
    emoji: string;
    first_name: string;
    last_name: string;
    number: number;
    player_id: string;
    position: string;
    position_type: string;
    slot: string;
    slot_label?: string;
    slot_type?: string;
    bench_index?: number | null;
    bench_role?: string | null;
    greater_boon?: Boon | null;
    lesser_boon?: Boon | null;
    modifications: any[];
    stats: DerivedPlayerStats;
}

export type Bench = {
    batters: TeamPlayer[];
    pitchers: TeamPlayer[];
}

export type Team = {
    abbreviation: string;
    ballpark_name?: string,
    ballpark_use_city?: boolean,
    bench?: Bench;
    championships: number;
    color: string;
    emoji: string;
    full_location: string;
    league: string;
    location: string;
    modifications: any[];
    name: string;
    players: TeamPlayer[];
    record: {
        regular_season: {
            losses: number;
            run_differential: number;
            wins: number
        };
    };
    season_records: Record<string, string>;
    id: string;
}

export function MapTeamLite(data: any): Team {
    data = data.data;
    
    const mapPlayer = (p: any) => ({
        emoji: p.Emoji,
        first_name: p.FirstName,
        last_name: p.LastName,
        number: p.Number,
        player_id: p.PlayerID,
        position: p.Position,
        position_type: p.PositionType,
        slot: p.Slot,
        slot_label: p.SlotLabel,
        slot_type: p.SlotType,
        bench_index: p.BenchIndex,
        bench_role: p.BenchRole,
        greater_boon: p.GreaterBoon,
        lesser_boon: p.LesserBoon,
        modifications: p.Modifications || [],
        stats: null
    });

    return {
        abbreviation: data.Abbreviation,
        ballpark_name: data.BallparkName,
        ballpark_use_city: data.BallparkUseCity,
        bench: data.Bench ? {
            batters: (data.Bench.Batters || []).map(mapPlayer),
            pitchers: (data.Bench.Pitchers || []).map(mapPlayer)
        } : undefined,
        championships: data.Championships,
        color: data.Color,
        emoji: data.Emoji,
        full_location: data.FullLocation,
        league: data.League,
        location: data.Location,
        modifications: data.Modifications,
        name: data.Name,
        players: data.Players.map(mapPlayer),
        record: {
            regular_season: {
                losses: data.Record["Regular Season"].Losses,
                run_differential: data.Record["Regular Season"].RunDifferential,
                wins: data.Record["Regular Season"].Wins,
            },
        },
        season_records: data.SeasonRecords,
        id: data._id,
    };
}

export function MapAPITeamResponse(data: any): Team {
    const mapPlayer = (p: any) => ({
        emoji: p.Emoji,
        first_name: p.FirstName,
        last_name: p.LastName,
        number: p.Number,
        player_id: p.PlayerID,
        position: p.Position,
        position_type: p.PositionType,
        slot: p.Slot,
        slot_label: p.SlotLabel,
        slot_type: p.SlotType,
        bench_index: p.BenchIndex,
        bench_role: p.BenchRole,
        greater_boon: mapBoon(p.GreaterBoon),
        lesser_boon: mapBoon(p.LesserBoon),
        modifications: p.Modifications || [],
        stats: MapAPIPlayerStats(p.Stats as Partial<PlayerStats>)
    });

    return {
        abbreviation: data.Abbreviation,
        ballpark_name: data.BallparkName,
        ballpark_use_city: data.BallparkUseCity,
        bench: data.Bench ? {
            batters: (data.Bench.Batters || []).map(mapPlayer),
            pitchers: (data.Bench.Pitchers || []).map(mapPlayer)
        } : undefined,
        championships: data.Championships,
        color: data.Color,
        emoji: data.Emoji,
        full_location: data.FullLocation,
        league: data.League,
        location: data.Location,
        modifications: data.Modifications,
        name: data.Name,
        players: data.Players.map(mapPlayer),
        record: {
            regular_season: {
                losses: data.Record["Regular Season"].Losses,
                run_differential: data.Record["Regular Season"].RunDifferential,
                wins: data.Record["Regular Season"].Wins,
            },
        },
        season_records: data.SeasonRecords,
        id: data._id,
    };
}

export function MapAPILeagueTeamResponse(data: any): Team {
    const regularSeasonRecord = data.Record?.["Regular Season"] ?? {};

    return {
        abbreviation: data.Abbreviation,
        ballpark_name: data.BallparkName,
        championships: data.Championships,
        color: data.Color,
        emoji: data.Emoji,
        full_location: data.FullLocation,
        league: data.League,
        location: data.Location,
        modifications: data.Modifications,
        name: data.Name,
        players: [{
            emoji: '',
            first_name: '',
            last_name: '',
            number: 0,
            player_id: '',
            position: '',
            position_type: '',
            slot: '',
            modifications: [],
            stats: MapAPIPlayerStats(defaultStats)
        }],
        record: {
            regular_season: {
                losses: regularSeasonRecord.Losses ?? 0,
                run_differential: regularSeasonRecord.RunDifferential ?? 0,
                wins: regularSeasonRecord.Wins ?? 0,
            },
        },
        season_records: data.SeasonRecords,
        id: data._id,
    };
}

export const PlaceholderTeam: Team = {
    abbreviation: "PHT",
    championships: 0,
    color: 'ffffff',
    emoji: '🧩',
    full_location: 'Placeholder, Placeholder',
    league: 'placeholder',
    location: 'Placeholder',
    modifications: [],
    name: 'Placeholders',
    players: [],
    record: {
        regular_season: {
            wins: 0,
            losses: 0,
            run_differential: 0
        }
    },
    season_records: {'placeholder': 'placeholder'},
    id: 'placeholder'
}
