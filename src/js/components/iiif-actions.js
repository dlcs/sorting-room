const $ = require('jquery');
export const IIIFActions = {};

IIIFActions.postManifest = (manifest, url, success, error) => {
  const newManifestInstance = Object.assign({}, manifest);
  newManifestInstance.sequences = null;
  newManifestInstance.service = null;
  $.ajax({
    url,
    type: 'POST',
    contentType: 'application/json',
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
    contentType: 'application/json',
    data: JSON.stringify(manifest),
    dataType: 'json',
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
