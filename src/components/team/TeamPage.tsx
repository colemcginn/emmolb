'use client'
import Loading from "@/components/Loading";
import Link from "next/link";
import { Fragment, useState } from "react";
import { LiveGameCompact } from "../LiveGameCompact";
import { getContrastTextColor } from "@/helpers/ColorHelper";
import { useSettings } from "../Settings";
import TeamSchedule from "./TeamSchedule";
import SeasonTrophy from "../SeasonTrophy";
import { useFormattedNextDayCountdown } from "@/helpers/TimeHelper";
import { useSeasonWinners, useTeam } from "@/hooks/api/Team";
import { useGameByTeam, useGameHeader } from "@/hooks/api/Game";
import { TeamRoster } from "./TeamRoster";
import { TeamFeed } from "./TeamFeed";
import { Team } from "@/types/Team";
import { useRouter, useSearchParams } from "next/navigation";
import TeamItems from "./TeamItems";
import TeamAttributes from "./TeamAttributes";
import TeamStatsTables from "./TeamStatsTables";

const LeagueNames: Record<string, string> = {
    '6805db0cac48194de3cd3fe7': 'Baseball',
    '6805db0cac48194de3cd3fe8': 'Precision',
    '6805db0cac48194de3cd3fe9': 'Isosceles',
    '6805db0cac48194de3cd3fea': 'Liberty',
    '6805db0cac48194de3cd3feb': 'Maple',
    '6805db0cac48194de3cd3fec': 'Cricket',
    '6805db0cac48194de3cd3fed': 'Tornado',
    '6805db0cac48194de3cd3fee': 'Coleoptera',
    '6805db0cac48194de3cd3fef': 'Clean',
    '6805db0cac48194de3cd3ff0': 'Shiny',
    '6805db0cac48194de3cd3ff1': 'Psychic',
    '6805db0cac48194de3cd3ff2': 'Unidentified',
    '6805db0cac48194de3cd3ff3': 'Ghastly',
    '6805db0cac48194de3cd3ff4': 'Amphibian',
    '6805db0cac48194de3cd3ff5': 'Deep',
};

type TeamCurrentGameProps = {
    team: Team;
}

function TeamCurrentGame({ team }: TeamCurrentGameProps) {
    const { data: gameId } = useGameByTeam({
        teamId: team.id,
        refetchInterval: 60000,
    });
    const { data: game } = useGameHeader({ gameId });
    const { data: awayTeam } = useTeam({ teamId: game?.game.away_team_id });
    const { data: homeTeam } = useTeam({ teamId: game?.game.home_team_id });

    if (!gameId || !game || !awayTeam || !homeTeam || game.game.state == "Complete")
        return null;

    return <>
        <Link className='max-w-2xl' href={`/game/${gameId}`}>
            <LiveGameCompact homeTeam={homeTeam} awayTeam={awayTeam} game={game.game} gameId={gameId} killLinks={true} />
        </Link>
    </>;
}

type TeamPageProps = {
    id: string;
}

const tabDefs: Record<string, string> = {
    roster: 'Roster',
    schedule: 'Schedule',
    attributes: 'Attributes',
    stats: 'Stats',
    items: 'Equipment',
    feed: 'Feed',
};

function AugmentCountdown() {
    const countdown = useFormattedNextDayCountdown();
    return (
        <div className="bg-theme-primary max-w-2xl w-full rounded-xl shadow-lg p-6 text-center text-lg mb-6">
            <div className="mb-4 text-theme-text">Augments apply in <span className="font-mono">{countdown}</span></div>
            <a target="_blank" className="px-4 py-2 bg-theme-secondary text-theme-secondary rounded mb-4" href="https://mmolb.com/augment">
                <span>Edit Augment</span>
            </a>
        </div>
    );
}

