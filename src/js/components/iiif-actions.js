const $ = require('jquery');
import { SortyConfiguration } from '../config/config';

export const IIIFActions = {};

IIIFActions.postCollection = (manifest, collectionURI, url, success, error) => {
  const newManifestInstance = Object.assign({}, manifest);
  console.log('IIIFActions.postCollection url', url);
  $.ajax({
    url,
    type: 'POST',
    contentType: 'application/json; charset=utf-8',
    data: JSON.stringify({
      '@id': collectionURI,
      collection_data: newManifestInstance,
    }),
    dataType: 'json',
    error,
    success,
  });
};

IIIFActions.addUpdateManifest = (manifest, success, error) => {
  console.log('IIIFActions.addUpdateManifest url', SortyConfiguration.getManifestUrlAdd());
  $.ajax({
    url: SortyConfiguration.getManifestUrlAdd(),
    type: 'POST',
    contentType: 'application/json; charset=utf-8',
    data: JSON.stringify(manifest),
    dataType: 'json',
    error,
    success,
  });
};

IIIFActions.deleteManifest = (uri, success, error) => {
  console.log('IIIFActions.deleteManifest uri', uri);
  // TODO: url is temporary, John and I agreed that the
  // manifest parameter will be in the POST payload (JSON)
  $.ajax({
    url: `${SortyConfiguration.getManifestDeleteUrl()}?manifest=${uri}`,
    type: 'POST',
    error,
    success,
  });
};

IIIFActions.loadManifest = (url, success, error) => {
  console.log('IIIFActions.loadManifest url', url);
  $.ajax({
    dataType: 'json',
    url,
    cache: true,
    error,
    success,
  });
};
