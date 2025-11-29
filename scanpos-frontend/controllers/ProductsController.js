app.controller('ProductsController', ['$scope', 'ProductsService', 'NotificationService', 'ErrorHandlerService', function($scope, ProductsService, NotificationService, ErrorHandlerService) {
    $scope.title = 'Products';
    $scope.products = [];
    $scope.loading = false;
    $scope.search = '';
    $scope.currentPage = 1;
    $scope.totalPages = 1;
    $scope.showForm = false;
    $scope.editMode = false;
    $scope.currentProduct = {};
    
    // Load products
    $scope.loadProducts = function() {
        $scope.loading = true;
        
        ErrorHandlerService.retryOperation(function() {
            return ProductsService.getProducts($scope.search, $scope.currentPage);
        }, 2, 1000)
            .then(function(response) {
                $scope.products = response.data.products;
                $scope.totalPages = response.data.pages;
            })
            .catch(function(error) {
                ErrorHandlerService.handleError(error, 'Loading products');
            })
            .finally(function() {
                $scope.loading = false;
            });
    };
    
    // Search products
    $scope.searchProducts = function() {
        $scope.currentPage = 1;
        $scope.loadProducts();
    };
    
    // Show add form
    $scope.addProduct = function() {
        $scope.editMode = false;
        $scope.currentProduct = {
            name: '',
            barcode: '',
            price: 0,
            tax_percent: 0,
            stock_qty: 0,
            is_active: true
        };
        $scope.showForm = true;
    };
    
    // Show edit form
    $scope.editProduct = function(product) {
        $scope.editMode = true;
        $scope.currentProduct = angular.copy(product);
        $scope.showForm = true;
    };
    
    // Save product
    $scope.saveProduct = function() {
        if (!$scope.currentProduct.name || !$scope.currentProduct.price) {
            NotificationService.warning('Name and price are required');
            return;
        }
        
        $scope.loading = true;
        var promise;
        if ($scope.editMode) {
            promise = ProductsService.updateProduct($scope.currentProduct.id, $scope.currentProduct);
        } else {
            promise = ProductsService.createProduct($scope.currentProduct);
        }
        
        promise.then(function(response) {
            $scope.showForm = false;
            $scope.loadProducts();
            NotificationService.success($scope.editMode ? 'Product updated successfully' : 'Product created successfully');
        })
        .catch(function(error) {
            ErrorHandlerService.handleError(error, 'Saving product');
        })
        .finally(function() {
            $scope.loading = false;
        });
    };
    
    // Cancel form
    $scope.cancelForm = function() {
        $scope.showForm = false;
        $scope.currentProduct = {};
    };
    
    // Delete product
    $scope.deleteProduct = function(product) {
        if (!confirm('Are you sure you want to delete ' + product.name + '?')) {
            return;
        }
        
        ProductsService.deleteProduct(product.id)
            .then(function(response) {
                $scope.loadProducts();
                NotificationService.success('Product deleted successfully');
            })
            .catch(function(error) {
                console.error('Error deleting product:', error);
                NotificationService.error('Failed to delete product');
            });
    };
    
    // Initial load
    $scope.loadProducts();
}]);
