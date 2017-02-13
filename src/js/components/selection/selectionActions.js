/* Action Types */
export const SELECT = 'SELECT';
export const SELECT_IMAGE_RANGE = 'SELECT_IMAGE_RANGE';
// export const START_RANGE = 'START_RANGE';
// export const END_RANGE = 'END_RANGE';
export const ADD_OR_REMOVE_FROM_SELECTION = 'ADD_OR_REMOVE_FROM_SELECTION';
export const CLEAR_SELECTION = 'CLEAR_SELECTION';
export const REPLACE_SELECTION = 'REPLACE_SELECTION';
export const SET_ALL_IMAGES = 'SET_ALL_IMAGES';
export const SET_CURRENT_IMAGE = 'SET_CURRENT_IMAGE';
export const SET_COLLECTION_NAME = 'SET_COLLECTION_NAME';

/* Action Creators */
export const selectImage = (idx) => ({
  type: SELECT,
  currentImage: parseInt(idx, 10),
});

export const selectImageRange = (idx) => ({
  type: SELECT_IMAGE_RANGE,
  selectTo: parseInt(idx, 10),
});

export const addOrRemoveFromSelection = (idx) => ({
  type: ADD_OR_REMOVE_FROM_SELECTION,
  addOrRemoveFromSelection: parseInt(idx, 10),
});

export const replaceSelection = (selection) => ({
  type: REPLACE_SELECTION,
  selection,
});

export const clearSelection = () => ({
  type: CLEAR_SELECTION,
});

export const setAllImages = (allImages) => ({
  type: SET_ALL_IMAGES,
  allImages,
});

export const setCurrentImage = (currentImage) => ({
  type: SET_CURRENT_IMAGE,
  currentImage,
});

export const setCollectionName = (collectionName) => ({
  type: SET_COLLECTION_NAME,
  collectionName,
});

/*
export const startRange = (idx) => ({
  type: START_RANGE,
  startRange: parseInt(idx, 10),
});

export const endRange = (idx) => ({
  type: END_RANGE,
  endRange: parseInt(idx, 10),
});*/
