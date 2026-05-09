from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

COURSE_CATALOG = [
    {
        "id": "cs101",
        "name": "Introduction to Computer Science",
        "department": "Computer Science",
        "topics": ["Programming fundamentals", "Data types", "Control structures", "Functions", "OOP basics"],
    },
    {
        "id": "cs201",
        "name": "Data Structures & Algorithms",
        "department": "Computer Science",
        "topics": ["Arrays", "Linked Lists", "Trees", "Graphs", "Sorting", "Dynamic Programming"],
    },
    {
        "id": "cs301",
        "name": "Operating Systems",
        "department": "Computer Science",
        "topics": ["Processes", "Threads", "Memory Management", "File Systems", "Scheduling"],
    },
    {
        "id": "math101",
        "name": "Calculus I",
        "department": "Mathematics",
        "topics": ["Limits", "Derivatives", "Integrals", "Applications of Derivatives"],
    },
    {
        "id": "math201",
        "name": "Linear Algebra",
        "department": "Mathematics",
        "topics": ["Vectors", "Matrices", "Eigenvalues", "Linear Transformations", "Vector Spaces"],
    },
    {
        "id": "math301",
        "name": "Probability & Statistics",
        "department": "Mathematics",
        "topics": ["Probability", "Distributions", "Hypothesis Testing", "Regression", "Bayesian Methods"],
    },
    {
        "id": "phys101",
        "name": "Physics I - Mechanics",
        "department": "Physics",
        "topics": ["Kinematics", "Newton's Laws", "Energy", "Momentum", "Rotational Motion"],
    },
    {
        "id": "phys201",
        "name": "Physics II - Electromagnetism",
        "department": "Physics",
        "topics": ["Electric Fields", "Magnetic Fields", "Circuits", "Maxwell's Equations"],
    },
    {
        "id": "chem101",
        "name": "General Chemistry",
        "department": "Chemistry",
        "topics": ["Atomic Structure", "Bonding", "Thermodynamics", "Equilibrium", "Acids & Bases"],
    },
    {
        "id": "bio101",
        "name": "Introduction to Biology",
        "department": "Biology",
        "topics": ["Cell Biology", "Genetics", "Evolution", "Ecology", "Molecular Biology"],
    },
    {
        "id": "econ101",
        "name": "Microeconomics",
        "department": "Economics",
        "topics": ["Supply & Demand", "Market Structures", "Consumer Theory", "Game Theory"],
    },
    {
        "id": "eng101",
        "name": "English Composition",
        "department": "English",
        "topics": ["Essay Writing", "Rhetoric", "Research Papers", "Critical Analysis"],
    },
]


@router.get("/courses")
async def list_courses(department: Optional[str] = None):
    courses = COURSE_CATALOG
    if department:
        courses = [c for c in courses if c["department"].lower() == department.lower()]
    return {"courses": courses}


@router.get("/courses/{course_id}")
async def get_course(course_id: str):
    for course in COURSE_CATALOG:
        if course["id"] == course_id:
            return course
    return {"error": "Course not found"}


@router.get("/departments")
async def list_departments():
    departments = sorted(set(c["department"] for c in COURSE_CATALOG))
    return {"departments": departments}
