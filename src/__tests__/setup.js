// Variables d'environnement utilisées par les tests
process.env.JWT_SECRET = 'test_jwt_secret_min_32_chars_ok_here';
process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_fake_secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
