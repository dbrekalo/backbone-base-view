;(function($, Backbone, _, window){

	"use strict";

	$.wk = $.wk || {};
	var getTemplateHandler = $.wk.getTemplate,
		require = $.wk.repo && $.wk.repo.require,
		ensCounter = 0,
		$document = window.app && window.app.$document || $(document),
		$window = window.app && window.app.$window || $(window);

	$.wk.baseView = Backbone.View.extend({

		constructor: function(){

			this.subviews = {};
			this.modelSubviews = {};

			Backbone.View.apply(this, arguments);

		},

		/* Subviews handlers
		************************************/

		close: function(options){

			this.beforeClose && this.beforeClose();

			if (options && !options.parentClosing) { this.trigger('manualClosing'); }

			this.closeSubviews();

			if (this.ens) {
				$document.off(this.ens);
				$window.off(this.ens);
			}

			if (this.onDocCancel.registry) {
				_.each(this.onDocCancel.registry, function(eventsOn, ens){
					if (eventsOn) {
						$document.off(ens);
						delete this.onDocCancel.registry[ens];
					}
				}, this);
			}

			if (this.deferreds) {
				_.each(this.deferreds, function(deferred){
					if (deferred.state() === 'pending') {
						$.wk.baseView.onCloseWithPendingDeferred(deferred);
					}
				});
			}

			this.remove();
			this.closed = true;
			this.afterClose && this.afterClose();

		},

		closeSubviews: function(group){

			if (!this.hasSubviews()){
				return;
			}

			if (group){

				_.invoke(this['subviews-'+group], 'close');
				delete this['subviews-'+group];

			} else {

				_.each( this.subviews, function(view){
					view.close({parentClosing: true});
				});

				this.subviews = {};
				this.modelSubviews = {};

			}

		},

		addSubview: function(view, group){

			this.subviews[view.cid] = view;

			if ( view.model ) {
				this.modelSubviews[view.model.cid] = view;
			}

			if (group){
				this['subviews-'+group] = this['subviews-'+group] || {};
				this['subviews-'+group][view.cid] = view;
			}

			view.on('manualClosing', _.bind(function(){

				delete this.subviews[view.cid];
				if (view.model) { delete this.modelSubviews[view.model.cid]; }
				if (group) { delete this['subviews-'+group][view.cid]; }

			}, this));

			return view;

		},

		closeSubview: function(model){

			var view = this.modelSubviews[model.cid];
			if (!view) { return false; }
			view.close();

		},

		getSubview: function( model ){

			return this.modelSubviews[model.cid] ? this.modelSubviews[model.cid] : false;

		},

		hasSubviews: function(){

			return _.size(this.subviews) > 0 ? true : false;

		},

		/* Publish / subscribe
		************************************/

		publishEvent: function(eventName, data){

			$document.trigger(eventName, [data]);

		},

		subscribeToEvent: function(eventName, callback){

			this.setupEventNamespace();
			$document.on(eventName + this.ens, _.bind(callback, this));

		},

		/* Loaders
		************************************/

		loadingOn: function(){

			this.$loadingHtml = this.$loadingHtml || $($.wk.baseView.loadingHtml).appendTo( this.$el );
			!$.contains(this.el, this.$loadingHtml[0]) &&  this.$loadingHtml.appendTo(this.$el);

			this.$loadingHtml.addClass('on');

		},

		loadingOff: function(){

			if ( this.$loadingHtml ) { this.$loadingHtml.removeClass('on'); }

		},

		/* Event handlers
		************************************/

		onDocCancel: function(key, callback, $cont, unbindOnCancel){

			this.onDocCancel.registry = this.onDocCancel.registry || {};
			this.setupEventNamespace();

			var ens = this.ens + key,
				registry = this.onDocCancel.registry,
				$el = $cont || this.$el;

			if (callback === 'off'){
				$document.off(ens);
				registry[ens] = false;
				return;
			}

			if (registry[ens]) { return; }

			$document.on('click'+ ens +' keyup' + ens, function(e) {

				if (e.keyCode === 27) { // Escape keyup
					callback();
				} else { // Click
					var $target = $(e.target);
					if( !$target.parents().is( $el ) ) { callback(); }
				}

				if (unbindOnCancel) {
					$document.off(ens);
					registry[ens] = false;
				}

			});

			registry[ens] = true;
			return this;

		},

		setupEventNamespace: function(){

			this.ens = this.ens || '.view' + (++ensCounter);
			return this;

		},

		/* Template handlers
		************************************/
		getTemplate: function(templateName, templatePath, callback){

			var self = this;
			this.templates = this.templates || {};

			var deferred = getTemplateHandler(templatePath,function(compiledTemplate){
				self.templates[templateName] = compiledTemplate;
				callback && callback.call(self, compiledTemplate);
			});

			deferred.baseViewDeferred = 'template: '+ templatePath;

			this.deferreds = this.deferreds || [];
			this.deferreds.push(deferred);

			return deferred;

		},

		/* Require handler
		************************************/
		require: function(key, callback, context){

			context || (context = this);

			var deferred = require(key, callback, context);

			deferred.baseViewDeferred = 'require: '+ key;
			this.deferreds = this.deferreds || [];
			this.deferreds.push(deferred);

			return deferred;

		},

		// Wait for asyn resources
		whenDone: function(resources, callbackDone, callbackFail, context){

			var self = this,
				deferred = $.Deferred();

			!_.isArray(resources) && (resources = [resources]);

			_.each(resources, function(resource){
				!resource.baseViewDeferred && self.deferreds.push(resource);
			});

			$.when.apply(window, resources).done(function(){

				context || (context = self);
				callbackDone && callbackDone.call(context);
				deferred.resolve();

			}).fail(function(){

				context || (context = self);
				callbackFail && callbackFail.call(context);
				deferred.reject();

			});

			return deferred;

		}

	});

	$.extend($.wk.baseView, {
		loadingHtml: '<div class="loader"><span class="graphics">Loading</span></div>',
		onCloseWithPendingDeferred: function(deferred){
			deferred.abort ? deferred.abort() : deferred.reject();
		}
	});

	if ( window.app && typeof window.app.baseView === 'undefined' ){
		window.app.baseView = $.wk.baseView;
	}

})(window.jQuery, window.Backbone, window._, window);