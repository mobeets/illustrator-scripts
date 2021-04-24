// Gauss2DSamples.jsx
// Version 0.1
// Copyright 2021 Jay Hennig

// Global variables
var SCRIPT_NAME = '2D Gaussian Samples',
    SCRIPT_VERSION = 'v.0.1',
    DLG_OPACITY = .96; // UI window opacity. Range 0-1

var COLOR_DEFAULT_RGB = [0,0,0];

function dialogBox() {
    // init, and early sanity checking
    if (documents.length == 0) {
        alert(LANG_ERR_DOC);
        return;
      }
    var doc = app.activeDocument;
    var sel = doc.selection;
    if(sel.length === 0) {
        alert('No object selected!');
        return;
    } else if(sel.length > 1) {
        alert('More than one object selected!');
        return;
    }

    // create dialog
    var dialog = new Window('dialog', SCRIPT_NAME + ' ' + SCRIPT_VERSION);
    dialog.preferredSize.width = 174;
    dialog.orientation = 'column';
    dialog.alignChildren = ['fill', 'fill'];
    dialog.opacity = DLG_OPACITY;

    // Value fields
    var radiusPanel = dialog.add('panel', undefined, 'Point size');
      radiusPanel.alignChildren = ['fill', 'fill'];
    var gRadius = radiusPanel.add('edittext', undefined, '0.5');
      gRadius.active = true;

    var nPointsPanel = dialog.add('panel', undefined, 'Number of points');
      nPointsPanel.alignChildren = ['fill', 'fill'];
    var gNumPoints = nPointsPanel.add('edittext', undefined, '250');
      gNumPoints.active = true;
    var gScalePanel = dialog.add('panel', undefined, 'Scale (std. devs)');
      gScalePanel.alignChildren = ['fill', 'fill'];
    var gZScale = gScalePanel.add('edittext', undefined, '2');
      gZScale.active = true;

    // Buttons
    var btns = dialog.add('group');
      btns.alignChildren = ['fill', 'fill'];
      btns.orientation = 'column';
    var generate = btns.add('button', undefined, 'Generate', { name: 'generate' });
      generate.helpTip = 'Generate';
    var ok = btns.add('button', undefined, 'OK', { name: 'ok' });
      ok.helpTip = 'Press Enter to Run';
    var cancel = btns.add('button', undefined, 'Cancel', { name: 'cancel' });
      cancel.helpTip = 'Press Esc to Close';

    // button handles
    var points = [];
    generate.onClick = function () { points = run(dialog, gNumPoints, gZScale, gRadius, points); }
    ok.onClick = function () { if (points.length === 0) { points = run(dialog, gNumPoints, gZScale, gRadius, points); } dialog.close(); }
    cancel.onClick = function () { undoPoints(points); dialog.close(); }

    dialog.center();
    dialog.show();
}

function undoPoints(points) {
    if (points.length > 0) {
        app.undo(); return;
    }
}

function run(dialog, gNumPoints, gZScale, gRadius, points) {
    // check values are valid
    if (isNaN(Number(gRadius.text))) {
        alert('Number of points: \nPlease enter a numeric value.');
        return;
    } else if (gRadius.text === null) {
        return;
    } else {
        pointRadius = Number(gRadius.text);
    }
    if (isNaN(Number(gNumPoints.text))) {
        alert('Number of points: \nPlease enter a numeric value.');
        return;
    } else if (gNumPoints.text === null) {
        return;
    } else {
        numPoints = Number(gNumPoints.text);
    }
    if (isNaN(Number(gZScale.text))) {
        alert('Number of points: \nPlease enter a numeric value.');
        return;
    } else if (gZScale.text === null) {
        return;
    } else {
        zScale = Number(gZScale.text);
    }

    // if any points were already created, undo
    undoPoints(points);
    // create new points
    var points = main(numPoints, zScale, pointRadius);
    // sync with illustrator
    app.redraw();
    return points;
}

function main(N, zScale, pointRadius) {  
    var doc = app.activeDocument;
    var sel = doc.selection; 
    
    var th; // rotation of ellipse
    var mu; // center of ellipse
    var width; // width of ellipse
    var height; // height of ellipse

    for(var i = 0; i < sel.length; i++){ // only get first one
        if(sel[i].typename == "PathItem"){
            var obj = sel[i];

            // get orientation of ellipse
            if (obj.tags.length > 0 && obj.tags[0].name === "BBAccumRotation") {
                th = -rad2deg(obj.tags[0].value);
            } else {
                th = 0;
            }

            // rotate ellipse, get its height and width, then unrotate
            obj.rotate(th);
            mu = obj.position;
            mu[0] += obj.width/2.0;
            mu[1] -= obj.height/2.0;
            width = obj.width;
            height = obj.height;
            obj.rotate(-th);
        }
    }

    // find parameters of 2D gaussian (as scale and rotation)
    var R = rotationMatrix2D(deg2rad(th));
    var S = [width/(2*zScale), height/(2*zScale)];

    // generate N points with given covariance
    var nse;
    var points = [];
    var newGroup = app.activeDocument.groupItems.add();
    for(var i = 0; i < N; i++){
        nse = randn2D(S, R);
        var point = drawPoint(doc, mu[0]+nse[0], mu[1]+nse[1], pointRadius);
        point.fillColor = makeColorRGB(COLOR_DEFAULT_RGB);
        point.stroked = false;
        point.moveToBeginning(newGroup);
        points.push(point);
    }
    return points;
}

function makeColorRGB(rgb){
// RGB color constructor
    var c = new RGBColor();
    c.red   = rgb[0];
    c.green = rgb[1];
    c.blue  = rgb[2];
    return c;
}

function rad2deg(n) {
// convert degrees to radians
  return n * (180 / Math.PI);
}

function deg2rad(n) {
// convert radians to degrees
  return n * (Math.PI / 180);
}

function drawPoint(doc, px, py, rad) {
// draw circle at position (px,py) with radius rad
    return doc.pathItems.ellipse(py+rad, px-rad, 2*rad, 2*rad, false, false);
}

function rotationMatrix2D(th) {
// 2D rotation matrix with angle th (radians)
    return [[Math.cos(th), Math.sin(th)], [-Math.sin(th), Math.cos(th)]];
}

function dotProduct(x, y) {
// dot product of x and y
  var result = 0;
  for (var i = 0; i < x.length; i++) {
    result += x[i] * y[i];
  }
  return result;
}

function randn2D(S, R) {
// 2D Gaussian w/ eigenvalues S, rotated by rotation matrix R
    var u1 = randn_bm();
    var u2 = randn_bm();
    var u = [u1*S[0], u2*S[1]];
    return [dotProduct(u, R[0]), dotProduct(u, R[1])];
}

function randn_bm() {
// Standard Normal variate using Box-Muller transform.
    var u = 0, v = 0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}

dialogBox();
