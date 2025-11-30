app.controller('InvoicesController', ['$scope', 'InvoicesService', 'NotificationService', 'ErrorHandlerService', 'AuthService', function($scope, InvoicesService, NotificationService, ErrorHandlerService, AuthService) {
    $scope.title = 'Invoices';
    $scope.invoices = [];
    $scope.loading = false;
    $scope.filters = {
        status: '',
        from: '',
        to: '',
        page: 1,
        page_size: 20
    };
    $scope.totalPages = 1;
    $scope.selectedInvoice = null;
    
    // Load invoices
    $scope.loadInvoices = function() {
        $scope.loading = true;
        
        ErrorHandlerService.retryOperation(function() {
            return InvoicesService.listInvoices($scope.filters);
        }, 2, 1000)
            .then(function(response) {
                $scope.invoices = response.data.invoices;
                $scope.totalPages = response.data.pages;
            })
            .catch(function(error) {
                ErrorHandlerService.handleError(error, 'Loading invoices');
            })
            .finally(function() {
                $scope.loading = false;
            });
    };
    
    // View invoice details
    $scope.viewInvoice = function(invoice) {
        InvoicesService.getInvoice(invoice.id)
            .then(function(response) {
                $scope.selectedInvoice = response.data.invoice;
            })
            .catch(function(error) {
                ErrorHandlerService.handleError(error, 'Loading invoice details');
            });
    };
    
    // Close invoice details
    $scope.closeDetails = function() {
        $scope.selectedInvoice = null;
    };
    
    // Delete invoice
    $scope.deleteInvoice = function(invoice) {
        // Check if user is admin
        if (!AuthService.isAdmin()) {
            NotificationService.error('Access denied: Only admins can delete invoices');
            return;
        }
        
        var confirmMsg = 'Are you sure you want to delete invoice ' + invoice.invoice_number + '?';
        if (invoice.status === 'completed' && invoice.items_count > 0) {
            confirmMsg = 'WARNING: This is a completed invoice with items. Are you sure you want to delete it?';
        }
        
        if (!confirm(confirmMsg)) {
            return;
        }
        
        InvoicesService.deleteInvoice(invoice.id)
            .then(function(response) {
                NotificationService.success('Invoice deleted successfully');
                $scope.loadInvoices();
                if ($scope.selectedInvoice && $scope.selectedInvoice.id === invoice.id) {
                    $scope.closeDetails();
                }
            })
            .catch(function(error) {
                ErrorHandlerService.handleError(error, 'Deleting invoice');
            });
    };
    
    // Apply filters
    $scope.applyFilters = function() {
        $scope.filters.page = 1;
        // Format dates properly if they exist
        if ($scope.filters.from && $scope.filters.from instanceof Date) {
            $scope.filters.from = $scope.filters.from.toISOString().split('T')[0];
        }
        if ($scope.filters.to && $scope.filters.to instanceof Date) {
            $scope.filters.to = $scope.filters.to.toISOString().split('T')[0];
        }
        $scope.loadInvoices();
    };
    
    // Clear filters
    $scope.clearFilters = function() {
        $scope.filters = {
            status: '',
            from: '',
            to: '',
            page: 1,
            page_size: 20
        };
        $scope.loadInvoices();
    };
    
    // Pagination
    $scope.nextPage = function() {
        if ($scope.filters.page < $scope.totalPages) {
            $scope.filters.page++;
            $scope.loadInvoices();
        }
    };
    
    $scope.prevPage = function() {
        if ($scope.filters.page > 1) {
            $scope.filters.page--;
            $scope.loadInvoices();
        }
    };
    
    // Initial load
    $scope.loadInvoices();
}]);
