# Angular EcmaScript 6+ (Traceur) Annotations


This little collection of annotations and registry functions allows you to register
directives, controllers and filter with annotations at your angular module.


## Example

### Controller

```javascript
import {registerControllerDecorator} from './registry';

var myApp = angular.module('myApp', []);
registerControllerDecorator(myApp);
```

```javascript
// myapp/controller/MainController.js
import {Inject} from './annotations';

@Inject('$scope, $parse')
export default class MainController {
    constructor($scope, $parse) {

    }
}
```

```html
<body ng-controller="myapp/controller/MainController">
</body>
```

### Directives

```javascript
import {registerModuleDirective} from './registry';

var myApp = angular.module('myApp', []);

import MyDirective from './directives/MyDirective';
registerModuleDirective(myApp, MyDirective);
```

```javascript
// myapp/directives/MyDirective.js
import {Inject, InjectAsProperty, Directive} from './annotations';

@Inject('$compile, $http')
@InjectAsProperty('$q')
@Directive('myDirective', {
    restrict: 'E',
    scope: true,
    require: '?^myDirective'
})
export default class MyDirective {
    constructor($compile, $http) {
        this.http = $http;
        this.compile = compile;
    }

    link(scope, element, attributes, parentMyDirective) {
        this.$q //now available through @InjectAsProperty

        if (parentMyDirective) {
            parentMyDirective.addChildren(this);
        }
    }

    addChildren(myDirective) {
        this.children.push(myDirective);
    }
}
```

```html
<my-directive>
    <my-directive></my-directive>
</my-directive>
```

