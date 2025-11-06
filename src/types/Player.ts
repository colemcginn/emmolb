import { FeedMessage } from "./FeedMessage";
import { DerivedPlayerStats, MapAPIPlayerStats, PlayerStats } from "./PlayerStats";

export const EquipmentEffectTypes = {
    FLATBONUS: "FlatBonus",
    MULTIPLIER: "Multiplier",
} as const;


export type EquipmentEffect = {
    attribute: string;
    type: string;
    value: number;
}

export type Boon = {
    description: string,
    emoji: string,
    name: string,
}

const boons: Record<string, Boon> = {
    "No Boon": {
        emoji: "",
        name: "",
        description: "",
    },
    "Air Elemental": {
        emoji: "💨",
        name: "Air Elemental",
        description: "Light as air. +50% Aiming, Accuracy, and Agility, -50% Muscle, Velocity, and Arm",
    },
    "Amphibian": {
        emoji: "🐸",
        name: "Amphibian",
        description: "Amphibious form. +30% Speed, Performance, Velocity, and Persuasion, -30% Insight, Muscle, Presence, and Defiance",
    },
    "Angelic": {
        emoji: "👼",
        name: "Angelic",
        description: "Blessed by the heavens. +50% Discipline, Control, and Awareness, -50% Muscle, Velocity, and Reaction",
    },
    "Archer's Mark": {
        emoji: "🏹",
        name: "Archer's Mark",
        description: "Sharpshooter. +30% Aiming, Vision, Velocity, and Accuracy, -30% Intimidation, Greed, Stuff, and Presence",
    },
    "Calculated": {
        emoji: "🧮",
        name: "Calculated",
        description: "Counts everything. +30% Discipline, Insight, Control, and Accuracy, -30% Muscle, Greed, Guts, and Stamina",
    },
    "Clean": {
        emoji: "🧹",
        name: "Clean",
        description: "Spotless. +30% Determination, Discipline, Persuasion, and Presence, -30% Wisdom, Insight, Velocity, and Defiance",
    },
    "Demonic": {
        emoji: "😈",
        name: "Demonic",
        description: "Possessed by infernal power. +50% Muscle, Velocity, and Reaction, -50% Discipline, Control, and Composure",
    },
    "Draconic": {
        emoji: "🐲",
        name: "Draconic",
        description: "Draconic might. +50% Lift, Presence, and Arm, -50% Discipline, Control, and Agility",
    },
    "Earth Elemental": {
        emoji: "⛰️",
        name: "Earth Elemental",
        description: "Made of stone. +50% Contact, Stamina, and Patience, -50% Vision, Control, and Speed",
    },
    "Fae": {
        emoji: "🧚",
        name: "Fae",
        description: "Trickster spirit. +50% Cunning, Persuasion, and Dexterity, -50% Muscle, Velocity, and Arm",
    },
    "Fire Elemental": {
        emoji: "🔥",
        name: "Fire Elemental",
        description: "Wreathed in flame. +50% Lift, Velocity, and Speed, -50% Vision, Control, and Composure",
    },
    "Geometry Expert": {
        emoji: "📐",
        name: "Geometry Expert",
        description: "Master of angles. +30% Insight, Contact, Control, and Rotation, -30% Muscle, Vision, Velocity, and Defiance",
    },
    "Giant": {
        emoji: "🗿",
        name: "Giant",
        description: "Colossal stature. +50% Muscle, Stamina, and Arm, -50% Contact, Control, and Agility",
    },
    "Insectoid": {
        emoji: "🐞",
        name: "Insectoid",
        description: "Insect form. +30% Intimidation, Muscle, Accuracy, and Persuasion, -30% Discipline, Insight, Defiance, and Presence",
    },
    "Mer": {
        emoji: "🧜",
        name: "Mer",
        description: "Aquatic form. +30% Determination, Wisdom, Control, and Stuff, -30% Lift, Aiming, Rotation, and Guts",
    },
    "One With All": {
        emoji: "⚾",
        name: "One With All",
        description: "Trained in the basics. +30% Selflessness, Contact, Control, and Velocity, -30% Determination, Greed, Persuasion, and Presence",
    },
    "Psychic": {
        emoji: "👁️",
        name: "Psychic",
        description: "Glimpses the future. +30% Vision, Wisdom, Accuracy, and Persuasion, -30% Intimidation, Muscle, Velocity, and Stuff",
    },
    "Scooter": {
        emoji: "🛴",
        name: "Scooter",
        description: "Scooting around. +30% Speed, Intimidation, Velocity, and Defiance, -30% Muscle, Discipline, Control, and Stamina",
    },
    "Shiny": {
        emoji: "🌟",
        name: "Shiny",
        description: "Shining brightly. +30% Insight, Vision, Presence, and Accuracy, -30% Cunning, Stealth, Stuff, and Guts",
    },
    "Soul in the Machine": {
        emoji: "🤖",
        name: "Soul in the Machine",
        description: "This Player has assumed a ROBO-form. +50% Accuracy, Discipline, and Arm, -50% Cunning, Presence, and Speed",
    },
    "Spectral": {
        emoji: "👻",
        name: "Spectral",
        description: "Ghostly. +30% Stealth, Intimidation, Presence, and Rotation, -30% Muscle, Contact, Stuff, and Guts",
    },
    "Stormrider": {
        emoji: "⛈️",
        name: "Stormrider",
        description: "Rides the storm. +30% Lift, Speed, Velocity, and Stuff, -30% Wisdom, Stealth, Control, and Rotation",
    },
    "Tenacious Badger": {
        emoji: "🦡",
        name: "Tenacious Badger",
        description: "Digging in. +30% Determination, Muscle, Stamina, and Guts, -30% Vision, Speed, Persuasion, and Defiance",
    },
    "The Light": {
        emoji: "🚦",
        name: "The Light",
        description: "Saw the light. +30% Vision, Discipline, Control, and Presence, -30% Contact, Performance, Velocity, and Stuff",
    },
    "UFO": {
        emoji: "🛸",
        name: "UFO",
        description: "Taken flight. +30% Contact, Lift, Rotation, and Stuff, -30% Discipline, Wisdom, Control, and Stamina",
    },
    "Undead": {
        emoji: "🧟",
        name: "Undead",
        description: "Neither living nor dead. +50% Determination, Stamina, and Composure, -50% Contact, Presence, and Speed",
    },
    "Water Elemental": {
        emoji: "💧",
        name: "Water Elemental",
        description: "Flowing like water. +50% Contact, Control, and Dexterity, -50% Muscle, Velocity, and Reaction",
    },
}

