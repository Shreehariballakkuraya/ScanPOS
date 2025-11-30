/**
 * Role-Based Access Control Directives
 * 
 * Usage:
 * - has-role="admin" - Show element only if user has admin role
 * - has-any-role="['admin', 'cashier']" - Show if user has any of the specified roles
 * - hide-for-role="cashier" - Hide element if user has cashier role
 */

// Show element only if user has specified role
app.directive('hasRole', ['AuthService', function(AuthService) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var requiredRole = attrs.hasRole;
            
            function updateVisibility() {
                if (AuthService.hasRole(requiredRole)) {
                    element.show();
                } else {
                    element.hide();
                }
            }
            
            // Initial check
            updateVisibility();
            
            // Watch for auth changes
            scope.$watch(function() {
                return AuthService.getUserRole();
            }, updateVisibility);
        }
    };
}]);

// Show element if user has any of the specified roles
app.directive('hasAnyRole', ['AuthService', function(AuthService) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var roles = scope.$eval(attrs.hasAnyRole);
            
            function updateVisibility() {
                if (AuthService.hasAnyRole(roles)) {
                    element.show();
                } else {
                    element.hide();
                }
            }
            
            // Initial check
            updateVisibility();
            
            // Watch for auth changes
            scope.$watch(function() {
                return AuthService.getUserRole();
            }, updateVisibility);
        }
    };
}]);

// Hide element for specified role
app.directive('hideForRole', ['AuthService', function(AuthService) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var role = attrs.hideForRole;
            
            function updateVisibility() {
                if (AuthService.hasRole(role)) {
                    element.hide();
                } else {
                    element.show();
                }
            }
            
            // Initial check
            updateVisibility();
            
            // Watch for auth changes
            scope.$watch(function() {
                return AuthService.getUserRole();
            }, updateVisibility);
        }
    };
}]);

// Disable element based on role
app.directive('disableForRole', ['AuthService', function(AuthService) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var role = attrs.disableForRole;
            
            function updateState() {
                if (AuthService.hasRole(role)) {
                    element.prop('disabled', true);
                    element.addClass('disabled');
                } else {
                    element.prop('disabled', false);
                    element.removeClass('disabled');
                }
            }
            
            // Initial check
            updateState();
            
            // Watch for auth changes
            scope.$watch(function() {
                return AuthService.getUserRole();
            }, updateState);
        }
    };
}]);

// Show element only for admin
app.directive('adminOnly', ['AuthService', function(AuthService) {
    return {
        restrict: 'A',
        link: function(scope, element) {
            function updateVisibility() {
                if (AuthService.isAdmin()) {
                    element.show();
                } else {
                    element.hide();
                }
            }
            
            updateVisibility();
            
            scope.$watch(function() {
                return AuthService.getUserRole();
            }, updateVisibility);
        }
    };
}]);

// Show element only for cashier
app.directive('cashierOnly', ['AuthService', function(AuthService) {
    return {
        restrict: 'A',
        link: function(scope, element) {
            function updateVisibility() {
                if (AuthService.isCashier()) {
                    element.show();
                } else {
                    element.hide();
                }
            }
            
            updateVisibility();
            
            scope.$watch(function() {
                return AuthService.getUserRole();
            }, updateVisibility);
        }
    };
}]);
