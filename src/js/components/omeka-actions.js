import { SortyConfiguration } from '../config/config.js';
const $ = require('jquery');

export const OmekaActions = {};

OmekaActions.pushToOmeka = (url, success, error) => {
  // Auth data (dummy data for now)
  const authObj = {
    clientId: 'test',
    clientSecret: 'test123',
  };

  // Combine auth and url
  const data = Object.assign({}, authObj, { resourceUrl: url });

  // API only takes uri encoded data for now...
  let uriEncodedData = [];
  for (const key of Object.keys(data)) {
    uriEncodedData.push(`${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`);
  }
  uriEncodedData = uriEncodedData.join('&');

  $.ajax({
    url: SortyConfiguration.omekaImportEndpoint,
    type: 'POST',
    crossDomain: true,
    data: uriEncodedData,
    error,
    success,
  });
};
