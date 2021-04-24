
// Global variables
var SCRIPT_NAME = 'ConvertToGradient',
    SCRIPT_VERSION = 'v.0.1.1',
    DLG_OPACITY = .96; // UI window opacity. Range 0-1

function dialogBox() {
    var dialog = new Window('dialog', SCRIPT_NAME + ' ' + SCRIPT_VERSION);
    dialog.preferredSize.width = 174;
    dialog.orientation = 'column';
    dialog.alignChildren = ['fill', 'fill'];
    dialog.opacity = DLG_OPACITY;

    // Value fields
    var nPointsPanel = dialog.add('panel', undefined, 'Number of points');
      nPointsPanel.alignChildren = ['fill', 'fill'];
    var gNumPoints = nPointsPanel.add('edittext', undefined, '10');
      gNumPoints.active = true;

    // Buttons
    var btns = dialog.add('group');
      btns.alignChildren = ['fill', 'fill'];
      btns.orientation = 'column';
    var cancel = btns.add('button', undefined, 'Cancel', { name: 'cancel' });
      cancel.helpTip = 'Press Esc to Close';
    var ok = btns.add('button', undefined, 'OK', { name: 'ok' });
      ok.helpTip = 'Press Enter to Run';

    ok.onClick = function () {
        if (isNaN(Number(gNumPoints.text))) {
            alert('Number of points: \nPlease enter a numeric value.');
            return;
        } else if (gNumPoints.text === null) {
            return;
        } else {
            numPoints = Number(gNumPoints.text);
        }

        main(numPoints);
        dialog.close();
    }

    cancel.onClick = function () { dialog.close(); }

    dialog.center();
    dialog.show();
}

function main(N) {
  if (documents.length == 0) {
    alert(LANG_ERR_DOC);
    return;
  }
  
    var doc = app.activeDocument;
    var sel = doc.selection; 
    var rad = 1; // radius of circles
    var th; // rotation of ellipse

    var mu;
    var widths = [];
    var heights = [];
    for(var i = 0; i < sel.length; i++){ // only get first one
        if(sel[i].typename == "PathItem"){
            var obj = sel[i];
            if (obj.tags.length > 0 && obj.tags[0].name === "BBAccumRotation") {
                th = -rad2deg(obj.tags[0].value);
            } else {
                th = 0;
            }

            obj.rotate(th);
            mu = obj.position;
            mu[0] += obj.width/2.0;
            mu[1] -= obj.height/2.0;
            widths.push(obj.width);
            heights.push(obj.height);
            obj.rotate(-th);
        }
    }

    // find parameters of 2D gaussian
    var R = rotationMatrix2D(deg2rad(th));
    var S = [widths[0]/4, heights[0]/4];

    var nse;
    var group = activeDocument.groupItems.add();
    var point;
    for(var i = 0; i < N; i++){
        nse = randn2D(S, R);
        point = drawPoint(doc, mu[0]+nse[0], mu[1]+nse[1], rad);
        point.moveToEnd(group);
    }
}

function rad2deg(n) {
  return n * (180 / Math.PI);
}

function deg2rad(n) {
  return n * (Math.PI / 180);
}

function drawPoint(doc, px, py, rad) {
    return doc.pathItems.ellipse(py+rad, px-rad, 2*rad, 2*rad, false, false);
}

function rotationMatrix2D(th) {
    return [[Math.cos(th), Math.sin(th)], [-Math.sin(th), Math.cos(th)]];
}

// dot product
function dotProduct(vector1, vector2) {
  var result = 0;
  for (var i = 0; i < vector1.length; i++) {
    result += vector1[i] * vector2[i];
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

// dialog();
main(250);
