import os

# Импорт роутеров тянет src.core.config и создание движка БД. Подключения при
# импорте нет, поэтому тестам хватает фиктивных значений; реальные переменные
# окружения (если заданы) не перетираем.
for key, value in {
    "DOMAIN": "localhost",
    "SECRET_KEY": "test",
    "DB_TYPE": "ASYNC_POSTGRESQL",
    "DB_NAME": "test",
    "DB_USER": "test",
    "DB_PASSWORD": "test",
    "DB_HOST": "localhost",
    "DB_PORT": "5432",
}.items():
    os.environ.setdefault(key, value)
