from django.db import models


class User(models.Model):
    """
    Custom user model with email as username field
    """
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=50)

    first_name = models.CharField(max_length=40, blank=False)
    last_name = models.CharField(max_length=40, blank=False)

    def __unicode__(self):
        return self.email

    def get_full_name(self):
        return ' '.join([self.first_name, self.last_name])

    def get_short_name(self):
        return self.first_name


class Rating(models.Model):
    """
    Model for user ratings
    """
    user = models.ForeignKey(User)
    movie_id = models.IntegerField()
    score = models.IntegerField()


class Wish(models.Model):
    """
    Model for user ratings
    """
    user = models.ForeignKey(User)
    movie_id = models.IntegerField()
