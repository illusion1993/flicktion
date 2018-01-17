import json
from django.views.generic import TemplateView
from rest_framework import permissions, status, views, generics
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response

from recommender.models import User, Rating, Wish
from recommender.apps import imdb_list, imdb_dict, neighbours_list, normalized_neighbours_list, get_recommendations_for_this_watchlist


def get_watchlist_of(user_email):
    user = get_object_or_404(User, email=user_email)
    ratings = Rating.objects.filter(user=user)
    watchlist = []

    for rating in ratings:
        watchlist.append({
            'movie_id': rating.movie_id,
            'score': rating.score
        })

    return watchlist


# User based views
class HomePageView(TemplateView):
    """
    Home page of the application
    """
    template_name = 'home.html'


class UsersView(views.APIView):
    """
    all users array
    """
    def get(self, request):
        qs = User.objects.all()
        users = []
        for user in qs:
            users.append({
                'email': user.email,
                'password': user.password,
                'first_name': user.first_name,
                'last_name': user.last_name
            })
        return Response({
            'users': users,
            'success': True
        }, headers={
            'Access-Control-Allow-Origin': '*'
        })


class UserRegisterView(views.APIView):
    def post(self, request):
        data = json.loads(request.body)

        u = {
            'email': data.get('email', None),
            'password': data.get('password', None),
            'first_name': data.get('first_name', None),
            'last_name': data.get('last_name', None)
        }

        # User.objects.update_or_create(email=u['email'], defaults=u)
        User.objects.create(email=u['email'], first_name=u['first_name'], last_name=u['last_name'], password=u['password'])
        return Response({
            'success': True
        }, headers={
            'Access-Control-Allow-Origin': '*'
        })


class UserUpdateView(views.APIView):
    def post(self, request):
        data = json.loads(request.body)

        u = {
            'email': data.get('email', None),
            'password': data.get('password', None),
            'first_name': data.get('first_name', None),
            'last_name': data.get('last_name', None)
        }

        user = User.objects.get(email=u['email'])

        if u['password']:
            user.password = u['password']
        user.first_name = u['first_name']
        user.last_name = u['last_name']
        user.save()

        return Response({
            'success': True
        }, headers={
            'Access-Control-Allow-Origin': '*'
        })


class UserWatchlistView(views.APIView):
    """
    user watchlist array
    """
    def post(self, request):
        data = json.loads(request.body)

        email = data.get('email', None)
        user = get_object_or_404(User, email=email)

        watchlist = []

        r = Rating.objects.filter(user__email=user.email)
        for rating in r:
            watchlist.append({
                'movie_id': rating.movie_id,
                'score': rating.score
            })

        return Response({
            'watchlist': watchlist,
            'success': True
        }, headers={
            'Access-Control-Allow-Origin': '*'
        })


class UserWishlistView(views.APIView):
    """
    user watchlist array
    """
    def post(self, request):
        data = json.loads(request.body)

        email = data.get('email', None)
        user = get_object_or_404(User, email=email)

        wishlist = []

        r = Wish.objects.filter(user__email=user.email)
        for wish in r:
            wishlist.append({
                'movie_id': wish.movie_id
            })

        return Response({
            'wishlist': wishlist,
            'success': True
        }, headers={
            'Access-Control-Allow-Origin': '*'
        })


class RateMovieView(views.APIView):
    def post(self, request):
        data = json.loads(request.body)

        email = data.get('email', None)
        movie_id = data.get('movie_id', None)
        score = data.get('score', None)

        user = get_object_or_404(User, email=email)
        Rating.objects.update_or_create(user=user, movie_id=movie_id, defaults={'user': user, 'movie_id': movie_id, 'score': score})
        return Response({
            'success': True
        }, headers={
            'Access-Control-Allow-Origin': '*'
        })


class UnRateMovieView(views.APIView):
    def post(self, request):
        data = json.loads(request.body)

        email = data.get('email', None)
        movie_id = data.get('movie_id', None)

        user = get_object_or_404(User, email=email)
        rating = get_object_or_404(Rating, user=user, movie_id=movie_id)
        if rating:
            rating.delete()
        return Response({
            'success': True
        }, headers={
            'Access-Control-Allow-Origin': '*'
        })