export function getBoon(name: string): Boon | undefined {
  return boons[name] ?? undefined
}

export type Equipment = {
    effects: EquipmentEffect[];
    emoji: string;
    name: string;
    rareName?: string;
    prefix?: string[];
    rarity: string;
    slot?: string;
    suffix?: string[];
}

export type TalkEntry = {
    day: number;
    quote: string;
    season: number;
    stars: {
        [key: string]: {
            base_display: string;
            base_regular: number;
            base_shiny: number;
            base_stars: number;
            base_total: number;
            display: string;
            regular: number;
            shiny: number;
            stars: number;
            total: number;
        }
    }
}

export type Player = {
    augments: number;
    bats: string;
    birthday: string;
    birth_season: number;
    dislikes: string;
    durability: number;
    equipment: {
        accessory?: Equipment;
        body?: Equipment;
        feet?: Equipment;
        hands?: Equipment;
        head?: Equipment;
    }
    feed: FeedMessage[];
    first_name: string;
    greater_boon?: Boon;
    home: string;
    last_name: string;
    lesser_boon?: Boon;
    likes: string;
    modifications: Boon[];
    number: number;
    position: string;
    position_type: string;
    season_stats: Record<string, Record<string, string>>;
    stats: Record<string, DerivedPlayerStats>;
    talk?: {
        [category: string]: TalkEntry | null;
    } 
    team_id: string;
    throws: string;
    id: string;
}

function mapEffect(effect: any): EquipmentEffect {
    return {
        attribute: effect.Attribute,
        type: effect.Type,
        value: effect.Value,
    };
}

function mapEquipment(raw: any): Equipment | undefined {
    if (!raw) return;

    return {
        effects: Array.isArray(raw.Effects) ? raw.Effects.map(mapEffect) : [],
        emoji: raw.Emoji,
        name: raw.Name,
        rareName: raw.RareName,
        prefix: raw.Prefixes,
        rarity: raw.Rarity,
        slot: raw.Slot,
        suffix: raw.Suffixes,
    };
}

export function mapBoon(raw: any): Boon | undefined {
    if (!raw) return;

    return {
        description: raw.Description,
        emoji: raw.Emoji,
        name: raw.Name,
    }
}

export function MapAPIPlayerResponse(data: any): Player {
    return {
        augments: data.Augments,
        bats: data.Bats,
        birthday: data.Birthday,
        birth_season: data.Birthseason,
        dislikes: data.Dislikes,
        durability: data.Durability,
        equipment: {
            accessory: mapEquipment(data.Equipment.Accessory),
            body: mapEquipment(data.Equipment.Body),
            feet: mapEquipment(data.Equipment.Feet),
            hands: mapEquipment(data.Equipment.Hands),
            head: mapEquipment(data.Equipment.Head),
        },
        feed: data.Feed,
        first_name: data.FirstName,
        greater_boon: mapBoon(data.GreaterBoon),
        home: data.Home,
        last_name: data.LastName,
        lesser_boon: mapBoon(data.LesserBoon),
        likes: data.Likes,
        modifications: data.Modifications.map((x: any) => mapBoon(x)),
        number: data.Number,
        position: data.Position,
        position_type: data.PositionType,
        season_stats: data.SeasonStats,
        stats: Object.fromEntries(Object.entries(data.Stats ?? {}).map(([season, stats]) => [season, MapAPIPlayerStats(stats as Partial<PlayerStats>)])),
        talk: {
            batting: data.Talk?.Batting ?? null,
            pitching: data.Talk?.Pitching ?? null,
            defense: data.Talk?.Defense ?? null,
            base_running: data.Talk?.Baserunning ?? null,
        },
        team_id: data.TeamID,
        throws: data.Throws,
        id: data._id,
    };
}
