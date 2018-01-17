from __future__ import unicode_literals
import csv
from operator import itemgetter

from django.apps import AppConfig

# These variables will also be used by views
imdb_list = []
imdb_dict = {}

# These arrays will only be used by other functions
similarity_matrix = []
normalized_similarity_matrix = []

# These variables will be used for recommendations
neighbours_list = []
normalized_neighbours_list = []
max_neighbours = 15


class RecommenderConfig(AppConfig):
    name = 'recommender'

    def ready(self):
        print('loading movies details from file system...')
        load_movies_details()
        print('loading movie similarities from file system...')
        load_movie_vs_movie_similarity_matrix()
        print('creating movie neighbours lists...')
        create_movie_neighbours_list()
        print('Initialization complete.')


def load_movies_details():
    """
    returns a list of all the movies in imdb file
    """
    global imdb_list, imdb_dict
    imdb_list = []
    bad_rows = []
    reader = csv.DictReader(open('dataset/imdb.csv', 'rU'), dialect='excel')
    for row in reader:
        try:
            row['id'] = int(row['id'])
            row['Year'] = int(row['Year'])
            row['imdbRating'] = float(row['imdbRating'])
            row.pop('response', None)
        except ValueError:
            bad_rows.append(row)

        imdb_list.append(row)
        imdb_dict[row['id']] = row

    imdb_dict[0] = {}
    print 'total {} rows are bad'.format(len(bad_rows))


def load_movie_vs_movie_similarity_matrix():
    """
    Returns a movie*movie matrix of similarities
    [
        [0, 12.2, 193.44, ...],
        [...],
        .
        .
        .
    ]
    """
    global similarity_matrix, normalized_similarity_matrix

    min_sim = -121.5
    max_sim = 1929.0

    with open('dataset/similarity.txt') as f:
        data = f.readlines()

    for line in data:
        row = []
        norm_row = []
        line = line.split(' ')
        line = line[:-1]

        for sim in line:
            sim = float(sim)
            norm_sim = (sim - min_sim) / (max_sim - min_sim)
            row.append(sim)
            norm_row.append(norm_sim)

        similarity_matrix.append(row)
        normalized_similarity_matrix.append(norm_row)


def create_movie_neighbours_list():
    """
    Generates a list of given number of neighbours of all movies
    [
        [
            {
                'id': 45,
                'movie': Movie name,
                'similarity': 122.34
            },
            {
                'id': 44,
                'movie': Movie name,
                'similarity': 120.34
            }
            .
            .
            .
        ],
        .
        .
        .
    ]
    """
    global similarity_matrix, max_neighbours, neighbours_list, normalized_neighbours_list
    data = []
    normalized_data = []

    for z in range(len(similarity_matrix)):
        # For each movie in matrix, neighbours are initially empty

        movie_similarity = []
        neighbours = []
        normalized_neighbours = []

        # Copying the zth row in movie_similarity
        for k in similarity_matrix[z]:
            movie_similarity.append(k)

        for i in range(max_neighbours):
            # Find ith neighbour
            max_sim = 0
            max_sim_index = 0

            for j in range(len(movie_similarity)):
                if movie_similarity[j] > max_sim:
                    max_sim = movie_similarity[j]
                    max_sim_index = j

            movie_similarity[max_sim_index] = 0
            neighbours.append({
                'id': max_sim_index,
                'similarity': max_sim
            })
            normalized_neighbours.append({
                'id': max_sim_index,
                'normalized_similarity': (max_sim + 121.5) / (1929.0 + 121.5)
            })

        data.append(neighbours)
        normalized_data.append(normalized_neighbours)

    neighbours_list = data
    normalized_neighbours_list = normalized_data
    return data


def get_recommendations_for_this_watchlist(watchlist):
    """
    watchlist format -
    [
        {
            'movie_id': 12,
            'score': 3
        },
        .
        .
        .
    ]
    """
    recommendations = []
    for choice in watchlist:
        rating = float(choice['score']) / 5.0
        neighbours = normalized_neighbours_list[choice['movie_id']]

        for neighbour in neighbours:
            likelihood = rating * neighbour['normalized_similarity']
            found = filter(lambda recommendation: recommendation['id'] == neighbour['id'], recommendations)
            watched = filter(lambda movie: movie['movie_id'] == neighbour['id'], watchlist)

            if found and not watched:
                old_likelihood = found[0]['recommendation']
                found[0]['recommendation'] = likelihood + old_likelihood

            elif not watched:
                recommendations.append({
                    'id': neighbour['id'],
                    'recommendation': likelihood
                })
    recommendations = sorted(recommendations, key=itemgetter('recommendation'), reverse=True)
    return recommendations
