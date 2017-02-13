/* Action Types */
export const SET_DERIVED_MANIFESTS = 'SET_DERIVED_MANIFESTS';
export const SET_DERIVED_MANIFESTS_COMPLETE = 'SET_DERIVED_MANIFESTS_COMPLETE';
export const RESET_DERIVED_MANIFESTS = 'RESET_DERIVED_MANIFESTS';
export const SELECT_DERIVED_MANIFEST = 'SELECT_DERIVED_MANIFEST';
export const DESELECT_DERIVED_MANIFEST = 'DESELECT_DERIVED_MANIFEST';
export const SET_CLASSIFIED_CANVASES = 'SET_CLASSIFIED_CANVASES';

/* Action Creators */
export const setDerivedManifests = (derivedManifests) => ({
  type: SET_DERIVED_MANIFESTS,
  derivedManifests,
});

export const setDerivedManifestsComplete = (derivedManifestsComplete) => ({
  type: SET_DERIVED_MANIFESTS_COMPLETE,
  derivedManifestsComplete,
});

export const resetDerivedManifests = () => ({
  type: RESET_DERIVED_MANIFESTS,
});

export const selectDerivedManifest = (selectedDerivedManifest) => ({
  type: SELECT_DERIVED_MANIFEST,
  selectedDerivedManifest,
});

export const deselectDerivedManifest = () => ({
  type: DESELECT_DERIVED_MANIFEST,
});

export const setClassifiedCanvases = (classifiedCanvases) => ({
  type: SET_CLASSIFIED_CANVASES,
  classifiedCanvases,
});
