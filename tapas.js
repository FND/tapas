$(function() {
    var windowActive = true;
    var socketuri = 'http://tiddlyspace.com:8081';

    $(window).focus(function() {
        $('title').text('tapas');
        windowActive = true;
    });
    $(window).blur(function() { windowActive = false; });
    $(document).bind('tiddlersUpdate', function() {
        if (!windowActive) {
            var count = parseInt($('title').text().replace(/\s*tapas$/, '')
                || "0", 10);
            $('title').text(++count + ' tapas');
        }
    });


    $.ajaxSetup({
        beforeSend: function(xhr) {
                        xhr.setRequestHeader("X-ControlView", "false");
                    }
    });

    var calculateSize = function() {
        var empx = $('#sizer').width();
        var height = $(window).height();
        var limit = Math.floor(height/(empx * 7) - 1);
        return limit;
    };

    var getFriends = function(user) {
        $.ajax({
            dataType: 'json',
            url: '/search?q=bag:' + user + '_public' +
             '%20tag:follow%20_limit:100',
            success: function(tiddlers) {
                var friends = [];
                $.each(tiddlers, function(index, tiddler) {
                    friends.push(tiddler.title.replace(/^@/, ''));
                });
                friendSearchUrl(friends);
            }
        });
    };

    var friendSearchUrl = function(friends) {
        var search = friends.join('%20OR%20modifier:');
        var url = '/search?q=modifier:' + search;
        friendSearchSubs(friends, url);
    };

    var friendSearchSubs = function(friends, searchUrl) {
        var subs = [];
        $.each(friends, function(index, friend) {
            subs.push('modifier/' + friend);
        });
        var fbox = new Tiddlers($('#fbox'),
            socketuri,
            searchUrl,
            subs,
            {sizer: calculateSize});
        fbox.init();
    };

    var fboxSetup = function(user) {
        getFriends(user);
    };

    // meat goes here
    var init = function(status) {
        if (typeof(io) === 'undefined') {
            $('#message')
                .text('Unable to access socket server, functionality limited');
        } 
        var username = status.username;
        var upbox = new Tiddlers($('#upbox'),
                socketuri,
                '/search?q=',
                ['*'],
                {sizer: calculateSize});
        upbox.init();
        if (username !== 'GUEST') {
            var atbox = new Tiddlers($('#atbox'),
                    socketuri,
                    '/search?q=tag:@' + username,
                    ['tags/@' + username],
                    {sizer: calculateSize});
            atbox.init();
            fboxSetup(username);
        }
    };


    //init
    $.ajax({
        url: "/status",
        dataType: "json",
        success: function(data) {
            init(data); 
        },
        error: function(xhr, status, error) {
            $('#message').text('Unable to determine username');
        }
    });

});
