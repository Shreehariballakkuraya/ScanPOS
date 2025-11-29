app.service('ReportsService', ['$http', 'API_URL', function($http, API_URL) {
    var service = this;
    
    // Get sales report for date range
    service.getSalesReport = function(fromDate, toDate) {
        var params = {};
        if (fromDate) params.from = fromDate;
        if (toDate) params.to = toDate;
        
        return $http.get(API_URL + '/api/reports/sales', { params: params });
    };
    
    // Get dashboard statistics
    service.getDashboardStats = function() {
        return $http.get(API_URL + '/api/reports/dashboard');
    };
}]);
