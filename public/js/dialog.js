var modalBackdrop,
    linkDialog;

function showDialog(id) {
    setVisibleDialog(id);
    modalBackdrop.classed('inactive', false);
    setTimeout(function() { 
        modalBackdrop.classed('in', true);
        linkDialog.classed('inactive', false); 
    }, 0);
  setTimeout(function() { 
    linkDialog.classed('in', true); 
    }, 150);
}

function hideDialog() {
  linkDialog.classed('in', false);
  setTimeout(function() { linkDialog.classed('inactive', true); modalBackdrop.classed('in', false); }, 150);
  setTimeout(function() { modalBackdrop.classed('inactive', true); }, 300);
}

function setVisibleDialog(visibleId) {
    var dialogIds = ['recordAMatch','confirmChallenge','settings','changePassword'];
    dialogIds.forEach(function(id){
        d3.select('#' + id).style('display', id == visibleId ? 'block' : 'none');
    })
}

window.addEventListener('load', function(){
    modalBackdrop = d3.select('.modal-backdrop');
    linkDialog = d3.select('#dialog');
})