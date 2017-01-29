
var loadedResource;
var canvasList;
var bigImage;
var authDo;
var assumeFullMax = false;
var startCanvas = null;
var endCanvas = null;
var derivedManifests = null;

// var presentationServer = "https://presley.com/"
//var presentationServer = location.protocol + '//' + location.host;
var presentationServer = "http://localhost:47724/";

var pop="";
pop += "<div class=\"modal fade\" id=\"imgModal\" tabindex=\"-1\" role=\"dialog\" aria-labelledby=\"mdlLabel\">";
pop += "    <div class=\"modal-dialog modal-lg\" role=\"document\">";
pop += "        <div class=\"modal-content\">";
pop += "            <div class=\"modal-header\">";
pop += "                <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-label=\"Close\"><span aria-hidden=\"true\">&times;<\/span><\/button>";
pop += "                <h4 class=\"modal-title\" id=\"mdlLabel\"><\/h4>";
pop += "            <\/div>";
pop += "            <div class=\"modal-body\">            ";
pop += "                <img id=\"bigImage\" class=\"img-responsive\" \/>";
pop += "                <div class=\"auth-ops\" id=\"authOps\">";
pop += "                    <h5>Header<\/h5>";
pop += "                    <div class=\"auth-desc\">";
pop += "                    <\/div>";
pop += "                    <button id=\"authDo\" type=\"button\" class=\"btn btn-primary\"><\/button>";
pop += "                <\/div>";
pop += "            <\/div>";
pop += "            <div class=\"modal-footer\">";
pop += "                <div style=\"float:left;\">";
pop += "                    <button id=\"mkStart\" type=\"button\" class=\"btn btn-primary btn-mark\" data-uri=\"\">[start...<\/button>";
pop += "                    <button id=\"mkEnd\" type=\"button\" class=\"btn btn-primary btn-mark\" data-uri=\"\">&nbsp;...end]<\/button>";
pop += "                </div>";
pop += "                <div style=\"float:right;\">";
pop += "                    <button id=\"mdlPrev\" type=\"button\" class=\"btn btn-primary btn-prevnext\" data-uri=\"\">&larr; Prev<\/button>";
pop += "                    <button id=\"mdlNext\" type=\"button\" class=\"btn btn-primary btn-prevnext\" data-uri=\"\">Next &rarr;<\/button>";
pop += "                </div>";
pop += "            <\/div>";
pop += "        <\/div>";
pop += "    <\/div>";
pop += "<\/div>";

document.write(pop);

var rv="";
rv += "<div class=\"row viewer\">";
rv += "    <div class=\"col-md-12 iiif\">";
rv += "        <h3 id=\"title\"><\/h3>";
rv += "        <div id=\"thumbs\">";
rv += "            <img src=\"css\/spin24.gif\" id='manifestWait' \/>";
rv += "        <\/div>";
rv += "    <\/div>";
rv += "<\/div>";
rv += "";
rv += "<footer>";
rv += "    <hr \/>";
rv += "    <p>Thumbnail viewer<\/p>";
rv += "<\/footer>";

var manifestTemplate = {
    "@context": "http://iiif.io/api/presentation/2/context.json",
    "@id": "to be replaced",
    "@type": "sc:Manifest",
    "label": "to be replaced",
    "service": {
        "profile": "https://dlcs.info/profiles/mintrequest"
    },
    "sequences": [
      {
          "@id": "to be replaced",
          "@type": "sc:Sequence",
          "label": "Default sequence",
          "canvases": []
      }
    ]
}

