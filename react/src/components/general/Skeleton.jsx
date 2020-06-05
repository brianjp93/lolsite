import React from 'react'
import NavBar from './NavBar'
import Footer from './Footer'

function Skeleton(props) {
    return (
        <React.Fragment>
            <NavBar store={props.store} />
            <div style={{height: 100}}></div>
            {props.children}
            <Footer store={props.store} />
        </React.Fragment>
    )
}

export default Skeleton
