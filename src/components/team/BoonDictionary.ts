import { Boon } from "@/types/Player";

// All lesser boon values are currently type "add-mult"
export const lesserBoonTable: Record<string, Record<string, number>> = {
    "ROBO": {
        "Accuracy": 0.5,
        "Discipline": 0.5,
        "Arm": 0.5,
        "Cunning": -0.5,
        "Presence": -0.5,
        "Speed": -0.5,
    },
    "Demonic": {
        "Muscle": 0.5,
        "Velocity": 0.5,
        "Reaction": 0.5,
        "Discipline": -0.5,
        "Control": -0.5,
        "Composure": -0.5,
    },
    "Angelic": {
        "Discipline": 0.5,
        "Control": 0.5,
        "Awareness": 0.5,
        "Muscle": -0.5,
        "Velocity": -0.5,
        "Reaction": -0.5,
    },
    "Undead": {
        "Determination": 0.5,
        "Stamina": 0.5,
        "Composure": 0.5,
        "Contact": -0.5,
        "Presence": -0.5,
        "Speed": -0.5,
    },
    "Giant": {
        "Muscle": 0.5,
        "Stamina": 0.5,
        "Arm": 0.5,
        "Contact": -0.5,
        "Control": -0.5,
        "Agility": -0.5,
    },
    "Fire Elemental": {
        "Lift": 0.5,
        "Velocity": 0.5,
        "Speed": 0.5,
        "Vision": -0.5,
        "Control": -0.5,
        "Composure": -0.5,
    },
    "Water Elemental": {
        "Contact": 0.5,
        "Control": 0.5,
        "Dexterity": 0.5,
        "Muscle": -0.5,
        "Velocity": -0.5,
        "Reaction": -0.5,
    },
    "Air Elemental": {
        "Aiming": 0.5,
        "Accuracy": 0.5,
        "Agility": 0.5,
        "Muscle": -0.5,
        "Velocity": -0.5,
        "Arm": -0.5,
    },
    "Earth Elemental": {
        "Contact": 0.5,
        "Stamina": 0.5,
        "Patience": 0.5,
        "Vision": -0.5,
        "Control": -0.5,
        "Speed": -0.5,
    },
    "Draconic": {
        "Lift": 0.5,
        "Presence": 0.5,
        "Arm": 0.5,
        "Discipline": -0.5,
        "Control": -0.5,
        "Agility": -0.5,
    },
    "Fae": {
        "Cunning": 0.5,
        "Persuasion": 0.5,
        "Dexterity": 0.5,
        "Muscle": -0.5,
        "Velocity": -0.5,
        "Arm": -0.5,
    },
    "One With All": {
        "Selflessness": 0.3,
        "Contact": 0.3,
        "Control": 0.3,
        "Velocity": 0.3,
        "Determination": -0.3,
        "Greed": -0.3,
        "Persuasion": -0.3,
        "Presence": -0.3,
    },
    "Archer's Mark": {
        "Aiming": 0.3,
        "Vision": 0.3,
        "Velocity": 0.3,
        "Accuracy": 0.3,
        "Intimidation": -0.3,
        "Greed": -0.3,
        "Stuff": -0.3,
        "Presence": -0.3,
    },
    "Geometry Expert": {
        "Insight": 0.3,
        "Contact": 0.3,
        "Control": 0.3,
        "Rotation": 0.3,
        "Muscle": -0.3,
        "Vision": -0.3,
        "Velocity": -0.3,
        "Defiance": -0.3,
    },
    "Scooter": {
        "Speed": 0.3,
        "Intimidation": 0.3,
        "Velocity": 0.3,
        "Defiance": 0.3,
        "Muscle": -0.3,
        "Discipline": -0.3,
        "Control": -0.3,
        "Stamina": -0.3,
    },
    "The Light": {
        "Vision": 0.3,
        "Discipline": 0.3,
        "Control": 0.3,
        "Presence": 0.3,
        "Contact": -0.3,
        "Performance": -0.3,
        "Velocity": -0.3,
        "Stuff": -0.3,
    },
    "Tenacious Badger": {
        "Determination": 0.3,
        "Muscle": 0.3,
        "Stamina": 0.3,
        "Guts": 0.3,
        "Vision": -0.3,
        "Speed": -0.3,
        "Persuasion": -0.3,
        "Defiance": -0.3,
    },
    "Stormrider": {
        "Lift": 0.3,
        "Speed": 0.3,
        "Velocity": 0.3,
        "Stuff": 0.3,
        "Wisdom": -0.3,
        "Stealth": -0.3,
        "Control": -0.3,
        "Rotation": -0.3,
    },
    "Insectoid": {
        "Intimidation": 0.3,
        "Muscle": 0.3,
        "Accuracy": 0.3,
        "Persuasion": 0.3,
        "Discipline": -0.3,
        "Insight": -0.3,
        "Defiance": -0.3,
        "Presence": -0.3,
    },
    "Clean": {
        "Determination": 0.3,
        "Discipline": 0.3,
        "Persuasion": 0.3,
        "Presence": 0.3,
        "Wisdom": -0.3,
        "Insight": -0.3,
        "Velocity": -0.3,
        "Defiance": -0.3,
    },
    "Shiny": {
        "Insight": 0.3,
        "Vision": 0.3,
        "Presence": 0.3,
        "Accuracy": 0.3,
        "Cunning": -0.3,
        "Stealth": -0.3,
        "Stuff": -0.3,
        "Guts": -0.3,
    },
    "Psychic": {
        "Vision": 0.3,
        "Wisdom": 0.3,
        "Accuracy": 0.3,
        "Persuasion": 0.3,
        "Intimidation": -0.3,
        "Muscle": -0.3,
        "Velocity": -0.3,
        "Stuff": -0.3,
    },
    "UFO": {
        "Contact": 0.3,
        "Lift": 0.3,
        "Rotation": 0.3,
        "Stuff": 0.3,
        "Discipline": -0.3,
        "Wisdom": -0.3,
        "Control": -0.3,
        "Stamina": -0.3,
    },
    "Spectral": {
        "Stealth": 0.3,
        "Intimidation": 0.3,
        "Presence": 0.3,
        "Rotation": 0.3,
        "Muscle": -0.3,
        "Contact": -0.3,
        "Stuff": -0.3,
        "Guts": -0.3,
    },
    "Amphibian": {
        "Speed": 0.3,
        "Performance": 0.3,
        "Velocity": 0.3,
        "Persuasion": 0.3,
        "Insight": -0.3,
        "Muscle": -0.3,
        "Presence": -0.3,
        "Defiance": -0.3,
    },
    "Mer": {
        "Determination": 0.3,
        "Wisdom": 0.3,
        "Control": 0.3,
        "Stuff": 0.3,
        "Lift": -0.3,
        "Aiming": -0.3,
        "Rotation": -0.3,
        "Guts": -0.3,
    },
    "Calculated": {
        "Discipline": 0.3,
        "Insight": 0.3,
        "Control": 0.3,
        "Accuracy": 0.3,
        "Muscle": -0.3,
        "Greed": -0.3,
        "Guts": -0.3,
        "Stamina": -0.3,
    },
};

