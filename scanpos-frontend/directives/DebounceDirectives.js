// Debounce directive for input fields
app.directive('ngDebounce', ['$timeout', function($timeout) {
    return {
        restrict: 'A',
        require: 'ngModel',
        priority: 99,
        link: function(scope, element, attrs, ngModelCtrl) {
            var debounceDelay = parseInt(attrs.ngDebounce) || 300;
            var debouncePromise;
            
            // Override $parsers to add debouncing
            ngModelCtrl.$parsers.push(function(value) {
                if (debouncePromise) {
                    $timeout.cancel(debouncePromise);
                }
                
                debouncePromise = $timeout(function() {
                    // Trigger the change after debounce delay
                    scope.$eval(attrs.ngDebounceChange, { $value: value });
                }, debounceDelay);
                
                return value;
            });
            
            // Cleanup on destroy
            scope.$on('$destroy', function() {
                if (debouncePromise) {
                    $timeout.cancel(debouncePromise);
                }
            });
        }
    };
}]);

// Throttle directive for events
app.directive('ngThrottle', ['$timeout', function($timeout) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var throttleDelay = parseInt(attrs.ngThrottle) || 300;
            var throttleTimeout;
            var lastCall = 0;
            
            element.on(attrs.ngThrottleEvent || 'input', function(event) {
                var now = Date.now();
                var timeSinceLastCall = now - lastCall;
                
                if (timeSinceLastCall >= throttleDelay) {
                    lastCall = now;
                    scope.$apply(function() {
                        scope.$eval(attrs.ngThrottleAction, { $event: event });
                    });
                } else {
                    if (throttleTimeout) {
                        $timeout.cancel(throttleTimeout);
                    }
                    
                    throttleTimeout = $timeout(function() {
                        lastCall = Date.now();
                        scope.$eval(attrs.ngThrottleAction, { $event: event });
                    }, throttleDelay - timeSinceLastCall);
                }
            });
            
            // Cleanup
            scope.$on('$destroy', function() {
                element.off();
                if (throttleTimeout) {
                    $timeout.cancel(throttleTimeout);
                }
            });
        }
    };
}]);
