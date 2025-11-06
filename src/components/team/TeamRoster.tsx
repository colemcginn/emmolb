'use client'
import Loading from "@/components/Loading";
import { useState } from "react";
import { Team } from "@/types/Team";
import { DerivedPlayerStats } from "@/types/PlayerStats";
import { usePlayers } from "@/hooks/api/Player";
import Link from "next/link";
import { Tooltip } from "@/components/ui/Tooltip";
import { formatBoonDescription } from "./BoonDictionary";

const statKeyMap: Record<string, string> = {
    "AVG": "ba",
    "OBP": "obp",
    "SLG": "slg",
    "OPS": "ops",
    "Hits": "hits",
    "Singles": "singles",
    "Doubles": "doubles",
    "Triples": "triples",
    "Home Runs": "home_runs",
    "Total Bases": "total_bases",
    "Walked": "walked",
    "Hit By Pitch": "hit_by_pitch",
    "Struck Out": "struck_out",
    "Plate Appearances": "plate_appearances",
    "At Bats": "at_bats",
    "Stolen Bases": "stolen_bases",
    "Caught Stealing": "caught_stealing",
    "Grounded Into Double Plays": "grounded_into_double_play",
    "ERA": "era",
    "WHIP": "whip",
    "K/BB": "kbb",
    "K/9": "k9",
    "H/9": "h9",
    "BB/9": "bb9",
    "HR/9": "hr9",
    "Innings Pitched": "ip",
    "Strikeouts": "strikeouts",
    "Walks": "walks",
    "Hits Allowed": "hits_allowed",
    "Hit Batters": "hit_batters",
    "Earned Runs": "earned_runs",
    "Wins": "wins",
    "Losses": "losses",
    "Quality Starts": "quality_starts",
    "Saves": "saves",
    "Blown Saves": "blown_saves",
    "Appearances": "appearances",
    "Games Finished": "games_finished",
    "Complete Games": "complete_games",
    "Shutouts": "shutouts",
    "No Hitters": "no_hitters",
    "Errors": "errors",
    "Assists": "assists",
    "Putouts": "putouts",
    "Double Plays": "double_plays",
    "Runners Caught Stealing": "runners_caught_stealing"
};


type TeamRosterProps = {
    team: Team;
}

