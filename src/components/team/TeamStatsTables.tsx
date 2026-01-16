import { useMemo, useState } from "react";
import { Team, TeamPlayer } from "@/types/Team";
import { DerivedPlayerStats } from "@/types/PlayerStats";
import { ColumnDef } from "../player/PlayerStatsTables";
import { slotsList } from "./Constants";
import Link from "next/link";
import { usePersistedState } from "@/hooks/PersistedState";
import { Checkbox } from "./Checkbox";
import { useQueries } from "@tanstack/react-query";
import { fetchPlayerRecords } from "@/types/Api";

const SETTING_SHOW_BENCH = 'teamStatsTables_showBench';

type TeamStatsTablesProps = {
    team: Team
};

export type TeamPlayerProp = {
    name: string;
    player: TeamPlayer;
}

const BattingTableColumns: ColumnDef<TeamPlayerProp & DerivedPlayerStats>[] = [
    {
        name: 'PA',
        description: 'Plate Appearances',
        numerator: stats => stats.plate_appearances,
    },
    {
        name: 'R',
        description: 'Runs',
        numerator: stats => stats.runs,
    },
    {
        name: 'H',
        description: 'Hits',
        numerator: stats => stats.hits,
    },
    {
        name: '2B',
        description: 'Doubles',
        numerator: stats => stats.doubles,
    },
    {
        name: '3B',
        description: 'Triples',
        numerator: stats => stats.triples,
    },
    {
        name: 'HR',
        description: 'Home Runs',
        numerator: stats => stats.home_runs,
    },
    {
        name: 'RBI',
        description: 'Runs Batted In',
        numerator: stats => stats.runs_batted_in,
    },
    {
        name: 'HBP',
        description: 'Hit By Pitch',
        numerator: stats => stats.hit_by_pitch,
    },
    {
        name: 'BB',
        description: 'Walks',
        numerator: stats => stats.walked,
    },
    {
        name: 'BB%',
        description: 'Walks / Plate Appearences',
        numerator: stats => stats.walked,
        divisor: stats => stats.plate_appearances,
        format: value => (value * 100).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
    },
    {
        name: 'SO',
        description: 'Strikeouts',
        numerator: stats => stats.struck_out,
    },
    {
        name: 'SO%',
        description: 'Strikeouts / Plate Appearences',
        numerator: stats => stats.struck_out,
        divisor: stats => stats.plate_appearances,
        format: value => (value * 100).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
    },
    {
        name: 'BA',
        description: 'Batting Average',
        numerator: stats => stats.hits,
        divisor: stats => stats.at_bats,
        format: value => value.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 }),
    },
    {
        name: 'OBP',
        description: 'On Base Percentage',
        numerator: stats => stats.obp,
        format: value => value.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 }),
    },
    {
        name: 'SLG',
        description: 'Slugging Percentage',
        numerator: stats => stats.slg,
        format: value => value.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 }),
    },
    {
        name: 'OPS',
        description: 'On Base Plus Slugging',
        numerator: stats => stats.obp + stats.slg,
        format: value => value.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 }),
    },
    {
        name: 'BABIP',
        description: 'Batting Average of Balls In Play',
        numerator: stats => stats.hits - stats.home_runs,
        divisor: stats => stats.at_bats - stats.struck_out - stats.home_runs + stats.sac_flies,
        format: value => value.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 }),
    },
    {
        name: 'TB',
        description: 'Total Bases',
        numerator: stats => stats.total_bases,
    },
    {
        name: 'SB',
        description: 'Stolen Bases',
        numerator: stats => stats.stolen_bases,
    },
    {
        name: 'CS',
        description: 'Caught Stealing',
        numerator: stats => stats.caught_stealing,
    },
    {
        name: 'SB%',
        description: 'Stolen Bases / Attempts',
        numerator: stats => stats.stolen_bases,
        divisor: stats => stats.stolen_bases + stats.caught_stealing,
        format: value => (value * 100).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
    },
];

const PitchingTableColumns: ColumnDef<TeamPlayerProp & DerivedPlayerStats>[] = [
    {
        name: 'GP',
        description: 'Games Played',
        numerator: stats => stats.appearances,
    },
    {
        name: 'IP',
        description: 'Innings Pitched',
        numerator: stats => stats.ip,
        format: value => value.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
    },
    {
        name: 'W',
        description: 'Wins',
        numerator: stats => stats.wins,
    },
    {
        name: 'L',
        description: 'Losses',
        numerator: stats => stats.losses,
    },
    {
        name: 'SV',
        description: 'Saves',
        numerator: stats => stats.saves,
    },
    {
        name: 'BS',
        description: 'Blown Saves',
        numerator: stats => stats.blown_saves,
    },
    {
        name: 'ER',
        description: 'Earned Runs',
        numerator: stats => stats.earned_runs,
    },
    {
        name: 'H',
        description: 'Hits Allowed',
        numerator: stats => stats.hits_allowed,
    },
    {
        name: 'HR',
        description: 'Home Runs Allowed',
        numerator: stats => stats.home_runs_allowed,
    },
    {
        name: 'K',
        description: 'Strikeouts',
        numerator: stats => stats.strikeouts,
    },
    {
        name: 'HB',
        description: 'Hit Batters',
        numerator: stats => stats.hit_batters,
    },
    {
        name: 'BB',
        description: 'Walks',
        numerator: stats => stats.walks,
    },
    {
        name: 'ERA',
        description: 'Earned Run Average',
        numerator: stats => stats.era,
        format: value => value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    },
    {
        name: 'WHIP',
        description: 'Walks and Hits per Inning Pitched',
        numerator: stats => stats.whip,
        format: value => value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    },
    {
        name: 'H/9',
        description: 'Hits Allowed per 9 Innings',
        numerator: stats => stats.h9,
        format: value => value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    },
    {
        name: 'HR/9',
        description: 'Home Runs Allowed per 9 Innings',
        numerator: stats => stats.hr9,
        format: value => value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    },
    {
        name: 'K/9',
        description: 'Strikeouts per 9 Innings',
        numerator: stats => stats.k9,
        format: value => value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    },
    {
        name: 'BB/9',
        description: 'Walks per 9 Innings',
        numerator: stats => stats.bb9,
        format: value => value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    },
];

