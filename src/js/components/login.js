import { hasPropertyChanged } from '../helpers/helpers.js';
const $ = require('jquery');

let store = null;
let lastState = null;

const DOM = {
  $loginForm: null,
  $userName: null,
  $password: null,
  $submitButton: null,
  init() {
    DOM.$loginForm = $('.c-form');
    DOM.$userName = $('.c-form-field__item[name="username"]');
    DOM.$password = $('.c-form-field__item[name="password"]');
    DOM.$submitButton = $('.c-form-submit[type="submit"]');
  },
};

const Events = {
  domReady() {
    DOM.init();
    Events.init();
    store.subscribe(Events.storeSubscribe);
  },
  init() {
    DOM.$submitButton.click(Events.login);
  },
  login() {
    // TODO: dispatch event
  },
  storeSubscribe() {
    const state = store.getState().auth;
    if (hasPropertyChanged('isAuthenticated', state, lastState)) {
      // TODO: do some state handling...
    }
    lastState = state;
  },
};

export const loginInit = (globalStore) => {
  store = globalStore;
};

$(document).ready(Events.domReady);
