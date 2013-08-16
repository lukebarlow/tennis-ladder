var express = require('express'),
    app = express(),
    ladder = require('./src/ladder'),
    auth = require('./src/auth');

app.configure(function(){
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.cookieSession({ secret: 'tupperware', cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }}));
})

app.use('/userId', auth.userId)
app.use('/ladder', ladder.ladder)
app.get('/challenges', ladder.getChallenges)
app.use('/recentMatches', ladder.recentMatches)

app.get('/addMatch', auth.checkAuth, ladder.addMatch)
app.get('/addChallenge', auth.checkAuth, ladder.addChallenge)
app.post('/login', auth.login)
app.post('/changePassword', auth.checkAuth, auth.changePassword)
app.get('/settings', auth.checkAuth, auth.getSettings)
app.post('/saveSettings', auth.checkAuth, auth.saveSettings)
app.use('/logout', auth.logout)

app.use(express.static(__dirname + '/public'));
module.exports = app;