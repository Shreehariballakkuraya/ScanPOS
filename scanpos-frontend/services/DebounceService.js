/**
 * DebounceService - Optimizes performance by delaying function execution
 * 
 * Benefits:
 * - Reduces unnecessary API calls during user typing
 * - Improves application responsiveness
 * - Reduces server load and bandwidth usage
 * - Better user experience with fewer intermediate results
 * 
 * Use cases:
 * - Search inputs (wait for user to stop typing)
 * - Auto-save features
 * - Window resize handlers
 * - Scroll event handlers
 */
app.service('DebounceService', ['$timeout', function($timeout) {
    var service = this;
    var timeouts = {};
    
    /**
     * Debounce a function call
     * @param {string} key - Unique identifier for this debounce operation
     * @param {function} callback - Function to execute after delay
     * @param {number} delay - Delay in milliseconds (default: 300ms)
     */
    service.debounce = function(key, callback, delay) {
        delay = delay || 300;
        
        // Cancel existing timeout for this key
        if (timeouts[key]) {
            $timeout.cancel(timeouts[key]);
        }
        
        // Set new timeout
        timeouts[key] = $timeout(function() {
            callback();
            delete timeouts[key];
        }, delay);
    };
    
    /**
     * Cancel a pending debounced operation
     * @param {string} key - Unique identifier for the debounce operation to cancel
     */
    service.cancel = function(key) {
        if (timeouts[key]) {
            $timeout.cancel(timeouts[key]);
            delete timeouts[key];
        }
    };
    
    /**
     * Cancel all pending debounced operations
     */
    service.cancelAll = function() {
        Object.keys(timeouts).forEach(function(key) {
            $timeout.cancel(timeouts[key]);
        });
        timeouts = {};
    };
    
    /**
     * Create a debounced function that can be called multiple times
     * @param {function} func - Function to debounce
     * @param {number} delay - Delay in milliseconds
     * @returns {function} Debounced function
     */
    service.createDebounced = function(func, delay) {
        var timeout;
        delay = delay || 300;
        
        return function() {
            var context = this;
            var args = arguments;
            
            if (timeout) {
                $timeout.cancel(timeout);
            }
            
            timeout = $timeout(function() {
                func.apply(context, args);
            }, delay);
        };
    };
    
    /**
     * Throttle a function to execute at most once per specified time period
     * @param {string} key - Unique identifier
     * @param {function} callback - Function to execute
     * @param {number} limit - Time limit in milliseconds
     */
    service.throttle = function(key, callback, limit) {
        limit = limit || 300;
        
        if (!timeouts[key + '_throttle']) {
            callback();
            timeouts[key + '_throttle'] = $timeout(function() {
                delete timeouts[key + '_throttle'];
            }, limit);
        }
    };
}]);
