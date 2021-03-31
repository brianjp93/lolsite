import React from 'react'
import NavBar from './NavBar'
import Footer from './Footer'

export default function Skeleton(props: any) {
    return (
        <React.Fragment>
            <NavBar store={props.store} />
            <div style={{ height: 100 }}></div>
            {props.children}
            <Footer store={props.store} />
        </React.Fragment>
    )
}
