import {Filter, Parser, Directive, Inject, InjectAsProperty} from './annotations';

/**
 * Prepares a class constructor for angular depency injection.
 *
 * Searches for annotations and creates a decorator which creates the instance
 * and injects all necesarry deps.
 *
 * @param  {Function} controller
 * @return {Function}
 */
export function getPreparedConstructor(controller) {
    var parser = new Parser(controller);
    var annotations = parser.getAnnotations(Inject).reverse();
    var $inject = [];
    for (let annotation of annotations) {
        $inject = $inject.concat(annotation.deps);
    }

    var injectsViaInjectCount = $inject.length;

    var injectAsProperty = parser.getAnnotations(InjectAsProperty);
    var propertyMap = {};

    if (!injectAsProperty.length && !annotations.length) {
        return false;
    }

    for (let annotation of injectAsProperty) {
        $inject.push(annotation.propertyName);
        propertyMap[annotation.propertyName] = $inject.length - 1;
    }

    var constructor = $inject;

    constructor.push((...deps) => {
        var args = deps.slice(0, injectsViaInjectCount);
        var instance = new controller(...args);
        for (let name in propertyMap) {
            instance[name] = deps[propertyMap[name]];
        }
        return instance;
    });

    // constructor.$inject = $inject;

    return constructor;
}

/**
 * Registers a new angular filter.
 *
 * @param  angularModule created with angular.module()
 * @param  {Function} controller
 */
export function registerModuleFilter(angularModule, controller) {
    var parser = new Parser(controller);
    var annotations = parser.getAnnotations(Filter);
    if (!annotations.length) {
        throw 'No Filter annotations on class ' + controller
    }
    var FilterAnnotation = annotations[annotations.length-1];

    var constructor = getPreparedConstructor(controller);

    if (!constructor) {
        constructor = function() {
            let instance = new controller();
            return instance.filter;
        };
        angularModule.filter(FilterAnnotation.name, constructor);
    } else {
        var diFunction = constructor[constructor.length - 1];
        var overwrittenConstructor = constructor;

        overwrittenConstructor[overwrittenConstructor.length - 1] = function(...deps) {
            var instance = diFunction(...deps);
            return instance.filter.bind(instance);
        };

        angularModule.filter(FilterAnnotation.name, overwrittenConstructor);
    }
}


/**
 * Registers a new angular directive.
 *
 * @param  angularModule created with angular.module()
 * @param  {Function} controller
 */
export function registerModuleDirective(angularModule, controller) {
    var parser = new Parser(controller);
    var annotations = parser.getAnnotations(Directive);
    if (!annotations.length) {
        throw 'No Directive annotations on class ' + controller
    }

    var constructor = getPreparedConstructor(controller);
    if (!constructor) constructor = controller;

    var DirectiveAnnotation = annotations[0];

    var definition = DirectiveAnnotation.options || {};
    if (!definition.controller) {
        definition.controller = constructor;
    }

    if (!definition.link) {
        if (angular.isString(definition.require)) {
            definition.require = [definition.require];
        }

        if (angular.isArray(definition.require) && DirectiveAnnotation.name !== definition.require[0]) {
            definition.require.unshift(DirectiveAnnotation.name);
        }

        definition.link = function(scope, element, attr, ctrl, transclude) {
            var ownController, controllersToPass;
            // console.log('link', DirectiveAnnotation.name, definition.require, [ctrl]);
            if (angular.isArray(ctrl)) {
                ownController = ctrl.shift();
            } else {
                ownController = ctrl;
            }

            if (angular.isArray(ctrl) && 1 === ctrl.length) {
                ctrl = ctrl[0];
            }

            if (ownController && ownController.link) {
                ownController.link.apply(ownController, [scope, element, attr, ctrl, transclude]);
            }
        };
    }

    var options = angular.isFunction(definition) || angular.isArray(definition)
        ? definition
        : function(){ return definition; };

    angularModule.directive(
        DirectiveAnnotation.name,
        options
    );
}

/**
 * Adds the ability to load controllers based on es6 module names like 'ng-controller="myApp/controllers/MyControllerA"'.
 *
 * @param angularModule
 */
export function registerControllerDecorator(angularModule) {
    angularModule.config(function ($provide) {
        $provide.decorator("$controller", ['$delegate', ($delegate) => {
            return function (...args) {
                if (angular.isString(args[0])) {
                    try {
                        var moduleClass = System.get(args[0]);
                        if (moduleClass) {
                            var preparedConstructor = getPreparedConstructor(moduleClass.default);
                            args[0] = preparedConstructor || moduleClass.default;
                        }
                    } catch (e) {
                        throw e;
                    }
                }
                return $delegate(...args);
            };
        }]);
    });
}
