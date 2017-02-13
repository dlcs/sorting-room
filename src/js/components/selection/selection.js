const $ = require('jquery');
import { hasPropertyChanged } from '../helpers.js';
import {
  addOrRemoveFromSelection,
  selectImage,
  selectImageRange,
  clearSelection,
  setCurrentImage,
  setCollectionName,
} from './selectionActions.js';
import {
  drawThumbs,
} from '../thumbs/thumbs.js';
import L from 'leaflet';

let store = null;
let lastLocalState = null;
const clearSelectionButton = '.toolbar__clear';
const thumbsContainer = '.thumbs-container';
let map = null;

const createDeepZoomViewer = () => {
  const $thumb = $(`.thumb[data-mfp-src='${$('.mfp-img').attr('src')}']`);
  $('.mfp-container').prepend('<div class="zoom-toolbar__map" id="map"></div>');
  $('#map').click((e) => e.stopPropagation());
  map = L.map('map', {
    center: [0, 0],
    crs: L.CRS.Simple,
    zoom: 10,
  });

  L.tileLayer.iiif($thumb.attr('data-info')).addTo(map);
};

const destroyDeepZoomViewer = () => {
  if (map !== null) {
    map.remove();
    $('#map').remove();
    map = null;
  }
};

const deepZoomToggle = () => {
  if ($('#map').length) {
    destroyDeepZoomViewer();
  } else {
    createDeepZoomViewer();
  }
};

const isIndexInSelection = (idx) => {
  if (store.getState().select.selectedImages.indexOf(parseInt(idx, 10)) > -1) return true;
  return false;
};

const addOrRemoveClick = () => {
  const $thumb = $(`.thumb[data-mfp-src='${$('.mfp-img').attr('src')}']`);
  const idx = $thumb.attr('data-idx');
  store.dispatch(addOrRemoveFromSelection(idx));
  // console.log(store.getState().select);
  if (isIndexInSelection(idx)) {
    $('.zoom-toolbar').addClass('zoom-toolbar--selected');
  } else {
    $('.zoom-toolbar').removeClass('zoom-toolbar--selected');
  }
};

const collectionNameChange = function (e) {
  e.stopPropagation();
  // console.log('collectionNameChange', $(this).val());
  store.dispatch(setCollectionName($(this).val()));
};

const createPopupToolbar = () => {
  const collectionName = store.getState().select.collectionName !== null ?
  store.getState().select.collectionName : '';
  const isSelected = isIndexInSelection(store.getState().select.currentImage.idx) ?
  ' zoom-toolbar--selected' : '';
  const $toolbar = $(`
    <ul class="zoom-toolbar${isSelected}">
      <li class="zoom-toolbar__item zoom-toolbar__collection-name">
        <label for="collection-name">Collection name</label>
        <input id="collection-name" type="text"
        value="${collectionName}" placeholder="Collection name" />
      </li>
      <li class="zoom-toolbar__item">
        <button class="btn zoom-toolbar__zoom-button">
        <i class="material-icons">zoom_in</i> Toggle deep zoom</button>
      </li>
      <li class="zoom-toolbar__item">
        <button class="btn zoom-toolbar__select-button">
          <span class="zoom-toolbar__zoom-button-add">
          <i class="material-icons">add_circle</i> Add to selection</span>
          <span class="zoom-toolbar__zoom-button-remove">
          <i class="material-icons">remove_circle</i> Remove from selection</span>
        </button>
      </li>
    </ul>
  `);

  $('.mfp-with-zoom').addClass('mfp-toolbar').append($toolbar);
  $('.zoom-toolbar__collection-name input').keyup(collectionNameChange);
  // console.log($('#collection-name'));
  $('.zoom-toolbar').click((e) => { e.stopPropagation(); });
  $('.zoom-toolbar__zoom-button').click(deepZoomToggle);
  $('.zoom-toolbar__select-button').click(addOrRemoveClick);
};

const destroyPopupToolbar = () => {
  $('.zoom-toolbar').remove();
  $('.mfp-with-zoom').removeClass('mfp-toolbar');
};

const Config = {
  magnificOptions: {
    callbacks: {
      change() {
        const $thumb = $(`.thumb[data-mfp-src='${$(this.content).find('.mfp-img').attr('src')}']`);
        const currentImageData = {
          idx: $thumb.attr('data-idx'),
          info: $thumb.attr('data-info'),
        };
        // console.log(currentImageData, store.getState().select.currentImage);
        store.dispatch(setCurrentImage(currentImageData));
        destroyDeepZoomViewer();
      },
      close() {
        destroyDeepZoomViewer();
        destroyPopupToolbar();
      },
      open() {
        createPopupToolbar();
      },
    },
    delegate: 'img.thumb:visible',
    type: 'image',
    closeOnContentClick: false,
    closeBtnInside: false,
    closeOnBgClick: false,
    mainClass: 'mfp-with-zoom mfp-img-mobile',
    image: {
      verticalFit: true,
    },
    gallery: {
      enabled: true,
    },
    zoom: {
      enabled: true,
      duration: 300, // don't foget to change the duration also in CSS
      opener(element) {
        return element;
      },
    },
  },
};

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
  storeSubscribe() {
    // console.log('SEL - subscribe', store.getState(), lastLocalState);
    const state = store.getState().select;
    if (hasPropertyChanged('selectedImages', state, lastLocalState)) {
      // console.log('SEL - changed');
      const $thumbActive = $('.thumb--active');
      const $toolbarButtons = $('.toolbar__clear, .toolbar__make');
      const $infoBar = $('.info-bar');
      const selectedImages = state.selectedImages;

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
    if (hasPropertyChanged('allImages', state, lastLocalState)) {
      drawThumbs();
    }
    if (hasPropertyChanged('currentImage', state, lastLocalState)) {
      if (isIndexInSelection(state.currentImage.idx)) {
        $('.zoom-toolbar').addClass('zoom-toolbar--selected');
      } else {
        $('.zoom-toolbar').removeClass('zoom-toolbar--selected');
      }
      // console.log('current image changed', state.currentImage);
    }
    if (hasPropertyChanged('collectionName', state, lastLocalState)) {
      console.log(state.collectionName);
    }
    /* console.log('SEL - subscribe, before lastLocalState assignment',
    staticState, lastLocalState);*/
    lastLocalState = state;
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
  thumbZoomClick() {
    const $thisContainer = $(this).closest('.tc');
    // const $thisThumb = $thisContainer.find('.thumb');
    const posInThumbs = $('.tc:visible').index($thisContainer);
    // console.log(posInThumbs);
    $(thumbsContainer).magnificPopup('open', posInThumbs);
  },
};

export const attachMagnific = () => {
  $(thumbsContainer).removeData('magnificPopup');
  $(thumbsContainer).magnificPopup(Config.magnificOptions);
};

export const attachSelectionBehaviour = () => {
  const $thumb = $('img.thumb');
  $thumb.click(Events.thumbClick);
  $('.thumb__zoom').click(Events.thumbZoomClick);
  attachMagnific();
  $thumb.unveil(300);
};

export const selectionInit = (globalStore) => {
  store = globalStore;
  $(document).ready(Events.domReady);
  store.subscribe(Events.storeSubscribe);
};
