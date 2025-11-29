app.service('InvoicesService', ['$http', 'API_URL', function($http, API_URL) {
    
    // Get auth token from localStorage
    function getAuthHeader() {
        var token = localStorage.getItem('scanpos_token');
        return {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        };
    }
    
    return {
        // Create a new draft invoice
        createInvoice: function(data) {
            return $http({
                method: 'POST',
                url: API_URL + '/api/invoices',
                headers: getAuthHeader(),
                data: data || {}
            });
        },
        
        // Get invoice by ID with all items
        getInvoice: function(invoiceId) {
            return $http({
                method: 'GET',
                url: API_URL + '/api/invoices/' + invoiceId,
                headers: getAuthHeader()
            });
        },
        
        // Add item to invoice by product_id or barcode
        addItem: function(invoiceId, itemData) {
            return $http({
                method: 'POST',
                url: API_URL + '/api/invoices/' + invoiceId + '/items',
                headers: getAuthHeader(),
                data: itemData
            });
        },
        
        // Update item quantity
        updateItem: function(invoiceId, itemId, quantity) {
            return $http({
                method: 'PUT',
                url: API_URL + '/api/invoices/' + invoiceId + '/items/' + itemId,
                headers: getAuthHeader(),
                data: { quantity: quantity }
            });
        },
        
        // Delete item from invoice
        deleteItem: function(invoiceId, itemId) {
            return $http({
                method: 'DELETE',
                url: API_URL + '/api/invoices/' + invoiceId + '/items/' + itemId,
                headers: getAuthHeader()
            });
        },
        
        // Complete invoice with optional discount
        completeInvoice: function(invoiceId, discountAmount) {
            return $http({
                method: 'POST',
                url: API_URL + '/api/invoices/' + invoiceId + '/complete',
                headers: getAuthHeader(),
                data: { discount_amount: discountAmount || 0 }
            });
        },
        
        // List invoices with filters
        listInvoices: function(filters) {
            var params = [];
            if (filters) {
                if (filters.from) params.push('from=' + filters.from);
                if (filters.to) params.push('to=' + filters.to);
                if (filters.status) params.push('status=' + filters.status);
                if (filters.page) params.push('page=' + filters.page);
                if (filters.page_size) params.push('page_size=' + filters.page_size);
            }
            
            var url = API_URL + '/api/invoices';
            if (params.length > 0) {
                url += '?' + params.join('&');
            }
            
            return $http({
                method: 'GET',
                url: url,
                headers: getAuthHeader()
            });
        },
        
        // Delete invoice
        deleteInvoice: function(invoiceId) {
            return $http({
                method: 'DELETE',
                url: API_URL + '/api/invoices/' + invoiceId,
                headers: getAuthHeader()
            });
        }
    };
}]);
