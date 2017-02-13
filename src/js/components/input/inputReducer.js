const initialState = {
  manifest: null,
  canvases: null,
  thumbSize: 150,
  thumbSizes: [],
  collection: null,
  listVisible: false,
  loading: false,
};

export const input = (state = initialState, action) => {
  switch (action.type) {
    case 'SET_MANIFEST': {
      // console.log('SET MANIFEST', action.manifest);
      if (typeof action.manifest !== 'undefined') {
        return Object.assign({}, state, {
          manifest: action.manifest,
        });
      }
      return state;
    }
    case 'SET_CANVASES': {
      return Object.assign({}, state, {
        canvases: action.canvases,
      });
    }
    case 'SET_THUMB_SIZE': {
      return Object.assign({}, state, {
        thumbSize: action.thumbSize,
      });
    }
    case 'SET_THUMB_SIZES': {
      // console.log('SET_THUMB_SIZES', action.thumbSizes);
      return Object.assign({}, state, {
        thumbSizes: action.thumbSizes,
      });
    }
    case 'SET_COLLECTION': {
      return Object.assign({}, state, {
        collection: action.collection,
      });
    }
    case 'TOGGLE_LIST': {
      // console.log('toggle list called');
      return Object.assign({}, state, {
        listVisible: !state.listVisible,
      });
    }
    case 'SET_LOADING': {
      return Object.assign({}, state, {
        loading: action.loading,
      });
    }
    default: return state;
  }
};
