'use client'
import Loading from "@/components/Loading";
import { useCallback, useEffect, useState, useMemo } from "react";
import BoonScoresTable from "./BoonScoresTable";
import { MapAPITeamResponse, PlaceholderTeam, Team, TeamPlayer } from "@/types/Team";
import { Equipment, EquipmentEffect, EquipmentEffectTypes, MapAPIPlayerResponse, Player } from "@/types/Player";
import { getLesserBoonEmoji, lesserBoonTable } from "@/components/team/BoonDictionary";
import { getPlayerStatRows } from "./CSVGenerator";
import { EquipmentTooltip } from "../player/PlayerPageHeader";
import { capitalize } from "@/helpers/StringHelper";
import { attrTypes, positionsList, statDefinitions } from "./Constants";
import { PositionalWeights } from "./PositionalWeights";
import { Tooltip } from "../ui/Tooltip";


type EquipmentSlot = 'head' | 'body' | 'hands' | 'feet' | 'accessory';
type OptimizationMode = 'strength' | 'weakness' | 'neutral';

const CUSTOM_PLAYER_WEIGHTS_KEY = 'customPlayerWeights';
const PLAYER_OPTIMIZE_SETTINGS_KEY = 'playerOptimizeSettings';
const LINEUP_PRIORITY_KEY = 'lineupPriority';
const USE_PRIORITY_FIRST_KEY = 'usePriorityFirst';

// Helper functions for localStorage
function saveCustomPlayerWeightsToStorage(weights: Record<string, Record<string, number>>) {
    try {
        localStorage.setItem(CUSTOM_PLAYER_WEIGHTS_KEY, JSON.stringify(weights));
    } catch (error) {
        console.error('Failed to save custom player weights to localStorage:', error);
    }
}

