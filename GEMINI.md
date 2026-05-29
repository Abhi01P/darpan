# DrapeNet

## Project Overview
DrapeNet is a sophisticated full-stack virtual try-on and styling platform that combines generative AI, multi-agent orchestration, and real-time 3D/AR capabilities.

### Architecture & Tech Stack
- **Backend**: FastAPI framework in Python.
- **Agent Orchestration**: LangGraph coordinates a multi-agent workflow (Gatekeeper, Stylist, Architect, and Artist) using Google Gemini/VertexAI and OpenAI models.
- **Asynchronous Processing**: Celery & Redis handle long-running ML tasks such as 3D mesh generation and 2D image diffusion to keep the main API responsive.
- **Frontend**: There are two frontend clients available: a Vite/React SPA (`drapenet_react/`) and a Next.js application (`web/`). The UI features a 3D digital twin using React Three Fiber and an AR Mirror implementing real-time skeletal tracking in the browser via MediaPipe.
- **Database**: MongoDB Atlas serves as both the primary transactional database and the vector store for clothing item RAG.
- **Machine Learning**: Leverages Google Vertex AI (Gemini) for NLP/Stylist capabilities, and utilizes local tools (PyTorch, Diffusers, Transformers) in the ML pipeline.

## Building and Running

The repository includes a master startup script that seamlessly brings up the entire ecosystem, including Docker infrastructure, the FastAPI backend, the Celery ML worker, and the React frontend.

### Prerequisites
- **Docker** (for MongoDB & Redis)
- **uv** (for fast Python package management)
- **Node.js** (v18+, for the frontend)

### Start the Ecosystem
Start all services (Docker, FastAPI, Celery, and Vite Frontend) simultaneously:
```bash
./start.sh
```

### Stop the Ecosystem
Shut down all processes gracefully and stop the Docker containers:
```bash
./start.sh stop
```

### Manual Service Execution
If you prefer to start services individually:
- **Infrastructure**: `docker compose up -d`
- **Backend API**: `uv run uvicorn app.main:app --reload`
- **Celery Worker**: `uv run celery -A app.core.celery_app worker --loglevel=info`
- **Frontend (Vite)**: `cd drapenet_react && npm run dev`
- **Frontend (Next.js)**: `cd web && npm run dev`

### Logging
When using `./start.sh`, logs are automatically routed to the `logs/` directory:
- Backend: `tail -f logs/backend.log`
- Celery: `tail -f logs/celery.log`
- Frontend: `tail -f logs/frontend.log`

## Development Conventions
- **Dependency Management**: Python dependencies are managed strictly via `uv` (referencing `pyproject.toml` and `uv.lock`). Frontends use standard `npm`.
- **Environment Configuration**: Set configurations in a `.env` file at the root. The application defaults fallback to settings defined in `app/core/config.py`.
- **Backend Structure**:
  - `app/api/`: FastAPI route definitions.
  - `app/services/agents/`: LangGraph node logic for intent detection, RAG, and tool execution.
  - `app/services/ml_pipeline.py`: Core machine learning integration logic.
  - `app/core/`: Settings, database, and security initializations.
  - `worker/`: Background Celery task definitions (`tasks.py`).
- **Frontend State Management**: Both frontends use `zustand` for managing client-side application state (e.g., `digitalTwinStore`, `wardrobeStore`).

## Backend Endpoints API Reference

All backend routes are hosted under the FastAPI instance (typically on `localhost:8000`).

### Authentication (`/api/v1/endpoints/auth.py`)
- **`POST /signup`**
  - **Description**: Registers a new user and initializes their Digital Twin.
  - **Inputs**: `UserCreate` object containing `email`, `name`, `password`, and optionally `gender`.
  - **Outputs**: `UserResponse` object containing `id`, `email`, `name`, `gender`, and the initialized `digital_twin`.
