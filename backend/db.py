import psycopg2

def get_connection():
    return psycopg2.connect(
        host="localhost",
        database="finance_db",
        user="postgres",
        password="Esah@201336",
        port="5432"
    )