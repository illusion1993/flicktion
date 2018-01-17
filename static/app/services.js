'use strict';

angular.module('Flicktion')

    .service('flashService', ['$rootScope', function ($rootScope) {
        this.init = function () {
            $rootScope.$on('$locationChangeStart', function () {
                clearFlashMessage();
            });

            function clearFlashMessage() {
                var flash = $rootScope.flash;
                if (flash) {
                    if (!flash.keepAfterLocationChange) {
                        delete $rootScope.flash;
                    } else {
                        // only keep for a single location change
                        flash.keepAfterLocationChange = false;
                    }
                }
            }
        };

        this.success = function (message, keepAfterLocationChange) {
            $rootScope.flash = {
                message: message,
                type: 'success',
                keepAfterLocationChange: keepAfterLocationChange
            };
        };

        this.failure = function (message, keepAfterLocationChange) {
            $rootScope.flash = {
                message: message,
                type: 'error',
                keepAfterLocationChange: keepAfterLocationChange
            };
        };
    }])

    .service('userDataService', ['Restangular', '$rootScope', '$cookieStore', function (Restangular, $rootScope, $cookieStore) {

        //Loader functions
        this.loadMovies = function(){
            return Restangular.one('movies/').get().then(
                function (response) {
                    return {
                        success: true,
                        message: "Movies loaded successfully",
                        data: response.plain()
                    }
                },
                function (response) {
                    return {
                        success: false,
                        message: "Error occured. Please try again later",
                        data: {}
                    }
                }
            );
        };

        this.loadMovieDetails = function(movieId){
            return Restangular.one('movies/details/').post('', {movie_id: parseInt(movieId)}).then(
                function (response) {
                    return {
                        success: true,
                        message: "Movie loaded successfully",
                        data: response.plain()
                    }
                },
                function (response) {
                    return {
                        success: false,
                        message: "Error occured. Please try again later",
                        data: {}
                    }
                }
            );
        };

        this.loadWatchlist = function (userEmail){
            return Restangular.one('users/watchlist/').post('', {email: userEmail}).then(
                function (response) {
                    return {
                        success: true,
                        message: "Watchlist loaded successfully",
                        data: response.plain()
                    }
                },
                function (response) {
                    return {
                        success: false,
                        message: "Error occured. Please try again later",
                        data: {}
                    }
                }
            );
        };

        this.loadWishlist = function (userEmail){
            return Restangular.one('users/wishlist/').post('', {email: userEmail}).then(
                function (response) {
                    return {
                        success: true,
                        message: "Wishlist loaded successfully",
                        data: response.plain()
                    }
                },
                function (response) {
                    return {
                        success: false,
                        message: "Error occured. Please try again later",
                        data: {}
                    }
                }
            );
        };

        this.loadRecommendations = function (userEmail){
            return Restangular.one('users/recommend/').post('', {email: userEmail}).then(
                function (response) {
                    return {
                        success: true,
                        message: "Recommendations loaded successfully",
                        data: response.plain()
                    }
                },
                function (response) {
                    return {
                        success: false,
                        message: "Error occured. Please try again later",
                        data: {}
                    }
                }
            );
        };

    }])

    .service('authService', ['Restangular', '$cookieStore', '$rootScope', 'flashService', function (Restangular, $cookieStore, $rootScope, flashService) {

        this.isLogged = function () {
            var userSet = $cookieStore.get('user') ? true : false;

            return !!(userSet && $cookieStore.get('user').email);
        };

        this.userExists = function(email){
            return Restangular.one('users/').get().then(
                function (response) {
                    var found = false;
                    angular.forEach(response.plain().users, function (user) {
                        if (user.email == email) {
                            found = true;
                        }
                    });

                    var message = (found)?'This username is already registered.':'';

                    return {
                        success: true,
                        found: found,
                        message: message
                    }
                },
                function (response) {
                    return {
                        success: false
                    }
                }
            );
        };

        this.login = function (email, password) {
            return Restangular.one('users/').get().then(
                function (response) {
                    var found = false;
                    angular.forEach(response.plain().users, function (user) {
                        if (user.email == email && user.password == password) {
                            found = true;
                            $rootScope.user = user;
                            $cookieStore.put('user', $rootScope.user);
                        }
                    });

                    if (found) {
                        return {
                            success: true,
                            message: "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw margin-bottom\"></i> You have been logged in successfully, loading your dashboard...",
                            data: {}
                        }
                    }
                    else {
                        return {
                            success: false,
                            message: "Please check your credentials",
                            data: {}
                        }
                    }
                },
                function (response) {
                    return {
                        success: false,
                        message: "Error occured. Please try again later",
                        data: {}
                    }
                }
            );
        };

        this.register = function (user) {
            return Restangular.one('users/register/').post('', user).then(
                function (response) {
                    return {
                        success: true,
                        message: "You have been registered, please login to continue.",
                        data: {}
                    }
                },
                function (response) {
                    return {
                        success: false,
                        message: "Error occured. Please try again later",
                        data: {}
                    }
                }
            );
        };

        this.update = function (user) {
            return Restangular.one('users/update/').post('', user).then(
                function (response) {
                    return {
                        success: true,
                        message: "Your profile has been updated.",
                        data: {}
                    }
                },
                function (response) {
                    return {
                        success: false,
                        message: "Error occured. Please try again later",
                        data: {}
                    }
                }
            );
        };

        this.logout = function () {
            $rootScope.user = {};
            $cookieStore.remove('user');
        }

    }])

    .service('movieService', ['Restangular', function(Restangular){
        // Service to get movie details, add rating to a movie, remove rating from a movie

        this.rateMovie = function(email, movie_id, score){
            var data = {
                email: email,
                movie_id: movie_id,
                score: score
            };
            return Restangular.one('users/rate/').post('', data).then(
                function (response) {
                    return {
                        success: true,
                        message: "Movie rated successfully",
                        data: response.plain()
                    }
                },
                function (response) {
                    return {
                        success: false,
                        message: "Error occured. Please try again later",
                        data: {}
                    }
                }
            );
        };

        this.unRateMovie = function(email, movie_id){
            var data = {
                email: email,
                movie_id: movie_id
            };
            return Restangular.one('users/unrate/').post('', data).then(
                function (response) {
                    return {
                        success: true,
                        message: "Rating deleted successfully",
                        data: response.plain()
                    }
                },
                function (response) {
                    return {
                        success: false,
                        message: "Error occured. Please try again later",
                        data: {}
                    }
                }
            );
        };

        this.wishMovie = function(email, movie_id){
            var data = {
                email: email,
                movie_id: movie_id
            };
            return Restangular.one('users/wish/').post('', data).then(
                function (response) {
                    return {
                        success: true,
                        message: "Movie wished successfully",
                        data: response.plain()
                    }
                },
                function (response) {
                    return {
                        success: false,
                        message: "Error occured. Please try again later",
                        data: {}
                    }
                }
            );
        };

        this.unWishMovie = function(email, movie_id){
            var data = {
                email: email,
                movie_id: movie_id
            };
            return Restangular.one('users/unwish/').post('', data).then(
                function (response) {
                    return {
                        success: true,
                        message: "Movie removed from wishlist successfully",
                        data: response.plain()
                    }
                },
                function (response) {
                    return {
                        success: false,
                        message: "Error occured. Please try again later",
                        data: {}
                    }
                }
            );
        };
    }]);