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

// Sorty config
import {
  SortyConfiguration,
} from './config/config.js';

// IIIF helpers
import {
  IIIF,
} from './helpers/iiif.js';
import {
  hasPropertyChanged,
} from './helpers/helpers.js';

import { selectionInit } from './components/selection.js';
import {
  clearSelection,
  setCollectionName,
} from './actions/selected-collection.js';
import {
  derivedManifestsInit,
  getCreatedManifests,
} from './components/derived-manifests.js';
import { resetDerivedManifests } from './actions/loaded-manifest.js';
import { inputInit } from './components/input.js';

import {
  thumbsInit,
  drawThumbs,
} from './components/thumbs.js';
import { } from './components/workspace.js';

// Create the store for application
/* eslint-disable no-underscore-dangle */
const store = createStore(reducers,
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__());
const manifestStore = createStore(loadedManifest,
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__());
/* eslint-enable */

// Pass the store to component initialisers
thumbsInit(store, manifestStore);
derivedManifestsInit(store, manifestStore);
selectionInit(store, manifestStore);
inputInit(store, manifestStore);

// Keep track of previous state for state diffing
let lastState = null;

const Config = {
  manifestTemplate: {
    '@context': 'http://iiif.io/api/presentation/2/context.json',
    '@id': 'to be replaced',
    '@type': 'sc:Manifest',
    label: 'to be replaced',
    service: 'canvas map here',
    sequences: [
      {
        '@id': 'to be replaced',
        '@type': 'sc:Sequence',
        label: 'Default sequence',
        canvases: [],
      },
    ],
  },
  canvasMapTemplate: {
    '@id': 'to be replaced',
    '@context': 'https://dlcs.info/context/presley',
    profile: 'https://dlcs.info/profiles/canvasmap',
    canvasMap: {},
  },
};

const DOM = {
  $makeManifestButton: null,
  $manifestModalInput: null,
  $modalCancel: null,
  $modalMakeManifest: null,
  init() {
    DOM.$makeManifestButton = $('.toolbar__make');
    DOM.$manifestModalInput = $('.manifest-modal__input');
    DOM.$modalCancel = $('.manifest-modal__dismiss');
    DOM.$modalMakeManifest = $('.manifest-modal__make');
  },
};

const Events = {
  domReady() {
    DOM.init();
    // DOM.$makeManifestButton.click(Events.makeManifestClick);
    DOM.$modalCancel.click(Events.modalCancel);
    DOM.$modalMakeManifest.click(Events.modalMakeManifest);
    DOM.$makeManifestButton.magnificPopup({
      callbacks: {
        beforeOpen() {
          $('html').addClass('mfp-modal');
          const state = store.getState();
          const manifestState = manifestStore.getState();
          const manifest = manifestState.manifest;
          const selectedImages = state.selectedCollection.selectedImages;
          const s = Math.min.apply(Math, selectedImages);
          const e = Math.max.apply(Math, selectedImages);
          const label = store.getState().selectedCollection.collectionName !== null ?
          store.getState().selectedCollection.collectionName :
          SortyConfiguration.getManifestLabel(manifest, s, e).trim();
          DOM.$manifestModalInput.val(label);
        },
        beforeClose() {
          $('html').removeClass('mfp-modal');
        },
      },
      items: {
        src: '#manifestmodal',
        type: 'inline',
      },
      modal: true,
    });
  },
  modalCancel() {
    $.magnificPopup.close();
  },
  modalMakeManifest() {
    const state = store.getState();
    const manifestState = manifestStore.getState();
    const selectedImages = state.select.selectedImages;
    const manifest = manifestState.manifest;
    const canvases = manifestState.canvases;
    const s = Math.min.apply(Math, selectedImages);
    const e = Math.max.apply(Math, selectedImages);

    const newManifest = $.extend(true, {}, Config.manifestTemplate);
    IIIF.wrap(newManifest);

    newManifest.id = SortyConfiguration.getManifestUrl(manifest, s, e);
    newManifest.label = DOM.$manifestModalInput.val();
    newManifest.sequences[0].id = SortyConfiguration.getSequenceUrl(manifest, s, e);
    const canvasMapService = $.extend(true, {}, Config.canvasMapTemplate);
    IIIF.wrap(canvasMapService);
    canvasMapService.id = `${newManifest.id}/canvasmap`;
    newManifest.service = canvasMapService;

    for (const cvsIdx of selectedImages) {
      const sourceCanvas = canvases[cvsIdx];
      const newCanvas = $.extend(true, {}, sourceCanvas);
      IIIF.wrap(newCanvas);
      newCanvas.id = SortyConfiguration.getCanvasUrl(manifest, s, e, cvsIdx);
      canvasMapService.canvasMap[newCanvas.id] = sourceCanvas.id;
      newManifest.sequences[0].canvases.push(newCanvas);
    }

    $.ajax({
      url: newManifest.id,
      type: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify(newManifest),
      dataType: 'json',
    }).done(() => {
      newManifest.sequences = null;
      newManifest.service = null;
      $.ajax({
        url: SortyConfiguration.getCollectionUrl(manifest),
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(newManifest),
        dataType: 'json',
      }).done(() => {
        $.magnificPopup.close();
        // Collapse the selection away
        // Give them the --classified class
        const $activeThumbs = $('.thumb--active');
        $activeThumbs.parent().addClass('tc--classified');
        $activeThumbs.removeClass('thumb--active');

        // Clear selection
        store.dispatch(clearSelection());
        store.dispatch(setCollectionName(''));

        // Push into derived manifests / derived manifests complete
        manifestStore.dispatch(resetDerivedManifests());
        getCreatedManifests();

        // Switch to classified view to reflect new derived manifest
        $('workspace-tabs__link[data-modifier="done"]').click();
        // loadManifestPage(newManifest.id);
      }).fail((xhr, textStatus, error) => {
        alert(error);
      });
    }).fail((xhr, textStatus, error) => {
      alert(error);
    });
  },
  storeSubscribe() {
    console.log('scripts.js', store.getState());
    const state = store.getState().ui;

    if (hasPropertyChanged('thumbSize', state, lastState)) {
      drawThumbs();
    }

    lastState = state;
  },
};

$(document).ready(Events.domReady);

store.subscribe(Events.storeSubscribe);
