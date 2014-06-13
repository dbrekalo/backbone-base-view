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

		close: function(parentInitiated){

			this.beforeClose && this.beforeClose();

			if ( !parentInitiated ) { this.trigger('manualClosing'); }

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
					deferred.state() === 'pending' && deferred.reject();
				});
			}

			this.remove();
			this.closed = true;
			this.afterClose && this.afterClose();

		},

		closeSubviews: function(){

			if ( !this.hasSubviews() ){ return; }
			_.each( this.subviews, function(view){ view.close('parentInitiated'); } );
			this.subviews = {};
			this.modelSubviews = {};

		},

		addSubview: function(view){

			var self = this;

			this.subviews[view.cid] = view;

			if ( view.model ) { this.modelSubviews[view.model.cid] = view; }

			view.on('manualClosing', function(){

				delete self.subviews[view.cid];
				if (view.model) { delete self.modelSubviews[view.model.cid]; }

			});

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
			$document.on(eventName + this.ens, $.proxy(callback, this));

		},

		/* Loaders
		************************************/

		loadingOn: function(){

			this.$loadingHtml = this.$loadingHtml || $('<div class="loader"><span class="graphics">Loading</span></div>').appendTo( this.$el );
			this.$loading_html.addClass('on');

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

				if (e.keyCode && e.keyCode === 27) { // Escape keyup
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

			this.deferreds = this.deferreds || [];
			this.deferreds.push(deferred);

			return deferred;

		},

		/* Require handler
		************************************/
		require: function(key, callback, context){

			var deferred = require(key, callback, context);

			this.deferreds = this.deferreds || [];
			this.deferreds.push(deferred);

			return deferred;

		}

	});

	if ( window.app && typeof window.app.baseView === 'undefined' ){
		window.app.baseView = $.wk.baseView;
	}

})(window.jQuery, window.Backbone, window._, window);