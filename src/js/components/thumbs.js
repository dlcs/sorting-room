const $ = require('jquery');
import { SortyConfiguration } from '../config/config.js';
import {
  hasPropertyChanged,
} from '../helpers/helpers.js';
import { attachSelectionBehaviour } from './selection.js';
import thumbSizeInit, { makeThumbSizeSelector } from './thumb-size-selector.js';
import {
  setAllImages,
  setThumbSizes,
} from '../actions/loaded-manifest.js';

let store = null;
let manifestStore = null;

// Keep track of previous state for state diffing
let lastState = null;

const isActive = function () {
  return store.getState().selectedCollection.selectedImages.indexOf(this.index) > -1;
};

const isClassified = function () {
  // console.log(this.canvasId, store.getState().derivedManifestsReducer.classifiedCanvases);
  return manifestStore.getState().classifiedCanvases.has(this.canvasId);
};

export const updateThumbsWithStatus = function () {
  // console.log('updateThumbsWithStatus');
  const classifiedThumbs = manifestStore.getState().classifiedCanvases;
  const $thumbs = $('.thumb');
  for (const thumbUri of classifiedThumbs.values()) {
    // console.log(thumbUri);
    $thumbs.filter(`.thumb[data-uri="${thumbUri}"]`).parent().addClass('tc--classified');
  }
};

const getThumbsFromCanvas = (canvas, thumbSizes) => {
  const thumbs = {};
  for (const thumbSize of thumbSizes) {
    const min = thumbSize < 100 ? 0 : Math.round(thumbSize * 0.8);
    const max = thumbSize < 100 ? 200 : thumbSize * 2;
    const thumb = canvas.getThumbnail(thumbSize, min, max);
    thumbs[thumbSize] = thumb;
  }
  return thumbs;
};

export const storeThumbs = (canvases) => {
  const allImages = [];
  const thumbSizes = manifestStore.getState().thumbSizes;
  let i = 0;
  // console.log('storeThumbs called with', canvases);
  for (const canvas of canvases) {
    const thumbs = getThumbsFromCanvas(canvas, thumbSizes);
    // console.log(canvas);
    allImages.push({
      canvasId: canvas.id,
      fullSrc: canvas.getThumbnail(1000, 800, 2000),
      index: i,
      info: thumbs[100].info,
      isActive,
      isClassified,
      thumbs,
    });
    i++;
  }
  // console.log('all images', allImages);
  manifestStore.dispatch(setAllImages(allImages));
};

export const drawThumbs = () => {
  const $titleAll = $('.viewer__title--all');
  $titleAll.text(`Showing all ${manifestStore.getState().allImages.length}
  images`);
  const $thumbs = $('.thumbs-container');
  $thumbs.empty();
  const preferredSize = `${store.getState().ui.thumbSize}`;
  // console.log(preferredSize);
  for (const image of manifestStore.getState().allImages) {
    // console.log(image, store.getState().loadedManifest.allImages);
    const preferredThumb = image.thumbs[preferredSize];
    const dimensions = preferredThumb.width && preferredThumb.height ?
    `width="${preferredThumb.width}" height="${preferredThumb.height}"` : '';
    const activeClass = image.isActive() ? ' thumb--active' : '';
    const classifiedClass = image.isClassified() ? ' tc--classified' : '';
    const decorations = SortyConfiguration.getCanvasDecorations(image);
    const thumbnail = `
    <div class="tc${classifiedClass}">
      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB\
      CAQAAAC1HAwCAAAAC0lEQVR42mO8+R8AArcB2pIvCSwAAAAASUVORK5CYII=" class="thumb${activeClass}"
      data-uri="${image.canvasId}"
      data-src="${preferredThumb.url}"
      data-mfp-src="${image.fullSrc.url}"
      data-idx="${image.index}"
      data-info="${image.info}"
      ${dimensions} />
      <button class="thumb__zoom"><i class="material-icons">zoom_in</i></button>
      ${decorations.canvasInfo}
    </div>
    `;
    // console.log(thumbnail);
    $thumbs.append(thumbnail);
  }
  attachSelectionBehaviour();
};

export const storeThumbSizes = (canvases) => {
  const choices = [100, 200, 400];
  const foundSizes = [];
  for (let i = 0; i < Math.min(canvases.length, 10); i++) {
    const canvas = canvases[i];
    if (canvas.thumbnail && canvas.thumbnail.service && canvas.thumbnail.service.sizes) {
      const sizes = canvas.thumbnail.service.sizes;
      let j;
      for (j = 0; j < sizes.length; j++) {
        const testSize = Math.max(sizes[j].width, sizes[j].height);
        foundSizes.push(testSize);
        if (choices.indexOf(testSize) === -1 && testSize <= 600) {
          choices.push(testSize);
        }
      }
    }
  }
  choices.sort((a, b) => a - b);
  manifestStore.dispatch(setThumbSizes(choices));
};

const Events = {
  storeSubscribe() {
    // console.log('scripts.js', store.getState());
    const state = store.getState().ui;

    if (hasPropertyChanged('thumbSize', state, lastState)) {
      drawThumbs();
    }

    lastState = state;
  },
};

export const thumbsUpdate = () => {
  const canvases = manifestStore.getState().canvases;
  storeThumbSizes(canvases);
  storeThumbs(canvases);
  makeThumbSizeSelector();
};

export const thumbsInit = (globalStore, globalManifestStore) => {
  store = globalStore;
  manifestStore = globalManifestStore;
  store.subscribe(Events.storeSubscribe);
  thumbSizeInit(store, manifestStore);
};
