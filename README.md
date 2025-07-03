# EML Reader

Online tool to read and display the content of an EML file (email message).


## Building locally

## Development

Use this command to run the site locally for development:

```bash
docker compose watch
# or: docker compose up
```

Using `watch`, you'll benefit from file changes watching for sync & rebuild.

The site will be available at [http://localhost:8080](http://localhost:8080).

### Production

Use this command to run the site locally for production:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up
# or: docker compose -f docker-compose.yml up
```

The site will be available at [http://localhost:8080](http://localhost:8080).


## License

Copyright (c) 2024 Mathieu Guérin ([matiboux.me](https://matiboux.me))
