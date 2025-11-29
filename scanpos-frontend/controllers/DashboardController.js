app.controller('DashboardController', ['$scope', function($scope) {
    $scope.title = 'Dashboard';
    
    // Placeholder data - will be populated with real data later
    $scope.stats = {
        todaySales: 0,
        weekSales: 0,
        invoiceCount: 0
    };
}]);
