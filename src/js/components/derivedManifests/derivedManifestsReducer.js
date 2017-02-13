const initialState = {
  // Derived manifests associated from current manifest
  derivedManifests: null,
  // Derived manifests including child elements
  derivedManifestsComplete: new Set(),
  // Not using this currently [remove?]
  selectedDerivedManifest: null,
  // Unique set of all canvases that have been classified
  classifiedCanvases: new Set(),
};

export const derivedManifestsReducer =
function derivedManifestsReducer(state = initialState, action) {
  // console.log('reducer', state, action);
  switch (action.type) {
    case 'SET_DERIVED_MANIFESTS': {
      return Object.assign({}, state, {
        derivedManifests: action.derivedManifests,
      });
    }
    case 'RESET_DERIVED_MANIFESTS': {
      return Object.assign({}, state, {
        derivedManifests: null,
      });
    }
    case 'SELECT_DERIVED_MANIFEST': {
      return Object.assign({}, state, {
        selectedDerivedManifest: action.selectedDerivedManifest,
      });
    }
    case 'DESELECT_DERIVED_MANIFEST': {
      return Object.assign({}, state, {
        selectedDerivedManifest: null,
      });
    }
    case 'SET_DERIVED_MANIFESTS_COMPLETE': {
      // console.log('setting it', state, action.derivedManifestsComplete);
      return Object.assign({}, state, {
        derivedManifestsComplete: action.derivedManifestsComplete,
      });
    }
    case 'SET_CLASSIFIED_CANVASES': {
      return Object.assign({}, state, {
        classifiedCanvases: action.classifiedCanvases,
      });
    }
    default: return state;
  }
};