export default function TeamPage({ id }: TeamPageProps) {
    const { settings } = useSettings();
    const [favorites, setFavorites] = useState<Set<string>>(() => new Set(JSON.parse(localStorage.getItem('favoriteTeamIDs') || '[]')));

    const { data: team, isPending: teamIsPending } = useTeam({
        teamId: id,
    });

    const { data: seasonChamps } = useSeasonWinners({});
    const leagueSeasonChamps: Record<number, string> = team && seasonChamps && seasonChamps[team.league];

    const searchParams = useSearchParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState(() => {
        const tab = searchParams.get('tab');
        if (tab && Object.keys(tabDefs).includes(tab))
            return tab;

        return 'roster';
    });

    function toggleFavorite(teamId: string) {
        setFavorites(prev => {
            const updated = new Set(prev);
            updated.has(teamId) ? updated.delete(teamId) : updated.add(teamId);

            localStorage.setItem('favoriteTeamIDs', JSON.stringify([...updated]));
            return updated;
        });
    }

    function handleTabClick(newTab: string) {
        setActiveTab(newTab);
        router.replace(`/team/${id}?tab=${newTab}`, { scroll: false });
    }

    if (teamIsPending) return (
        <>
            <Loading />
        </>
    );

    if (!team) return (
        <>
            <div className="text-white text-center mt-10">Can't find that team</div>
        </>
    );

    return (
        <>
            <main className="mt-16">
                <div className="flex flex-col items-center-safe min-h-screen bg-theme-background text-theme-text font-sans max-w-screen px-2 md:px-4 pt-24">
                    <div className="max-w-2xl relative w-full h-28 px-6 py-4 border-2 rounded-2xl shadow-xl border-theme-accent overflow-hidden mb-4 flex items-center" style={{ background: `#${team.color}`, color: getContrastTextColor(team.color) }}>
                        <button onClick={(e) => { e.stopPropagation(); toggleFavorite(team.id); }} className="absolute top-2 left-2 text-2xl z-10 hover:scale-110 transition-transform">
                            {favorites.has(team.id) ? '★' : '☆'}
                        </button>
                        <span className="text-7xl flex-shrink-0">
                            {team.emoji}
                        </span>
                        <div className="absolute inset-0 flex flex-col items-center justify-start mt-3 pointer-events-none px-2">
                            <Link href={`/league/${team.league}`}>
                                <span className="text-xl font-bold underline cursor-pointer pointer-events-auto hover:opacity-80 transition text-center whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                                    {LeagueNames[team.league]}
                                </span>
                            </Link>
                            <span className="text-2xl font-bold tracking-wide leading-tight">{team.location} {team.name}</span>
                            <span className="text-md pointer-events-auto hover:opacity-80 transition text-center whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                                🏟️: {team.ballpark_name}
                            </span>
                        </div>
                        <span className="absolute bottom-1 right-2 text-base font-semibold opacity-80 pointer-events-none">
                            {team.record.regular_season.wins} - {team.record.regular_season.losses}
                        </span>
                        <span className="absolute top-1 right-2 text-base font-semibold opacity-80 pointer-events-none">{team.record.regular_season.run_differential > 0 ? '+' : ''}{team.record.regular_season.run_differential}</span>
                    </div>

                    {leagueSeasonChamps && Object.values(leagueSeasonChamps).includes(team.id) && (
                        <div className="mb-4 mt-2 max-w-2xl w-auto shadow-md text-5xl px-2 py-2 space-x-0 flex rounded-sm bg-theme-primary">
                            {Object.entries(leagueSeasonChamps).filter(([_, champId]) => champId === team.id).map(([season]) => (
                                <SeasonTrophy key={season} season={Number(season)} />
                            ))}
                        </div>
                    )}

                    {settings.teamPage?.showLiveGames && <TeamCurrentGame team={team} />}

                    {settings.teamPage?.showMMOLBLinks && <AugmentCountdown />}

                    <h2 className="text-lg font-medium mb-2 text-center">External Links ↗️</h2>
                    <div className="mb-8 flex justify-center flex-wrap gap-3 text-sm">
                        {settings.teamPage?.showMMOLBLinks &&
                            <Fragment>
                                <a className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition flex flex-col items-center whitespace-nowrap" target="_blank" href="https://mmolb.com/manage-team/inventory">
                                    <span className="text-xl">🎒</span><span>Inventory</span>
                                </a>
                                <a className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition flex flex-col items-center whitespace-nowrap" target="_blank" href="https://mmolb.com/clubhouse">
                                    <span className="text-xl">🏟️</span><span>Clubhouse</span>
                                </a>
                                <a className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition flex flex-col items-center whitespace-nowrap" target="_blank" href="https://mmolb.com/hall-of-unmaking">
                                    <span className="text-xl">☠️</span><span>Hall of Unmaking</span>
                                </a>
                                <a className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition flex flex-col items-center whitespace-nowrap" target="_blank" href="https://mmolb.com/shop">
                                    <span className="text-xl">🛒</span><span>Quaelyth's Curios</span>
                                </a>
                                <a className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-xl transition flex flex-col items-center whitespace-nowrap" target="_blank" href="https://mmolb.com/edit-team">
                                    <span className="text-xl">🛠️</span><span>Edit Team</span>
                                </a>
                            </Fragment>
                        }
                        <a className="px-3 py-2 bg-orange-700 hover:bg-orange-600 text-white font-semibold rounded-xl transition flex flex-col items-center whitespace-nowrap" target="_blank" href={`https://freecashe.ws/team/${team.id}/stats`} rel="noopener noreferrer">
                            <span className="text-xl">🍲</span><span>Free Cashews</span>
                        </a>
                    </div>

                    <div className="flex flex-wrap gap-1 justify-center mb-4">
                        {Object.keys(tabDefs).map(tab =>
                            <div key={tab} className={`py-1 px-3 text-base rounded-full ${tab == activeTab ? 'bg-(--theme-selected) font-semibold cursor-default' : 'hover:bg-(--theme-selected)/50 cursor-pointer'}`} onClick={() => handleTabClick(tab)}>
                                {tabDefs[tab]}
                            </div>
                        )}
                    </div>

                    {activeTab === 'roster' && <TeamRoster team={team} />}
                    {activeTab === 'schedule' && <TeamSchedule id={id} />}
                    {activeTab === 'attributes' && (<TeamAttributes team={team} />)}
                    {activeTab === 'stats' && (<TeamStatsTables team={team} />)}
                    {activeTab === 'items' && (<TeamItems team={team} />)}
                    {activeTab === 'feed' && <TeamFeed team={team} />}
                </div>
            </main>
        </>
    );
}
