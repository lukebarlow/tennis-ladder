
function daysToPlay(d){
    var daysGone = Math.floor((Date.now() - d.date) / (1000 * 60 * 60 * 24));
    return 14 - daysGone;
}

function challengeText(d){
    return getName(d.challenger) + ' has challenged ' + getName(d.challenged) + '. '
            + 'They\'ve got '+daysToPlay(d)+' days to play'
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
        .text(challengeText)

    join.exit()
        .transition()
        .duration(1000)
        .style('opacity',0)
        .transition()
        .remove()

}