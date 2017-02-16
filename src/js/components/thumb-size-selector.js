const $ = require('jquery');
import {
  setThumbSize,
} from '../actions/ui.js';
let store = null;
let manifestStore = null;

const Init = (globalStore, globalManifestStore) => {
  store = globalStore;
  manifestStore = globalManifestStore;
  const thumbSize = window.localStorage ? localStorage.getItem('thumbSize') : null;
  if (typeof thumbSize !== 'undefined' && thumbSize !== null) {
    store.dispatch(setThumbSize(thumbSize));
  } else {
    store.dispatch(setThumbSize(100));
  }
};
export default Init;

const DOM = {
  $thumbSizeSelector: null,

  init() {
    DOM.$thumbSizeSelector = $('.toolbar__thumb-size');
  },
};

export const makeThumbSizeSelector = () => {
  DOM.$thumbSizeSelector.empty();
  const choices = manifestStore.getState().thumbSizes;
  let html = '<select id="thumbSize">';
  for (let i = 0; i < choices.length; i++) {
    const box = choices[i];
    const label = box;
    html += `<option value="${box}">${label}pixels</option>`;
  }
  html += '</select>';
  DOM.$thumbSizeSelector.append(html);
  let thumbSize = localStorage.getItem('thumbSize');
  console.log(thumbSize);
  if (typeof thumbSize === 'undefined' || thumbSize === null) {
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

const Events = {
  domReady() {
    DOM.init();
  },
};

$(document).ready(Events.domReady);
