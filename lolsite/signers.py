from django.core.signing import Signer, TimestampSigner

ActivationSigner = TimestampSigner('email-activation-signer')
