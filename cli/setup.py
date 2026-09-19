from setuptools import setup

setup(
    name="aravanta-cli",
    version="1.0.0",
    description="Aravanta Cloud OS — First-Class Cloud Computing Command-Line Interface",
    author="Aravanta Engineering",
    py_modules=["aravanta"],
    entry_points={
        "console_scripts": [
            "aravanta=aravanta:main",
        ],
    },
    python_requires=">=3.8",
)
