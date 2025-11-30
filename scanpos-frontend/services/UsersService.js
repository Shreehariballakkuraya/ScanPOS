app.service('UsersService', ['$http', 'API_URL', function($http, API_URL) {
    var service = this;
    
    // Get all users
    service.getUsers = function(search, page, pageSize) {
        var params = {
            page: page || 1,
            page_size: pageSize || 20
        };
        if (search) {
            params.search = search;
        }
        
        return $http.get(API_URL + '/api/users', { params: params });
    };
    
    // Get user by ID
    service.getUser = function(id) {
        return $http.get(API_URL + '/api/users/' + id);
    };
    
    // Create user
    service.createUser = function(user) {
        return $http.post(API_URL + '/api/users', user);
    };
    
    // Update user
    service.updateUser = function(id, user) {
        return $http.put(API_URL + '/api/users/' + id, user);
    };
    
    // Delete user
    service.deleteUser = function(id) {
        return $http.delete(API_URL + '/api/users/' + id);
    };
}]);
