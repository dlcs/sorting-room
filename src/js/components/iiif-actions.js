const $ = require('jquery');

export const IIIFActions = {};

IIIFActions.postManifest = (manifest, url, success, error) => {
  const newManifestInstance = Object.assign({}, manifest);
  newManifestInstance.sequences = null;
  newManifestInstance.service = null;
  $.ajax({
    url,
    type: 'POST',
    contentType: 'application/json; charset=utf-8',
    data: JSON.stringify(newManifestInstance),
    dataType: 'json',
    error,
    success,
  });
};

IIIFActions.putManifest = (manifest, success, error) => {
  $.ajax({
    url: manifest['@id'],
    type: 'PUT',
    contentType: 'application/json; charset=utf-8',
    data: JSON.stringify(manifest),
    dataType: 'json',
    error,
    success,
  });
};

IIIFActions.deleteManifest = (uri, success, error) => {
  $.ajax({
    url: uri,
    type: 'DELETE',
    error,
    success,
  });
};

IIIFActions.loadManifest = (url, success, error) => {
  $.ajax({
    dataType: 'json',
    url,
    cache: true,
    error,
    success,
  });
};
