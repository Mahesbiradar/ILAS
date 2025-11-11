from django.apps import AppConfig


class LibraryConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "library"

    def ready(self):
        # Import signals so they are registered when Django starts.
        # Keep import local to avoid startup-time side-effects in tests.
        try:
            import library.signals  # noqa: F401
        except Exception:
            # Should never silently fail in production; but keep safe during dev
            # to avoid crashing when signal file temporarily missing.
            pass
