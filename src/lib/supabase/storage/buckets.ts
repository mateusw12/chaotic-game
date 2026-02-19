export function getCreatureImagesBucketName() {
    return process.env.SUPABASE_CREATURE_IMAGES_BUCKET ?? "creature-images";
}

export function getLocationImagesBucketName() {
    return process.env.SUPABASE_LOCATION_IMAGES_BUCKET ?? "location-images";
}

export function getBattlegearImagesBucketName() {
    return process.env.SUPABASE_BATTLEGEAR_IMAGES_BUCKET ?? "battlegear-images";
}

export function getMugicImagesBucketName() {
    return process.env.SUPABASE_MUGIC_IMAGES_BUCKET ?? "mugic-images";
}

export function getAttacksImagesBucketName() {
    return process.env.SUPABASE_ATTACKS_IMAGES_BUCKET ?? "attacks-images";
}

export function getUserProfileImagesBucketName() {
    return process.env.SUPABASE_USER_PROFILE_IMAGES_BUCKET ?? "user-profile-images";
}

export function getTournamentCoverImagesBucketName() {
    return process.env.SUPABASE_TOURNAMENT_IMAGES_BUCKET ?? "tournament-images";
}

export function getStorePackImagesBucketName() {
    return process.env.SUPABASE_STORE_PACK_IMAGES_BUCKET ?? "store-pack-images";
}
