const $ = require('jquery');
import { hasPropertyChanged } from '../helpers/helpers.js';
import {
  resetDerivedManifests,
  setCanvases,
  setManifest,
} from '../actions/loaded-manifest.js';
import {
  setLoading,
} from '../actions/ui.js';
import {
  clearSelection,
} from '../actions/selected-collection.js';

import { getCreatedManifests } from './derived-manifests.js';
import { thumbsUpdate } from './thumbs.js';
import { IIIF } from '../helpers/iiif.js';

let store = null;
let manifestStore = null;

let lastLocalLoadedManifestState = null;
let lastLocalState = null;

const DOM = {
  $manifestInputContainer: null,
  $manifestInput: null,
  $manifestInputLoad: null,

  init() {
    DOM.$html = $('html');
    DOM.$manifestInputContainer = $('.manifest-input');
    DOM.$manifestInput = $('.manifest-input__text-input');
    DOM.$manifestInputLoad = $('.manifest-input__load-button');
    DOM.$manifestInputFeedback = $('.manifest-input__feedback');
  },
};

const loadIIIFResource = (manifest) => {
  DOM.$html.addClass('manifest-loaded');
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
  DOM.$html.removeClass('dm-loaded');
  $('.workspace-tabs__link[data-modifier="all"]').click();
  store.dispatch(clearSelection());
  store.dispatch(resetDerivedManifests());
  DOM.$html.removeClass('manifest-loaded');
  const inputState = manifestStore.getState();

  if (typeof inputState.manifest !== 'undefined' && inputState.manifest !== null) {
    if (typeof history !== 'undefined') {
      history.replaceState(null, null, `index.html?manifest=${inputState.manifest}`);
    }
    DOM.$manifestInputFeedback.text(`Loading '${inputState.manifest}'...`);
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
        DOM.$manifestInputFeedback.text(`Current manifest: '${iiifResource['@id']}'`);
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
    if (DOM.$manifestInputContainer !== null
      && hasPropertyChanged('loadingManifest', state, lastLocalState)) {
      if (state.loadingManifest) {
        DOM.$manifestInputContainer.addClass('manifest-input--loading');
      } else {
        DOM.$manifestInputContainer.removeClass('manifest-input--loading');
      }
    }
    lastLocalState = state;
  },
};

export const inputInit = (globalStore, globalManifestStore) => {
  store = globalStore;
  manifestStore = globalManifestStore;
  // Subscribe to store changes
  manifestStore.subscribe(Events.manifestStoreSubscribe);
  store.subscribe(Events.storeSubscribe);
  $(document).ready(Events.domReady);
};
