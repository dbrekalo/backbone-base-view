;(function($, Backbone, window){

	"use strict";

	$.wk = $.wk || {};
	var getTemplateHandler = $.wk.getTemplate,
		ensCounter = 0,
		$document = window.app && window.app.$document || $(document),
		$window = window.app && window.app.$window || $(window);

	$.wk.baseView = Backbone.View.extend({

		constructor: function(){

			this.subviews = {};
			this.noModelViewCounter = 0;

			Backbone.View.apply(this, arguments);

		},

		/* Subviews handlers
		************************************/

		close: function(parentInitiated){

			if ( !parentInitiated ) { this.trigger('manualClosing'); }

			if ( this.hasSubviews() ){
				_.each(this.subviews, function(view){ view.close('parentInitiated'); });
			}

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

			this.beforeClose && this.beforeClose();

			this.remove();

		},

		closeSubviews: function(){

			if ( !this.hasSubviews() ){ return; }
			_.each( this.subviews, function(view){ view.close('parentInitiated'); } );
			this.subviews = {};

		},

		addSubview: function(view){

			var self = this;

			if ( view.model ) { this.subviews[view.model.cid] = view; }
			else { this.subviews['noModelView' + (++this.noModelViewCounter)] = view; }

			view.on('manualClosing', function(){ delete self.subviews[view.model.cid]; });

			return view;

		},

		removeSubview: function(model){

			if (!this.subviews[model.cid]) { return false; }

			this.subviews[model.cid].close('parentInitiated');
			delete this.subviews[model.cid];

		},

		getSubview: function( model ){

			return this.subviews[model.cid] ? this.subviews[model.cid] : false;

		},

		hasSubviews: function(){

			return _.size(this.subviews) > 0 ? true : false;

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

			var deffered = getTemplateHandler(templatePath,function(compiledTemplate){
				self.templates[templateName] = compiledTemplate;
				callback && callback.call(self, compiledTemplate);
			});

			return deffered;

		}

	});

})(window.jQuery, window.Backbone, window);