const $ = require('jquery');
import { hasPropertyChanged } from '../helpers/helpers.js';
import {
  setSourceManifests,
} from '../actions/source-list.js';
import { SortyConfiguration } from '../config/config.js';
import {
  toggleList,
} from '../actions/ui.js';
import {
  ajaxLoadManifest,
  processQueryStringFromInput,
} from './input.js';

let store = null;

let lastLocalSourceListState = null;
let lastLocalUiState = null;

const Init = (globalStore) => {
  store = globalStore;
};
export default Init;

const DOM = {
  $expandCollectionButton: null,
  $expandedCollection: null,
  $manifestInputList: null,

  init() {
    DOM.$expandCollectionButton = $('.manifest-input__expand-button');
    DOM.$expandedCollection = $('.manifest-input__list');
    DOM.$manifestInputList = $('.manifest-input__list');
  },
};

// Template for manifest links
const urlTemplate = `${location.href.replace(location.search, '')}?manifest=`;

function manifestLink(id, text) {
  if (id && text) {
    return `<a href="${urlTemplate}${id}">${text}</a>`;
  }
  return '';
}

const storeCollectionData = (data) => {
  store.dispatch(setSourceManifests(data));
};

const getCollectionData = () => {
  $.getJSON(SortyConfiguration.sourceCollection, storeCollectionData);
};

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

const Events = {
  domReady() {
    // Get DOM elements
    DOM.init();
    // Subscribe to store changes
    store.subscribe(Events.storeSubscribe);
    // Get list of manifests
    getCollectionData();
    // Hook up manifest list toggle
    DOM.$expandCollectionButton.click(() => store.dispatch(toggleList()));
    // Hook up manifest list links to auto-load manifests
    DOM.$manifestInputList.on('click', 'a', Events.loadManifestLinkClick);
  },
  loadManifestLinkClick(e) {
    e.preventDefault();
    processQueryStringFromInput(`?${this.href.split('?')[1]}`);
    document.body.scrollTop = document.documentElement.scrollTop = 0;
    store.dispatch(toggleList());
    ajaxLoadManifest();
  },
  storeSubscribe() {
    const uiState = store.getState().ui;
    const sourceListState = store.getState().sourceList;

    if (hasPropertyChanged('sourceManifests', sourceListState, lastLocalSourceListState)) {
      renderCollection(sourceListState.sourceManifests);
    }
    if (hasPropertyChanged('listVisible', uiState, lastLocalUiState)) {
      const expandedCollectionActiveClass = 'manifest-input__list--active';
      if (uiState.listVisible) {
        DOM.$expandCollectionButton
        .html('<i class="material-icons">arrow_drop_up</i>Hide microfilm list');
        DOM.$expandedCollection.addClass(expandedCollectionActiveClass);
      } else {
        DOM.$expandCollectionButton
        .html('<i class="material-icons">arrow_drop_down</i>Show microfilm list');
        DOM.$expandedCollection.removeClass(expandedCollectionActiveClass);
      }
    }
    lastLocalUiState = uiState;
    lastLocalSourceListState = sourceListState;
  },
};

$(document).ready(Events.domReady);
