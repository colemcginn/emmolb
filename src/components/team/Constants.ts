export const battingAttrs = ['Aiming', 'Contact', 'Cunning', 'Determination', 'Discipline', 'Insight', 'Intimidation', 'Lift', 'Muscle', 'Selflessness', 'Vision', 'Wisdom'];
export const pitchingAttrs = ['Accuracy', 'Control', 'Defiance', 'Guts', 'Persuasion', 'Presence', 'Rotation', 'Stamina', 'Stuff', 'Velocity'];
export const defenseAttrs = ['Acrobatics', 'Agility', 'Arm', 'Awareness', 'Composure', 'Dexterity', 'Patience', 'Reaction'];
export const runningAttrs = ['Greed', 'Performance', 'Speed', 'Stealth'];
export const otherAttrs = ['Luck'];
export const attrCategoryNames = ['Batting', 'Pitching', 'Defense', 'Running', 'Other'];
export const attrCategories: Record<string, string[]> = {
    'Batting': battingAttrs,
    'Pitching': pitchingAttrs,
    'Defense': defenseAttrs,
    'Running': runningAttrs,
    'Other': otherAttrs,
};
export const attrTypes: Record<string, string> = {};
for (const a of battingAttrs) attrTypes[a] = 'Batting';
for (const a of pitchingAttrs) attrTypes[a] = 'Pitching';
for (const a of defenseAttrs) attrTypes[a] = 'Defense';
for (const a of runningAttrs) attrTypes[a] = 'Running';
for (const a of otherAttrs) attrTypes[a] = 'Other';

export const attrAbbrevs: Record<string, string> = {
    // Batting
    'Aiming': 'AIM',
    'Contact': 'CON',
    'Cunning': 'CUN',
    'Determination': 'DET',
    'Discipline': 'DISC',
    'Insight': 'INS',
    'Intimidation': 'INT',
    'Lift': 'LIFT',
    'Muscle': 'MUSC',
    'Selflessness': 'SELF',
    'Vision': 'VIS',
    'Wisdom': 'WIS',
    // Pitching
    'Accuracy': 'ACC',
    'Control': 'CTRL',
    'Defiance': 'DEFI',
    'Guts': 'GUTS',
    'Persuasion': 'PER',
    'Presence': 'PRES',
    'Rotation': 'ROT',
    'Stamina': 'STAM',
    'Stuff': 'STU',
    'Velocity': 'VELO',
    // Defense
    'Acrobatics': 'ACRO',
    'Agility': 'AGI',
    'Arm': 'ARM',
    'Awareness': 'AWR',
    'Composure': 'COMP',
    'Dexterity': 'DEX',
    'Patience': 'PAT',
    'Reaction': 'REA',
    // Running
    'Greed': 'GRE',
    'Performance': 'PERF',
    'Speed': 'SPD',
    'Stealth': 'STL',
    // Other
    'Luck': 'LUCK',
}

export type OpenDropboxes = {
    [name: string]: {
        [category: string]: boolean;
    };
};

export const trunc = (num: number) => (Math.floor((num) * 100)/100).toString();

export const statDefinitions: Record<string, string> = {
    "Accuracy": "Pitcher's ability is to pitch to their intended zone",
    "Acrobatics": "Fielder's ability to field Line Drives",
    "Agility": "Fielder's ability to field Fly Balls",
    "Aiming": "Batter's ability to hit Line Drives",
    "Arm": "Fielder's ability to throw the ball",
    "Awareness": "Fielder's ability to make tough plays",
    "Composure": "Fielder's ability to play without making Errors",
    "Contact": "Batter's ability to make contact, putting the ball in play",
    "Control": "Pitcher's ability to have control of their pitch, remaining inside the strike zone",
    "Cunning": "Batter's ability to draw a Hit By Pitch",
    "Defiance": "Pitcher's ability to defy the Manager and remain in the game for longer",
    "Determination": "Batter's ability to remain determined by fouling the ball",
    "Dexterity": "Fielder's ability to make quick dextrous moves, preventing runners from getting extra bases",
    "Discipline": "Batter's ability to remain disciplined at the plate, laying off of pitches outside the strike zone",
    "Greed": "Baserunner's willingness to attempt to steal a base",
    "Guts": "Pitcher's ability to play better when their Energy is low",
    "Insight": "Batter's ability to choose an optimal location to hit a ball in play",
    "Intimidation": "Batter's ability to scare a pitcher away from throwing in the strike zone",
    "Lift": "Batter's ability to hit Fly Balls",
    "Luck": "A player's ability to defy the odds",
    "Muscle": "Batter's ability to make powerful hits",
    "Patience": "Fielder's ability to field Popups",
    "Performance": "Baserunner's ability to distract fielders",
    "Persuasion": "Pitcher's ability to draw foul balls",
    "Presence": "Pitcher's ability to scare the batter, reduce powerful hits",
    "Priority": "Determines a batter's position in the Lineup",
    "Reaction": "Fielder's ability to field Ground Balls",
    "Rotation": "Pitcher's ability to throw pitches with a high spin rate which are hard to hit",
    "Selflessness": "Batter's willingness to hit into a sacrifice play",
    "Speed": "Baserunner's raw speed on the basepaths",
    "Stamina": "Pitcher's ability to remain in top form even as they lose Energy",
    "Stealth": "Baserunner's ability to remain undetected when attempting to steal a base",
    "Stuff": "Pitcher's ability to throw dirty pitches that result in more Ground Balls or Popups",
    "Velocity": "Pitcher's ability to throw hard and fast, making their pitches in the strike zone more effective",
    "Vision": "Batter's ability to track the pitch as it's coming at them",
    "Wisdom": "Batter's ability to learn from each pitch"
}

export const positionsList: string[] = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'SP', 'RP', 'CL'];
