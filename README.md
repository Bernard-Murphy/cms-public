# Create Music Fast

### Requirements

- Mureka account with API access
- MongoDB
- Storj (s3 alternative)
- Venice AI account with API access

### Environment (.env)

STORJ_SECRET_ACCESS_ID
STORJ_SECRET_ACCESS_KEY
STORJ_ENDPOINT
BUCKET
REGION => i.e. "us-east-1"
VENICE_KEY => Venice API key
MUREKA_KEY => Mureka API key
SERVER_PORT => App will run on this port
MONGO_URL => Required if no MONGO_HOST, MONGO_PASSWORD, and MONGO_USER is supplied, i.e. "mongodb://127.0.0.1:27017"
MONGO_HOST => Required if no MONGO_URL supplied, i.e. "cluster0.lcsembg.mongodb.net"
MONGO_PASSWORD => Required if no MONGO_URL supplied
MONGO_USER => Required if no MONGO_URL supplied, i.e. "production"
COOKIE_SECRET
REACT_APP_API => String, URL of the backend app, i.e. "https://createmusicfast.com"
