'use client'
import React, { useState } from 'react'
import { getContrastTextColor } from '@/helpers/ColorHelper'
import { Team } from '@/types/Team'
import { GameStats } from '@/types/GameStats'

interface BoxScoreProps {
    gameStats: GameStats
    team: Team
    isAway: boolean
    showExtended?: boolean
}

export function BoxScore({ gameStats, team, isAway, showExtended = false }: BoxScoreProps) {

    return (
        <div className='relative'>
                        <div className='absolute -top-3 left-3 z-10 inline-block rounded-full px-3 py-1 text-base font-bold text-theme-secondary border border-theme-accent shadow-md' style={{ background: `#${team.color}`, borderColor: getContrastTextColor(team.color), color: getContrastTextColor(team.color) }}>
                {team.emoji && <span className="mr-1">{team.emoji}</span>} {team.name}
            </div>
            <div className="rounded-md pt-6 p-3 mt-4" style={{ background: 'var(--theme-primary)' }}>
                <div className='overflow-x-auto'>
                    <table className='table table-auto w-full mt-2'>
                        <thead className='table-header-group'>
                            <tr className='table-row border-b-1 border-(--theme-text)/50 font-semibold text-xs uppercase'>
                                <td className='table-cell text-left sticky left-0 bg-inherit z-10 min-w-32 whitespace-nowrap'>Batting</td>
                                <td className='table-cell text-right min-w-7'>AB</td>
                                <td className='table-cell text-right min-w-7'>R</td>
                                <td className='table-cell text-right min-w-7'>H</td>
                                <td className='table-cell text-right min-w-7'>RBI</td>
                                <td className='table-cell text-right min-w-7'>HR</td>
                                {showExtended && (
                                    <>
                                        <td className='table-cell text-right min-w-7'>K</td>
                                        <td className='table-cell text-right min-w-7'>BB</td>
                                        <td className='table-cell text-right min-w-7'>SB</td>
                                        <td className='table-cell text-right min-w-7'>CS</td>
                                        <td className='table-cell text-right min-w-7'>TB</td>
                                        <td className='table-cell text-right min-w-7'>LOB</td>
                                        <td className='table-cell text-right min-w-7'>GIDP</td>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className='table-row-group'>
                            {(isAway ? gameStats.away : gameStats.home).battingOrder.map(batter =>
                                <tr key={batter} className='table-row border-b-1 border-(--theme-text)/50 text-sm'>
                                    <td className='table-cell text-left sticky left-0 bg-inherit z-10 min-w-32 whitespace-nowrap'>
                                        <span className={`${gameStats.batters[batter].ejected && 'opacity-60'}`}>{batter}</span>
                                        {gameStats.batters[batter].ejected && <span className='ml-1'>⏏️</span>}
                                    </td>
                                    <td className='table-cell text-right pl-3'>{gameStats.batters[batter].atBats}</td>
                                    <td className='table-cell text-right pl-3'>{gameStats.batters[batter].runs}</td>
                                    <td className='table-cell text-right pl-3'>{gameStats.batters[batter].hits}</td>
                                    <td className='table-cell text-right pl-3'>{gameStats.batters[batter].rbi}</td>
                                    <td className='table-cell text-right pl-3'>{gameStats.batters[batter].homeRuns}</td>
                                    {showExtended && (
                                        <>
                                            <td className='table-cell text-right pl-3'>{gameStats.batters[batter].strikeouts}</td>
                                            <td className='table-cell text-right pl-3'>{gameStats.batters[batter].walks}</td>
                                            <td className='table-cell text-right pl-3'>{gameStats.batters[batter].stolenBases}</td>
                                            <td className='table-cell text-right pl-3'>{gameStats.batters[batter].caughtStealing}</td>
                                            <td className='table-cell text-right pl-3'>{gameStats.batters[batter].totalBases}</td>
                                            <td className='table-cell text-right pl-3'>{gameStats.batters[batter].leftOnBase}</td>
                                            <td className='table-cell text-right pl-3'>{gameStats.batters[batter].groundedIntoDoublePlay}</td>
                                        </>
                                    )}
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className='overflow-x-auto'>
                    <table className='table table-auto w-full mt-2'>
                        <thead className='table-header-group'>
                            <tr className='table-row font-semibold text-xs uppercase'>
                                <th className='table-cell text-left sticky left-0 bg-inherit z-10 min-w-32 whitespace-nowrap'>Pitching</th>
                                <th className='table-cell text-right min-w-5'>IP</th>
                                {showExtended && (
                                    <>
                                        <th className='table-cell text-right min-w-5'>H</th>
                                        <th className='table-cell text-right min-w-5'>R</th>
                                        <th className='table-cell text-right min-w-5'>ER</th>
                                        <th className='table-cell text-right min-w-5'>BB</th>
                                        <th className='table-cell text-right min-w-5'>K</th>
                                        <th className='table-cell text-right min-w-5'>HR</th>
                                        <th className='table-cell text-right min-w-5'>PC</th>
                                        <th className='table-cell text-right min-w-5'>ST</th>
                                    </>
                                )}
                                {!showExtended && (
                                    <>
                                        <th className='table-cell text-right min-w-5'>H</th>
                                        <th className='table-cell text-right min-w-5'>ER</th>
                                        <th className='table-cell text-right min-w-5'>BB</th>
                                        <th className='table-cell text-right min-w-5'>K</th>
                                        <th className='table-cell text-right min-w-5'>PC</th>
                                        <th className='table-cell text-right min-w-5'>ST</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className='table-row-group'>
                            {(isAway ? gameStats.away : gameStats.home).pitchingOrder.map(pitcher =>
                                <tr key={pitcher} className='table-row border-t-1 border-(--theme-text)/50 text-sm'>
                                    <td className='table-cell text-left sticky left-0 bg-inherit z-10 min-w-32 whitespace-nowrap'>
                                        <span className={`${gameStats.pitchers[pitcher].ejected && 'opacity-60'}`}>{pitcher}</span>
                                        {gameStats.pitchers[pitcher].ejected && <span className='ml-1'>⏏️</span>}
                                    </td>
                                    <td className='table-cell text-right pl-3'>{Math.floor(gameStats.pitchers[pitcher].outsRecorded / 3)}.{gameStats.pitchers[pitcher].outsRecorded % 3}</td>
                                    {showExtended && (
                                        <>
                                            <td className='table-cell text-right pl-3'>{gameStats.pitchers[pitcher].hits}</td>
                                            <td className='table-cell text-right pl-3'>{gameStats.pitchers[pitcher].runs}</td>
                                            <td className='table-cell text-right pl-3'>{gameStats.pitchers[pitcher].earnedRuns}</td>
                                            <td className='table-cell text-right pl-3'>{gameStats.pitchers[pitcher].walks}</td>
                                            <td className='table-cell text-right pl-3'>{gameStats.pitchers[pitcher].strikeouts}</td>
                                            <td className='table-cell text-right pl-3'>{gameStats.pitchers[pitcher].homeRuns}</td>
                                            <td className='table-cell text-right pl-3'>{gameStats.pitchers[pitcher].pitchCount}</td>
                                            <td className='table-cell text-right pl-3'>{gameStats.pitchers[pitcher].strikesThrown}</td>
                                        </>
                                    )}
                                    {!showExtended && (
                                        <>
                                            <td className='table-cell text-right pl-3'>{gameStats.pitchers[pitcher].hits}</td>
                                            <td className='table-cell text-right pl-3'>{gameStats.pitchers[pitcher].earnedRuns}</td>
                                            <td className='table-cell text-right pl-3'>{gameStats.pitchers[pitcher].walks}</td>
                                            <td className='table-cell text-right pl-3'>{gameStats.pitchers[pitcher].strikeouts}</td>
                                            <td className='table-cell text-right pl-3'>{gameStats.pitchers[pitcher].pitchCount}</td>
                                            <td className='table-cell text-right pl-3'>{gameStats.pitchers[pitcher].strikesThrown}</td>
                                        </>
                                    )}
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
