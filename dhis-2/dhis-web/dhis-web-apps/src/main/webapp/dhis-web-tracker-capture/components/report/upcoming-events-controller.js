trackerCapture.controller('UpcomingEventsController',
         function($scope,
                $modal,
                $location,
                $translate,
                DateUtils,                
                Paginator,
                EventReportService,
                TEIGridService,
                AttributesFactory,
                ProgramFactory,
                CurrentSelection,
                MetaDataFactory) {
    $scope.today = DateUtils.getToday();
    $scope.programStagesById ={};
    $scope.selectedOuMode = 'SELECTED';
    $scope.report = {};
    $scope.displayMode = {};
    $scope.printMode = false;
    $scope.backPath = '/'+ (($location.search()).returnview ?($location.search()).returnview : '');

    $scope.model = { selectedProgram: null};
    //get optionsets
    $scope.optionSets = CurrentSelection.getOptionSets();
    if(!$scope.optionSets){
        $scope.optionSets = [];
        MetaDataFactory.getAll('optionSets').then(function(optionSets){
            angular.forEach(optionSets, function(optionSet){  
                $scope.optionSets[optionSet.id] = optionSet;
            });
            CurrentSelection.setOptionSets($scope.optionSets);
        });
    }
    
    //get attributes
    $scope.attributesById = CurrentSelection.getAttributesById();
    if(!$scope.attributesById){
        AttributesFactory.getAll().then(function(atts){
            $scope.attributes = [];  
            $scope.attributesById = [];
            angular.forEach(atts, function(att){
                $scope.attributesById[att.id] = att;
            });
            CurrentSelection.setAttributesById($scope.attributesById);
        });
    }
    
    //Paging
    $scope.pager = {pageSize: 50, page: 1, toolBarDisplay: 5};
    
    //TODO: Add logic to update the select when OrgUnit is changed.
    function resetProgramSelect(){

    };
    
    //watch for selection of org unit from tree
    $scope.$watch('selectedOrgUnit', function() {
        if( angular.isObject($scope.selectedOrgUnit)){
            //Resets select when OrgUnit is changed.
            resetProgramSelect();
            $scope.loadPrograms($scope.selectedOrgUnit);
        }
    });
    
    //load programs associated with the selected org unit.
    $scope.loadPrograms = function(orgUnit) {
        if (angular.isObject($scope.selectedOrgUnit)) {   
            ProgramFactory.getProgramsByOu($scope.selectedOrgUnit, $scope.model.selectedProgram).then(function(response){
                $scope.programs = response.programs;
                $scope.model.selectedProgram = response.selectedProgram;
            });
        }        
    };
    
    //Added to make Select2 function upcoming event.
    $scope.setSelectedProgram = function(program){ 
        $scope.model.selectedProgram = program;            
    };

    //watch for selection of program
    $scope.$watchCollection('[model.selectedProgram, selectedOuMode]', function () {
        $scope.reportFinished = false;
        $scope.reportStarted = false;
        
        if (angular.isObject($scope.model.selectedProgram)){
            $scope.generateGridHeader();
        }
    });
    
    $scope.generateReport = function(){
        
        //check for form validity
        $scope.outerForm.submitted = true;        
        if( $scope.outerForm.$invalid || !$scope.model.selectedProgram){
            return false;
        }
        
        $scope.reportFinished = false;
        $scope.reportStarted = true;        
        
        $scope.upcomingEvents = [];
        EventReportService.getEventReport($scope.selectedOrgUnit.id, 
                                        $scope.selectedOuMode, 
                                        $scope.model.selectedProgram.id, 
                                        DateUtils.formatFromUserToApi($scope.report.startDate), 
                                        DateUtils.formatFromUserToApi($scope.report.endDate), 
                                        'ACTIVE',
                                        'SCHEDULE', 
                                        $scope.pager).then(function(data){            
            if( data ) {
                if( data.pager ){
                    $scope.pager = data.pager;
                    $scope.pager.toolBarDisplay = 5;

                    Paginator.setPage($scope.pager.page);
                    Paginator.setPageCount($scope.pager.pageCount);
                    Paginator.setPageSize($scope.pager.pageSize);
                    Paginator.setItemCount($scope.pager.total);                    
                }

                angular.forEach(data.eventRows, function(row){
                    var upcomingEvent = {};
                    angular.forEach(row.attributes, function(att){
                        var val = AttributesFactory.formatAttributeValue(att, $scope.attributesById, $scope.optionSets, 'USER');
                        upcomingEvent[att.attribute] = val;                        
                    });

                    upcomingEvent.dueDate = DateUtils.formatFromApiToUser(row.dueDate);
                    upcomingEvent.event = row.event;
                    upcomingEvent.eventName = $scope.programStages[row.programStage].displayName;                    
                    upcomingEvent.orgUnitName = row.orgUnitName; 
                    upcomingEvent.followup = row.followup;
                    upcomingEvent.program = row.program;
                    upcomingEvent.programStage = row.programStage;
                    upcomingEvent.trackedEntityInstance = row.trackedEntityInstance;                
                    upcomingEvent.created = DateUtils.formatFromApiToUser(row.registrationDate);;
                    $scope.upcomingEvents.push(upcomingEvent);

                });

                //sort upcoming events by their due dates - this is default
                if(!$scope.sortColumn.id){                                      
                    $scope.sortGrid({id: 'dueDate', displayName: $translate.instant('due_date'), valueType: 'DATE', displayInListNoProgram: false, showFilter: false, show: true});
                    $scope.reverse = false;
                }
            }

            $scope.reportFinished = true;
            $scope.reportStarted = false;
        });
    };
    
    $scope.generateGridHeader = function(){
        
        if (angular.isObject($scope.model.selectedProgram)){
            
            $scope.programStages = [];
            $scope.sortColumn = {};
            $scope.filterTypes = {};
            $scope.filterText = {};
            $scope.reverse = false;;

            angular.forEach($scope.model.selectedProgram.programStages, function(stage){
                $scope.programStages[stage.id] = stage;
            });

            
            AttributesFactory.getByProgram($scope.model.selectedProgram).then(function(atts){            
                var grid = TEIGridService.generateGridColumns(atts, $scope.selectedOuMode, true);
                
                $scope.gridColumns = [];
                $scope.gridColumns.push({displayName: $translate.instant('due_date'), id: 'dueDate', valueType: 'DATE', displayInListNoProgram: false, showFilter: false, show: true, eventCol: true});
                $scope.gridColumns.push({displayName: $translate.instant('event_name'), id: 'eventName', valueType: 'TEXT', displayInListNoProgram: false, showFilter: false, show: true, eventCol: true});
                $scope.gridColumns = $scope.gridColumns.concat(grid.columns);
                
                $scope.filterTypes['eventName'] = 'TEXT';                
                $scope.filterTypes['dueDate'] = 'DATE';
                $scope.filterText['dueDate']= {};
                
                angular.forEach($scope.gridColumns, function(col){
                    col.eventCol = false;
                });                
            });            
        }      
    };
    
    $scope.showHideColumns = function(){
        
        $scope.hiddenGridColumns = 0;
        
        angular.forEach($scope.gridColumns, function(gridColumn){
            if(!gridColumn.show){
                $scope.hiddenGridColumns++;
            }
        });
        
        var modalInstance = $modal.open({
            templateUrl: 'views/column-modal.html',
            controller: 'ColumnDisplayController',
            resolve: {
                gridColumns: function () {
                    return $scope.gridColumns;
                },
                hiddenGridColumns: function(){
                    return $scope.hiddenGridColumns;
                }
            }
        });

        modalInstance.result.then(function (gridColumns) {
            $scope.gridColumns = gridColumns;
        }, function () {
        });
    };
    
    $scope.sortGrid = function(gridHeader){
        if ($scope.sortColumn && $scope.sortColumn.id === gridHeader.id){
            $scope.reverse = !$scope.reverse;
            return;
        }        
        $scope.sortColumn = gridHeader;
        if($scope.sortColumn.valueType === 'DATE'){
            $scope.reverse = true;
        }
        else{
            $scope.reverse = false;    
        }
    };
    
    $scope.d2Sort = function(upcomingDueEvent){ 
        if($scope.sortColumn && $scope.sortColumn.valueType === 'DATE'){            
            var d = upcomingDueEvent[$scope.sortColumn.id];         
            return DateUtils.getDate(d);
        }
        return upcomingDueEvent[$scope.sortColumn.id];
    };
    
    $scope.searchInGrid = function(gridColumn){
        
        $scope.currentFilter = gridColumn;
       
        for(var i=0; i<$scope.gridColumns.length; i++){
            
            //toggle the selected grid column's filter
            if($scope.gridColumns[i].id === gridColumn.id){
                $scope.gridColumns[i].showFilter = !$scope.gridColumns[i].showFilter;
            }            
            else{
                $scope.gridColumns[i].showFilter = false;
            }
        }
    };    
    
    $scope.removeStartFilterText = function(gridColumnId){
        $scope.filterText[gridColumnId].start = undefined;
    };
    
    $scope.removeEndFilterText = function(gridColumnId){
        $scope.filterText[gridColumnId].end = undefined;
    };
    
    $scope.showDashboard = function(tei){
        $location.path('/dashboard').search({tei: tei,                                            
                                            program: $scope.model.selectedProgram ? $scope.model.selectedProgram.id: null});
    };
    
    $scope.generateReportData = function(){
        return TEIGridService.getData($scope.upcomingEvents, $scope.gridColumns);
    };
    
    $scope.generateReportHeader = function(){
        return TEIGridService.getHeader($scope.gridColumns);
    };
    
    $scope.jumpToPage = function(){
        $scope.generateReport();
    };
    
    $scope.resetPageSize = function(){
        $scope.pager.page = 1;        
        $scope.generateReport();
    };
    
    $scope.getPage = function(page){    
        $scope.pager.page = page;
        $scope.generateReport();
    };
    
    $scope.back = function(){
        selection.load();
        $location.path($scope.backPath);
    }
});