var config = require('../config');

module.exports = {
    sendEmailsAboutChallenge : sendEmailsAboutChallenge,
    sendEmailsAboutMatch : sendEmailsAboutMatch
};

var server = require("emailjs/email").server.connect({
    host        : config.email.host,
    user        : config.email.user,
    password    : config.email.password,
    ssl         : true
});

// figures out which players need an email about a new challenge, and sends
// that email. Challenger and challenged arguments should be ObjectIds of
// the players involved in the challenge
function sendEmailsAboutChallenge(challenger, challenged, callback){
    var db = require('./db');

    db.getPlayers(function(error, players){
        var challengerName, challengedName;
        players.forEach(function(player){
            if (player._id.equals(challenger)){
                challengerName = player.name;
            }
            if (player._id.equals(challenged)){
                challengedName = player.name;
            }

        });
        players.forEach(function(player, i){
            player.settings = player.settings || {};
            // player gets an email if they're involved in the challenge and
            // have 'emailMyChallenge' preference, or they have 'emailAnyChallenge'
            if (
                (player.settings.emailMyChallenge && (player._id.equals(challenger) || player._id.equals(challenged)))
                || player.settings.emailAnyChallenge){
                sendChallenge(player, challengerName, challengedName, callback)
            }
        })
    })
}

function sendEmailsAboutMatch(match, callback){
    var db = require('./db');
    db.getPlayers(function(error, players){
        players.forEach(function(player, i){
            player.settings = player.settings || {};
            // player gets an email if they're involved in the challenge and
            // have 'emailMyChallenge' preference, or they have 'emailAnyChallenge'
            if ((player.settings.emailMyMatch && (player._id.equals(match.playerA._id) || player._id.equals(match.playerB._id)))
                || player.settings.emailAnyMatch){
                sendMatchReport(player, match, callback)
            }
        })
    })
}

// challenger and challenged are names Player is the whole dict
function sendChallenge(player, challenger, challenged, callback){

    if (!player.settings.email){
        console.log('No email address, so cannot send challenge to ' + player.name)
        console.log(player)
        callback('No email')
        return;
    }

    console.log('sending an email to ' + player.name)
    console.log(challenger + ' challenged ' + challenged)

    var emailDetails = {
        from : 'luke.barlow@gmail.com',
        to : player.settings.email,
        subject : config.siteName + ' : ' + challenger + ' challenged ' + challenged,
        text : ' ',
        attachment  : body()
    }

    console.log('email details')
    console.log(emailDetails)

    server.send(emailDetails, callback)
}

// converts a match to a string
function matchString(match){
    var score = match.score.map(function(match){return match[0] + '-' + match[1]}).join(', ')
    return match.playerA.name + ' v ' + match.playerB.name + ' : ' + score;
}

function sendMatchReport(player, match, callback){
    if (!player.settings.email){
        console.log('No email address, so cannot send match report to ' + player.name)
        console.log(player)
        callback('No email')
        return;
    }

    console.log('sending a match report to ' + player.name)
    console.log(match)

    server.send({
        from : 'luke.barlow@gmail.com',
        to : player.settings.email,
        subject : config.siteName + ' : ' + matchString(match),
        text : ' ',
        attachment  : body()
    }, callback)

}

function body(){
    html = '<html><body><a href="http://'+config.domainName+'">'+config.domainName+'</a></body></html>';
    return [{data:html, alternative:true}];
}