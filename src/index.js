import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './app/App';
import MainLanding from './main/MainLanding';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
const Root = process.env.REACT_APP_BUILD_TARGET === 'main' ? MainLanding : App;

root.render(
  <Root />
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
