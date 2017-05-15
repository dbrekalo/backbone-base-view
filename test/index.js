var assert = require('chai').assert;
var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var BaseView = require('../');

var $el;

beforeEach(function() {
    $('body').html(
        '<div class="guestbook">' +
            '<form>' +
                '<input class="entryInput" placeholder="Type here..." type="text">' +
                '<button type="submit">+</button>' +
            '</form>' +
            '<div class="entryList"></div>' +
        '</div>'
    );
    $el = $('.guestbook');
});

describe('BaseView constructor', function() {

    it('assigns defaults to options', function() {

        var View = BaseView.extend({
            assignOptions: true,
            defaults: {test: true},
        });

        var view = new View({el: $el, test2: false});

        assert.deepEqual(view.options, {el: $el, test: true, test2: false});

    });

    it('assigns defaults defined via function to options', function() {

        var View = BaseView.extend({
            assignOptions: true,
            defaults: function() {
                return {test: true};
            }
        });

        var view = new View({el: $el});

        assert.deepEqual(view.options, {el: $el, test: true});

    });

    it('assigns deep extended options', function() {

        var View = BaseView.extend({
            assignOptions: 'deep',
            defaults: {tree: {branch: {leaf1: true}}}
        });

        var view = new View({
            el: $el,
            tree: {branch: {leaf2: false}}
        });

        assert.deepEqual(view.options, {el: $el, tree: {branch: {leaf1: true, leaf2: false}}});

    });

});

