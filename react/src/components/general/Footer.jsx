// components/general/Footer.jsx
import React from 'react'

function footer(props) {
    if (true) {
        return null
    }
    else {
        return (
            <div>
                <div style={{paddingBottom:200, position: 'relative'}}>
                    <div className={`${props.store.state.theme} plain`} style={{position: 'absolute', bottom:0, right:0, left:0}}>
                        <div style={{fontSize: 'smaller', padding: '0px 15px 15px 15px'}}>
                            <div>
                                <em>{props.store.state.project_title}</em> isn’t endorsed by Riot Games and doesn’t reflect the views or opinions of Riot Games
                                or anyone officially involved in producing or managing League of Legends. League of Legends and Riot Games are
                                trademarks or registered trademarks of Riot Games, Inc. League of Legends © Riot Games, Inc.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default footer