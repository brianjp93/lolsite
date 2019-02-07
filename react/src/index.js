import React from 'react';
import ReactDOM from 'react-dom';
import registerServiceWorker from './registerServiceWorker';
import './index.css';

const APPS = {
    
};

function renderAppInElement(elt) {
    var App = APPS[elt.id];
    if (!App) {
        App = APPS[elt.getAttribute('app-name')];
        if (!App) {
            return;
        }
    };
    const props = Object.assign({}, elt.dataset);
    ReactDOM.render(<App {...props} />, elt);
    registerServiceWorker();
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