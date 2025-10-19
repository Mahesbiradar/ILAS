# backend/accounts/management/commands/fix_admin_roles.py

from django.core.management.base import BaseCommand
from accounts.models import User

class Command(BaseCommand):
    help = "Ensure all superusers/staff have role='admin' for ILAS system."

    def handle(self, *args, **options):
        updated_count = 0
        unchanged_count = 0

        # Find all staff or superusers
        admin_users = User.objects.filter(is_superuser=True) | User.objects.filter(is_staff=True)

        if not admin_users.exists():
            self.stdout.write(self.style.WARNING("⚠️  No admin or staff users found."))
            return

        for user in admin_users.distinct():
            if user.role != "admin":
                user.role = "admin"
                user.save(update_fields=["role"])
                updated_count += 1
                self.stdout.write(self.style.SUCCESS(f"✅ Updated: {user.username} → role='admin'"))
            else:
                unchanged_count += 1

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(f"🎯 Done! {updated_count} updated, {unchanged_count} already correct."))
