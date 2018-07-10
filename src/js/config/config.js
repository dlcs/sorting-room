/* this file is where you customise sorty to do what you need */
export const SortyConfiguration = {};
/* logic for naming IIIF resources in your CRUD server */

// const presentationServer = 'http://sorty.dlcs-ida.org/presley/ida/';
// const presentationServer = 'https://presley.dlcs-ida.org/iiif/idatest01/';
const presentationServerNew = window.PRESENTATION_SERVER_ROOT || 'https://presley.glam-dev.org/iiif';
const presentationServer = window.PRESENTATION_SERVER_CUSTOMER || 'https://presley.glam-dev.org/iiif/customer';
// const presentationServer = 'http://localhost:8000/iiif/idatest01/';

// Omeka configuration options for derived manifests
SortyConfiguration.enableOmekaImport = window.ENABLE_OMEKA_IMPORT !== undefined ? window.ENABLE_OMEKA_IMPORT === 'true' : true;
SortyConfiguration.omekaImportEndpoint = window.OMEKA_IMPORT || 'https://omeka.dlcs-ida.org/api/iiif-import';

// Delete configuration options for derived manifests
SortyConfiguration.enableDelete = window.ENABLE_DELETE !== undefined ? window.ENABLE_DELETE === 'true' : true;

SortyConfiguration.sourceCollection = window.SOURCE_COLLECTION || 'https://manifests.dlcs-ida.org/rollcollection';
SortyConfiguration.mintCanvasIds = window.MINT_CANVAS_IDS !== undefined ? window.MINT_CANVAS_IDS === 'true' :  true;

function getPath(url) {
  const reg = /.+?:\/\/.+?(\/.+?)(?:#|\?|$)/;
  return reg.exec(url)[1];
}

function getUriComponent(str) {
  // for demo purposes! Not safe for general URL patterns
  return getPath(str).replace(/\//g, '_');
}

function getIdentifier(loadedResource, start, end) {
  return `${getUriComponent(loadedResource)}cvs-${start}-${end}`;
}

SortyConfiguration.getManifestLabel = function getManifestLabel(loadedResource, start, end) {
  return `${getPath(loadedResource).replace(/\//g, ' ')} canvases ${start}-${end}`;
};

SortyConfiguration.getCollectionUrl = function getCollectionUrl(loadedResource) {
  return `${presentationServer}/collection?collection=${getUriComponent(loadedResource)}`;
};

SortyConfiguration.getCollectionUri = function getCollectionUri(loadedResource) {
  return `${presentationServer}/collection/${getUriComponent(loadedResource)}`;
};

SortyConfiguration.getCollectionAddUrl = function getCollectionAddUrl() {
  return `${presentationServer}/collection/add`;
};

SortyConfiguration.getManifestDeleteUrl = function getManifestDeleteUrl() {
  return `${presentationServer}/manifest/delete`;
};


// These are MVP and don't offer a lot of flexibility.
SortyConfiguration.getManifestUrl = function getManifestUrl(loadedResource, start, end) {
  return `${presentationServer}/${getIdentifier(loadedResource, start, end)}/manifest`;
};

SortyConfiguration.getManifestUrlAdd = function getManifestUrlAdd() {
  return `${presentationServer}/manifest/add`;
};

SortyConfiguration.getSequenceUrl = function getSequenceUrl(loadedResource, start, end) {
  return `${presentationServer}/${getIdentifier(loadedResource, start, end)}/sequence/s0`;
};

SortyConfiguration.getCanvasUrl = function getCanvasUrl(loadedResource, start, end, canvasIndex) {
  return `${presentationServer}/${getIdentifier(loadedResource, start, end)}/canvas/c\
${canvasIndex}`;
};

SortyConfiguration.getLoginUrl = function getLoginUrl() {
  return `${presentationServerNew}/login`;
};

function goTo(url) {
  window.location.href = url;
}

SortyConfiguration.navigate = {
  home: () => {
    setTimeout(goTo, 1, '/index.html');
  },
  login: () => {
    console.log('changing route');
    setTimeout(goTo, 1, '/login.html');
  },
};

/* application-specific extra stuff to show per canvas */
SortyConfiguration.getCanvasDecorations = function getCanvasDecorations(canvas) {
  let divClass = 'ocrUnknown';
  let additionalHtml = '';
  let confBar = '<div class="confBarPlaceholder"></div>';
  let imgLabel = '';
  if (canvas.service && canvas.service.context === 'https://dlcs-ida.org/ocr-info') {
    const isType = canvas.service.Typescript;
    divClass = isType ? 'ocrType' : 'ocrHand';
    if (isType) {
      const conf = canvas.service.Average_confidence || 0;
      const accu = canvas.service.Spelling_accuracy || 0;
      confBar = `<div class="confBar"><div class="conf" style="width:${conf}%;"></div></div>
                 <div class="confBar"><div class="accu" style="width: ${accu}%;"></div></div>`;
    }
    const textLength = canvas.service.Full_text_length;
    const entities = canvas.service.Total_entities_found;
    additionalHtml += '<div class="imgInfo">';
    if (textLength > 3) additionalHtml += `T: ${textLength}&nbsp;&nbsp;`;
    if (entities > 1) additionalHtml += `E: ${entities}`;
    additionalHtml += '&nbsp;</div>';
    const stats = canvas.service.Entity_stats;
    if (stats) {
      stats.forEach((currentValue, index) => {
        imgLabel += `\r\n${index}: ${currentValue}`;
      });
    }
  }

  return {
    divClass,
    label: imgLabel,
    canvasInfo: confBar + additionalHtml,
  };
};
