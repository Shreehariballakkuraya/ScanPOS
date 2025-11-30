// Loading Spinner Directive
app.directive('loadingSpinner', function() {
    return {
        restrict: 'E',
        scope: {
            show: '=',
            size: '@',
            message: '@',
            inline: '@'
        },
        template: 
            '<div ng-show="show" ng-class="{\'inline-loader\': inline === \'true\', \'page-loader\': inline !== \'true\'}">' +
                '<div class="spinner" ng-class="{\'spinner-sm\': size === \'sm\', \'spinner-md\': size === \'md\', \'spinner-lg\': size === \'lg\'}"></div>' +
                '<div class="loading-text" ng-if="message">{{ message }}</div>' +
            '</div>',
        link: function(scope, element, attrs) {
            // Default values
            scope.size = scope.size || 'md';
            scope.inline = scope.inline || 'true';
        }
    };
});

// Loading Overlay Directive
app.directive('loadingOverlay', function() {
    return {
        restrict: 'A',
        scope: {
            loading: '='
        },
        link: function(scope, element) {
            var overlay;
            
            scope.$watch('loading', function(newValue) {
                if (newValue) {
                    // Add relative positioning to parent
                    element.css('position', 'relative');
                    
                    // Create overlay
                    overlay = angular.element(
                        '<div class="table-loading-overlay">' +
                            '<div class="spinner spinner-md"></div>' +
                        '</div>'
                    );
                    
                    element.append(overlay);
                } else {
                    if (overlay) {
                        overlay.remove();
                        overlay = null;
                    }
                }
            });
            
            // Cleanup on destroy
            scope.$on('$destroy', function() {
                if (overlay) {
                    overlay.remove();
                }
            });
        }
    };
});

// Skeleton Loader Directive
app.directive('skeletonLoader', function() {
    return {
        restrict: 'E',
        scope: {
            rows: '@',
            type: '@'
        },
        template: 
            '<div class="skeleton-loader">' +
                '<div ng-repeat="i in getRows()" class="skeleton-item" ng-class="type"></div>' +
            '</div>',
        link: function(scope) {
            scope.rows = parseInt(scope.rows) || 3;
            scope.type = scope.type || 'text';
            
            scope.getRows = function() {
                return new Array(scope.rows);
            };
        }
    };
});