function loadCustomPlayerWeightsFromStorage(): Record<string, Record<string, number>> {
    try {
        const stored = localStorage.getItem(CUSTOM_PLAYER_WEIGHTS_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch (error) {
        console.error('Failed to load custom player weights from localStorage:', error);
        return {};
    }
}

function savePlayerOptimizeSettingsToStorage(settings: Record<string, OptimizationMode>) {
    try {
        localStorage.setItem(PLAYER_OPTIMIZE_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
        console.error('Failed to save player optimize settings to localStorage:', error);
    }
}

function loadPlayerOptimizeSettingsFromStorage(): Record<string, OptimizationMode> {
    try {
        const stored = localStorage.getItem(PLAYER_OPTIMIZE_SETTINGS_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch (error) {
        console.error('Failed to load player optimize settings from localStorage:', error);
        return {};
    }
}

function saveLineupPriorityToStorage(teamId: string, priority: string[]) {
    try {
        const allPriorities = JSON.parse(localStorage.getItem(LINEUP_PRIORITY_KEY) || '{}');
        allPriorities[teamId] = priority;
        localStorage.setItem(LINEUP_PRIORITY_KEY, JSON.stringify(allPriorities));
    } catch (error) {
        console.error('Failed to save lineup priority to localStorage:', error);
    }
}

function loadLineupPriorityFromStorage(teamId: string): string[] {
    try {
        const allPriorities = JSON.parse(localStorage.getItem(LINEUP_PRIORITY_KEY) || '{}');
        return allPriorities[teamId] || [];
    } catch (error) {
        console.error('Failed to load lineup priority from localStorage:', error);
        return [];
    }
}

function saveUsePriorityFirstToStorage(value: boolean) {
    try {
        localStorage.setItem(USE_PRIORITY_FIRST_KEY, JSON.stringify(value));
    } catch (error) {
        console.error('Failed to save usePriorityFirst to localStorage:', error);
    }
}

function loadUsePriorityFirstFromStorage(): boolean {
    try {
        const stored = localStorage.getItem(USE_PRIORITY_FIRST_KEY);
        return stored ? JSON.parse(stored) : true; // Default to true
    } catch (error) {
        console.error('Failed to load usePriorityFirst from localStorage:', error);
        return true; // Default to true
    }
}

function getPositionalWeights(positionalWeights: Record<string, Record<string, number>>, position: string, attribute: string, defaultValue: number): number {
    const positionWeights = positionalWeights[position];
    if (!positionWeights) {
        return defaultValue;
    }

    const weight = positionWeights[attribute];
    return weight !== undefined ? weight : defaultValue;
}

function shouldFilterAttribute(attribute: string, player: Player): boolean {
    const attrType = attrTypes[attribute];

    // Filter out pitching stats for batters
    if (attrType === 'Pitching' && player.position_type === 'Batter') return true;

    // Filter out batting stats for pitchers
    if (attrType === 'Batting' && player.position_type === 'Pitcher') return true;

    // Filter out running/defense stats for pitchers
    if ((attrType === 'Running' || attrType === 'Defense') &&
        player.position_type === 'Pitcher') return true;

    return false;
}

// Get weights and apply positional multipliers
// normalWeight is between 1 and 2
function getStatWeights(player: Player, mode: OptimizationMode, positionalWeights: Record<string, number>): Record<string, number> {
    const playerTalk = reducePlayerTalk(player);

    if (!playerTalk) return {};
    const entries = Object.entries(playerTalk);

    const sorted = entries
        .filter(([statName, val]) => {
            if (Number.isNaN(Number(val))) return false;

            return !shouldFilterAttribute(statName, player);
        })
        .sort((a, b) => mode === 'strength' ? (b[1] as number) - (a[1] as number) : (a[1] as number) - (b[1] as number));

    const weights: Record<string, number> = {};
    for (let i = 0; i < sorted.length; i++) {
        // between 1 and 2
        const normalWeight = mode === 'neutral' ? 1 : (1 + (sorted.length - i) / sorted.length);
        const positionalWeight = positionalWeights[sorted[i][0]] !== undefined ? positionalWeights[sorted[i][0]] : 1.0;

        weights[sorted[i][0]] = normalWeight * positionalWeight;
    }

    return weights;
}

function getBoonBonus(boonName: string, attribute: string): number {
    if (boonName == '') return 0;
    return lesserBoonTable?.[boonName]?.[attribute] ?? 0;
}

function getBoonBonusDisplay(boonName: string, attribute: string): string {
    const boonBonus = getBoonBonus(boonName, attribute);
    if (boonBonus == 0) return '';
    const prefix = boonBonus > 0 ? '+' : '';
    return `(${prefix}${(boonBonus * 100).toFixed(0)}%${getLesserBoonEmoji(boonName)})`;
}

// Give equipment a score
// this score is based off of a player's base_total stats, not stars
function scoreEquipment(equipment: Equipment, playerTalk: Record<string, number>, weights: Record<string, number>, boonName: string = '') {
    const res = equipment.effects.reduce((sum, effect) => {
        const playerStatValue = playerTalk[effect.attribute] ?? 0;
        const weight = weights[effect.attribute] ?? 0;
        if (weight == 0) return sum;
        if (effect.type == EquipmentEffectTypes.FLATBONUS) {
            // will be 0 if no boon
            const lesserBoonBonus = getBoonBonus(boonName, effect.attribute);
            const effectValue = (effect.value * 100) + (effect.value * 100 * lesserBoonBonus);

            return sum + (weight * effectValue);
        } else if (effect.type == EquipmentEffectTypes.MULTIPLIER) {
            // just do mult on base value for now
            return sum + (weight * (playerStatValue * 100 * effect.value));
        } else {
            return sum;
        }
    }, 0);
    return res;
}

function parseInventoryHTML(html: string): Equipment[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const items: Equipment[] = [];

    const itemDivs = doc.querySelectorAll("div.relative.group");

    itemDivs.forEach(item => {
        const rareName = item.querySelector("div.text-\\[8px\\]")?.textContent?.trim();
        const emoji = item.querySelector("div.text-3xl")?.textContent?.trim() || "❓";

        if (!rareName) return;

        const tooltipDiv = item.querySelector("div[style*='transform: translateX']");

        let rarity = "Normal";
        let slot: string | undefined = undefined;
        const effects: EquipmentEffect[] = [];

        if (tooltipDiv) {
            const slotText = tooltipDiv.querySelector("div.text-\\[10px\\]")?.textContent?.trim() || "";
            const slotTextParts = slotText.split(' ');
            if (slotTextParts.length >= 2) {
                rarity = slotTextParts[0];
                slot = slotTextParts[1];
            }

            const statBonuses = tooltipDiv.querySelectorAll("div.text-blue-400, div.text-yellow-400"); // Accounts for magic and rare items
            statBonuses.forEach(line => {
                const bonus = line.querySelector("span.font-semibold");
                const stat = line.querySelector("span.opacity-80");

                if (bonus && stat) {
                    const isMultiplier = bonus.textContent?.includes('%');
                    const value = parseInt(bonus.textContent?.trim() || "0", 10); // parseInt due to a +
                    const attribute = stat.textContent?.trim() || "Unknown";


                    if (!isNaN(value) && attribute !== "Unknown") {
                        effects.push({
                            attribute: attribute,
                            type: isMultiplier ? EquipmentEffectTypes.MULTIPLIER : EquipmentEffectTypes.FLATBONUS,
                            value: value / 100,
                        });
                    }
                }
            });
        }

        items.push({
            name: rareName,
            rareName,
            emoji,
            rarity,
            slot,
            effects,
        });
    });

    return items;
}

// Hi, hey, hello howdy, yo, heyo
// Uhhhhh. So I might have written bad code
// And the way around my bad code may be to make a fake rareName for Magic Items
function fudgeRareName(equipment: Equipment): Equipment {
    if (!equipment || equipment.rareName) return equipment;
    equipment.rareName = `${equipment.prefix?.join(' ') ?? ''} ${equipment.name ?? ''} ${equipment.suffix?.join(' ') ?? ''}`.trim();
    return equipment;
}

function reducePlayerTalk(player: Player): Record<string, number> {
    const playerTalk: Record<string, number> = {};
    if (player.talk) {
        Object.entries(player.talk).map(([_categoryKey, entry]) => {
            if (entry) {
                Object.entries(entry.stars || {}).map(([statKey, star]) => {
                    playerTalk[statKey] = star.base_total;
                });
            }
        });
    }
    return playerTalk;
}

// returns flat list statName->base_total mapping for all talk entries
function reducePlayerTalkTotals(player: Player): Record<string, number> {
    const playerTalk: Record<string, number> = {};
    if (player.talk) {
        Object.entries(player.talk).map(([_categoryKey, entry]) => {
            if (entry) {
                Object.entries(entry.stars || {}).map(([statKey, star]) => {
                    playerTalk[statKey] = star.total;
                });
            }
        });
    }
    return playerTalk;
}

export function calculateBestPlayerForBoon(players: Player[], includeItems: boolean = true, filterByPosition: boolean = true): Record<string, Record<string, number>> {
    const boons = lesserBoonTable;
    const boonToPlayerMap: Record<string, Record<string, number>> = {};

    for (const [boonName, boonEffects] of Object.entries(boons)) {
        const playerScores: Record<string, number> = {};

        for (const player of players) {
            const playerTalk = includeItems ? reducePlayerTalkTotals(player) : reducePlayerTalk(player);
            const isPitcher = ['SP', 'RP', 'CL'].includes(player.position);

            let boonScore = 0;
            for (const [attribute, modifier] of Object.entries(boonEffects)) {
                // Skip attributes based on player type if filtering is enabled
                if (filterByPosition) {
                    const attrType = attrTypes[attribute];
                    if (isPitcher && (attrType === 'Batting' || attrType === 'Defense')) {
                        continue; // Skip batting and defense attributes for pitchers
                    }
                    if (!isPitcher && attrType === 'Pitching') {
                        continue; // Skip pitching attributes for batters
                    }
                }

                const playerStatValue = playerTalk[attribute] ?? 0;
                boonScore += playerStatValue * 100 * modifier; // positive mods boost high stats, negative penalize high stats
            }
            playerScores[`${player.first_name} ${player.last_name}`] = boonScore;
        }

        const sortedPlayerScores = Object.entries(playerScores).sort((a, b) => b[1] - a[1]);
        boonToPlayerMap[boonName] = Object.fromEntries(sortedPlayerScores);
    }

    return boonToPlayerMap;
}

// Calculate defensive position scores for all players at all positions
function calculateDefensiveScores(
    players: Player[],
    positions: string[],
    ignoreItems: boolean = false
): {
    playerScores: Record<string, Record<string, number>>;
    maxScoreByPosition: Record<string, number>;
} {
    const defensiveAttributes = ['Acrobatics', 'Agility', 'Arm', 'Awareness', 'Composure', 'Dexterity', 'Patience', 'Reaction'];
    const playerScores: Record<string, Record<string, number>> = {};
    const maxScoreByPosition: Record<string, number> = {};

    for (const player of players) {
        const playerTalk = ignoreItems ? reducePlayerTalk(player) : reducePlayerTalkTotals(player);
        const playerName = `${player.first_name} ${player.last_name}`;
        const positionScores: Record<string, number> = {};

        for (const position of positions) {
            const weights = PositionalWeights[position];
            if (!weights) continue;

            let positionScore = 0;
            for (const attribute of defensiveAttributes) {
                const weight = weights[attribute] ?? 0;
                const playerStatValue = playerTalk[attribute] ?? 0;
                positionScore += playerStatValue * weight * 100;
            }

            positionScores[position] = positionScore;

            // Track the maximum score for each position
            if (!maxScoreByPosition[position] || positionScore > maxScoreByPosition[position]) {
                maxScoreByPosition[position] = positionScore;
            }
        }

        playerScores[playerName] = positionScores;
    }

    return { playerScores, maxScoreByPosition };
}

// Calculate best defensive position for each player
export function calculateBestPositionForPlayers(players: Player[], ignoreItems: boolean = false): Record<string, { position: string; score: number; allScores: Record<string, number>; originalPosition: string }> {
    const defensivePositions = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'SP', 'RP', 'CL'];
    const playerBestPositions: Record<string, { position: string; score: number; allScores: Record<string, number>; originalPosition: string }> = {};

    // Calculate raw scores using shared function
    const { playerScores: allPlayerScores, maxScoreByPosition } = calculateDefensiveScores(players, defensivePositions, ignoreItems);

    // Normalize scores per position based on the max for that position
    for (const player of players) {
        const playerName = `${player.first_name} ${player.last_name}`;
        const rawScores = allPlayerScores[playerName];
        const normalizedScores: Record<string, number> = {};

        for (const [position, score] of Object.entries(rawScores)) {
            const maxScore = maxScoreByPosition[position];
            if (maxScore > 0) {
                normalizedScores[position] = (score / maxScore) * 100;
            } else {
                normalizedScores[position] = 0;
            }
        }

        // Find the best position for this player
        const sortedPositions = Object.entries(normalizedScores).sort((a, b) => b[1] - a[1]);
        const [bestPosition, bestScore] = sortedPositions[0] || ['Unknown', 0];

        playerBestPositions[playerName] = {
            position: bestPosition,
            score: bestScore,
            allScores: normalizedScores,
            originalPosition: player.position
        };
    }

    return playerBestPositions;
}

// Calculate optimal defensive lineup with one player per position
export function calculateOptimalDefensiveLineup(players: Player[], ignoreItems: boolean = false): {
    lineup: Array<{ player: Player; position: string; score: number }>;
    totalScore: number;
    unassignedPlayers: Player[];
} {
    const defensivePositions = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];

    // Calculate raw scores using shared function
    const { playerScores, maxScoreByPosition } = calculateDefensiveScores(players, defensivePositions, ignoreItems);

    // Build all possible assignments with normalized scores
    type Assignment = { player: Player; position: string; score: number };
    const allPossibleAssignments: Assignment[] = [];

    for (const player of players) {
        const playerName = `${player.first_name} ${player.last_name}`;
        const positionScores = playerScores[playerName];

        for (const [position, rawScore] of Object.entries(positionScores)) {
            const maxScore = maxScoreByPosition[position];
            const normalizedScore = maxScore > 0 ? (rawScore / maxScore) * 100 : 0;
            allPossibleAssignments.push({ player, position, score: normalizedScore });
        }
    }

    // Find optimal assignment using backtracking to maximize total score
    // Group assignments by position for easier lookup
    const assignmentsByPosition: Record<string, Assignment[]> = {};
    for (const assignment of allPossibleAssignments) {
        if (!assignmentsByPosition[assignment.position]) {
            assignmentsByPosition[assignment.position] = [];
        }
        assignmentsByPosition[assignment.position].push(assignment);
    }

    // Sort each position's assignments by score descending for optimization
    for (const position in assignmentsByPosition) {
        assignmentsByPosition[position].sort((a, b) => b.score - a.score);
    }

    let bestLineup: Assignment[] = [];
    let bestScore = -Infinity;

    // Backtracking function to find optimal assignment
    function findOptimalLineup(
        positionIndex: number,
        currentLineup: Assignment[],
        currentScore: number,
        usedPlayers: Set<string>
    ) {
        // Base case: all positions filled
        if (positionIndex === defensivePositions.length) {
            if (currentScore > bestScore) {
                bestScore = currentScore;
                bestLineup = [...currentLineup];
            }
            return;
        }

        const position = defensivePositions[positionIndex];
        const candidates = assignmentsByPosition[position] || [];

        // Try each player for this position
        for (const assignment of candidates) {
            const playerKey = `${assignment.player.first_name} ${assignment.player.last_name}`;

            // Skip if player already assigned
            if (usedPlayers.has(playerKey)) continue;

            // Pruning: if even with perfect scores for remaining positions we can't beat bestScore, skip
            const remainingPositions = defensivePositions.length - positionIndex - 1;
            const maxPossibleScore = currentScore + assignment.score + (remainingPositions * 100);
            if (maxPossibleScore <= bestScore) continue;

            // Try this assignment
            usedPlayers.add(playerKey);
            currentLineup.push(assignment);

            findOptimalLineup(positionIndex + 1, currentLineup, currentScore + assignment.score, usedPlayers);

            // Backtrack
            currentLineup.pop();
            usedPlayers.delete(playerKey);
        }
    }

    // Start the search
    findOptimalLineup(0, [], 0, new Set());

    const lineup = bestLineup;

    const totalScore = lineup.reduce((sum, assignment) => sum + assignment.score, 0);

    // Find unassigned players
    const assignedPlayerKeys = new Set(lineup.map(a => `${a.player.first_name} ${a.player.last_name}`));
    const unassignedPlayers = players.filter(p => {
        const playerKey = `${p.first_name} ${p.last_name}`;
        return !assignedPlayerKeys.has(playerKey);
    });

    return { lineup, totalScore, unassignedPlayers };
}



export default function OptimizeTeamPage({ id }: { id: string }) {
    const [loading, setLoading] = useState(true);
    const [team, setTeam] = useState<Team>(PlaceholderTeam);
    const [players, setPlayers] = useState<Player[] | undefined>(undefined);
    const [weights, setWeights] = useState<Record<string, Record<string, number>> | undefined>(undefined);
    const [statPlayers, setStatPlayers] = useState<Record<string, Record<string, string | number>> | undefined>(undefined);
    const [scored, setScored] = useState<{ name: string; scores: any }[]>([]);
    const [equippedEquipment, setEquippedEquipment] = useState<Equipment[]>([]);
    const [parsedEquipment, setParsedEquipment] = useState<Equipment[]>([]);
    const [entryText, setEntryText] = useState<string>('');
    const [optimizedLineup, setOptimizedLineup] = useState<{ lineup: Player[], originalScore: number, newScore: number } | null>(null);
    const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
    const [activeOptimizedTooltip, setActiveOptimizedTooltip] = useState<string | null>(null);
    const [customPlayerWeights, setCustomPlayerWeights] = useState<Record<string, Record<string, number>>>(loadCustomPlayerWeightsFromStorage());
    const [playerOptimizeSettings, setPlayerOptimizeSettings] = useState<Record<string, OptimizationMode>>(loadPlayerOptimizeSettingsFromStorage());
    const [resetOptimizeSetting, setResetOptimizeSetting] = useState<OptimizationMode>('strength');
    const [autoOptimize, setAutoOptimize] = useState<boolean>(true);
    const [collapsedPlayers, setCollapsedPlayers] = useState<Record<string, boolean>>({});
    const [showBoonScores, setShowBoonScores] = useState(false);
    const [boonIncludeItems, setBoonIncludeItems] = useState(false);
    const [boonFilterByPosition, setBoonFilterByPosition] = useState(true);
    const [globalWeights, setGlobalWeights] = useState<Record<string, number>>({});
    const [showGlobalWeights, setShowGlobalWeights] = useState(false);
    const [showBestPositions, setShowBestPositions] = useState(false);
    const [defenseIgnoreItems, setDefenseIgnoreItems] = useState(true);
    const [defenseIncludePitchers, setDefenseIncludePitchers] = useState(false);
    const [showPositionalWeights, setShowPositionalWeights] = useState(false);
    const [lineupPriority, setLineupPriority] = useState<string[]>([]);
    const [showLineupPriority, setShowLineupPriority] = useState(false);
    const [draggedPlayer, setDraggedPlayer] = useState<string | null>(null);
    const [usePriorityFirst, setUsePriorityFirst] = useState<boolean>(loadUsePriorityFirstFromStorage());
    const [optimizationResultsMinimized, setOptimizationResultsMinimized] = useState(false);

    // Load lineup priority from localStorage on mount and reconcile with current players
    useEffect(() => {
        if (id && players && players.length > 0) {
            const savedPriority = loadLineupPriorityFromStorage(id);
            const currentPlayerNames = players.map(p => `${p.first_name} ${p.last_name}`);
            const currentPlayerSet = new Set(currentPlayerNames);

            if (savedPriority.length > 0) {
                // Filter out players that no longer exist
                const validSavedPlayers = savedPriority.filter(name => currentPlayerSet.has(name));

                // Find new players not in the saved list
                const savedPlayerSet = new Set(validSavedPlayers);
                const newPlayers = currentPlayerNames.filter(name => !savedPlayerSet.has(name));

                const reconciledPriority = [...validSavedPlayers, ...newPlayers];

                setLineupPriority(reconciledPriority);
                saveLineupPriorityToStorage(id, reconciledPriority);
            } else {
                setLineupPriority(currentPlayerNames);
                saveLineupPriorityToStorage(id, currentPlayerNames);
            }
        }
    }, [id, players]);

    const boonScores = useMemo(() => {
        if (!players) return undefined;
        return calculateBestPlayerForBoon(players, boonIncludeItems, boonFilterByPosition);
    }, [players, boonIncludeItems, boonFilterByPosition]);

    const bestPositions = useMemo(() => {
        if (!players) return undefined;
        const positionPlayers = defenseIncludePitchers
            ? players
            : players.filter(player => !['SP', 'RP', 'CL'].includes(player.position));
        return calculateBestPositionForPlayers(positionPlayers, defenseIgnoreItems);
    }, [players, defenseIgnoreItems, defenseIncludePitchers]);

    const optimalDefensiveLineup = useMemo(() => {
        if (!players) return undefined;
        const positionPlayers = defenseIncludePitchers
            ? players
            : players.filter(player => !['SP', 'RP', 'CL'].includes(player.position));
        return calculateOptimalDefensiveLineup(positionPlayers, defenseIgnoreItems);
    }, [players, defenseIgnoreItems, defenseIncludePitchers]);

    const updatePlayerOptimizeSetting = (playerName: string, setting: OptimizationMode) => {
        const updatedSettings = {
            ...playerOptimizeSettings,
            [playerName]: setting
        };
        setPlayerOptimizeSettings(updatedSettings);
        savePlayerOptimizeSettingsToStorage(updatedSettings);
    };

    const getEffectiveOptimizeSetting = (playerName: string): OptimizationMode => {
        if (playerOptimizeSettings[playerName]) {
            return playerOptimizeSettings[playerName];
        }
        return 'strength'; // Default to strength
    };


    const updateCustomWeight = (playerId: string, attribute: string, weight: number) => {
        const updatedWeights = {
            ...customPlayerWeights,
            [playerId]: {
                ...customPlayerWeights[playerId],
                [attribute]: weight
            }
        };
        setCustomPlayerWeights(updatedWeights);
        saveCustomPlayerWeightsToStorage(updatedWeights);
    };

    // Update global weight for a specific attribute
    const updateGlobalWeight = (attribute: string, weight: number) => {
        setGlobalWeights(prev => ({
            ...prev,
            [attribute]: weight
        }));
    };

    // Apply a specific global weight to all players
    const applyGlobalWeightToAll = (attribute: string) => {
        if (!players || globalWeights[attribute] === undefined) return;

        const weight = globalWeights[attribute];
        const updatedWeights: Record<string, Record<string, number>> = { ...customPlayerWeights };

        players.forEach(player => {
            const playerName = `${player.first_name} ${player.last_name}`;
            if (!updatedWeights[playerName]) {
                updatedWeights[playerName] = {};
            }
            updatedWeights[playerName][attribute] = weight;
        });

        setCustomPlayerWeights(updatedWeights);
        saveCustomPlayerWeightsToStorage(updatedWeights);
    };

    // Apply all global weights to all players at once
    const applyAllGlobalWeights = () => {
        if (!players || Object.keys(globalWeights).length === 0) return;

        const updatedWeights: Record<string, Record<string, number>> = { ...customPlayerWeights };

        players.forEach(player => {
            const playerName = `${player.first_name} ${player.last_name}`;
            if (!updatedWeights[playerName]) {
                updatedWeights[playerName] = {};
            }
            Object.entries(globalWeights).forEach(([attribute, weight]) => {
                updatedWeights[playerName][attribute] = weight;
            });
        });

        setCustomPlayerWeights(updatedWeights);
        saveCustomPlayerWeightsToStorage(updatedWeights);
    };

    // Initialize custom weights based on default positional weights
    const initializePlayerWeights = (player: Player) => {
        const playerName = `${player.first_name} ${player.last_name}`;
        const playerTalk = reducePlayerTalk(player);

        if (!customPlayerWeights[playerName]) {
            const defaultWeights: Record<string, number> = {};

            Object.keys(playerTalk).forEach(attribute => {
                if (shouldFilterAttribute(attribute, player)) return;

                defaultWeights[attribute] = getPositionalWeights(PositionalWeights, player.position, attribute, 1.0);
            });

            const updatedWeights = {
                ...customPlayerWeights,
                [playerName]: defaultWeights
            };
            setCustomPlayerWeights(updatedWeights);
            saveCustomPlayerWeightsToStorage(updatedWeights);
        } else {
            // Check if there are new attributes in playerTalk that aren't in customPlayerWeights
            const existingWeights = customPlayerWeights[playerName];
            const newAttributes: Record<string, number> = {};
            let hasNewAttributes = false;

            Object.keys(playerTalk).forEach(attribute => {
                if (shouldFilterAttribute(attribute, player)) return;

                if (!(attribute in existingWeights)) {
                    newAttributes[attribute] = getPositionalWeights(PositionalWeights, player.position, attribute, 1.0);
                    hasNewAttributes = true;
                }
            });

            if (hasNewAttributes) {
                const updatedWeights = {
                    ...customPlayerWeights,
                    [playerName]: {
                        ...existingWeights,
                        ...newAttributes
                    }
                };
                setCustomPlayerWeights(updatedWeights);
                saveCustomPlayerWeightsToStorage(updatedWeights);
            }
        }
    };

    // Reset all custom weights with flexible weight calculation
    const resetAllWeights = (usePositionalWeights: boolean = false) => {
        if (!players) return;

        const resetWeights: Record<string, Record<string, number>> = {};

        players.forEach(player => {
            const playerName = `${player.first_name} ${player.last_name}`;
            const playerWeights: Record<string, number> = {};
            const playerTalk = reducePlayerTalk(player);

            Object.keys(playerTalk).forEach(attribute => {
                if (shouldFilterAttribute(attribute, player)) return;

                playerWeights[attribute] = usePositionalWeights
                    ? getPositionalWeights(PositionalWeights, player.position, attribute, 1.0)
                    : 1.0;
            });

            resetWeights[playerName] = playerWeights;
        });

        setCustomPlayerWeights(resetWeights);
        saveCustomPlayerWeightsToStorage(resetWeights);
    };

    const resetAllCustomWeights = () => resetAllWeights(true);
    const resetAllWeightsToNeutral = () => resetAllWeights(false);

    // Helper function to reset individual player weights
    const resetPlayerWeights = (player: Player, usePositionalWeights: boolean) => {
        const playerName = `${player.first_name} ${player.last_name}`;
        const playerTalk = reducePlayerTalk(player);
        const resetWeights: Record<string, number> = {};

        Object.keys(playerTalk).forEach(attribute => {
            if (shouldFilterAttribute(attribute, player)) return;
            const originalWeight = customPlayerWeights[playerName]?.[attribute] ?? 1.0;
            resetWeights[attribute] = usePositionalWeights
                ? getPositionalWeights(PositionalWeights, player.position, attribute, originalWeight)
                : 1.0;
        });

        const updatedWeights = {
            ...customPlayerWeights,
            [playerName]: resetWeights
        };
        setCustomPlayerWeights(updatedWeights);
        saveCustomPlayerWeightsToStorage(updatedWeights);
    };

    // Reset individual player weights to positional weights
    const resetPlayerWeightsToPositional = (player: Player) => resetPlayerWeights(player, true);

    // Reset individual player weights to 1.0
    const resetPlayerWeightsToNeutral = (player: Player) => resetPlayerWeights(player, false);

    // Reset all player optimization settings to the selected setting
    const resetAllOptimizeSettings = () => {
        if (!players) return;

        const resetSettings: Record<string, OptimizationMode> = {};

        players.forEach(player => {
            const playerName = `${player.first_name} ${player.last_name}`;
            resetSettings[playerName] = resetOptimizeSetting;
        });

        setPlayerOptimizeSettings(resetSettings);
        savePlayerOptimizeSettingsToStorage(resetSettings);
    };

    const toggle = (label: string) => { setActiveTooltip((prev) => (prev === label ? null : label)); };
    const toggleOptimized = (label: string) => { setActiveOptimizedTooltip((prev) => (prev === label ? null : label)); };
    const togglePlayerCollapse = (playerName: string) => {
        setCollapsedPlayers((prev) => ({
            ...prev,
            [playerName]: !prev[playerName]
        }));
    };

    // hide or show all collapses
    const toggleAllPlayers = () => {
        if (!players) return;

        const anyExpanded = players.some(player => {
            const playerName = `${player.first_name} ${player.last_name}`;
            return !collapsedPlayers[playerName];
        });

        if (anyExpanded) {
            const allCollapsed: Record<string, boolean> = {};
            players.forEach(player => {
                const playerName = `${player.first_name} ${player.last_name}`;
                allCollapsed[playerName] = true;
            });
            setCollapsedPlayers(allCollapsed);
        } else {
            setCollapsedPlayers({});
        }
    };

    async function APICalls() {
        try {
            const teamRes = await fetch(`/nextapi/team/${id}`);
            if (!teamRes.ok) throw new Error('Failed to load team data');
            const team = MapAPITeamResponse(await teamRes.json());
            setTeam(team);

            const playersRes = await fetch(`/nextapi/players?ids=${team.players.map((p: TeamPlayer) => p.player_id).join(',')}`);
            if (!playersRes.ok) throw new Error('Failed to load player data');
            const players = await playersRes.json();

            // Create a map of player_id to slot from team.players to handle bad DH position
            const playerSlotMap = new Map(team.players.map((p: TeamPlayer) => [p.player_id, p.slot]));
            setPlayers(players.players.map((p: any) => {
                const mappedPlayer = MapAPIPlayerResponse(p);
                const slot = playerSlotMap.get(mappedPlayer.id);
                // We mainly want to do this for DH
                if (slot && p.PositionType == "Batter") {
                    mappedPlayer.position = slot;
                }
                return mappedPlayer;
            }).sort((a: Player, b: Player) => {
                return positionsList.indexOf(a.position) - positionsList.indexOf(b.position);
            }));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        APICalls();
    }, [id]);

    // Initialize global weights when players load
    useEffect(() => {
        if (!players || players.length === 0) return;

        const allAttributes = new Set<string>();
        players.forEach(player => {
            const playerTalk = reducePlayerTalk(player);
            Object.keys(playerTalk).forEach(attribute => {
                if (!shouldFilterAttribute(attribute, player)) {
                    allAttributes.add(attribute);
                }
            });
        });

        const initialGlobalWeights: Record<string, number> = {};
        allAttributes.forEach(attr => {
            initialGlobalWeights[attr] = 1.0; // Default to 1.0
        });

        setGlobalWeights(initialGlobalWeights);
    }, [players]);

    useEffect(() => {
        if (!players) return;

        const stats = players?.map((player: Player) => getPlayerStatRows({ statsPlayer: player, }));
        setEquippedEquipment(players?.flatMap((player: Player) => Object.values(player.equipment).map((equip) => fudgeRareName(equip))));
        const statPlayers: Record<string, Record<string, string | number>> = stats.reduce((acc, rowSet) => {
            for (const row of rowSet) {
                const playerId = row.PlayerName;
                const statName = row.Stat;
                const value = row.NominalTotal;

                if (!acc[playerId]) acc[playerId] = {};
                acc[playerId][statName] = value;
            }
            return acc;
        }, {} as Record<string, Record<string, string | number>>);
        setStatPlayers(statPlayers);
    }, [players]);

    useEffect(() => {
        if (!statPlayers || !players) return;
        setWeights(weights);
        const scored = players.map((p) => {
            const playerName = `${p.first_name} ${p.last_name}`;
            const customWeights = customPlayerWeights[playerName] || {};
            const effectiveOptimizeSetting = getEffectiveOptimizeSetting(playerName);
            const playerWeights = getStatWeights(p, effectiveOptimizeSetting, customWeights);
            const playerTalk: Record<string, number> = reducePlayerTalk(p);
            const lesserBoonName = p.lesser_boon ? p.lesser_boon.name : '';

            return {
                name: playerName,
                scores: {
                    head: p.equipment.head ? scoreEquipment(p.equipment.head, playerTalk, playerWeights, lesserBoonName) : 0,
                    body: p.equipment.body ? scoreEquipment(p.equipment.body, playerTalk, playerWeights, lesserBoonName) : 0,
                    hands: p.equipment.hands ? scoreEquipment(p.equipment.hands, playerTalk, playerWeights, lesserBoonName) : 0,
                    feet: p.equipment.feet ? scoreEquipment(p.equipment.feet, playerTalk, playerWeights, lesserBoonName) : 0,
                    accessory: p.equipment.accessory ? scoreEquipment(p.equipment.accessory, playerTalk, playerWeights, lesserBoonName) : 0,
                }
            };
        });
        setScored(scored);
    }, [statPlayers, players, customPlayerWeights, playerOptimizeSettings]);

    const handleOptimize = useCallback(() => {
        if (!players || !statPlayers) return;

        const allItems = [...equippedEquipment, ...parsedEquipment].filter(Boolean);
        const itemPool = new Map<string, Equipment>();
        allItems.forEach(item => {
            if (item.rareName) {
                itemPool.set(item.rareName, item);
            }
        });

        type PotentialAssignment = { score: number; item: Equipment; player: Player; slot: string; playerPriority: number };
        const potentialAssignments: PotentialAssignment[] = [];

        // Create a priority map for faster lookup
        const priorityMap = new Map<string, number>();
        lineupPriority.forEach((name, index) => {
            priorityMap.set(name, index);
        });

        for (const player of players) {
            const playerName = `${player.first_name} ${player.last_name}`;
            const customWeights = customPlayerWeights[playerName] || {};
            const effectiveOptimizeSetting = getEffectiveOptimizeSetting(playerName);
            const playerWeights = getStatWeights(player, effectiveOptimizeSetting, customWeights);
            if (!playerWeights) continue;
            const playerTalk: Record<string, number> = reducePlayerTalk(player);
            const playerPriority = priorityMap.get(playerName) ?? 999; // Default to low priority if not in list
            const lesserBoonName = player.lesser_boon ? player.lesser_boon.name : '';

            for (const item of itemPool.values()) {
                const score = scoreEquipment(item, playerTalk, playerWeights, lesserBoonName);
                potentialAssignments.push({ score, item, player, slot: item.slot!, playerPriority });
            }
        }

        // Sort first by player priority (ascending), then by score (descending)
        // OR sort by score first if usePriorityFirst is false
        potentialAssignments.sort((a, b) => {
            if (usePriorityFirst) {
                // Priority-first mode: higher priority players get their best items first
                if (a.playerPriority !== b.playerPriority) {
                    return a.playerPriority - b.playerPriority; // Lower priority number = higher priority
                }
                return b.score - a.score; // Higher score is better
            } else {
                // Score-first mode: best item-player matches get assigned first
                if (a.score !== b.score) {
                    return b.score - a.score; // Higher score is better
                }
                return a.playerPriority - b.playerPriority; // Lower priority number breaks ties
            }
        });

        const assignedItems = new Set<string>();
        const filledSlots = new Set<string>();
        const newPlayerEquipment: Record<string, Record<string, Equipment>> = {};
        players.forEach(p => newPlayerEquipment[p.id] = {});

        for (const assignment of potentialAssignments) {
            const { item, player, slot } = assignment;
            const slotKey = `${player.id}-${slot}`;

            if (item.rareName && !assignedItems.has(item.rareName) && !filledSlots.has(slotKey)) {
                newPlayerEquipment[player.id][slot.toLowerCase()] = item;
                assignedItems.add(item.rareName);
                filledSlots.add(slotKey);
            }
        }

        let newTotalScore = 0;

        const finalLineup = players.map(p => {
            const playerName = `${p.first_name} ${p.last_name}`;
            const customWeights = customPlayerWeights[playerName] || {};
            const effectiveOptimizeSetting = getEffectiveOptimizeSetting(playerName);
            const playerWeights = getStatWeights(p, effectiveOptimizeSetting, customWeights);
            const playerTalk: Record<string, number> = reducePlayerTalk(p);
            const lesserBoonName = p.lesser_boon ? p.lesser_boon.name : '';

            const finalEquipment = newPlayerEquipment[p.id];
            Object.values(finalEquipment).forEach(equip => {
                newTotalScore += scoreEquipment(equip, playerTalk, playerWeights, lesserBoonName);
            });
            return { ...p, equipment: finalEquipment };
        });

        const originalTotalScore = scored.reduce((total, p) => total + Object.values(p.scores as Record<string, number>).reduce((subTotal: number, s: number) => subTotal + s, 0), 0);

        setOptimizedLineup({ lineup: finalLineup, originalScore: originalTotalScore, newScore: newTotalScore });
    }, [players, statPlayers, equippedEquipment, parsedEquipment, customPlayerWeights, playerOptimizeSettings, scored, lineupPriority, usePriorityFirst]);    // Auto-run optimization
    useEffect(() => {
        if (autoOptimize && players && statPlayers && equippedEquipment.length > 0) {
            handleOptimize();
        }
    }, [autoOptimize, players, statPlayers, equippedEquipment, parsedEquipment, customPlayerWeights, playerOptimizeSettings, handleOptimize]);

    if (loading) return (<Loading />);

    if (!team) return (<div className="text-white text-center mt-10">Can't find that team</div>);

    return (
        <main className="mt-16 p-4" onClick={() => { setActiveTooltip(null); setActiveOptimizedTooltip(null); }}>
            <div>
                {/* Boon Optimization */}
                {boonScores && (
                    <div className="border border-theme-accent rounded-lg p-4 bg-theme-secondary/30">
                        <h3
                            className="text-lg font-bold mb-3 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={(e) => { e.stopPropagation(); setShowBoonScores(prev => !prev); }}
                        >
                            {showBoonScores ? '▼' : '▶'} Boon Optimization
                        </h3>
                        {showBoonScores && (
                            <>
                                <div className="mb-3 flex gap-4">
                                    <Tooltip content="These calculations won't be totally accurate as they include current boons and % items." position="right">
                                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={boonIncludeItems}
                                                onChange={(e) => setBoonIncludeItems(e.target.checked)}
                                                className="cursor-pointer"
                                            />
                                            <span className="text-xs">Include Items</span>
                                        </label>
                                    </Tooltip>
                                    <Tooltip content="When enabled, pitchers ignore batting/fielding attributes, batters ignore pitching attributes. Disable to include all attributes for all players." position="right">
                                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={boonFilterByPosition}
                                                onChange={(e) => setBoonFilterByPosition(e.target.checked)}
                                                className="cursor-pointer"
                                            />
                                            <span className="text-xs">Filter by Position</span>
                                        </label>
                                    </Tooltip>
                                </div>
                                {boonScores && (
                                    <BoonScoresTable boonScores={boonScores} />
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Combined Defensive Positions & Optimal Lineup Section */}
                <div className="border border-theme-accent rounded-lg p-4 bg-theme-secondary/30">

                    <h3
                        className="text-lg font-bold mb-3 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setShowBestPositions(prev => !prev)}
                    >
                        {showBestPositions ? '▼' : '▶'} Defensive Lineup Optimization
                    </h3>

                    {showBestPositions && bestPositions && optimalDefensiveLineup && (
                        <>
                            <p className="text-xs opacity-70 mb-3">
                                Based on regression analysis of fielding attributes and positional weights.
                            </p>

                            <div className="mb-3 flex gap-4">
                                <Tooltip content="Calculate defensive scores using base stats only (without items/boons)." position="right">
                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={defenseIgnoreItems}
                                            onChange={(e) => setDefenseIgnoreItems(e.target.checked)}
                                            className="cursor-pointer"
                                        />
                                        Ignore Items
                                    </label>
                                </Tooltip>
                                <Tooltip content="Include pitchers (SP, RP, CL) in defensive analysis." position="right">
                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={defenseIncludePitchers}
                                            onChange={(e) => setDefenseIncludePitchers(e.target.checked)}
                                            className="cursor-pointer"
                                        />
                                        Include Pitchers
                                    </label>
                                </Tooltip>
                            </div>

                            {/* Positional Weights Section */}
                            <div className="mb-4 border border-theme-accent/50 rounded-lg p-3 bg-theme-primary/30">
                                <h4
                                    className="text-sm font-bold mb-2 cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-2"
                                    onClick={() => setShowPositionalWeights(prev => !prev)}
                                >
                                    {showPositionalWeights ? '▼' : '▶'} View Positional Weights
                                </h4>

                                {showPositionalWeights && (
                                    <div className="mt-3 space-y-3">
                                        <p className="text-xs opacity-70 mb-3">
                                            Weights derived from OLS regression analysis of fielding value by position.
                                            Values normalized to 1.0-5.0 scale. R² values indicate model fit quality.
                                        </p>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'].map(position => {
                                                const weights = PositionalWeights[position];
                                                const nonZeroWeights = Object.entries(weights).filter(([_, value]) => value > 0);

                                                // R² values and key stats from comments
                                                const rSquared: Record<string, string> = {
                                                    'C': 'Awareness 5.77',
                                                    '1B': 'Composure 0.73, Reaction 2.15',
                                                    '2B': 'Reaction 3.17',
                                                    '3B': 'Composure 0.85, Reaction 6.01',
                                                    'SS': 'Arm 0.88, Composure 1.64, Reaction 5.29',
                                                    'LF': 'Acrobatics 6.68, Agility 3.41, Arm 3.83, Dexterity 2.28',
                                                    'CF': 'Acrobatics 7.24, Agility 4.57, Arm 4.06',
                                                    'RF': 'Acrobatics 6.93, Agility 2.85, Arm 4.43, Dexterity 2.04',
                                                    'DH': 'No fielding'
                                                };

                                                return (
                                                    <div key={position} className="bg-theme-secondary rounded p-3 border border-theme-accent/30">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className="font-bold text-yellow-400">{position}</span>
                                                            <span className="text-xs opacity-60">{rSquared[position]}</span>
                                                        </div>

                                                        {nonZeroWeights.length > 0 ? (
                                                            <div className="space-y-1">
                                                                {nonZeroWeights
                                                                    .sort((a, b) => b[1] - a[1])
                                                                    .map(([attr, weight]) => (
                                                                        <div key={attr} className="flex justify-between items-center text-xs">
                                                                            <span className="opacity-80">{attr}:</span>
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="w-20 bg-theme-primary rounded-full h-1.5">
                                                                                    <div
                                                                                        className="bg-blue-500 h-1.5 rounded-full"
                                                                                        style={{ width: `${(weight / 5.0) * 100}%` }}
                                                                                    />
                                                                                </div>
                                                                                <span className="font-mono w-8 text-right">{weight.toFixed(2)}</span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs opacity-50 italic">No fielding requirements</p>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Optimal Lineup Summary */}
                            <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-lg p-3 mb-4 border border-green-500/30">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-semibold text-green-400">⭐ Optimal Starting Lineup</span>
                                    <span className="text-sm font-bold text-green-400">
                                        Total Score: {optimalDefensiveLineup.totalScore.toFixed(1)} / 800
                                    </span>
                                </div>
                                <p className="text-xs opacity-70 mb-2">
                                    Maximum possible score is 800 (8 positions × 100 points each, DH doesn't matter). This lineup is optimized to maximize the total score across all defensive positions.
                                </p>
                                <div className="grid grid-cols-4 gap-2 text-xs">
                                    {optimalDefensiveLineup.lineup
                                        .sort((a, b) => {
                                            const positions = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'SP', 'RP', 'CL'];
                                            return positions.indexOf(a.position) - positions.indexOf(b.position);
                                        })
                                        .map((assignment) => (
                                            <div
                                                key={`${assignment.player.first_name} ${assignment.player.last_name}`}
                                                className="bg-theme-primary/50 rounded px-2 py-1"
                                            >
                                                <span className="font-bold text-yellow-400">{assignment.position}:</span>{' '}
                                                <span className="text-xs">{assignment.player.first_name} {assignment.player.last_name}</span>
                                            </div>
                                        ))}
                                </div>
                            </div>

                            {/* All Players Table */}
                            <div className="space-y-2">
                                {Object.entries(bestPositions)
                                    .sort((a, b) => {
                                        const positions = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'SP', 'RP', 'CL'];
                                        const posA = a[1].originalPosition;
                                        const posB = b[1].originalPosition;
                                        return positions.indexOf(posA) - positions.indexOf(posB);
                                    })
                                    .map(([playerName, data]) => {
                                        // Check if this player is in the optimal lineup
                                        const lineupAssignment = optimalDefensiveLineup.lineup.find(
                                            a => `${a.player.first_name} ${a.player.last_name}` === playerName
                                        );
                                        const isStarter = !!lineupAssignment;
                                        const starterPosition = lineupAssignment?.position;

                                        return (
                                            <div
                                                key={playerName}
                                                className={`rounded px-3 py-2 ${isStarter
                                                    ? 'bg-green-600/10 border border-green-500/30'
                                                    : 'bg-theme-primary'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        {isStarter && (
                                                            <span className="text-green-400 font-bold text-xs">⭐</span>
                                                        )}
                                                        <span className="font-semibold text-sm">
                                                            {playerName} ({data.originalPosition})
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs opacity-60">Best:</span>
                                                            <span className="text-lg font-bold text-blue-400">
                                                                {data.position}
                                                            </span>
                                                        </div>
                                                        {isStarter && starterPosition !== data.position && (
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs opacity-60">Assigned:</span>
                                                                <span className="text-lg font-bold text-green-400">
                                                                    {starterPosition}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Show all position scores in C→RF order */}
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH']
                                                        .map((pos) => {
                                                            const score = data.allScores[pos] || 0;
                                                            return (
                                                                <div
                                                                    key={pos}
                                                                    className={`text-xs px-2 py-0.5 rounded w-18 text-left ${pos === starterPosition
                                                                        ? 'bg-green-600 text-white font-semibold'
                                                                        : pos === data.position
                                                                            ? 'bg-blue-600 text-white font-semibold'
                                                                            : 'bg-theme-secondary opacity-60'
                                                                        }`}
                                                                >
                                                                    {pos}: {score.toFixed(0)}
                                                                </div>
                                                            );
                                                        })}
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>

                            {optimalDefensiveLineup.unassignedPlayers.length > 0 && (
                                <div className="mt-4 pt-3 border-t border-theme-accent/30">
                                    <h4 className="text-sm font-semibold mb-2 opacity-70">
                                        Bench Players ({optimalDefensiveLineup.unassignedPlayers.length}):
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {optimalDefensiveLineup.unassignedPlayers.map(player => (
                                            <span
                                                key={`${player.first_name} ${player.last_name}`}
                                                className="text-xs px-2 py-1 bg-theme-secondary rounded opacity-60"
                                            >
                                                {player.first_name} {player.last_name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
            <div className="mt-6 mb-4">
                <h2 className="font-bold text-3xl">
                    🪖 👕 🧤 👟 📿 ITEM OPTIMIZATION 📿 👟 🧤 👕 🪖
                </h2>
            </div>
            <span className="font-bold text-lg mb-3">How does optimization work?</span><br></br>
            Optimization calculates weights based on the player's current stats. Then, depending on which option you have selected, it either<br></br>
            - Tries to make already large numbers larger, resulting in a bunch of stand out players.<br></br>
            - Tries to make all the small numbers larger, resulting in a more averaged team of players.<br></br>
            - Treats all stats equally, allowing for custom weights to shine.<br></br>
            It calculates these through a greedy algorithm, testing the resulting score of every piece of equipment on every player, and then assigning them to the one with the highest score<br></br><br></br>
            <span className="font-bold text-lg">Drawbacks</span><br></br>
            - Items are equipped from top to bottom. This is possible to change, and I plan on that soon<br></br>
            - Inventories can only really be copied on computer, so this can only reorganize equipment on mobile<br></br>
            <span className="italic font-semibold">- This can only calculate score for known stat values, so if not every player on your team has every talk unlocked, this will not be fully accurate</span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                    <h2 className="text-xl font-bold mb-2">(Optional) Paste Inventory HTML</h2>
                    <form onSubmit={(e) => { e.preventDefault(); setParsedEquipment(parseInventoryHTML(entryText)); }}>
                        <textarea
                            className="w-full h-40 bg-theme-primary border border-theme-accent rounded p-2 text-sm"
                            onChange={(e) => setEntryText(e.target.value)}
                            value={entryText}
                            placeholder="Open up inspect element, find the div that holds your items, then copy and paste the outerHTML here. This currently supports one page."
                        />
                        <button type="submit" className="bg-theme-secondary hover:opacity-80 px-4 py-2 rounded mt-2">Parse Inventory</button>

                    </form>

                    <div className="mt-6 mb-2">
                        <h2 className="text-xl font-bold mb-2">Original Team Scores</h2>
                        <div className="flex gap-2">
                            <Tooltip content="Set all weights to positional weights.">
                                <button onClick={resetAllCustomWeights} disabled={!players} className="bg-red-500 hover:bg-red-600 disabled:bg-gray-500 px-3 py-1 rounded text-white text-sm">
                                    Reset all to Positional Weights
                                </button>
                            </Tooltip>
                            <Tooltip content="Set all weights to 1.0.">

                                <button onClick={resetAllWeightsToNeutral} disabled={!players} className="bg-red-500 hover:bg-red-600 disabled:bg-gray-500 px-3 py-1 rounded text-white text-sm">
                                    Reset all to 1.0
                                </button>
                            </Tooltip>

                        </div>
                        <div className="flex gap-2 items-center mt-3">
                            <span className="text-sm font-medium">Reset all optimization settings to:</span>
                            <select
                                value={resetOptimizeSetting}
                                onChange={(e) => setResetOptimizeSetting(e.target.value as OptimizationMode)}
                                className="bg-theme-secondary text-theme-text px-2 py-1 rounded text-sm"
                            >
                                <option value="strength">Play to Strengths</option>
                                <option value="weakness">Play to Weaknesses</option>
                                <option value="neutral">Neutral</option>
                            </select>
                            <button
                                onClick={resetAllOptimizeSettings}
                                disabled={!players}
                                className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-white text-sm"
                            >
                                Reset All
                            </button>
                        </div>
                        <div className="flex gap-2 items-center mt-3">
                            <span className="text-sm font-medium">Custom Weights Visibility:</span>
                            <button
                                onClick={toggleAllPlayers}
                                disabled={!players}
                                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-white text-sm"
                            >
                                {players && players.some(player => {
                                    const playerName = `${player.first_name} ${player.last_name}`;
                                    return !collapsedPlayers[playerName];
                                }) ? 'Hide All' : 'Show All'}
                            </button>
                        </div>
                    </div>

                </div>

                {/* Optimization Settings */}
                <div className="">
                    <h2 className="text-xl font-bold mb-2">Optimization</h2>
                    <div className="flex flex-col gap-2">
                        <Tooltip content="Automatically re-optimize on weight change." >
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={autoOptimize}
                                    onChange={(e) => setAutoOptimize(e.target.checked)}
                                    className="mr-2"
                                />
                                Auto-optimize on changes
                            </label>
                        </Tooltip>
                    </div>
                    <br></br>
                    <button onClick={handleOptimize} disabled={!players || !statPlayers} className="bg-theme-secondary hover:opacity-80 disabled:bg-gray-500 px-4 py-2 rounded">
                        Optimize Equipment
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Global Weights Section */}
                <div className="mt-6 border border-theme-accent rounded-lg p-4 bg-theme-secondary/30">
                    <h3
                        className="text-lg font-bold mb-3 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setShowGlobalWeights(prev => !prev)}
                    >
                        {showGlobalWeights ? '▼' : '▶'} Global Weights
                    </h3>

                    {showGlobalWeights && (
                        <>
                            <p className="text-xs opacity-70 mb-3">
                                Set weights globally and apply them to all players at once.
                            </p>

                            <div className="mb-3">
                                <button
                                    onClick={applyAllGlobalWeights}
                                    disabled={!players || Object.keys(globalWeights).length === 0}
                                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-500 px-4 py-2 rounded text-white text-sm font-semibold w-full"
                                >
                                    Apply All Global Weights to All Players
                                </button>
                            </div>

                            {(() => {
                                // Group global weights by category
                                const groupedGlobalWeights: Record<string, [string, number][]> = {
                                    'Batting': [],
                                    'Pitching': [],
                                    'Defense': [],
                                    'Running': [],
                                    'Other': []
                                };

                                Object.entries(globalWeights).forEach(([attribute, weight]) => {
                                    const attrType = attrTypes[attribute] || 'Other';
                                    if (groupedGlobalWeights[attrType]) {
                                        groupedGlobalWeights[attrType].push([attribute, weight]);
                                    }
                                });

                                return Object.entries(groupedGlobalWeights).map(([category, attributes]) => {
                                    if (attributes.length === 0) return null;

                                    return (
                                        <div
                                            key={category}
                                            className="border border-theme-accent rounded p-2 mb-3"
                                        >
                                            <h4 className="text-sm font-semibold mb-2 text-center">
                                                {category}
                                            </h4>

                                            <div className="space-y-1.5">
                                                {attributes.map(([attribute, weight]) => (
                                                    <div
                                                        key={attribute}
                                                        className="flex items-center gap-2 bg-theme-primary rounded px-2 py-1.5"
                                                    >
                                                        <div className="w-1/8 flex-shrink-0">
                                                            <Tooltip
                                                                content={statDefinitions[attribute] || attribute}
                                                                className="z-50"
                                                                position="right"
                                                            >
                                                                <span className="text-xs truncate cursor-help block">
                                                                    {attribute}
                                                                </span>
                                                            </Tooltip>
                                                        </div>

                                                        <div className="flex items-center gap-2 w-7/8 flex-shrink-0">
                                                            <input
                                                                type="range"
                                                                step="0.1"
                                                                min="0"
                                                                max="5"
                                                                value={weight.toFixed(1)}
                                                                onChange={(e) => updateGlobalWeight(
                                                                    attribute,
                                                                    parseFloat(e.target.value) || 0
                                                                )}
                                                                className="flex-1"
                                                                title={weight.toFixed(1)}
                                                            />
                                                            <span className="text-xs font-medium w-8 text-center flex-shrink-0">
                                                                {weight.toFixed(1)}
                                                            </span>
                                                            <button
                                                                onClick={() => applyGlobalWeightToAll(attribute)}
                                                                className="bg-blue-600 hover:bg-blue-700 px-2 py-0.5 rounded text-white text-xs flex-shrink-0"
                                                                title={`Apply ${attribute} weight to all players`}
                                                            >
                                                                Apply
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                }).filter(Boolean);
                            })()}
                        </>
                    )}
                </div>
                {/* Lineup priority ordering */}
                <div className="mt-6 border border-theme-accent rounded-lg p-4 bg-theme-secondary/30">
                    <h3
                        className="text-lg font-bold mb-3 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setShowLineupPriority(prev => !prev)}
                    >
                        {showLineupPriority ? '▼' : '▶'} Lineup Priority
                    </h3>

                    {showLineupPriority && (
                        <>
                            <p className="text-xs opacity-70 mb-3">
                                Drag and drop to reorder players. Higher priority players get their best items first during optimization.
                            </p>

                            <div className="mb-4 flex items-center gap-3 p-3 bg-theme-primary rounded-lg">
                                <input
                                    type="checkbox"
                                    id="usePriorityFirst"
                                    checked={usePriorityFirst}
                                    onChange={(e) => {
                                        const newValue = e.target.checked;
                                        setUsePriorityFirst(newValue);
                                        saveUsePriorityFirstToStorage(newValue);
                                    }}
                                    className="w-4 h-4 cursor-pointer"
                                />
                                <label htmlFor="usePriorityFirst" className="text-sm cursor-pointer flex-1">
                                    <span className="font-semibold">Priority-First Optimization</span>
                                    <span className="block text-xs opacity-70 mt-1">
                                        {usePriorityFirst
                                            ? "Higher priority players get their best items first, even if it means lower-priority players get worse matches."
                                            : "Best item-player matches are assigned first, ignoring priority order. (Original greedy algorithm)"
                                        }
                                    </span>
                                </label>
                            </div>

                            <div className="space-y-2">
                                {lineupPriority.map((playerName, index) => (
                                    <div
                                        key={playerName}
                                        draggable
                                        onDragStart={() => setDraggedPlayer(playerName)}
                                        onDragEnd={() => setDraggedPlayer(null)}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            if (draggedPlayer && draggedPlayer !== playerName) {
                                                const newPriority = [...lineupPriority];
                                                const draggedIndex = newPriority.indexOf(draggedPlayer);
                                                const targetIndex = index;

                                                // Remove dragged item and insert at new position
                                                newPriority.splice(draggedIndex, 1);
                                                newPriority.splice(targetIndex, 0, draggedPlayer);

                                                setLineupPriority(newPriority);
                                                // Save to localStorage
                                                saveLineupPriorityToStorage(id, newPriority);
                                            }
                                        }}
                                        className={`flex items-center gap-3 p-3 rounded-lg cursor-move transition-all ${draggedPlayer === playerName
                                            ? 'opacity-50 bg-theme-accent/20'
                                            : 'bg-theme-primary hover:bg-theme-secondary/50'
                                            }`}
                                    >
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-theme-accent text-sm font-bold">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 font-medium">
                                            {playerName}
                                            {players && (
                                                <span className="ml-2 text-xs opacity-60">
                                                    {players.find(p => `${p.first_name} ${p.last_name}` === playerName)?.position}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const newPriority = [...lineupPriority];
                                                    newPriority.splice(index, 1);
                                                    newPriority.unshift(playerName);
                                                    setLineupPriority(newPriority);
                                                    saveLineupPriorityToStorage(id, newPriority);
                                                }}
                                                className="px-2 py-1 text-xs bg-theme-accent hover:opacity-80 rounded"
                                                title="Move to top"
                                            >
                                                ⬆️ Top
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const newPriority = [...lineupPriority];
                                                    newPriority.splice(index, 1);
                                                    newPriority.push(playerName);
                                                    setLineupPriority(newPriority);
                                                    saveLineupPriorityToStorage(id, newPriority);
                                                }}
                                                className="px-2 py-1 text-xs bg-theme-accent hover:opacity-80 rounded"
                                                title="Move to bottom"
                                            >
                                                ⬇️ Bottom
                                            </button>
                                        </div>
                                        <div className="text-theme-accent text-xl cursor-grab active:cursor-grabbing">
                                            ⋮⋮
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Player grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                {players?.map((player, _index) => {
                    const playerName = `${player.first_name} ${player.last_name}`;
                    const optimizedPlayer = optimizedLineup?.lineup.find(p => `${p.first_name} ${p.last_name}` === playerName);
                    const customWeights = customPlayerWeights[playerName] || {};
                    const effectiveOptimizeSetting = getEffectiveOptimizeSetting(playerName);
                    const playerWeights = getStatWeights(player, effectiveOptimizeSetting, customWeights);
                    const playerTalk: Record<string, number> = reducePlayerTalk(player);
                    const originalTotal = ((Object.values(scored.find(s => s.name === playerName)?.scores || []) as number[])
                        .reduce((a, b) => a + b, 0)).toFixed(2);
                    const lesserBoonName = player.lesser_boon ? player.lesser_boon.name : '';
                    const optimizedTotal = Object.values(optimizedPlayer?.equipment || {}).reduce((acc, equip) => {
                        return acc + (equip ? scoreEquipment(equip, playerTalk, playerWeights, lesserBoonName) : 0)
                    }, 0).toFixed(2)

                    return (

                        <div key={player.id} className="bg-theme-primary py-2 px-4 rounded-xl h-full">
                            <div className="text-xl mb-2 text-center font-bold mt-2">{playerName} {player.position} {getLesserBoonEmoji(lesserBoonName)}</div>

                            {optimizedLineup ? (
                                <div className="flex gap-6 justify-center">
                                    {/* Original Equipment */}
                                    <div className="flex flex-col items-center">
                                        <h3 className="text-sm font-semibold mb-2">
                                            Original
                                        </h3>

                                        <div className="flex justify-center flex-wrap gap-4 mb-2">
                                            {(['head', 'body', 'hands', 'feet', 'accessory'] as EquipmentSlot[]).map((slot) => {
                                                const originalEquip = player.equipment[slot];
                                                const optimizedEquip = optimizedPlayer?.equipment[slot];
                                                const originalScore = scored.find(s => s.name === playerName)?.scores[slot] || 0;
                                                const hasChange = optimizedEquip && originalEquip?.rareName !== optimizedEquip?.rareName;

                                                return (
                                                    <div
                                                        key={`${player.id}-${slot}-orig`}
                                                        className={`flex flex-col items-center w-24 ${hasChange ? 'opacity-60' : ''}`}
                                                    >
                                                        <div className="text-[10px] text-center mb-1 font-semibold">
                                                            {capitalize(slot)}
                                                        </div>

                                                        <EquipmentTooltip
                                                            equipment={originalEquip}
                                                            name=""
                                                            isActive={activeTooltip === `${player.id}-${slot}`}
                                                            onToggle={() => toggle(`${player.id}-${slot}`)}
                                                            appendName={false}
                                                        />

                                                        <div className="mt-1 text-sm">
                                                            {originalScore.toFixed(2)}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="text-center font-bold">
                                            Total: {originalTotal}
                                        </div>
                                    </div>

                                    {/* Optimized Equipment */}
                                    <div className="flex flex-col items-center">
                                        <h3 className="text-sm font-semibold mb-2 text-green-500">
                                            Optimized
                                        </h3>

                                        <div className="flex justify-center flex-wrap gap-4 mb-2">
                                            {(['head', 'body', 'hands', 'feet', 'accessory'] as EquipmentSlot[]).map((slot) => {
                                                const originalEquip = player.equipment[slot];
                                                const optimizedEquip = optimizedPlayer?.equipment[slot];
                                                const optimizedScore = (optimizedEquip && playerWeights)
                                                    ? scoreEquipment(optimizedEquip, playerTalk, playerWeights, lesserBoonName)
                                                    : 0;
                                                const hasChange = optimizedEquip && originalEquip?.rareName !== optimizedEquip?.rareName;

                                                return (
                                                    <div
                                                        key={`${player.id}-${slot}-opt`}
                                                        className={`flex flex-col items-center w-20 ${hasChange ? 'ring-2 ring-green-500 rounded' : ''}`}
                                                    >
                                                        <div className="text-[10px] text-center mb-1 font-semibold">
                                                            {capitalize(slot)}
                                                        </div>

                                                        <EquipmentTooltip
                                                            equipment={optimizedEquip}
                                                            name=""
                                                            isActive={activeOptimizedTooltip === `${player.id}-${slot}-opt`}
                                                            onToggle={() => toggleOptimized(`${player.id}-${slot}-opt`)}
                                                            appendName={false}
                                                        />

                                                        <div className="mt-1 text-sm">
                                                            {optimizedScore.toFixed(2)}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className={`text-center font-bold ${parseFloat(optimizedTotal) > parseFloat(originalTotal)
                                            ? 'text-green-500'
                                            : 'text-red-500'
                                            }`}>
                                            Total: {optimizedTotal}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex justify-center flex-wrap gap-4 my-4">
                                        {(['head', 'body', 'hands', 'feet', 'accessory'] as EquipmentSlot[]).map((slot) => (
                                            <div
                                                key={`${player.id}-${slot}`}
                                                className="flex flex-col items-center w-20"
                                            >
                                                <EquipmentTooltip
                                                    equipment={player.equipment[slot]}
                                                    name={capitalize(slot)}
                                                    isActive={activeTooltip === `${player.id}-${slot}`}
                                                    onToggle={() => toggle(`${player.id}-${slot}`)}
                                                    appendName={false}
                                                />

                                                <div className="mt-1 text-sm">
                                                    {scored.find(s => s.name === playerName)?.scores[slot].toFixed(2)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="text-center font-bold">
                                        Total: {(
                                            (Object.values(scored.find(s => s.name === playerName)?.scores || []) as number[])
                                                .reduce((a, b) => a + b, 0)
                                        ).toFixed(2)}
                                    </div>
                                </div>
                            )}

                            {/* Custom Weights Section */}
                            <div className="mt-4 space-y-3">
                                <h3
                                    className="text-sm font-semibold mb-3 cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => togglePlayerCollapse(playerName)}
                                >
                                    {collapsedPlayers[playerName] ? '▶' : '▼'} Custom Weights
                                </h3>

                                {!collapsedPlayers[playerName] && (
                                    <>
                                        {/* Optimization Setting Dropdown */}
                                        <div className="mb-3">
                                            <label className="block text-sm font-medium mb-1">
                                                Optimization Setting:
                                            </label>
                                            <select
                                                className="w-full bg-theme-secondary text-theme-text px-2 py-1 rounded text-sm"
                                                value={playerOptimizeSettings[playerName] || 'strength'}
                                                onChange={(e) => updatePlayerOptimizeSetting(
                                                    playerName,
                                                    e.target.value as OptimizationMode
                                                )}
                                            >
                                                <option value="strength">Play to Strengths</option>
                                                <option value="weakness">Play to Weaknesses</option>
                                                <option value="neutral">Neutral</option>
                                            </select>
                                        </div>

                                        {/* Reset Buttons */}
                                        <div className="mb-3 flex gap-2">
                                            <Tooltip content="Reset this player's custom weights to positional weights">
                                                <button
                                                    onClick={() => resetPlayerWeightsToPositional(player)}
                                                    className="bg-gray-500 hover:bg-gray-600 px-3 py-1 rounded text-white text-sm"
                                                >
                                                    Reset defensive weights to positional weights
                                                </button>
                                            </Tooltip>

                                            <Tooltip content="Reset this player's custom weights to 1.0">
                                                <button
                                                    onClick={() => resetPlayerWeightsToNeutral(player)}
                                                    className="bg-gray-500 hover:bg-gray-600 px-3 py-1 rounded text-white text-sm"
                                                >
                                                    Reset weights to 1.0
                                                </button>
                                            </Tooltip>
                                        </div>

                                        {/* Weight Sliders by Category */}
                                        {(() => {
                                            initializePlayerWeights(player);
                                            const playerWeights = customPlayerWeights[playerName] || {};

                                            // Group attributes by type
                                            const groupedAttributes: Record<string, [string, number][]> = {
                                                'Batting': [],
                                                'Pitching': [],
                                                'Defense': [],
                                                'Running': [],
                                                'Other': []
                                            };

                                            Object.entries(playerWeights).forEach(([attribute, weight]) => {
                                                const attrType = attrTypes[attribute] || 'Other';
                                                if (groupedAttributes[attrType]) {
                                                    groupedAttributes[attrType].push([attribute, weight]);
                                                }
                                            });

                                            return Object.entries(groupedAttributes).map(([category, attributes]) => {
                                                if (attributes.length === 0) return null;

                                                return (
                                                    <div
                                                        key={category}
                                                        className="border border-theme-accent rounded p-2"
                                                    >
                                                        <h4 className="text-sm font-semibold mb-2 text-center">
                                                            {category}
                                                        </h4>

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
                                                            {attributes.map(([attribute, weight]) => {
                                                                const playerTalk = reducePlayerTalk(player);
                                                                const baseTotalValue = playerTalk[attribute] || 0;

                                                                return (
                                                                    <div
                                                                        key={attribute}
                                                                        className="flex items-center justify-between bg-theme-secondary rounded px-1 py-0.5"
                                                                    >
                                                                        <Tooltip
                                                                            content={statDefinitions[attribute] || attribute}
                                                                            className="z-50"
                                                                        >
                                                                            <span className="text-xs truncate cursor-help">
                                                                                {attribute}: ({(baseTotalValue * 100).toFixed(0)}) {getBoonBonusDisplay(lesserBoonName, attribute)}
                                                                            </span>
                                                                        </Tooltip>

                                                                        <div className="flex items-center gap-1 ml-2">
                                                                            <input
                                                                                type="range"
                                                                                step="0.1"
                                                                                min="0"
                                                                                max="5"
                                                                                value={weight.toFixed(1)}
                                                                                onChange={(e) => updateCustomWeight(
                                                                                    playerName,
                                                                                    attribute,
                                                                                    parseFloat(e.target.value) || 0
                                                                                )}
                                                                                className="w-3/4"
                                                                                title={weight.toFixed(1)}
                                                                            />
                                                                            <span className="text-xs font-medium w-6 text-center">
                                                                                {weight.toFixed(1)}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            }).filter(Boolean);
                                        })()}
                                    </>
                                )}
                            </div>
                            {/*  */}
                        </div>
                    );
                })}
            </div>

            {/* Fixed Optimization Results - Bottom Right Corner */}
            {optimizedLineup && (
                <div className={`fixed bottom-4 right-4 z-50 ${optimizationResultsMinimized ? 'w-24' : 'w-96'} max-w-[calc(100vw-2rem)]`}>
                    <div className="bg-theme-secondary border-2 border-theme-accent rounded-lg p-5 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            {!optimizationResultsMinimized && <h2 className="text-2xl font-bold">Optimization Results</h2>}
                            <button
                                onClick={() => setOptimizationResultsMinimized(prev => !prev)}
                                className="text-2xl hover:opacity-70 transition-opacity"
                                title={optimizationResultsMinimized ? "Maximize" : "Minimize"}
                            >
                                {optimizationResultsMinimized ? '▲▲' : '▼'}
                            </button>
                        </div>

                        {!optimizationResultsMinimized && (
                            <div className="grid grid-cols-1 gap-3">
                                <div className="flex justify-between items-center pb-2 border-b border-theme-accent/30">
                                    <span className="text-sm opacity-80">Original:</span>
                                    <span className="text-xl font-bold">{optimizedLineup.originalScore.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center pb-2 border-b border-theme-accent/30">
                                    <span className="text-sm opacity-80">Optimized:</span>
                                    <span className={`text-xl font-bold ${optimizedLineup.newScore >= optimizedLineup.originalScore ? 'text-green-500' : 'text-red-500'}`}>
                                        {optimizedLineup.newScore.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center pt-1">
                                    <span className="text-sm font-semibold">Improvement:</span>
                                    <span className={`text-2xl font-bold ${(optimizedLineup.newScore - optimizedLineup.originalScore) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {(optimizedLineup.newScore - optimizedLineup.originalScore) >= 0 ? '+' : ''}{(optimizedLineup.newScore - optimizedLineup.originalScore).toFixed(2)}
                                        <span className="text-sm ml-1">
                                            ({((optimizedLineup.newScore - optimizedLineup.originalScore) / optimizedLineup.originalScore * 100).toFixed(1)}%)
                                        </span>
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </main>
    );
}
