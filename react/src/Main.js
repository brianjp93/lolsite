import React, { Component } from 'react';
import {Switch, Route, Link} from 'react-router-dom';
import './Main.css';

class Main extends Component {
  render() {
    return (
      <div>
        <Routes />
      </div>
    );
  }
}

function Routes() {
  return (
    <main>
      <Switch>
        <Route exact path='/' component={Home} />
        <Route exact path='/test/' component={Test}/>
      </Switch>
    </main>
  )
}

class Home extends Component {
  render() {
    return (
      <div>
        <div className="row">
          <div className="col s6 offset-s3">
            <div className="input-field">
              <input id='summoner-search' type="text"/>
              <label htmlFor="summoner-search">Summoner</label>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

class Test extends Component {
  render() {
    return (
      <div>
        THIS IS A TEST PAGE
        <Link to='/'>Go Home</Link>
      </div>
    )
  }
}

export default Main;
