# Backbone base view
[![Build Status](https://travis-ci.org/dbrekalo/backbone-base-view.svg?branch=master)](https://travis-ci.org/dbrekalo/backbone-base-view)
[![Coverage Status](https://coveralls.io/repos/github/dbrekalo/backbone-base-view/badge.svg?branch=master)](https://coveralls.io/github/dbrekalo/backbone-base-view?branch=master)
[![NPM Status](https://img.shields.io/npm/v/backbone-base-view.svg)](https://www.npmjs.com/package/backbone-base-view)

Backbone view extension with enhanced event handling and convenient helpers for handling sub-views.
Compose view components with simple and easy to use api.
Weighs less than 3KB.

BaseView extends backbone view events functionality so you can bind one time events,
inject variables into event strings and setup global window and document listeners that will be properly unbound once view is removed.
Enables easy composition of views with simple parent-child and model binding api that keeps you safe from memory leaks.

## Examples and api

### events
Define one time events, inject variables and add window and document listeners.
```js
events: {
    'click .selector': 'handler',
    'click {{this.someVariable}}': 'handler', // variable will be injected
    'one:submit form': 'oneSubmit', // handler will run only once
    'resize window': 'onWindowResize',
    'keyup document': 'onDocumentKeyup'
}
```
---

### assignOptions: false|true|'deep'
If defined user passed options will be merged with defaults and written to viewInstance.options. False by default.
```js
var View = BaseView.extend({
    assignOptions: true,
    defaults: {test: 1},
    initialize: function() {
        console.log(this.options); // outputs {foo:'bar', test: 1}
    }
});
var view = new View({foo:'bar'});
```
---

### Options type checking and validation
Options provided by type defaults and and constructor parameters can be type checked and validated.
```js
var MusicianView = BaseView.extend({
    optionRules: {
        instrument: String,
        age: {type: Number, default: 18, validator: function(age) {
            return age >= 18;
        }},
        mentorView: {type: BaseView, required: false}
    }
});
```
---

### delegatedEvents: true|false
View event handlers are delegated to instance element by default. Set to false to bind directly to elements found via event string selector.
```js
var View = BaseView.extend({
    delegatedEvents: false,
    events: {
        'click .selector': 'handler'
    }
});
var view = new View({foo:'bar'});
```
---

### addDismissListener(listenerName)
When escape key is pressed or something outside of view.$el is clicked view.listenerName will be invoked.
```js
...
open: function() {
    this.$el.addClass('active');
    this.addDismissListener('close');
}
close: function() {
    this.$el.removeClass('active');
    this.removeDismissListener('close');
}
...
```
---

### removeDismissListener(listenerName)
Use to remove dismiss listeners. See example above.

---

### addView(view, groupName)
Use to setup parent-child view relationship. Child view is added to parent view group if groupName is specified.
```js
...
initialize: function() {
    this.collection.each(function(model) {
        this.addView(new ChildView, 'itemList');
    }, this);
}
...
```
---

### getGroupViews(groupName)
Retrieve child views stored in parent group as array.
```js
...
render: function() {
    _.each(this.getGroupViews('itemList'), function(subView) {
        subView.render();
    });
}
...
```
---

### removeViews(viewGroup)
Removes all sub views. If viewGroup is specified removes only group views.
```js
parentView.removeViews('itemList');
```
---

### remove()
Does extended cleanup and triggers "beforeRemove" and "afterRemove" events on view instance.
```js
view.remove();
```
---

### getViewByModel(model)
Get parent sub-view by providing it's model instance.
```js
var childView = parentView.getViewByModel(model);
```
---

### removeViewByModel(model)
Close sub-view by providing it's model instance.
```js
parentView.removeViewByModel(model);
```
---

### hasView(childView)
Check if parent view has child sub-view.
```js
console.log(parentView.hasView(childView));
```
---

### detachView()
Detach view from parent sub-view registry.
```js
childView.detachView();
```
---

### attachToView(parentView, group)
Detach view from parent sub-view registry and attach to another view.
```js
childView.attachToView(parentView)
```
---

### appendTo(view)
Append view.$el to another view.$el. Other available methods are 'prependTo', 'insertBefore', 'insertAfter'.
```js
view.appendTo(parentView);
```
---

### when(resources, doneCallback, failCallback)
Shortcut for $.when with default context set to view instance for all callbacks.
Additionally adds all deferreds to view instance deferreds stack so effective cleanup can be performed on view removal.
Accepts resources as single or array of deferreds.


## Installation
Backbone base view is packaged as UMD library so you can use it in CommonJS and AMD environment or with browser globals.

```bash
npm install backbone-base-view --save
```

```js
// with bundlers
var BaseView = require('backbone-base-view');

// with browser globals
var BaseView = window.BaseView;
```
