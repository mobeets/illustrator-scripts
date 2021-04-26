// Gauss2DSamples.jsx
// Version 0.1
// Copyright 2021 Jay Hennig

// Global variables
var SCRIPT_NAME = 'ConnectAllNodes',
    SCRIPT_VERSION = 'v.0.1',
    DLG_OPACITY = .96; // UI window opacity. Range 0-1

function dialogBox() {
    // init, and early sanity checking
    if (documents.length == 0) {
        alert(LANG_ERR_DOC);
        return;
      }
    var doc = app.activeDocument;
    var sel = doc.selection;
    if(sel.length <= 1) {
        alert('Please select more than one object!');
        return;
    }

    // create dialog
    var dialog = new Window('dialog', SCRIPT_NAME + ' ' + SCRIPT_VERSION);
    dialog.preferredSize.width = 174;
    dialog.orientation = 'column';
    dialog.alignChildren = ['fill', 'fill'];
    dialog.opacity = DLG_OPACITY;

    // Value fields
    var checkbox = dialog.add("checkbox", undefined, 'Align by X (else by Y)?');
    checkbox.value = true;

    // Buttons
    var btns = dialog.add('group');
      btns.alignChildren = ['fill', 'fill'];
      btns.orientation = 'column';
    
    var ok = btns.add('button', undefined, 'OK', { name: 'ok' });
      ok.helpTip = 'Press Enter to Run';
    var cancel = btns.add('button', undefined, 'Cancel', { name: 'cancel' });
      cancel.helpTip = 'Press Esc to Close';

    // button handles
    ok.onClick = function () { main(checkbox.value); dialog.close(); }
    cancel.onClick = function () { dialog.close(); }

    dialog.center();
    dialog.show();
}

function main(doMatchX) {  
    var doc = app.activeDocument;
    var sel = doc.selection; 
    
    var centers = [];
    for(var i = 0; i < sel.length; i++){ // only get first one
        if(sel[i].typename == "PathItem"){
            var obj = sel[i];
            mu = obj.position;
            mu[0] += obj.width/2.0;
            mu[1] -= obj.height/2.0;
            centers.push(mu);
        }
    }
    var pts = clusterPoints(centers, doMatchX);
    if (pts[1].length === 0) {
        if (doMatchX) {
            alert('No edges to draw because all nodes had the same X value!');
        } else {
            alert('No edges to draw because all nodes had the same Y value!');
        }
        return;
    }

    var newGroup = app.activeDocument.groupItems.add();
    for(var i = 0; i < pts[0].length; i++){
        for(var j = 0; j < pts[1].length; j++){
            drawLine(newGroup, pts[0][i], pts[1][j]);
        }
    }
}

function clusterPoints(pts, doMatchX) {
    var pts_src = [];
    var pts_dest = [];
    var tol = 0.001;
    if (pts.length === 0) { return [pts_src, pts_dest]; }
    if (doMatchX) { // match x or y
        var src_target = pts[0][0];
    } else {
        var src_target = pts[0][1];
    }
    for (var i = 0; i < pts.length; i++) {
        if (doMatchX) {
            if (closeEnough(pts[i][0], src_target, tol)) {
                pts_src.push(pts[i]);
            } else {
                pts_dest.push(pts[i]);
            }
        } else {
            if (closeEnough(pts[i][1], src_target, tol)) {
                pts_src.push(pts[i]);
            } else {
                pts_dest.push(pts[i]);
            }
        }
    }
    return [pts_src, pts_dest];
}

function closeEnough(x1, x2, tol) {
    return Math.sqrt(Math.pow((x1-x2)*(x1-x2),2)) < tol;
}

function drawLine(group, anchor1, anchor2) {
    //draw a single line from point a to point b
    var linePath = group.pathItems.add();
    linePath.setEntirePath(Array(anchor1, anchor2));
    linePath.closed = false;
    linePath.stroked = true;
    linePath.filled = false;
    linePath.strokeWidth = 1;
    return linePath;
}

dialogBox();
