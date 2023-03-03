### iSee Core API
<a href="https://zenodo.org/badge/latestdoi/500399706"><img src="https://zenodo.org/badge/500399706.svg" alt="DOI"></a>

🚧 Under Construction 🚧

### Endpoints Available

#### Questionnaire

- Get All: `GET /questionnaire`
- Get One: `GET /questionnaire/:id`
- Create: `POST /questionnaire`
- Update: `PATCH /questionnaire/:id`
- Delete: `DELETE /questionnaire/:id`

#### Usecases

- Get All: `GET /usecases`
- Get One: `GET /usecases/:id`
- Create: `POST /usecases`
- Update Settings: `PATCH /usecases/:id/settings`
- Update Published State: `PATCH /usecases/:id/publish`
- Delete: `DELETE /usecases/:id`

#### Usecases => Personas

- Add New: `POST /usecases/:id/persona`
- Update: `PATCH /usecases/:id/persona/:personaId`
- Delete: `DELETE /usecases/:id/persona/:personaId`

#### Usecases => Personas => Intent

- Add New: `POST /usecases/:id/persona/:personaId/intent `
- Delete : `DELETE /usecases/:id/persona/:personaId/intent/:intentId `
- Update : `PATCH /usecases/:id/persona/:personaId/intent/:intentId `

#### Interactions

- Get All: `GET /interaction/`
- Add New: `POST /interaction/`

#### Stats

- Get Global Stats: `GET /stats/usecases/:id`
- Get Intent Stats: `GET /stats/usecases/:id/persona/:personaId/:intent/`

### Setup

```
npm install
```

Create a .env file and change the DB connection string as required

```
npm start
```

## Docker Setup

```
docker build -f Dockerfile.dev -t isee4xai/api:dev .

docker-compose  --file docker-compose.dev.yml up -d --build
```

