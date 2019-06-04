"""player/models.py

Model definitions for the player app.

"""
import uuid

from django.conf import settings
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.db import models
from django.utils import timezone

from match.models import Participant


def simplify(name):
    """Return the lowercase, no space version of a string.

    Parameters
    ----------
    name : str

    Returns
    -------
    str

    """
    return ''.join(name.split()).lower()


class Summoner(models.Model):
    user = models.ForeignKey(
        User,
        default=None,
        null=True,
        on_delete=models.SET_NULL,
        blank=True,
        related_name='summoners',
    )
    _id = models.CharField(max_length=128, default='', blank=True, unique=True, db_index=True)
    region = models.CharField(max_length=8, default='', blank=True, db_index=True)
    account_id = models.CharField(max_length=128, default='', blank=True, null=True, db_index=True)
    name = models.CharField(max_length=32, default='', blank=True, db_index=True)
    simple_name = models.CharField(max_length=32, default='', blank=True, db_index=True)
    profile_icon_id = models.IntegerField(default=0)
    puuid = models.CharField(max_length=256, default='', blank=True)
    revision_date = models.BigIntegerField(default=0, db_index=True)
    summoner_level = models.IntegerField(default=0, db_index=True)

    last_summoner_page_import = models.DateTimeField(null=True)
    created_date = models.DateTimeField(default=timezone.now, db_index=True)

    __original_account_id = None
    __original_name = None

    class Meta:
        unique_together = ('region', 'account_id', '_id')

    def __init__(self, *args, **kwargs):
        super(Summoner, self).__init__(*args, **kwargs)
        self.__original_account_id = self.account_id
        self.__original_name = self.name

    def __str__(self):
        return f'Summoner(name="{self.name}", region={self.region})'

    def save(self, *args, **kwargs):
        if self.name:
            self.simple_name = simplify(self.name)

        if self.name != self.__original_name and self.__original_name is not None:
            namechange = NameChange(summoner=self, old_name=self.__original_name)
            namechange.save()
            # query = Participant.objects.filter(current_account_id=self.account_id)
            # query.update(summoner_name=self.name)

        super(Summoner, self).save(*args, **kwargs)
        self.__original_name = self.name
        self.__original_account_id = self.account_id

    def get_newest_rank_checkpoint(self):
        """Retrieve the most recent checkpoint for the summoner.

        Returns
        -------
        RankCheckpoint or None

        """
        try:
            checkpoint = self.rankcheckpoints.all().order_by('-created_date')[0]
        except:
            checkpoint = None
        return checkpoint


class NameChange(models.Model):
    summoner = models.ForeignKey('Summoner', on_delete=models.CASCADE, related_name='namechanges')
    old_name = models.CharField(max_length=128, default='')
    created_date = models.DateTimeField(default=timezone.now, db_index=True)

    def __str__(self):
        return f'NameChange(old_name="{self.old_name}", new_name="{self.summoner.name}")'


class RankCheckpoint(models.Model):
    summoner = models.ForeignKey('Summoner', on_delete=models.CASCADE, related_name='rankcheckpoints')
    created_date = models.DateTimeField(default=timezone.now, db_index=True)


class RankPosition(models.Model):
    checkpoint = models.ForeignKey('RankCheckpoint', on_delete=models.CASCADE, related_name='positions')

    fresh_blood = models.BooleanField(default=False, blank=True)
    hot_streak = models.BooleanField(default=False, blank=True)
    inactive = models.BooleanField(default=False, blank=True)
    veteran = models.BooleanField(default=False, blank=True)
    league_points = models.IntegerField(default=0, null=True, blank=True)
    wins = models.IntegerField(default=0, blank=True)
    losses = models.IntegerField(default=0, blank=True)
    series_progress = models.CharField(max_length=16, default=None, null=True, blank=True)
    position = models.CharField(max_length=32, default='NONE', null=True, blank=True)
    queue_type = models.CharField(max_length=32, default='', blank=True)
    rank = models.CharField(max_length=32, default='', blank=True)
    tier = models.CharField(max_length=32, default='', blank=True)


class Custom(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    phone = models.CharField(max_length=20, default=None, null=True, blank=True)
    is_email_verified = models.BooleanField(default=False, db_index=True, blank=True)

    created_date = models.DateTimeField(default=timezone.now, db_index=True, blank=True)
    modified_date = models.DateTimeField(default=timezone.now, blank=True)

    def save(self, *args, **kwargs):
        # Always set modified_date on save().
        self.modified_date = timezone.now()
        super(Custom, self).save(*args, **kwargs)


class EmailVerification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    code = models.UUIDField(default=uuid.uuid4, blank=True, db_index=True)
    created_date = models.DateTimeField(default=timezone.now, db_index=True, blank=True)

    def save(self, *args, **kwargs):
        # send verification email for new EmailVerification models.
        if self.pk == None:
            self.send_verification_email()
        super(EmailVerification, self).save(*args, **kwargs)

    def get_verification_url(self):
        return f'{settings.BASE_URL}/verify/?code={self.code.hex}'

    def send_verification_email(self):
        subject = 'Verify Email'
        message = f'''
            Hi there, you sign up for an account on our league site.  Please go to the following 
            url to verify your account.

            {self.get_verification_url()}

            If you did not sign up for an account, please ignore this email.

            If you do not verify your email within 24 hours, your account will be deleted.
        '''
        html_message = f'''
            <div>
                Hi there, you signed up for an account on our league site at 
                {self.user.date_joined}.  Please click the link below to verify this email. 
            </div>
            <br>
            
            <div>
                <a href='{self.get_verification_url()}' >{self.get_verification_url()}</a>
            </div>
            <br>

            <div>
                If you did not sign up for an account, please ignore this email. 
                If you do not verify your email, your account will be deleted.
            </div>
        '''
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [self.user.email], html_message=html_message)
