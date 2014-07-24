#Backbone base view

Baseview is a extension of backbone view with convenient methods for manipulating subviews, assets and events.
Every view that extends baseView is bootstrapped to act as collection view.
Methods for async requiring of static assets (javascript files and templates) are available should you choose to use them (dependent libraries have to be included).

##Api
###close
```javascript
close()
```
Calls view remove after all subviews have been closed, all event listeners in view namespace removed and all pending deferreds canceled.

###beforeClose
```javascript
beforeClose()
```
Optional hook that fires before close cleanup is performed.

###afterClose
```javascript
afterClose()
```
Optional hook that fires after close cleanup is performed.

###addSubview
```javascript
addSubview(view, group)
```
Adds subview to current view. If optional group parameter is provided adds view to subview group.

###closeSubviews
```javascript
closeSubviews(group)
```
Closes all view subviews recursively. If group is specified closes only those views belonging to subview group.

###closeSubview
```javascript
closeSubview(model)
```
Close subview by providing it's model instance.

###getSubview
```javascript
getSubview(model)
```
Get subview by providing it's model instance.

###publishEvent
```javascript
publishEvent(eventName, data)
```
Publish application wide event and provide data for it.

###subscribeToEvent
```javascript
subscribeToEvent(eventName, callback)
```
Subscribe to application wide published event.

###loadingOn
```javascript
loadingOn()
```
Append loader to current view.

###loadingOff
```javascript
loadingOf()
```
Remove loader for current view.

###onDocCancel
```javascript
onDocCancel(key, callback, $cont, unbindOnCancel)
```
Manage "document cancel events" like closing view on escape key press or click outside container.

###getTemplate
```javascript
getTemplate(templateName, templatePath, callback)
```
Stores compiled javascript template to current view under key templates[templateName] and executes callback if provided.
Returns deferred object. Alias for [templateManager](https://github.com/dbrekalo/templateManager).

###require
```javascript
require(key, callback, context)
```
Requires resource according to [repository](https://github.com/dbrekalo/repository) documentation.
After resources under key have been loaded / resolved executes callback if one is provided. Default context is view object.

###whenDone
```javascript
whenDone(resources, callbackDone, callbackFail, context)
```
Shortcut for $.when with default context set to view object for all callbacks. Additionally adds all deferreds to view objects deferreds stack so effective cleanup can be performed on close.
Accepts resources as array of deferreds or single deferred.

##Example view
```javascript

app.components.list = app.baseView.extend({

	initialize: function(options){

		this.collection = new app.collections.items();

		this.whenDone([

			this.require('app.components.listItem'),
			this.getTemplate('main', 'components/list'),
			this.collection.fetch()

		], function(){

			this.render();

			this.listenTo(this.collection, 'add', this.addItem);

			this.interval = setInterval(function(){

				this.collection.fetch();

			}.bind(this), 5*1000);

		});

	},

	render: function(){

		this.$el.html(this.templates.main());
		this.$list = this.$('.list');

		this.collection.each(function(model){

			this.addItem(model);

		}, this);

	},

	addItem: function(model){

		this.addSubview(new app.components.listItem({'model': model})).$el.appendTo(this.$list);

	},

	beforeClose: function(){

		this.interval && clearInterval(this.interval);

	}

});

```