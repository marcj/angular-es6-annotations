# Angular v1 EcmaScript 6+ (Traceur) Annotations


This little collection of annotations and registry functions allows you to register
directives, controllers and filter with annotations at your angular module.


You can find the Typescript version of this library here: https://github.com/marcj/angular-typescript-decorators

## Benefits

Using the DI of Angular with ecmascript 6 classes is usually a PITA. You have several ways to inject services:

1. Use normale constructor signature angular can read. This doesn't work when you minify your scripts and thus rename all variables.
2. Use `static get $inject() { return ['$compile', '$http'] }`. This is ugly and nasty to write and doesn't work with sub classes.
3. Define its dependencies in the module.directive(), module.controller() method call with the array syntax. With this you have two places to change when you change dependencies and it doesn't work well with sub classes as you have to define your parent dependencies there as well.

This annotation collection fixes this and provide you several annotations to register your dependencies, directives and filters.

## Example

### Controller

```javascript
import {registerControllerDecorator} from './registry';

var myApp = angular.module('myApp', []);
registerControllerDecorator(myApp); //this allows you to write ng-controller="es6/module/path/Controller"
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

## Sub classes

When you have sub classes where the parent class has dependencies defined you don't need to know or write those dependencies on your class again.

```javascript

@Inject('$compile')
class Animal {
    constructor($compile) {}
}

@Inject('$http')
class Tiger extends Animal {
    constructor($compile, $http) {
        super($compile);
        this.$http = $http;
    }
}

//or
@InjectAsProperty('$http')
class Snake extends Animal {
    link(scope, element, attributes){ 
        this.$http.get(...);
    }
}

```
