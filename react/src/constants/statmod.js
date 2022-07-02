function getStatModImageUrl({ patch = 'latest', key = '' }) {
    return `https://raw.communitydragon.org/${patch}/game/assets/perks/statmods/${key}.png`
}

export function getStatMod(patch='latest') {
    const data = {
        5001: {
            name: '+15-90 Health (based on level)',
            key: 'statmodshealthscalingicon',
            id: 5001,
            image_url: getStatModImageUrl({ patch, key: 'statmodshealthscalingicon' }),
        },
        5002: {
            name: '+6 Armor',
            key: 'statmodsarmoricon',
            id: 5002,
            image_url: getStatModImageUrl({ patch, key: 'statmodsarmoricon' }),
        },
        5003: {
            name: '+8 Magic Resist',
            key: 'statmodsmagicresicon',
            id: 5003,
            image_url: getStatModImageUrl({ patch, key: 'statmodsmagicresicon.magicresist_fix' }),
        },
        5005: {
            name: '+10% Attack Speed',
            key: 'statmodsattackspeedicon',
            id: 5005,
            image_url: getStatModImageUrl({ patch, key: 'statmodsattackspeedicon' }),
        },
        5008: {
            name: 'Adaptive Force +9',
            key: 'statmodsadaptiveforceicon',
            id: 5008,
            image_url: getStatModImageUrl({ patch, key: 'statmodsadaptiveforceicon' }),
        },
        5007: {
            name: '+1-10% CDR (based on level)',
            key: 'statmodscdrscalingicon',
            id: 5007,
            image_url: getStatModImageUrl({ patch, key: 'statmodscdrscalingicon' }),
        },
    }
    return data
}