describe('BaseView events', function() {

    it('can be defined as function or pointer to view function', function(done) {

        var View = BaseView.extend({
            events: {
                'submit form': 'submitForm',
                'click form': function() {
                    this.formIsClicked = true;
                },
            },
            submitForm: function(e) {
                e.preventDefault();
                this.formIsSubmited = true;
            }
        });

        var view = new View({el: $el});

        $el.find('form').trigger('submit').trigger('click');

        setTimeout(function() {
            assert.isTrue(view.formIsSubmited);
            assert.isTrue(view.formIsClicked);
            done();
        }, 100);

    });

    it('can be defined from hash produced by function', function(done) {

        var View = BaseView.extend({
            events: function() {
                return {'submit form': 'submitForm'};
            },
            submitForm: function(e) {
                e.preventDefault();
                this.formIsSubmited = true;
            }
        });

        var view = new View({el: $el});

        $el.find('form').trigger('submit');

        setTimeout(function() {
            assert.isTrue(view.formIsSubmited);
            done();
        }, 100);

    });

    it('can be undefined when produced by function', function() {

        var View = BaseView.extend({
            events: function() {
                return undefined;
            }
        });

        var view = new View({el: $el});

        assert.isUndefined(view.ens);

    });

    it('can be defined as one time events', function(done) {

        var clickCounter = 0;

        var View = BaseView.extend({
            events: {
                'one:click form': function(e) {
                    e.preventDefault();
                    clickCounter++;
                }
            }
        });

        new View({el: $el});

        $el.find('form').trigger('click').trigger('click').trigger('click');

        setTimeout(function() {
            assert.equal(clickCounter, 1);
            done();
        }, 100);

    });

    it('can be defined with injected instance variables', function(done) {

        var View = BaseView.extend({
            initialize: function() {
                this.formSelector = 'form';
            },
            events: {
                'submit {{this.formSelector}}': function(e) {
                    e.preventDefault();
                    this.formIsSubmited = true;
                }
            }
        });

        var view = new View({el: $el});

        $el.find('form').trigger('submit');

        setTimeout(function() {
            assert.isTrue(view.formIsSubmited);
            done();
        }, 100);

    });

    it('can be defined with injected global variables', function(done) {

        window.formSelector = 'form';

        var View = BaseView.extend({
            events: {
                'submit {{formSelector}}': function(e) {
                    e.preventDefault();
                    this.formIsSubmited = true;
                }
            }
        });

        var view = new View({el: $el});

        $el.find('form').trigger('submit');

        window.formSelector = undefined;

        setTimeout(function() {
            assert.isTrue(view.formIsSubmited);
            done();
        }, 100);

    });

    it('throws error when injected variable is not defined', function() {

        var View1 = BaseView.extend({
            events: {
                'submit {{formSelector}}': function() {}
            }
        });

        var View2 = BaseView.extend({
            events: {
                'submit {{this.formSelector}}': function() {}
            }
        });

        assert.throws(function() {
            new View1({el: $el});
        });

        assert.throws(function() {
            new View2({el: $el});
        });

    });

    it('are bound directly when delegated events are set to false', function(done) {

        var View = BaseView.extend({
            delegatedEvents: false,
            events: {
                'submit form': function(e) {
                    e.preventDefault();
                    assert.strictEqual(e.delegateTarget, $el.find('form').get(0));
                    done();
                }
            }
        });

        new View({el: $el});

        $el.find('form').trigger('submit');

    });

    it('are properly handled when called with special selectors (window or document)', function(done) {

        var View = BaseView.extend({
            events: {
                'resize window': function(e) {
                    this.windowIsResized = true;
                },
                'click document': function(e) {
                    this.documentIsClicked = true;
                }
            }
        });

        var view = new View({el: $el});

        $(document).trigger('click');
        $(window).trigger('resize');

        setTimeout(function() {
            assert.isTrue(view.windowIsResized);
            assert.isTrue(view.documentIsClicked);
            done();
        }, 100);

    });

    it('executes dismiss listener when clicked outside view', function(done) {

        var View = BaseView.extend({
            open: function() {
                this.isOpened = true;
                return this.addDismissListener('close');
            },
            close: function() {
                this.isOpened = false;
                this.timesClosed = this.timesClosed || 0;
                this.timesClosed++;
                this.removeDismissListener('close');
            }
        });

        var view = new View({el: $el}).open();

        $(document).trigger('click').trigger('click').trigger('click');

        setTimeout(function() {
            assert.strictEqual(view.isOpened, false);
            assert.strictEqual(view.timesClosed, 1);
            done();
        }, 100);

    });

    it('executes dismiss listener with custom element container defined', function(done) {

        var View = BaseView.extend({
            open: function() {
                this.isOpened = true;
                this.addDismissListener('close', {$el: this.$('form')});
                return this;
            },
            close: function() {
                this.isOpened = false;
                this.removeDismissListener('close');
            }
        });

        var view = new View({el: $el}).open();

        view.$el.trigger('click');

        setTimeout(function() {
            assert.strictEqual(view.isOpened, false);
            done();
        }, 100);

    });

    it('executes dismiss listener on escape key', function(done) {

        var View = BaseView.extend({
            openMenu: function() {
                this.isOpened = true;
                return this.addDismissListener('closeMenu');
            },
            closeMenu: function() {
                this.isOpened = false;
                this.removeDismissListener('closeMenu');
            }
        });

        var view = new View({el: $el}).openMenu();

        var e = $.Event('keyup');
        e.which = e.keyCode = 27;
        $(document).trigger(e);

        setTimeout(function() {
            assert.strictEqual(view.isOpened, false);
            done();
        }, 100);

    });

    it('dismiss listener throws error when callback name is not specified', function() {

        var View = BaseView.extend({
            open: function() {
                this.isOpened = true;
                return this.addDismissListener();
            },
            close: function() {
                this.isOpened = false;
                this.removeDismissListener();
            }
        });

        var view = new View({el: $el});

        assert.throws(function() {
            view.open();
        });

        assert.throws(function() {
            view.close();
        });

    });

    it('can be removed and cleaned up', function(done) {

        var View = BaseView.extend({
            delegatedEvents: false,
            events: {
                'click form': function(e) {
                    e.preventDefault();
                    this.formIsClicked = true;
                },
                'resize window': function(e) {
                    this.windowIsResized = true;
                },
                'click document': function(e) {
                    this.documentIsClicked = true;
                }
            }
        });

        var view = new View({el: $el});

        view.removeEvents();

        $el.find('form').trigger('click');
        $(document).trigger('click');
        $(window).trigger('resize');

        setTimeout(function() {
            assert.isUndefined(view.formIsClicked);
            assert.isUndefined(view.windowIsResized);
            assert.isUndefined(view.documentIsClicked);
            done();
        }, 100);

    });

});