export function TeamRoster({ team }: TeamRosterProps) {
    const { data: players, isPending: playersIsPending } = usePlayers({
        playerIds: team?.players?.map(p => p.player_id)
    });

    const [sortStat, setSortStat] = useState<string>('');

    if (playersIsPending) return (
        <>
            <Loading />
        </>
    );

    const reverseSortStats = new Set([
        "era", "whip", "bb9", "h9", "hr9", "losses", "blown_saves", "errors"
    ]);

    const sortedPlayers = team.players ? [...team.players].sort((a, b) => {
        if (!sortStat || !players) return 0;

        const statKey = statKeyMap[sortStat] as keyof DerivedPlayerStats;
        const aStats = a.stats[statKey];
        const bStats = b.stats[statKey];

        const aValue = typeof aStats === 'number' ? aStats : Infinity;
        const bValue = typeof bStats === 'number' ? bStats : Infinity;

        const reverse = reverseSortStats.has(statKey);

        if (!Number.isFinite(aValue) && !Number.isFinite(bValue)) return 0;
        if (!Number.isFinite(aValue)) return 1;
        if (!Number.isFinite(bValue)) return -1;

        return reverse ? aValue - bValue : bValue - aValue;
    }) : [];


    const sortedBench = team.players ? [...(team.bench?.batters || []),
    ...(team.bench?.pitchers || [])].sort((a, b) => {
        if (!sortStat || !players) return 0;

        const statKey = statKeyMap[sortStat] as keyof DerivedPlayerStats;
        const aStats = a.stats[statKey];
        const bStats = b.stats[statKey];

        const aValue = typeof aStats === 'number' ? aStats : Infinity;
        const bValue = typeof bStats === 'number' ? bStats : Infinity;

        const reverse = reverseSortStats.has(statKey);

        if (!Number.isFinite(aValue) && !Number.isFinite(bValue)) return 0;
        if (!Number.isFinite(aValue)) return 1;
        if (!Number.isFinite(bValue)) return -1;

        return reverse ? aValue - bValue : bValue - aValue;
    }) : [];

    const renderPlayerRow = (player: any, i: number) => {
        const statKey = statKeyMap[sortStat] as keyof DerivedPlayerStats;
        const rawStat = statKey && player ? player.stats[statKey] : null;
        const formattedStat = typeof rawStat === 'number' ? !Number.isFinite(rawStat) ? '-' : ['ba', 'obp', 'slg', 'ops', 'era', 'whip', 'kbb', 'k9', 'bb9', 'h9', 'hr9'].includes(statKey!) ? rawStat.toFixed(3) : Math.round(rawStat).toString() : '';
        const isCorrupted = players?.find(x => x.id === player.player_id)?.modifications?.some(x => x.name === 'Corrupted');
        
        return (
            <div key={i}>
                <Link href={`/player/${player.player_id}`}>
                    <div className={`flex justify-between items-center p-1 rounded link-hover cursor-pointer transition ${isCorrupted && 'border-2 border-red-600/20'}`}>
                        <div className="flex items-center gap-3 w-full">
                            <span className="w-4 text-xl text-center">{player.emoji}</span>
                            <span className="w-8 text-sm text-right">#{player.number}</span>
                            <span className="w-6 text-sm font-bold text-theme-text opacity-80 text-right">{player.slot}</span>
                            <span className="flex-1 font-semibold text-left overflow-hidden text-ellipsis whitespace-nowrap">{player.first_name} {player.last_name}</span>
                            {sortStat ? (
                                <span className="ml-auto w-20 text-right text-sm opacity-70 text-theme-text font-mono">
                                    {formattedStat}
                                </span>
                            ) : (
                                <span className="ml-auto w-20 text-right text-base text-theme-text font-mono flex gap-1 justify-end">
                                    {isCorrupted && (
                                        <Tooltip content="Corrupted" position="top">
                                            <span>🫀</span>
                                        </Tooltip>
                                    )}
                                    {player.greater_boon?.emoji && (
                                        <Tooltip content={player.greater_boon.description} position="top">
                                            <span>{player.greater_boon.emoji}</span>
                                        </Tooltip>
                                    )}
                                    {player.lesser_boon?.emoji && (
                                        <Tooltip content={formatBoonDescription(player.lesser_boon)} position="top">
                                            <span>{player.lesser_boon.emoji}</span>
                                        </Tooltip>
                                    )}
                                </span>
                            )}
                        </div>
                    </div>
                </Link>
            </div>
        );
    };

    return (
        <>
            <div className="mb-4 text-center">
                <label className="mr-2 font-semibold">Sort by:</label>
                <select className="bg-theme-primary text-theme-text px-2 py-1 rounded" value={sortStat} onChange={(e) => setSortStat(e.target.value)}>
                    <option value="">Default</option>
                    <optgroup label="Batting">
                        <option value="AVG">AVG</option>
                        <option value="OBP">OBP</option>
                        <option value="SLG">SLG</option>
                        <option value="OPS">OPS</option>
                        <option value="Hits">Hits</option>
                        <option value="Singles">Singles</option>
                        <option value="Doubles">Doubles</option>
                        <option value="Triples">Triples</option>
                        <option value="Home Runs">Home Runs</option>
                        <option value="Total Bases">Total Bases</option>
                        <option value="Walked">Walked</option>
                        <option value="Hit By Pitch">Hit By Pitch</option>
                        <option value="Struck Out">Struck Out</option>
                        <option value="Plate Appearances">Plate Appearances</option>
                        <option value="At Bats">At Bats</option>
                        <option value="Stolen Bases">Stolen Bases</option>
                        <option value="Caught Stealing">Caught Stealing</option>
                        <option value="Grounded Into Double Plays">Grounded Into Double Plays</option>
                    </optgroup>
                    <optgroup label="Pitching">
                        <option value="ERA">ERA</option>
                        <option value="WHIP">WHIP</option>
                        <option value="K/BB">K/BB</option>
                        <option value="K/9">K/9</option>
                        <option value="H/9">H/9</option>
                        <option value="BB/9">BB/9</option>
                        <option value="HR/9">HR/9</option>
                        <option value="Innings Pitched">Innings Pitched</option>
                        <option value="Strikeouts">Strikeouts</option>
                        <option value="Walks">Walks</option>
                        <option value="Hits Allowed">Hits Allowed</option>
                        <option value="Hit Batters">Hit Batters</option>
                        <option value="Earned Runs">Earned Runs</option>
                        <option value="Wins">Wins</option>
                        <option value="Losses">Losses</option>
                        <option value="Quality Starts">Quality Starts</option>
                        <option value="Saves">Saves</option>
                        <option value="Blown Saves">Blown Saves</option>
                        <option value="Appearances">Appearances</option>
                        <option value="Games Finished">Games Finished</option>
                        <option value="Complete Games">Complete Games</option>
                        <option value="Shutouts">Shutouts</option>
                        <option value="No Hitters">No Hitters</option>
                    </optgroup>
                    <optgroup label="Defense">
                        <option value="Errors">Errors</option>
                        <option value="Assists">Assists</option>
                        <option value="Putouts">Putouts</option>
                        <option value="Double Plays">Double Plays</option>
                        <option value="Runners Caught Stealing">Runners Caught Stealing</option>
                        <option value="RCS%">RCS%</option>
                    </optgroup>
                </select>
            </div>
            <div className="flex justify-center w-full mb-4">
                <div className="w-128 space-y-2">
                    {sortedPlayers.map(renderPlayerRow)}
                    <h2 className="text-xl font-bold my-4 text-center">Bench</h2>
                    {sortedBench.map(renderPlayerRow)}
                </div>
            </div>
        </>
    );
}
