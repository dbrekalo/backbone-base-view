#Backbone base view
Baseview is a extended backbone view with convenient methods for manipulating subviews and events.
Every view that extends baseView is bootstrapped to act as collection view.

###events
```javascript
events: {
    'click .selector': 'handler',
    'click {{this.someVariable}}': 'handler', // variable will be injected
    'one:submit form': 'oneSubmit', // handler will run only once
    'resize window': 'onWindowResize',
    'keyup document': 'onDocumentKeyup'
}
```
###addView
```javascript
addSubview(view, group)
```
Adds subview to current view. If optional group parameter is provided adds view to subview group.

###removeViews
```javascript
removeViews(group)
```
Removes all view subviews recursively. If group is specified removes only views which belong to subview group.

###removeViewByModel
```javascript
removeViewByModel(model)
```
Close subview by providing it's model instance.

###getViewByModel
```javascript
getViewByModel(model)
```
Get subview by providing it's model instance.

###when
```javascript
when(resources, doneCallback, failCallback)
```
Shortcut for $.when with default context set to view instance for all callbacks.
Additionally adds all deferreds to view instance deferreds stack so effective cleanup can be performed on view removal.
Accepts resources as single or array of deferreds.
