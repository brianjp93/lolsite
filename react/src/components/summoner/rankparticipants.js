// export function rankParticipants(participants) {
//     let team100 = participants.filter(item => {return item.team_id === 100})
//     let team200 = participants.filter(item => {return item.team_id === 200})
//     team100 = rankTeam(team100)
//     team200 = rankTeam(team200)
//     return [...team100, ...team200]
// }

export function rankParticipants(participants) {
    let out
    if (participants.length === 10) {
        let team100 = participants.filter(item => {
            return item.team_id === 100
        })
        let team200 = participants.filter(item => {
            return item.team_id === 200
        })
        team100 = rankTeam(team100)
        team200 = rankTeam(team200)

        let normalize_factor = 2
        for (let i = 0; i < team100.length; i++) {
            let p1 = team100[i]
            let p2 = team200[i]
            let total = p1.impact + p2.impact
            p1.impact = (p1.impact / total) * normalize_factor
            p2.impact = (p2.impact / total) * normalize_factor
        }
        let team_sort_1 = [...team100]
        let team_sort_2 = [...team200]
        team_sort_1.sort((a, b) => b.impact - a.impact)
        team_sort_2.sort((a, b) => b.impact - a.impact)
        let score_dict = {}
        for (let i = 0; i < team_sort_1.length; i++) {
            let p1 = team_sort_1[i]
            let p2 = team_sort_2[i]
            score_dict[p1._id] = { impact: p1.impact, impact_rank: i + 1 }
            score_dict[p2._id] = { impact: p2.impact, impact_rank: i + 1 }
        }
        for (let i = 0; i < team100.length; i++) {
            team100[i].impact = score_dict[team100[i]._id].impact
            team100[i].impact_rank = score_dict[team100[i]._id].impact_rank
            team200[i].impact = score_dict[team200[i]._id].impact
            team200[i].impact_rank = score_dict[team200[i]._id].impact_rank
        }

        out = [...team100, ...team200]
    } else {
        for (let i = 0; i < participants.length; i++) {
            participants[i].impact = 1
            participants[i].impact_rank = 2
        }
        out = participants
    }
    return out
}

export function rankTeam(team) {
    let f1 = team.map(p => p.stats.total_damage_dealt_to_champions).reduce((a, b) => a + b)
    f1 += 1000
    let f1_weight = 1

    let f2 = team.map(p => p.stats.damage_dealt_to_objectives).reduce((a, b) => a + b)
    f2 += 1000
    let f2_weight = 0.5

    let f3 = team.map(p => p.stats.damage_dealt_to_turrets).reduce((a, b) => a + b)
    f3 += 1000
    let f3_weight = 0.7

    let f4 = team.map(p => p.stats.kills).reduce((a, b) => a + b)
    f4 += 5
    let f4_weight = 2.5

    let f5 = team.map(p => p.stats.vision_score).reduce((a, b) => a + b)
    if (f5 === 0) {
        f5 = 1
    }
    let f5_weight = 1

    let f6 = team.map(p => p.stats.total_heal).reduce((a, b) => a + b)
    f6 += 1000
    let f6_weight = 0.3

    let f7 = team.map(p => p.stats.time_ccing_others).reduce((a, b) => a + b)
    f7 += 5
    let f7_weight = 0.3

    // assists
    let f8_weight = f4_weight * 0.6

    let d1 = team.map(p => p.stats.deaths).reduce((a, b) => a + b)
    d1 += 3
    let d1_weight = 2

    let newteam = []
    for (let p of team) {
        let f1_impact = (p.stats.total_damage_dealt_to_champions / f1) * f1_weight
        let f2_impact = (p.stats.damage_dealt_to_objectives / f2) * f2_weight
        let f3_impact = (p.stats.damage_dealt_to_turrets / f3) * f3_weight
        let f4_impact = (p.stats.kills / f4) * f4_weight
        let f5_impact = (p.stats.vision_score / f5) * f5_weight
        let f6_impact = (p.stats.total_heal / f6) * f6_weight
        let f7_impact = (p.stats.time_ccing_others / f7) * f7_weight
        let f8_impact = (p.stats.assists / f4) * f8_weight

        let d1_impact = (p.stats.deaths / d1) * d1_weight

        let impact = [
            f1_impact,
            f2_impact,
            f3_impact,
            f4_impact,
            f5_impact,
            f6_impact,
            f7_impact,
            f8_impact,
        ].reduce((a, b) => a + b)

        let detriment = [d1_impact].reduce((a, b) => a + b)

        impact = impact - detriment

        newteam.push({ _id: p._id, impact })
    }
    newteam.sort((a, b) => b.impact - a.impact)
    for (let i = 0; i < newteam.length; i++) {
        newteam[i].impact_rank = i + 1
    }

    let score_dict = {}
    for (let item of newteam) {
        score_dict[item._id] = item
    }

    for (let i = 0; i < team.length; i++) {
        let _id = team[i]._id
        team[i].impact = score_dict[_id].impact
        team[i].impact_rank = score_dict[_id].impact_rank
    }
    return team
}
