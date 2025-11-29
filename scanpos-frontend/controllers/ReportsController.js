app.controller('ReportsController', ['$scope', 'ReportsService', 'NotificationService', 'ErrorHandlerService', function($scope, ReportsService, NotificationService, ErrorHandlerService) {
    $scope.title = 'Reports & Analytics';
    
    // Sales Analytics
    $scope.salesReport = null;
    $scope.loadingSales = false;
    
    // Set default date range (last 30 days)
    var today = new Date();
    var thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    $scope.salesFilters = {
        from: thirtyDaysAgo.toISOString().split('T')[0],
        to: today.toISOString().split('T')[0]
    };
    
    // Load sales report
    $scope.loadSalesReport = function() {
        $scope.loadingSales = true;
        
        ErrorHandlerService.retryOperation(function() {
            return ReportsService.getSalesReport($scope.salesFilters.from, $scope.salesFilters.to);
        }, 2, 1000)
            .then(function(response) {
                $scope.salesReport = response.data;
            })
            .catch(function(error) {
                ErrorHandlerService.handleError(error, 'Loading sales report');
            })
            .finally(function() {
                $scope.loadingSales = false;
            });
    };
    
    // Initial load
    $scope.loadSalesReport();
}]);
