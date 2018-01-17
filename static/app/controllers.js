'use strict';

angular.module('Flicktion')

    .controller('HomeController', ['$location', '$scope', '$rootScope', 'authService', 'flashService', '$timeout', 'userDataService', 'movieService', 'filterFilter', function ($location, $scope, $rootScope, authService, flashService, $timeout, userDataService, movieService, filterFilter) {
        $rootScope.pageTitle = 'HomePage';
        $scope.pageName = 'Dashboard';

        userDataService.loadMovies().then(function (movieResponse) {
            userDataService.loadWatchlist($rootScope.user.email).then(function (response) {
                $scope.watchlist = response.data.watchlist || [];
                userDataService.loadWishlist($rootScope.user.email).then(function (response) {
                    $scope.wishlist = response.data.wishlist || [];
                    userDataService.loadRecommendations($rootScope.user.email).then(function (response) {
                        $scope.movies = movieResponse.data.movies || {};
                        $scope.recommendationsDump = response.data.recommendations || [];

                        if($scope.recommendationsDump.length < 25) $location.path('/movies');

                        // Now continue the controller logic
                        $scope.recommendations = [];
                        $scope.processingList = [];

                        $scope.addToProcessing = function (movieId) {
                            $scope.processingList.push(movieId);
                        };

                        $scope.removeFromProcessing = function (movieId) {
                            $scope.processingList.splice($.inArray($scope.processingList, movieId));
                        };


                        $scope.loadMoreRecommendations = function () {
                            var i = 8;
                            while (i && $scope.recommendationsDump.length) {
                                var recommendation = $scope.recommendationsDump.shift();
                                recommendation = $scope.movies[recommendation.id];
                                recommendation.Actors = recommendation.Actors.split(', ');
                                recommendation.Genre = recommendation.Genre.split(', ');
                                recommendation.Language = recommendation.Language.split(', ');
                                $scope.recommendations.push(recommendation);
                                i -= 1;
                            }
                        };

                        $scope.rateFunction = function (score, movieId, index) {
                            if (score >= 1 && score <= 5) {
                                $scope.addToProcessing(movieId);
                                movieService.rateMovie($rootScope.user.email, movieId, score).then(function (response) {
                                    var index = $scope.indexInWatchlist(movieId);
                                    if (index == -1) {
                                        $scope.watchlist.push({
                                            movie_id: movieId,
                                            score: score
                                        });
                                    }
                                    else {
                                        $scope.watchlist[index] = {
                                            movie_id: movieId,
                                            score: score
                                        };
                                    }
                                    $timeout(function () {
                                        $scope.removeFromProcessing(movieId);
                                    }, 400);
                                });
                            }
                        };

                        $scope.clearRating = function (movieId, index) {
                            $scope.addToProcessing(movieId);
                            movieService.unRateMovie($rootScope.user.email, movieId).then(function (response) {
                                var index = $scope.indexInWatchlist(movieId);
                                if (index != -1) {
                                    $scope.watchlist.splice(index, 1);
                                }
                                $timeout(function () {
                                    $scope.removeFromProcessing(movieId);
                                }, 400);
                            });
                        };

                        $scope.addToWishlist = function (movieId, index) {
                            $scope.addToProcessing(movieId);
                            movieService.wishMovie($rootScope.user.email, movieId).then(function (response) {
                                var index = $scope.indexInWishlist(movieId);
                                if (index == -1) {
                                    $scope.wishlist.push({
                                        movie_id: movieId
                                    });
                                }
                                else {
                                    $scope.wishlist[index] = {
                                        movie_id: movieId
                                    };
                                }
                                $timeout(function () {
                                    $scope.removeFromProcessing(movieId);
                                }, 400);
                            });
                        };

                        $scope.removeFromWishlist = function (movieId, index) {
                            $scope.addToProcessing(movieId);
                            movieService.unWishMovie($rootScope.user.email, movieId).then(function (response) {
                                var index = $scope.indexInWishlist(movieId);
                                if (index != -1) {
                                    $scope.wishlist.splice(index, 1);
                                }
                                $timeout(function () {
                                    $scope.removeFromProcessing(movieId);
                                }, 400);
                            });
                        };

                        $scope.logout = function () {
                            authService.logout();
                            flashService.success("You have been logged out successfully.", true);
                            $location.path('/login');
                        };

                        $scope.isInWatchlist = function (movieId) {
                            var watched = $scope.watchlist.map(function (e) {
                                return e.movie_id
                            });
                            return !($.inArray(movieId, watched) == -1);
                        };

                        $scope.indexInWatchlist = function (movieId) {
                            var watched = $scope.watchlist.map(function (e) {
                                return e.movie_id
                            });
                            return $.inArray(movieId, watched);
                        };

                        $scope.isInWishlist = function (movieId) {
                            var wished = $scope.wishlist.map(function (e) {
                                return e.movie_id
                            });
                            return !($.inArray(movieId, wished) == -1);
                        };

                        $scope.indexInWishlist = function (movieId) {
                            var wished = $scope.wishlist.map(function (e) {
                                return e.movie_id
                            });
                            return $.inArray(movieId, wished);
                        };

                        $scope.isInProcessing = function (movieId) {
                            return !($.inArray(movieId, $scope.processingList) == -1);
                        };

                        $scope.ratingScoreFor = function (movieId) {
                            var index = $scope.indexInWatchlist(movieId);
                            if (index == -1) return -1;
                            else return $scope.watchlist[index].score;
                        };

                        $scope.join = function(arr){
                            var res = '';
                            angular.forEach(arr, function(value){
                                res += value + ', ';
                            });
                            res = res.substring(0, res.length - 2);
                            return res;
                        };

                        function loadRecommendations() {
                            // Code to get recommendations from api
                            // load all recommendations in recommendationsDump
                            $scope.loadMoreRecommendations();
                        }

                        loadRecommendations();

                        //SEARCH AND PAGINATION CODE STARTS
                        $scope.moviesArray = movieResponse.data.movies_list || [];
                        // create empty search model (object) to trigger $watch on update
                        $scope.search = {};
                        // pagination controls
                        $scope.currentPage = 1;
                        $scope.totalMovies = $scope.moviesArray.length;
                        $scope.entryLimit = 10; // items per page
                        $scope.noOfPages = Math.ceil($scope.totalMovies/ $scope.entryLimit);
                        // $watch search to update pagination
                        $scope.$watch('search', function (newVal, oldVal) {
                            $scope.filtered = filterFilter($scope.moviesArray, newVal);
                            $scope.totalMovies = $scope.filtered.length;
                            $scope.noOfPages = Math.ceil($scope.totalMovies / $scope.entryLimit);
                            $scope.currentPage = 1;
                        }, true);

                        // range function for for-loops
                        $scope.range = function(min, max, step) {
                            step = step || 1;
                            var input = [];
                            for (var i = min; i <= max; i += step) {
                                input.push(i);
                            }
                            return input;
                        };

                        $scope.pageRange = $scope.range(1, $scope.noOfPages);

                        $scope.paginateTo = function(page){
                            $scope.currentPage = page;
                        };

                        $scope.nextPage = function(){
                            $scope.currentPage = $scope.currentPage + 1;
                        };

                        $scope.previousPage = function(){
                            $scope.currentPage = $scope.currentPage - 1;
                        };
                    });
                });
            });
        });
    }])

    .controller('RateController', ['$location', '$scope', '$rootScope', 'authService', 'flashService', '$timeout', 'userDataService', 'movieService', 'filterFilter', function ($location, $scope, $rootScope, authService, flashService, $timeout, userDataService, movieService, filterFilter) {
        $rootScope.pageTitle = 'RatePage';
        $scope.pageName = 'Movies';

        userDataService.loadMovies().then(function (movieResponse) {
            $scope.movies = movieResponse.data.movies || {};
            userDataService.loadWatchlist($rootScope.user.email).then(function (response) {
                $scope.watchlist = response.data.watchlist || [];
                userDataService.loadWishlist($rootScope.user.email).then(function (response) {
                    $scope.wishlist = response.data.wishlist || [];
                    userDataService.loadRecommendations($rootScope.user.email).then(function (response) {
                        $scope.originalRecommendations = response.data.recommendations;
                        $scope.recommendationsDump = [];
                        angular.forEach($scope.movies, function(value, key) {
                            if(value.id)
                                $scope.recommendationsDump.push(value);
                        });

                        // Now continue the controller logic
                        $scope.recommendations = [];
                        $scope.processingList = [];

                        $scope.addToProcessing = function (movieId) {
                            $scope.processingList.push(movieId);
                        };

                        $scope.removeFromProcessing = function (movieId) {
                            $scope.processingList.splice($.inArray($scope.processingList, movieId));
                        };

                        $scope.movieSearchMarkup = function (movie) {
                            return '<i>image</i><img data-ng-src="http://ia.media-imdb.com/images/M/MV5BMTgwMjI4MzU5N15BMl5BanBnXkFtZTcwMTMyNTk3OA@@._V1_SX300.jpg"/> ' + movie.Title + movie.Year;
                        };

                        $scope.loadMoreRecommendations = function () {
                            var i = 8;
                            while (i && $scope.recommendationsDump.length) {
                                var recommendation = $scope.recommendationsDump.shift();
                                recommendation = $scope.movies[recommendation.id];
                                recommendation.Actors = recommendation.Actors.split(', ');
                                recommendation.Genre = recommendation.Genre.split(', ');
                                recommendation.Language = recommendation.Language.split(', ');
                                $scope.recommendations.push(recommendation);
                                i -= 1;
                            }
                        };

                        $scope.rateFunction = function (score, movieId, index) {
                            if (score >= 1 && score <= 5) {
                                $scope.addToProcessing(movieId);
                                movieService.rateMovie($rootScope.user.email, movieId, score).then(function (response) {
                                    var index = $scope.indexInWatchlist(movieId);
                                    if (index == -1) {
                                        $scope.watchlist.push({
                                            movie_id: movieId,
                                            score: score
                                        });
                                    }
                                    else {
                                        $scope.watchlist[index] = {
                                            movie_id: movieId,
                                            score: score
                                        };
                                    }
                                    userDataService.loadRecommendations($rootScope.user.email).then(function (response) {
                                        $scope.originalRecommendations = response.data.recommendations;
                                        $timeout(function () {
                                            $scope.removeFromProcessing(movieId);
                                        }, 400);
                                    });
                                });
                            }
                        };

                        $scope.clearRating = function (movieId, index) {
                            $scope.addToProcessing(movieId);
                            movieService.unRateMovie($rootScope.user.email, movieId).then(function (response) {
                                var index = $scope.indexInWatchlist(movieId);
                                if (index != -1) {
                                    $scope.watchlist.splice(index, 1);
                                }
                                userDataService.loadRecommendations($rootScope.user.email).then(function (response) {
                                    $scope.originalRecommendations = response.data.recommendations;
                                    $timeout(function () {
                                        $scope.removeFromProcessing(movieId);
                                    }, 400);
                                });
                            });
                        };

                        $scope.addToWishlist = function (movieId, index) {
                            $scope.addToProcessing(movieId);
                            movieService.wishMovie($rootScope.user.email, movieId).then(function (response) {
                                var index = $scope.indexInWishlist(movieId);
                                if (index == -1) {
                                    $scope.wishlist.push({
                                        movie_id: movieId
                                    });
                                }
                                else {
                                    $scope.wishlist[index] = {
                                        movie_id: movieId
                                    };
                                }
                                $timeout(function () {
                                    $scope.removeFromProcessing(movieId);
                                }, 400);
                            });
                        };

                        $scope.removeFromWishlist = function (movieId, index) {
                            $scope.addToProcessing(movieId);
                            movieService.unWishMovie($rootScope.user.email, movieId).then(function (response) {
                                var index = $scope.indexInWishlist(movieId);
                                if (index != -1) {
                                    $scope.wishlist.splice(index, 1);
                                }
                                $timeout(function () {
                                    $scope.removeFromProcessing(movieId);
                                }, 400);
                            });
                        };

                        $scope.logout = function () {
                            authService.logout();
                            flashService.success("You have been logged out successfully.", true);
                            $location.path('/login');
                        };

                        $scope.isInWatchlist = function (movieId) {
                            var watched = $scope.watchlist.map(function (e) {
                                return e.movie_id
                            });
                            return !($.inArray(movieId, watched) == -1);
                        };

                        $scope.indexInWatchlist = function (movieId) {
                            var watched = $scope.watchlist.map(function (e) {
                                return e.movie_id
                            });
                            return $.inArray(movieId, watched);
                        };

                        $scope.isInWishlist = function (movieId) {
                            var wished = $scope.wishlist.map(function (e) {
                                return e.movie_id
                            });
                            return !($.inArray(movieId, wished) == -1);
                        };

                        $scope.indexInWishlist = function (movieId) {
                            var wished = $scope.wishlist.map(function (e) {
                                return e.movie_id
                            });
                            return $.inArray(movieId, wished);
                        };

                        $scope.isInProcessing = function (movieId) {
                            return !($.inArray(movieId, $scope.processingList) == -1);
                        };

                        $scope.ratingScoreFor = function (movieId) {
                            var index = $scope.indexInWatchlist(movieId);
                            if (index == -1) return -1;
                            else return $scope.watchlist[index].score;
                        };

                        $scope.join = function(arr){
                            var res = '';
                            angular.forEach(arr, function(value){
                                res += value + ', ';
                            });
                            res = res.substring(0, res.length - 2);
                            return res;
                        };

                        function loadRecommendations() {
                            // Code to get recommendations from api
                            // load all recommendations in recommendationsDump
                            $scope.loadMoreRecommendations();
                        }

                        loadRecommendations();

                        //SEARCH AND PAGINATION CODE STARTS
                        $scope.moviesArray = movieResponse.data.movies_list || [];
                        // create empty search model (object) to trigger $watch on update
                        $scope.search = {};
                        // pagination controls
                        $scope.currentPage = 1;
                        $scope.totalMovies = $scope.moviesArray.length;
                        $scope.entryLimit = 10; // items per page
                        $scope.noOfPages = Math.ceil($scope.totalMovies/ $scope.entryLimit);
                        // $watch search to update pagination
                        $scope.$watch('search', function (newVal, oldVal) {
                            $scope.filtered = filterFilter($scope.moviesArray, newVal);
                            $scope.totalMovies = $scope.filtered.length;
                            $scope.noOfPages = Math.ceil($scope.totalMovies / $scope.entryLimit);
                            $scope.currentPage = 1;
                        }, true);

                        // range function for for-loops
                        $scope.range = function(min, max, step) {
                            step = step || 1;
                            var input = [];
                            for (var i = min; i <= max; i += step) {
                                input.push(i);
                            }
                            return input;
                        };

                        $scope.pageRange = $scope.range(1, $scope.noOfPages);

                        $scope.paginateTo = function(page){
                            $scope.currentPage = page;
                        };

                        $scope.nextPage = function(){
                            $scope.currentPage = $scope.currentPage + 1;
                        };

                        $scope.previousPage = function(){
                            $scope.currentPage = $scope.currentPage - 1;
                        };
                    });
                });
            });
        });
    }])

    .controller('WatchlistController', ['$location', '$scope', '$rootScope', 'authService', 'flashService', '$timeout', 'userDataService', 'movieService', function ($location, $scope, $rootScope, authService, flashService, $timeout, userDataService, movieService) {
        $rootScope.pageTitle = 'WatchlistPage';
        $scope.pageName = 'Watchlist';

        userDataService.loadMovies().then(function (response) {
            $scope.movies = response.data.movies || {};
            userDataService.loadWatchlist($rootScope.user.email).then(function (response) {
                $scope.watchlist = response.data.watchlist || [];
                userDataService.loadWishlist($rootScope.user.email).then(function (response) {
                    $scope.wishlist = response.data.wishlist || [];
                    userDataService.loadRecommendations($rootScope.user.email).then(function (response) {
                        $scope.originalRecommendations = response.data.recommendations;
                        $scope.recommendationsDump = [];

                        if($scope.watchlist.length < 1) $location.path('/movies');

                        angular.forEach($scope.watchlist, function(value, key) {
                            if(value.movie_id)
                                $scope.recommendationsDump.push($scope.movies[value.movie_id]);
                        });


                        // Now continue the controller logic
                        $scope.recommendations = [];
                        $scope.processingList = [];

                        $scope.addToProcessing = function (movieId) {
                            $scope.processingList.push(movieId);
                        };

                        $scope.removeFromProcessing = function (movieId) {
                            $scope.processingList.splice($.inArray($scope.processingList, movieId));
                        };

                        $scope.movieSearchMarkup = function (movie) {
                            return '<i>image</i><img data-ng-src="http://ia.media-imdb.com/images/M/MV5BMTgwMjI4MzU5N15BMl5BanBnXkFtZTcwMTMyNTk3OA@@._V1_SX300.jpg"/> ' + movie.Title + movie.Year;
                        };

                        $scope.loadMoreRecommendations = function () {
                            var i = 6;
                            while (i && $scope.recommendationsDump.length) {
                                var recommendation = $scope.recommendationsDump.shift();
                                recommendation = $scope.movies[recommendation.id];
                                recommendation.Actors = recommendation.Actors.split(', ');
                                recommendation.Genre = recommendation.Genre.split(', ');
                                recommendation.Language = recommendation.Language.split(', ');
                                $scope.recommendations.push(recommendation);
                                i -= 1;
                            }
                        };

                        $scope.rateFunction = function (score, movieId, index) {
                            if (score >= 1 && score <= 5) {
                                $scope.addToProcessing(movieId);
                                movieService.rateMovie($rootScope.user.email, movieId, score).then(function (response) {
                                    var index = $scope.indexInWatchlist(movieId);
                                    if (index == -1) {
                                        $scope.watchlist.push({
                                            movie_id: movieId,
                                            score: score
                                        });
                                    }
                                    else {
                                        $scope.watchlist[index] = {
                                            movie_id: movieId,
                                            score: score
                                        };
                                    }
                                    userDataService.loadRecommendations($rootScope.user.email).then(function (response) {
                                        $scope.originalRecommendations = response.data.recommendations;
                                        $timeout(function () {
                                            $scope.removeFromProcessing(movieId);
                                        }, 400);
                                    });
                                });
                            }
                        };

                        $scope.clearRating = function (movieId, index) {
                            $scope.addToProcessing(movieId);
                            movieService.unRateMovie($rootScope.user.email, movieId).then(function (response) {
                                var index = $scope.indexInWatchlist(movieId);
                                if (index != -1) {
                                    $scope.watchlist.splice(index, 1);
                                }
                                userDataService.loadRecommendations($rootScope.user.email).then(function (response) {
                                    $scope.originalRecommendations = response.data.recommendations;
                                    $timeout(function () {
                                        $scope.removeFromProcessing(movieId);
                                    }, 400);
                                });
                            });
                        };

                        $scope.addToWishlist = function (movieId, index) {
                            $scope.addToProcessing(movieId);
                            movieService.wishMovie($rootScope.user.email, movieId).then(function (response) {
                                var index = $scope.indexInWishlist(movieId);
                                if (index == -1) {
                                    $scope.wishlist.push({
                                        movie_id: movieId
                                    });
                                }
                                else {
                                    $scope.wishlist[index] = {
                                        movie_id: movieId
                                    };
                                }
                                $timeout(function () {
                                    $scope.removeFromProcessing(movieId);
                                }, 400);
                            });
                        };

                        $scope.removeFromWishlist = function (movieId, index) {
                            $scope.addToProcessing(movieId);
                            movieService.unWishMovie($rootScope.user.email, movieId).then(function (response) {
                                var index = $scope.indexInWishlist(movieId);
                                if (index != -1) {
                                    $scope.wishlist.splice(index, 1);
                                }
                                $timeout(function () {
                                    $scope.removeFromProcessing(movieId);
                                }, 400);
                            });
                        };

                        $scope.logout = function () {
                            authService.logout();
                            flashService.success("You have been logged out successfully.", true);
                            $location.path('/login');
                        };

                        $scope.isInWatchlist = function (movieId) {
                            var watched = $scope.watchlist.map(function (e) {
                                return e.movie_id
                            });
                            return !($.inArray(movieId, watched) == -1);
                        };

                        $scope.indexInWatchlist = function (movieId) {
                            var watched = $scope.watchlist.map(function (e) {
                                return e.movie_id
                            });
                            return $.inArray(movieId, watched);
                        };

                        $scope.isInWishlist = function (movieId) {
                            var wished = $scope.wishlist.map(function (e) {
                                return e.movie_id
                            });
                            return !($.inArray(movieId, wished) == -1);
                        };

                        $scope.indexInWishlist = function (movieId) {
                            var wished = $scope.wishlist.map(function (e) {
                                return e.movie_id
                            });
                            return $.inArray(movieId, wished);
                        };

                        $scope.isInProcessing = function (movieId) {
                            return !($.inArray(movieId, $scope.processingList) == -1);
                        };

                        $scope.ratingScoreFor = function (movieId) {
                            var index = $scope.indexInWatchlist(movieId);
                            if (index == -1) return -1;
                            else return $scope.watchlist[index].score;
                        };

                        $scope.join = function(arr){
                            var res = '';
                            angular.forEach(arr, function(value){
                                res += value + ', ';
                            });
                            res = res.substring(0, res.length - 2);
                            return res;
                        };

                        function loadRecommendations() {
                            // Code to get recommendations from api
                            // load all recommendations in recommendationsDump
                            $scope.loadMoreRecommendations();
                        }

                        loadRecommendations();
                    });
                });
            });
        });
    }])

    .controller('WishlistController', ['$location', '$scope', '$rootScope', 'authService', 'flashService', '$timeout', 'userDataService', 'movieService', function ($location, $scope, $rootScope, authService, flashService, $timeout, userDataService, movieService) {
        $rootScope.pageTitle = 'WishlistPage';
        $scope.pageName = 'Wishlist';

        userDataService.loadMovies().then(function (response) {
            $scope.movies = response.data.movies || {};
            userDataService.loadWatchlist($rootScope.user.email).then(function (response) {
                $scope.watchlist = response.data.watchlist || [];
                userDataService.loadWishlist($rootScope.user.email).then(function (response) {
                    $scope.wishlist = response.data.wishlist || [];
                    userDataService.loadRecommendations($rootScope.user.email).then(function (response) {
                        $scope.originalRecommendations = response.data.recommendations;
                        $scope.recommendationsDump = [];

                        if($scope.wishlist.length < 1) $location.path('/');

                        angular.forEach($scope.wishlist, function(value, key) {
                            if(value.movie_id)
                                $scope.recommendationsDump.push($scope.movies[value.movie_id]);
                        });


                        // Now continue the controller logic
                        $scope.recommendations = [];
                        $scope.processingList = [];

                        $scope.addToProcessing = function (movieId) {
                            $scope.processingList.push(movieId);
                        };

                        $scope.removeFromProcessing = function (movieId) {
                            $scope.processingList.splice($.inArray($scope.processingList, movieId));
                        };

                        $scope.movieSearchMarkup = function (movie) {
                            return '<i>image</i><img data-ng-src="http://ia.media-imdb.com/images/M/MV5BMTgwMjI4MzU5N15BMl5BanBnXkFtZTcwMTMyNTk3OA@@._V1_SX300.jpg"/> ' + movie.Title + movie.Year;
                        };

                        $scope.loadMoreRecommendations = function () {
                            var i = 6;
                            while (i && $scope.recommendationsDump.length) {
                                var recommendation = $scope.recommendationsDump.shift();
                                recommendation = $scope.movies[recommendation.id];
                                recommendation.Actors = recommendation.Actors.split(', ');
                                recommendation.Genre = recommendation.Genre.split(', ');
                                recommendation.Language = recommendation.Language.split(', ');
                                $scope.recommendations.push(recommendation);
                                i -= 1;
                            }
                        };

                        $scope.rateFunction = function (score, movieId, index) {
                            if (score >= 1 && score <= 5) {
                                $scope.addToProcessing(movieId);
                                movieService.rateMovie($rootScope.user.email, movieId, score).then(function (response) {
                                    var index = $scope.indexInWatchlist(movieId);
                                    if (index == -1) {
                                        $scope.watchlist.push({
                                            movie_id: movieId,
                                            score: score
                                        });
                                    }
                                    else {
                                        $scope.watchlist[index] = {
                                            movie_id: movieId,
                                            score: score
                                        };
                                    }
                                    userDataService.loadRecommendations($rootScope.user.email).then(function (response) {
                                        $scope.originalRecommendations = response.data.recommendations;
                                        $timeout(function () {
                                            $scope.removeFromProcessing(movieId);
                                        }, 400);
                                    });
                                });
                            }
                        };

                        $scope.clearRating = function (movieId, index) {
                            $scope.addToProcessing(movieId);
                            movieService.unRateMovie($rootScope.user.email, movieId).then(function (response) {
                                var index = $scope.indexInWatchlist(movieId);
                                if (index != -1) {
                                    $scope.watchlist.splice(index, 1);
                                }
                                userDataService.loadRecommendations($rootScope.user.email).then(function (response) {
                                    $scope.originalRecommendations = response.data.recommendations;
                                    $timeout(function () {
                                        $scope.removeFromProcessing(movieId);
                                    }, 400);
                                });
                            });
                        };

                        $scope.addToWishlist = function (movieId, index) {
                            $scope.addToProcessing(movieId);
                            movieService.wishMovie($rootScope.user.email, movieId).then(function (response) {
                                var index = $scope.indexInWishlist(movieId);
                                if (index == -1) {
                                    $scope.wishlist.push({
                                        movie_id: movieId
                                    });
                                }
                                else {
                                    $scope.wishlist[index] = {
                                        movie_id: movieId
                                    };
                                }
                                $timeout(function () {
                                    $scope.removeFromProcessing(movieId);
                                }, 400);
                            });
                        };

                        $scope.removeFromWishlist = function (movieId, index) {
                            $scope.addToProcessing(movieId);
                            movieService.unWishMovie($rootScope.user.email, movieId).then(function (response) {
                                var index = $scope.indexInWishlist(movieId);
                                if (index != -1) {
                                    $scope.wishlist.splice(index, 1);
                                }
                                $timeout(function () {
                                    $scope.removeFromProcessing(movieId);
                                }, 400);
                            });
                        };

                        $scope.logout = function () {
                            authService.logout();
                            flashService.success("You have been logged out successfully.", true);
                            $location.path('/login');
                        };

                        $scope.isInWatchlist = function (movieId) {
                            var watched = $scope.watchlist.map(function (e) {
                                return e.movie_id
                            });
                            return !($.inArray(movieId, watched) == -1);
                        };

                        $scope.indexInWatchlist = function (movieId) {
                            var watched = $scope.watchlist.map(function (e) {
                                return e.movie_id
                            });
                            return $.inArray(movieId, watched);
                        };

                        $scope.isInWishlist = function (movieId) {
                            var wished = $scope.wishlist.map(function (e) {
                                return e.movie_id
                            });
                            return !($.inArray(movieId, wished) == -1);
                        };

                        $scope.indexInWishlist = function (movieId) {
                            var wished = $scope.wishlist.map(function (e) {
                                return e.movie_id
                            });
                            return $.inArray(movieId, wished);
                        };

                        $scope.isInProcessing = function (movieId) {
                            return !($.inArray(movieId, $scope.processingList) == -1);
                        };

                        $scope.ratingScoreFor = function (movieId) {
                            var index = $scope.indexInWatchlist(movieId);
                            if (index == -1) return -1;
                            else return $scope.watchlist[index].score;
                        };

                        $scope.join = function(arr){
                            var res = '';
                            angular.forEach(arr, function(value){
                                res += value + ', ';
                            });
                            res = res.substring(0, res.length - 2);
                            return res;
                        };

                        function loadRecommendations() {
                            // Code to get recommendations from api
                            // load all recommendations in recommendationsDump
                            $scope.loadMoreRecommendations();
                        }

                        loadRecommendations();
                    });
                });
            });
        });
    }])

    .controller('MovieController', ['$location', '$scope', '$rootScope', 'authService', 'flashService', '$timeout', 'userDataService', 'movieService', '$routeParams', function ($location, $scope, $rootScope, authService, flashService, $timeout, userDataService, movieService, $routeParams) {
        $rootScope.pageTitle = 'MoviePage';
        $scope.movieId = $routeParams['movieId'];

        userDataService.loadMovieDetails($scope.movieId).then(function (response) {
            $scope.movie = response.data.data || {};
            userDataService.loadWatchlist($rootScope.user.email).then(function (response) {
                $scope.watchlist = response.data.watchlist || [];
                userDataService.loadWishlist($rootScope.user.email).then(function (response) {
                    $scope.wishlist = response.data.wishlist || [];

                    // Now continue the controller logic
                    $scope.recommendations = [];
                    $scope.processingList = [];

                    $scope.addToProcessing = function (movieId) {
                        $scope.processingList.push(movieId);
                    };

                    $scope.removeFromProcessing = function (movieId) {
                        $scope.processingList.splice($.inArray($scope.processingList, movieId));
                    };

                    $scope.loadMoreRecommendations = function () {
                        var i = 8;
                        while (i && $scope.recommendationsDump.length) {
                            var recommendation = $scope.recommendationsDump.shift();
                            recommendation = $scope.movies[recommendation.id];
                            $scope.recommendations.push(recommendation);
                            i -= 1;
                        }
                    };

                    $scope.rateFunction = function (score, movieId, index) {
                        if (score >= 1 && score <= 5) {
                            $scope.addToProcessing(movieId);
                            movieService.rateMovie($rootScope.user.email, movieId, score).then(function (response) {
                                var index = $scope.indexInWatchlist(movieId);
                                if (index == -1) {
                                    $scope.watchlist.push({
                                        movie_id: movieId,
                                        score: score
                                    });
                                }
                                else {
                                    $scope.watchlist[index] = {
                                        movie_id: movieId,
                                        score: score
                                    };
                                }
                                userDataService.loadRecommendations($rootScope.user.email).then(function (response) {
                                    $scope.originalRecommendations = response.data.recommendations;
                                    $timeout(function () {
                                        $scope.removeFromProcessing(movieId);
                                    }, 400);
                                });
                            });
                        }
                    };

                    $scope.clearRating = function (movieId, index) {
                        $scope.addToProcessing(movieId);
                        movieService.unRateMovie($rootScope.user.email, movieId).then(function (response) {
                            var index = $scope.indexInWatchlist(movieId);
                            if (index != -1) {
                                $scope.watchlist.splice(index, 1);
                            }
                            userDataService.loadRecommendations($rootScope.user.email).then(function (response) {
                                $scope.originalRecommendations = response.data.recommendations;
                                $timeout(function () {
                                    $scope.removeFromProcessing(movieId);
                                }, 400);
                            });
                        });
                    };

                    $scope.addToWishlist = function (movieId, index) {
                        $scope.addToProcessing(movieId);
                        movieService.wishMovie($rootScope.user.email, movieId).then(function (response) {
                            var index = $scope.indexInWishlist(movieId);
                            if (index == -1) {
                                $scope.wishlist.push({
                                    movie_id: movieId
                                });
                            }
                            else {
                                $scope.wishlist[index] = {
                                    movie_id: movieId
                                };
                            }
                            $timeout(function () {
                                $scope.removeFromProcessing(movieId);
                            }, 400);
                        });
                    };

                    $scope.removeFromWishlist = function (movieId, index) {
                        $scope.addToProcessing(movieId);
                        movieService.unWishMovie($rootScope.user.email, movieId).then(function (response) {
                            var index = $scope.indexInWishlist(movieId);
                            if (index != -1) {
                                $scope.wishlist.splice(index, 1);
                            }
                            $timeout(function () {
                                $scope.removeFromProcessing(movieId);
                            }, 400);
                        });
                    };

                    $scope.logout = function () {
                        authService.logout();
                        flashService.success("You have been logged out successfully.", true);
                        $location.path('/login');
                    };

                    $scope.isInWatchlist = function (movieId) {
                        var watched = $scope.watchlist.map(function (e) {
                            return e.movie_id
                        });
                        return !($.inArray(movieId, watched) == -1);
                    };

                    $scope.indexInWatchlist = function (movieId) {
                        var watched = $scope.watchlist.map(function (e) {
                            return e.movie_id
                        });
                        return $.inArray(movieId, watched);
                    };

                    $scope.isInWishlist = function (movieId) {
                        var wished = $scope.wishlist.map(function (e) {
                            return e.movie_id
                        });
                        return !($.inArray(movieId, wished) == -1);
                    };

                    $scope.indexInWishlist = function (movieId) {
                        var wished = $scope.wishlist.map(function (e) {
                            return e.movie_id
                        });
                        return $.inArray(movieId, wished);
                    };

                    $scope.isInProcessing = function (movieId) {
                        return !($.inArray(movieId, $scope.processingList) == -1);
                    };

                    $scope.ratingScoreFor = function (movieId) {
                        var index = $scope.indexInWatchlist(movieId);
                        if (index == -1) return -1;
                        else return $scope.watchlist[index].score;
                    };
                });
            });
        });
    }])

    .controller('LoginController', ['$location', '$scope', '$rootScope', 'authService', 'flashService', '$timeout', 'userDataService', function ($location, $scope, $rootScope, authService, flashService, $timeout, userDataService) {
        $rootScope.pageTitle = 'LoginPage';

        $scope.login = function () {
            authService.login($scope.email, $scope.password).then(function (response) {
                if (response.success) {
                    flashService.success(response.message, true);

                    userDataService.loadMovies().then(function (response) {
                        userDataService.loadWatchlist($scope.email).then(function (response) {
                            userDataService.loadWishlist($scope.email).then(function (response) {
                                $timeout(function () {
                                    $location.path('/');
                                }, 1000);
                            });
                        });
                    });
                }
                else {
                    flashService.failure(response.message, false);
                }
            });
        }
    }])

    .controller('ProfileController', ['$location', '$scope', '$rootScope', 'authService', 'flashService', '$timeout', 'userDataService', 'movieService', '$cookieStore', function ($location, $scope, $rootScope, authService, flashService, $timeout, userDataService, movieService, $cookieStore) {
        $rootScope.pageTitle = 'ProfilePage';
        $scope.pageName = 'Profile';

        userDataService.loadMovies().then(function (response) {
            $scope.movies = response.data.movies || {};
            userDataService.loadWatchlist($rootScope.user.email).then(function (response) {
                $scope.watchlist = response.data.watchlist || [];
                userDataService.loadWishlist($rootScope.user.email).then(function (response) {
                    $scope.wishlist = response.data.wishlist || [];
                    userDataService.loadRecommendations($rootScope.user.email).then(function (response) {

                        $scope.user_profile = angular.copy($rootScope.user);
                        if($scope.user_profile.password) delete $scope.user_profile.password;

                        $scope.logout = function () {
                            authService.logout();
                            flashService.success("You have been logged out successfully.", true);
                            $location.path('/login');
                        };

                        $scope.save = function(user_profile){
                            authService.update($scope.user_profile).then(function(response){
                                if(response.success){
                                    flashService.success("Your profile has been updated successfully.", false);
                                    $rootScope.user = $scope.user_profile;
                                    $cookieStore.put('user', $rootScope.user);
                                }
                                else{
                                    flashService.failure("Error occured, try later.", false);
                                }
                            });
                        }
                    });
                });
            });
        });
    }])

    .controller('RegisterController', ['$location', '$scope', '$rootScope', 'authService', 'flashService', function ($location, $scope, $rootScope, authService, flashService) {
        $rootScope.pageTitle = 'RegisterPage';

        $scope.register = function () {
            authService.userExists($scope.user.email).then(function(response){
                if(response.success && response.found){
                    flashService.failure(response.message, false);
                }
                else if(response.success && !response.found){
                    authService.register($scope.user).then(function (response) {
                        if (response.success) {
                            flashService.success(response.message, true);
                            $location.path('/login');
                        }
                        else {
                            flashService.failure(response.message, false);
                        }
                    });
                }
                else{

                }
            });
        }

    }])

    .controller('FilterController', ['$scope', 'filterFilter', function ($scope, filterFilter) {
        $scope.items = [
            {
            "name": "asdafag",
            "category": ["management", "business"],
            "branch": "West"
        }, {
            "name": "name 2",
            "category": [{
                "category": "engineering"
            }],
            "branch": "West"
        }, {
            "name": "name 3",
            "category": [{
                "category": "management"
            }, {
                "category": "engineering"
            }],
            "branch": "West"
        }, {
            "name": "name 4",
            "category": [{
                "category": "management"
            }, {
                "category": "business"
            }],
            "branch": "West"
        }, {
            "name": "name 5",
            "category": [{
                "category": "management"
            }, {
                "category": "business"
            }],
            "branch": "East"
        }, {
            "name": "name 6",
            "category": [{
                "category": "management"
            }, {
                "category": "business"
            }],
            "branch": "East"
        }, {
            "name": "name 7",
            "category": [{
                "category": "management"
            }, {
                "category": "business"
            }],
            "branch": "East"
        }, {
            "name": "name 8",
            "category": [{
                "category": "business"
            }],
            "branch": "West"
        }, {
            "name": "name 9",
            "category": [{
                "category": "management"
            }, {
                "category": "business"
            }],
            "branch": "East"
        }, {
            "name": "name 10",
            "category": [{
                "category": "management"
            }],
            "branch": "East"
        }, {
            "name": "name 11",
            "category": [{
                "category": "management"
            }, {
                "category": "business"
            }],
            "branch": "East"
        }, {
            "name": "name 12",
            "category": [{
                "category": "engineering"
            }],
            "branch": "West"
        }, {
            "name": "name 13",
            "category": [{
                "category": "management"
            }, {
                "category": "business"
            }],
            "branch": "West"
        }, {
            "name": "name 14",
            "category": [{
                "category": "engineering"
            }],
            "branch": "East"
        }, {
            "name": "name 15",
            "category": [{
                "category": "management"
            }, {
                "category": "engineering"
            }],
            "branch": "East"
        }, {
            "name": "name 16",
            "category": [{
                "category": "management"
            }],
            "branch": "West"
        }, {
            "name": "name 17",
            "category": [{
                "category": "management"
            }],
            "branch": "East"
        }, {
            "name": "name 18",
            "category": [{
                "category": "business"
            }],
            "branch": "West"
        }, {
            "name": "name 19",
            "category": [{
                "category": "business"
            }],
            "branch": "West"
        }, {
            "name": "name 20",
            "category": [{
                "category": "engineering"
            }],
            "branch": "East"
        }, {
            "name": "Peter",
            "category": [{
                "category": "business"
            }],
            "branch": "East"
        }, {
            "name": "Frank",
            "category": [{
                "category": "management"
            }],
            "branch": "East"
        }, {
            "name": "Joe",
            "category": [{
                "category": "business"
            }],
            "branch": "East"
        }, {
            "name": "Ralph",
            "category": [{
                "category": "management"
            }, {
                "category": "business"
            }],
            "branch": "East"
        }, {
            "name": "Gina",
            "category": [{
                "category": "business"
            }],
            "branch": "East"
        }, {
            "name": "Sam",
            "category": [{
                "category": "management"
            }, {
                "category": "engineering"
            }],
            "branch": "East"
        }, {
            "name": "Britney",
            "category": [{
                "category": "business"
            }],
            "branch": "West"
        }];

        // create empty search model (object) to trigger $watch on update
        $scope.search = {};

        $scope.resetFilters = function () {
            // needs to be a function or it won't trigger a $watch
            $scope.search = {};
        };

        // pagination controls
        $scope.currentPage = 1;
        $scope.totalItems = $scope.items.length;
        $scope.entryLimit = 4; // items per page
        $scope.noOfPages = Math.ceil($scope.totalItems / $scope.entryLimit);

        // $watch search to update pagination
        $scope.$watch('search', function (newVal, oldVal) {
            $scope.filtered = filterFilter($scope.items, newVal);
            $scope.totalItems = $scope.filtered.length;
            $scope.noOfPages = Math.ceil($scope.totalItems / $scope.entryLimit);
            $scope.currentPage = 1;
        }, true);

        // range function for for-loops
        $scope.range = function(min, max, step) {
            step = step || 1;
            var input = [];
            for (var i = min; i <= max; i += step) {
                input.push(i);
            }
            return input;
        };

        $scope.pageRange = $scope.range(1, $scope.noOfPages);

        $scope.paginateTo = function(page){
            $scope.currentPage = page;
            window.alert($scope.currentPage);
        }
    }])

    .filter('startFrom', function () {
        return function (input, start) {
            if (input) {
                start = +start;
                return input.slice(start);
            }
            return [];
        };
    });