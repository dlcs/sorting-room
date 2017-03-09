import { SortyConfiguration } from '../config/config.js';
const $ = require('jquery');

export const OmekaActions = {};

// Used by the omeka service block
export const omekaServiceProfile = 'omekaProfile';

OmekaActions.pushToOmeka = (url) => {
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

  return $.ajax({
    url: SortyConfiguration.omekaImportEndpoint,
    type: 'POST',
    crossDomain: true,
    data: uriEncodedData,
  });
};

OmekaActions.addOmekaService = (manifestUrl) => {
  console.log('addOmekaService called', manifestUrl);

  // Placeholder service values - to replace
  const omekaServiceContext = 'omekaContext';
  const omekaServiceId = 'omekaId';
  const serviceUrl = `${manifestUrl}/iiif/services/`;
  const envelope = `
  {
   "@id": "${manifestUrl}",
   "@type": "sc:Manifest",
   "service": {
     "@context": "${omekaServiceContext}",
     "@id": "${omekaServiceId}",
     "profile": "${omekaServiceProfile}"
   }
  }`;
  return $.ajax({
    url: serviceUrl,
    type: 'POST',
    crossDomain: true,
    contentType: 'application/json; charset=utf-8',
    dataType: 'json',
    data: envelope,
  });
};
