const $ = require('jquery');
import { attachMagnific } from '../selection/selection.js';

const DOM = {
  $tabs: null,
  $workspace: null,

  init() {
    DOM.$tabs = $('.workspace-tabs__link');
    DOM.$workspace = $('.viewer');
  },
};

const Events = {
  domReady() {
    DOM.init();
    Events.init();
  },
  init() {
    DOM.$tabs.click(Events.tabClick);
  },
  tabClick(e) {
    e.preventDefault();
    const $thisTab = $(this);
    DOM.$tabs.removeClass('workspace-tabs__link--active');
    $thisTab.addClass('workspace-tabs__link--active');
    DOM.$workspace.attr('class', `viewer viewer--${$thisTab.attr('data-modifier')}`);
    attachMagnific();
    $(window).trigger('lookup');
  },
};

$(document).ready(Events.domReady);
