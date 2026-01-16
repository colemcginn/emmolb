import { usePlayer } from "@/hooks/api/Player";
import { useMmolbTime } from "@/hooks/api/Time";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { BattingStats, BattingStatsTable } from "./BattingStats";
import { PitchingStats, PitchingStatsTable } from "./PitchingStats";
import { FieldingStats, FieldingStatsTable } from "./FieldingStats";
import { LoadingMini } from "../Loading";
import { fetchPlayerRecords } from "@/types/Api";

export type Season = {
    season: number;
}

export type ColumnDef<T> = {
    name: string;
    description: string;
    numerator: (stats: T) => number | undefined;
    divisor?: (stats: T) => number | undefined;
    aggregate?: (col: ColumnDef<T>, stats: T[]) => number | undefined;
    format?: (value: number) => number | string;
    default?: string;
}

export type PlayerStatsTableProps<T extends Season> = {
    columns: ColumnDef<Omit<T, 'season'>>[];
    stats: T[];
}

export function selectSum<T>(array: T[], selector: (obj: T) => number) {
    return array.reduce((prev, current) => prev + selector(current), 0);
}

function defaultAggregator<T>(col: ColumnDef<T>, stats: T[]) {
    const numeratorSum = selectSum(stats, seasonStats => col.numerator(seasonStats) ?? 0);
    if (!col.divisor)
        return numeratorSum;

    const divisorSum = selectSum(stats, seasonStats => col.divisor!(seasonStats) ?? 0);
    return divisorSum !== 0 ? numeratorSum / divisorSum : undefined;
}

export function PlayerStatsTable<T extends Season>({ columns, stats }: PlayerStatsTableProps<T>) {
    const rows = useMemo(() => stats.map(seasonStats => {
        return {
            season: seasonStats.season, values: columns.map(col => {
                const numerator = col.numerator(seasonStats);
                const divisor = (col.divisor && col.divisor(seasonStats)) ?? 1;
                const value = divisor !== 0 && numerator !== undefined ? numerator / divisor : undefined;
                return value === undefined ? col.default ?? '—' : col.format ? col.format(value) : value.toLocaleString('en-US');
            })
        };
    }), [columns, stats]);

    const totals = useMemo(() => columns.map(col => {
        const value = (col.aggregate ? col.aggregate : defaultAggregator)(col, stats);
        return value === undefined ? col.default ?? '—' : col.format ? col.format(value) : value.toLocaleString('en-US');
    }), [columns, stats]);

    return (
        <div className="max-w-full overflow-x-auto" style={{ scrollbarColor: 'var(--theme-primary) var(--theme-background)' }}>
            <table className="table">
                <thead className="table-header-group">
                    <tr className="table-row">
                        <th className="table-cell sticky left-0 text-xs font-semibold uppercase px-1.5 py-0.5 bg-(--theme-background)">
                            Season
                        </th>
                        {columns.map((col, i) => (
                            <th key={i} className="table-cell text-center text-xs px-1.5 py-0.5 font-semibold uppercase" title={col.description}>
                                {col.name}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="table-row-group">
                    {rows.map((row, i) => (
                        <tr key={i} className="table-row border-t-1 first:border-(--theme-text) border-(--theme-text)/50 even:bg-(--theme-secondary) odd:bg-(--theme-primary)">
                            <td className={`table-cell sticky left-0 text-sm text-center px-1.5 py-0.5 ${i % 2 === 1 ? 'bg-(--theme-secondary)' : 'bg-(--theme-primary)'}`}>
                                {row.season}
                            </td>
                            {row.values.map((value, j) => (
                                <td key={j} className="table-cell text-sm text-right px-1.5 py-0.5 tabular-nums border-l-1 border-(--theme-text)/25 border-dotted">
                                    {value}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
                <tfoot className="table-footer-group">
                    <tr className="table-row border-y-1 border-(--theme-text)">
                        <td className="table-cell sticky left-0 text-sm font-semibold px-1.5 py-0.5 bg-(--theme-background)">
                            Career
                        </td>
                        {totals.map((value, i) => (
                            <td key={i} className="table-cell text-sm font-semibold text-right px-1.5 py-0.5 tabular-nums border-l-1 border-(--theme-text)/25 border-dotted">
                                {value}
                            </td>
                        ))}
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}

type PlayerStatsTablesProps = {
    playerId: string
};



export default function PlayerStatsTables({ playerId }: PlayerStatsTablesProps) {
    const { data: currentSeason } = useMmolbTime({
        select: time => time.seasonNumber
    });
    const { data: player, isPending: currentSeasonStatsPending } = usePlayer({
        playerId,
        select: player => ({ posType: player.position_type, currentSeasonStats: player.stats[player.team_id] }),
    });
    // const { data: cashewsStats } = useQuery({
    //     queryKey: ['player-cashews-stats', playerId],
    //     queryFn: async () => {
    //         const res = await fetch(`/nextapi/player/${playerId}/cashews-stats`);
    //         if (!res.ok) throw new Error('Failed to load player stats');
    //         return await res.json() as (Season & BattingStats & PitchingStats & FieldingStats)[];
    //     },
    //     staleTime: 60 * 60 * 1000,
    // });

    // get playerRecords and parse them
    const { data: cashewsStats } = useQuery({
        queryKey: ['player-cashews-stats', playerId],
        queryFn: async () => {
            const data = await fetchPlayerRecords(playerId);
            const parsedRecords = data as any[];
            // Transform parsedRecords into desired format
            const transformedStats = parsedRecords.map((record: any) => {
                const seasonStats: any = { season: record.Season };

                for (const teamStats of Object.values(record.Stats)) {
                    for (const [statKey, statValue] of Object.entries(teamStats as any)) {
                        if (typeof statValue === 'number') {
                            seasonStats[statKey] = (seasonStats[statKey] || 0) + statValue;
                        }
                    }
                }

                return seasonStats;
            });

            return transformedStats as (Season & BattingStats & PitchingStats & FieldingStats)[];
        },
        staleTime: 60 * 60 * 1000,
    });

    const allSeasonsStats = useMemo(() => {
        const seasons = player?.currentSeasonStats && currentSeason
            ? [{ ...player?.currentSeasonStats, season: currentSeason }, ...(cashewsStats?.filter(x => x.season !== currentSeason) ?? [])]
            : [...(cashewsStats ?? [])];
        return seasons.sort((a, b) => b.season - a.season);
    }, [currentSeason, player?.currentSeasonStats, cashewsStats]);

    if (currentSeasonStatsPending || !cashewsStats)
        return <div className="h-80"><LoadingMini /></div>

    return (
        <div className="flex flex-col gap-8 max-w-full">
            {player?.posType === 'Batter' ?
                <>
                    <BattingStatsTable playerId={playerId} data={allSeasonsStats} />
                    <FieldingStatsTable playerId={playerId} data={allSeasonsStats} />
                    <PitchingStatsTable playerId={playerId} data={allSeasonsStats} />
                </> : <>
                    <PitchingStatsTable playerId={playerId} data={allSeasonsStats} />
                    <FieldingStatsTable playerId={playerId} data={allSeasonsStats} />
                    <BattingStatsTable playerId={playerId} data={allSeasonsStats} />
                </>
            }
        </div>
    );
}
