const $ = require('jquery');
// Sorty config
import {
  SortyConfiguration,
} from '../config/config.js';

// IIIF helpers
import {
  IIIF,
} from '../helpers/iiif.js';

import {
  clearSelection,
  setCollectionName,
} from '../actions/selected-collection.js';

import {
  getCreatedManifests,
} from '../components/derived-manifests.js';

import {
  switchView,
} from '../components/workspace.js';

import { resetDerivedManifests } from '../actions/loaded-manifest.js';

let store = null;
let manifestStore = null;

const DOM = {
  $makeManifestButton: null,
  $manifestModalInput: null,
  $modalCancel: null,
  $modalMakeManifest: null,
  $html: null,
  init() {
    DOM.$makeManifestButton = $('.classify-tools__make');
    DOM.$manifestModalInput = $('.manifest-modal__input');
    DOM.$modalCancel = $('.manifest-modal__dismiss');
    DOM.$modalMakeManifest = $('.manifest-modal__make');
    DOM.$viewer = $('.viewer');
    DOM.$savedFeedback = $('.saved__feedback');
    DOM.$savedCollection = $('.saved__collection');
    DOM.$savedProgress = $('.saved__progress-bar');
    DOM.$html = $('html');
  },
};

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
  makeManifestModalOptions: {
    callbacks: {
      beforeOpen() {
        DOM.$html.addClass('mfp-modal');
        const state = store.getState();
        const manifestState = manifestStore.getState();
        const manifest = manifestState.manifest;
        const selectedImages = state.selectedCollection.selectedImages;
        const s = Math.min.apply(Math, selectedImages);
        const e = Math.max.apply(Math, selectedImages);
        const label = store.getState().selectedCollection.collectionName !== null
        && store.getState().selectedCollection.collectionName !== '' ?
        store.getState().selectedCollection.collectionName :
        SortyConfiguration.getManifestLabel(manifest, s, e).trim();
        DOM.$manifestModalInput.val(label);
      },
      beforeClose() {
        DOM.$html.removeClass('mfp-modal');
      },
    },
    items: {
      src: '#manifestmodal',
      type: 'inline',
    },
    modal: true,
  },
};

const setSavingState = (saving) => {
  if (saving) {
    $('html').addClass('saving-manifest');
    $('.manifest-modal__input').attr('readonly');
  } else {
    $('html').removeClass('saving-manifest');
  }
};

const Events = {
  domReady() {
    DOM.init();
    DOM.$modalCancel.click(Events.modalCancel);
    DOM.$modalMakeManifest.click(Events.modalMakeManifest);
    DOM.$makeManifestButton.magnificPopup(Config.makeManifestModalOptions);
  },
  modalCancel() {
    $.magnificPopup.close();
  },
  modalMakeManifest() {
    const state = store.getState();
    const manifestState = manifestStore.getState();
    const selectedImages = state.selectedCollection.selectedImages;
    const manifest = manifestState.manifest;
    const canvases = manifestState.canvases;
    const s = Math.min.apply(Math, selectedImages);
    const e = Math.max.apply(Math, selectedImages);

    setSavingState(true);

    const newManifest = $.extend(true, {}, Config.manifestTemplate);
    IIIF.wrap(newManifest);

    store.dispatch(setCollectionName(DOM.$manifestModalInput.val()));

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

    // PUTs the manifest
    Events.putManifest(newManifest);
  },
  postComplete() {
    // Remove loader
    setSavingState(false);

    // Grab active thumbs
    const $activeThumbs = $('.thumb--active');
    const collectionName = store.getState().selectedCollection.collectionName;

    // Update preview title
    const savedFeedbackHtml = `
    <p class="saved__feedback">
      <i class="material-icons">done</i> Your new set "${collectionName}" is saved.
      <span><a class="saved__make-set" href="">Start another set</a>, or
      <a class="saved__view-sets" href="">view all the sets</a> ?</span>
    </p>`;
    DOM.$savedFeedback.html(savedFeedbackHtml);
    DOM.$savedFeedback.find('.saved__make-set').click(Events.savedMakeSetClick);
    DOM.$savedFeedback.find('.saved__view-sets').click(Events.savedViewSetsClick);

    // Clone thumbs for preview
    const $activeThumbsClone = $activeThumbs.parent().clone();
    $activeThumbsClone.find('.thumb--active').removeClass('thumb--active');

    // Display them as a preview
    DOM.$savedCollection.empty().append($activeThumbsClone);
    switchView('saved');

    // Close the modal
    $.magnificPopup.close();

    // Update the progress bar's initial value
    const manifestState = manifestStore.getState();
    const classifiedTotal = manifestState.classifiedCanvases.size;
    const total = manifestState.allImages.length;
    const progressVal = total > 0 ? Math.round((classifiedTotal / total) * 100) : 0;
    DOM.$savedProgress.val(progressVal);

    // Give them the --classified class
    $activeThumbs.parent().addClass('tc--classified');
    $activeThumbs.removeClass('thumb--active');

    // Clear selection
    store.dispatch(clearSelection());
    store.dispatch(setCollectionName(''));

    // Push into derived manifests / derived manifests complete
    manifestStore.dispatch(resetDerivedManifests());
    getCreatedManifests();
  },
  postManifest(newManifest) {
    const newManifestInstance = Object.assign({}, newManifest);
    newManifestInstance.sequences = null;
    newManifestInstance.service = null;
    $.ajax({
      url: SortyConfiguration.getCollectionUrl(manifestStore.getState().manifest),
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(newManifestInstance),
      dataType: 'json',
    })
    .done(Events.postComplete)
    .fail((xhr, textStatus, error) => {
      alert(error);
    });
  },
  putManifest(newManifest) {
    $.ajax({
      url: newManifest.id,
      type: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify(newManifest),
      dataType: 'json',
    })
    .done(Events.postManifest)
    .fail((xhr, textStatus, error) => {
      alert(error);
    });
  },
  savedMakeSetClick(e) {
    e.preventDefault();
    switchView('add');
  },
  savedViewSetsClick(e) {
    e.preventDefault();
    switchView('done');
  },
};

export const makeManifestInit = (globalStore, globalManifestStore) => {
  store = globalStore;
  manifestStore = globalManifestStore;
};

$(document).ready(Events.domReady);
