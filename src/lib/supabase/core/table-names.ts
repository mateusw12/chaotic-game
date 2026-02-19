export function getUsersTableName() {
    return process.env.SUPABASE_USERS_TABLE ?? "users";
}

export function getWalletsTableName() {
    return process.env.SUPABASE_WALLETS_TABLE ?? "user_wallets";
}

export function getCreaturesTableName() {
    return process.env.SUPABASE_CREATURES_TABLE ?? "creatures";
}

export function getAbilitiesTableName() {
    return process.env.SUPABASE_ABILITIES_TABLE ?? "abilities";
}

export function getLocationsTableName() {
    return process.env.SUPABASE_LOCATIONS_TABLE ?? "locations";
}

export function getBattlegearTableName() {
    return process.env.SUPABASE_BATTLEGEAR_TABLE ?? "battlegear";
}

export function getMugicTableName() {
    return process.env.SUPABASE_MUGIC_TABLE ?? "mugic";
}

export function getAttacksTableName() {
    return process.env.SUPABASE_ATTACKS_TABLE ?? "attacks";
}

export function getUserProgressionTableName() {
    return process.env.SUPABASE_USER_PROGRESSION_TABLE ?? "user_progression";
}

export function getProgressionEventsTableName() {
    return process.env.SUPABASE_PROGRESSION_EVENTS_TABLE ?? "progression_events";
}

export function getUserCardsTableName() {
    return process.env.SUPABASE_USER_CARDS_TABLE ?? "user_cards";
}

export function getUserDecksTableName() {
    return process.env.SUPABASE_USER_DECKS_TABLE ?? "user_decks";
}

export function getUserDeckCardsTableName() {
    return process.env.SUPABASE_USER_DECK_CARDS_TABLE ?? "user_deck_cards";
}

export function getStorePacksTableName() {
    return process.env.SUPABASE_STORE_PACKS_TABLE ?? "store_packs";
}

export function getTournamentsTableName() {
    return process.env.SUPABASE_TOURNAMENTS_TABLE ?? "tournaments";
}
