/****************************************************************************************
 * LiveZilla CommonConfigClass.js
 *
 * Copyright 2013 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

function CommonConfigClass() {
    this.lz_version = '5.4.0.0'; // version of the lz client for compatibility reasons with the server
    this.lz_app_version = '';
    this.lz_min_version = (appOs == 'blackberry') ? '5.4.0.0' : '5.0.1.3'; // min version needed for the app
    this.lz_reload_interval = 5000; // time between polling the server in miliseconds
    this.lz_user_states = [
        {index: 0, text:'Available',icon:'img/lz_online.png',icon14:'img/lz_online_14.png'}, // t('Available')
        {index: 1, text:'Busy',icon:'img/lz_busy.png',icon14:'img/lz_busy_14.png'}, // t('Busy')
        {index: 2, text:'Offline',icon:'img/lz_offline.png',icon14:'img/lz_offline_14.png'}, // t('Offline')
        {index: 3, text:'Away',icon:'img/lz_away.png',icon14:'img/lz_away_14.png'} // t('Away')
    ];
    this.lz_server_protocols = [{name: 'http://', port: 80},{name:'https://', port: 443}]; // server protocols

    this.largeDisplayThreshold = 1000000;
    this.smallDisplayThreshold = 1000000;
    this.pollTimeout = 30000;
    this.noAnswerTimeBeforeLogout = 60000;
}
