import moment from 'moment'
import { ItemPopover } from '../components/data/Item'
import api from '../api/api'
import { BasicMatchType, FullParticipantType } from '../types'

export function formatDatetime(epoch: number) {
    return moment(epoch).format('MMM D h:mm a')
}

export function formatDatetimeFull(epoch: number) {
    return moment(epoch).format('MMM D, YYYY h:mm a')
}

export function formatDatetimeTime(epoch: number) {
    return moment(epoch).format('h:mm a')
}

export function getTeam<T>(num: number, participants: ({team_id: number} & T)[]) {
    return participants.filter(item => item.team_id === num)
}

export function convertTier(tier: string) {
    let out = ''
    if (tier.toLowerCase() === 'grandmaster') {
        out = 'GM'
    } else {
        out = tier[0]
    }
    return out
}

export function convertRank(rank: string) {
    const dict = {
        I: '1',
        II: '2',
        III: '3',
        IV: '4',
        V: '5',
    }
    if (dict[rank as keyof typeof dict] !== undefined) {
      return dict[rank as keyof typeof dict]
    }
    return rank
}

function getItem(item_id: string | number, major: number, minor: number, store: any) {
    // request item info if it isn't in the store
    let version = `${major}.${minor}`
    let item = null
    let items = store.state.items

    // if the item already exists, set item equal to it
    if (items[version] !== undefined) {
        if (items[version][item_id] !== undefined) {
            item = items[version][item_id]
        }
    }
    // if the item doesn't exists yet, get it
    if (item === null) {
        let data = {
            item_id,
            major,
            minor,
        }
        api.data.getItem(data).then(response => {
            if (items[version] === undefined) {
                items[version] = {}
            }
            items[version][item_id] = response.data.data
            store.setState({ items: items })
        })
    }
    return item
}

function retrieveItem(item_id: number | string, major: number, minor: number, store: any) {
    // get item from store
    let version = `${major}.${minor}`
    let item = null
    let items = store.state.items
    if (items[version] !== undefined) {
        if (items[version][item_id] !== undefined) {
            item = items[version][item_id]
        }
    }
    return item
}

export function item(id: number, image_url: string, match: BasicMatchType, store: any) {
    const item_data = retrieveItem(id, match.major, match.minor, store)
    return (
        <ItemPopover
            style={{
                display: 'inline-block',
                height: 28,
                width: 28,
                margin: '0px 2px',
            }}
            item={item_data}
            getItem={getItem}
            store={store}
            item_id={id}
            major={match.major}
            minor={match.minor}
        >
            <div
                style={{
                    display: 'inline-block',
                    height: 28,
                    width: 28,
                    borderRadius: 10,
                    margin: '0px 2px',
                    borderStyle: 'solid',
                    borderColor: '#2d2e31',
                    borderWidth: 1,
                }}
            >
                <img
                    style={{ height: '100%', borderRadius: 10, display: 'inline-block' }}
                    src={image_url}
                    alt=""
                />
            </div>
        </ItemPopover>
    )
}

export function ParticipantItems({part, match, store}: {part: FullParticipantType, match: BasicMatchType, store: any}) {
    return (
        <div
            style={{
                display: 'inline-block',
                verticalAlign: 'top',
            }}
        >
            <div style={{ width: 100 }}>
                <span>{item(part.stats?.item_0, part.stats?.item_0_image?.file_30, match, store)}</span>
                <span>{item(part.stats?.item_1, part.stats?.item_1_image?.file_30, match, store)}</span>
                <span>{item(part.stats?.item_2, part.stats?.item_2_image?.file_30, match, store)}</span>
            </div>
            <div style={{ width: 100 }}>
                <span>{item(part.stats?.item_3, part.stats?.item_3_image?.file_30, match, store)}</span>
                <span>{item(part.stats?.item_4, part.stats?.item_4_image?.file_30, match, store)}</span>
                <span>{item(part.stats?.item_5, part.stats?.item_5_image?.file_30, match, store)}</span>
            </div>
        </div>
    )
}

export function getMyPart(participants: FullParticipantType[], puuid: string) {
    for (let part of participants) {
        if (part.puuid === puuid) {
            return part
        }
    }
    return undefined
}

export function getStatCosts() {
    let stats_costs = {
        PercentAttackSpeedMod: 300 / 0.12,
        FlatMPPoolMod: 350 / 250,
        FlatHPPoolMod: 400 / 150,
        PercentMovementSpeedMod: 3950,
        FlatPhysicalDamageMod: 350 / 10,
        FlatMagicDamageMod: 435 / 20,
        FlatArmorMod: 300 / 15,
        FlatSpellBlockMod: 450 / 25,
        PercentLifeStealMod: 375 / 0.1,
        PhysicalVamp: 30,
        SpellVamp: 27.5,
        OmniVamp: 39.67,
        FlatCritChanceMod: 800 / 0.2,
        FlatHPRegenMod: 36,
        FlatMovementSpeedMod: 300 / 25,

        BaseManaRegen: 150 / 50,
        Lethality: 5,
        Haste: 26.67,
        // MagicPen: 16 * 100,
        CooldownReduction: 26.67,
        HealAndShieldPower: 56.67,
        Heal: 0.3333,
        PercentBaseHPRegen: 3,
        FlatMagicPen: 31.11,
        ArmorPen: 0,
        MagicPen: 0,
    }
    // calculating value of armor pen against
    // an enemy with 100 armor
    stats_costs.ArmorPen = stats_costs.FlatArmorMod * 100
    stats_costs.MagicPen = stats_costs.FlatSpellBlockMod * 100
    return stats_costs
}

export function stripHtml(html: string) {
    return html.replace(/<(?!br\s*\/?)[^>]+>/g, '')
}

export function stripHtmlFull(html: string) {
    let elt = document.createElement('div')
    elt.innerHTML = html
    return elt.textContent
}

export const VICTORY_COLOR = '#68b568'
export const LOSS_COLOR = '#c33c3c'
export const NEUTRAL_COLOR = 'lightblue'
