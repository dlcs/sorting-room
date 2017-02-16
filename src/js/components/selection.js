const $ = require('jquery');
import { hasPropertyChanged } from '../helpers/helpers.js';
import {
  addOrRemoveFromSelection,
  selectImage,
  selectImageRange,
  clearSelection,
} from '../actions/selected-collection.js';
import {
  attachLightboxBehaviour,
} from './lightbox';

import {
  drawThumbs,
} from './thumbs.js';

let store = null;
let manifestStore = null;

let lastLocalSelectedCollectionState = null;
let lastLocalLoadedManifestState = null;

const clearSelectionButton = '.toolbar__clear';

const Events = {
  contextMenu(e) {
    const $target = $(e.target);
    // console.log(e, $target);
    if (($target.hasClass('thumb') || $target.hasClass('tc')) && e.ctrlKey) {
      const idx = $target.attr('data-idx');
      // console.log(idx);
      store.dispatch(addOrRemoveFromSelection(idx));
      e.preventDefault();
    }
  },
  clearSelectionClick() {
    store.dispatch(clearSelection());
  },
  domReady() {
    $(clearSelectionButton).click(Events.clearSelectionClick);
    $(document).on('contextmenu', Events.contextMenu);
  },
  manifestStoreSubscribe() {
    // console.log(store.getState());
    // console.log('SEL - subscribe', store.getState(), lastLocalState);
    const loadedManifestState = manifestStore.getState();
    // console.log('manifestStoreSubscribe', loadedManifestState);
    if (hasPropertyChanged('allImages', loadedManifestState, lastLocalLoadedManifestState)) {
      drawThumbs();
    }
    /* console.log('SEL - subscribe, before lastLocalState assignment',
    staticState, lastLocalState);*/
    lastLocalLoadedManifestState = loadedManifestState;
  },
  storeSubscribe() {
    const selectedCollectionState = store.getState().selectedCollection;
    if (hasPropertyChanged('selectedImages', selectedCollectionState,
    lastLocalSelectedCollectionState)) {
      // console.log('SEL - changed');
      const $thumbActive = $('.thumb--active');
      const $toolbarButtons = $('.toolbar__clear, .toolbar__make');
      const $infoBar = $('.info-bar');
      const selectedImages = selectedCollectionState.selectedImages;

      $thumbActive.removeClass('thumb--active');

      if (selectedImages.length) {
        $toolbarButtons.removeAttr('disabled');
        $infoBar.addClass('info-bar--active');
        for (const idx of selectedImages) {
          $(`.thumb:eq(${idx})`).addClass('thumb--active');
        }
      } else {
        $toolbarButtons.attr('disabled', 'disabled');
        $infoBar.removeClass('info-bar--active');
      }
    }
    lastLocalSelectedCollectionState = selectedCollectionState;
  },
  thumbClick(e) {
    const idx = $(this).attr('data-idx');
    if (e.shiftKey) {
      store.dispatch(selectImageRange(idx));
    } else {
      store.dispatch(selectImage(idx));
    }
    e.stopPropagation();
  },
};

export const attachSelectionBehaviour = () => {
  const $thumb = $('img.thumb');
  $thumb.click(Events.thumbClick);
  attachLightboxBehaviour();
  $thumb.unveil(300);
};

export const selectionInit = (globalStore, globalManifestStore) => {
  store = globalStore;
  manifestStore = globalManifestStore;
  $(document).ready(Events.domReady);
  store.subscribe(Events.storeSubscribe);
  manifestStore.subscribe(Events.manifestStoreSubscribe);
};
