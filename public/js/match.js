// initialises the score thing with a dropdown for a single set. If you add
// a score, then it will create another set for you to score
function initScore(){
    var score = d3.select('#score'),
        sets = [];

    score.text('');

    function addSet(){
        var set = score.append('div')
                .style('white-space','nowrap')
                .style('float','left'),
            i = sets.length,
            scoreA = set.append('select').call(setScore);
        set.append('br');
        var scoreB = set.append('select').call(setScore);

        function changeHandler(){
            if (scoreA.property('value') >= 0 &&
                scoreB.property('value') >= 0 ){
                if (sets.length <= i+1){
                    addSet();
                }  
            }else{
                while(sets.length > i+1){
                    sets.pop().container.remove();
                }
            }
        }

        scoreA.on('change', changeHandler)
        scoreB.on('change', changeHandler)
        sets.push({a : scoreA, b : scoreB, container : set})
        return 
    }

    addSet();

    // converts the set objects into the array of arrays score
    sets.score = function(){
        var scores = [];
        sets.forEach(function(set){
            var a = parseInt(set.a.property('value')),
                b = parseInt(set.b.property('value'));
            if (a >= 0 && b >= 0){
                scores.push([a,b])
            }
        })
        return scores;
    }

    return sets
}

function setScore(selection){
    selection.selectAll('option')
        .data(d3.range(-1,13))
        //.data(d3.range(Math.round(Math.random() * 4),8))
        .enter()
        .append('option')
        .attr('value',function(d){return d})
        .text(function(d){
            return d > -1 ? d : '';
        })

}

var dateFormatter = d3.time.format('%a, %-e %b');

function formatDate(d){
    return dateFormatter(new Date(d));
}

function fillWithPlayers(select, players){
    select.append('option')
    select.selectAll('option.player')
        .data(players)
        .enter()
        .append('option')
        .attr('class','player')
        .attr('value', function(d){return d._id})
        .text(function(d){
            return d.name
        })
    select.node().selectedIndex = 0;
}

function initNewMatch(){

    // initialise the new match form
    var newMatch = d3.select('#recordAMatch'),
        playerA = newMatch.select('#playerA'),
        playerB = newMatch.select('#playerB');

    fillWithPlayers(playerA, players);
    fillWithPlayers(playerB, players);

    playerA.property('value',userId)

    var score = initScore();

    d3.select('#addMatch').on('click', function(){
        var game = {
            playerA : playerA.property('value'),
            playerB : playerB.property('value'),
            score : score.score(),
            recordedBy : userId
        }

        d3.json('/addMatch?match=' + JSON.stringify(game), function(ladder){
            hideDialog();
            refresh();
        })
    })
}


function drawMatches(matches){

    matches.forEach(function(match){
        match.aWins = match.score[0][0] > match.score[0][1];
        match.isAForfeit = (match.score[0][0] + match.score[0][1] == 1);
    })

    var join = d3.select('#matches')
        .selectAll('.match')
        .data(matches, function(d){return d._id})

    var adding = d3.selectAll('.match')[0].length > 0 && !join.enter().empty();

    var containers = join.enter()
        .insert('div','.match:first-child')
        .attr('class','match')

    containers.append('span')
        .attr('class','matchInfo')
        .text(function(d){
            return formatDate(d.date)
        })

    

    if (adding){
        
        containers.style('opacity',0)

        join.style('position','relative')
            .style('top','-64px')
            .transition()
            .duration(1000)
            .style('top','0px')
            .transition()
            .duration(1000)
            .style('opacity',1)
    }

    join.exit().remove();

    var tables = containers.append('table');

    tables.each(function(d,i){
        var table = d3.select(this);

        if (!d.isAForfeit){
            var rowA = table.append('tr'),
                rowB = table.append('tr');

            rowA.append('td').html(function(d,i){
                var name = d.playerA.name;
                if (d.aWins) name = '<span class=winner>' + name + ' &#10003; </span>'
                return name;
            })

            rowA.selectAll('td.score')
                .data(function(d,i){return d.score})
                .enter()
                .append('td')
                .text(function(d,i){return d[0]})

            rowB.append('td').html(function(d,i){
                var name =  d.playerB.name;
                if (!d.aWins) name = '<span class=winner>' + name + ' &#10003;</span>'
                return name;
            })

            rowB.selectAll('td.score')
                .data(function(d,i){return d.score})
                .enter()
                .append('td')
                .text(function(d,i){return d[1]})
        }else{
            table.append('tr').append('td').html('Challenge expired between <b>' + 
                d.playerA.name + '</b> and <b>' + d.playerB.name + '</b> and so <b>' + 
                (d.aWins ? d.playerB.name : d.playerA.name) + 
                '</b> forfeited the match.')
        }

        

    })

    

    // rowA.each(function(d,i){
    //     var row = d3.select(this);
    //     if (!d.isAForfeit){
    //         row.selectAll('td.score')
    //             .data(d.score)
    //             .enter()
    //             .append('td')
    //             .text(function(d,i){return d[0]})
    //     }else{
    //         row.append('td').text('FORFEIT')
    //     }
    // })

    


}