$(function() {
    $("#mainContainer").append(rv);
    $("#manifestWait").hide();
    processQueryString();    
    $("#authOps").hide();
    $(".modal-footer").show();
    $("button.btn-prevnext").click(function () {
        var canvasId = $(this).attr("data-uri");
        selectForModal(canvasId, $("img.thumb[data-uri='" + canvasId + "']"));
    });
    $("button.btn-mark").click(function () {
        var canvasId = $(this).attr("data-uri");
        if (this.id === "mkStart") {
            startCanvas = canvasId;
        } else {
            endCanvas = canvasId;
        }
        markSelection();
    });
    $("#clearSelection").click(function() {
        startCanvas = null;
        endCanvas = null;
        markSelection();
    });
    $("#makeManifest").click(function () {
        var s = findCanvasIndex(startCanvas);
        var e = findCanvasIndex(endCanvas);
        if (!(loadedResource && s >= 0 && e >= s)) {
            alert("invalid selection");
            return;
        }
        var newManifest = $.extend(true, {}, manifestTemplate);
        IIIF.wrap(newManifest);
        var manifestName = "cvs-" + s + "-" + e;
        newManifest.id = getManifestUrlForLoadedResource(manifestName);
        newManifest.label = getManifestLabel(s, e);
        newManifest.sequences[0].id = newManifest.id.replace("/manifest", "/sequence/s0");
        for (var cvsIdx = s; cvsIdx <= e; cvsIdx++) {
            newManifest.sequences[0].canvases.push(canvasList[cvsIdx]);
        }
        $.ajax({
            url: newManifest.id,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(newManifest),
            dataType: 'json'
        }).done(function () {
            newManifest.sequences = null;
            newManifest.service = null;
            $.ajax({
                url: getCollectionUrlForLoadedResource(),
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(newManifest),
                dataType: 'json'
            }).done(function () {
                loadManifestPage(newManifest.id);
            }).fail(function (xhr, textStatus, error) {
                alert(error);
            });
        }).fail(function(xhr, textStatus, error) {
            alert(error);
        });
    });
    bigImage = $('#bigImage');
    bigImage.bind('error', function (e) {
        attemptAuth($(this).attr('data-uri'));
    });
    authDo = $('#authDo');
    authDo.bind('click', doClickthroughViaWindow);
});

function loadManifestPage(manifestUrl) {
    window.location.href = "http://universalviewer.io/?manifest=" + manifestUrl;
}

function processQueryString(){    
    var qs = /manifest=(.*)/g.exec(window.location.search);
    if (qs && qs[1]) {
        loadedResource = qs[1];
        $('#manifestWait').show();
        $('#title').text(loadedResource);
        $.ajax({
            dataType: "json",
            url: loadedResource,
            cache: true,
            success: function (iiifResource) {
                if (iiifResource["@type"] === "sc:Collection") {
                    loadedResource = iiifResource.manifests[0]["@id"];
                    $.getJSON(loadedResource, function (cManifest) {
                        load(cManifest);
                    });
                } else {
                    load(iiifResource);
                }
            }
        });
    }
}


function load(manifest) {
    IIIF.wrap(manifest);
    getCreatedManifests();
    var thumbs = $('#thumbs');
    thumbs.empty();
    $('#title').text(manifest.label);
    if(manifest.mediaSequences){
        thumbs.append("<i>This is not a normal IIIF manifest - it's an 'IxIF' extension for audio, video, born digital. This viewer does not support them (yet).</i>");
    } else {
        canvasList = manifest.sequences[0].canvases;
        makeThumbSizeSelector();
        drawThumbs();
    }
    $('#typeaheadWait').hide();
    $('#manifestWait').hide();
}

