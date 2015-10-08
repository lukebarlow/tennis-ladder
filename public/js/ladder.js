
function getName(id){
    return players.filter(function(d){return d._id == id})[0].name;
}

function challengeConfirmText(challenge){
    var challenged = getName(challenge.challenged);
    return 'You are about to challenge ' + challenged + '.' +
            'This means ' + challenged + ' must accept this challenge ' +
            'within 28 days and play a match, or forfeit his or her position in the ladder. ' +
            'You will both be emailed to confirm the challenge.'

}

function invitationText(invitation){
    var invited = getName(invitation.invited);
    return 'Invite ' + invited + ' to a match. You will both get an email with ' +
           'each other\'s contact details. This match will not show up in the ' +
           'challenges, and there\'s no time limit, but it will still affect the ' +
           'order of the ladder if the lower down person wins.'
}

function drawLadder(ladder){

    ladder = ladder.filter(function(rung){
        return rung.daysSincePlayed == null || rung.daysSincePlayed <= 365
    })

    function top(d,i){return i*20 + 'px'}
    function name(d,i){
        var html = (i+1) + ' ' + d.name;
        if (d._id == userId){
            html = '<b>' + html + '</b>'
        }
        return html;
    }
    // used to draw the challenge link / text
    function challenge(d,i){
        if (myPosition === null) return;
        var diff = myPosition - i,
            challenged = checkIfChallenged(d._id),
            rung = d3.select(this);

        if (challenged != false){
            rung.append('span')
                .attr('class','challengeText')
                .html('&nbsp;&nbsp;' + challenged + ' days to play')
        }else if (diff >= 1 && diff <= 3){
            
            rung.append('a')
                .attr('class','challengeText')
                .html('&nbsp;&nbsp;challenge')
                .on('click', function(){
                    showDialog('confirmChallenge')
                    
                    var challenge = {
                        challenger : userId,
                        challenged : d._id
                    }

                    d3.select('#confirmChallenge')
                        .text('')
                        .html(challengeConfirmText(challenge))
                        .append('button')
                        .style('float','right')
                        .style('margin','20px')
                        .text('confirm')
                        .on('click', function(){
                            hideDialog();
                            d3.text('addChallenge?challenge=' + JSON.stringify(challenge), function(result){
                                refresh();
                            })
                        })
                })
        }else if (diff != 0){
            rung.append('a')
                .attr('class','inviteText')
                .html('&nbsp;&nbsp;invite')
                .on('click', function(){
                    showDialog('invite')
                    
                    var invitation = {
                        inviter : userId,
                        invited : d._id
                    }

                    d3.select('#invite')
                        .text('')
                        .html(invitationText(invitation))
                        .append('button')
                        .style('float','right')
                        .style('margin','20px')
                        .text('confirm')
                        .on('click', function(){
                            hideDialog();
                            d3.text('invite?invitation=' + JSON.stringify(invitation), function(result){
                                refresh();
                            })
                        })
                })
        }
    }

    // need to determine which are moving down or up
    var oldOrder = d3.select('#rungs')
        .selectAll('div.rung')
        .data()
        .sort(function(a,b){return a.ladderPosition - b.ladderPosition})
        .map(function(a){return a._id})

    if (oldOrder){
        ladder.forEach(function(d,i){
            var oldPosition = oldOrder.indexOf(d._id)
            d.moving = i == oldPosition ? null :
                       i < oldPosition ? 'up' : 'down'
        })
    }

    var myPosition = null;
    if (userId){
        myPosition = ladder.map(function(d){return d._id}).indexOf(userId);
    }

    var join = d3.select('#rungs')
        .selectAll('div.rung')
        .data(ladder, function(d){return d._id})

    join.html(name)
        .transition().duration(1000)
        .style('top', top)
        .styleTween('left', function(d,i,a){
            if (d.moving){
                var modifier = d.moving == 'up' ? 1 : -1;
                return function(t){
                    return modifier * 40 * Math.sin(t*Math.PI) + 'px'
                }
            }else{
                return function(t){return '0px'}
            } 
        })
        .each(challenge)

    join.exit().remove();

    join.enter()
        .append('div')
        .attr('class','rung')
        .html(name)
        .style('top',top)
        .style('left','0px')
        .each(challenge)
        .style('opacity', function(player){
            if (!player.daysSincePlayed) return 1
            if (player.daysSincePlayed > 273) return 0 // 9 months
            if (player.daysSincePlayed > 30){
                return (243 - (player.daysSincePlayed - 30)) / 243
            }
            return 1
        })
}
