/*jslint vars: true */
/*global jQuery, io */

var Tiddlers = jQuery(function($) {

    "use strict";

    var urlFromBag = function(bag) {
        var index = bag.indexOf('_public');
        var space = '';
        if (index >= 0) {
            space = bag.substr(0, index) + '.';
        }
        // XXX: hostname!
        return 'http://' + space + 'tiddlyspace.com';
    };

    var urlFromUser = function(username) {
        return 'http://' + username + '.tiddlyspace.com';
    };

    var dateString = function(date) {
        return new Date(Date.UTC(
            parseInt(date.substr(0, 4), 10),
            parseInt(date.substr(4, 2), 10) - 1,
            parseInt(date.substr(6, 2), 10),
            parseInt(date.substr(8, 2), 10),
            parseInt(date.substr(10, 2), 10),
            parseInt(date.substr(12, 2) || "0", 10),
            parseInt(date.substr(14, 3) || "0", 10)
            )).toISOString();
    };

    var Tiddlers = function(el, socketuri, sourceuri, updater, options) {
        this.el = el;
        this.source = sourceuri + ';sort=modified';
        this.updater = updater;
        if (options.sizer) {
            this.sizer = options.sizer;
        } else {
            this.sizer = function() {
                return 6; // if no sizer, so show 5 things
            };
        }
        if (typeof(io) !== 'undefined') {
            this.socket = io.connect(socketuri,
                    {'force new connection': true});
            var self = this;
            this.socket.on('connect', function() {
                console.log('re-connect for', self.updater);
                $.each(self.updater, function(index, sub) {
                    self.socket.emit('unsubscribe', sub);
                    self.socket.emit('subscribe', sub);
                });
                self.socket.on('tiddler', function(data) {
                    self.getTiddler(data);
                });
            });
        }
    };

    $.extend(Tiddlers.prototype, {
        queue: [],
        push: function(tiddler) {
            this.queue.push(tiddler);
            this.updateUI();
        },

        updateUI: function() {
            var tiddler = this.queue.shift(),
                href = tiddler.uri,
                tiddlerDate = dateString(tiddler.modified);

            var link = $('<a>').attr({'href': href,
                target: '_blank'}).text(tiddler.title);

            var abbr = $('<abbr>').attr({'class': 'timeago',
                title: tiddlerDate}).text(tiddlerDate);
            // set timeago explicitly as it is not "live" ready
            abbr.timeago();

            var modurl = urlFromUser(tiddler.modifier);
            var modlink = $('<a>').attr({'href': modurl, target: '_blank'});
            var modIcon = $('<img>').attr({'class': 'modicon',
                src: modurl + '/SiteIcon',
                alt: tiddler.modifier});
            modlink.append(modIcon);

            var spaceurl = urlFromBag(tiddler.bag);
            var spacelink = $('<a>').attr({'href': spaceurl,
                target: '_blank'});
            var spaceIcon = $('<img>').attr({'class': 'spaceicon',
                src: spaceurl + '/SiteIcon',
                alt: tiddler.bag});
            spacelink.append(spaceIcon);

            var li = $('<li>')
                .append(link)
                .append(abbr)
                .prepend(spacelink)
                .prepend(modlink);

            this.el.trigger('tiddlersUpdate');
            this.el.prepend(li);
            var children = this.el.children();
            while (children.length > this.sizer()) {
                children.last().remove();
                children = this.el.children();
            }
        },

        getTiddler: function(uri) {
            var self = this;
            $.ajax({
                dataType: 'json',
                url: uri,
                success: function(tiddler) {
                    self.push(tiddler);
                }
            });
        },

        init: function() {
            var self = this;
            $.ajax({
                dataType: 'json',
                url: this.source,
                success: function(tiddlers) {
                    $.each(tiddlers, function(index, tiddler) {
                        self.push(tiddler);
                    });
                }
            });
        }

    });

    return Tiddlers;
});
