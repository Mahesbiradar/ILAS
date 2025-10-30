{
"info": {
"\_postman_id": "ilas-api-collection",
"name": "ILAS API (Books & Borrow System)",
"schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
},
"item": [
{
"name": "1️⃣ Register (User/Admin)",
"request": {
"method": "POST",
"header": [
{
"key": "Content-Type",
"value": "application/json"
}
],
"body": {
"mode": "raw",
"raw": "{\n \"username\": \"rahul\",\n \"email\": \"rahul@gmail.com\",\n \"password\": \"rahul@123\",\n \"phone\": \"9876543210\",\n \"usn\": \"1DA23ET400\",\n \"role\": \"user\"\n}"
},
"url": {
"raw": "http://127.0.0.1:8000/api/auth/register/",
"protocol": "http",
"host": ["127.0.0.1"],
"port": "8000",
"path": ["api", "auth", "register", ""]
}
}
},
{
"name": "2️⃣ Login",
"request": {
"method": "POST",
"header": [
{ "key": "Content-Type", "value": "application/json" }
],
"body": {
"mode": "raw",
"raw": "{\n \"username\": \"rahul\",\n \"password\": \"rahul@123\"\n}"
},
"url": {
"raw": "http://127.0.0.1:8000/api/auth/login/",
"protocol": "http",
"host": ["127.0.0.1"],
"port": "8000",
"path": ["api", "auth", "login", ""]
}
}
},
{
"name": "3️⃣ Get All Books",
"request": {
"method": "GET",
"header": [
{ "key": "Authorization", "value": "Bearer {{access_token}}" }
],
"url": {
"raw": "http://127.0.0.1:8000/api/books/",
"protocol": "http",
"host": ["127.0.0.1"],
"port": "8000",
"path": ["api", "books", ""]
}
}
},
{
"name": "4️⃣ Add New Book (Admin)",
"request": {
"method": "POST",
"header": [
{ "key": "Content-Type", "value": "application/json" },
{ "key": "Authorization", "value": "Bearer {{access_token}}" }
],
"body": {
"mode": "raw",
"raw": "{\n \"title\": \"Data Science Essentials\",\n \"author\": \"Dr. A Sharma\",\n \"isbn\": \"9789388511710\",\n \"category\": \"Data Science\",\n \"quantity\": 3\n}"
},
"url": {
"raw": "http://127.0.0.1:8000/api/books/",
"protocol": "http",
"host": ["127.0.0.1"],
"port": "8000",
"path": ["api", "books", ""]
}
}
},
{
"name": "5️⃣ Borrow Book (User)",
"request": {
"method": "POST",
"header": [
{ "key": "Content-Type", "value": "application/json" },
{ "key": "Authorization", "value": "Bearer {{access_token}}" }
],
"body": {
"mode": "raw",
"raw": "{\n \"book_id\": 1\n}"
},
"url": {
"raw": "http://127.0.0.1:8000/api/borrow/",
"protocol": "http",
"host": ["127.0.0.1"],
"port": "8000",
"path": ["api", "borrow", ""]
}
}
},
{
"name": "6️⃣ Approve Borrow (Admin)",
"request": {
"method": "POST",
"header": [
{ "key": "Authorization", "value": "Bearer {{access_token}}" }
],
"url": {
"raw": "http://127.0.0.1:8000/api/borrow/1/approve/",
"protocol": "http",
"host": ["127.0.0.1"],
"port": "8000",
"path": ["api", "borrow", "1", "approve", ""]
}
}
},
{
"name": "7️⃣ Mark Returned (Admin)",
"request": {
"method": "POST",
"header": [
{ "key": "Authorization", "value": "Bearer {{access_token}}" }
],
"url": {
"raw": "http://127.0.0.1:8000/api/borrow/1/mark_returned/",
"protocol": "http",
"host": ["127.0.0.1"],
"port": "8000",
"path": ["api", "borrow", "1", "mark_returned", ""]
}
}
}
],
"variable": [
{
"key": "access_token",
"value": ""
}
]
}