export type TeamStatsTableProps<T extends TeamPlayerProp> = {
    columns: ColumnDef<T>[];
    stats: T[];
}


function TeamStatsTable<T extends TeamPlayerProp>({ columns, stats }: TeamStatsTableProps<T>) {
    const [sorting, setSorting] = useState({ field: 'default', ascending: false });

    const rows = useMemo(() => {
        const mappedRows = stats.map(playerStats => {
            return {
                name: playerStats.name,
                position: playerStats.player.slot,
                playerId: playerStats.player.player_id,
                values: columns.map(col => {
                    const numerator = col.numerator(playerStats);
                    const divisor = (col.divisor && col.divisor(playerStats)) ?? 1;
                    const value = divisor !== 0 && numerator !== undefined ? numerator / divisor : undefined;
                    return value === undefined ? col.default ?? '—' : col.format ? col.format(value) : value.toLocaleString('en-US');
                })
            };
        });

        return mappedRows.sort((a, b) => {
            if (sorting.field === 'default') {
                return 0;
            }
            if (sorting.field === 'player') {
                return sorting.ascending ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
            }
            if (sorting.field === 'position') {
                const aIndex = slotsList.indexOf(a.position);
                const bIndex = slotsList.indexOf(b.position);
                return sorting.ascending ? aIndex - bIndex : bIndex - aIndex;
            }

            const colIndex = parseInt(sorting.field);
            // double parsing handles null values
            const aVal = parseFloat(String(a.values[colIndex])) || -Infinity;
            const bVal = parseFloat(String(b.values[colIndex])) || -Infinity;

            return sorting.ascending ? aVal - bVal : bVal - aVal;
        });
    }, [columns, stats, sorting]);

    return (
        <div className="max-w-full overflow-x-auto" style={{ scrollbarColor: 'var(--theme-primary) var(--theme-background)' }}>
            <table className="table">
                <thead className="table-header-group">
                    <tr className="table-row">
                        <th
                            className="table-cell sticky left-0 text-xs font-semibold uppercase px-1.5 py-0.5 bg-(--theme-background) cursor-pointer hover:bg-(--theme-text)/10"
                            onClick={() => setSorting(prev => ({
                                field: 'player',
                                ascending: prev.field === 'player' ? !prev.ascending : true
                            }))}
                        >
                            Player {sorting.field === 'player' && (sorting.ascending ? '↑' : '↓')}
                        </th>
                        <th
                            className="table-cell sticky left-0 text-xs font-semibold uppercase px-1.5 py-0.5 bg-(--theme-background) cursor-pointer hover:bg-(--theme-text)/10"
                            onClick={() => setSorting(prev => ({
                                field: 'position',
                                ascending: prev.field === 'position' ? !prev.ascending : true
                            }))}
                        >
                            Pos {sorting.field === 'position' && (sorting.ascending ? '↑' : '↓')}
                        </th>
                        {columns.map((col, i) => (
                            <th
                                key={i}
                                className="table-cell text-center text-xs px-1.5 py-0.5 font-semibold uppercase cursor-pointer hover:bg-(--theme-text)/10"
                                title={col.description}
                                onClick={() => setSorting(prev => ({
                                    field: i.toString(),
                                    ascending: prev.field === i.toString() ? !prev.ascending : false
                                }))}
                            >
                                {col.name} {sorting.field === i.toString() && (sorting.ascending ? '↑' : '↓')}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="table-row-group">
                    {rows.map((row, i) => (
                        <tr key={i} className="table-row border-t-1 first:border-(--theme-text) border-(--theme-text)/50 even:bg-(--theme-secondary) odd:bg-(--theme-primary)">
                            <td className={`table-cell sticky left-0 text-sm text-left px-1.5 py-0.5 ${i % 2 === 1 ? 'bg-(--theme-secondary)' : 'bg-(--theme-primary)'}`}>
                                <Link className='hover:underline flex-grow' href={`/player/${row.playerId}`}>
                                    {row.name}
                                </Link>
                            </td>
                            <td className={`table-cell text-sm text-left px-1.5 py-0.5 ${i % 2 === 1 ? 'bg-(--theme-secondary)' : 'bg-(--theme-primary)'} border-l-1 border-(--theme-text)/25 border-dotted`}>
                                {row.position}
                            </td>
                            {row.values.map((value, j) => (
                                <td key={j} className="table-cell text-sm text-right px-1.5 py-0.5 tabular-nums border-l-1 border-(--theme-text)/25 border-dotted">
                                    {value}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}


export default function TeamStatsTables({ team }: TeamStatsTablesProps) {
    const [showBench, setShowBench] = usePersistedState(SETTING_SHOW_BENCH, false);

    const isBenchPlayer = (slot: string) => {
        return slot.startsWith('B') || slot.startsWith('P');
    };

    const allPlayers = [
        ...team.players,
        ...(team.bench?.batters || []),
        ...(team.bench?.pitchers || [])
    ];

    // Fetch player records for all players
    const playerRecordsQueries = useQueries({
        queries: allPlayers.map(player => ({
            queryKey: ['player-records', player.player_id],
            queryFn: () => fetchPlayerRecords(player.player_id),
            staleTime: 60 * 60 * 1000,
        }))
    });
    console.log(playerRecordsQueries);


    // Map players with their fetched records data
    const playersWithRecords = allPlayers.map((player, index) => {
        const queryResult = playerRecordsQueries[index];
        if (queryResult.isSuccess && queryResult.data && queryResult.data.length > 0) {
            // Get stats for season 10
            const season10Record = queryResult.data.find((record: any) => record.Season === 10);
            if (season10Record && season10Record.Stats) {
                const teamId = Object.keys(season10Record.Stats)[0];
                const recordStats = season10Record.Stats[teamId];
                
                // Calculate hits and total bases
                recordStats.hits = (recordStats.singles || 0) + (recordStats.doubles || 0) + (recordStats.triples || 0) + (recordStats.home_runs || 0);
                recordStats.total_bases = (recordStats.singles || 0) + (2 * (recordStats.doubles || 0)) + (3 * (recordStats.triples || 0)) + (4 * (recordStats.home_runs || 0));
                recordStats.obp = recordStats.plate_appearances > 0 ? ( (recordStats.hits || 0) + (recordStats.walked || 0) + (recordStats.hit_by_pitch || 0) ) / recordStats.plate_appearances : 0;
                recordStats.slg = recordStats.at_bats > 0 ? ( recordStats.total_bases || 0 ) / recordStats.at_bats : 0;
                recordStats.ip = recordStats.outs ? recordStats.outs / 3 : 0;
                recordStats.era = recordStats.ip > 0 ? ( recordStats.earned_runs || 0 ) * 9 / recordStats.ip : 0;
                recordStats.whip = recordStats.ip > 0 ? ( (recordStats.walks || 0) + (recordStats.hits_allowed || 0) ) / recordStats.ip : 0;
                recordStats.h9 = recordStats.ip > 0 ? (recordStats.hits_allowed || 0) * 9 / recordStats.ip : 0;
                recordStats.hr9 = recordStats.ip > 0 ? (recordStats.home_runs_allowed || 0) * 9 / recordStats.ip : 0;
                recordStats.k9 = recordStats.ip > 0 ? (recordStats.strikeouts || 0) * 9 / recordStats.ip : 0;
                recordStats.bb9 = recordStats.ip > 0 ? (recordStats.walks || 0) * 9 / recordStats.ip : 0;

                return {
                    ...player,
                    stats: recordStats || player.stats
                };
            }
        }
        return player;
    });

    const visiblePlayers = showBench ? playersWithRecords : playersWithRecords.filter(p => !isBenchPlayer(p.slot));

    const batterStats = useMemo(() =>
        visiblePlayers
            .filter(player => player.stats.plate_appearances > 0)
            .map((player: TeamPlayer) => ({
                ...player.stats,
                player: player,
                name: player.first_name + ' ' + player.last_name,
            } as TeamPlayerProp & DerivedPlayerStats)), [visiblePlayers]);

    const pitcherStats = useMemo(() =>
        visiblePlayers
            .filter(player => player.stats.appearances > 0)
            .map((player: TeamPlayer) => ({
                ...player.stats,
                player: player,
                name: player.first_name + ' ' + player.last_name,
            } as TeamPlayerProp & DerivedPlayerStats)), [visiblePlayers]);

    return (
        <div className="flex flex-col gap-8 mb-4 max-w-full">
            <div className="flex justify-center">
                <Checkbox checked={showBench} label="Show Bench Players" onChange={setShowBench} />
            </div>
            <div className="flex flex-col gap-2 items-start max-w-full">
                <h2 className="text-xl font-bold ml-1">Batting</h2>
                <TeamStatsTable stats={batterStats} columns={BattingTableColumns} />
            </div>
            <div className="flex flex-col gap-2 items-start max-w-full">
                <h2 className="text-xl font-bold ml-1">Pitching</h2>
                <TeamStatsTable stats={pitcherStats} columns={PitchingTableColumns} />
            </div>
        </div>
    );
}
