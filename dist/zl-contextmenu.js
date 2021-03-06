;(function ContextMenu($angular, $document) {

  "use strict"

  /**
   * @module ngContextMenu
   * @author Adam Timberlake
   * @link https://github.com/Wildhoney/ngContextMenu
   */
  var module = $angular.module('zlContextMenu', [])

  /**
   * @module ngContextMenu
   * @service ContextMenu
   * @author Adam Timberlake
   * @link https://github.com/Wildhoney/ngContextMenu
   */
  module.factory('contextMenu', ['$rootScope', function contextMenuService($rootScope) {

    /**
     * @method cancelAll
     * @return {void}
     */
    function cancelAll() {
      $rootScope.$broadcast('context-menu/close')
    }

    return {
      cancelAll: cancelAll,
      eventBound: false
    }

  }])

  /**
   * @module ngContextMenu
   * @directive contextMenu
   * @author Adam Timberlake
   * @link https://github.com/Wildhoney/ngContextMenu
   */
  module.directive('contextMenu', ['$http', '$templateCache', '$interpolate', '$compile', 'contextMenu', '$timeout',

    function contextMenuDirective($http, $templateCache, $interpolate, $compile, contextMenu, $timeout) {

      return {

        /**
         * @property restrict
         * @type {String}
         */
        restrict: 'EA',

        /**
         * @property scope
         * @type {Boolean}
         */
        scope: true,

        /**
         * @property require
         * @type {String}
         */
        require: '?ngModel',

        /**
         * @method link
         * @param {Object} scope
         * @param {angular.element} element
         * @param {Object} attributes
         * @param {Object} model
         * @return {void}
         */
        link: function link(scope, element, attributes, model) {

          if (!contextMenu.eventBound) {

            // Bind to the `document` if we haven't already.
            $document.addEventListener('click', function click() {
              contextMenu.cancelAll()
              // scope.$apply()
            });

            contextMenu.eventBound = true;

          }

          /**
           * @method closeMenu
           * @return {void}
           */
          function closeMenu() {

            if (scope.menu) {
              scope.menu.remove()
              scope.menu = null
              scope.position = null
            }

          }

          scope.$on('context-menu/close', closeMenu)

          /**
           * @method getModel
           * @return {Object}
           */
          function getModel() {
            return model ? $angular.extend(scope, model.$modelValue) : scope
          }

          /**
           * @method render
           * @param {Object} event
           * @param {String} [strategy="append"]
           * @return {void}
           */
          function render(event, strategy) {

            strategy = strategy || 'append'

            if ('preventDefault' in event) {

              contextMenu.cancelAll()
              event.stopPropagation()
              event.preventDefault()
              scope.position = {
                x: event.clientX,
                y: event.clientY
              }

            } else {

              if (!scope.menu) {
                return
              }

            }

            $http.get(attributes.contextMenu, {
              cache: $templateCache
            }).then(function then(response) {

              var interpolated = $interpolate(response.data)($angular.extend(getModel())),
                      compiled = $compile(interpolated)(scope),
                          menu = $angular.element(compiled)


              $timeout(function () {
                // Determine whether to append new, or replace an existing.
                switch (strategy) {
                  case ('append'):
                    window.document.body.appendChild(menu[0])
                    break
                  default:
                    scope.menu.replaceWith(menu)
                    break
                }
                var x = scope.position.x,
                  y = scope.position.y
                var offsetWidth =  menu.prop('offsetWidth'),
                  offsetHeight =  menu.prop('offsetHeight')
                var positionMenuRight = x + offsetWidth,
                  positionMenuTop = y + offsetHeight

                // if the div of the context-menu is out of the screen on the right, invert the x position
                if(document.documentElement.offsetWidth < positionMenuRight){
                  x = x - offsetWidth
                }
                // if the div of the context-menu is out of the screen on the bottom, invert the y position
                if(document.documentElement.offsetHeight < positionMenuTop){
                  y = y - (offsetHeight)
                }

                menu.css({
                  position: 'fixed',
                  top: $interpolate('{{y}}px')({
                    y: y
                  }),
                  left: $interpolate('{{x}}px')({
                    x:x
                  })
                })
                scope.menu = menu
                scope.menu.bind('click', closeMenu)
              })

            });

          }
          if (model) {
            var listener = function listener() {
              return model.$modelValue
            }
            // Listen for updates to the model...
            scope.$watch(listener, function modelChanged() {
              render({}, 'replaceWith')
            }, true)
          }
          element.bind(attributes.contextEvent || 'contextmenu', render)
        }
      }
    }
  ])

})(window.angular, window.document);
