import {
  hasPropertyChanged,
  hasPropertyChangedNonZero,
} from '../helpers/helpers.js';
import { SortyConfiguration } from '../config/config.js';
// import { IIIF } from '../helpers/iiif.js';
import {
  setCollectionManifest,
} from '../actions/selected-collection.js';
import {
//  selectDerivedManifest,
  setDerivedManifests,
  setDerivedManifestsComplete,
  setClassifiedCanvases,
  resetDerivedManifests } from '../actions/loaded-manifest.js';
// import { replaceSelection } from '../selection/selectionActions.js';
import { updateThumbsWithStatus } from './thumbs.js';
import { IIIFActions } from './iiif-actions.js';
import { getTerm } from '../config/terms.js';

const $ = require('jquery');

const manifestSelector = '.manifest-select__dropdown';
const viewManifest = '.manifest-select__view-uv';

let store = null;
let manifestStore = null;
let lastLocalState = null;
let lastTitleText = null;

const DOM = {
  $manifestSelector: null,
  $classifiedMaterial: null,
  $classifiedTitle: null,

  init() {
    DOM.$manifestSelector = $(manifestSelector);
    DOM.$classifiedMaterial = $('.classified-material');
    DOM.$classifiedTitle = $('.viewer__classified-title');
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
        const label = manifest.label || manifest['@id'];
        DOM.$classifiedMaterial.append(`
          <div class="classified-manifest" data-id="${manifest['@id']}">
            <div class="classified-manifest__front classified-manifest__front--placeholder">
              <img src="${placeholder}" \
              height="${preferredHeight}" width="${preferredWidth}" />
            </div>
            <div class="classified-manifest__second classified-manifest__second--placeholder">
              <img src="${placeholder}" \
              height="${preferredHeight}" width="${preferredWidth}" />
            </div>
            <div class="classified-manifest__third classified-manifest__third--placeholder">
              <img src="${placeholder}" \
              height="${preferredHeight}" width="${preferredWidth}" />
            </div>
            <h2 class="classified-manifest__title">
              <span class="classified-manifest__title-text">${label}</span>
              <button class="classified-manifest__title-edit" title="Edit label">
                <i class="material-icons">mode_edit</i>
              </button>
              <button class="classified-manifest__title-save" title="Save label">
                <i class="material-icons">save</i>
              </button>
            </h2>
            <p class="classified-manifest__num">{x} images</p>
            <div class="classified-manifest__actions">
              <a class="btn" href="http://universalviewer.io/?manifest=${manifest['@id']}" target="_blank"><i class="material-icons">open_in_new</i> View in UV</a>
            </div>
          </div>`);
      }
    }
  }
};

export const loadManifestPage = function loadManifestPage(manifestUrl) {
  window.open(`http://universalviewer.io/?manifest=${manifestUrl}`, '_blank');
};

const updateArchivalUnits = function () {
  const state = manifestStore.getState();
  // Make sure the list exists first
  if (DOM.$classifiedMaterial.find('.classified-manifest').length <
  state.derivedManifests.members.length) {
    // console.log('need to build first');
    buildClassified(state.derivedManifests);
  }
  DOM.$classifiedTitle.text(`${state.derivedManifestsComplete.length}
    ${getTerm('derivedManifest', state.derivedManifestsComplete.length)}`);

  for (const dm of state.derivedManifestsComplete) {
    const id = dm['@id'];
    const canvases = dm.sequences[0].canvases;
    const $cmContainer = $(`.classified-manifest[data-id='${id}']`);
    $cmContainer.find('.classified-manifest__num')
    .text(`${canvases.length} images`);
    const $cmImgFront = $cmContainer.find('.classified-manifest__front img');
    const $cmImgSecond = $cmContainer.find('.classified-manifest__second img');
    const $cmImgThird = $cmContainer.find('.classified-manifest__third img');

    if (canvases.length > 0 && canvases[0].images.length) {
      const imgSrcFront = $(`.thumb[data-uri='${canvases[0].images[0].on}']`).attr('data-src');
      $cmImgFront.attr('src', imgSrcFront).removeClass('classified-manifest__front--placeholder');
    }
    if (canvases.length > 1 && canvases[1].images.length) {
      const imgSrcSecond = $(`.thumb[data-uri='${canvases[1].images[0].on}']`).attr('data-src');
      $cmImgSecond.attr('src', imgSrcSecond).removeClass('classified-manifest__front--placeholder');
    } else {
      $cmImgSecond.hide();
    }
    if (canvases.length > 2 && canvases[2].images.length) {
      const imgSrcThird = $(`.thumb[data-uri='${canvases[2].images[0].on}']`).attr('data-src');
      $cmImgThird.attr('src', imgSrcThird).removeClass('classified-manifest__front--placeholder');
    } else {
      $cmImgThird.hide();
    }
  }
};

const cancelEdits = (resetText = false) => {
  const $contentEditableTitleText = $('.classified-manifest__title-text[contenteditable]');
  const $contentEditableTitle = $('.classified-manifest__title--edit');
  $contentEditableTitleText.removeAttr('contenteditable');
  $contentEditableTitle.removeClass('classified-manifest__title--edit');
  if (resetText) $contentEditableTitleText.html(lastTitleText);
};

