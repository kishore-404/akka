import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

class Config:
    SECRET_KEY = 'your-secret-key-2024'
    SQLALCHEMY_DATABASE_URI = 'sqlite:///study_buddy.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False