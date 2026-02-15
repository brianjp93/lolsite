from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from player.models import Summoner, SummonerLink
from player.tasks import import_summoner

User = get_user_model()


class Command(BaseCommand):
    help = "Link a Summoner to a User using Riot ID and Email"

    def add_arguments(self, parser):
        parser.add_argument("riot_id", type=str, help="Riot ID in format Name#Tag")
        parser.add_argument("email", type=str, help="User email")
        parser.add_argument(
            "--region", type=str, default="na", help="Region (default: na)"
        )

    def handle(self, *args, **options):
        riot_id_full = options["riot_id"]
        email = options["email"]
        region = options["region"]

        if "#" not in riot_id_full:
            self.stdout.write(self.style.ERROR("Riot ID must be in format Name#Tag"))
            return

        name, tagline = riot_id_full.split("#", 1)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f"User with email {email} does not exist.")
            )
            return

        self.stdout.write(f"Importing summoner {name}#{tagline} in region {region}...")

        summoner_id = import_summoner(
            region=region, riot_id_name=name, riot_id_tagline=tagline
        )

        if not summoner_id:
            self.stdout.write(self.style.ERROR("Could not find or import summoner."))
            return

        summoner = Summoner.objects.get(id=summoner_id)
        self.stdout.write(self.style.SUCCESS(f"Found summoner: {summoner}"))

        # Create link
        link, created = SummonerLink.objects.get_or_create(
            user=user, summoner=summoner, defaults={"verified": True}
        )

        if not created:
            if not link.verified:
                link.verified = True
                link.save()
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Updated existing link to verified for {user.email} -> {summoner}"  # type: ignore
                    )
                )
            else:
                self.stdout.write(
                    self.style.WARNING(
                        f"Link already exists and is verified for {user.email} -> {summoner}"  # type: ignore
                    )
                )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Created new verified link for {user.email} -> {summoner}"  # type: ignore
                )
            )