const Events = {
  bodyClick(e) {
    if (
      e.target.className !== 'classified-manifest__title-edit' &&
      e.target.className !== 'classified-manifest__title-save' &&
      e.target.className !== 'material-icons'
    ) {
      cancelEdits(true);
      $('body').off('click', Events.bodyClick);
    }
  },
  domReady() {
    DOM.init();
    Events.init();
  },
  editTitleClick() {
    // Cancel any other edit operations first
    cancelEdits(true);

    // Make the title editable
    const $parentTitle = $(this).closest('.classified-manifest__title');
    $parentTitle.addClass('classified-manifest__title--edit');

    const $editableText = $parentTitle.find('.classified-manifest__title-text');

    lastTitleText = $editableText.text();
    $editableText.attr('contenteditable', 'true');
    $editableText.focus();
    $('body').click(Events.bodyClick);
  },
  editTitleKeypress(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      $(this).closest('.classified-manifest').find('.classified-manifest__title-save')
      .click();
    }
  },
  init() {
    DOM.$classifiedMaterial.on('click',
    '.classified-manifest__title-edit, .classified-manifest__title-text',
    Events.editTitleClick);
    DOM.$classifiedMaterial.on('click', '.classified-manifest__title-save', Events.saveTitleClick);
    DOM.$classifiedMaterial.on('keypress',
    '.classified-manifest__title--edit .classified-manifest__title-text',
    Events.editTitleKeypress
    );
    DOM.$classifiedMaterial.on('click', '.classified-manifest', (e) => e.stopPropagation());
  },
  postError(xhr, textStatus, error) {
    alert(error);
  },
  postSuccess() {
    cancelEdits();
    $('.classified-manifest--saving-label').removeClass('classified-manifest--saving-label');
  },
  putError(xhr, textStatus, error) {
    alert(error);
  },
  putSuccess() {
    const manifest = store.getState().selectedCollection.collectionManifest;
    const newManifestInstance = Object.assign({}, manifest);
    newManifestInstance.sequences = null;
    newManifestInstance.service = null;
    IIIFActions.postManifest(
      manifest,
      SortyConfiguration.getCollectionUrl(manifestStore.getState().manifest),
      Events.postSuccess,
      Events.postError
    );
  },
  requestDerivedManifestsFailure() {
    manifestStore.dispatch(resetDerivedManifests());
    // If there's no derived manifest - just show the list
    $('html').addClass('manifest-loaded');
  },
  requestDerivedManifestsSuccess(collection) {
    // IIIF.wrap(collection);
    // console.log('Request derived manifests success', collection);
    manifestStore.dispatch(setDerivedManifests(collection));
    // console.log('RDMS', collection);
    const promises = [];
    for (const dm of collection.members) {
      // console.log('dm', dm);
      promises.push(new Promise((resolve, reject) => {
        $.getJSON(dm['@id'])
        .done(resolve)
        .fail(reject);
      }));
    }
    const classifiedCanvases = new Set();
    const classifiedManifests = [];
    Promise.all(promises).then(values => {
      for (const manifest of values) {
        // const classifiedManifest = new Set();
        for (const canvas of manifest.sequences[0].canvases) {
          if (canvas.images.length) {
            // console.log(canvas.images[0].on);
            classifiedCanvases.add(canvas.images[0].on);
          }
          // classifiedManifest.add(canvas.images[0].on);
        }/*
        classifiedManifests.push({
          id: manifest['@id'],
          imageSet: classifiedManifest,
        });*/
        // console.log(manifest);
        classifiedManifests.push(manifest);
      }
      manifestStore.dispatch(setClassifiedCanvases(classifiedCanvases));
      manifestStore.dispatch(setDerivedManifestsComplete(classifiedManifests));
      // console.log($('html'));
      $('html').addClass('dm-loaded manifest-loaded');
      // console.log($('html'));
      updateThumbsWithStatus();
    }, reason => {
      console.log('Promise fail', reason);
    });
    $(viewManifest).click(Events.viewManifestClick);
  },
  saveTitleClick() {
    const $parentTitle = $(this).closest('.classified-manifest__title');
    const $container = $(this).closest('.classified-manifest');
    const $editableText = $parentTitle.find('.classified-manifest__title-text');
    const manifestId = $container.attr('data-id');
    const titleText = $editableText.text();
    const derivedManifests = manifestStore.getState().derivedManifestsComplete;
    let manifestToUpdate = null;
    for (const dm of derivedManifests) {
      if (dm['@id'] === manifestId) {
        manifestToUpdate = dm;
        break;
      }
    }
    if (manifestToUpdate !== null) {
      // Update label
      manifestToUpdate.label = titleText;
      // Set saving state
      $container.addClass('classified-manifest--saving-label');
      // Store new manifest
      store.dispatch(setCollectionManifest(manifestToUpdate));
      // RE-PUT
      IIIFActions.putManifest(manifestToUpdate, Events.putSuccess, Events.putError);
    } else {
      // Cancel edit
      cancelEdits(true);
    }
    $('body').off('click', Events.bodyClick);
  },
  subscribeActions() {
    const derivedState = manifestStore.getState();
    // console.log('DM - subscribe', lastLocalState, derivedState);
    if (hasPropertyChanged('derivedManifests', derivedState, lastLocalState)) {
      // console.log('DM - changed', derivedState);
      if (derivedState.derivedManifests.length) {
        const derivedManifestList = derivedState.derivedManifests;
        buildClassified(derivedManifestList);
      }
    }
    if (hasPropertyChanged('classifiedCanvases', derivedState, lastLocalState)) {
      // console.log('classifiedCanvases changed', derivedState, lastLocalState);
    }
    if (hasPropertyChangedNonZero('derivedManifestsComplete', derivedState, lastLocalState)) {
      // console.log('derivedManifestsComplete - updateArchivalUnits');
      updateArchivalUnits();
    }
    lastLocalState = derivedState;
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

$(document).ready(Events.domReady);

export const derivedManifestsInit = (globalStore, globalManifestStore) => {
  store = globalStore;
  manifestStore = globalManifestStore;
  manifestStore.subscribe(Events.subscribeActions);
};
