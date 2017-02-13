function jsonLdTidy(obj, propNames) {
  propNames.forEach((pn) => {
    Object.defineProperty(obj, pn, {
      get() {
        return this[`@${pn}`];
      },
      set(value) {
        this[`@${pn}`] = value;
      },
    });
  });
}

function getScale(box, width, height) {
  const scaleW = box / width;
  const scaleH = box / height;
  return Math.min(scaleW, scaleH);
}

function fits(size, min, max) {
  if (size.width && size.height) {
    return (size.width >= min || size.height >= min) && (size.width <= max && size.height <= max);
  }
  return null;
}

function getCanonicalUriInfo(imageService) {
  return `${imageService.id}/info.json`;
}

function getCanonicalUri(imageService, width, height) {
  // TODO - this is not correct, it's a placeholder...
  return `${imageService.id}/full/${width},${height}/0/default.jpg`;
}

function getThumbnailFromServiceSizes(service, preferred, min, max) {
  // this will return a thumbnail between min and max
  const sizes = service.sizes;
  sizes.sort((a, b) => a.width - b.width);
  let best = null;
  for (let i = sizes.length - 1; i >= 0; i--) {
    // start with the biggest; see if each one matches criteria.
    if (fits(sizes[i], min, max)) {
      best = sizes[i];
    } else {
      if (best) break;
    }
  }
  if (best) {
    const scale = getScale(preferred, best.width, best.height);
    return {
      info: getCanonicalUriInfo(service).replace('thumbs', 'iiif-img'),
      url: getCanonicalUri(service, best.width, best.height),
      width: Math.round(scale * best.width),
      height: Math.round(scale * best.height),
      actualWidth: best.width,
      actualHeight: best.height,
    };
  }
  return null;
}

function hasSizes(service) {
  // console.log('hasSizes', service, service && service.sizes && service.sizes.length);
  return service && service.sizes && service.sizes.length;
}

function getThumbnailFromImageResource(image, preferred, min, max) {
  let thumbnail = null;
  // console.log('getThumbnailFromImageResource - image service any', image.service.any(hasSizes));
  if (typeof image === 'string') {
    // A thumbnail has been supplied but we have no idea how big it is
    if (preferred <= 0) {
      thumbnail = { url: image }; // caller didn't care
    }
  } else if (image.service.any(hasSizes)) {
    const service = image.service.where(hasSizes)[0];
    // prefer sizes
    thumbnail = getThumbnailFromServiceSizes(service, preferred, min, max);

    // but if no sizes, make up request
    // check for level 0 with tiles only - ask for a small tile
    // getThumbnailFromTileOnlyLevel0ImageService(..)
  } else {
    const thumbResource = {
      url: image.id,
      width: image.width,
      height: image.height,
    };
    // console.log(thumbResource, fits(thumbResource, min, max));
    if (preferred <= 0 || fits(thumbResource, min, max)) {
      thumbnail = thumbResource;
    }
  }
  // console.log(typeof image === 'string', image.service.any(hasSizes), thumbnail);
  return thumbnail;
}

function getThumbnail(preferred, minimum, maximum) {
  let max = maximum;
  const min = minimum;
  if (!maximum) max = 3 * (min || 100);
  let thumbnail;
  if (this.hasOwnProperty('thumbnail')) {
    thumbnail = getThumbnailFromImageResource(this.thumbnail, preferred, min, max);
    if (thumbnail) return thumbnail;
  }
  // no explicit thumbnail. Now we need to take a look at what this actually is
  if (this.type === 'dctypes:Image') {
    thumbnail = getThumbnailFromImageResource(this, preferred, min, max);
    if (thumbnail) return thumbnail;
  }
  if (this.type === 'sc:Canvas' && this.images && this.images.length && this.images[0].resource) {
    // console.log(this.images[0].resource);
    thumbnail = getThumbnailFromImageResource(this.images[0].resource, preferred, min, max);
    if (thumbnail) return thumbnail;
  }
  return null;
}

// TODO - better handling of multiple images per canvas
function getDefaultImageService() {
  // on sc:Canvas
  let imgService = null;
  if (this.images) {
    this.images.forEach((img) => {
      if (img.resource && img.resource.service) {
        imgService = img.resource.service.first((svc) => {
          if (typeof svc === 'object' && svc && svc.profile && svc.profile.indexOf('http://iiif.io/api/image') !== -1) {
            return true;
          }
          return false;
        });
        if (imgService) return imgService;
      }
      return false;
    });
  }
  return imgService;
}

function findIndexById(id) {
  let idx;
  for (idx = 0; idx < this.length; idx++) {
    if (id === this[idx]['@id']) {
      return idx;
    }
  }
  return -1;
}

export const IIIF = {};


IIIF.wrap = function wrap(rawObj, key) {
  let newObj;
  if (!!rawObj) {
    newObj = rawObj;
    if (typeof (newObj) === 'object') {
      if (newObj.constructor !== Array) {
        jsonLdTidy(newObj, ['id', 'type', 'context']);
        if (newObj.hasOwnProperty('@type') && newObj['@type'].indexOf('sc:') === 0) {
          newObj.getThumbnail = getThumbnail; // for all IIIF types
          if (newObj['@type'] === 'sc:Canvas') {
            newObj.getDefaultImageService = getDefaultImageService; // only for Canvas
          }
        }
      }
      if (key === 'canvases') {
        // We could do this for more than just canvases. But for now..
        newObj.findIndexById = findIndexById;
      }
      for (const prop of Object.keys(newObj)) {
        IIIF.wrap(newObj[prop], prop);
      }
      // add helpers for non-@container JSON-LD keys
      newObj.asArray = function asArray() { return (this.constructor === Array) ? this : [this]; };
      newObj.where = function where(predicate) { return this.asArray().filter(predicate); };
      newObj.first = function first(predicate) {
        let taa = this.asArray();
        // console.log('taa', taa);
        if (predicate) {
          taa = taa.filter(predicate);
        }
        return taa.length ? taa[0] : null;
      };
      newObj.any = function any(predicate) {
        // console.log(this, predicate);
        return this.first(predicate);
      };
      if (typeof (rawObj) === 'object') {
        // prevent our helpers appearing as enumerable props
        Object.defineProperty(rawObj, 'asArray', { enumerable: false });
        Object.defineProperty(rawObj, 'where', { enumerable: false });
        Object.defineProperty(rawObj, 'first', { enumerable: false });
        Object.defineProperty(rawObj, 'any', { enumerable: false });
      }
    }
  }
};