type GreaterBoon = {
    attributes?: Record<string, number>,
    categories?: Record<string, number>,
    isConditional?: boolean,
}

// All greater boon values are currently type "add-mult"
export const greaterBoonTable: Record<string, GreaterBoon> = {
    'Insider': {
        categories: { 'Batting': 0.1 },
        isConditional: true,
    },
    'Outsider': {
        categories: { 'Batting': 0.1 },
        isConditional: true,
    },
    'Clutch': {
        attributes: { 'Contact': 0.25 },
        isConditional: true,
    },
    'Cowardly': {
        attributes: { 'Contact': -0.5 },
    },
    'Criminal': {},
    'Prolific': {},
    'Underdog': {
        categories: { 'Batting': 0.1 },
        isConditional: true,
    },
    'Strong Starter': {
        categories: { 'Pitching': 0.1 },
        isConditional: true,
    },
    'Iron Will': {
        categories: { 'Pitching': 0.1 },
        isConditional: true,
    },
    'Introverted': {
        categories: { 'Batting': 0.1 },
        isConditional: true,
    },
    'All Knowing': {
        attributes: { 'Wisdom': 1.0 },
        isConditional: true,
    },
    'Lucky': {},
    'Unwavering': {},
    'Unrelenting': {
        attributes: {
            'Guts': 1.0,
            'Defiance': 1.0,
        },
    },
    'First Strike': {
        attributes: { 'Velocity': 0.25 },
        isConditional: true,
    },
    'Logical': {
        categories: { 'Pitching': 0.1 },
        isConditional: true,
    },
    'Creative': {
        categories: { 'Pitching': 0.1 },
        isConditional: true,
    },
    'Analytical': {
        categories: { 'Batting': 0.1 },
        isConditional: true,
    },
    'Intuitive': {
        categories: { 'Batting': 0.1 },
        isConditional: true,
    },
    'Partier': {
        categories: {
            'Other': 3.0,
        },
        isConditional: true,
    },
};

type Modification = {
    attributes?: Record<string, number>,
    categories?: Record<string, number>,
    bonusType: 'flat' | 'add-mult' | 'mult-mult',
    stackCount?: number,
}

export const modificationTable: Record<string, Modification> = {
    'Celestial Infusion': {
        attributes: {
            'Muscle': 25,
            'Presence': 25,
        },
        bonusType: 'flat',
    },
    'Celestial Infusion II': {
        attributes: {
            'Muscle': 50,
            'Presence': 50,
        },
        bonusType: 'flat',
        stackCount: 2,
    },
    'Celestial Infusion III': {
        attributes: {
            'Muscle': 100,
            'Presence': 100,
        },
        bonusType: 'flat',
        stackCount: 3,
    },
    'Corrupted': {
        categories: {
            'Batting': 0.2,
            'Pitching': 0.2,
            'Defense': 0.2,
            'Running': 0.2,
            'Other': 0.2,
        },
        bonusType: 'add-mult',
    }
}

export const lesserBoonEmojiMap: Record<string, string> = {
    "Air Elemental": "💨",
    "Amphibian": "🐸",
    "Angelic": "👼",
    "Archer's Mark": "🏹",
    "Calculated": "🧮",
    "Clean": "🧹",
    "Demonic": "😈",
    "Draconic": "🐲",
    "Earth Elemental": "⛰️",
    "Fae": "🧚",
    "Fire Elemental": "🔥",
    "Geometry Expert": "📐",
    "Giant": "🗿",
    "Insectoid": "🐞",
    "Mer": "🧜",
    "One With All": "⚾",
    "Psychic": "👁️",
    "Scooter": "🛴",
    "Shiny": "🌟",
    "ROBO": "🤖", // "Soul in the Machine" in glossary
    "Spectral": "👻",
    "Stormrider": "⛈️",
    "Tenacious Badger": "🦡",
    "The Light": "🚦",
    "UFO": "🛸",
    "Undead": "🧟",
    "Water Elemental": "💧",
};

export function getLesserBoonEmoji(boonName: string): string {
    return lesserBoonEmojiMap[boonName] || "";
}


export function formatBoonDescription(boon: Boon): string {
    if(!boon) return '';
    // split the description into 3 lines for easier reading in a tooltip
    const description = boon.description.replace('.', '.\n').replace('-', '\n-');
    return `${boon.emoji}${boon.name}\n${description}`;
}
