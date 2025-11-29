app.controller('ProductsController', ['$scope', 'ProductsService', 'NotificationService', function($scope, ProductsService, NotificationService) {
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
        ProductsService.getProducts($scope.search, $scope.currentPage)
            .then(function(response) {
                $scope.products = response.data.products;
                $scope.totalPages = response.data.pages;
                $scope.loading = false;
            })
            .catch(function(error) {
                console.error('Error loading products:', error);
                $scope.loading = false;
                NotificationService.error('Failed to load products');
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
        
        var promise;
        if ($scope.editMode) {
            promise = ProductsService.updateProduct($scope.currentProduct.id, $scope.currentProduct);
        } else {
            promise = ProductsService.createProduct($scope.currentProduct);
        }
        
        promise.then(function(response) {
            $scope.showForm = false;
            $scope.loadProducts();
            alert($scope.editMode ? 'Product updated successfully' : 'Product created successfully');
        })
        .catch(function(error) {
            console.error('Error saving product:', error);
            var errorMsg = error.data && error.data.message ? error.data.message : 'Failed to save product';
            NotificationService.error(errorMsg);
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
