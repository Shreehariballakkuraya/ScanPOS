app.controller('ReportsController', ['$scope', 'ReportsService', 'NotificationService', function($scope, ReportsService, NotificationService) {
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
        ReportsService.getSalesReport($scope.salesFilters.from, $scope.salesFilters.to)
            .then(function(response) {
                $scope.salesReport = response.data;
                $scope.loadingSales = false;
            })
            .catch(function(error) {
                console.error('Error loading sales report:', error);
                $scope.loadingSales = false;
                NotificationService.error('Failed to load sales report');
            });
    };
    
    // Initial load
    $scope.loadSalesReport();
}]);
