import { useState } from "react";
import { PlayerWithSlot } from "../team/TeamAttributes";
import { Team } from "@/types/Team";
import { Boon, Equipment, EquipmentEffect } from "@/types/Player";
import Link from "next/link";
import { getContrastTextColor } from "@/helpers/ColorHelper";

export type EquipmentTooltipProps = {
    equipment: Equipment | undefined;
    name: string;
    isActive: boolean;
    onToggle: () => void;
    appendName?: boolean; // Hey this is just so the optimize page isn't funky
};

export function EquipmentTooltip({ equipment, name, isActive, onToggle, appendName = true }: EquipmentTooltipProps) {
    const itemBorder: Record<string, string> = { 'Normal': '#1c2a3a', 'Magic': '#42A5F5', 'Rare': '#FFEE58' };
    const itemFont: Record<string, string> = { 'Normal': 'text-gray-500', 'Magic': 'text-blue-500', 'Rare': 'text-yellow-500' };
    const itemColor: Record<string, string> = { 'Normal': 'from-gray-500 to-gray-700', 'Magic': 'from-blue-500 to-blue-700', 'Rare': 'from-yellow-500 to-yellow-700' };
    const formattedName = equipment ? `${equipment.prefix?.join(' ') ?? ''} ${equipment.name ?? ''} ${equipment.suffix?.join(' ') ?? ''}`.trim() : name;
    return (
        <div className="relative group" onClick={(e) => { e.stopPropagation(); onToggle(); }}>
            <div className="w-18 min-h-18 border-3 text-theme-primary rounded-lg flex flex-col items-center justify-center shadow cursor-pointer" style={{ borderColor: itemBorder[equipment?.rarity ?? 'Normal'] }}>
                <div className="text-3xl">
                    {equipment ? equipment.emoji : '❔'}
                </div>
                <div className="text-xs font-semibold text-center mt-1 px-1" style={{ fontSize: 8 }}>{equipment?.rareName ?? formattedName}{appendName ? equipment?.rareName ? ` ${equipment.name}` : '' : ''}</div>
                <div className={`absolute bottom-[-2rem] left-1/2 -translate-x-1/2 transition-opacity duration-200 pointer-events-none group-hover:opacity-100 z-40 ${isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <div className="pointer-events-none z-[100] ">
                        <div className="bg-theme-primary border-2 border-theme-accent rounded-xl shadow-xl text-center text-xs w-56 overflow-hidden">
                            <div className={`bg-gradient-to-r ${itemColor[equipment ? equipment.rarity : 'Normal']} text-white relative font-bold py-1 px-2 flex items-center justify-center`}>
                                <span className="absolute left-1 top-1/2 -translate-y-1/2">{equipment?.emoji}</span>
                                <span className="mx-4 whitespace-normal break-words text-center">{equipment?.rareName ?? formattedName}{appendName ? equipment?.rareName ? ` ${equipment.name}` : '' : ''}</span>
                                <span className="absolute right-1 top-1/2 -translate-y-1/2">{equipment?.emoji}</span>
                            </div>
                            <div className="p-2 space-y-1">
                                <div className="text-[10px]">
                                    {equipment?.rarity} {equipment?.slot} Equipment
                                </div>
                                {equipment?.effects.map((effect: EquipmentEffect) => (
                                    <div key={`${equipment.rareName}-${effect.attribute}-${effect.value}`} className={itemFont[equipment.rarity]}>
                                        <span>
                                            <span className="font-semibold">
                                                {effect.type === 'FlatBonus' ? '+' : ''}
                                                {(100 * effect.value).toFixed(0)}
                                                {effect.type === 'Multiplier' ? '%' : ''}
                                            </span>
                                            <span className="opacity-80">
                                                {effect.attribute}
                                            </span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export type BoonTooltipProps = {
    boon: Boon;
    type: 'greater' | 'lesser' | 'mod';
    isActive: boolean;
    onToggle: () => void;
};

function BoonTooltip({ boon, type, isActive, onToggle }: BoonTooltipProps) {
    const borderColor =
        type === 'greater' ? 'border-purple-500' :
            type === 'lesser' ? 'border-yellow-400' :
                type === 'mod' ? 'border-[#1c2a3a]' : '';

    return (
        <div className="relative group" onClick={(e) => { e.stopPropagation(); onToggle(); }}>
            <div className={`w-18 min-h-18 border-3 ${borderColor} text-theme-primary rounded-lg flex flex-col items-center justify-center shadow cursor-pointer`}>
                <div className="text-3xl">
                    {boon.emoji}
                </div>
                <div className="text-xs font-semibold text-center mt-1 px-1">{boon.name}</div>
                <div className={`absolute bottom-full mb-2 px-2 py-1 text-xs rounded z-50 text-center whitespace-pre transition-opacity bg-theme-secondary text-theme-secondary group-hover:opacity-100 group-hover:pointer-events-auto ${isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>{boon.description}</div>
            </div>
        </div>
    )
}

type PlayerPageHeaderProps = {
    player: PlayerWithSlot;
    team: Team;
}

export function PlayerPageHeader({ player, team }: PlayerPageHeaderProps) {
    const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
    const toggle = (label: string) => { setActiveTooltip((prev) => (prev === label ? null : label)); };

    return (
        <div className="flex flex-col gap-4 max-w-2xl w-full">
            <div className="max-w-2xl relative w-full h-28 px-6 py-4 border-2 rounded-2xl shadow-xl border-theme-accent overflow-hidden flex items-center" style={{ background: `#${team.color}`, color: getContrastTextColor(team.color) }}>
                <span className="text-7xl flex-shrink-0">
                    {team.emoji}
                </span>
                <div className="absolute inset-0 flex flex-col items-center justify-start mt-5 pointer-events-none px-2">
                    <Link href={`/team/${team.id}`}>
                        <span className="text-xl font-bold underline cursor-pointer pointer-events-auto hover:opacity-80 transition text-center whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                            {team.location} {team.name}
                        </span>
                    </Link>
                    <span className="text-2xl font-bold tracking-wide leading-tight">{player.first_name} {player.last_name}</span>
                </div>
                <div className="flex flex-col gap-0 absolute top-1 right-2 text-base font-semibold opacity-80 pointer-events-none">
                    <div className="text-right">#{player.number}</div>
                    <div className="text-right">{player.slot}</div>
                </div>
            </div>

            <div>
                <div className="flex justify-between mb-1 mx-auto w-3/4">
                    <span className="text-xs font-bold opacity-70 uppercase">Durability</span>
                    <span className="text-xs font-bold opacity-70 uppercase">{`${Math.round(player.durability * 100)}%`}</span>
                </div>
                <div className="w-3/4 mx-auto h-3 rounded-full bg-theme-accent">
                    <div className="h-3 rounded-full" style={{ width: `${player.durability * 100}%`, backgroundColor: '#29cc00' }} />
                </div>
            </div>

            {(player.greater_boon || player.lesser_boon || player.modifications.length > 0) && (
                <div className="flex justify-center flex-wrap gap-2">
                    {player.greater_boon && <BoonTooltip boon={player.greater_boon} type='greater' isActive={activeTooltip === 'greater_boon'} onToggle={() => toggle('greater_boon')} />}
                    {player.lesser_boon && <BoonTooltip boon={player.lesser_boon} type='lesser' isActive={activeTooltip === 'lesser_boon'} onToggle={() => toggle('lesser_boon')} />}
                    {player.modifications.map(mod => <BoonTooltip key={mod.name} boon={mod} type='mod' isActive={activeTooltip === mod.name} onToggle={() => toggle(mod.name)} />)}
                </div>
            )}

            <div className="flex justify-center flex-wrap gap-2">
                <EquipmentTooltip equipment={player.equipment.head} name='Head' isActive={activeTooltip === 'head'} onToggle={() => toggle('head')} />
                <EquipmentTooltip equipment={player.equipment.body} name='Body' isActive={activeTooltip === 'body'} onToggle={() => toggle('body')} />
                <EquipmentTooltip equipment={player.equipment.hands} name='Hands' isActive={activeTooltip === 'hands'} onToggle={() => toggle('hands')} />
                <EquipmentTooltip equipment={player.equipment.feet} name='Feet' isActive={activeTooltip === 'feet'} onToggle={() => toggle('feet')} />
                <EquipmentTooltip equipment={player.equipment.accessory} name='Accessory' isActive={activeTooltip === 'accessory'} onToggle={() => toggle('accessory')} />
            </div>

            <div className="grid grid-rows-2 grid-flow-col gap-3 max-w-xl w-full mx-auto mb-4">
                {[['Born', `Season ${player.birth_season}, ${player.birthday}`], ['Home', player.home], ['Likes', player.likes], ['Dislikes', player.dislikes], ['Bats', player.bats], ['Throws', player.throws]].map(([title, content]) => (
                    <div key={title} className="bg-theme-primary border border-theme-accent rounded-md px-4 py-1 flex flex-col items-center justify-center text-center">
                        <div className="text-sm text-theme-text font-semibold opacity-60">{title}</div>
                        <div className="text-theme-text text-base font-bold">{content}</div>
                    </div>
                ))}
            </div>
        </div>
    )
}
