/**
 * Maps tag IDs stored in the last 2 bytes of event desc[32] to display labels
 * and thumbnail filenames from src/assets/.
 *
 * Reserved ranges:
 * - Crypto: 1-10
 * - Sports: 11-20
 * - Finance: 21-30
 * - Other: 31-40
 */

export const TAG_MAP = {
    0:  { label: 'General',         thumbnail: null },

    // Crypto: 1-10
    1:  { label: 'Crypto',          thumbnail: 'bitcoin.svg' },
    2:  { label: 'QUBIC',           thumbnail: 'qubic.svg' },
    3:  { label: 'BTC',             thumbnail: 'bitcoin.svg' },
    4:  { label: 'ETH',             thumbnail: 'ethereum.svg' },
    5:  { label: 'SOL',             thumbnail: 'solana.svg' },

    // Sports: 11-20
    11: { label: 'Sport',           thumbnail: 'sport.svg' },
    12: { label: 'Football',        thumbnail: 'football.svg' },
    13: { label: 'Basketball',      thumbnail: 'basketball.svg' },
    14: { label: 'Tennis',          thumbnail: 'tennis.svg' },
    15: { label: 'Hockey',          thumbnail: 'hockey.svg' },

    // Finance: 21-30
    21: { label: 'GOLD',            thumbnail: 'gold-bar.svg' },
    22: { label: 'SILVER',          thumbnail: 'silver-bar.svg' },
    23: { label: 'Stocks',          thumbnail: 'stocks.svg' },
    24: { label: 'Economy',         thumbnail: 'economy.svg' },

    // Other: 31-40
    31: { label: 'Cinema',          thumbnail: 'cinema.svg' },
    32: { label: 'Science',         thumbnail: 'science.svg' },
    33: { label: 'Politics',        thumbnail: 'politics.svg' },
    34: { label: 'Weather',         thumbnail: 'weather.svg' },
    35: { label: 'Gaming',          thumbnail: 'gaming.svg' },
    36: { label: 'Celebrity',       thumbnail: 'celebrity.svg' },
};

export const TAG_GROUPS = [
    { id: 'crypto', label: 'Crypto', min: 1, max: 10 },
    { id: 'sports', label: 'Sports', min: 11, max: 20 },
    { id: 'finance', label: 'Finance', min: 21, max: 30 },
    { id: 'other', label: 'Other', min: 31, max: 40 },
];

export function getCanonicalTagId(tagId) {
    const id = Number(tagId);
    return TAG_MAP[id] ? id : 0;
}

export function getTagGroupId(tagId) {
    const id = getCanonicalTagId(tagId);
    const group = TAG_GROUPS.find(({ min, max }) => id >= min && id <= max);
    return group?.id || 'other';
}

export function getTagInfo(tagId) {
    return TAG_MAP[getCanonicalTagId(tagId)] || TAG_MAP[0];
}

export function getAllTags() {
    return Object.entries(TAG_MAP)
        .filter(([, info]) => !info.hidden)
        .map(([id, info]) => ({
            id: Number(id),
            ...info,
        }));
}

export function getTagsForGroup(groupId) {
    const group = TAG_GROUPS.find((item) => item.id === groupId);
    if (!group) return [];

    return getAllTags().filter((tag) => tag.id >= group.min && tag.id <= group.max);
}
