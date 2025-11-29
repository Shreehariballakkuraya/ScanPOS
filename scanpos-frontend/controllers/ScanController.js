app.controller('ScanController', ['$scope', '$location', '$interval', '$window', 'InvoicesService', function($scope, $location, $interval, $window, InvoicesService) {
    $scope.invoiceId = null;
    $scope.invoice = null;
    $scope.scanning = false;
    $scope.lastScan = null;
    $scope.scanCooldown = false;
    $scope.message = '';
    $scope.messageType = '';
    $scope.recentScans = [];
    
    // Get invoice ID and token from URL parameters
    var searchParams = $location.search();
    $scope.invoiceId = searchParams.invoice;
    var token = searchParams.token;
    
    // Store token in localStorage if provided
    if (token) {
        $window.localStorage.setItem('scanpos_token', token);
    }
    
    if (!$scope.invoiceId) {
        $scope.message = 'No invoice ID provided. Please scan the QR code from the billing page.';
        $scope.messageType = 'danger';
        return;
    }
    
    // Check if we have a token
    if (!$window.localStorage.getItem('scanpos_token')) {
        $scope.message = 'No authentication token. Please scan the QR code from the billing page.';
        $scope.messageType = 'danger';
        return;
    }
    
    // Load invoice details
    $scope.loadInvoice = function() {
        InvoicesService.getInvoice($scope.invoiceId)
            .then(function(response) {
                $scope.invoice = response.data.invoice;
                if ($scope.invoice.status !== 'draft') {
                    $scope.message = 'This invoice is already ' + $scope.invoice.status + '. Cannot scan more items.';
                    $scope.messageType = 'warning';
                    $scope.stopScanner();
                }
            })
            .catch(function(error) {
                console.error('Error loading invoice:', error);
                $scope.message = 'Failed to load invoice. Please check the invoice ID.';
                $scope.messageType = 'danger';
            });
    };
    
    // Start camera and barcode scanning
    $scope.startScanner = function() {
        $scope.scanning = true;
        $scope.message = 'Initializing camera...';
        $scope.messageType = 'info';
        
        // Use Quagga for barcode scanning
        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: document.querySelector('#scanner-container'),
                constraints: {
                    width: { min: 640 },
                    height: { min: 480 },
                    facingMode: "environment" // Use back camera on mobile
                }
            },
            decoder: {
                readers: [
                    "ean_reader",
                    "ean_8_reader",
                    "code_128_reader",
                    "code_39_reader",
                    "upc_reader",
                    "upc_e_reader"
                ]
            },
            locate: true
        }, function(err) {
            if (err) {
                console.error('Quagga initialization error:', err);
                $scope.message = 'Failed to access camera: ' + err.message;
                $scope.messageType = 'danger';
                $scope.$apply();
                return;
            }
            console.log("Quagga initialization finished. Ready to start");
            Quagga.start();
            $scope.message = 'Scanner ready. Point camera at barcode.';
            $scope.messageType = 'success';
            $scope.$apply();
        });
        
        // Handle barcode detection
        Quagga.onDetected(function(result) {
            var code = result.codeResult.code;
            
            // Debounce - prevent duplicate scans
            if ($scope.lastScan === code && $scope.scanCooldown) {
                return;
            }
            
            $scope.lastScan = code;
            $scope.scanCooldown = true;
            
            // Add item to invoice
            $scope.addItemByBarcode(code);
            
            // Reset cooldown after 2 seconds
            setTimeout(function() {
                $scope.scanCooldown = false;
            }, 2000);
        });
    };
    
    // Stop scanner
    $scope.stopScanner = function() {
        if ($scope.scanning) {
            Quagga.stop();
            $scope.scanning = false;
        }
    };
    
    // Add item by barcode
    $scope.addItemByBarcode = function(barcode) {
        $scope.message = 'Adding item with barcode: ' + barcode + '...';
        $scope.messageType = 'info';
        
        InvoicesService.addItem($scope.invoiceId, {
            barcode: barcode,
            quantity: 1
        })
        .then(function(response) {
            var item = response.data.item;
            $scope.message = '✓ Added: ' + item.product_name + ' (₹' + item.unit_price + ')';
            $scope.messageType = 'success';
            
            // Add to recent scans
            $scope.recentScans.unshift({
                time: new Date(),
                name: item.product_name,
                price: item.unit_price
            });
            
            // Keep only last 5 scans
            if ($scope.recentScans.length > 5) {
                $scope.recentScans.pop();
            }
            
            // Play success beep (optional)
            $scope.playBeep();
            
            $scope.$apply();
        })
        .catch(function(error) {
            console.error('Error adding item:', error);
            $scope.message = '✗ Failed: ' + (error.data && error.data.message ? error.data.message : 'Product not found');
            $scope.messageType = 'danger';
            $scope.$apply();
        });
    };
    
    // Play success beep
    $scope.playBeep = function() {
        var audioContext = new (window.AudioContext || window.webkitAudioContext)();
        var oscillator = audioContext.createOscillator();
        var gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.3;
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    };
    
    // Cleanup on controller destroy
    $scope.$on('$destroy', function() {
        $scope.stopScanner();
    });
    
    // Initialize
    $scope.loadInvoice();
}]);