class WishMovieView(views.APIView):
    def post(self, request):
        data = json.loads(request.body)

        email = data.get('email', None)
        movie_id = data.get('movie_id', None)

        user = get_object_or_404(User, email=email)
        Wish.objects.update_or_create(user=user, movie_id=movie_id, defaults={'user': user, 'movie_id': movie_id})
        return Response({
            'success': True
        }, headers={
            'Access-Control-Allow-Origin': '*'
        })


class UnWishMovieView(views.APIView):
    def post(self, request):
        data = json.loads(request.body)

        email = data.get('email', None)
        movie_id = data.get('movie_id', None)

        user = get_object_or_404(User, email=email)
        wish = get_object_or_404(Wish, user=user, movie_id=movie_id)
        if wish:
            wish.delete()
        return Response({
            'success': True
        }, headers={
            'Access-Control-Allow-Origin': '*'
        })


class UserRecommendationsListView(views.APIView):
    def post(self, request):
        email = json.loads(request.body)['email']
        watchlist = get_watchlist_of(email)

        if watchlist:
            return Response({
                'success': True,
                'recommendations': get_recommendations_for_this_watchlist(watchlist)
            }, headers={
                'Access-Control-Allow-Origin': '*'
            })

        else:
            return Response({
                'success': False
            }, headers={
                'Access-Control-Allow-Origin': '*'
            })


# Movie based views
class MoviesDictView(views.APIView):
    """
    {
        movies: [
                {
                    ...details
                },
                {
                    ...details
                },
            ]
    }
    """
    def get(self, request):
        return Response({
            'movies': imdb_dict,
            'movies_list': imdb_list,
            'success': True
        }, headers={
            'Access-Control-Allow-Origin': '*'
        })


class MoviesListView(views.APIView):
    """
    {
        movies: [
                [
                    ...details
                ],
                [
                    ...details
                ],
            ]
    }
    """
    def get(self, request):
        return Response({
            'movies': imdb_list,
            'success': True
        }, headers={
            'Access-Control-Allow-Origin': '*'
        })


class MovieDetailsView(views.APIView):
    """
    {
        ...details
    }
    """
    def post(self, request):
        data = json.loads(request.body)
        movie_id = data.get('movie_id', None)

        if movie_id and imdb_dict.get(movie_id, None):
            return Response({
                'success': True,
                'data': imdb_dict.get(movie_id, None)
            }, headers={
                'Access-Control-Allow-Origin': '*'
            })
        else:
            return Response({
                'success': False,
                'data': {}
            }, headers={
                'Access-Control-Allow-Origin': '*'
            })


class MovieNeighboursListView(views.APIView):
    def post(self, request):
        data = json.loads(request.body)
        movie_id = data.get('movie_id', None)

        data = neighbours_list[movie_id]

        if movie_id and data:
            return Response({
                'success': True,
                'neighbours': data
            }, headers={
                'Access-Control-Allow-Origin': '*'
            })

        else:
            return Response({
                'success': False
            }, headers={
                'Access-Control-Allow-Origin': '*'
            })


class MovieNormalizedNeighboursListView(views.APIView):
    def post(self, request):
        data = json.loads(request.body)
        movie_id = data.get('movie_id', None)

        data = normalized_neighbours_list[movie_id]

        if movie_id and data:
            return Response({
                'success': True,
                'normalized_neighbours': data
            }, headers={
                'Access-Control-Allow-Origin': '*'
            })

        else:
            return Response({
                'success': False
            }, headers={
                'Access-Control-Allow-Origin': '*'
            })


class MovieRecommendationsListView(views.APIView):
    def post(self, request):
        watchlist = json.loads(request.body)['watchlist']

        if watchlist:
            return Response({
                'success': True,
                'recommendations': get_recommendations_for_this_watchlist(watchlist)
            }, headers={
                'Access-Control-Allow-Origin': '*'
            })

        else:
            return Response({
                'success': False
            }, headers={
                'Access-Control-Allow-Origin': '*'
            })