- **`POST /login`**
  - **Description**: Authenticates a user and generates an OAuth2/JWT token.
  - **Inputs**: Standard `OAuth2PasswordRequestForm` containing `username` (email) and `password`.
  - **Outputs**: `Token` object containing `access_token` and `token_type` (bearer).
- **`GET /me`**
  - **Description**: Returns details of the currently authenticated user.
  - **Inputs**: Depends on the current authenticated user session (Requires Auth).
  - **Outputs**: `UserResponse` details of the current user.

### Catalog (`/api/v1/endpoints/catalog.py`)
- **`GET /catalog`**
  - **Description**: Returns the curated system catalog of clothing items.
  - **Inputs**: `limit` (int, default=20) and `skip` (int, default=0).
  - **Outputs**: A list of `CatalogItemResponse` objects.
- **`POST /catalog/add`**
  - **Description**: Saves a new curated clothing item to the global system catalog.
  - **Inputs**: `CatalogItemCreate` object.
  - **Outputs**: The newly created `CatalogItemResponse`.

### Try-On & Workflow (`/api/v1/endpoints/tryon.py`)
- **`POST /process`**
  - **Description**: Initiates the DrapeNet workflow (Gatekeeper -> Stylist -> Architect -> Artist).
  - **Inputs**: `TryOnRequest` containing `user_image_url`, `garment_image_url`, `garment_page_url`, `user_gender`, `chat_history`, `disliked_items`, and `user_query`.
  - **Outputs**: `TryOnResponse` containing task IDs for async processing (`mesh_task_id`, `tryon_task_id`), `styling_advice`, and `recommended_items`.
- **`GET /tasks/{task_id}`**
  - **Description**: Checks the status of a Celery background task.
  - **Inputs**: `task_id` (string) in the URL path.
  - **Outputs**: JSON containing `task_id`, `status` (PENDING, STARTED, SUCCESS, FAILURE), and the `result`.

### Uploads (`/api/v1/endpoints/upload.py`)
- **`POST /` (Mounted under an upload route)**
  - **Description**: Accepts an image file, saves it locally to the `/uploads` directory, and returns its static URL.
  - **Inputs**: A multipart form containing a `file` (`UploadFile`).
  - **Outputs**: JSON with `status` and the static `url` to access the uploaded image.

### Wardrobe & Interactions (`/api/v1/endpoints/wardrobe.py`)
- **`GET /wardrobe`**
  - **Description**: Retrieves the logged-in user's private virtual closet.
  - **Inputs**: Depends on the current authenticated user (Requires Auth).
  - **Outputs**: `WardrobeResponse` containing a list of items.
- **`GET /wardrobe/dislikes`**
  - **Description**: Fetches the user's disliked items array to pass into the RAG state.
  - **Inputs**: Depends on the current authenticated user (Requires Auth).
  - **Outputs**: List of disliked `item_id` strings.
- **`POST /swipe`**
  - **Description**: Handles a Tinder-style swipe interaction on a recommended garment.
  - **Inputs**: `SwipeRequest` containing `item_id`, `action` ("like" or "dislike"), and optionally `title` and `image_url` (Requires Auth).
  - **Outputs**: JSON status and a success message. (Like saves to the wardrobe, Dislike saves to the user's dislike array).
- **`POST /wardrobe/add`**
  - **Description**: Manually appends an item to the user's wardrobe.
  - **Inputs**: `WardrobeItemCreate` object (Requires Auth).
  - **Outputs**: The newly created `WardrobeItemResponse` dict.
- **`POST /wardrobe/add-by-url`**
  - **Description**: Scrapes a provided e-commerce URL for a product image and title, and appends it to the user's wardrobe.
  - **Inputs**: `AddProductViaUrlRequest` containing a `url` (Requires Auth).
  - **Outputs**: The scraped and created `WardrobeItemResponse`.
- **`DELETE /wardrobe/{item_id}`**
  - **Description**: Removes a specific clothing item from the user's wardrobe.
  - **Inputs**: `item_id` (string) in the URL path (Requires Auth).
  - **Outputs**: 204 No Content.