describe('BaseView utilities', function() {

    it('provides addDeferred method for registering deferreds', function() {

        var view = new BaseView({el: $el});
        var deferred = $.Deferred();
        var returnValue = view.addDeferred(deferred);

        assert.equal(view.deferreds.length, 1);
        assert.strictEqual(returnValue, deferred);

    });

    it('provides abortDeferreds method for canceling all pending deferreds', function() {

        var view = new BaseView({el: $el});
        var deferred = $.Deferred();
        var anotherDeferred = $.Deferred();

        anotherDeferred.abort = function() {};

        view.when([deferred, anotherDeferred, true, 5, {}], function() {
            this.deferredsDone = true;
        });

        view.abortDeferreds();

        deferred.resolve();

        assert.isUndefined(view.deferredsDone);

    });

    describe('provides when method as $.when syntax sugar', function() {

        it('accepts single deferred and done callback', function(done) {

            var view = new BaseView({el: $el});
            var deferred = $.Deferred();

            var returnValue = view.when(deferred, function() {
                assert.strictEqual(this, view);
                done();
            });

            assert.isFunction(returnValue.done);
            deferred.resolve();

        });

        it('accepts array of deferreds and done callback', function(done) {

            var view = new BaseView({el: $el});
            var deferred = $.Deferred();

            view.when([deferred, true, 5, {}], function() {
                assert.strictEqual(this, view);
                done();
            });

            deferred.resolve();

        });

        it('accepts single deferred and fail callback', function(done) {

            var view = new BaseView({el: $el});
            var deferred = $.Deferred();

            view.when(deferred, undefined, function() {
                assert.strictEqual(this, view);
                done();
            });

            deferred.reject();

        });

    });

});

describe('BaseView subviews', function() {

    it('can be added to parent registry', function() {

        var ParentView = BaseView.extend({});
        var ChildView = BaseView.extend({});

        var parentView = new ParentView({el: $el});
        var childView = parentView.addView(new ChildView({el: parentView.$('form')}));

        assert.isTrue(parentView.hasView(childView));

    });

    it('can be removed by parent', function() {

        var parentView = new BaseView({el: $el});

        parentView.addView(new BaseView({el: parentView.$('form')}));
        parentView.removeViews();

        assert.isUndefined(parentView.views);

    });

    it('can be removed by child remove call', function() {

        var parentView = new BaseView({el: $el});
        var childView = parentView.addView(new BaseView({el: parentView.$('form')}));

        childView.remove();

        assert.isFalse(parentView.hasView(childView));

    });

    it('can be retrieved by model ', function() {

        var model = new Backbone.Model();
        var parentView = new BaseView({el: $el});
        var childView = parentView.addView(new BaseView({
            el: parentView.$('form'),
            model: model
        }));

        assert.strictEqual(childView, parentView.getViewByModel(model));

    });

    it('can be removed by model reference', function() {

        var model = new Backbone.Model();
        var parentView = new BaseView({el: $el});
        var childView = parentView.addView(new BaseView({
            el: parentView.$('form'),
            model: model
        }));

        parentView.removeViewByModel(model);

        assert.isFalse(parentView.hasView(childView));
        assert.isTrue(_.size(parentView.viewsWithModel) === 0);

    });

    it('can be grouped and retrived by group name', function() {

        var parentView = new BaseView({el: $el});
        var childView = parentView.addView(new BaseView({el: parentView.$('form')}), 'testGroup');

        assert.deepEqual(parentView.getGroupViews('testGroup'), [childView]);
        assert.deepEqual(parentView.getGroupViews('undefinedGroup'), []);

        childView.remove();

        assert.deepEqual(parentView.getGroupViews('testGroup'), []);

    });

    it('can be removed by parent when in group ', function() {

        var parentView = new BaseView({el: $el});
        parentView.addView(new BaseView({el: parentView.$('form')}), 'testGroup');
        parentView.addView(new BaseView({el: parentView.$('form')}), 'testGroup');

        parentView.removeViews('testGroup');

        assert.deepEqual(parentView.getGroupViews('testGroup'), []);

    });

    it('can be detached from parent registry', function() {

        var parentView1 = new BaseView({el: $el});
        var parentView2 = new BaseView({el: $el});
        var childView = parentView1.addView(new BaseView());

        childView.attachToView(parentView2);

        assert.isFalse(parentView1.hasView(childView));
        assert.isTrue(parentView2.hasView(childView));

    });

    it('can be manipulated with jquery inspired methods ', function() {

        var parentView = new BaseView({el: $el});

        parentView.addView(new BaseView({className: 'testChild'})).appendTo(parentView);
        parentView.addView(new BaseView({className: 'testChild'})).prependTo(parentView.$el);

        assert.isTrue(parentView.$el.children('.testChild').length === 2);

    });

});
