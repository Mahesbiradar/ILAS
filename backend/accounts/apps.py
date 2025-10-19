from django.apps import AppConfig
from django.db.models.signals import post_migrate

def fix_admin_roles_post_migrate(sender, **kwargs):
    from accounts.models import User
    for user in User.objects.filter(is_superuser=True):
        if user.role != "admin":
            user.role = "admin"
            user.save(update_fields=["role"])

class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'accounts'

    def ready(self):
        post_migrate.connect(fix_admin_roles_post_migrate, sender=self)
