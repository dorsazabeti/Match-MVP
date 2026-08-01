from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Match MVP Backend", version="1.0")

class UserProfileCreate(BaseModel):
    name: str
    role: str # "BUSINESS" or "PUBLISHER"
    city: str
    category: str

@app.get("/")
def read_root():
    return {"message": "Match MVP Python Backend is running!"}

@app.post("/api/profiles")
def create_profile(profile: UserProfileCreate):
    # اینجا در آینده داده‌ها در دیتابیس ذخیره می‌شوند
    return {
        "status": "success",
        "message": f"Profile for {profile.name} created successfully with role {profile.role}!",
        "data": profile
    }