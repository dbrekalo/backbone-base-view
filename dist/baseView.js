(function(root, factory) {

    if (typeof define === 'function' && define.amd) {
        define(['jquery', 'backbone', 'underscore'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('jquery'), require('backbone'), require('underscore'));
    } else {
        root.BaseView = factory(root.jQuery, root.Backbone, root._);
    }

}(this, function($, Backbone, _) {

    var root = this;
    var variableInEventStringRE = /{{(\S+)}}/g;
    var parseEventString = function(eventString, context) {

        return eventString.replace(variableInEventStringRE, function(match, namespace) {

            var isInCurrentContext = namespace.indexOf('this.') === 0,
                current = isInCurrentContext ? context : root,
                pieces = (isInCurrentContext ? namespace.slice(5) : namespace).split('.');

            for (var i in pieces) {
                current = current[pieces[i]];
                if (typeof current === 'undefined') {
                    throw new Error('Undefined variable in event string');
                }
            }

            return current;

        });

    };

    var BaseView = Backbone.View.extend({

        constructor: function(options) {

            if (this.assignOptions) {
                var defaults = _.result(this, 'defaults');
                this.options = this.assignOptions === 'deep' ? $.extend(true, {}, defaults, options) : _.extend({}, defaults, options);
            }

            Backbone.View.apply(this, arguments);
            this.events && this.setupEvents();

        },

        delegatedEvents: true,
        assignOptions: false,

        setupEvents: function(eventsMap) {

            var eventNamespace = this.ens = this.ens || '.' + this.cid;
            var events = eventsMap || this.events;
            var self = this;
            var specialSelectors = {
                'window': window,
                'document': window.document
            };

            _.each(typeof events === 'function' ? events.call(this) : events, function(handler, eventString) {

                eventString = parseEventString(eventString, self);

                var isOneEvent = eventString.indexOf('one:') === 0,
                    splitEventString = (isOneEvent ? eventString.slice(4) : eventString).split(' '),
                    eventName = splitEventString[0] + eventNamespace,
                    eventSelector = splitEventString.slice(1).join(' '),
                    $el = self.$el;

                if (specialSelectors[eventSelector]) {
                    $el = self['$' + eventSelector] = self['$' + eventSelector] || $(specialSelectors[eventSelector]);
                    eventSelector = undefined;
                } else if (!self.delegatedEvents) {
                    (self.elementsWithBoundEvents = self.elementsWithBoundEvents || []).push($el = $el.find(eventSelector));
                    eventSelector = undefined;
                }

                $el[isOneEvent ? 'one' : 'on'](eventName, eventSelector, function() {
                    (typeof handler === 'function' ? handler : self[handler]).apply(self, arguments);
                });

            });

            return this;

        },

        addDismissListener: function(listenerName, options) {

            var self = this;

            if (!listenerName) {
                throw new Error('Dismiss listener name not speficied');
            }

            options = $.extend({$el: this.$el}, options);

            this.$document = this.$document || $(document);
            this.ens = this.ens || '.' + this.cid;
            this.dismissListeners = this.dismissListeners || {};

            if (!this.dismissListeners[listenerName]) {

                this.dismissListeners[listenerName] = function(e) {

                    if (e.keyCode === 27 || (!$(e.target).is(options.$el) && !$.contains(options.$el.get(0), e.target))) {
                        self[listenerName].call(self);
                    }

                };

                this.$document.on('click' + this.ens + ' keyup' + this.ens, this.dismissListeners[listenerName]);

            }

            return this;

        },

        removeDismissListener: function(listenerName) {

            if (!listenerName) {
                throw new Error('Name of dismiss listener to remove not specified');
            }

            if (this.dismissListeners && this.dismissListeners[listenerName]) {
                this.$document.off('click keyup', this.dismissListeners[listenerName]);
                delete this.dismissListeners[listenerName];
            }

            return this;

        },

        removeEvents: function() {

            var eventNamespace = this.ens;

            if (eventNamespace) {

                this.$el && this.$el.off(eventNamespace);
                this.$document && this.$document.off(eventNamespace);
                this.$window && this.$window.off(eventNamespace);

                if (this.elementsWithBoundEvents) {
                    _.each(this.elementsWithBoundEvents, function($el) {
                        $el.off(eventNamespace);
                    });
                    delete this.elementsWithBoundEvents;
                }

                delete this.dismissListeners;

            }

            return this;

        },

        addView: function(view, group) {

            this.views = this.views || {};
            this.views[view.cid] = view;

            if (view.model) {
                this.viewsWithModel = this.viewsWithModel || {};
                this.viewsWithModel[view.model.cid] = view;
            }

            if (group) {
                this.viewsGroups = this.viewsGroups || {};
                this.viewsGroups[group] = this.viewsGroups[group] || {};
                this.viewsGroups[group][view.cid] = view;
            }

            this.listenToOnce(view, 'afterRemove detachView', function() {

                delete this.views[view.cid];

                if (view.model && this.viewsWithModel) {
                    delete this.viewsWithModel[view.model.cid];
                }

                if (group && this.viewsGroups && this.viewsGroups[group]) {
                    delete this.viewsGroups[group][view.cid];
                }

            });

            return view;

        },

        getGroupViews: function(groupName) {

            return this.viewsGroups && this.viewsGroups[groupName] ? _.values(this.viewsGroups[groupName]) : [];

        },

        hasView: function(view) {

            return this.views && Boolean(this.views[view.cid]);

        },

        detachView: function() {

            this.trigger('detachView');
            return this;

        },

        attachToView: function(view, group) {

            this.detachView();
            view.addView(this, group);
            return this;

        },

        removeViews: function(group) {

            if (group) {

                if (this.viewsGroups && this.viewsGroups[group]) {
                    _.invoke(this.viewsGroups[group], 'remove');
                    delete this.viewsGroups[group];
                }

            } else {

                this.views && _.invoke(this.views, 'remove');

                delete this.views;
                delete this.viewsWithModel;
                delete this.viewsGroups;

            }

            return this;

        },

        getViewByModel: function(model) {

            return this.viewsWithModel && this.viewsWithModel[model.cid];

        },

        removeViewByModel: function(model) {

            this.viewsWithModel && this.viewsWithModel[model.cid] && this.viewsWithModel[model.cid].remove();
            return this;

        },

        addDeferred: function(deferred) {

            this.deferreds = this.deferreds || [];

            _.indexOf(this.deferreds, deferred) < 0 && this.deferreds.push(deferred);

            return deferred;

        },

        abortDeferreds: function() {

            this.deferreds && _.each(this.deferreds, function(deferred) {

                if (typeof deferred === 'object' && deferred.state && deferred.state() === 'pending') {
                    deferred.abort ? deferred.abort() : deferred.reject();
                }

            });

            delete this.deferreds;

            return this;

        },

        when: function(resources, doneCallback, failCallback) {

            _.each(resources = _.isArray(resources) ? resources : [resources], function(resource) {
                this.addDeferred(resource);
            }, this);

            var deferred = $.when.apply(root, resources);
            doneCallback && deferred.done(_.bind(doneCallback, this));
            failCallback && deferred.fail(_.bind(failCallback, this));

            return deferred;

        },

        remove: function() {

            this.trigger('beforeRemove');
            this.removeEvents().abortDeferreds().removeViews();
            Backbone.View.prototype.remove.call(this);
            this.trigger('afterRemove');

            return this;
        },

        setElement: function(element) {

            this._setElement(element);

            return this;

        }

    });

    _.extend(BaseView.prototype, {
        undelegateEvents: BaseView.prototype.removeEvents,
        delegateEvents: BaseView.prototype.setupEvents
    });

    _.each(['appendTo', 'prependTo', 'insertBefore', 'insertAfter'], function(methodName) {

        BaseView.prototype[methodName] = function(selector) {
            this.$el[methodName](selector instanceof BaseView ? selector.$el : selector);
            return this;
        };

    });

    return BaseView;

}));
