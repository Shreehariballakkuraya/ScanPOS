app.service('ProductsService', ['$http', '$window', 'API_URL', function($http, $window, API_URL) {
    var service = this;
    
    // Get all products
    service.getProducts = function(search, page, pageSize) {
        var params = {
            page: page || 1,
            page_size: pageSize || 20
        };
        if (search) {
            params.search = search;
        }
        
        return $http.get(API_URL + '/api/products', { params: params });
    };
    
    // Get product by ID
    service.getProduct = function(id) {
        return $http.get(API_URL + '/api/products/' + id);
    };
    
    // Create product
    service.createProduct = function(product) {
        return $http.post(API_URL + '/api/products', product);
    };
    
    // Update product
    service.updateProduct = function(id, product) {
        return $http.put(API_URL + '/api/products/' + id, product);
    };
    
    // Delete product
    service.deleteProduct = function(id) {
        return $http.delete(API_URL + '/api/products/' + id);
    };
    
    // Get product by barcode
    service.getProductByBarcode = function(barcode) {
        return $http.get(API_URL + '/api/products/by-barcode/' + barcode);
    };
}]);
