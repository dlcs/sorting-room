const $ = require('jquery');
import {
  hasPropertyChanged,
  hasPropertyChangedNonZero,
} from '../helpers/helpers.js';
import { SortyConfiguration } from '../config/config.js';
import { IIIF } from '../helpers/iiif.js';
import {
//  selectDerivedManifest,
  setDerivedManifests,
  setDerivedManifestsComplete,
  setClassifiedCanvases,
  resetDerivedManifests } from '../actions/loaded-manifest.js';
// import { replaceSelection } from '../selection/selectionActions.js';
import { updateThumbsWithStatus } from './thumbs.js';

const manifestSelector = '.manifest-select__dropdown';
const viewManifest = '.manifest-select__view-uv';

let manifestStore = null;
let lastLocalState = null;

const DOM = {
  $manifestSelector: null,
  $classifiedMaterial: null,

  init() {
    DOM.$manifestSelector = $(manifestSelector);
    DOM.$classifiedMaterial = $('.classified-material');
  },
};

const buildClassified = (derivedManifestList) => {
  // console.log('buildClassified', DOM.$classifiedMaterial != null &&
  if (DOM.$classifiedMaterial != null && DOM.$classifiedMaterial.length) {
    const preferredHeight = parseInt(localStorage.getItem('thumbSize'), 10);
    const preferredWidth = preferredHeight / 1.5;
    const placeholder = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB'
    + 'CAQAAAC1HAwCAAAAC0lEQVR42mO8+R8AArcB2pIvCSwAAAAASUVORK5CYII=';

    DOM.$classifiedMaterial.html('');
    if (derivedManifestList && derivedManifestList.members) {
      for (let i = 0; i < derivedManifestList.members.length; i++) {
        const manifest = derivedManifestList.members[i];
        const label = manifest.label || manifest.id;
        DOM.$classifiedMaterial.append(`
          <div class="classified-manifest" data-id="${manifest.id}">
            <h2 class="classified-manifest__title">${label}</h2>
            <p class="classified-manifest__num">{x} images in this collection</p>
            <div class="classified-manifest__front">
              <img src="${placeholder}" \
              height="${preferredHeight}" width="${preferredWidth}" />
            </div>
            <div class="classified-manifest__second">
              <img src="${placeholder}" \
              height="${preferredHeight}" width="${preferredWidth}" />
            </div>
            <div class="classified-manifest__third">
              <img src="${placeholder}" \
              height="${preferredHeight}" width="${preferredWidth}" />
            </div>
            <div class="classified-manifest__actions">
              <a class="btn" href="http://universalviewer.io/?manifest=${manifest.id}" target="_blank"><i class="material-icons">open_in_new</i> View in UV</a>
            </div>
          </div>`);
      }
    }
  }
};

export const loadManifestPage = function loadManifestPage(manifestUrl) {
  window.open(`http://universalviewer.io/?manifest=${manifestUrl}`, '_blank');
};

const Events = {
  domReady() {
    DOM.init();
  },
  init() {
    DOM.$manifestSelector.change(Events.derivedManifestChange);
  },
  requestDerivedManifestsFailure() {
    manifestStore.dispatch(resetDerivedManifests());
  },
  requestDerivedManifestsSuccess(collection) {
    IIIF.wrap(collection);
    // console.log(collection);
    manifestStore.dispatch(setDerivedManifests(collection));
    // console.log('RDMS', collection);
    const promises = [];
    for (const dm of collection.members) {
      // console.log(dm);
      promises.push(new Promise((resolve, reject) => {
        $.getJSON(dm.id)
        .done(resolve)
        .fail(reject);
      }));
    }
    const classifiedCanvases = new Set();
    const classifiedManifests = [];
    Promise.all(promises).then(values => {
      for (const manifest of values) {
        const classifiedManifest = new Set();
        for (const canvas of manifest.sequences[0].canvases) {
          classifiedCanvases.add(canvas.images[0].on);
          classifiedManifest.add(canvas.images[0].on);
        }
        classifiedManifests.push({
          id: manifest['@id'],
          imageSet: classifiedManifest,
        });
      }
      manifestStore.dispatch(setClassifiedCanvases(classifiedCanvases));
      manifestStore.dispatch(setDerivedManifestsComplete(classifiedManifests));
    }, reason => {
      console.log('Promise fail', reason);
    });
    $(viewManifest).click(Events.viewManifestClick);
  },
  viewManifestClick() {
    loadManifestPage(DOM.$manifestSelector.val());
  },
};