function getManifestLabel(start, end) {
    return getPath(loadedResource).replace(/\//g, " ") + "canvases " + start + "-" + end;
}

function getCollectionUrlForLoadedResource() {
    return presentationServer + "/presley/ida/collection/" + getUriComponent(loadedResource);
}

function getManifestUrlForLoadedResource(manifestName) {
    var identifier = getUriComponent(loadedResource) + manifestName;
    return presentationServer + "/presley/ida/" + identifier + "/manifest";
}

function getPath(url) {
    var reg = /.+?\:\/\/.+?(\/.+?)(?:#|\?|$)/;
    return reg.exec(url)[1];
}

function getUriComponent(str) {
    // for demo purposes! Not safe for general URL patterns
    return getPath(str).replace(/\//g, "_");
}

function getCreatedManifests() {
    // run on page load
    $("#manifestSelector").append("<option value=\"" + loadedResource + "\">Original manifest</option>");
    var collectionId = getCollectionUrlForLoadedResource(); // get the container in presley
    console.log("attemp to load " + collectionId);
    $.getJSON(collectionId)
        .done(function (collection) {
            IIIF.wrap(collection);
            derivedManifests = collection;
            if (derivedManifests && derivedManifests.members) {
                for (var i = 0; i < derivedManifests.members.length; i++) {
                    var manifest = derivedManifests.members[i];
                    var label = manifest.label || manifest.id;
                    $("#manifestSelector").append("<option value=\"" + manifest.id + "\">" + label + "</option>");
                }
            }
            $("#manifestSelector").change(selectDerivedManifest);
            $("#viewManifest").click(function () {
                loadManifestPage($("#manifestSelector").val());
            });



        })
        .fail(function () {
            console.log("no load " + collectionId);
            derivedManifests = null;
        });
}

function selectDerivedManifest() {
    for (var r = 0; r < derivedManifests.members.length; r++) {
        var manifestId = derivedManifests.members[r].id;
        if (manifestId === $(this).val()) {
            // load this manifest
            $.getJSON(manifestId).done(function (fullManifest) {
                var derivedCanvasList = fullManifest.sequences[0].canvases;
                startCanvas = derivedCanvasList[0]["@id"];                
                endCanvas = derivedCanvasList[derivedCanvasList.length - 1]["@id"];
                if (fullManifest.service) {
                    if (!Array.isArray(fullManifest.service)) {
                        fullManifest.service = [fullManifest.service];
                    }
                    fullManifest.service.forEach(function (svc) {
                        if (svc.profile && svc.profile == "https://dlcs.info/profiles/canvasmap") {
                            startCanvas = svc.canvasmap[startCanvas] || startCanvas;
                            endCanvas = svc.canvasmap[endCanvas] || endCanvas;
                        }
                    });
                }
                var start = markSelection();
                start.scrollIntoView();
            });
            break;
        }
    }
}
var thumbImageTemplate = "<img class=\"thumb\" title=\"{label}\" data-uri=\"{canvasId}\" data-src=\"{dataSrc}\" {dimensions} />";

function drawThumbs(){
    var thumbs = $("#thumbs");
    thumbs.empty();
    var preferredSize = parseInt(localStorage.getItem("thumbSize"));
    for(var i=0; i<canvasList.length; i++){
        var canvas = canvasList[i];
        var divclass = "ocrUnknown";
        var additionalHtml = "";
        var confBar = "<div class=\"confBarPlaceholder\"></div>";
        var imgLabel = "";
        if (canvas.service && canvas.service.context === "https://dlcs-ida.org/ocr-info") {
            var isType = canvas.service["Typescript"];
            divclass = isType ? "ocrType" : "ocrHand";
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
        var thumbHtml = '<div class="tc ' + divclass + '"><div class=\"cvLabel\">' + (canvas.label || '') + '</div>';
        var min = preferredSize < 100 ? 0 : Math.round(preferredSize * 0.8);
        var max = preferredSize < 100 ? 200 : preferredSize * 2;
        var thumb = canvas.getThumbnail(preferredSize, min, max); //getThumb(canvas, preferredSize);
        if(!thumb){ 
            thumbHtml += '<div class="thumb-no-access">Image not available</div></div>';
        } else {
            var thumbImg = thumbImageTemplate.replace("{label}", imgLabel).replace("{canvasId}", canvas.id).replace("{dataSrc}", thumb.url);
            var dimensions = "";
            if (thumb.width && thumb.height) {
                dimensions = "width=\"" + thumb.width + "\" height=\"" + thumb.height + "\"";
            }
            thumbHtml += thumbImg.replace("{dimensions}", dimensions) + confBar + additionalHtml + "</div>";
        }
        thumbs.append(thumbHtml);
    } 
    $('img.thumb').click(function(){
        selectForModal($(this).attr('data-uri'), $(this));
        $('#imgModal').modal();
    });
    $("img.thumb").unveil(300);
}

function makeThumbSizeSelector() {
    var choices = [30, 50, 100, 200, 400, 600];
    var foundSizes = [];
    var i;
    for(i = 0; i<Math.min(canvasList.length, 10); i++){
        var canvas = canvasList[i];
        if(canvas.thumbnail && canvas.thumbnail.service && canvas.thumbnail.service.sizes){
            var sizes = canvas.thumbnail.service.sizes;
            for(var j=0; j<sizes.length;j++){
                var testSize = Math.max(sizes[j].width, sizes[j].height);
                foundSizes.push(testSize);
                if (choices.indexOf(testSize) === -1 && testSize <= 600) {
                    choices.push(testSize);
                }
            }    
        }
    }
    choices.sort(function (a, b) { return a - b; });
    var html = "<select id='thumbSize'>";
    for (i = 0; i < choices.length; i++) {
        var box = choices[i];
        var label = box;
        if (foundSizes.indexOf(box) !== -1) {
            label += "*";
        }
        html += "<option value='" + box + "'>" + label + " pixels</option>";
    }
    html += "</select>";
    $('#thumbSizeSelector').append(html);
    var thumbSize = localStorage.getItem('thumbSize');
    if(!thumbSize){
        thumbSize = choices[0];
        localStorage.setItem('thumbSize', thumbSize);
    }
    if (thumbSize !== choices[0]) {
        $("#thumbSize option[value='" + thumbSize + "']").prop('selected', true);
    }
    $('#thumbSize').change(function(){
        var ts =  $("#thumbSize").val();
        localStorage.setItem('thumbSize', ts);
        drawThumbs();
    });
}

function markSelection() {
    var startDiv = null;
    $(".tc").removeClass("selected startmark endmark");
    var thumbs = $("img.thumb").toArray();
    var selection = false;
    for (var i = 0; i < thumbs.length; i++) {
        var thumb = $(thumbs[i]);
        if (thumb.attr("data-uri") === startCanvas) {
            thumb.parents("div.tc").addClass("startmark");
            selection = true;
            startDiv = thumb.parents("div.tc")[0];
        }
        if (selection && endCanvas) {
            thumb.parents("div.tc").addClass("selected");
        }
        if (thumb.attr("data-uri") === endCanvas) {
            if (startCanvas && !selection) {
                // end is before start;
                endCanvas = null;
                $(".tc").removeClass("selected startmark endmark");
                i = -1;
            }
            thumb.parents("div.tc").addClass("endmark");
            selection = false;
        }
    }
    return startDiv;
}

function selectForModal(canvasId, $image) {
    $('img.thumb').css('border', '2px solid white');
    $image.css('border', '2px solid tomato');
    var cvIdx = findCanvasIndex(canvasId);
    if(cvIdx !== -1){
        var canvas = canvasList[cvIdx];
        var imgToLoad = canvas.getThumbnail(1000, 800, 2000); // getMainImg(canvas);
        bigImage.show();
        bigImage.attr("src", imgToLoad.url); // may fail if auth
        bigImage.attr("data-src", imgToLoad.url); // to preserve
        bigImage.attr("data-uri", canvas.getDefaultImageService().id);
        $(".btn-mark").attr("data-uri", canvasId);
        $('#mdlLabel').text(canvas.label);
        if(cvIdx > 0){
            $('#mdlPrev').prop('disabled', false);
            var prevCanvas = canvasList[cvIdx - 1];
            $('#mdlPrev').attr('data-uri', prevCanvas.id);
        } else {
            $('#mdlPrev').prop('disabled', true);
        }        
        if(cvIdx < canvasList.length - 1){
            $('#mdlNext').prop('disabled', false);
            var nextCanvas = canvasList[cvIdx + 1];
            $('#mdlNext').attr('data-uri', nextCanvas.id);
        } else {
            $('#mdlNext').prop('disabled', true);
        }
    }
}

function findCanvasIndex(canvasId){
    for(var idx = 0; idx < canvasList.length; idx++){
        if(canvasId === canvasList[idx]["@id"]){
            return idx;
        }
    }
    return -1;
}

function attemptAuth(imageService){
    imageService += "/info.json";
    doInfoAjax(imageService, on_info_complete);
}

function doInfoAjax(uri, callback, token) {
    var opts = {};
    opts.url = uri;
    opts.complete = callback;
    if (token) {
        opts.headers = { "Authorization": "Bearer " + token.accessToken }
        opts.tokenServiceUsed = token['@id'];
    }
    $.ajax(opts);
}

function reloadImage(){    
    bigImage.show();
    bigImage.attr('src', bigImage.attr('data-src') + "#" + new Date().getTime());
}

function on_info_complete(jqXHR) {

    var infoJson = $.parseJSON(jqXHR.responseText);
    var services = IIIF.getAuthServices(infoJson);

    if (jqXHR.status === 200) {
        // TODO - degraded, other auth modes.
        return;
    }

    if (jqXHR.status === 403) {
        alert('TODO... 403');
        return;
    }

    if (services.clickthrough) {
        bigImage.hide();
        authDo.attr('data-token', services.clickthrough.token.id);
        authDo.attr('data-uri', services.clickthrough.id);
        $('#authOps').show();
        $('.modal-footer').hide();
        $('#authOps h5').text(services.clickthrough.label);
        $('#authOps div').html(services.clickthrough.description);
        authDo.text(services.clickthrough.confirmLabel);
    }
    else {
        alert('only clickthrough supported from here');
    }
}

function doClickthroughViaWindow(ev) {

    var authSvc = $(this).attr('data-uri');
    var tokenSvc = $(this).attr('data-token');
    console.log("Opening click through service - " + authSvc + " - with token service " + tokenSvc);
    var win = window.open(authSvc); //
    var pollTimer = window.setInterval(function () {
        if (win.closed) {
            window.clearInterval(pollTimer);
            if (tokenSvc) {                
                // on_authed(tokenSvc);
                $('#authOps').hide();
                $('.modal-footer').show();
                reloadImage(); // bypass token for now
            }
        }
    }, 500);
}

/**
 * jQuery Unveil
 * A very lightweight jQuery plugin to lazy load images
 * http://luis-almeida.github.com/unveil
 *
 * Licensed under the MIT license.
 * Copyright 2013 Lu�s Almeida
 * https://github.com/luis-almeida
 */

; (function ($) {

    $.fn.unveil = function (threshold, callback) {

        var $v = $(".viewer"), $w = $(window),
            th = threshold || 0,
            retina = window.devicePixelRatio > 1,
            attrib = retina ? "data-src-retina" : "data-src",
            images = this,
            loaded;

        this.one("unveil", function () {
            var source = this.getAttribute(attrib);
            source = source || this.getAttribute("data-src");
            if (source) {
                console.log("setting src " + source);
                this.setAttribute("src", source);
                if (typeof callback === "function") callback.call(this);
            }
        });

        function unveil() {
            var inview = images.filter(function () {
                var $e = $(this);
                if ($e.is(":hidden")) return;

                var wt = $w.scrollTop(),
                    wb = wt + $w.height(),
                    et = $e.offset().top,
                    eb = et + $e.height();

                return eb >= wt - th && et <= wb + th;
            });

            loaded = inview.trigger("unveil");
            images = images.not(loaded);
        }

        $w.on("scroll.unveil resize.unveil lookup.unveil", unveil);
        $v.on("scroll.unveil resize.unveil lookup.unveil", unveil);

        unveil();

        return this;

    };

})(window.jQuery);