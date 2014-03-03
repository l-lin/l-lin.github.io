(function() {
	'use strict';
	angular.module('llinApp', ['ui.bootstrap']).
	run(function() {
		backToTop.init();
	}).
	service('$llinService', function($log) {
		this.saveToLocalStorage = function save(key, value) {
			if(angular.isDefined(localStorage)) {
				$log.debug('Saving ' + value + ' in localeStorage[\'' + key + '\']');
				localStorage.setItem(key, value);
			} else {
				$log.warn('Could not save ' + value + ' in localeStorage[\'' + key + '\']');
			}
		};
	}).
	controller('llinCtrl', function($scope, $location, $anchorScroll, $llinService) {
		var KEY = 'LLIN_SIDEBAR_COLLAPSED_KEY',
			collapsed;
		if(angular.isDefined(localStorage)) {
			collapsed = localStorage.getItem(KEY);
			if(collapsed === null || angular.isUndefined(collapsed)) {
				collapsed = false;
			} else {
				collapsed = collapsed === 'true';
			}
		}
		$scope.collapsed = collapsed;
		$scope.collapseSidebar = function collapseSidebar() {
			$scope.collapsed = !$scope.collapsed;
			$llinService.saveToLocalStorage(KEY, $scope.collapsed);
		};
		$scope.goToTop = function() {
			$location.hash('top');
			$anchorScroll();
		};
	});
})();
