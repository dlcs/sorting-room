const $ = require('jquery');
import { hasPropertyChanged } from '../helpers/helpers.js';
import {
  setSourceManifests,
} from '../actions/source-list.js';
import { SortyConfiguration } from '../config/config.js';
import {
  // ajaxLoadManifest,
  // processQueryStringFromInput,
} from './input.js';
import {
  // setManifestMetaData,
} from '../actions/loaded-manifest.js';

let store = null;
// let manifestStore = null;

let lastLocalSourceListState = null;

const Init = (globalStore) => {
  store = globalStore;
  // manifestStore = globalManifestStore;
};
export default Init;

const DOM = {
  // $expandCollectionButton: null,
  $expandedCollection: null,

  init() {
    // DOM.$expandCollectionButton = $('.manifest-input__expand-button');
    DOM.$expandedCollection = $('.source-list');
  },
};

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


  // If collection is found display it
  if (collectionData !== null) {
    // console.log('there is data', collectionData);
    store.dispatch(setSourceManifests(collectionData.raw));
    const timestamp = new Date(collectionData.timestamp);
    const now = new Date();
    const offset = now.setMinutes(now.getMinutes() - 30);
    if (timestamp < offset) {
      // console.log('data is old', timestamp, offset);
      $.getJSON(SortyConfiguration.sourceCollection, storeCollectionData);
    }
  } else {
    // console.log('collection data is null');
    // If the data we're showing is old, get a fresh copy
    $.getJSON(SortyConfiguration.sourceCollection, storeCollectionData);
  }
};

function renderCollectionNew(collection) {
  let listItems = '';
  const img = `
  <div class="source-list__image-container">
    <img class="source-list__image" src="//placehold.it/40x50" alt="" />
  </div>`;
  const collectionToRender = collection;
  if (!collectionToRender.members) collectionToRender.members = collectionToRender.manifests;
  if (collectionToRender.members) {
    collectionToRender.members.forEach(m => {
      if (m !== null && m.service && m.service.values) {
        listItems += `
        <li class="source-list__item">
          ${img}
          <div class="source-list__description">
            <h2>
              <a href="classify.html?manifest=${m['@id']}"
              data-short-name="${m.service.values[0]}"
              data-title="${m.service.values[1]}">
                ${m.service.values[1]}
              </a>
            </h2>
            <p>${m.service.values[2]}: ${m.service.values[4]}</p>
          </div>
          <div class="source-list__roll-data">
            <h3>${m.service.values[0]}</h3>
            <p>X images, <a href="sets.html?manifest=${m['@id']}"
            data-short-name="${m.service.values[0]}"
            data-title="${m.service.values[1]}">Y sets</a></p>
          </div>
          <div class="source-list__progress">
            <progress value="0" max="100" class="source-list__progress-bar"></progress>
          </div>
        </li>
        `;
      }
    });
  }

  const listTemplate = `
  <ul class="source-list__list">
    ${listItems}
  </ul>`;

  DOM.$expandedCollection.html(listTemplate);
}

/*
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
}*/

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
  /*
  loadManifestLinkClick() {
    // e.preventDefault();
    processQueryStringFromInput(`?${this.href.split('?')[1]}`);
    document.body.scrollTop = document.documentElement.scrollTop = 0;
    const $link = $(this);
    // const title = $link.attr('data-title');
    const shortName = $link.attr('data-short-name');
    manifestStore.dispatch(setManifestMetaData(title, shortName));
    // store.dispatch(toggleList());
    // ajaxLoadManifest();
  },*/
  storeSubscribe() {
    const sourceListState = store.getState().sourceList;
    if (hasPropertyChanged('sourceManifests', sourceListState, lastLocalSourceListState)) {
      renderCollectionNew(sourceListState.sourceManifests);
    }
    lastLocalSourceListState = sourceListState;
  },
};

$(document).ready(Events.domReady);
