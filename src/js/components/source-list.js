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

const Init = (globalStore) => {
  store = globalStore;
};
export default Init;

const DOM = {
  // $expandCollectionButton: null,
  $expandedCollection: null,

  init() {
    // DOM.$expandCollectionButton = $('.manifest-input__expand-button');
    DOM.$expandedCollection = $('.source-list__list');
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
  // Try and add to localStorage with a timestamp
  try {
    localStorage.setItem('collectionData', JSON.stringify({
      raw: data,
      timestamp: new Date(),
    }));
  } catch (e) {
    console.log(e, 'localStorage not supported for setItem');
  }
  store.dispatch(setSourceManifests(data));
};

const getCollectionData = () => {
  // Look in local storage first
  let collectionData = null;
  try {
    collectionData = JSON.parse(localStorage.getItem('collectionData'));
    if (typeof collectionData.raw === 'undefined'
    || typeof collectionData.timestamp === 'undefined') {
      localStorage.collectionData = null;
    }
  } catch (e) {
    console.log(e, 'localStorage not supported for getItem');
  }

  console.log(collectionData);

  // If collection is found display it
  if (collectionData !== null) {
    console.log('there is data');
    store.dispatch(setSourceManifests(collectionData.raw));
    const timestamp = new Date(collectionData.timestamp);
    const now = new Date();
    const offset = now.setMinutes(now.getMinutes() - 30);
    if (timestamp < offset) {
      console.log('data is old', timestamp, offset);
      $.getJSON(SortyConfiguration.sourceCollection, storeCollectionData);
    }
  } else {
    console.log('collection data is null');
    // If the data we're showing is old, get a fresh copy
    $.getJSON(SortyConfiguration.sourceCollection, storeCollectionData);
  }
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
  // DOM.$expandedCollection.html(table);
  // $expandedCollection.addClass(`${expandedCollection}--active`);

  // DOM.$expandCollectionButton.addClass('manifest-input__expand-button--active');
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
    // DOM.$expandCollectionButton.click(() => store.dispatch(toggleList()));
    // Hook up manifest list links to auto-load manifests
    // DOM.$expandedCollection.on('click', 'a', Events.loadManifestLinkClick);
  },
  loadManifestLinkClick(e) {
    e.preventDefault();
    processQueryStringFromInput(`?${this.href.split('?')[1]}`);
    document.body.scrollTop = document.documentElement.scrollTop = 0;
    store.dispatch(toggleList());
    ajaxLoadManifest();
  },
  storeSubscribe() {
    const sourceListState = store.getState().sourceList;
    if (hasPropertyChanged('sourceManifests', sourceListState, lastLocalSourceListState)) {
      renderCollection(sourceListState.sourceManifests);
    }
    lastLocalSourceListState = sourceListState;
  },
};

$(document).ready(Events.domReady);
