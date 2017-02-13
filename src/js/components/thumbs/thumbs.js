const $ = require('jquery');
// import { SortyConfiguration } from '../../config/config.js';
import { attachSelectionBehaviour } from '../selection/selection.js';
import { setAllImages } from '../selection/selectionActions.js';
import {
  setThumbSize,
  setThumbSizes,
 } from '../input/inputActions.js';

const thumbSizeSelector = '.toolbar__thumb-size';
let store = null;

export const thumbsInit = (globalStore) => {
  store = globalStore;
};

const isActive = function () {
  return store.getState().select.selectedImages.indexOf(this.index) > -1;
};

const isClassified = function () {
  // console.log(this.canvasId, store.getState().derivedManifestsReducer.classifiedCanvases);
  return store.getState().derivedManifestsReducer.classifiedCanvases.has(this.canvasId);
};

export const updateThumbsWithStatus = function () {
  // console.log('updateThumbsWithStatus');
  const classifiedThumbs = store.getState().derivedManifestsReducer.classifiedCanvases;
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
  // console.log('storeThumbs');
  const allImages = [];
  const thumbSizes = store.getState().input.thumbSizes;
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
  // console.log(allImages);
  store.dispatch(setAllImages(allImages));
};

export const drawThumbs = () => {
  const $titleAll = $('.viewer__title--all');
  $titleAll.text(`Showing all ${store.getState().select.allImages.length}
  images`);
  const $thumbs = $('.thumbs-container');
  $thumbs.empty();
  const preferredSize = `${store.getState().input.thumbSize}`;
  for (const image of store.getState().select.allImages) {
    // console.log(image);
    const preferredThumb = image.thumbs[preferredSize];
    const dimensions = preferredThumb.width && preferredThumb.height ?
    `width="${preferredThumb.width}" height="${preferredThumb.height}"` : '';
    const activeClass = image.isActive() ? ' thumb--active' : '';
    const classifiedClass = image.isClassified() ? ' tc--classified' : '';
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
  store.dispatch(setThumbSizes(choices));
};

export const makeThumbSizeSelector = () => {
  $(thumbSizeSelector).empty();
  const choices = store.getState().input.thumbSizes;
  let html = '<select id="thumbSize">';
  for (let i = 0; i < choices.length; i++) {
    const box = choices[i];
    const label = box;
    /*
    if (foundSizes.indexOf(box) !== -1) {
      label += '*';
    }*/
    html += `<option value="${box}">${label}pixels</option>`;
  }
  html += '</select>';
  $(thumbSizeSelector).append(html);
  let thumbSize = localStorage.getItem('thumbSize');
  if (!thumbSize) {
    thumbSize = choices[0];
    localStorage.setItem('thumbSize', thumbSize);
  }
  if (thumbSize !== choices[0]) {
    $(`#thumbSize option[value="${thumbSize}"]`).prop('selected', true);
  }
  $('#thumbSize').change(function updateThumbSize() {
    const ts = $(this).val();
    localStorage.setItem('thumbSize', ts);
    store.dispatch(setThumbSize(ts));
  });
};

export const thumbsUpdate = () => {
  const canvases = store.getState().input.canvases;
  storeThumbSizes(canvases);
  storeThumbs(canvases);
  makeThumbSizeSelector();
};
