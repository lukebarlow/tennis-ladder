function addDateToUrl(url){
    var prefix = url.indexOf('?') > -1 ? '&' : '?';
    return url + prefix + 'r=' + Date.now();
}

// global data we keep around
var players,
    matches,
    challenges,
    userId = null;

function loginRedraw(duration){
       
    userId ? hideLogin(duration) : showLogin(duration)

    d3.select('#recordAMatchButton')
        .style('display', userId ? 'block' : 'none')

    d3.selectAll('#logout, #settingsButton')
        .style('display', 'inline')
        .transition()
        .duration(duration)
        .style('opacity', userId ? 1 : 0)
        .each('end', function(d,i){
            d3.select(this).style('display', userId ? 'inline' : 'none')
        })
}


function showLogin(duration){
    d3.select('#login')
        .transition()
        .duration(duration/2)
        .style('width','23%')
        .style('min-width','220px')
        .styleTween('margin-right', function(d,i,a){
            var scale = d3.scale.linear().domain([0,1]).range([0,2]);
            return function(t){
                return scale(t) + '%';
            }
        })
        .transition()
        .duration(duration/2)
        .style('opacity','1')
        

    d3.selectAll('#ladder, #recentMatches, #challenges')
        .transition()
        .duration(duration/2)
        .styleTween('width', function(d,i,a){
            var scale = d3.scale.linear().domain([0,1]).range([31,23]);
            return function(t){
                return scale(t) + '%';
            }
        })
}

function hideLogin(duration){

    duration = duration || 0;

    if (duration){
        d3.select('#login')
        .transition()
        .duration(duration/2)
        .style('opacity','0')
        .transition()
        .duration(duration/2)
        .style('width','0px')
        .style('min-width','0px')
        .styleTween('margin-right', function(d,i,a){
            var scale = d3.scale.linear().domain([0,1]).range([2,0]);
            return function(t){
                return scale(t) + '%';
            }
        })

        d3.selectAll('#ladder, #recentMatches, #challenges')
            .transition()
            .delay(duration/2)
            .duration(duration/2)
            .styleTween('width', function(d,i,a){
                var scale = d3.scale.linear().domain([0,1]).range([23,31]);
                return function(t){
                    return scale(t) + '%';
                }
            })
        }else{
            d3.select('#login')
                .style('opacity','0')
                .style('width','0px')
                .style('min-width','0px')
                .style('margin-right','0%')
            d3.selectAll('#ladder, #recentMatches, #challenges')
                .style('width','31%')

        }

    
}


function login(name, password, callback){
    name = name || d3.select('#name').node().value;
    password = password || d3.select('#password').node().value;

    d3.text('login')
        .header("Content-type", "application/x-www-form-urlencoded")
        .post('name='+name+'&password='+password, function(error, text){
            if (text == 'false'){
                userId = null;
            }else{
                userId = text;
            }
            if (userId){
                d3.select('#name').node().value = '';
                d3.select('#password').node().value = '';
                drawLadder(players);
                loginRedraw(1000)
            }else{
                d3.select('#loginTable').call(shake)
            }
            
            initSettings();

            if (callback){
                callback();
            }
        })
}

function refresh(){
    d3.json(addDateToUrl('ladder'), function(_players){
        players = _players;
        
        d3.json(addDateToUrl('recentMatches'), function(_matches){
            matches = _matches;
            drawMatches(matches);
        })

        d3.json(addDateToUrl('challenges'), function(_challenges){
            challenges = _challenges;
            drawChallenges(challenges);
            drawLadder(players)
        })
    })
}

function shake(selection){
    selection.style('position','relative')
        .transition()
        .duration(500)
        .ease(d3.ease('linear'))
        .styleTween('left',function(d,i,a){
            return function(t){
                return -10 * Math.sin(t*Math.PI*4) + 'px'
            }
        })
}

function initSettingsButtons(){
    d3.select('#settingsButton').on('click', function(){
        showDialog('settings')
        //showDialog('changePassword')
    })

    d3.select('#changePasswordButton').on('click', function(){
        hideDialog()
        setTimeout(function(){
            showDialog('changePassword')
        },600)
    })

    d3.select('#saveNewPassword').on('click', function(){
        var oldPassword = d3.select('#oldPassword').property('value')
        var newPassword = d3.select('#newPassword').property('value')
        var confirmNewPassword = d3.select('#confirmNewPassword').property('value')

        // check that new passwords are long enough and match
        if (newPassword.length < 4 || newPassword != confirmNewPassword){
            d3.select('#changePasswordTable').call(shake);
            return;
        }

        d3.json('changePassword')
            .header("Content-type", "application/x-www-form-urlencoded")
            .post('old='+oldPassword+'&new='+newPassword, function(error, success){
                if (success){
                    hideDialog();
                }else{
                    d3.select('#changePasswordTable').call(shake);
                }
            })
    }) 
}

var checkboxIds = ['emailMyChallenge','emailAnyChallenge','emailMyMatch','emailAnyMatch']

function initSettings(){
    d3.json(addDateToUrl('settings'), function(settings){
        
        // fill the settings
        checkboxIds.forEach(function(id){
            d3.select('#' + id).property('checked', settings[id] || false)
        })
        d3.select('#email').property('value', settings.email || '')
        d3.select('#phoneNumber').property('value', settings.phoneNumber || '')
        d3.select('#saveSettings').on('click', function(){
            var settings = {
                email : d3.select('#email').property('value'),
                phoneNumber : d3.select('#phoneNumber').property('value')
            }

            checkboxIds.forEach(function(id){
                settings[id] = d3.select('#' + id).property('checked')
            })

            d3.json('saveSettings')
                .header("Content-type", "application/x-www-form-urlencoded")
                .post('settings='+JSON.stringify(settings), function(error, success){
                    hideDialog()
                })
        })
    })
}

function clearSettings(){
    checkboxIds.forEach(function(id){
        d3.select('#' + id).property('checked', false);
    });
    d3.select('#email').property('value', '');
}


function init(){

    // logging in
    d3.select('#name').on('keydown', function(){
        if (d3.event.keyCode == 13) login();
    })
    d3.select('#password').on('keydown', function(){
        if (d3.event.keyCode == 13) login();
    })
    d3.select('#loginButton').on('click', login)

    // logging out
    d3.select('#logout').on('click', function(){
        d3.text('logout', function(){
            userId = null;
            loginRedraw(1000);
            clearSettings();
            refresh();
        })
    })

    initSettingsButtons();
    initSettings();

    d3.select('#recordAMatchButton').on('click', function(){
        initNewMatch();
        showDialog('recordAMatch');
    })

    // first check userId
    d3.text('userId', function(_userId){
        userId = _userId || null;
        loginRedraw(0)
        // draw the ladder
        refresh();
    })
}