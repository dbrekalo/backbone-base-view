(function(root, factory) {

    if (typeof define === 'function' && define.amd) {
        define(['jquery', 'backbone', 'underscore'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('jquery'), require('backbone'), require('underscore'));
    } else {
        root.BaseView = factory(root.jQuery, root.Backbone, root._);
    }

}(this, function($, Backbone, _) {

    var root = this,
        viewCounter = 0,
        variableInEventStringRE = /{{(\S+)}}/g,
        parseEventString = function(eventString, context) {

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

        constructor: function() {

            Backbone.View.apply(this, arguments);
            this.events && this.setupEvents();

        },

        delegatedEvents: true,

        setupEvents: function(eventsMap) {

            var eventNamespace = this.ens = this.ens || '.' + this.cid,
                events = eventsMap || this.events,
                self = this,
                specialSelectors = {
                    'window': root,
                    'document': root.document
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
                    this.elementsWithBoundEvents = null;
                }

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

            this.listenTo(view, 'afterRemove', function() {

                delete this.views[view.cid];

                if (this.viewsWithModel) {
                    delete this.viewsWithModel[view.model.cid];
                }

                if (group && this.viewsGroups && this.viewsGroups[group]) {
                    delete this.viewsGroups[group][view.cid];
                }

            });

            return view;

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

            return $.when.apply(root, resources)
                .done(_.bind(doneCallback, this))
                .fail(_.bind(failCallback, this));

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

    BaseView.prototype.undelegateEvents = BaseView.prototype.removeEvents;
    BaseView.prototype.delegateEvents = BaseView.prototype.setupEvents;

    return BaseView;

}));
