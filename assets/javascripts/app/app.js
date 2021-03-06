﻿'use strict';

/* App Module */

LOGIN_DESTINATION = '/medlemssidor';

angular.module('HashBangURLs', []).config(['$locationProvider', function($location) {
  $location.hashPrefix('!');
}]);

angular.module('intercept', []).config(['$httpProvider', function ($httpProvider) {
  var interceptor = ['$rootScope', '$q', function (scope, $q) {
    function success(response) {
      return response;
    }
    function error(response) {
      var status = response.status;
      if (status === 401) {
        localStorage.loggedIn = "false";
        scope.$broadcast('loginRequired');
      }
      else if (status === 400) {
        return response;
      }
      else {
        scope.$broadcast('someSortOfError');
      }
    }
    return function(promise) {
      return promise.then(success, error);
    };
  }];
  $httpProvider.responseInterceptors.push(interceptor);
}]);

var shitHappensHtml = "\x3Cdiv class=\"row\"\x3E\n  \x3Cdiv class=\"span12 box opaque\"\x3E\n    \x3Cdiv class=\"padhack\"\x3E\n      N\u00e5got verkar ha g\u00e5tt fel. Var god f\u00f6rs\u00f6k igen senare.\n    \x3C\x2Fdiv\x3E\n  \x3C\x2Fdiv\x3E\n\x3C\x2Fdiv\x3E";
var cubancabal = angular.module('cubancabal', ['ngSanitize', 'HashBangURLs', 'intercept', 'analytics']);

cubancabal.config(['$routeProvider', function($routeProvider) {
  $routeProvider.
      when('/', {templateUrl: 'landing',   controller: LandingController}).
      when('/medlemssidor', {templateUrl: 'medlemssidor', controller: MembersController}).
      when('/medlemssidor/installningar', {templateUrl: '/medlemssidor/installningar', controller: SettingsController}).
      when('/medlemssidor/lagenheter', {templateUrl: '/medlemssidor/lagenheter', controller: ApartmentsController}).
      when('/medlemssidor/prenumeration', {templateUrl: '/medlemssidor/prenumeration', controller: PremiumServicesController}).
      when('/medlemssidor/prenumeration/betalningsbekraftning', {templateUrl: '/medlemssidor/prenumeration/betalningsbekraftning', controller: PaymentConfirmationController}).
      when('/medlemssidor/kampanjer', {templateUrl: '/medlemssidor/kampanjer', controller: CampaignController}).
      when('/login', {templateUrl: 'login', controller: LoginController}).
      when('/registrera', {templateUrl: 'registrera', controller: SignupController}).
      when('/om', {templateUrl: 'om',   controller: AboutController}).
      when('/test', {templateUrl: 'test',   controller: TestController}).
      when('/vanliga-fragor', {templateUrl: 'vanliga-fragor', controller: FAQController}).
      when('/losenordsaterstallning', {templateUrl: 'passwordreset', controller: PasswordResetController}).
      when('/losenordsaterstallning/:hash', {templateUrl: 'passwordreset/confirmation', controller: PasswordResetConfirmationController}).
      when('/shithappens', {template: shitHappensHtml, controller: ShitController}).
      otherwise({redirectTo: '/'});
}]);

cubancabal.run( function($rootScope, $location) {
  $rootScope.$on( "$routeChangeStart", function(event, next, current) {
    if ( localStorage.loggedIn === "true" ) {
      if ( next.templateUrl == "login" || next.templateUrl == "landing" ) {
        $location.path('/medlemssidor');
        next.templateUrl = 'medlemssidor';
      }
    }
    if (next.templateUrl && next.templateUrl.indexOf("medlemssidor") !== -1) {
      $rootScope.$broadcast('loginRequired');
    }
  });
  
  $rootScope.$on( "loginRequired", function() {
    if ( localStorage.loggedIn === "false" || localStorage.loggedIn === null) {
      var path = window.location.hash.replace('#!', '');
      if (path != '/login') {
        LOGIN_DESTINATION = path;
      }
      $location.path('/login');
    }
  });
  
  $rootScope.$on( "someSortOfError", function(event, next, current) {
    if (next !== undefined && next.templateUrl && next.templateUrl.indexOf("betalningsbekraftning") === -1) {
      $location.path('/shithappens');
    }
  });
});
