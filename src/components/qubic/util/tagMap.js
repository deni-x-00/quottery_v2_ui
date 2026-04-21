/**
 * tagMap.js — Maps tag IDs (stored in last 2 bytes of desc[32]) to
 * display labels and thumbnail filenames from src/assets/.
 */

export const TAG_MAP = {
    0:  { label: 'General',         thumbnail: null },
    1:  { label: 'Crypto',          thumbnail: 'crypto.png' },
    2:  { label: 'Sport',           thumbnail: 'sport.png' },
    3:  { label: 'Politics',        thumbnail: 'politics.png' },
    4:  { label: 'Finance',         thumbnail: 'finance.png' },
    5:  { label: 'Tech & Science',  thumbnail: 'tech_and_science.png' },
    6:  { label: 'Celebrity',       thumbnail: 'celebrity_life.png' },
    7:  { label: 'Qubic',           thumbnail: 'qubic.png' },
    8:  { label: 'Football',        thumbnail: 'cfb.png' },
};


export function getTagInfo(tagId) {
    return TAG_MAP[tagId] || TAG_MAP[7];
}

export function getAllTags() {
    return Object.entries(TAG_MAP).map(([id, info]) => ({
        id: Number(id),
        ...info,
    }));
}