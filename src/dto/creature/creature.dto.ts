export const CREATURE_TRIBES = [
    "overworld",
    "underworld",
    "mipedian",
    "marrillian",
    "danian",
    "ancient",
] as const;

export type CreatureTribe = (typeof CREATURE_TRIBES)[number];

export const CREATURE_ELEMENTS = ["fire", "water", "earth", "air"] as const;

export type CreatureElement = (typeof CREATURE_ELEMENTS)[number];

export const CREATURE_TRIBE_OPTIONS: Array<{
    value: CreatureTribe;
    label: string;
    description: string;
}> = [
        {
            value: "overworld",
            label: "OverWorld (Outro Mundo)",
            description: "Criaturas equilibradas e resilientes.",
        },
        {
            value: "underworld",
            label: "UnderWorld (Submundo)",
            description: "Criaturas agressivas com alto poder ofensivo.",
        },
        {
            value: "mipedian",
            label: "Mipedian",
            description: "Criaturas velozes e táticas.",
        },
        {
            value: "marrillian",
            label: "M'arrillian",
            description: "Criaturas com foco em controle e mente.",
        },
        {
            value: "danian",
            label: "Danian",
            description: "Criaturas com sinergia de colmeia e buff coletivo.",
        },
        {
            value: "ancient",
            label: "Ancient (Antigos)",
            description: "Criaturas lendárias e raras com alta versatilidade.",
        },
    ];

export const CREATURE_ELEMENT_OPTIONS: Array<{
    value: CreatureElement;
    label: string;
    description: string;
}> = [
        {
            value: "fire",
            label: "Fogo",
            description: "Elementos de dano e pressão ofensiva.",
        },
        {
            value: "water",
            label: "Água",
            description: "Elementos de controle e fluidez.",
        },
        {
            value: "earth",
            label: "Terra",
            description: "Elementos de resistência e estabilidade.",
        },
        {
            value: "air",
            label: "Vento",
            description: "Elementos de mobilidade e velocidade.",
        },
    ];

export type CreatureDto = {
    id: string;
    name: string;
    imageFileId: string | null;
    imageUrl: string | null;
    tribe: CreatureTribe;
    power: number;
    courage: number;
    speed: number;
    wisdom: number;
    mugic: number;
    energy: number;
    dominantElements: CreatureElement[];
    supportAbilityId: string | null;
    supportAbilityName: string | null;
    brainwashedAbilityId: string | null;
    brainwashedAbilityName: string | null;
    equipmentNote: string | null;
    createdAt: string;
    updatedAt: string;
};

export type CreateCreatureRequestDto = {
    name: string;
    imageFileId?: string | null;
    tribe: CreatureTribe;
    power: number;
    courage: number;
    speed: number;
    wisdom: number;
    mugic: number;
    energy: number;
    dominantElements: CreatureElement[];
    supportAbilityId?: string | null;
    brainwashedAbilityId?: string | null;
    equipmentNote?: string | null;
};

export type ListCreaturesResponseDto = {
    success: boolean;
    creatures: CreatureDto[];
    message?: string;
};

export type CreateCreatureResponseDto = {
    success: boolean;
    creature: CreatureDto | null;
    message?: string;
};

export type UpdateCreatureRequestDto = CreateCreatureRequestDto;

export type UpdateCreatureResponseDto = {
    success: boolean;
    creature: CreatureDto | null;
    message?: string;
};

export type DeleteCreatureResponseDto = {
    success: boolean;
    message?: string;
};
