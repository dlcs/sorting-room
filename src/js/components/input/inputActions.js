export const SET_MANIFEST = 'SET_MANIFEST';
export const SET_CANVASES = 'SET_CANVASES';
export const SET_THUMB_SIZE = 'SET_THUMB_SIZE';
export const SET_THUMB_SIZES = 'SET_THUMB_SIZES';
export const SET_COLLECTION = 'SET_COLLECTION';
export const TOGGLE_LIST = 'TOGGLE_LIST';
export const SET_LOADING = 'SET_LOADING';

export const setManifest = (manifest) => ({
  type: SET_MANIFEST,
  manifest,
});

export const setCanvases = (canvases) => ({
  type: SET_CANVASES,
  canvases,
});

export const setThumbSize = (thumbSize) => ({
  type: SET_THUMB_SIZE,
  thumbSize,
});

export const setThumbSizes = (thumbSizes) => ({
  type: SET_THUMB_SIZES,
  thumbSizes,
});

export const setCollection = (collection) => ({
  type: SET_COLLECTION,
  collection,
});

export const toggleList = () => ({
  type: TOGGLE_LIST,
});

export const setLoading = (loading) => ({
  type: SET_LOADING,
  loading,
});
