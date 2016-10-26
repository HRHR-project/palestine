//Controller for column show/hide
trackerCapture.controller('LeftBarMenuController',
        function($scope,
                $location) {
    $scope.showHome = function(){
        selection.load();
        $location.url($location.path('/'));
    }; 
    
    $scope.showReportTypes = function(){
        $location.path('/report-types').search();
    };
});