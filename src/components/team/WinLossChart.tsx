import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend
);

type GameResult = {
    day: string;
    won: boolean;
    opponent: string;
    score: string;
};

type WinProgressionChartProps = {
    games: GameResult[];
    season: string;
};

export function WinProgressionChart({ games, season }: WinProgressionChartProps) {
    const sortedGames = [...games].sort((a, b) => Number(a.day) - Number(b.day));

    // Calculate cumulative progression (starts at 0, +1 for win, -1 for loss)
    let currentProgress = 0;
    let wins = 0;
    let losses = 0;
    const progressionData = [0];
    const labels: string[] = ['Start'];
    const tooltipData: Array<{ day: string, opponent: string, score: string, won: boolean, progress: number, streak: number, streakType: 'win' | 'loss', wins: number, losses: number }> = [];

    let currentStreak = 0;
    let streakType: 'win' | 'loss';

    sortedGames.forEach((game, index) => {
        currentProgress += game.won ? 1 : -1;
        progressionData.push(currentProgress);
        labels.push(`${game.day}`);

        if (index === 0) {
            currentStreak = 1;
            streakType = game.won ? 'win' : 'loss';
        } else {
            const prevGame = sortedGames[index - 1];
            if (game.won === prevGame.won) {
                currentStreak++;
            } else {
                currentStreak = 1;
                streakType = game.won ? 'win' : 'loss';
            }
        }

        wins += game.won ? 1 : 0;
        losses += game.won ? 0 : 1;

        tooltipData.push({
            day: game.day,
            opponent: game.opponent,
            score: game.score,
            won: game.won,
            progress: currentProgress,
            streak: currentStreak,
            streakType: streakType,
            wins,
            losses,
        });
    });

    const data = {
        labels,
        datasets: [
            {
                label: 'Win/Loss Progression',
                data: progressionData,
                backgroundColor: progressionData.map((value, _index) =>
                    value > 0
                        ? 'rgba(34, 197, 94, 0.8)'
                        : value < 0
                            ? 'rgba(239, 68, 68, 0.8)'
                            : 'rgba(156, 163, 175, 0.6)'
                ),
                borderColor: progressionData.map((value, _index) =>
                    value > 0
                        ? 'rgba(34, 197, 94, 1)'
                        : value < 0
                            ? 'rgba(239, 68, 68, 1)'
                            : 'rgba(156, 163, 175, 1)'
                ),
                borderWidth: 2,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        categoryPercentage: 1.0,
        barPercentage: 1.0,
        backgroundColor: '#000000',
        interaction: {
            mode: 'index' as const,
            intersect: false,
        },
        plugins: {
            legend: {
                display: false,
                labels: {
                    color: 'white',
                },
            },
            title: {
                display: true,
                text: `${season ? ` Season ${season}` : ''} - Win/Loss Progression`,
                color: 'white',
                font: {
                    size: 16,
                    weight: 'bold' as const,
                },
            },
            tooltip: {
                callbacks: {
                    title: (context: any[]) => {
                        const index = context[0].dataIndex;
                        if (index === 0) return 'Season Start';
                        return `${tooltipData[index - 1].day}`;
                    },
                    label: (context: any) => {
                        const index = context.dataIndex;
                        if (index === 0) return 'Progress: 0';

                        const game = tooltipData[index - 1];
                        const result = game.won ? 'WIN' : 'LOSS';
                        const streakText = `(${game.streak} ${game.streakType} streak)`;

                        return [
                            `${result} vs ${game.opponent}`,
                            `Score: ${game.score}`,
                            `Record: ${game.wins}-${game.losses} ${streakText}`
                        ];
                    },
                },
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: 'white',
                bodyColor: 'white',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1,
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Day',
                    color: 'white',
                },
                ticks: {
                    stepSize: 2,
                    color: 'white',
                    maxTicksLimit: 16,
                },
                grid: {
                    display: false,
                },
            },
            y: {
                title: {
                    display: true,
                    text: 'Games Above/Below .500',
                    color: 'white',
                },
                ticks: {
                    stepSize: 2,
                    color: 'white',
                    maxTicksLimit: 8,
                },
                grid: {
                    color: (context: any) => {
                        return context.tick.value === 0
                            ? 'rgba(255, 255, 255, 0.8)'
                            : 'rgba(255, 255, 255, 0.1)';
                    },
                    lineWidth: (context: any) => {
                        return context.tick.value === 0 ? 2 : 1; // Thicker zero line
                    },
                },
                beginAtZero: true,
            },
        },
    };

    return (
        <div className="w-full h-96 p-4 bg-black rounded-lg">
            <Bar data={data} options={options} />
        </div>
    );
}
