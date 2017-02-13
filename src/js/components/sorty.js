const $ = require('jquery');
window.$ = window.jQuery = $;
require('../vendor/jquery.unveil.js');
require('leaflet');
require('../vendor/leaflet-iiif.js');
require('magnific-popup');

import {
  SortyConfiguration,
} from '../config/config.js';
import {
  IIIF,
} from './iiif.js';
import { createStore } from 'redux';
import reducers from './reducers.js';
import { selectionInit } from './selection/selection.js';
import {
  clearSelection,
  setCollectionName,
} from './selection/selectionActions.js';
import {
  derivedManifestsInit,
  getCreatedManifests,
  // loadManifestPage,
} from './derivedManifests/derivedManifests.js';
import { resetDerivedManifests } from './derivedManifests/derivedManifestsActions.js';
import { inputInit } from './input/input.js';
// import { setCanvases } from './input/inputActions.js';
import {
  thumbsInit,
//  makeThumbSizeSelector,
  drawThumbs,
  // thumbsUpdate,
//  storeThumbs,
//  storeThumbSizes,
} from './thumbs/thumbs.js';
import { } from './workspace/workspace.js';

// Create the store for application
const store = createStore(reducers);

// Pass the store to component initialisers
thumbsInit(store);
derivedManifestsInit(store);
selectionInit(store);
inputInit(store);

// Keep track of previous state for state diffing
let lastState = null;

// let bigImage;
// let authDo;

// const manifestTemplate = {
//   '@context': 'http://iiif.io/api/presentation/2/context.json',
//   '@id': 'to be replaced',
//   '@type': 'sc:Manifest',
//   label: 'to be replaced',
//   service: 'canvas map here',
//   sequences: [
//     {
//       '@id': 'to be replaced',
//       '@type': 'sc:Sequence',
//       label: 'Default sequence',
//       canvases: [],
//     },
//   ],
// };

// new : source
// const canvasMapTemplate = {
//   '@id': 'to be replaced',
//   '@context': 'https://dlcs.info/context/presley',
//   profile: 'https://dlcs.info/profiles/canvasmap',
//   canvasMap: {},
// };

// function doInfoAjax(uri, callback, token) {
//   const opts = {};
//   opts.url = uri;
//   opts.complete = callback;
//   if (token) {
//     opts.headers = { Authorization: `Bearer ${token.accessToken}` };
//     opts.tokenServiceUsed = token['@id'];
//   }
//   $.ajax(opts);
// }

// function onInfoComplete(jqXHR) {
//   const infoJson = $.parseJSON(jqXHR.responseText);
//   const services = IIIF.getAuthServices(infoJson);
//
//   if (jqXHR.status === 200) {
//     // TODO - degraded, other auth modes.
//     return;
//   }
//
//   if (jqXHR.status === 403) {
//     alert('TODO... 403');
//     return;
//   }
//
//   if (services.clickthrough) {
//     bigImage.hide();
//     authDo.attr('data-token', services.clickthrough.token.id);
//     authDo.attr('data-uri', services.clickthrough.id);
//     $('#authOps').show();
//     $('.modal-footer').hide();
//     $('#authOps h5').text(services.clickthrough.label);
//     $('#authOps div').html(services.clickthrough.description);
//     authDo.text(services.clickthrough.confirmLabel);
//   } else {
//     alert('only clickthrough supported from here');
//   }
// }

// function attemptAuth(imageService) {
//   let imageServiceInfo = imageService;
//   imageServiceInfo += '/info.json';
//   doInfoAjax(imageServiceInfo, onInfoComplete);
// }

// function reloadImage() {
//   bigImage.show();
//   bigImage.attr('src', `${bigImage.attr('data-src')}#${new Date().getTime()}`);
// }

// function doClickthroughViaWindow() {
//   const authSvc = $(this).attr('data-uri');
//   const tokenSvc = $(this).attr('data-token');
//   const win = window.open(authSvc); //
//   const pollTimer = window.setInterval(() => {
//     if (win.closed) {
//       window.clearInterval(pollTimer);
//       if (tokenSvc) {
//         // on_authed(tokenSvc);
//         $('#authOps').hide();
//         $('.modal-footer').show();
//         reloadImage(); // bypass token for now
//       }
//     }
//   }, 500);
// }


    /*
    const state = store.getState();
    const selectedImages = state.select.selectedImages;
    const manifest = state.input.manifest;
    const canvases = state.input.canvases;
    const s = Math.min.apply(Math, selectedImages);
    const e = Math.max.apply(Math, selectedImages);

    const newManifest = $.extend(true, {}, manifestTemplate);
    IIIF.wrap(newManifest);

    newManifest.id = SortyConfiguration.getManifestUrl(manifest, s, e);
    newManifest.label = SortyConfiguration.getManifestLabel(manifest, s, e);
    newManifest.sequences[0].id = SortyConfiguration.getSequenceUrl(manifest, s, e);
    const canvasMapService = $.extend(true, {}, canvasMapTemplate);
    IIIF.wrap(canvasMapService);
    canvasMapService.id = `${newManifest.id}/canvasmap`;
    newManifest.service = canvasMapService;

    console.log(selectedImages, typeof selectedImages);

    for (const cvsIdx of selectedImages) {
      const sourceCanvas = canvases[cvsIdx];
      const newCanvas = $.extend(true, {}, sourceCanvas);
      IIIF.wrap(newCanvas);
      newCanvas.id = SortyConfiguration.getCanvasUrl(manifest, s, e, cvsIdx);
      canvasMapService.canvasMap[newCanvas.id] = sourceCanvas.id;
      newManifest.sequences[0].canvases.push(newCanvas);
    }

    console.log(newManifest);
    console.log(loadManifestPage);

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
        loadManifestPage(newManifest.id);
      }).fail((xhr, textStatus, error) => {
        alert(error);
      });
    }).fail((xhr, textStatus, error) => {
      alert(error);
    });*/

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
          const manifest = state.input.manifest;
          const selectedImages = state.select.selectedImages;
          const s = Math.min.apply(Math, selectedImages);
          const e = Math.max.apply(Math, selectedImages);
          const label = store.getState().select.collectionName !== null ?
          store.getState().select.collectionName :
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
    const selectedImages = state.select.selectedImages;
    const manifest = state.input.manifest;
    const canvases = state.input.canvases;
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

        // console.log('make manifest done data', data);
        // console.log('new manifest data', newManifest);
        // console.log('existing derivedManifests state', store.getState().derivedManifestsReducer);

        // Push into derived manifests / derived manifests complete
        store.dispatch(resetDerivedManifests());
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
    const inputState = store.getState().input;
    // const selectionState = store.getState().select;

    if (lastState === null && inputState.canvases !== null ||
      lastState !== null && inputState.canvases !==
      lastState.input.canvases) {
      // console.log(inputState.canvases);
      // makeThumbSizeSelector(inputState.canvases);
      // drawThumbs(inputState.canvases);
    }

    if (lastState !== null && inputState.thumbSize !== lastState.input.thumbSize) {
      drawThumbs();
    }

    lastState = store.getState();
  },
};

$(document).ready(Events.domReady);

store.subscribe(Events.storeSubscribe);
