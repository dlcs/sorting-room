


var loadedResource;
var sourceSequence;
var bigImage;
var authDo;
var startCanvas = null;
var endCanvas = null;
var derivedManifests = null;

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
    $("#manifestWait").hide();
    showCollectionUI();
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
        var s = sourceSequence.findIndexById(startCanvas);
        var e = sourceSequence.findIndexById(endCanvas);
        if (!(loadedResource && s >= 0 && e >= s)) {
            alert("invalid selection");
            return;
        }
        var newManifest = $.extend(true, {}, manifestTemplate);
        IIIF.wrap(newManifest);
        var manifestName = "cvs-" + s + "-" + e;
        newManifest.id = SortyConfiguration.getManifestUrlForLoadedResource(loadedResource, manifestName);
        newManifest.label = SortyConfiguration.getManifestLabel(loadedResource, s, e);
        newManifest.sequences[0].id = newManifest.id.replace("/manifest", "/sequence/s0");
        for (var cvsIdx = s; cvsIdx <= e; cvsIdx++) {
            newManifest.sequences[0].canvases.push(sourceSequence[cvsIdx]);
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
                url: SortyConfiguration.getCollectionUrlForLoadedResource(loadedResource),
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

var urlTemplate = location.href.replace(location.search, '') + "?manifest=";
function manifestLink(id, text){
    if(id && text){
        return '<a href="' + urlTemplate + id + '">' + text + '</a>';
    }
    return '';
}

function showCollectionUI(collectionUri){
    if(SortyConfiguration.sourceCollection){
        $("#collectionLister").show();
        $("#collectionLister").click(function(){
            $.getJSON(SortyConfiguration.sourceCollection, renderCollection);
        });
    } 
}

function renderCollection(collection) {
    var table = '<table class="table table-condensed"><thead><tr>';
    if(collection.service && collection.service.headers){
        collection.service.headers.forEach(function(h){table += "<th>" + h + "</th>"})    
    } else {
        table += "<th>@id</th><th>label</th>";
    }
    table += "</tr></thead><tbody>";
    if(!collection.members) collection.members = collection.manifests;
    if(collection.members){
        collection.members.forEach(function(m){
            if(m.service && m.service.values){
                table += '<tr class="' + m.service.highlight + '">';
                table += '<td style="white-space:nowrap;">' + manifestLink(m["@id"], m.service.values[0]) + '</td>';
                for(var j=1; j< m.service.values.length; j++){
                    table += '<td>' + m.service.values[j] + "</td>";
                }        
                table += "</tr>";                
            } else {
                table += '<tr>';
                table += '<td>' + manifestLink(m["@id"], m["@id"]) + '</td>';
                table += '<td>' + m.label + '</td>';
                table += "</tr>";       
            }
        });
    }
    table += "</tbody></table>";
    $("#expandedCollection").html(table);
    $("#expandedCollection").show();
}

function loadManifestPage(manifestUrl) {
    window.location.href = "http://universalviewer.io/?manifest=" + manifestUrl;
}

function processQueryString(){    
    var qs = /manifest=(.*)/g.exec(window.location.search);
    if (qs && qs[1]) {
        loadedResource = decodeURIComponent(qs[1].replace(/%2b/g, '%20'));
        $('#manifestWait').show();
        $.ajax({
            dataType: "json",
            url: loadedResource,
            cache: true,
            success: function (iiifResource) {
                if (iiifResource["@type"] === "sc:Collection") {
                    renderCollection(iiifResource);
                    // TODO - collections
                    // loadedResource = iiifResource.manifests[0]["@id"];
                    // $.getJSON(loadedResource, function (cManifest) {
                    //     load(cManifest);
                    // });
                } else {
                    load(iiifResource);
                }
            }
        });
    }
}


function load(manifest) {
    IIIF.wrap(manifest);
    $("#selectorUIDefaultInput").val(loadedResource);
       // $('#title').text(loadedResource);
    getCreatedManifests();
    var thumbs = $('#thumbs');
    thumbs.empty();
    $('#title').text(manifest.label);
    if(manifest.mediaSequences){
        thumbs.append("<i>This is not a normal IIIF manifest - it's an 'IxIF' extension for audio, video, born digital. This viewer does not support them (yet).</i>");
    } else {
        sourceSequence = manifest.sequences[0].canvases;
        makeThumbSizeSelector();
        drawThumbs();
    }
    $('#typeaheadWait').hide(); // move to onManifestLoaded callback
    $('#manifestWait').hide();
}


function getCreatedManifests() {
    // run on page load
    $("#manifestSelector").append("<option value=\"" + loadedResource + "\">Original manifest</option>");
    var collectionId = SortyConfiguration.getCollectionUrlForLoadedResource(loadedResource); // get the container in presley
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
    for(var i=0; i<sourceSequence.length; i++){
        var canvas = sourceSequence[i];
        var decorations = SortyConfiguration.getCanvasDecorations(canvas);
        var thumbHtml = '<div class="tc ' + decorations.divClass + '"><div class=\"cvLabel\">' + (canvas.label || '') + '</div>';
        var min = preferredSize < 100 ? 0 : Math.round(preferredSize * 0.8);
        var max = preferredSize < 100 ? 200 : preferredSize * 2;
        var thumb = canvas.getThumbnail(preferredSize, min, max); 
        if(!thumb){ 
            thumbHtml += '<div class="thumb-no-access">Image not available</div></div>';
        } else {
            var thumbImg = thumbImageTemplate.replace("{label}", decorations.label).replace("{canvasId}", canvas.id).replace("{dataSrc}", thumb.url);
            var dimensions = "";
            if (thumb.width && thumb.height) {
                dimensions = "width=\"" + thumb.width + "\" height=\"" + thumb.height + "\"";
            }
            thumbHtml += thumbImg.replace("{dimensions}", dimensions) + decorations.canvasInfo + "</div>";
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
    for(i = 0; i<Math.min(sourceSequence.length, 10); i++){
        var canvas = sourceSequence[i];
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
    var cvIdx = sourceSequence.findIndexById(canvasId);
    if(cvIdx !== -1){
        var canvas = sourceSequence[cvIdx];
        var imgToLoad = canvas.getThumbnail(1000, 800, 2000); // getMainImg(canvas);
        bigImage.show();
        bigImage.attr("src", imgToLoad.url); // may fail if auth
        bigImage.attr("data-src", imgToLoad.url); // to preserve
        bigImage.attr("data-uri", canvas.getDefaultImageService().id);
        $(".btn-mark").attr("data-uri", canvasId);
        $('#mdlLabel').text(canvas.label);
        if(cvIdx > 0){
            $('#mdlPrev').prop('disabled', false);
            var prevCanvas = sourceSequence[cvIdx - 1];
            $('#mdlPrev').attr('data-uri', prevCanvas.id);
        } else {
            $('#mdlPrev').prop('disabled', true);
        }        
        if(cvIdx < sourceSequence.length - 1){
            $('#mdlNext').prop('disabled', false);
            var nextCanvas = sourceSequence[cvIdx + 1];
            $('#mdlNext').attr('data-uri', nextCanvas.id);
        } else {
            $('#mdlNext').prop('disabled', true);
        }
    }
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