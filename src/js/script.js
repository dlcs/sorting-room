const $ = require('jquery');
window.$ = window.jQuery = $;
require('./vendor/jquery.unveil.js');
require('leaflet');
require('./vendor/leaflet-iiif.js');
require('magnific-popup');

// Redux
import { createStore } from 'redux';

// Reducers
import reducers from './reducers/index.js';
import { loadedManifest } from './reducers/loaded-manifest.js';

// Imports
import { selectionInit } from './components/selection.js';

import classifyToolsInit from './components/classify-tools.js';

import {
  derivedManifestsInit,
} from './components/derived-manifests.js';
import { inputInit } from './components/input.js';

import {
  thumbsInit,
} from './components/thumbs.js';
import { } from './components/workspace.js';

import {
  makeManifestInit,
} from './components/make-manifest-modal.js';

import {
  lightboxInit,
} from './components/lightbox.js';

import {
  helpInit,
} from './components/help.js';

import sourceListInit from './components/source-list.js';

// Create the store for the application - hook up redux devtools
/* eslint-disable no-underscore-dangle */
const store = createStore(reducers,
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__());
const manifestStore = createStore(loadedManifest,
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__());
/* eslint-enable */

// Pass the store to component initialisers
sourceListInit(store, manifestStore);
helpInit(store);
thumbsInit(store, manifestStore);
derivedManifestsInit(store, manifestStore);
classifyToolsInit(store, manifestStore);
selectionInit(store, manifestStore);
inputInit(store, manifestStore);
makeManifestInit(store, manifestStore);
lightboxInit(store, manifestStore);
