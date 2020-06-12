import React from 'react'
import ReactDOM from 'react-dom'
import {BrowserRouter} from 'react-router-dom'
import * as serviceWorker from "./serviceWorker"
import './index.css'
import './spinners.css'
import './theme/dark.css'
import './theme/light.css'
import App from './App'

const APPS = {
    'App': App,
};

function renderAppInElement(elt) {
    var AppComponent = APPS[elt.id];
    var name = elt.id;
    if (!AppComponent) {
        name = elt.getAttribute('app-name');
        AppComponent = APPS[name];
        if (!AppComponent) {
            return;
        }
    };
    const props = Object.assign({}, elt.dataset);
    if (name === 'App') {
        ReactDOM.render((
            <BrowserRouter>
                <AppComponent {...props} />
            </BrowserRouter>
            ), elt
        );
    }
    else {
        ReactDOM.render(<AppComponent {...props} />, elt);
    }
}

window.onload = function() {
    var elts = document.querySelectorAll('.__react_root');
    for (var i=0; i<elts.length; i++) {
        renderAppInElement(elts[i]);
    }
}


// load specific app
// needed for loading apps after ajax request
window.loadApp = function(app_name) {
    var elts = document.querySelectorAll('.__react_root');
    for (var i=0; i<elts.length; i++) {
        if (elts[i].getAttribute('app-name') === app_name){
            renderAppInElement(elts[i]);
        }
    }
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