export const getCreatedManifests = function getCreatedManifests() {
  // get the container in presley
  const collectionId = SortyConfiguration
  .getCollectionUrl(manifestStore.getState().manifest);

  $.getJSON(collectionId)
      .done(Events.requestDerivedManifestsSuccess)
      .fail(Events.requestDerivedManifestsFailure);
};

const updateArchivalUnits = function () {
  const state = manifestStore.getState();
  // Make sure the list exists first
  if (DOM.$classifiedMaterial.find('.classified-manifest').length <
  state.derivedManifests.members.length) {
    // console.log('need to build first');
    buildClassified(state.derivedManifests);
  }
  $('.viewer__classified-title').text(`Showing ${state.derivedManifestsComplete.length} completed
  archival units`);

  for (const dm of state.derivedManifestsComplete) {
    const $cmContainer = $(`.classified-manifest[data-id='${dm.id}']`);
    $cmContainer.find('.classified-manifest__num')
    .text(`${dm.imageSet.size} images in this collection`);
    const $cmImgFront = $cmContainer.find('.classified-manifest__front img');
    const $cmImgSecond = $cmContainer.find('.classified-manifest__second img');
    const $cmImgThird = $cmContainer.find('.classified-manifest__third img');
    const imgSrcFront = $(`.thumb[data-uri='${[...dm.imageSet][0]}']`).attr('data-src');
    $cmImgFront.attr('src', imgSrcFront);
    if (dm.imageSet.size > 1) {
      const imgSrcSecond = $(`.thumb[data-uri='${[...dm.imageSet][1]}']`).attr('data-src');
      $cmImgSecond.attr('src', imgSrcSecond);
    } else {
      $cmImgSecond.hide();
    }
    if (dm.imageSet.size > 2) {
      const imgSrcThird = $(`.thumb[data-uri='${[...dm.imageSet][2]}']`).attr('data-src');
      $cmImgThird.attr('src', imgSrcThird);
    } else {
      $cmImgThird.hide();
    }
  }
};

$(document).ready(Events.domReady);

const subscribeActions = () => {
  const derivedState = manifestStore.getState();
  // console.log('DM - subscribe', lastLocalState, derivedState);
  if (hasPropertyChanged('derivedManifests', derivedState, lastLocalState)) {
    // console.log('DM - changed');
    if (derivedState.derivedManifests.length) {
      const derivedManifestList = derivedState.derivedManifests;
      buildClassified(derivedManifestList);
    }
  }
  if (hasPropertyChanged('classifiedCanvases', derivedState, lastLocalState)) {
    // console.log('classifiedCanvases changed', derivedState, lastLocalState);
    $('html').addClass('dm-loaded');
    const $titleAdd = $('.viewer__title--add');
    const classifiedTotal = manifestStore.getState()
    .classifiedCanvases.size;
    const total = manifestStore.getState().allImages.length;
    $titleAdd.text(`Showing ${total - classifiedTotal} of ${total}
    images to be classified`);
    updateThumbsWithStatus();
  }
  if (hasPropertyChangedNonZero('derivedManifestsComplete', derivedState, lastLocalState)) {
    // console.log('derivedManifestsComplete - updateArchivalUnits');
    updateArchivalUnits();
  }
  lastLocalState = derivedState;
};

export const derivedManifestsInit = (globalStore, globalManifestStore) => {
  // store = globalStore;
  manifestStore = globalManifestStore;
  manifestStore.subscribe(subscribeActions);
};
