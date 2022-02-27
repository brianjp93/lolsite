import React from 'react'
import {NavBar} from './NavBar'
import Footer from './Footer'

export default function Skeleton({store, children, topPad=100}: {store: any, children: any, topPad?: number}) {
    return (
        <React.Fragment>
            <NavBar store={store} />
            <div style={{ height: topPad }}></div>
            {children}
            <Footer store={store} />
        </React.Fragment>
    )
}
