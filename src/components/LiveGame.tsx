'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { GameStateDisplay } from '@/components/GameStateDisplay';
import { EventBlock } from './EventBlock';
import { CopiedPopup } from './CopiedPopup';
import PlayerStats from './player/PlayerStats';
import { useSettings } from './Settings';
import { Baserunner, ProcessMessage } from './BaseParser';
import { Bases } from '@/types/Bases';
import { Team } from '@/types/Team';
import { Game } from '@/types/Game';
import { Event } from '@/types/Event';
import { GameStats } from '@/types/GameStats';
import { BoxScore } from './BoxScore';
import { ExpandedScoreboard } from './ExpandedScoreboard';
import ExpandedPlayerStats from './player/ExpandedPlayerStats';
import { GameHeader } from './GameHeader';
import { useGameLiveEvents } from '@/hooks/api/LiveEvents';
import { useLeague } from '@/hooks/api/League';
import Link from 'next/link';
import { useGameHeader } from '@/hooks/api/Game';
import { useTeam } from '@/hooks/api/Team';
import Loading from './Loading';
import { usePlayers } from '@/hooks/api/Player';
import { Checkbox } from './team/Checkbox';
import { usePersistedState } from '@/hooks/PersistedState';

const greaterLeagueIds = ['6805db0cac48194de3cd3fe4', '6805db0cac48194de3cd3fe5',];

export type EventBlockGroup = {
    emoji?: string;
    title?: string;
    color?: string;
    titleColor?: string;
    messages: Event[];
    onClick?: any;
    isWeatherEvent?: boolean;
    isScore?: boolean;
    isEjection?: boolean;
    inning?: string;
};

type LiveGameProps = {
    awayTeam: Team;
    homeTeam: Team;
    game: Game;
    gameId: string;
};

function getOPS(stats: any): string {
    const singles = stats.singles ?? 0;
    const doubles = stats.doubles ?? 0;
    const triples = stats.triples ?? 0;
    const home_runs = stats.home_runs ?? 0;
    const walked = stats.walked ?? 0;
    const hbp = stats.hit_by_pitch ?? 0;
    const sac_flies = stats.sacrifice_flies ?? 0;
    const at_bats = stats.at_bats ?? 0;
    const hits = (stats.singles ?? 0) + (stats.doubles ?? 0) + (stats.triples ?? 0) + (stats.home_runs ?? 0)
    const obp = ((hits + walked + hbp) / (at_bats + walked + hbp + sac_flies)).toFixed(3);
    const slg = ((singles + 2 * doubles + 3 * triples + 4 * home_runs) / (at_bats)).toFixed(3);
    return (Number(obp) + Number(slg)).toFixed(3);
}

export function LeagueDisplay({ leagueId }: { leagueId: string }) {
    const isGreaterLeague = greaterLeagueIds.includes(leagueId);
    const { data: leagueData } = useLeague({
        leagueId,
        enabled: !isGreaterLeague,
    });

    const league = isGreaterLeague ? { name: 'Greater League', emoji: '🏆', url: '/greater-league' }
        : (leagueData ? { name: `${leagueData.name} League`, emoji: leagueData.emoji, url: `/league/${leagueId}` } : undefined);

    if (!league)
        return null;

    return (
        <div className='text-base mr-2'>
            <span className='mr-1'>{league.emoji}</span>
            <Link className='underline' href={league.url}>
                {league.name}
            </Link>
        </div>
    );
}

export default function LiveGamePage({ gameId }: { gameId: string }) {
    const { data: game, isPending: gameIsPending } = useGameHeader({
        gameId,
        select: x => x.game,
    });
    const { data: awayTeam } = useTeam({ teamId: game?.away_team_id });
    const { data: homeTeam } = useTeam({ teamId: game?.home_team_id });

    if (!gameIsPending && !game)
        return <div className="text-white text-center mt-10">Can't find that game</div>;

    if (!game || !awayTeam || !homeTeam)
        return <Loading />;

    return <LiveGamePageContent gameId={gameId} game={game} awayTeam={awayTeam} homeTeam={homeTeam} />;
}

