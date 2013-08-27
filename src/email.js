var nodemailer = require("nodemailer"),
    config = require('../config');

module.exports = {
    sendEmailsAboutChallenge : sendEmailsAboutChallenge,
    sendEmailsAboutMatch : sendEmailsAboutMatch,
    sendTestEmail : sendTestEmail
};

var transport;

// lazy building of the transport object
function getTransport(){
    if (!transport){
        transport = nodemailer.createTransport("SMTP",{
            service: "Gmail",
            auth: {
                user: config.email.user,
                pass: config.email.password
            }
        })
    }
    return transport;
}

function closeTransport(){
    if (transport) transport.close();
    transport = null;
}

// figures out which players need an email about a new challenge, and sends
// that email. Challenger and challenged arguments should be ObjectIds of
// the players involved in the challenge
function sendEmailsAboutChallenge(challengerId, challengedId, callback){
    var db = require('./db');

    db.getPlayers(function(error, players){
        var challenger, challenged;
        players.forEach(function(player){
            if (player._id.equals(challengerId)){
                challenger = player;
            }
            if (player._id.equals(challengedId)){
                challenged = player;
            }
        });

        var emailsSent = 0,
            callbacksCounted = 0;

        players.forEach(function(player, i){
            player.settings = player.settings || {};
            // player gets an email if they're involved in the challenge and
            // have 'emailMyChallenge' preference, or they have 'emailAnyChallenge'

            var isChallenger = player._id.equals(challengerId),
                isChallenged = player._id.equals(challengedId),
                isParticipant =  isChallenger || isChallenged;
                replyTo = null;

            if ((player.settings.emailMyChallenge && isParticipant) || player.settings.emailAnyChallenge){
                emailsSent++;
                sendChallenge(player, challenger, challenged, isParticipant, function(){
                    callbacksCounted++;
                    if (callbacksCounted >= emailsSent){
                        console.log('all emails sent')
                        closeTransport();
                        if (callback) callback();
                    };
                })
            }
        })
    })
}

function sendEmailsAboutMatch(match, callback){
    var db = require('./db');
    db.getPlayers(function(error, players){

        var emailsSent = 0,
            callbacksCounted = 0;

        players.forEach(function(player, i){
            player.settings = player.settings || {};
            // player gets an email if they're involved in the challenge and
            // have 'emailMyChallenge' preference, or they have 'emailAnyChallenge'
            if ((player.settings.emailMyMatch && (player._id.equals(match.playerA._id) || player._id.equals(match.playerB._id)))
                    || player.settings.emailAnyMatch){
                emailsSent++;
                sendMatchReport(player, match, function(){
                    callbacksCounted++;
                    if (callbacksCounted >= emailsSent){
                        console.log('all emails sent')
                        closeTransport();
                        if (callback) callback();
                    }
                })
            }
        })
    })
}

// challenger and challenged are names Player is the whole dict of the player
// we want to send the email to
function sendChallenge(player, challenger, challenged, isParticipant, callback){

    if (!player.settings.email){
        console.log('No email address, so cannot send challenge to ' + player.name)
        console.log(player)
        if (callback) callback('No email')
        return;
    }

    var replyTo,
        isChallenger = player._id == challenger._id;

    // if you're in the game, then the reply to will reply to the opponent
    if (isParticipant){
        replyTo = isChallenger ? challenged.settings.email : challenger.settings.email;
    }

    console.log('sending an email to ' + player.name + '(' + player.settings.email + ')');
    console.log(challenger.name + ' challenged ' + challenged.name)

    var emailDetails = {
        from : config.email.user,
        to : player.settings.email,
        subject : config.siteName + ' : ' + challenger.name + ' challenged ' + challenged.name,
        text : ' ',
        html  : isParticipant ? 
                challengeEmailBody(isChallenger ? challenged : challenger, replyTo) : 
                body()
    }

    if (replyTo) emailDetails.replyTo = replyTo;

    getTransport().sendMail(emailDetails, function(error, result){
        if (error){
            console.log('EMAIL ERROR!')
            console.log(error)
        }else{
            console.log('email result', result);
            if (callback) callback();
        }
    });
}

function challengeEmailBody(opponent, includeReplyMessage){
    var html = '<html><body><a href="http://'+config.domainName+'">'+config.domainName + '</a><br />'
    html +=  '<br /><b>' + opponent.name + '</b><br />'
    html += contactDetailsHtml(opponent)
    if (includeReplyMessage) html += '<br ><br />Hit reply to email ' + opponent.name + '.'
    html += '</body></html>';
    return html;
}

function contactDetailsHtml(player){
    var html = '';
    if (player.settings.email){
        html += 'email : ' + player.settings.email + '<br />'
    }
    if (player.settings.phoneNumber){
        html += 'phone number : ' + player.settings.phoneNumber + '<br />'
    }
    return html;
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
        if (callback) callback('No email')
        return;
    }

    console.log('sending a match report to ' + player.name)
    console.log(match)

    var emailDetails = {
        from : config.email.user,
        to : player.settings.email,
        subject : config.siteName + ' : ' + matchString(match),
        text : ' ',
        html  : body()
    }

    getTransport().sendMail(emailDetails, callback);

}

// just for testing the SMTP is all working
function sendTestEmail(to, subject, message){
    var emailDetails = {
        from : config.email.user,
        to : to,
        subject : subject || 'test email from tenn16.co.uk',
        text : message || 'test'
    }
    getTransport().sendMail(emailDetails, function(error, result){
        console.log('----- error ------')
        console.log(error)
        console.log('------result ------')
        console.log(result)
    })
}

function body(){
    return '<html><body><a href="http://'+config.domainName+'">'+config.domainName+'</a></body></html>';
}

