#Backbone base view
Extended backbone view with convenient methods for manipulating subviews and events.
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
addView(view, group)
```
Adds target view to current view. If optional group is provided adds view to subview group.

###hasView
```javascript
hasView(view)
```
Check if target view is subview.

###getGroupViews
```javascript
getGroupViews(group)
```
Get group subviews as array

###detachView
```javascript
detachView()
```
Detach view from parent registry

###attachToView
```javascript
attachToView(view, group)
```
Detach view from parent registry and attach to another view.

###removeViews
```javascript
removeViews(group)
```
Removes all subviews recursively. If group is specified removes only views which belong to subview group.

###remove
```javascript
remove()
```
Does extended cleanup and triggers "beforeRemove" and "afterRemove" events.

###getViewByModel
```javascript
getViewByModel(model)
```
Get subview by providing it's model instance.

###removeViewByModel
```javascript
removeViewByModel(model)
```
Close subview by providing it's model instance.

###when
```javascript
when(resources, doneCallback, failCallback)
```
Shortcut for $.when with default context set to view instance for all callbacks.
Additionally adds all deferreds to view instance deferreds stack so effective cleanup can be performed on view removal.
Accepts resources as single or array of deferreds.
