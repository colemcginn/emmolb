'use client'
import Loading from "@/components/Loading";
import { useMemo, useState } from "react";
import { Player } from "@/types/Player";
import { usePlayer } from "@/hooks/api/Player";
import { useTeam } from "@/hooks/api/Team";
import PlayerAttributes from "./PlayerAttributes";
import { PitchSelectionChart, PitchUsageChart } from "./PitchSelectionChart";
import Link from "next/link";
import { PlayerPageHeader } from "./PlayerPageHeader";
import PlayerStatsTables from "./PlayerStatsTables";
import { useSearchParams, useRouter } from "next/navigation";
import { PlayerFeed } from "./PlayerFeed";
import { TeamPlayer } from "@/types/Team";

const tabDefs: Record<string, string> = {
    stats: 'Stats',
    charts: 'Charts',
    attributes: 'Attributes',
    feed: 'Feed',
};

type PlayerPageProps = {
    id: string;
}

export function PlayerPage({ id }: PlayerPageProps) {
    const { data: player, isPending: playersIsPending } = usePlayer({
        playerId: id
    });

    const { data: teamData, isPending: teamIsPending } = useTeam({
        teamId: player?.team_id
    });

    // add bench players too
    const team = useMemo(() => {
        if (!teamData) return undefined;
        
        const allPlayers = [
            ...teamData.players,
            ...(teamData.bench?.batters || []),
            ...(teamData.bench?.pitchers || [])
        ];
        
        return { ...teamData, players: allPlayers };
    }, [teamData]);

    const searchParams = useSearchParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState(() => {
        const tab = searchParams.get('tab');
        if (tab && Object.keys(tabDefs).includes(tab))
            return tab;

        return 'stats';
    });

    const joinedPlayer = useMemo(() => {
        if (!player || !team)
            return undefined;

        return { ...(team.players.find(x => x.player_id == player.id) as any), ...(player as Player) };
    }, [player, team]);

    const playerIndex = useMemo(() => {
        if (!team || !player) return -1;
        return team.players.findIndex(p => p.player_id === player.id);
    }, [team, player]);

    const previousPlayer = useMemo(() => {
        if (playerIndex <= 0) return null;
        return team?.players[playerIndex - 1];
    }, [team, playerIndex]);

    const nextPlayer = useMemo(() => {
        if (!team || playerIndex >= team.players.length - 1) return null;
        return team.players[playerIndex + 1];
    }, [team, playerIndex]);

    function handleTabClick(newTab: string) {
        setActiveTab(newTab);
        router.replace(`/player/${id}?tab=${newTab}`, { scroll: false });
    }

    if (playersIsPending || teamIsPending) return (
        <Loading />
    );

    if (!player || !team) return (
        <div className="text-(--theme-text) text-center mt-10">Can't find that player</div>
    );

    return (
        <main className="mt-16">
            <div className="flex flex-col items-center-safe min-h-screen bg-theme-background text-theme-text font-sans max-w-screen px-4 pt-12 mb-4">
                <div className="flex w-full justify-between max-w-2xl px-2 py-2 items-center">
                    <div className="w-1/3 flex justify-start">
                        {previousPlayer ? (
                            <Link href={`/player/${previousPlayer.player_id}?${searchParams}`} passHref replace>
                                <button className="px-2 py-2 text-xs sm:text-sm font-semibold rounded-md bg-theme-primary ellipsis hover:opacity-80 inline-block overflow-hidden text-ellipsis whitespace-nowrap max-w-xs">
                                    ← {previousPlayer.first_name} {previousPlayer.last_name} ({previousPlayer.slot})
                                </button>
                            </Link>
                        ) : (
                            <div className="w-full"></div>
                        )}
                    </div>
                    <div className="flex items-center">
                        <select className="bg-theme-primary text-theme-text px-2 py-1 rounded md:w-fit w-20" value={id} onChange={(e) => router.replace(`/player/${e.target.value}?${searchParams}`, { scroll: false })}>
                            {team.players && team.players.map((player: TeamPlayer) => (
                                <option key={player.player_id} value={player.player_id}>
                                    {player.first_name} {player.last_name} ({player.slot})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="w-1/3 flex justify-end">
                        {nextPlayer ? (
                            <Link href={`/player/${nextPlayer.player_id}?${searchParams}`} passHref replace>
                                <button className="px-2 py-2 text-xs sm:text-sm font-semibold rounded-md bg-theme-primary hover:opacity-80 inline-block overflow-hidden text-ellipsis whitespace-nowrap max-w-xs">
                                    {nextPlayer.first_name} {nextPlayer.last_name} ({nextPlayer.slot}) →
                                </button>
                            </Link>
                        ) : (
                            <div className="w-full"></div>
                        )}
                    </div>
                </div>
                <PlayerPageHeader player={joinedPlayer} team={team} />

                <div className="flex flex-wrap gap-1 justify-center my-4">
                    {Object.keys(tabDefs).map(tab =>
                        <div key={tab} className={`py-1 px-3 text-base rounded-full ${tab == activeTab ? 'bg-(--theme-selected) font-semibold cursor-default' : 'hover:bg-(--theme-selected)/50 cursor-pointer'}`} onClick={() => handleTabClick(tab)}>
                            {tabDefs[tab]}
                        </div>
                    )}
                </div>

                {activeTab === 'stats' && <PlayerStatsTables playerId={id} />}
                {activeTab === 'charts' && (
                    <>
                        {player.position_type === 'Pitcher'
                            ? <PitchUsageChart id={id} />
                            : <div>Batter charts coming soon!</div>}
                        <PitchSelectionChart player={player} />
                    </>

                )}
                {activeTab === 'attributes' && <PlayerAttributes player={{ ...player, slot: joinedPlayer.slot }} />}
                {activeTab === 'feed' && <PlayerFeed playerId={id} />}
            </div>
        </main>
    );
}
