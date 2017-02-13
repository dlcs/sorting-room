const $ = require('jquery');
import { hasPropertyChanged } from '../helpers.js';
import {
  setManifest,
  setCanvases,
  setCollection,
  setLoading,
  setThumbSize,
  toggleList,
} from './inputActions.js';
import {
  clearSelection,
} from '../selection/selectionActions.js';
import { getCreatedManifests } from '../derivedManifests/derivedManifests.js';
import {
  resetDerivedManifests,
} from '../derivedManifests/derivedManifestsActions';
import { SortyConfiguration } from '../../config/config.js';
import { thumbsUpdate } from '../thumbs/thumbs.js';
import { IIIF } from '../iiif.js';
let store = null;
let lastLocalState = null;

const DOM = {
  $expandCollectionButton: null,
  $expandedCollection: null,
  $manifestInput: null,
  $manifestInputLoad: null,
  $manifestInputList: null,

  init() {
    DOM.$expandCollectionButton = $('.manifest-input__expand-button');
    DOM.$expandedCollection = $('.manifest-input__list');
    DOM.$manifestInput = $('.manifest-input__text-input');
    DOM.$manifestInputLoad = $('.manifest-input__load-button');
    DOM.$manifestInputList = $('.manifest-input__list');
  },
};

const loadIIIFResource = (manifest) => {
  $('html').addClass('manifest-loaded');
  $(window).trigger('lookup');
  IIIF.wrap(manifest);
  getCreatedManifests();
  if (!manifest.mediaSequences) {
    store.dispatch(setCanvases(manifest.sequences[0].canvases));
    thumbsUpdate();
  }
};

const ajaxLoadManifest = function () {
  $('html').removeClass('dm-loaded');
  $('.workspace-tabs__link[data-modifier="all"]').click();
  store.dispatch(clearSelection());
  store.dispatch(resetDerivedManifests());
  $('html').removeClass('manifest-loaded');
  const inputState = store.getState().input;
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

const processQueryStringFromInput = function (url) {
  // console.log('pqsfi[', url, ']');
  if (url !== '') {
    const qs = /manifest=(.*)/g.exec(url);
    // console.log('qs', qs);
    if (qs && qs[1]) {
      // console.log('pqsfi');
      store.dispatch(setManifest(decodeURIComponent(qs[1].replace(/%2b/g, '%20'))));
      ajaxLoadManifest();
    }
  }
};

const processQueryString = function () {
  // console.log('processQueryString');
  processQueryStringFromInput(window.location.search);
};

// Template for manifest links
const urlTemplate = `${location.href.replace(location.search, '')}?manifest=`;

function manifestLink(id, text) {
  if (id && text) {
    return `<a href="${urlTemplate}${id}">${text}</a>`;
  }
  return '';
}

function renderCollection(collection) {
  // console.log('render collection');
  const collectionToRender = collection;
  let table = '<table class="table table-condensed"><thead><tr>';
  if (collectionToRender.service && collectionToRender.service.headers) {
    collectionToRender.service.headers.forEach(h => {
      table += `<th>${h}</th>`;
    });
  } else {
    table += '<th>@id</th><th>label</th>';
  }
  table += '</tr></thead><tbody>';
  if (!collectionToRender.members) collectionToRender.members = collectionToRender.manifests;
  if (collectionToRender.members) {
    collectionToRender.members.forEach(m => {
      if (m.service && m.service.values) {
        table += `<tr class="${m.service.highlight}">`;
        table += `<td style="white-space:nowrap;">\
        ${manifestLink(m['@id'], m.service.values[0])}</td>`;
        let j;
        for (j = 1; j < m.service.values.length; j++) {
          table += `<td>${m.service.values[j]}</td>`;
        }
        table += '</tr>';
      } else {
        table += '<tr>';
        table += `<td>${manifestLink(m['@id'], m['@id'])}</td>`;
        table += `<td>${m.label}</td>`;
        table += '</tr>';
      }
    });
  }
  table += '</tbody></table>';
  DOM.$expandedCollection.html(table);
  // $expandedCollection.addClass(`${expandedCollection}--active`);

  DOM.$expandCollectionButton.addClass('manifest-input__expand-button--active');
}

const storeCollectionData = (data) => {
  store.dispatch(setCollection(data));
};

const getCollectionData = () => {
  $.getJSON(SortyConfiguration.sourceCollection, storeCollectionData);
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
    // Subscribe to store changes
    store.subscribe(Events.storeSubscribe);
    // Process query string for manifests
    processQueryString();
    // Get list of manifests
    getCollectionData();
    // Hook up manifest list toggle
    DOM.$expandCollectionButton.click(() => store.dispatch(toggleList()));
    // Hook up manifest list links to auto-load manifests
    DOM.$manifestInputList.on('click', 'a', Events.loadManifestLinkClick);
    // Hook up load button event
    DOM.$manifestInputLoad.click(Events.loadManifestClick);
  },
  loadManifestLinkClick(e) {
    e.preventDefault();
    store.dispatch(setManifest(processQueryStringFromInput(`?${this.href.split('?')[1]}`)));
    store.dispatch(toggleList());
    ajaxLoadManifest();
  },
  loadManifestClick(e) {
    e.preventDefault();
    store.dispatch(setManifest(DOM.$manifestInput.val()));
    ajaxLoadManifest();
  },
  storeSubscribe() {
    // console.log('IN - subscribe', lastLocalState, store.getState().input);
    const state = store.getState().input;
    if (hasPropertyChanged('collection', state, lastLocalState)) {
      renderCollection(state.collection);
    }
    if (hasPropertyChanged('manifest', state, lastLocalState)) {
      DOM.$manifestInput.val(state.manifest);
    }
    if (hasPropertyChanged('listVisible', state, lastLocalState)) {
      const expandedCollectionActiveClass = 'manifest-input__list--active';
      if (state.listVisible) {
        DOM.$expandCollectionButton.text('Hide microfilm list');
        DOM.$expandedCollection.addClass(expandedCollectionActiveClass);
      } else {
        DOM.$expandCollectionButton.text('Show microfilm list');
        DOM.$expandedCollection.removeClass(expandedCollectionActiveClass);
      }
    }
    if (hasPropertyChanged('loading', state, lastLocalState)) {
      if (state.loading) {
        $('.manifest-input').addClass('manifest-input--loading');
      } else {
        $('.manifest-input').removeClass('manifest-input--loading');
      }
    }
    lastLocalState = state;
  },
};

export const inputInit = (globalStore) => {
  store = globalStore;
  const thumbSize = window.localStorage ? localStorage.getItem('thumbSize') : null;
  if (thumbSize !== null) {
    store.dispatch(setThumbSize(thumbSize));
  }
  $(document).ready(Events.domReady);
};
