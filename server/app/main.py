import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import init_db
from app.api import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize tables
    print(f"[{settings.APP_NAME}] Initializing database tables...")
    init_db()
    print(f"[{settings.APP_NAME}] Backend initialized successfully on port {settings.PORT}.")
    yield
    # Shutdown
    print(f"[{settings.APP_NAME}] Shutting down...")


app = FastAPI(
    title="College Information Assistant API",
    description="Full-stack AI-powered College Information Assistant using Retrieval-Augmented Generation (RAG).",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
origins = settings.cors_origin_list
if not origins:
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(round(process_time, 4))
    return response


# Include API Router
app.include_router(api_router)


@app.get("/")
def root():
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "docs_url": "/docs",
        "health_check": "/api/health",
        "version": "1.0.0"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=settings.DEBUG)
