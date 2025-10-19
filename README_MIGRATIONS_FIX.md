ILAS - Migrations Fix Instructions
==================================

Why:
----
A pre-existing SQLite database was included with this repo which causes migration inconsistencies when introducing a custom user model (accounts.User). To allow a clean local setup, delete the old database and create fresh migrations.

Steps to set up locally (Windows):

1. Ensure virtualenv activated and dependencies installed:
   pip install -r backend/requirements.txt
   (If requirements.txt missing, install django, djangorestframework, psycopg2-binary, djangorestframework-simplejwt, corsheaders)

2. Remove old sqlite DB (already removed in this archive). If you still have one:
   del backend\db.sqlite3

3. Make migrations and migrate in correct order:
   cd backend
   python manage.py makemigrations accounts
   python manage.py makemigrations library
   python manage.py makemigrations
   python manage.py migrate

4. Create superuser:
   python manage.py createsuperuser

5. Run server:
   python manage.py runserver

Notes:
- If you prefer PostgreSQL, update settings.py DATABASES and create the database first.
- After migration, the API endpoints will be available at /api/...
