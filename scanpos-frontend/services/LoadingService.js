app.service('LoadingService', ['$rootScope', function($rootScope) {
    var service = this;
    var loadingStates = {};
    
    // Show loading for a specific key
    service.show = function(key) {
        key = key || 'global';
        loadingStates[key] = true;
        $rootScope.$broadcast('loading:changed', { key: key, loading: true });
    };
    
    // Hide loading for a specific key
    service.hide = function(key) {
        key = key || 'global';
        loadingStates[key] = false;
        $rootScope.$broadcast('loading:changed', { key: key, loading: false });
    };
    
    // Check if a specific key is loading
    service.isLoading = function(key) {
        key = key || 'global';
        return loadingStates[key] || false;
    };
    
    // Check if any loading is active
    service.isAnyLoading = function() {
        return Object.values(loadingStates).some(function(state) {
            return state === true;
        });
    };
    
    // Clear all loading states
    service.clearAll = function() {
        Object.keys(loadingStates).forEach(function(key) {
            loadingStates[key] = false;
        });
        $rootScope.$broadcast('loading:cleared');
    };
    
    // Wrap an async operation with loading state
    service.wrap = function(key, asyncOperation) {
        service.show(key);
        
        return asyncOperation()
            .finally(function() {
                service.hide(key);
            });
    };
}]);
