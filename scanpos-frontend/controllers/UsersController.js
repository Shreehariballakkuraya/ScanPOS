app.controller('UsersController', ['$scope', 'UsersService', 'NotificationService', 'ErrorHandlerService', 'AuthService', function($scope, UsersService, NotificationService, ErrorHandlerService, AuthService) {
    $scope.title = 'User Management';
    $scope.users = [];
    $scope.loading = false;
    $scope.search = '';
    $scope.currentPage = 1;
    $scope.totalPages = 1;
    $scope.showForm = false;
    $scope.editMode = false;
    $scope.currentUser = {};
    
    // Check if current user is admin
    if (!AuthService.isAdmin()) {
        NotificationService.error('Access denied: Admin only');
        window.location.href = '#!/dashboard';
        return;
    }
    
    // Load users
    $scope.loadUsers = function() {
        $scope.loading = true;
        
        ErrorHandlerService.retryOperation(function() {
            return UsersService.getUsers($scope.search, $scope.currentPage);
        }, 2, 1000)
            .then(function(response) {
                $scope.users = response.data.users;
                $scope.totalPages = response.data.pages;
            })
            .catch(function(error) {
                ErrorHandlerService.handleError(error, 'Loading users');
            })
            .finally(function() {
                $scope.loading = false;
            });
    };
    
    // Search users
    $scope.searchUsers = function() {
        $scope.currentPage = 1;
        $scope.loadUsers();
    };
    
    // Show add form
    $scope.addUser = function() {
        $scope.editMode = false;
        $scope.currentUser = {
            name: '',
            email: '',
            password: '',
            role: 'cashier',
            is_active: true
        };
        $scope.showForm = true;
    };
    
    // Show edit form
    $scope.editUser = function(user) {
        $scope.editMode = true;
        $scope.currentUser = angular.copy(user);
        $scope.currentUser.password = ''; // Don't show existing password
        $scope.showForm = true;
    };
    
    // Save user
    $scope.saveUser = function() {
        if (!$scope.currentUser.name || !$scope.currentUser.email || !$scope.currentUser.role) {
            NotificationService.warning('Name, email, and role are required');
            return;
        }
        
        if (!$scope.editMode && !$scope.currentUser.password) {
            NotificationService.warning('Password is required for new users');
            return;
        }
        
        // Email validation
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test($scope.currentUser.email)) {
            NotificationService.warning('Please enter a valid email address');
            return;
        }
        
        // Password validation (only for new users or if password is provided)
        if ($scope.currentUser.password && $scope.currentUser.password.length < 6) {
            NotificationService.warning('Password must be at least 6 characters');
            return;
        }
        
        $scope.loading = true;
        var promise;
        
        if ($scope.editMode) {
            // Don't send password if empty
            var updateData = angular.copy($scope.currentUser);
            if (!updateData.password) {
                delete updateData.password;
            }
            promise = UsersService.updateUser($scope.currentUser.id, updateData);
        } else {
            promise = UsersService.createUser($scope.currentUser);
        }
        
        promise.then(function(response) {
            $scope.showForm = false;
            $scope.loadUsers();
            NotificationService.success($scope.editMode ? 'User updated successfully' : 'User created successfully');
        })
        .catch(function(error) {
            ErrorHandlerService.handleError(error, 'Saving user');
        })
        .finally(function() {
            $scope.loading = false;
        });
    };
    
    // Cancel form
    $scope.cancelForm = function() {
        $scope.showForm = false;
        $scope.currentUser = {};
    };
    
    // Toggle user active status
    $scope.toggleActive = function(user) {
        var message = user.is_active ? 'deactivate' : 'activate';
        if (!confirm('Are you sure you want to ' + message + ' user ' + user.name + '?')) {
            return;
        }
        
        UsersService.updateUser(user.id, { is_active: !user.is_active })
            .then(function(response) {
                NotificationService.success('User status updated successfully');
                $scope.loadUsers();
            })
            .catch(function(error) {
                ErrorHandlerService.handleError(error, 'Updating user status');
            });
    };
    
    // Delete user
    $scope.deleteUser = function(user) {
        if (!confirm('Are you sure you want to delete user ' + user.name + '? This action cannot be undone.')) {
            return;
        }
        
        UsersService.deleteUser(user.id)
            .then(function(response) {
                NotificationService.success('User deleted successfully');
                $scope.loadUsers();
            })
            .catch(function(error) {
                ErrorHandlerService.handleError(error, 'Deleting user');
            });
    };
    
    // Change page
    $scope.changePage = function(page) {
        if (page >= 1 && page <= $scope.totalPages) {
            $scope.currentPage = page;
            $scope.loadUsers();
        }
    };
    
    // Get role badge class
    $scope.getRoleBadgeClass = function(role) {
        return role === 'admin' ? 'bg-danger' : 'bg-primary';
    };
    
    // Initial load
    $scope.loadUsers();
}]);
