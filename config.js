/* this file is where you customise sorty to do what you need */



var SortyConfiguration = function(){

    /* logic for naming IIIF resources in your CRUD server */
    /***************************************************** */
    var presentationServer = "http://sorty.dlcs-ida.org/presley/ida/";

    function getManifestLabel(loadedResource, start, end) {
        return getPath(loadedResource).replace(/\//g, " ") + "canvases " + start + "-" + end;
    }

    function getCollectionUrl(loadedResource) {
        return presentationServer + "collection/" + getUriComponent(loadedResource);
    }

    function getIdentifier(loadedResource, start, end) {
        return getUriComponent(loadedResource) + "cvs-" + start + "-" + end;
    }

    // These are MVP and don't offer a lot of flexibility.

    function getManifestUrl(loadedResource, start, end) {
        return presentationServer + getIdentifier(loadedResource, start, end) + "/manifest";
    }

    function getSequenceUrl(loadedResource, start, end){
        return presentationServer + getIdentifier(loadedResource, start, end) + "/sequence/s0";
    }

    function getCanvasUrl(loadedResource, start, end, canvasIndex){
        return presentationServer + getIdentifier(loadedResource, start, end) + "/canvas/c" + canvasIndex;
    }

    function getPath(url) {
        var reg = /.+?\:\/\/.+?(\/.+?)(?:#|\?|$)/;
        return reg.exec(url)[1];
    }

    function getUriComponent(str) {
        // for demo purposes! Not safe for general URL patterns
        return getPath(str).replace(/\//g, "_");
    }


    /* application-specific extra stuff to show per canvas */
    /***************************************************** */
    function getCanvasDecorations(canvas){
        var divClass = "ocrUnknown";
        var additionalHtml = "";
        var confBar = "<div class=\"confBarPlaceholder\"></div>";
        var imgLabel = "";
        if (canvas.service && canvas.service.context === "https://dlcs-ida.org/ocr-info") {
            var isType = canvas.service["Typescript"];
            divClass = isType ? "ocrType" : "ocrHand";
            if (isType) {
                var conf = canvas.service["Average_confidence"] || 0;
                var accu = canvas.service["Spelling_accuracy"] || 0;
                confBar = "<div class=\"confBar\"><div class=\"conf\" style=\"width:" + conf + "%;\"></div></div>";
                confBar += "<div class=\"confBar\"><div class=\"accu\" style=\"width:" + accu + "%;\"></div></div>";
            } 
            var textLength = canvas.service["Full_text_length"];
            var entities = canvas.service["Total_entities_found"];
            additionalHtml += "<div class=\"imgInfo\">";
            if(textLength>3) additionalHtml += "T: " + textLength + "&nbsp;&nbsp;";
            if (entities > 1) additionalHtml += "E: " + entities;
            additionalHtml += "&nbsp;</div>";
            var stats = canvas.service["Entity_stats"];
            if (stats) {
                for (var prop in stats) {
                    if (stats.hasOwnProperty(prop)) {
                        imgLabel += "\r\n" + prop + ": " + stats[prop];
                    }
                }
            }
        }

        return {
            divClass: divClass,
            label: imgLabel,
            canvasInfo: confBar + additionalHtml
        }
    }

    return {
        getManifestLabel: getManifestLabel,
        getCollectionUrl: getCollectionUrl,
        getManifestUrl: getManifestUrl,
        getSequenceUrl: getSequenceUrl,
        getCanvasUrl: getCanvasUrl,
        getCanvasDecorations: getCanvasDecorations,
        sourceCollection: "http://sorty.dlcs-ida.org/rollcollection"
    }
}();