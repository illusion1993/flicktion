'use strict';

var userApp = angular
    .module('Flicktion', ['ngRoute', 'ngCookies', 'restangular', 'ui.router','ui.bootstrap', 'mgcrea.ngStrap', 'ngSanitize', 'ngAnimate'])

    .config(['$routeProvider', '$httpProvider', 'RestangularProvider', '$locationProvider',
        function($routeProvider, $httpProvider, RestangularProvider, $locationProvider){

            RestangularProvider.setBaseUrl('http://localhost:8000/api/');

            $routeProvider
                .when('/', {
                    title: 'Home',
                    controller: 'HomeController',
                    templateUrl: APP_DIRECTORY + 'views/home-view.html'
                })
                .when('/movies', {
                    title: 'Rate',
                    controller: 'RateController',
                    templateUrl: APP_DIRECTORY + 'views/rate-view.html'
                })
                .when('/watchlist', {
                    title: 'Watchlist',
                    controller: 'WatchlistController',
                    templateUrl: APP_DIRECTORY + 'views/watchlist-view.html'
                })
                .when('/wishlist', {
                    title: 'Wishlist',
                    controller: 'WishlistController',
                    templateUrl: APP_DIRECTORY + 'views/wishlist-view.html'
                })
                .when('/movies/:movieId', {
                    title: 'Movie',
                    controller: 'MovieController',
                    templateUrl: APP_DIRECTORY + 'views/movie-view.html'
                })
                .when('/login', {
                    title: 'Login',
                    controller: 'LoginController',
                    templateUrl: APP_DIRECTORY + 'views/login-view.html'
                })
                .when('/register', {
                    title: 'Register',
                    controller: 'RegisterController',
                    templateUrl: APP_DIRECTORY + 'views/register-view.html'
                })
                .when('/profile', {
                    title: 'Profile',
                    controller: 'ProfileController',
                    templateUrl: APP_DIRECTORY + 'views/profile-view.html'
                })
                .when('/filter', {
                    title: 'Filter',
                    controller: 'FilterController',
                    templateUrl: APP_DIRECTORY + 'views/filter-view.html'
                })

                .otherwise({ redirectTo: '/' });

            $locationProvider.html5Mode(false);
        }
    ])
    .run(['$rootScope', '$location', '$cookieStore', 'flashService', 'authService', 'userDataService', function($rootScope, $location, $cookieStore, flashService, authService, userDataService){
        // keep user logged in after page refresh
        $rootScope.user = $cookieStore.get('user') || {};
        flashService.init();

        $rootScope.$on('$locationChangeStart', function(){

            var isLogged = authService.isLogged(),
                publicOnlyUrls = ['/login', '/register'];

            if(isLogged && $.inArray($location.path(), publicOnlyUrls) != -1){
                flashService.failure("You are already logged in.", true);
                $location.path('/');
            }

            else if(!isLogged && $.inArray($location.path(), publicOnlyUrls) == -1){
                flashService.failure("You mut be logged in to continue.", true);
                $location.path('/login');
            }
        });
    }]);