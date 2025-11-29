app.controller('BillingController', ['$scope', '$interval', 'InvoicesService', 'ProductsService', 'NotificationService', function($scope, $interval, InvoicesService, ProductsService, NotificationService) {
    $scope.title = 'Billing';
    $scope.invoice = null;
    $scope.items = [];
    $scope.products = [];
    $scope.selectedProduct = null;
    $scope.quantity = 1;
    $scope.searchText = '';
    $scope.discount = 0;
    $scope.loading = false;
    $scope.polling = null;
    
    // Initialize - but don't create invoice yet
    $scope.init = function() {
        // Just initialize variables, invoice will be created when first item is added
        $scope.invoice = null;
        $scope.items = [];
        $scope.selectedProduct = null;
        $scope.quantity = 1;
        $scope.searchText = '';
        $scope.discount = 0;
    };
    
    // Create invoice if it doesn't exist
    $scope.createInvoiceIfNeeded = function() {
        if ($scope.invoice) {
            // Invoice already exists
            return Promise.resolve($scope.invoice);
        }
        
        $scope.loading = true;
        return InvoicesService.createInvoice()
            .then(function(response) {
                $scope.invoice = response.data.invoice;
                $scope.items = [];
                $scope.loading = false;
                // Generate QR code for mobile scanner
                $scope.generateQRCode();
                // Start polling for updates
                $scope.startPolling();
                return $scope.invoice;
            })
            .catch(function(error) {
                console.error('Error creating invoice:', error);
                NotificationService.error('Failed to create invoice');
                $scope.loading = false;
                throw error;
            });
    };
    
    // Generate QR code for mobile scanner
    $scope.generateQRCode = function() {
        if (!$scope.invoice) return;
        
        // Clear existing QR code
        var qrcodeContainer = document.getElementById('qrcode');
        if (qrcodeContainer) {
            qrcodeContainer.innerHTML = '';
            
            // Get JWT token from localStorage
            var token = localStorage.getItem('scanpos_token');
            
            // Generate scan URL with invoice ID and token
            var scanUrl = window.location.origin + '/#!/scan?invoice=' + $scope.invoice.id + '&token=' + token;
            
            // Create QR code
            new QRCode(qrcodeContainer, {
                text: scanUrl,
                width: 200,
                height: 200,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });
        }
    };
    
    // Search products
    $scope.searchProducts = function() {
        if (!$scope.searchText || $scope.searchText.length < 2) {
            $scope.products = [];
            return;
        }
        
        ProductsService.getProducts($scope.searchText, 1, 10)
            .then(function(response) {
                $scope.products = response.data.products;
            })
            .catch(function(error) {
                console.error('Error searching products:', error);
            });
    };
    
    // Select product from search
    $scope.selectProduct = function(product) {
        $scope.selectedProduct = product;
        $scope.searchText = product.name;
        $scope.products = [];
    };
    
    // Add product to invoice
    $scope.addProduct = function() {
        if (!$scope.selectedProduct) {
            NotificationService.warning('Please select a product');
            return;
        }
        
        if ($scope.quantity <= 0) {
            NotificationService.warning('Quantity must be greater than 0');
            return;
        }
        
        // Create invoice first if it doesn't exist
        $scope.createInvoiceIfNeeded()
            .then(function() {
                return InvoicesService.addItem($scope.invoice.id, {
                    product_id: $scope.selectedProduct.id,
                    quantity: $scope.quantity
                });
            })
            .then(function(response) {
                // Refresh invoice to get updated items
                $scope.refreshInvoice();
                // Clear selection
                $scope.selectedProduct = null;
                $scope.searchText = '';
                $scope.quantity = 1;
            })
            .catch(function(error) {
                console.error('Error adding product:', error);
                var errorMsg = error.data && error.data.message ? error.data.message : 'Failed to add product';
                NotificationService.error(errorMsg);
            });
    };
    
    // Update item quantity
    $scope.updateQuantity = function(item) {
        if (item.quantity <= 0) {
            if (confirm('Remove this item?')) {
                $scope.deleteItem(item);
            } else {
                // Restore quantity
                $scope.refreshInvoice();
            }
            return;
        }
        
        InvoicesService.updateItem($scope.invoice.id, item.id, item.quantity)
            .then(function(response) {
                $scope.refreshInvoice();
            })
            .catch(function(error) {
                console.error('Error updating quantity:', error);
                var errorMsg = error.data && error.data.message ? error.data.message : 'Failed to update quantity';
                NotificationService.error(errorMsg);
                $scope.refreshInvoice();
            });
    };
    
    // Delete item
    $scope.deleteItem = function(item) {
        InvoicesService.deleteItem($scope.invoice.id, item.id)
            .then(function(response) {
                $scope.refreshInvoice();
            })
            .catch(function(error) {
                console.error('Error deleting item:', error);
                NotificationService.error('Failed to delete item');
            });
    };
    
    // Refresh invoice data
    $scope.refreshInvoice = function() {
        if (!$scope.invoice) return;
        
        InvoicesService.getInvoice($scope.invoice.id)
            .then(function(response) {
                $scope.invoice = response.data.invoice;
                $scope.items = response.data.invoice.items;
            })
            .catch(function(error) {
                console.error('Error refreshing invoice:', error);
            });
    };
    
    // Start polling for updates (every 2 seconds)
    $scope.startPolling = function() {
        $scope.polling = $interval(function() {
            if ($scope.invoice && $scope.invoice.status === 'draft') {
                $scope.refreshInvoice();
            }
        }, 2000);
    };
    
    // Stop polling
    $scope.stopPolling = function() {
        if ($scope.polling) {
            $interval.cancel($scope.polling);
            $scope.polling = null;
        }
    };
    
    // Complete invoice
    $scope.completeInvoice = function() {
        if (!$scope.invoice) {
            NotificationService.warning('No invoice to complete. Please add items first.');
            return;
        }
        
        if (!$scope.items || $scope.items.length === 0) {
            NotificationService.warning('Cannot complete invoice with no items. Please add at least one product.');
            return;
        }
        
        if (!confirm('Complete this invoice?')) {
            return;
        }
        
        InvoicesService.completeInvoice($scope.invoice.id, $scope.discount)
            .then(function(response) {
                $scope.invoice = response.data.invoice;
                $scope.items = response.data.invoice.items;
                $scope.stopPolling();
                NotificationService.success('Invoice completed successfully! Invoice #' + $scope.invoice.invoice_number);
                // Optionally redirect or create new invoice
                if (confirm('Create new invoice?')) {
                    $scope.init();
                }
            })
            .catch(function(error) {
                console.error('Error completing invoice:', error);
                var errorMsg = error.data && error.data.message ? error.data.message : 'Failed to complete invoice';
                NotificationService.error(errorMsg);
            });
    };
    
    // Calculate totals (display only, actual calculation on backend)
    $scope.getSubtotal = function() {
        if (!$scope.invoice) return 0;
        // Calculate from items for real-time update
        if ($scope.items && $scope.items.length > 0) {
            var subtotal = 0;
            $scope.items.forEach(function(item) {
                subtotal += item.line_subtotal || 0;
            });
            return subtotal;
        }
        return $scope.invoice.subtotal_amount || 0;
    };
    
    $scope.getTotalTax = function() {
        if (!$scope.invoice) return 0;
        // Calculate from items for real-time update
        if ($scope.items && $scope.items.length > 0) {
            var tax = 0;
            $scope.items.forEach(function(item) {
                tax += item.line_tax || 0;
            });
            return tax;
        }
        return $scope.invoice.total_tax || 0;
    };
    
    $scope.getGrandTotal = function() {
        var subtotal = $scope.getSubtotal();
        var tax = $scope.getTotalTax();
        return subtotal + tax - ($scope.discount || 0);
    };
    
    // Print invoice
    $scope.printInvoice = function() {
        if (!$scope.invoice) return;
        
        // Store print flag to show print-friendly view
        var printWindow = window.open('', '_blank');
        var invoiceHtml = generatePrintHTML();
        printWindow.document.write(invoiceHtml);
        printWindow.document.close();
        
        // Wait for content to load, then print
        printWindow.onload = function() {
            printWindow.print();
        };
    };
    
    // Generate HTML for printing
    function generatePrintHTML() {
        var invoice = $scope.invoice;
        var items = $scope.items;
        
        var html = '<!DOCTYPE html>';
        html += '<html><head>';
        html += '<title>Invoice ' + invoice.invoice_number + '</title>';
        html += '<style>';
        html += 'body { font-family: Arial, sans-serif; margin: 20px; }';
        html += '.invoice-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }';
        html += '.invoice-header h1 { margin: 0; color: #333; }';
        html += '.invoice-info { margin-bottom: 20px; }';
        html += '.invoice-info table { width: 100%; }';
        html += '.invoice-info td { padding: 5px; }';
        html += '.items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }';
        html += '.items-table th, .items-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }';
        html += '.items-table th { background-color: #f8f9fa; font-weight: bold; }';
        html += '.items-table td.number { text-align: right; }';
        html += '.totals { margin-top: 30px; float: right; width: 300px; }';
        html += '.totals table { width: 100%; }';
        html += '.totals td { padding: 8px; }';
        html += '.totals .total-row { font-size: 1.2em; font-weight: bold; border-top: 2px solid #333; }';
        html += '.footer { margin-top: 100px; text-align: center; font-size: 0.9em; color: #666; border-top: 1px solid #ddd; padding-top: 20px; clear: both; }';
        html += '@media print { body { margin: 0; } }';
        html += '</style>';
        html += '</head><body>';
        
        // Header
        html += '<div class="invoice-header">';
        html += '<h1>ScanPOS Invoice</h1>';
        html += '<p>Invoice #: ' + invoice.invoice_number + '</p>';
        html += '</div>';
        
        // Invoice Info
        html += '<div class="invoice-info">';
        html += '<table>';
        html += '<tr><td><strong>Date:</strong></td><td>' + new Date(invoice.created_at).toLocaleString() + '</td></tr>';
        html += '<tr><td><strong>Status:</strong></td><td>' + invoice.status.toUpperCase() + '</td></tr>';
        if (invoice.completed_at) {
            html += '<tr><td><strong>Completed:</strong></td><td>' + new Date(invoice.completed_at).toLocaleString() + '</td></tr>';
        }
        html += '</table>';
        html += '</div>';
        
        // Items Table
        html += '<table class="items-table">';
        html += '<thead><tr>';
        html += '<th>Product</th>';
        html += '<th class="number">Qty</th>';
        html += '<th class="number">Price</th>';
        html += '<th class="number">Tax %</th>';
        html += '<th class="number">Tax</th>';
        html += '<th class="number">Total</th>';
        html += '</tr></thead><tbody>';
        
        items.forEach(function(item) {
            html += '<tr>';
            html += '<td>' + item.product_name + '</td>';
            html += '<td class="number">' + item.quantity + '</td>';
            html += '<td class="number">₹' + item.unit_price + '</td>';
            html += '<td class="number">' + item.tax_percent + '%</td>';
            html += '<td class="number">₹' + item.line_tax.toFixed(2) + '</td>';
            html += '<td class="number">₹' + item.line_total.toFixed(2) + '</td>';
            html += '</tr>';
        });
        
        html += '</tbody></table>';
        
        // Totals
        html += '<div class="totals">';
        html += '<table>';
        html += '<tr><td>Subtotal:</td><td class="number">₹' + invoice.subtotal_amount.toFixed(2) + '</td></tr>';
        html += '<tr><td>Tax:</td><td class="number">₹' + invoice.total_tax.toFixed(2) + '</td></tr>';
        if (invoice.discount_amount > 0) {
            html += '<tr><td>Discount:</td><td class="number">-₹' + invoice.discount_amount.toFixed(2) + '</td></tr>';
        }
        html += '<tr class="total-row"><td>Grand Total:</td><td class="number">₹' + invoice.total_amount.toFixed(2) + '</td></tr>';
        html += '</table>';
        html += '</div>';
        
        // Footer
        html += '<div class="footer">';
        html += '<p>Thank you for your business!</p>';
        html += '<p>ScanPOS Billing System</p>';
        html += '</div>';
        
        html += '</body></html>';
        return html;
    }
    
    // Cleanup on controller destroy
    $scope.$on('$destroy', function() {
        $scope.stopPolling();
    });
    
    // Initialize on load
    $scope.init();
}]);
