import React from 'react'
import ReactTooltip from 'react-tooltip'
import { getStatMod } from '../../constants/statmod'

export function StatModTable(props) {
    const participant = props.participant
    const statmods = getStatMod('latest')

    const perk_0_order = [5008, 5005, 5007]
    const perk_1_order = [5008, 5002, 5003]
    const perk_2_order = [5001, 5002, 5003]
    const table_rows = [perk_0_order, perk_1_order, perk_2_order]

    return (
        <div>
            {table_rows.map((perks, perk_int) => {
                return (
                    <div key={`${participant.summoner_name}-${perk_int}`}>
                        {perks.map((perk_id, key) => {
                            const perk = statmods[perk_id]
                            const is_perk_selected =
                                participant.stats[`stat_perk_${perk_int}`] === perk_id
                            let perk_style = { padding: 5, margin: 5, display: 'inline-block' }
                            let image_style = { width: 30, verticalAlign: 'bottom' }
                            if (is_perk_selected) {
                                perk_style.border = '1px solid grey'
                                perk_style.borderRadius = '50%'
                            } else {
                                image_style.filter = 'grayscale(1)'
                            }
                            return (
                                <div key={`${perk_id}-${key}`} style={{ display: 'inline-block' }}>
                                    <ReactTooltip id={`perk-tooltip-${perk_id}`} effect="solid">
                                        <span>{perk.name}</span>
                                    </ReactTooltip>
                                    <div
                                        data-tip
                                        data-for={`perk-tooltip-${perk_id}`}
                                        style={{ ...perk_style }}
                                    >
                                        <img
                                            style={{ ...image_style }}
                                            src={statmods[perk_id].image_url}
                                            alt=""
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )
            })}
        </div>
    )
}
