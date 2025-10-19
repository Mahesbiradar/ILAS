# backend/accounts/management/commands/list_users_by_role.py

from django.core.management.base import BaseCommand
from accounts.models import User
from django.db.models import Count

class Command(BaseCommand):
    help = "Display all users grouped by their roles (admin, librarian, user)."

    def handle(self, *args, **options):
        # Get all users grouped by role
        role_counts = User.objects.values("role").annotate(total=Count("id"))

        if not role_counts:
            self.stdout.write(self.style.WARNING("⚠️  No users found in the system."))
            return

        # Display summary
        self.stdout.write(self.style.SUCCESS("📊 User Role Summary"))
        self.stdout.write("-" * 35)
        for rc in role_counts:
            self.stdout.write(f"{rc['role'].capitalize():<12}: {rc['total']} users")
        self.stdout.write("-" * 35)

        # List users per role
        for role_name in ["admin", "librarian", "user"]:
            users = User.objects.filter(role=role_name)
            if not users.exists():
                continue

            self.stdout.write("")
            self.stdout.write(self.style.HTTP_INFO(f"👤 {role_name.capitalize()}s ({users.count()})"))
            for user in users:
                self.stdout.write(
                    f" - {user.username:15} | {user.email or 'no-email'} | Active: {user.is_active}"
                )
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("✅ Listing complete."))
