var IIIF = function () {

    function jsonLdTidy(obj, propNames) {
        propNames.forEach(function (pn) {
            Object.defineProperty(obj, pn, {
                get: function () {
                    return this["@" + pn];
                },
                set: function (value) {
                    this["@" + pn] = value;
                }
            });
        });
    }

    function getScale(box, width, height) {
        var scaleW = box / width;
        var scaleH = box / height;
        return Math.min(scaleW, scaleH);
    }

    function fits(size, min, max) {
        if (size.width && size.height) {
            return (size.width >= min || size.height >= min) && (size.width <= max && size.height <= max);
        }
        return null;
    }

    function getCanonicalUri(imageService, width, height) {
        // TODO - this is not correct, it's a placeholder...
        return imageService.id + "/full/" + width + "," + height + "/0/default.jpg";
    }

    function getThumbnailFromServiceSizes(service, preferred, min, max) {
        // this will return a thumbnail between min and max
        var sizes = service.sizes;
        sizes.sort(function (a, b) { return a.width - b.width; });
        var best = null;
        for (var i = sizes.length - 1; i >= 0; i--) {
            // start with the biggest; see if each one matches criteria.
            if (fits(sizes[i], min, max)) {
                best = sizes[i];
            } else {
                if (best) break;
            }
        }
        if (best) {
            var scale = getScale(preferred, best.width, best.height);
            return {
                url: getCanonicalUri(service, best.width, best.height),
                width: Math.round(scale * best.width),
                height: Math.round(scale * best.height),
                actualWidth: best.width,
                actualHeight: best.height
            };
        }
        return null;
    }

    function hasSizes(service) {
        return service && service.sizes && service.sizes.length;
    }

    function getThumbnailFromImageResource(image, preferred, min, max) {
        var thumbnail = null;
        if (typeof image === "string") {
            // A thumbnail has been supplied but we have no idea how big it is
            if (preferred <= 0) {
                thumbnail = { url: image }; // caller didn't care
            }
        } else if (image.service.any(hasSizes)) {

            var service = image.service.where(hasSizes)[0];
            // prefer sizes
            thumbnail = getThumbnailFromServiceSizes(service, preferred, min, max);

            // but if no sizes, make up request

            // check for level 0 with tiles only - ask for a small tile
            //getThumbnailFromTileOnlyLevel0ImageService(..)

        } else {
            var thumbResource = {
                url: image.id,
                width: image.width,
                height: image.height
            };
            if (preferred <= 0 || fits(thumbResource, min, max)) {
                thumbnail = thumbResource;
            }
        }
        return thumbnail;
    }

    function getThumbnail(preferred, min, max) {
        if (!max) max = 3 * (min || 100);
        var thumbnail;
        if (this.hasOwnProperty("thumbnail")) {
            thumbnail = getThumbnailFromImageResource(this.thumbnail, preferred, min, max);
            if (thumbnail) return thumbnail;
        } 
        // no explicit thumbnail. Now we need to take a look at what this actually is
        if (this.type === "dctypes:Image") {
            thumbnail = getThumbnailFromImageResource(this, preferred, min, max);
            if (thumbnail) return thumbnail;
        }
        if (this.type === "sc:Canvas" && this.images && this.images.length && this.images[0].resource) {
            thumbnail = getThumbnailFromImageResource(this.images[0].resource, preferred, min, max);
            if (thumbnail) return thumbnail;
        }
        return null;
    }

    // TODO - better handling of multiple images per canvas
    function getDefaultImageService() {
        // on sc:Canvas
        var imgService = null;
        if (this.images) {
            this.images.forEach(function(img) {
                if (img.resource && img.resource.service) {
                    imgService = img.resource.service.first(function(svc) {
                        if (typeof svc === "object" && svc && svc.profile && svc.profile.indexOf('http://iiif.io/api/image') !== -1) {
                            return true;
                        }
                        return false;
                    });
                    if (imgService) return imgService;
                }
            });
        }
        return imgService;
    }
    
    function firstHelper(predicate) {
        var taa = this.asArray();
        if (predicate) {
            taa = taa.filter(predicate);
        }
        if(taa.length) {
            return taa[0]; 
        } 
        return null;
    }
    
    function getAuthServices(info) {
        var svcInfo = {};
        var services;
        console.log("Looking for auth services");
        if (info.hasOwnProperty('service')) {
            if (info.service.hasOwnProperty('@context')) {
                services = [info.service];
            } else {
                // array of service
                services = info.service;
            }
            var prefix = 'http://iiif.io/api/auth/0/';
            var clickThrough = 'http://iiif.io/api/auth/0/login/clickthrough';
            for (var service, i = 0; (service = services[i]) ; i++) {
                var serviceName = null;

                if (service['profile'] === clickThrough) {
                    serviceName = 'clickthrough';
                    console.log("Found click through service");
                    svcInfo[serviceName] = {
                        id: service['@id'],
                        label: service.label,
                        description: service.description,
                        confirmLabel: "Accept terms and Open" // fake this for now
                    };
                }
                else if (service['profile'].indexOf(prefix) === 0) {
                    serviceName = service['profile'].slice(prefix.length);
                    console.log("Found " + serviceName + " auth service");
                    svcInfo[serviceName] = { id: service['@id'], label: service.label };

                }
                if (service.service && serviceName) {
                    for (var service2, j = 0; (service2 = service.service[j]) ; j++) {
                        var nestedServiceName = service2['profile'].slice(prefix.length);
                        console.log("Found nested " + nestedServiceName + " auth service");
                        svcInfo[serviceName][nestedServiceName] = { id: service2['@id'], label: service2.label };
                    }
                }
            }
        }
        return svcInfo;
    }


    function wrap(rawObj) {
        if (!!rawObj) {
            if (typeof (rawObj) === "object") {
                if (rawObj.constructor !== Array) {
                    jsonLdTidy(rawObj, ["id", "type", "context"]);
                    if (rawObj.hasOwnProperty("@type") && rawObj["@type"].indexOf("sc:") === 0) {
                        rawObj.getThumbnail = getThumbnail; // for all IIIF types
                        if (rawObj["@type"] === "sc:Canvas") {
                            rawObj.getDefaultImageService = getDefaultImageService;
                        }
                    }
                }
                for (var obj in rawObj) {
                    if (rawObj.hasOwnProperty(obj)) {
                        wrap(rawObj[obj], obj);
                    }
                }
            }
            // add helpers for non-@container JSON-LD keys
            rawObj.asArray = function () { return (this.constructor === Array) ? this : [this] };
            rawObj.where = function (predicate) { return this.asArray().filter(predicate) };
            rawObj.first = firstHelper;
            rawObj.any = function(predicate) { return this.first(predicate) };
        }
    } 
    return {
        wrap: function (obj) { wrap(obj) },
        getAuthServices: getAuthServices
    };
}();