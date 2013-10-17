
function daysToPlay(d){
    var daysGone = Math.floor((Date.now() - d.date) / (1000 * 60 * 60 * 24));
    return 28 - daysGone;
}

function challengeText(d){
    return '<b>' + getName(d.challenger) + '</b> has challenged <b>' + getName(d.challenged) + '</b>. '
            + 'They\'ve got <b>'+daysToPlay(d)+' days</b> to play'
}

function checkIfChallenged(id){
    var result = challenges.filter(function(challenge){
        return (challenge.challenger == id && challenge.challenged == userId)
            || (challenge.challenged == id && challenge.challenger == userId)
    });
    return result.length ? daysToPlay(result[0]) : false;
}

function drawChallenges(challenges){
    var join = d3.select('#challenges')
        .selectAll('.challenge')
        .data(challenges, function(d){return d._id})

    join.enter()
        .append('div')
        .attr('class','challenge')
        .html(challengeText)

    join.exit()
        .transition()
        .duration(1000)
        .style('opacity',0)
        .transition()
        .remove()

}
