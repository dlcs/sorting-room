const $ = require('jquery');
import { hasPropertyChanged } from '../helpers/helpers.js';
import {
  resetDerivedManifests,
  setCanvases,
  setManifest,
} from '../actions/loaded-manifest.js';
import {
  setLoading,
  setThumbSize,
} from '../actions/ui.js';
import {
  clearSelection,
} from '../actions/selected-collection.js';
import sourceListInit from './source-list.js';

import { getCreatedManifests } from './derived-manifests.js';
import { thumbsUpdate } from './thumbs.js';
import { IIIF } from '../helpers/iiif.js';

let store = null;
let manifestStore = null;

let lastLocalLoadedManifestState = null;
let lastLocalState = null;

const DOM = {
  $manifestInput: null,
  $manifestInputLoad: null,

  init() {
    DOM.$manifestInput = $('.manifest-input__text-input');
    DOM.$manifestInputLoad = $('.manifest-input__load-button');
  },
};

const loadIIIFResource = (manifest) => {
  $('html').addClass('manifest-loaded');
  $(window).trigger('lookup');
  IIIF.wrap(manifest);
  // console.log(manifest);
  getCreatedManifests();
  if (!manifest.mediaSequences) {
    manifestStore.dispatch(setCanvases(manifest.sequences[0].canvases));
    thumbsUpdate();
  }
};

export const ajaxLoadManifest = function () {
  $('html').removeClass('dm-loaded');
  $('.workspace-tabs__link[data-modifier="all"]').click();
  store.dispatch(clearSelection());
  store.dispatch(resetDerivedManifests());
  $('html').removeClass('manifest-loaded');
  const inputState = manifestStore.getState();

  if (typeof inputState.manifest !== 'undefined' && inputState.manifest !== null) {
    if (typeof history !== 'undefined') {
      history.replaceState(null, null, `index.html?manifest=${inputState.manifest}`);
    }
    $('.manifest-input__feedback').text(`Loading '${inputState.manifest}'...`);
    store.dispatch(setLoading(true));
    $.ajax({
      dataType: 'json',
      url: inputState.manifest,
      cache: true,
      error(data) {
        alert(`Error: ${data.statusText}`);
        store.dispatch(setLoading(false));
        // console.log(data);
      },
      success(iiifResource) {
        // console.log(iiifResource);
        $('.manifest-input__feedback').text(`Current manifest: '${iiifResource['@id']}'`);
        store.dispatch(setLoading(false));
        if (iiifResource['@type'] === 'sc:Collection') {
          // console.log('Render collection');
          // renderCollection(iiifResource);
          // TODO - collections
          // window.loadedResource = iiifResource.manifests[0]['@id'];
          // $.getJSON(window.loadedResource, function (cManifest) {
          //     load(cManifest);
          // });
        } else {
          // console.log('Load iiif resource');
          loadIIIFResource(iiifResource);
        }
      },
    });
  }
};

export const processQueryStringFromInput = function (url) {
  // console.log('pqsfi[', url, ']');
  if (url !== '') {
    const qs = /manifest=(.*)/g.exec(url);
    // console.log('qs', qs);
    if (qs && qs[1]) {
      // console.log('pqsfi');
      manifestStore.dispatch(setManifest(decodeURIComponent(qs[1].replace(/%2b/g, '%20'))));
      ajaxLoadManifest();
    }
  }
};

const processQueryString = function () {
  // console.log('processQueryString');
  processQueryStringFromInput(window.location.search);
};

/*
function showCollectionUI() {
  if (SortyConfiguration.sourceCollection) {
    const $collectionLister = $('#collectionLister');
    $collectionLister.click(() => {
      $.getJSON(SortyConfiguration.sourceCollection, renderCollection);
    });
  }
}*/

const Events = {
  domReady() {
    // Get DOM elements
    DOM.init();
    // Process query string for manifests
    processQueryString();
    // Hook up load button event
    DOM.$manifestInputLoad.click(Events.loadManifestClick);
  },
  loadManifestClick(e) {
    e.preventDefault();
    manifestStore.dispatch(setManifest(DOM.$manifestInput.val()));
    ajaxLoadManifest();
  },
  manifestStoreSubscribe() {
    // console.log('IN - subscribe', lastLocalState, store.getState().input);
    const loadedManifestState = manifestStore.getState();

    if (hasPropertyChanged('manifest', loadedManifestState, lastLocalLoadedManifestState)) {
      DOM.$manifestInput.val(loadedManifestState.manifest);
    }
    lastLocalLoadedManifestState = loadedManifestState;
  },
  storeSubscribe() {
    const state = store.getState().ui;
    // console.log('input store subscribe', state.loadingManifest,
    // hasPropertyChanged('loadingManifest', state, lastLocalState));
    if (hasPropertyChanged('loadingManifest', state, lastLocalState)) {
      if (state.loadingManifest) {
        $('.manifest-input').addClass('manifest-input--loading');
      } else {
        $('.manifest-input').removeClass('manifest-input--loading');
      }
    }
    lastLocalState = state;
  },
};

export const inputInit = (globalStore, globalManifestStore) => {
  store = globalStore;
  manifestStore = globalManifestStore;
  sourceListInit(store, manifestStore);
  // Subscribe to store changes
  manifestStore.subscribe(Events.manifestStoreSubscribe);
  store.subscribe(Events.storeSubscribe);
  const thumbSize = window.localStorage ? localStorage.getItem('thumbSize') : null;
  if (thumbSize !== null) {
    store.dispatch(setThumbSize(thumbSize));
  }
  $(document).ready(Events.domReady);
};
