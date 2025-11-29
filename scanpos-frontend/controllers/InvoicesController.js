app.controller('InvoicesController', ['$scope', 'InvoicesService', function($scope, InvoicesService) {
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
        InvoicesService.listInvoices($scope.filters)
            .then(function(response) {
                $scope.invoices = response.data.invoices;
                $scope.totalPages = response.data.pages;
                $scope.loading = false;
            })
            .catch(function(error) {
                console.error('Error loading invoices:', error);
                $scope.loading = false;
                alert('Failed to load invoices');
            });
    };
    
    // View invoice details
    $scope.viewInvoice = function(invoice) {
        InvoicesService.getInvoice(invoice.id)
            .then(function(response) {
                $scope.selectedInvoice = response.data.invoice;
            })
            .catch(function(error) {
                console.error('Error loading invoice details:', error);
                alert('Failed to load invoice details');
            });
    };
    
    // Close invoice details
    $scope.closeDetails = function() {
        $scope.selectedInvoice = null;
    };
    
    // Delete invoice
    $scope.deleteInvoice = function(invoice) {
        var confirmMsg = 'Are you sure you want to delete invoice ' + invoice.invoice_number + '?';
        if (invoice.status === 'completed' && invoice.items_count > 0) {
            confirmMsg = 'WARNING: This is a completed invoice with items. Are you sure you want to delete it?';
        }
        
        if (!confirm(confirmMsg)) {
            return;
        }
        
        InvoicesService.deleteInvoice(invoice.id)
            .then(function(response) {
                alert('Invoice deleted successfully');
                $scope.loadInvoices();
                if ($scope.selectedInvoice && $scope.selectedInvoice.id === invoice.id) {
                    $scope.closeDetails();
                }
            })
            .catch(function(error) {
                console.error('Error deleting invoice:', error);
                var errorMsg = error.data && error.data.message ? error.data.message : 'Failed to delete invoice';
                alert(errorMsg);
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
