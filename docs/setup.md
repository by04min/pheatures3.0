# Project Setup

## Prerequisites
Before setting up the project, make sure you have the following installed!
- [Node.js](https://nodejs.org/) (version 18 or higher)
- required for the React + Vite frontend build tool

- [Python 3](https://www.python.org/) (version 3.9 or higher)
- required for the Flask backend

- [Git](https://git-scm.com/)
- used for version control (i.e. edit history!)

## Cloning the Repository
Use the following steps to clone the repo onto your local work station (i.e. have your own copy of the code, which can then update this repository through commits).

Highly recommend using GitHub Desktop to simplify a lot of Git-related actions (making commits, building on branches, etc.)

'''bash
git clone
cd pheatures3.0
'''

## Frontend Setup (Reacy + Vite)
The frontend is build with React, and uses Vite as the build tool.
Vite is just a modern, fast alternative to Create React App.

Make sure to `cd` into the frontend folder, which is where all the user interface code lives!
The application is intentionally separated into backend, database, frontend for easier maintenance/compartmentalization of code.

```bash
cd frontend
npm install
npm run dev
```

"npm run dev" is the command to run the user interface (web app) on your local device.
It'll likely say the frontend is running at `http://localhost:5173`.
Visit that link to see your local version of the app!

## Backend Setup (Flask + SQLite)

The backend is built with Flask, which is a Python web framework.
SQLite is used as a database (to store phonemes, rules, dependencies, etc.) and comes built into Python, so no additional installation is needed.

### Setting up the virtual environment

A virtual environment keeps the project's Python dependencies isolated from the rest of your computer system. (i.e. makes sure any versions of things in this app don't clash with existing versions downloaded on your computer)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
```

You'll know the virtual environment is active when you see `(venv)` at the 
start of your terminal prompt. You need to activate it every time you 
open a new terminal session to work on the backend.

### Installing dependencies 

The file "requirements.txt" contains the names and versions of any dependencies for this application. Run the command below to install them at once.

```bash
pip install -r requirements.txt
```

### Running the backend
To run the backend means to start the Flask development server, which listens for HTTP requests from the frontend and responds with data from the SQLite database. Again, make sure you have the virtual environment activated before running this!

```bash
python3 app.py
```
The backend will be running at `http://localhost:5000`, or something similar. You can verify it is working by visiting `http://localhost:5000/test` in your browser, which should 
return:

```json
{"message": "Flask is working!"}
```