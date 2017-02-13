import { combineReducers } from 'redux';
import { select } from './selection/selectionReducer.js';
import { derivedManifestsReducer } from './derivedManifests/derivedManifestsReducer.js';
import { input } from './input/inputReducer.js';

export default combineReducers({
  select,
  derivedManifestsReducer,
  input,
});
