app.service('ErrorHandlerService', ['NotificationService', function(NotificationService) {
    var service = this;
    
    // Parse error response and return user-friendly message
    service.parseError = function(error) {
        var message = 'An unexpected error occurred';
        
        // Network errors (no response)
        if (!error || !error.status) {
            return {
                message: 'Network error: Unable to connect to server. Please check your connection.',
                isNetworkError: true,
                canRetry: true
            };
        }
        
        // Handle different status codes
        switch (error.status) {
            case 0:
                message = 'Network error: Cannot reach server. Please check your connection.';
                return { message: message, isNetworkError: true, canRetry: true };
                
            case 400:
                message = error.data?.message || error.data?.error || 'Invalid request. Please check your input.';
                return { message: message, isNetworkError: false, canRetry: false };
                
            case 401:
                message = 'Session expired. Please login again.';
                return { message: message, isNetworkError: false, canRetry: false, requiresAuth: true };
                
            case 403:
                message = 'Access denied. You do not have permission to perform this action.';
                return { message: message, isNetworkError: false, canRetry: false };
                
            case 404:
                message = error.data?.message || 'The requested resource was not found.';
                return { message: message, isNetworkError: false, canRetry: false };
                
            case 409:
                message = error.data?.message || 'Conflict: The resource already exists or is in use.';
                return { message: message, isNetworkError: false, canRetry: false };
                
            case 422:
                message = error.data?.message || 'Validation error. Please check your input.';
                return { message: message, isNetworkError: false, canRetry: false };
                
            case 500:
                message = 'Server error. Our team has been notified. Please try again later.';
                return { message: message, isNetworkError: false, canRetry: true };
                
            case 502:
            case 503:
            case 504:
                message = 'Server is temporarily unavailable. Please try again in a few moments.';
                return { message: message, isNetworkError: false, canRetry: true };
                
            default:
                message = error.data?.message || error.data?.error || 'An unexpected error occurred';
                return { message: message, isNetworkError: false, canRetry: true };
        }
    };
    
    // Handle error and show notification
    service.handleError = function(error, context) {
        var errorInfo = service.parseError(error);
        var fullMessage = context ? context + ': ' + errorInfo.message : errorInfo.message;
        
        // Show error notification
        NotificationService.error(fullMessage);
        
        // Log error details for debugging
        console.error('Error in ' + (context || 'unknown context'), {
            status: error?.status,
            statusText: error?.statusText,
            data: error?.data,
            errorInfo: errorInfo
        });
        
        return errorInfo;
    };
    
    // Retry wrapper for operations
    service.retryOperation = function(operation, maxRetries, delayMs) {
        maxRetries = maxRetries || 2;
        delayMs = delayMs || 1000;
        var retryCount = 0;
        
        function attempt() {
            return operation().catch(function(error) {
                var errorInfo = service.parseError(error);
                
                if (errorInfo.canRetry && retryCount < maxRetries) {
                    retryCount++;
                    console.log('Retrying operation... Attempt ' + (retryCount + 1) + '/' + (maxRetries + 1));
                    
                    return new Promise(function(resolve) {
                        setTimeout(resolve, delayMs);
                    }).then(attempt);
                } else {
                    throw error;
                }
            });
        }
        
        return attempt();
    };
    
    // Safe API call wrapper
    service.safeApiCall = function(apiFunction, context, showLoading) {
        if (showLoading) {
            // You can add loading state management here
        }
        
        return apiFunction()
            .catch(function(error) {
                service.handleError(error, context);
                throw error; // Re-throw so calling code can handle if needed
            })
            .finally(function() {
                if (showLoading) {
                    // Clear loading state here
                }
            });
    };
}]);