export function LiveGamePageContent({ gameId, game, awayTeam, homeTeam }: LiveGameProps) {
    const { settings } = useSettings();

    const { eventLog, isComplete } = useGameLiveEvents({ gameId, initialEvents: game.event_log ?? [] });
    const lastEvent = eventLog[eventLog.length - 1];

    const [playerIds, playerNames, teamPlayers] = useMemo(() => [
        [
            ...awayTeam.players.map(x => x.player_id),
            ...homeTeam.players.map(x => x.player_id)
        ],
        [
            ...awayTeam.players.map(x => `${x.first_name} ${x.last_name}`),
            ...homeTeam.players.map(x => `${x.first_name} ${x.last_name}`)
        ],
        Object.fromEntries([
            ...awayTeam.players,
            ...homeTeam.players
        ].map(x => [`${x.first_name} ${x.last_name}`, x]))
    ], [awayTeam.players, homeTeam.players]);

    const { data: playerObjects } = usePlayers({
        playerIds,
    });
    const players = useMemo(() => playerObjects
        ? Object.fromEntries(playerObjects?.map(x => [`${x.first_name} ${x.last_name}`, x]))
        : {}, [playerObjects]);

    const [showDetailedStats, setShowDetailedStats] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState<string | undefined>();
    const [playerType, setPlayerType] = useState<'pitching' | 'batting' | null>(null);
    const [showStats, setShowStats] = useState(false);
    const [followLive, setFollowLive] = useState(false);
    const [showBoxScore, setShowBoxScore] = usePersistedState('liveGame_showBoxScore', isComplete);
    const [showExtendedBoxScore, setShowExtendedBoxScore] = usePersistedState('liveGame_showExtendedBoxScore', false);
    const [reverseEvents, setReverseEvents] = useState<boolean>(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const [eventBlocks, setEventBlocks] = useState<EventBlockGroup[]>([]);
    const [baserunners, setBaserunners] = useState<Bases>({ first: null, second: null, third: null });
    const [baserunnerQueue, setBaserunnerQueue] = useState<Baserunner[]>([]); 
    const [gameStats, setGameStats] = useState(GameStats());
    const [lastProcessedEvent, setLastProcessedEvent] = useState<number>();

    useEffect(() => {
        gameStats.home.teamAbbreviation = game.home_team_abbreviation;
        gameStats.away.teamAbbreviation = game.away_team_abbreviation;
    }, [homeTeam, awayTeam])

    useEffect(() => {
        if (isComplete)
            setShowBoxScore(true);
    }, [isComplete]);

    const isHomerunChallenge = game.day === 'Superstar Day 1';

    function getBlockMetadata(event: Event): { emoji?: string; title?: string, titleColor?: string, inning?: string, onClick?: () => void } | null {
        const message = event.message;
        if (event.event === 'NowBatting') {
            const player = (typeof event.batter === 'object' && event.batter !== null) ? event.batter.name : event.batter;
            let emoji = event.inning_side === 0 ? awayTeam.emoji : homeTeam.emoji;
            emoji = (awayTeam.emoji === homeTeam.emoji) ? event.inning_side === 0 ? emoji + "✈️" : emoji + "🏠" : emoji;
            return player && emoji ? {
                emoji: emoji,
                titleColor: settings.gamePage?.useTeamColoredHeaders ? (event.inning_side === 0 ? awayTeam.color : homeTeam.color) : undefined,
                title: player,
                onClick: () => { setSelectedPlayer(player); setShowStats(true); } } : null;
        }

        if (event.event === 'PlayBall' || event.event === 'GameOver') return { emoji: '🤖', title: 'ROBO-UMP' };
        if (message.includes('mound visit') || message.includes('making a pitching change')) return { emoji: '🚶', title: 'Mound Visit' };
        if (event.event === 'AwayLineup') return { emoji: awayTeam.emoji, title: 'Away Lineup', titleColor: settings.useTeamColoredHeaders ? awayTeam.color : undefined };
        if (event.event === 'HomeLineup') return { emoji: homeTeam.emoji, title: 'Home Lineup', titleColor: settings.useTeamColoredHeaders ? homeTeam.color : undefined };
        if (message.includes('End of the ') || message.includes('@') || message.includes('Start of the top of the 1st') || message.includes('Final score:')) return { emoji: 'ℹ️', title: 'Game Info' };

        return null;
    }

    function groupEventLog(initialBlocks: EventBlockGroup[], newEvents: Event[]): EventBlockGroup[] {
        const blocks = [...initialBlocks];
        let currentBlock = blocks.length > 0 ? blocks[0] : null;

        newEvents.forEach((event) => {
            const meta = getBlockMetadata(event);

            const { isWeatherEvent, isScore, isEjection } = getSpecialEventType(event);
            const inning = event.inning && (meta?.title != 'Game Info' && meta?.title != 'ROBO-UMP') ? (event.inning_side === 0 ? '▲ ' : '▼ ') + event.inning : undefined;

            if (meta) {
                currentBlock = {
                    ...meta,
                    messages: [event],
                    isWeatherEvent: isWeatherEvent,
                    isScore,
                    isEjection,
                    inning,
                };
                blocks.unshift(currentBlock); // New block on top
            } else if (currentBlock) {
                // Set flags on the block if not already set
                currentBlock.isWeatherEvent ||= isWeatherEvent;
                currentBlock.isScore ||= isScore;
                currentBlock.isEjection ||= isEjection;

                currentBlock.messages.unshift(event);
            } else {
                currentBlock = {
                    messages: [event],
                    isWeatherEvent: isWeatherEvent,
                    isScore,
                    isEjection,
                    inning,
                };
                blocks.unshift(currentBlock);
            }
        });

        // Post-process to assign gradient class
        for (const block of blocks) {
            block.color = getSpecialEventColor({ isWeatherEvent: block.isWeatherEvent, isScore: block.isScore, isEjection: block.isEjection });
        }

        return blocks;
    }

    if (eventLog.length > 0 && (!lastProcessedEvent || lastEvent.index > lastProcessedEvent)) {
        const newEvents = !lastProcessedEvent ? eventLog
            : eventLog.slice(eventLog.findIndex(event => event.index > lastProcessedEvent));

        const groupedEvents = groupEventLog(eventBlocks, newEvents);
        let currentQueue = baserunnerQueue;
        let lastBaserunners = baserunners;

        const newGameStats = structuredClone(gameStats);
        for (const event of newEvents) {
            const result = ProcessMessage(event, playerNames, currentQueue, newGameStats);
            currentQueue = result.baseQueue;
            lastBaserunners = result.bases;
        }

        setEventBlocks(groupedEvents);
        setBaserunners(lastBaserunners);
        setBaserunnerQueue(currentQueue);
        setGameStats(newGameStats);
        setLastProcessedEvent(lastEvent.index);
        return null;
    }

    const lastBatter = !lastEvent ? '' : (typeof lastEvent.batter === 'object' && lastEvent.batter !== null) ? lastEvent.batter.name : lastEvent.batter ?? '';
    const lastPitcher = !lastEvent ? '' : (typeof lastEvent.pitcher === 'object' && lastEvent.pitcher !== null) ? lastEvent.pitcher.name : lastEvent.pitcher ?? '';
    const lastOnDeck = !lastEvent ? '' : (typeof lastEvent.on_deck === 'object' && lastEvent.on_deck !== null) ? lastEvent.on_deck.name : lastEvent.on_deck ?? '';

    return (
        <main className="mt-8">
            <CopiedPopup />
            <div className={`min-h-screen bg-theme-background text-theme-text font-sans p-4 max-w-3xl mx-auto h-full ${settings.gamePage?.showAwayScoreboard ? '' : 'mt-20'}`}>
                <div className='flex justify-between'>
                    <button onClick={() => window.location.href = `/live/${gameId}`} className="px-3 py-1 text-xs bg-theme-primary hover:opacity-80 rounded-md mb-1">
                        View in Live Viewer (BETA)
                    </button>
                    <LeagueDisplay leagueId={homeTeam.league} />
                </div>
                <GameHeader awayTeam={awayTeam} event={lastEvent} homeTeam={homeTeam} game={game} />

                <div className='opacity-70 text-center text-xs md:text-sm font-medium tracking-wide mb-4'>Season {game.season} • {game.season_status} • Day {game.day}</div>

                {!isHomerunChallenge && settings.gamePage?.showExpandedScoreboard && <ExpandedScoreboard
                    gameStats={gameStats}
                    lastEvent={lastEvent}
                    awayTeam={awayTeam}
                    homeTeam={homeTeam}
                />}

                {!isComplete && lastEvent && <GameStateDisplay
                    event={lastEvent}
                    bases={{ first: (baserunners.first && baserunners.first !== 'Unknown') ? baserunners.first + ` (${getOPS(teamPlayers[baserunners.first].stats)} OPS)` : baserunners.first, second: (baserunners.second && baserunners.second !== 'Unknown') ? baserunners.second + ` (${getOPS(teamPlayers[baserunners.second].stats)} OPS)` : baserunners.second, third: (baserunners.third && baserunners.third !== 'Unknown') ? baserunners.third + ` (${getOPS(teamPlayers[baserunners.third].stats)} OPS)` : baserunners.third }}
                    pitcher={{
                        player: lastEvent.pitcher ? teamPlayers[lastPitcher] : null,
                        onClick: () => { setSelectedPlayer(lastPitcher); setPlayerType('pitching'); setShowStats(true); },
                        emoji: game.weather.name === 'Wither' && players[lastPitcher]?.modifications?.some(x => x.name === 'Corrupted') ? '🫀' : undefined
                    }}
                    batter={{
                        player: lastEvent.batter ? teamPlayers[lastBatter] : null,
                        onClick: () => { setSelectedPlayer(lastBatter); setPlayerType('batting'); setShowStats(true); },
                        emoji: game.weather.name === 'Wither' && players[lastBatter]?.modifications?.some(x => x.name === 'Corrupted') ? '🫀' : undefined
                    }}
                    onDeck={{
                        player: lastEvent.on_deck ? teamPlayers[lastOnDeck] : null,
                        onClick: () => { setSelectedPlayer(lastOnDeck); setPlayerType('batting'); setShowStats(true); },
                        emoji: game.weather.name === 'Wither' && players[lastOnDeck]?.modifications?.some(x => x.name === 'Corrupted') ? '🫀' : undefined
                    }}
                    showBases={true}
                    playerObjects={playerObjects}
                />}

                <>
                    <div className="relative inline-block text-sm md:hidden">
                        <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="px-3 py-1 text-xs bg-theme-primary hover:opacity-80 rounded-md">
                            Options
                        </button>
                        <div className={`absolute bg-theme-primary border border-theme-accent rounded p-2 mt-1 z-50 shadow-lg transition-all duration-200 ease-out transform origin-top ${isDropdownOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                            {!isHomerunChallenge && 
                                <Checkbox checked={showBoxScore} label="Show Box Score" onChange={setShowBoxScore} />
                            }
                            {!isHomerunChallenge && showBoxScore &&
                                <Checkbox checked={showExtendedBoxScore} label="Extended Box Score" onChange={setShowExtendedBoxScore} />
                            }
                            <Checkbox checked={showStats} label="Show Stats" onChange={setShowStats} />
                            <Checkbox checked={showDetailedStats} label="Show Detailed Stats" onChange={setShowDetailedStats} />
                            <Checkbox checked={followLive} label="Stats Follow Live" onChange={setFollowLive} />
                            <Checkbox checked={reverseEvents} label="Reverse Events" onChange={setReverseEvents} />
                        </div>
                    </div>
                    <div className="md:flex flex-col gap-2 mt-4 hidden md:visible">
                        <div className="flex justify-center items-center gap-2">

                            {!isHomerunChallenge &&
                                <Checkbox checked={showBoxScore} label="Show Box Score" onChange={setShowBoxScore} />
                            }
                            {!isHomerunChallenge && showBoxScore &&
                                <Checkbox checked={showExtendedBoxScore} label="Extended Box Score" onChange={setShowExtendedBoxScore} />
                            }
                            <Checkbox checked={showStats} label="Show Stats" onChange={setShowStats} />
                            <Checkbox checked={showDetailedStats} label="Show Detailed Stats" onChange={setShowDetailedStats} />
                            <Checkbox checked={followLive} label="Follow Live" onChange={setFollowLive} />
                            <Checkbox checked={reverseEvents} label="Reverse Events" onChange={setReverseEvents} />
                        </div>
                    </div>

                    {showBoxScore &&
                    <div className="md:flex flex-col gap-2 mt-4 hidden md:visible items-center justify-center overflow-x-visible">
                        <div className="flex flex-row items-stretch gap-4">
                            <div className="flex-1">
                                <BoxScore gameStats={gameStats} team={awayTeam} isAway={true} showExtended={showExtendedBoxScore} />
                            </div>
                            <div className="flex-1">
                                <BoxScore gameStats={gameStats} team={homeTeam} isAway={false} showExtended={showExtendedBoxScore} />
                            </div>
                        </div>
                    </div>
                    }
                    {(showStats && followLive && showDetailedStats) ? (<div className='grid grid-cols-2 gap-2 items-stretch h-full'>
                        <ExpandedPlayerStats player={lastEvent.pitcher && players ? { ...teamPlayers[lastPitcher] as any, ...players[lastPitcher] } : null} category='pitching' />
                        <ExpandedPlayerStats player={lastEvent.batter && players ? { ...teamPlayers[lastBatter] as any, ...players[lastBatter] } : null} category='batting' />
                    </div>) : ''}
                    {(showStats && followLive && !showDetailedStats) ? (<div className='grid grid-cols-2 gap-2 items-stretch h-full'>
                        <PlayerStats player={lastEvent.pitcher ? teamPlayers[lastPitcher] : null} category='pitching' />
                        <PlayerStats player={lastEvent.batter ? teamPlayers[lastBatter] : null} category='batting' />
                    </div>) : ''}
                    {(showStats && !followLive && !showDetailedStats) ? (<PlayerStats player={selectedPlayer ? teamPlayers[selectedPlayer] : null} category={playerType} />) : ''}
                    {(showStats && !followLive && showDetailedStats) ? (<ExpandedPlayerStats player={selectedPlayer && players ? { ...teamPlayers[selectedPlayer] as any, ...players[selectedPlayer] } : null} category={playerType} />) : ''}
                </>

                <div className="mt-6 space-y-4">
                    {reverseEvents ?
                        eventBlocks.toReversed().map((block, idx) => (
                            <EventBlock key={idx} emoji={block.emoji} title={block.title} color={block.color} titleColor={block.titleColor} messages={block.messages} onClick={block.onClick ? block.onClick : undefined} inning={block.inning} />
                        )) : 
                        eventBlocks.map((block, idx) => (
                            <EventBlock key={idx} emoji={block.emoji} title={block.title} color={block.color} titleColor={block.titleColor} messages={block.messages} onClick={block.onClick ? block.onClick : undefined} inning={block.inning} />
                        ))
                    }
                </div>

            </div>
        </main>
    );
}

export type SpecialEventType = {
    isWeatherEvent?: boolean;
    isScore?: boolean;
    isEjection?: boolean;
}

export function getSpecialEventType(event: Event): SpecialEventType {
    const isWeatherEvent = /falling star|geomagnetic storms intensify|are Partying!|won a Door Prize|struggles against the 🥀 Wither/i.test(event.message);
    const isScore = /scores!|homers on a|grand slam|steals home/i.test(event.message);
    const isEjection = /ROBO-UMP ejected/i.test(event.message);
    return { isWeatherEvent, isScore, isEjection };
}

export function getSpecialEventColor({ isWeatherEvent, isScore, isEjection }: SpecialEventType): string {
    if (isEjection && isScore) {
        return 'linear-gradient(to right bottom, var(--theme-score), var(--theme-ejection))';
    } else if (isWeatherEvent && isScore) {
        return 'linear-gradient(to right bottom, var(--theme-score), var(--theme-weather_event))';
    } else if (isWeatherEvent && isEjection) {
        return 'linear-gradient(to right bottom, var(--theme-weather_event), var(--theme-ejection))';
    } else if (isEjection) {
        return 'var(--theme-ejection)';
    } else if (isWeatherEvent) {
        return 'var(--theme-weather_event)';
    } else if (isScore) {
        return 'var(--theme-score)';
    }
    return '';
}
